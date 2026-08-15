from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from .user import PyObjectId
from bson import ObjectId

class RecommendationInDB(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    test_id: PyObjectId
    student_id: PyObjectId
    mentor_id: PyObjectId
    date_recommended: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending | attempted | completed
    session_id: Optional[PyObjectId] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
