from pydantic import BaseModel
from typing import List, Optional

# Extraction Models for OpenAI Structured Output
class ExtractedCustomLink(BaseModel):
    label: str
    url: str

class ExtractedHeading(BaseModel):
    mobile: Optional[str] = None
    custom_links: List[ExtractedCustomLink] = []

class ExtractedProjectItem(BaseModel):
    title: str
    description: str

class ExtractedExperience(BaseModel):
    company: str
    location: str
    position: str
    start_date: str
    end_date: str  # Can be "Present" or date
    projects: List[ExtractedProjectItem] = []

class ExtractedProject(BaseModel):
    name: str
    start_date: str
    end_date: str  # Can be "Present" or date
    tech_stack: str
    link: Optional[str] = None
    link_label: Optional[str] = None
    subpoints: List[str] = []

class ExtractedEducation(BaseModel):
    institution: str
    location: str
    degree: str
    gpa: Optional[float] = None
    max_gpa: Optional[float] = None
    start_date: str
    end_date: str  # Can be "Present" or date
    courses: Optional[List[str]] = None

class ExtractedSkill(BaseModel):
    category: str  # "Languages", "Frameworks", "Tools", "Soft Skills"
    items: List[str]

class ExtractedCertification(BaseModel):
    title: str
    start_date: str
    end_date: str  # Can be "Present" or date
    instructor: Optional[str] = None
    platform: str
    certification_link: Optional[str] = None

class ExtractedAward(BaseModel):
    title: str
    date: str  # Can be month and year eg "Jan 2025"

class ExtractedVolunteer(BaseModel):
    position: str
    organization: str
    location: str
    description: str
    start_date: str
    end_date: str  # Can be "Present" or date

class ExtractedResumeData(BaseModel):
    heading: Optional[ExtractedHeading] = None
    experiences: List[ExtractedExperience] = []
    projects: List[ExtractedProject] = []
    education: List[ExtractedEducation] = []
    skills: List[ExtractedSkill] = []
    certifications: List[ExtractedCertification] = []
    awards: List[ExtractedAward] = []
    volunteer_experiences: List[ExtractedVolunteer] = []

# Request Models
class GenerateSubpointsRequest(BaseModel):
    section: str  # "experience" or "project"
    item_id: str
    tech_stack: Optional[str] = None
    name: Optional[str] = None

class RephraseTitleRequest(BaseModel):
    section: str
    item_id: str
    current_title: str

class RephraseSubpointsRequest(BaseModel):
    section: str
    item_id: str
    subpoints: List[str]

# Response Models
class GenerateSubpointsResponse(BaseModel):
    subpoints: List[str]
    tokens_used: int

class RephraseTitleResponse(BaseModel):
    rephrased_title: str
    tokens_used: int

class RephraseSubpointsResponse(BaseModel):
    rephrased_subpoints: List[str]
    tokens_used: int

class ExtractResumeResponse(BaseModel):
    extracted_data: ExtractedResumeData
    extraction_id: str
    resume_url: str  # Cloudinary URL for viewing the uploaded PDF
    thumbnail_url: str  # Cloudinary URL for the thumbnail image
    tokens_used: int

class SaveExtractedResumeRequest(BaseModel):
    extracted_data: ExtractedResumeData

class SaveExtractedResumeResponse(BaseModel):
    heading_id: Optional[str] = None
    experience_ids: List[str] = []
    project_ids: List[str] = []
    education_ids: List[str] = []
    skill_ids: List[str] = []
    certification_ids: List[str] = []
    award_ids: List[str] = []
    volunteer_ids: List[str] = []
    message: str = "Resume data saved successfully"

