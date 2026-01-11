from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.ai import ExtractedResumeData

# Response Models
class UploadedResumeResponse(BaseModel):
    id: str
    user_id: str
    cloudinary_url: str
    cloudinary_public_id: str
    thumbnail_url: Optional[str] = None
    thumbnail_public_id: Optional[str] = None
    extracted_data: ExtractedResumeData
    tokens_used: int
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
