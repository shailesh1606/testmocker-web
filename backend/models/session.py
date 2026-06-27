from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Union, Any
from .user import PyObjectId
from bson import ObjectId

class AnswerItem(BaseModel):
    type: str  # mcq | numeric | text
    value: Union[str, int, float, None]

class SessionCreate(BaseModel):
    pdf_id: PyObjectId
    exam_type: str
    num_questions: int
    time_limit_seconds: int
    marks_per_correct: float
    negative_mark: float
    mode: str # test | learning

    model_config = {
        "arbitrary_types_allowed": True
    }

class SessionSubmit(BaseModel):
    answers: List[Optional[AnswerItem]]
    question_types: List[str]
    time_taken_seconds: int

class AnswerKeySubmit(BaseModel):
    correct_answers: List[Optional[AnswerItem]]

class SessionInDB(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: PyObjectId
    pdf_id: PyObjectId
    exam_type: str
    num_questions: int
    time_limit_seconds: int
    marks_per_correct: float
    negative_mark: float
    mode: str # test | learning
    question_types: List[str] = []
    answers: List[Optional[dict]] = []
    correct_answers: List[Optional[dict]] = []
    status: str = "in_progress" # in_progress | submitted | completed
    hints_used: Dict[str, int] = {} # { "0": 1 }
    time_taken_seconds: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    results: Optional[Dict[str, Any]] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
