from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Dashboard Stats Model
class DashboardStats(BaseModel):
    credits: int
    max_resume: int
    resume_count: int
    pdfs_generated: int
    ai_calls_count: int

# Recent Custom Resume Model (simplified)
class RecentCustomResume(BaseModel):
    id: str
    name: str
    thumbnail_url: Optional[str] = None
    cloudinary_url: Optional[str] = None
    updated_at: datetime
    created_at: datetime

# Recent PDF Model
class RecentPDF(BaseModel):
    id: str
    resume_name: str
    cloudinary_url: str
    thumbnail_url: Optional[str] = None
    generated_at: datetime

# Element Counts Model
class ElementCounts(BaseModel):
    headings: int = 0
    educations: int = 0
    experiences: int = 0
    projects: int = 0
    skills: int = 0
    certifications: int = 0
    awards: int = 0
    volunteers: int = 0

# Dashboard Activity Model
class DashboardActivity(BaseModel):
    type: str  # "resume_created", "resume_updated", "pdf_generated", "ai_used"
    description: str
    timestamp: datetime
    resume_id: Optional[str] = None
    resume_name: Optional[str] = None

# Main Dashboard Response Model
class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_resumes: List[RecentCustomResume]
    recent_pdfs: List[RecentPDF]
    element_counts: ElementCounts
    recent_activity: List[DashboardActivity]
