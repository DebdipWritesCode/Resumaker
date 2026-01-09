from pydantic import BaseModel
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

