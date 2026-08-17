from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
import random

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/topics/{session_id}")
async def analyze_topics(session_id: str, user_id: PyObjectId = Depends(get_current_user_id)):
    from bson import ObjectId
    session_q = {"$in": [session_id, ObjectId(session_id)]} if ObjectId.is_valid(session_id) else session_id
    session = await app.mongodb["sessions"].find_one({"_id": session_q, "user_id": user_id})
    if not session:
        rec = await app.mongodb["recommendations"].find_one({"session_id": session_q, "mentor_id": user_id})
        if rec:
            session = await app.mongodb["sessions"].find_one({"_id": session_q})
            
    if not session:
        raise HTTPException(status_code=404)
        
    # Simulate an AI extracting topics from PDF via GPT-4o
    topics = [
        {"name": "Mechanics", "count": 25, "section": "Physics"},
        {"name": "Electromagnetism", "count": 15, "section": "Physics"},
        {"name": "Organic Chemistry", "count": 18, "section": "Chemistry"},
        {"name": "Inorganic Chemistry", "count": 12, "section": "Chemistry"},
        {"name": "Calculus", "count": 20, "section": "Mathematics"},
        {"name": "Algebra", "count": 10, "section": "Mathematics"}
    ]
    
    return {"topics": topics}
