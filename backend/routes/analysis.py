import asyncio
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
import random

router = APIRouter(prefix="/api/analysis", tags=["analysis"])
classification_lock = asyncio.Lock()

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
    
    if not topic_distribution:
        async with classification_lock:
            # Re-fetch session under lock to check if another concurrent request already wrote it
            session = await app.mongodb["sessions"].find_one({"_id": session_q})
            topic_distribution = session.get("topic_distribution", [])
            
            if not topic_distribution:
                try:
                    qp_pdf_id = session.get("pdf_id")
                    if qp_pdf_id:
                        qp_pdf_id_str = str(qp_pdf_id)
                        qp_pdf_q = {"$in": [qp_pdf_id_str, ObjectId(qp_pdf_id_str)]} if ObjectId.is_valid(qp_pdf_id_str) else qp_pdf_id
                        qp_doc = await app.mongodb["pdf_files"].find_one({"_id": qp_pdf_q})
                        if qp_doc:
                            qp_path = qp_doc["storage_path"]
                            
                            from services.extraction_service import run_openai_topics, render_pdf_to_images, extract_text_from_pdf, is_meaningful_text
                            qp_text = extract_text_from_pdf(qp_path)
                            qp_is_meaningful = is_meaningful_text(qp_text)
                            qp_images = None
                            if not qp_is_meaningful:
                                qp_images = render_pdf_to_images(qp_path)
                                
                            user_api_key = None
                            user_doc = await app.mongodb["users"].find_one({"_id": user_id})
                            if user_doc:
                                encrypted_key = user_doc.get("openai_api_key")
                                if encrypted_key:
                                    from services.crypto_service import decrypt_api_key
                                    user_api_key = decrypt_api_key(encrypted_key)
                                    
                            num_questions = session.get("num_questions", 75)
                            result_json = await run_openai_topics(
                                qp_text=qp_text if qp_is_meaningful else None,
                                exam_type=session.get("exam_type", "Custom"),
                                num_questions=num_questions,
                                qp_images=qp_images,
                                api_key=user_api_key
                            )
                            raw_distribution = result_json.get("topic_distribution", [])
                            
                            total_classified = sum(item.get("question_count", 0) for item in raw_distribution)
                            if total_classified != num_questions:
                                diff = num_questions - total_classified
                                other_item = next((item for item in raw_distribution if item.get("topic") == "Other"), None)
                                if other_item:
                                    other_item["question_count"] = max(0, other_item.get("question_count", 0) + diff)
                                else:
                                    raw_distribution.append({"topic": "Other", "question_count": max(0, diff)})
                            
                            topic_distribution = [item for item in raw_distribution if item.get("question_count", 0) > 0]
                            
                            # Store valid topic distribution in the database
                            await app.mongodb["sessions"].update_one(
                                {"_id": session_q},
                                {"$set": {"topic_distribution": topic_distribution}}
                            )
                except Exception as e:
                    print(f"Error generating on-demand topic distribution: {e}")
                    # Fallback to Other matching num_questions but do NOT save to database
                    num_questions = session.get("num_questions", 75)
                    topic_distribution = [{"topic": "Other", "question_count": num_questions}]

    topics = []
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
