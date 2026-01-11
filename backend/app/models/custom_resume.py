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
