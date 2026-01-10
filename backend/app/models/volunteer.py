from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Request Models
class VolunteerCreate(BaseModel):
    position: str
    organization: str
    location: str
    description: str
    start_date: str
    end_date: str  # Can be "Present" or date

class VolunteerUpdate(BaseModel):
    position: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

# Response Models
class VolunteerResponse(BaseModel):
    id: str
    user_id: str
    position: str
    organization: str
    location: str
    description: str
    start_date: str
    end_date: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

