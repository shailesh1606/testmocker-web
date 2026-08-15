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
        
    qp_doc = await app.mongodb["pdf_files"].find_one({"_id": qp_pdf_id})
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
        extracted = await extract_answers_from_pdf(qp_path, ak_path, num_questions)
        return {"answers": extracted}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Answer extraction failed: {str(e)}")
