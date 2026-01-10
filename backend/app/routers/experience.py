from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.experience import ExperienceCreate, ExperienceUpdate, ExperienceResponse, ProjectItem
from app.middleware.auth_middleware import get_current_user
from app.database import get_experiences_collection

router = APIRouter(prefix="/api/experience", tags=["Experience"])

@router.get("/", response_model=List[ExperienceResponse])
async def get_experiences(current_user: dict = Depends(get_current_user)):
    """Get all user's experiences"""
    experiences_collection = get_experiences_collection()
    cursor = experiences_collection.find({"user_id": ObjectId(current_user["user_id"])})
    experiences = await cursor.to_list(length=None)
    
    return [
        ExperienceResponse(
            id=str(experience["_id"]),
            user_id=str(experience["user_id"]),
            company=experience["company"],
            location=experience["location"],
            position=experience["position"],
            start_date=experience["start_date"],
            end_date=experience["end_date"],
            projects=[
                ProjectItem(title=project["title"], description=project["description"])
                for project in experience.get("projects", [])
            ],
            created_at=experience["created_at"],
            updated_at=experience["updated_at"]
        )
        for experience in experiences
    ]

@router.get("/{experience_id}", response_model=ExperienceResponse)
async def get_experience(
    experience_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific experience by ID"""
    experiences_collection = get_experiences_collection()
    
    try:
        experience_object_id = ObjectId(experience_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid experience ID format"
        )
    
    experience = await experiences_collection.find_one({
        "_id": experience_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    return ExperienceResponse(
        id=str(experience["_id"]),
        user_id=str(experience["user_id"]),
        company=experience["company"],
        location=experience["location"],
        position=experience["position"],
        start_date=experience["start_date"],
        end_date=experience["end_date"],
        projects=[
            ProjectItem(title=project["title"], description=project["description"])
            for project in experience.get("projects", [])
        ],
        created_at=experience["created_at"],
        updated_at=experience["updated_at"]
    )

@router.post("/", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    experience_data: ExperienceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new experience"""
    experiences_collection = get_experiences_collection()
    
    experience_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "company": experience_data.company,
        "location": experience_data.location,
        "position": experience_data.position,
        "start_date": experience_data.start_date,
        "end_date": experience_data.end_date,
        "projects": [project.dict() for project in experience_data.projects],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await experiences_collection.insert_one(experience_doc)
    experience_doc["_id"] = result.inserted_id
    
    return ExperienceResponse(
        id=str(experience_doc["_id"]),
        user_id=str(experience_doc["user_id"]),
        company=experience_doc["company"],
        location=experience_doc["location"],
        position=experience_doc["position"],
        start_date=experience_doc["start_date"],
        end_date=experience_doc["end_date"],
        projects=[
            ProjectItem(title=project["title"], description=project["description"])
            for project in experience_doc["projects"]
        ],
        created_at=experience_doc["created_at"],
        updated_at=experience_doc["updated_at"]
    )

@router.put("/{experience_id}", response_model=ExperienceResponse)
async def update_experience(
    experience_id: str,
    experience_data: ExperienceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific experience by ID"""
    experiences_collection = get_experiences_collection()
    
    try:
        experience_object_id = ObjectId(experience_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid experience ID format"
        )
    
    # Verify the experience exists and belongs to the user
    experience = await experiences_collection.find_one({
        "_id": experience_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if experience_data.company is not None:
        update_data["company"] = experience_data.company
    if experience_data.location is not None:
        update_data["location"] = experience_data.location
    if experience_data.position is not None:
        update_data["position"] = experience_data.position
    if experience_data.start_date is not None:
        update_data["start_date"] = experience_data.start_date
    if experience_data.end_date is not None:
        update_data["end_date"] = experience_data.end_date
    if experience_data.projects is not None:
        update_data["projects"] = [project.dict() for project in experience_data.projects]
    
    await experiences_collection.update_one(
        {"_id": experience_object_id},
        {"$set": update_data}
    )
    
    updated = await experiences_collection.find_one({"_id": experience_object_id})
    return ExperienceResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        company=updated["company"],
        location=updated["location"],
        position=updated["position"],
        start_date=updated["start_date"],
        end_date=updated["end_date"],
        projects=[
            ProjectItem(title=project["title"], description=project["description"])
            for project in updated.get("projects", [])
        ],
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific experience by ID"""
    experiences_collection = get_experiences_collection()
    
    try:
        experience_object_id = ObjectId(experience_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid experience ID format"
        )
    
    # Verify the experience exists and belongs to the user
    experience = await experiences_collection.find_one({
        "_id": experience_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    await experiences_collection.delete_one({"_id": experience_object_id})
    return None
