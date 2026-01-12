from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.skill import SkillCreate, SkillUpdate, SkillResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_skills_collection

router = APIRouter(prefix="/api/skill", tags=["Skill"])

@router.get("/", response_model=List[SkillResponse])
async def get_skills(current_user: dict = Depends(get_current_user)):
    """Get all user's skills"""
    skills_collection = get_skills_collection()
    cursor = skills_collection.find({"user_id": ObjectId(current_user["user_id"])})
    skills = await cursor.to_list(length=None)
    
    return [
        SkillResponse(
            id=str(skill["_id"]),
            user_id=str(skill["user_id"]),
            category=skill["category"],
            items=skill.get("items", []),
            notes=skill.get("notes"),
            created_at=skill["created_at"],
            updated_at=skill["updated_at"]
        )
        for skill in skills
    ]

@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(
    skill_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific skill by ID"""
    skills_collection = get_skills_collection()
    
    try:
        skill_object_id = ObjectId(skill_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid skill ID format"
        )
    
    skill = await skills_collection.find_one({
        "_id": skill_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    return SkillResponse(
        id=str(skill["_id"]),
        user_id=str(skill["user_id"]),
        category=skill["category"],
        items=skill.get("items", []),
        notes=skill.get("notes"),
        created_at=skill["created_at"],
        updated_at=skill["updated_at"]
    )

@router.post("/", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: SkillCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new skill category"""
    skills_collection = get_skills_collection()
    
    skill_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "category": skill_data.category,
        "items": skill_data.items or [],
        "notes": skill_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await skills_collection.insert_one(skill_doc)
    skill_doc["_id"] = result.inserted_id
    
    return SkillResponse(
        id=str(skill_doc["_id"]),
        user_id=str(skill_doc["user_id"]),
        category=skill_doc["category"],
        items=skill_doc["items"],
        notes=skill_doc.get("notes"),
        created_at=skill_doc["created_at"],
        updated_at=skill_doc["updated_at"]
    )

@router.put("/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: str,
    skill_data: SkillUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific skill by ID"""
    skills_collection = get_skills_collection()
    
    try:
        skill_object_id = ObjectId(skill_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid skill ID format"
        )
    
    # Verify the skill exists and belongs to the user
    skill = await skills_collection.find_one({
        "_id": skill_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if skill_data.category is not None:
        update_data["category"] = skill_data.category
    if skill_data.items is not None:
        update_data["items"] = skill_data.items
    if skill_data.set_notes or skill_data.notes is not None:
        update_data["notes"] = skill_data.notes
    
    await skills_collection.update_one(
        {"_id": skill_object_id},
        {"$set": update_data}
    )
    
    updated = await skills_collection.find_one({"_id": skill_object_id})
    return SkillResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        category=updated["category"],
        items=updated.get("items", []),
        notes=updated.get("notes"),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific skill by ID"""
    skills_collection = get_skills_collection()
    
    try:
        skill_object_id = ObjectId(skill_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid skill ID format"
        )
    
    # Verify the skill exists and belongs to the user
    skill = await skills_collection.find_one({
        "_id": skill_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    await skills_collection.delete_one({"_id": skill_object_id})
    return None
