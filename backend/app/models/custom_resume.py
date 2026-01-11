from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.heading import HeadingResponse
from app.models.education import EducationResponse
from app.models.experience import ExperienceResponse
from app.models.project import ProjectResponse
from app.models.skill import SkillResponse
from app.models.volunteer import VolunteerResponse
from app.models.certification import CertificationResponse
from app.models.award import AwardResponse

# Request Models
class CustomResumeCreate(BaseModel):
    name: str
    heading_ids: Optional[List[str]] = []
    education_ids: Optional[List[str]] = []
    experience_ids: Optional[List[str]] = []
    project_ids: Optional[List[str]] = []
    skill_ids: Optional[List[str]] = []
    volunteer_ids: Optional[List[str]] = []
    certification_ids: Optional[List[str]] = []
    award_ids: Optional[List[str]] = []

class CustomResumeUpdate(BaseModel):
    name: Optional[str] = None
    heading_ids: Optional[List[str]] = None
    education_ids: Optional[List[str]] = None
    experience_ids: Optional[List[str]] = None
    project_ids: Optional[List[str]] = None
    skill_ids: Optional[List[str]] = None
    volunteer_ids: Optional[List[str]] = None
    certification_ids: Optional[List[str]] = None
    award_ids: Optional[List[str]] = None

# Response Models
class CustomResumeResponse(BaseModel):
    id: str
    user_id: str
    name: str
    headings: List[HeadingResponse] = []
    educations: List[EducationResponse] = []
    experiences: List[ExperienceResponse] = []
    projects: List[ProjectResponse] = []
    skills: List[SkillResponse] = []
    volunteers: List[VolunteerResponse] = []
    certifications: List[CertificationResponse] = []
    awards: List[AwardResponse] = []
    latex_url: Optional[str] = None
    latex_public_id: Optional[str] = None
    cloudinary_url: Optional[str] = None  # PDF URL (primary)
    cloudinary_public_id: Optional[str] = None  # PDF public ID
    pdf_url: Optional[str] = None  # Alias for cloudinary_url (backward compatibility)
    thumbnail_url: Optional[str] = None
    thumbnail_public_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserElementsResponse(BaseModel):
    headings: List[HeadingResponse] = []
    educations: List[EducationResponse] = []
    experiences: List[ExperienceResponse] = []
    projects: List[ProjectResponse] = []
    skills: List[SkillResponse] = []
    volunteers: List[VolunteerResponse] = []
    certifications: List[CertificationResponse] = []
    awards: List[AwardResponse] = []
    
    class Config:
        from_attributes = True

# AI Selection Models
class SelectResumeElementsRequest(BaseModel):
    job_description: str

class SelectResumeElementsResponse(BaseModel):
    project_ids: List[str] = []
    award_ids: List[str] = []
    certification_ids: List[str] = []
    volunteer_ids: List[str] = []
    tokens_used: int
