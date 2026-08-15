from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/mentors", tags=["mentors"])

class MentorTestCreate(BaseModel):
    title: str
    exam_type: str
    num_questions: int
    time_limit_seconds: int
    marks_per_correct: float
    negative_mark: float
    pdf_id: str
    answer_key_pdf_id: Optional[str] = None

class RecommendRequest(BaseModel):
    test_id: str
    student_id: str

async def require_mentor(user_id: PyObjectId):
    user = await app.mongodb["users"].find_one({"_id": user_id})
    if not user or user.get("role", "STUDENT") != "MENTOR":
        raise HTTPException(status_code=403, detail="Only mentors can access this functionality")

@router.get("/students/{query}")
async def get_student(query: str, user_id: PyObjectId = Depends(get_current_user_id)):
    await require_mentor(user_id)
    
    student_doc = None
    if ObjectId.is_valid(query):
        student_doc = await app.mongodb["users"].find_one({
            "_id": {"$in": [query, ObjectId(query)]},
            "role": "STUDENT"
        })
    
    if not student_doc:
        student_doc = await app.mongodb["users"].find_one({"email": query, "role": "STUDENT"})
        
    if not student_doc:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return {
        "id": str(student_doc["_id"]),
        "name": student_doc["name"],
        "email": student_doc["email"]
    }

@router.post("/tests/create")
async def create_mentor_test(data: MentorTestCreate, user_id: PyObjectId = Depends(get_current_user_id)):
    await require_mentor(user_id)
    
    correct_answers = []
    if data.answer_key_pdf_id:
        import random
        for _ in range(data.num_questions):
            correct_answers.append({"type": "mcq", "value": random.choice(["A", "B", "C", "D"])})
            
    test_db = {
        "mentor_id": user_id,
        "title": data.title,
        "exam_type": data.exam_type,
        "num_questions": data.num_questions,
        "time_limit_seconds": data.time_limit_seconds,
        "marks_per_correct": data.marks_per_correct,
        "negative_mark": data.negative_mark,
        "pdf_id": PyObjectId(data.pdf_id),
        "answer_key_pdf_id": PyObjectId(data.answer_key_pdf_id) if data.answer_key_pdf_id else None,
        "correct_answers": correct_answers,
        "created_at": datetime.utcnow()
    }
    
    result = await app.mongodb["mentor_tests"].insert_one(test_db)
    return {"test_id": str(result.inserted_id)}

@router.post("/recommend")
async def recommend_test(data: RecommendRequest, user_id: PyObjectId = Depends(get_current_user_id)):
    await require_mentor(user_id)
    
    student_q = {"$in": [data.student_id, ObjectId(data.student_id)]} if ObjectId.is_valid(data.student_id) else data.student_id
    student = await app.mongodb["users"].find_one({"_id": student_q, "role": "STUDENT"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    test_q = {"$in": [data.test_id, ObjectId(data.test_id)]} if ObjectId.is_valid(data.test_id) else data.test_id
    test = await app.mongodb["mentor_tests"].find_one({"_id": test_q})
    if not test:
        raise HTTPException(status_code=404, detail="Test template not found")
        
    rec_db = {
        "test_id": PyObjectId(data.test_id),
        "student_id": PyObjectId(data.student_id),
        "mentor_id": user_id,
        "date_recommended": datetime.utcnow(),
        "status": "pending",
        "session_id": None
    }
    
    await app.mongodb["recommendations"].insert_one(rec_db)
    return {"status": "ok"}

@router.get("/assignments")
async def get_assignments(user_id: PyObjectId = Depends(get_current_user_id)):
    await require_mentor(user_id)
    
    cursor = app.mongodb["recommendations"].find({"mentor_id": user_id})
    recs = await cursor.to_list(length=100)
    
    result = []
    for r in recs:
        student_id_str = str(r["student_id"])
        student_q = {"$in": [student_id_str, ObjectId(student_id_str)]} if ObjectId.is_valid(student_id_str) else student_id_str
        student = await app.mongodb["users"].find_one({"_id": student_q})
        
        test_id_str = str(r["test_id"])
        test_q = {"$in": [test_id_str, ObjectId(test_id_str)]} if ObjectId.is_valid(test_id_str) else test_id_str
        test = await app.mongodb["mentor_tests"].find_one({"_id": test_q})
        
        if student and test:
            result.append({
                "id": str(r["_id"]),
                "student_name": student["name"],
                "student_email": student["email"],
                "student_id": str(student["_id"]),
                "test_title": test["title"],
                "exam_type": test["exam_type"],
                "date_recommended": r["date_recommended"],
                "status": r["status"]
            })
            
    return result
