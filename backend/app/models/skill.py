from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Request Models
class SkillCreate(BaseModel):
    category: str  # "Languages", "Frameworks", "Tools", "Soft Skills"
    items: List[str]

class SkillUpdate(BaseModel):
    category: Optional[str] = None
    items: Optional[List[str]] = None

# Response Models
class SkillResponse(BaseModel):
    id: str
    user_id: str
    category: str
    items: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

