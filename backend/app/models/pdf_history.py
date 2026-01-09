from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Response Models
class PDFHistoryResponse(BaseModel):
    id: str
    user_id: str
    resume_version_id: Optional[str] = None
    cloudinary_url: str
    cloudinary_public_id: str
    compiled_at: datetime
    downloaded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CompileResponse(BaseModel):
    pdf_url: str
    pdf_id: str
    message: str = "PDF compiled successfully"

