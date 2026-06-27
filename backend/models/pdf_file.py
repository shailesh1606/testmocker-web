from pydantic import BaseModel, Field
from datetime import datetime
from .user import PyObjectId
from bson import ObjectId

class PDFFileInDB(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: PyObjectId
    original_filename: str
    storage_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
