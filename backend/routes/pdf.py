from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from models.user import PyObjectId
from models.pdf_file import PDFFileInDB
from middleware.auth_middleware import get_current_user_id
import uuid
import os
from config import settings
from main import app

router = APIRouter(prefix="/api/pdf", tags=["pdf"])

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), user_id: PyObjectId = Depends(get_current_user_id)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Ensure file is a pdf")
    
    file_id = str(uuid.uuid4())
    storage_path = os.path.join(settings.pdf_storage_path, f"{file_id}.pdf")
    
    with open(storage_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    pdf_doc = PDFFileInDB(
        user_id=user_id,
        original_filename=file.filename,
        storage_path=storage_path
    )
    result = await app.mongodb["pdf_files"].insert_one(pdf_doc.dict(by_alias=True))
    
    return {"pdf_id": str(result.inserted_id)}

@router.get("/{pdf_id}")
async def get_pdf(pdf_id: str):
    try:
        pdf_doc = await app.mongodb["pdf_files"].find_one({"_id": PyObjectId(pdf_id)})
        if not pdf_doc:
            raise HTTPException(status_code=404, detail="PDF not found")
        return FileResponse(pdf_doc["storage_path"], media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Invalid PDF ID")
