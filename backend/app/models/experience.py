from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProjectItem(BaseModel):
    title: str
    description: str

# Request Models
class ExperienceCreate(BaseModel):
    company: str
    location: str
    position: str
    start_date: str
    end_date: str  # Can be "Present" or date
    projects: List[ProjectItem] = []

class ExperienceUpdate(BaseModel):
    company: Optional[str] = None
    location: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    projects: Optional[List[ProjectItem]] = None

# Response Models
class ExperienceResponse(BaseModel):
    id: str
    user_id: str
    company: str
    location: str
    position: str
    start_date: str
    end_date: str
    projects: List[ProjectItem] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

