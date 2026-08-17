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
        
    topic_distribution = session.get("topic_distribution", [])
    topics = []
    
    if not topic_distribution:
        # Fallback to Other matching num_questions for legacy tests
        num_questions = session.get("num_questions", 75)
        topics = [{"name": "Other", "count": num_questions, "section": "Other"}]
    else:
        for item in topic_distribution:
            topic_name = item.get("topic", "Other")
            q_count = item.get("question_count", 0)
            
            # Determine section based on fixed rules
            section = "Other"
            t_lower = topic_name.lower()
            
            if t_lower in ["algebra", "calculus", "coordinate geometry", "trigonometry & vectors"]:
                section = "Mathematics"
            elif t_lower in ["mechanics", "electrodynamics", "modern physics & optics", "thermodynamics & waves", "thermodynamics & modern physics"]:
                section = "Physics"
            elif t_lower in ["physical chemistry", "organic chemistry", "inorganic chemistry"]:
                section = "Chemistry"
            elif t_lower in ["cell biology", "plant physiology", "plant diversity & reproduction", "genetics & evolution", "human physiology", "human health & disease", "animal diversity & ecology"]:
                section = "Biology"
                
            topics.append({
                "name": topic_name,
                "count": q_count,
                "section": section
            })
            
    return {"topics": topics}
