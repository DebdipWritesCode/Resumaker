from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Request Models
class CertificationCreate(BaseModel):
    title: str
    start_date: str
    end_date: str  # Can be "Present" or date
    instructor: Optional[str] = None
    platform: str
    certification_link: Optional[str] = None

class CertificationUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    instructor: Optional[str] = None
    set_instructor: Optional[bool] = None
    platform: Optional[str] = None
    certification_link: Optional[str] = None
    set_certification_link: Optional[bool] = None

# Response Models
class CertificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    start_date: str
    end_date: str
    instructor: Optional[str] = None
    platform: str
    certification_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

