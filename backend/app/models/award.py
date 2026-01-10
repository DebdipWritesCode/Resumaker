from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Request Models
class AwardCreate(BaseModel):
    title: str
    date: str # Can be month and year eg "Jan 2025"

class AwardUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None

# Response Models
class AwardResponse(BaseModel):
    id: str
    user_id: str
    title: str
    date: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

