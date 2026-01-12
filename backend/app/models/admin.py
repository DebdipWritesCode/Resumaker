from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.models.user import UserWithAnalytics

# Analytics Models
class PlatformStats(BaseModel):
    total_users: int
    total_ai_calls: int
    total_pdfs_generated: int
    total_pdfs_downloaded: int
    active_users_last_30_days: int

class AIUsageStats(BaseModel):
    user_id: str
    user_email: str
    total_calls: int
    total_tokens: int
    last_call_at: Optional[datetime] = None

class PDFStats(BaseModel):
    user_id: str
    user_email: str
    pdfs_generated: int
    pdfs_downloaded: int
    last_generated_at: Optional[datetime] = None

# Response Models
class AdminUsersResponse(BaseModel):
    users: List[UserWithAnalytics]
    total: int

class AdminStatsResponse(BaseModel):
    stats: PlatformStats

class AdminUserDetailResponse(BaseModel):
    user: UserWithAnalytics
    ai_usage: List[AIUsageStats]
    pdf_stats: PDFStats

class AdminAIUsageResponse(BaseModel):
    usage: List[AIUsageStats]
    total_calls: int
    total_tokens: int

class AdminPDFStatsResponse(BaseModel):
    stats: List[PDFStats]
    total_generated: int
    total_downloaded: int

# Request Models
class CreateAdminRequest(BaseModel):
    email: EmailStr

class UpdateCreditsRequest(BaseModel):
    credits: int

# Response Models for Admin Actions
class RevokeUserResponse(BaseModel):
    message: str
    user_id: str
    is_revoked: bool

class UnrevokeUserResponse(BaseModel):
    message: str
    user_id: str
    is_revoked: bool

class DeleteUserResponse(BaseModel):
    message: str
    user_id: str

class CreateAdminResponse(BaseModel):
    message: str
    user_id: str
    email: str
    is_admin: bool

class UpdateCreditsResponse(BaseModel):
    message: str
    user_id: str
    credits: int

