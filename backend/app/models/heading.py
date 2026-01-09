from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class CustomLink(BaseModel):
    label: str
    url: str

# Request Models
class HeadingCreate(BaseModel):
    mobile: Optional[str] = None
    custom_links: List[CustomLink] = []

class HeadingUpdate(BaseModel):
    mobile: Optional[str] = None
    custom_links: Optional[List[CustomLink]] = None

# Response Models
class HeadingResponse(BaseModel):
    id: str
    user_id: str
    mobile: Optional[str] = None
    custom_links: List[CustomLink] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

