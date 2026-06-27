from fastapi import APIRouter, Depends, HTTPException
from models.session import SessionCreate, SessionInDB, SessionSubmit, AnswerKeySubmit
from models.user import PyObjectId
from middleware.auth_middleware import get_current_user_id
from main import app
from typing import List, Dict, Any
from pydantic import BaseModel
from services.scoring_service import calculate_score

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

class AnswerPatch(BaseModel):
    question_index: int
    answer: dict # {type, value}

@router.post("/create")
async def create_session(session: SessionCreate, user_id: PyObjectId = Depends(get_current_user_id)):
    session_db = SessionInDB(
        user_id=user_id,
        **session.dict(),
        answers=[None] * session.num_questions,
        question_types=["mcq"] * session.num_questions
    )
    result = await app.mongodb["sessions"].insert_one(session_db.dict(by_alias=True))
    return {"session_id": str(result.inserted_id)}

@router.get("")
async def get_sessions(limit: int = 10, user_id: PyObjectId = Depends(get_current_user_id)):
    cursor = app.mongodb["sessions"].find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    sessions = await cursor.to_list(length=limit)
    # Return formatted list
    return [{"id": str(s["_id"]), "exam_type": s["exam_type"], "score": s.get("score"), "created_at": s["created_at"], "mode": s.get("mode", "test"), "status": s.get("status", "in_progress")} for s in sessions]

@router.get("/{session_id}")
async def get_session(session_id: str, user_id: PyObjectId = Depends(get_current_user_id)):
    session = await app.mongodb["sessions"].find_one({"_id": PyObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    session["user_id"] = str(session["user_id"])
    session["pdf_id"] = str(session["pdf_id"])
    return session

@router.patch("/{session_id}/answer")
async def patch_answer(session_id: str, patch: AnswerPatch, user_id: PyObjectId = Depends(get_current_user_id)):
    # Simple array update via index
    result = await app.mongodb["sessions"].update_one(
        {"_id": PyObjectId(session_id), "user_id": user_id},
        {"$set": {f"answers.{patch.question_index}": patch.answer}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found or question index out of bounds")
    return {"status": "ok"}

@router.post("/{session_id}/submit")
async def submit_session(session_id: str, data: SessionSubmit, user_id: PyObjectId = Depends(get_current_user_id)):
    from datetime import datetime
    answers_dicts = [a.dict() if a else None for a in data.answers]
    update_data = {
        "status": "submitted",
        "answers": answers_dicts,
        "question_types": data.question_types,
        "time_taken_seconds": data.time_taken_seconds,
        "submitted_at": datetime.utcnow()
    }
    await app.mongodb["sessions"].update_one(
        {"_id": PyObjectId(session_id), "user_id": user_id},
        {"$set": update_data}
    )
    return {"status": "submitted"}

@router.post("/{session_id}/answer-key")
async def submit_answer_key(session_id: str, data: AnswerKeySubmit, user_id: PyObjectId = Depends(get_current_user_id)):
    session = await app.mongodb["sessions"].find_one({"_id": PyObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    correct_answers_dicts = [a.dict() if a else None for a in data.correct_answers]
    
    # Calculate score
    user_answers = session.get("answers", [])
    results = calculate_score(
        user_answers, 
        correct_answers_dicts, 
        session["marks_per_correct"], 
        session["negative_mark"]
    )
    
    await app.mongodb["sessions"].update_one(
        {"_id": PyObjectId(session_id)},
        {
            "$set": {
                "correct_answers": correct_answers_dicts,
                "status": "completed",
                "score": results["score"],
                "results": results
            }
        }
    )
    
    return {"results": results}
