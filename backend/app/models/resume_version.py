from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Request Models
class ResumeVersionCreate(BaseModel):
    name: str
    selected_education_ids: List[str] = []
    selected_experience_ids: List[str] = []
    selected_project_ids: List[str] = []
    selected_certification_ids: List[str] = []
    selected_award_ids: List[str] = []
    selected_volunteer_ids: List[str] = []
    selected_skill_ids: List[str] = []

class ResumeVersionUpdate(BaseModel):
    name: Optional[str] = None
    selected_education_ids: Optional[List[str]] = None
    selected_experience_ids: Optional[List[str]] = None
    selected_project_ids: Optional[List[str]] = None
    selected_certification_ids: Optional[List[str]] = None
    selected_award_ids: Optional[List[str]] = None
    selected_volunteer_ids: Optional[List[str]] = None
    selected_skill_ids: Optional[List[str]] = None

# Response Models
class ResumeVersionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    selected_education_ids: List[str] = []
    selected_experience_ids: List[str] = []
    selected_project_ids: List[str] = []
    selected_certification_ids: List[str] = []
    selected_award_ids: List[str] = []
    selected_volunteer_ids: List[str] = []
    selected_skill_ids: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Compile Request
class CompileRequest(BaseModel):
    resume_version_id: Optional[str] = None
    # Or provide selected IDs directly
    selected_education_ids: Optional[List[str]] = None
    selected_experience_ids: Optional[List[str]] = None
    selected_project_ids: Optional[List[str]] = None
    selected_certification_ids: Optional[List[str]] = None
    selected_award_ids: Optional[List[str]] = None
    selected_volunteer_ids: Optional[List[str]] = None
    selected_skill_ids: Optional[List[str]] = None

