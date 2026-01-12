from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Request Models
class SkillCreate(BaseModel):
    category: str  # "Languages", "Frameworks", "Tools", "Soft Skills"
    items: List[str]
    notes: Optional[str] = None

class SkillUpdate(BaseModel):
    category: Optional[str] = None
    items: Optional[List[str]] = None
    notes: Optional[str] = None
    set_notes: Optional[bool] = None

# Response Models
class SkillResponse(BaseModel):
    id: str
    user_id: str
    category: str
    items: List[str]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

