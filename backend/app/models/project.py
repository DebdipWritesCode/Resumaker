from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

# Request Models
class ProjectCreate(BaseModel):
    name: str
    date_range: str
    tech_stack: str
    github_link: Optional[str] = None
    subpoints: List[str] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    date_range: Optional[str] = None
    tech_stack: Optional[str] = None
    github_link: Optional[str] = None
    subpoints: Optional[List[str]] = None

# Response Models
class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    date_range: str
    tech_stack: str
    github_link: Optional[str] = None
    subpoints: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

