from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Request Models
class CertificationCreate(BaseModel):
    title: str
    date_range: str
    instructor: Optional[str] = None
    platform: str
    certification_link: Optional[str] = None

class CertificationUpdate(BaseModel):
    title: Optional[str] = None
    date_range: Optional[str] = None
    instructor: Optional[str] = None
    platform: Optional[str] = None
    certification_link: Optional[str] = None

# Response Models
class CertificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    date_range: str
    instructor: Optional[str] = None
    platform: str
    certification_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

