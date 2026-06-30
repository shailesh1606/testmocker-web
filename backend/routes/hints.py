from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
from pydantic import BaseModel
import openai
from config import settings

openai.api_key = settings.openai_api_key

router = APIRouter(prefix="/api/hints", tags=["hints"])

class HintRequest(BaseModel):
    session_id: str
    question_index: int
    image_base64: str  # raw base64 PNG, no data URI prefix expected, or strip it server-side

@router.post("")
async def get_hint(request: HintRequest, user_id: PyObjectId = Depends(get_current_user_id)):
    session = await app.mongodb["sessions"].find_one(
        {"_id": PyObjectId(request.session_id), "user_id": user_id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not request.image_base64 or not request.image_base64.strip():
        raise HTTPException(status_code=400, detail="No image region provided")

    # Strip data URI prefix if present (e.g. "data:image/png;base64,")
    img_data = request.image_base64
    if "," in img_data[:50]:
        img_data = img_data.split(",", 1)[1]

    if not settings.openai_api_key or settings.openai_api_key == "dummy_key":
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert tutor. The user has shared a cropped image of a "
                        "question (and its options, if MCQ) from a competitive exam paper. "
                        "Give a concise pedagogical hint (max 4 sentences) that helps the "
                        "student approach the problem. Do NOT reveal the final answer or "
                        "state which option is correct."
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Give me a hint for this question, without revealing the answer."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_data}"}}
                    ]
                }
            ],
            max_tokens=200,
            temperature=0.3
        )
        hint_text = response.choices[0].message.content.strip()
        if not hint_text:
            raise HTTPException(status_code=502, detail="Empty hint returned from OpenAI")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to generate hint: {str(e)}")

    # Track hint usage count per question (unchanged from before)
    hints_used = session.get("hints_used", {})
    idx_str = str(request.question_index)
    hints_used[idx_str] = hints_used.get(idx_str, 0) + 1

    await app.mongodb["sessions"].update_one(
        {"_id": session["_id"]},
        {"$set": {"hints_used": hints_used}}
    )

    return {"hint": hint_text}
