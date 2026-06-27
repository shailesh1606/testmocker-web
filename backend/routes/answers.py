from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
import openai
from config import settings

openai.api_key = settings.openai_api_key
router = APIRouter(prefix="/api/answers", tags=["answers"])

@router.post("/extract/{session_id}")
async def auto_extract_answer_key(session_id: str, user_id: PyObjectId = Depends(get_current_user_id)):
    session = await app.mongodb["sessions"].find_one({"_id": PyObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404)
        
    num_questions = session["num_questions"]
    
    # Simple hardcoded mock logic to simulate AI parsing of an answer key.
    # In real app: Use PyMuPDF to render images, send to GPT-4o Vision.
    extracted = []
    import random
    for i in range(num_questions):
        extracted.append({"type": "mcq", "value": random.choice(["A", "B", "C", "D"])})
        
    return {"answers": extracted}
