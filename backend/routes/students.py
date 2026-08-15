from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/students", tags=["students"])

async def require_student(user_id: PyObjectId):
    user = await app.mongodb["users"].find_one({"_id": user_id})
    if not user or user.get("role", "STUDENT") != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can access this functionality")

@router.get("/recommendations")
async def get_recommendations(user_id: PyObjectId = Depends(get_current_user_id)):
    await require_student(user_id)
    
    cursor = app.mongodb["recommendations"].find({"student_id": user_id})
    recs = await cursor.to_list(length=100)
    
    result = []
    for r in recs:
        mentor_id_str = str(r["mentor_id"])
        mentor_q = {"$in": [mentor_id_str, ObjectId(mentor_id_str)]} if ObjectId.is_valid(mentor_id_str) else mentor_id_str
        mentor = await app.mongodb["users"].find_one({"_id": mentor_q})
        
        test_id_str = str(r["test_id"])
        test_q = {"$in": [test_id_str, ObjectId(test_id_str)]} if ObjectId.is_valid(test_id_str) else test_id_str
        test = await app.mongodb["mentor_tests"].find_one({"_id": test_q})
        
        if mentor and test:
            result.append({
                "id": str(r["_id"]),
                "test_id": str(test["_id"]),
                "test_title": test["title"],
                "exam_type": test["exam_type"],
                "num_questions": test["num_questions"],
                "time_limit_seconds": test["time_limit_seconds"],
                "mentor_name": mentor["name"],
                "mentor_email": mentor["email"],
                "date_recommended": r["date_recommended"],
                "status": r["status"],
                "session_id": str(r["session_id"]) if r.get("session_id") else None
            })
            
    return result

@router.post("/recommendations/{rec_id}/start")
async def start_recommendation(rec_id: str, user_id: PyObjectId = Depends(get_current_user_id)):
    await require_student(user_id)
    
    rec_q = {"$in": [rec_id, ObjectId(rec_id)]} if ObjectId.is_valid(rec_id) else rec_id
    rec = await app.mongodb["recommendations"].find_one({"_id": rec_q, "student_id": user_id})
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    if rec.get("session_id"):
        return {"session_id": str(rec["session_id"])}
        
    test_id_str = str(rec["test_id"])
    test_q = {"$in": [test_id_str, ObjectId(test_id_str)]} if ObjectId.is_valid(test_id_str) else test_id_str
    test = await app.mongodb["mentor_tests"].find_one({"_id": test_q})
    if not test:
        raise HTTPException(status_code=404, detail="Assigned test template not found")
        
    session_db = {
        "user_id": user_id,
        "pdf_id": test["pdf_id"],
        "exam_type": test["exam_type"],
        "num_questions": test["num_questions"],
        "time_limit_seconds": test["time_limit_seconds"],
        "marks_per_correct": test["marks_per_correct"],
        "negative_mark": test["negative_mark"],
        "mode": "test",
        "question_types": ["mcq"] * test["num_questions"],
        "answers": [None] * test["num_questions"],
        "correct_answers": test.get("correct_answers", []),
        "status": "in_progress",
        "hints_used": {},
        "time_per_question": [],
        "created_at": datetime.utcnow()
    }
    
    session_result = await app.mongodb["sessions"].insert_one(session_db)
    session_id = session_result.inserted_id
    
    await app.mongodb["recommendations"].update_one(
        {"_id": rec_q},
        {"$set": {"status": "attempted", "session_id": session_id}}
    )
    
    return {"session_id": str(session_id)}
