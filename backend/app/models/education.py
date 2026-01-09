from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Request Models
class EducationCreate(BaseModel):
    institution: str
    location: str
    degree: str
    gpa: Optional[float] = None
    max_gpa: Optional[float] = None
    start_date: str
    end_date: str  # Can be "Present" or date
    courses: Optional[List[str]] = None

class EducationUpdate(BaseModel):
    institution: Optional[str] = None
    location: Optional[str] = None
    degree: Optional[str] = None
    gpa: Optional[float] = None
    max_gpa: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    courses: Optional[List[str]] = None

# Response Models
class EducationResponse(BaseModel):
    id: str
    user_id: str
    institution: str
    location: str
    degree: str
    gpa: Optional[float] = None
    max_gpa: Optional[float] = None
    start_date: str
    end_date: str
    courses: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

