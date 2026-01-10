from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

# Request Models
class ProjectCreate(BaseModel):
    name: str
    start_date: str
    end_date: str  # Can be "Present" or date
    tech_stack: str
    link: Optional[str] = None
    link_label: Optional[str] = None  # e.g., "GitHub", "GitLab", "Live Demo", etc.
    subpoints: List[str] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tech_stack: Optional[str] = None
    link: Optional[str] = None
    link_label: Optional[str] = None
    subpoints: Optional[List[str]] = None

# Response Models
class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    start_date: str
    end_date: str
    tech_stack: str
    link: Optional[str] = None
    link_label: Optional[str] = None
    subpoints: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

