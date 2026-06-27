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
    question_text: str = ""
    options: list = []

@router.post("")
async def get_hint(request: HintRequest, user_id: PyObjectId = Depends(get_current_user_id)):
    session = await app.mongodb["sessions"].find_one({"_id": PyObjectId(request.session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    hints_used = session.get("hints_used", {})
    idx_str = str(request.question_index)
    hints_used[idx_str] = hints_used.get(idx_str, 0) + 1
    
    await app.mongodb["sessions"].update_one(
        {"_id": session["_id"]},
        {"$set": {"hints_used": hints_used}}
    )
    
    # Mocking real OpenAI call or perform if real key
    if settings.openai_api_key and settings.openai_api_key != "dummy_key":
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert tutor. Give a concise pedagogical hint (max 4 sentences) without revealing the answer."},
                    {"role": "user", "content": request.question_text if request.question_text else f"Hint for question {request.question_index + 1}"}
                ]
            )
            hint_text = response.choices[0].message.content
        except Exception as e:
            hint_text = f"Here is a generic pedagogic hint for question {request.question_index + 1}. Try breaking the problem down into smaller steps."
    else:
        hint_text = f"This is an AI generated hint for Question {request.question_index + 1}. Review the formula for energy conservation and apply it cautiously."

    return {"hint": hint_text}
