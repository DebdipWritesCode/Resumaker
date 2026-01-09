from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Request Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response Models
class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserAnalytics(BaseModel):
    ai_calls_count: int
    pdfs_generated_count: int
    pdfs_downloaded_count: int
    last_ai_call_at: Optional[datetime] = None
    last_pdf_generated_at: Optional[datetime] = None

class UserWithAnalytics(UserResponse):
    analytics: UserAnalytics

# Token Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    first_name: str
    last_name: str

