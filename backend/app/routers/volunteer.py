from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.volunteer import VolunteerCreate, VolunteerUpdate, VolunteerResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_volunteer_experiences_collection

router = APIRouter(prefix="/api/volunteer", tags=["Volunteer"])

@router.get("/", response_model=List[VolunteerResponse])
async def get_volunteers(current_user: dict = Depends(get_current_user)):
    """Get all user's volunteer experiences"""
    volunteers_collection = get_volunteer_experiences_collection()
    cursor = volunteers_collection.find({"user_id": ObjectId(current_user["user_id"])})
    volunteers = await cursor.to_list(length=None)
    
    return [
        VolunteerResponse(
            id=str(volunteer["_id"]),
            user_id=str(volunteer["user_id"]),
            position=volunteer["position"],
            organization=volunteer["organization"],
            location=volunteer["location"],
            description=volunteer["description"],
            start_date=volunteer["start_date"],
            end_date=volunteer["end_date"],
            created_at=volunteer["created_at"],
            updated_at=volunteer["updated_at"]
        )
        for volunteer in volunteers
    ]

@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(
    volunteer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific volunteer experience by ID"""
    volunteers_collection = get_volunteer_experiences_collection()
    
    try:
        volunteer_object_id = ObjectId(volunteer_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid volunteer ID format"
        )
    
    volunteer = await volunteers_collection.find_one({
        "_id": volunteer_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer experience not found"
        )
    
    return VolunteerResponse(
        id=str(volunteer["_id"]),
        user_id=str(volunteer["user_id"]),
        position=volunteer["position"],
        organization=volunteer["organization"],
        location=volunteer["location"],
        description=volunteer["description"],
        start_date=volunteer["start_date"],
        end_date=volunteer["end_date"],
        created_at=volunteer["created_at"],
        updated_at=volunteer["updated_at"]
    )

@router.post("/", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer(
    volunteer_data: VolunteerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new volunteer experience"""
    volunteers_collection = get_volunteer_experiences_collection()
    
    volunteer_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "position": volunteer_data.position,
        "organization": volunteer_data.organization,
        "location": volunteer_data.location,
        "description": volunteer_data.description,
        "start_date": volunteer_data.start_date,
        "end_date": volunteer_data.end_date,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await volunteers_collection.insert_one(volunteer_doc)
    volunteer_doc["_id"] = result.inserted_id
    
    return VolunteerResponse(
        id=str(volunteer_doc["_id"]),
        user_id=str(volunteer_doc["user_id"]),
        position=volunteer_doc["position"],
        organization=volunteer_doc["organization"],
        location=volunteer_doc["location"],
        description=volunteer_doc["description"],
        start_date=volunteer_doc["start_date"],
        end_date=volunteer_doc["end_date"],
        created_at=volunteer_doc["created_at"],
        updated_at=volunteer_doc["updated_at"]
    )

@router.put("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: str,
    volunteer_data: VolunteerUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific volunteer experience by ID"""
    volunteers_collection = get_volunteer_experiences_collection()
    
    try:
        volunteer_object_id = ObjectId(volunteer_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid volunteer ID format"
        )
    
    # Verify the volunteer experience exists and belongs to the user
    volunteer = await volunteers_collection.find_one({
        "_id": volunteer_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer experience not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if volunteer_data.position is not None:
        update_data["position"] = volunteer_data.position
    if volunteer_data.organization is not None:
        update_data["organization"] = volunteer_data.organization
    if volunteer_data.location is not None:
        update_data["location"] = volunteer_data.location
    if volunteer_data.description is not None:
        update_data["description"] = volunteer_data.description
    if volunteer_data.start_date is not None:
        update_data["start_date"] = volunteer_data.start_date
    if volunteer_data.end_date is not None:
        update_data["end_date"] = volunteer_data.end_date
    
    await volunteers_collection.update_one(
        {"_id": volunteer_object_id},
        {"$set": update_data}
    )
    
    updated = await volunteers_collection.find_one({"_id": volunteer_object_id})
    return VolunteerResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        position=updated["position"],
        organization=updated["organization"],
        location=updated["location"],
        description=updated["description"],
        start_date=updated["start_date"],
        end_date=updated["end_date"],
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer(
    volunteer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific volunteer experience by ID"""
    volunteers_collection = get_volunteer_experiences_collection()
    
    try:
        volunteer_object_id = ObjectId(volunteer_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid volunteer ID format"
        )
    
    # Verify the volunteer experience exists and belongs to the user
    volunteer = await volunteers_collection.find_one({
        "_id": volunteer_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer experience not found"
        )
    
    await volunteers_collection.delete_one({"_id": volunteer_object_id})
    return None
