from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.award import AwardCreate, AwardUpdate, AwardResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_awards_collection

router = APIRouter(prefix="/api/award", tags=["Award"])

@router.get("/", response_model=List[AwardResponse])
async def get_awards(current_user: dict = Depends(get_current_user)):
    """Get all user's awards"""
    awards_collection = get_awards_collection()
    cursor = awards_collection.find({"user_id": ObjectId(current_user["user_id"])})
    awards = await cursor.to_list(length=None)
    
    return [
        AwardResponse(
            id=str(award["_id"]),
            user_id=str(award["user_id"]),
            title=award["title"],
            date=award["date"],
            created_at=award["created_at"],
            updated_at=award["updated_at"]
        )
        for award in awards
    ]

@router.get("/{award_id}", response_model=AwardResponse)
async def get_award(
    award_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific award by ID"""
    awards_collection = get_awards_collection()
    
    try:
        award_object_id = ObjectId(award_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid award ID format"
        )
    
    award = await awards_collection.find_one({
        "_id": award_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not award:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Award not found"
        )
    
    return AwardResponse(
        id=str(award["_id"]),
        user_id=str(award["user_id"]),
        title=award["title"],
        date=award["date"],
        created_at=award["created_at"],
        updated_at=award["updated_at"]
    )

@router.post("/", response_model=AwardResponse, status_code=status.HTTP_201_CREATED)
async def create_award(
    award_data: AwardCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new award"""
    awards_collection = get_awards_collection()
    
    award_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "title": award_data.title,
        "date": award_data.date,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await awards_collection.insert_one(award_doc)
    award_doc["_id"] = result.inserted_id
    
    return AwardResponse(
        id=str(award_doc["_id"]),
        user_id=str(award_doc["user_id"]),
        title=award_doc["title"],
        date=award_doc["date"],
        created_at=award_doc["created_at"],
        updated_at=award_doc["updated_at"]
    )

@router.put("/{award_id}", response_model=AwardResponse)
async def update_award(
    award_id: str,
    award_data: AwardUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific award by ID"""
    awards_collection = get_awards_collection()
    
    try:
        award_object_id = ObjectId(award_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid award ID format"
        )
    
    # Verify the award exists and belongs to the user
    award = await awards_collection.find_one({
        "_id": award_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not award:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Award not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if award_data.title is not None:
        update_data["title"] = award_data.title
    if award_data.date is not None:
        update_data["date"] = award_data.date
    
    await awards_collection.update_one(
        {"_id": award_object_id},
        {"$set": update_data}
    )
    
    updated = await awards_collection.find_one({"_id": award_object_id})
    return AwardResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        title=updated["title"],
        date=updated["date"],
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{award_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_award(
    award_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific award by ID"""
    awards_collection = get_awards_collection()
    
    try:
        award_object_id = ObjectId(award_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid award ID format"
        )
    
    # Verify the award exists and belongs to the user
    award = await awards_collection.find_one({
        "_id": award_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not award:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Award not found"
        )
    
    await awards_collection.delete_one({"_id": award_object_id})
    return None
