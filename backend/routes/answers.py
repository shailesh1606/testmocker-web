from fastapi import APIRouter, Depends, HTTPException
from middleware.auth_middleware import get_current_user_id
from models.user import PyObjectId
from main import app
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from services.extraction_service import extract_answers_from_pdf

router = APIRouter(prefix="/api/answers", tags=["answers"])

class ExtractSessionRequest(BaseModel):
    answer_key_pdf_id: Optional[str] = None

@router.post("/extract/{session_id}")
async def auto_extract_answer_key(
    session_id: str,
    data: ExtractSessionRequest,
    user_id: PyObjectId = Depends(get_current_user_id)
):
    session_q = {"$in": [session_id, ObjectId(session_id)]} if ObjectId.is_valid(session_id) else session_id
    session = await app.mongodb["sessions"].find_one({"_id": session_q, "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    num_questions = session["num_questions"]
    
    # Get Question Paper PDF Storage Path
    qp_pdf_id = session.get("pdf_id")
    if not qp_pdf_id:
        raise HTTPException(status_code=400, detail="No question paper PDF linked to this session")
        
    qp_pdf_id_str = str(qp_pdf_id)
    qp_pdf_q = {"$in": [qp_pdf_id_str, ObjectId(qp_pdf_id_str)]} if ObjectId.is_valid(qp_pdf_id_str) else qp_pdf_id
    qp_doc = await app.mongodb["pdf_files"].find_one({"_id": qp_pdf_q})
    if not qp_doc:
        raise HTTPException(status_code=404, detail="Question paper PDF metadata not found")
    qp_path = qp_doc["storage_path"]
    
    # Get Optional Answer Key PDF Storage Path
    ak_path = None
    if data.answer_key_pdf_id:
        ak_pdf_q = {"$in": [data.answer_key_pdf_id, ObjectId(data.answer_key_pdf_id)]} if ObjectId.is_valid(data.answer_key_pdf_id) else data.answer_key_pdf_id
        ak_doc = await app.mongodb["pdf_files"].find_one({"_id": ak_pdf_q})
        if not ak_doc:
            raise HTTPException(status_code=404, detail="Answer key PDF metadata not found")
        ak_path = ak_doc["storage_path"]
        
    try:
        extracted, option_format = await extract_answers_from_pdf(qp_path, ak_path, num_questions, user_id=str(user_id))
        
        # Calculate topic distribution
        topic_distribution = []
        try:
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
        except Exception as e:
            print(f"Error classifying topics: {e}")
            topic_distribution = [{"topic": "Other", "question_count": num_questions}]

        await app.mongodb["sessions"].update_one(
            {"_id": session_q, "user_id": user_id},
            {"$set": {
                "option_format": option_format,
                "topic_distribution": topic_distribution
            }}
        )
        return {"answers": extracted, "option_format": option_format}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Answer extraction failed: {str(e)}")
