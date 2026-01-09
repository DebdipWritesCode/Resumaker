from pydantic import BaseModel
from typing import List, Optional

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

