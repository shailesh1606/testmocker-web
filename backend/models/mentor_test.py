from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from .user import PyObjectId
from bson import ObjectId

class MentorTestInDB(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    mentor_id: PyObjectId
    title: str
    exam_type: str
    num_questions: int
    time_limit_seconds: int
    marks_per_correct: float
    negative_mark: float
    pdf_id: PyObjectId
    answer_key_pdf_id: Optional[PyObjectId] = None
    correct_answers: List[Optional[dict]] = []
    option_format: str = "ABCD"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
