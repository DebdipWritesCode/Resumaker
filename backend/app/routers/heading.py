from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.heading import HeadingCreate, HeadingUpdate, HeadingResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_headings_collection

router = APIRouter(prefix="/api/heading", tags=["Heading"])

@router.get("/", response_model=List[HeadingResponse])
async def get_headings(current_user: dict = Depends(get_current_user)):
    """Get all user's headings"""
    headings_collection = get_headings_collection()
    cursor = headings_collection.find({"user_id": ObjectId(current_user["user_id"])})
    headings = await cursor.to_list(length=None)
    
    return [
        HeadingResponse(
            id=str(heading["_id"]),
            user_id=str(heading["user_id"]),
            mobile=heading.get("mobile"),
            custom_links=heading.get("custom_links", []),
            created_at=heading["created_at"],
            updated_at=heading["updated_at"]
        )
        for heading in headings
    ]

@router.get("/{heading_id}", response_model=HeadingResponse)
async def get_heading(
    heading_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific heading by ID"""
    headings_collection = get_headings_collection()
    
    try:
        heading_object_id = ObjectId(heading_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid heading ID format"
        )
    
    heading = await headings_collection.find_one({
        "_id": heading_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not heading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Heading not found"
        )
    
    return HeadingResponse(
        id=str(heading["_id"]),
        user_id=str(heading["user_id"]),
        mobile=heading.get("mobile"),
        custom_links=heading.get("custom_links", []),
        created_at=heading["created_at"],
        updated_at=heading["updated_at"]
    )

@router.post("/", response_model=HeadingResponse, status_code=status.HTTP_201_CREATED)
async def create_heading(
    heading_data: HeadingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new heading"""
    headings_collection = get_headings_collection()
    
    heading_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "mobile": heading_data.mobile,
        "custom_links": [link.dict() for link in heading_data.custom_links],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await headings_collection.insert_one(heading_doc)
    heading_doc["_id"] = result.inserted_id
    
    return HeadingResponse(
        id=str(heading_doc["_id"]),
        user_id=str(heading_doc["user_id"]),
        mobile=heading_doc["mobile"],
        custom_links=heading_doc["custom_links"],
        created_at=heading_doc["created_at"],
        updated_at=heading_doc["updated_at"]
    )

@router.put("/{heading_id}", response_model=HeadingResponse)
async def update_heading(
    heading_id: str,
    heading_data: HeadingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific heading by ID"""
    headings_collection = get_headings_collection()
    
    try:
        heading_object_id = ObjectId(heading_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid heading ID format"
        )
    
    # Verify the heading exists and belongs to the user
    heading = await headings_collection.find_one({
        "_id": heading_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not heading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Heading not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if heading_data.mobile is not None:
        update_data["mobile"] = heading_data.mobile
    if heading_data.custom_links is not None:
        update_data["custom_links"] = [link.dict() for link in heading_data.custom_links]
    
    await headings_collection.update_one(
        {"_id": heading_object_id},
        {"$set": update_data}
    )
    
    updated = await headings_collection.find_one({"_id": heading_object_id})
    return HeadingResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        mobile=updated.get("mobile"),
        custom_links=updated.get("custom_links", []),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{heading_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_heading(
    heading_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific heading by ID"""
    headings_collection = get_headings_collection()
    
    try:
        heading_object_id = ObjectId(heading_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid heading ID format"
        )
    
    # Verify the heading exists and belongs to the user
    heading = await headings_collection.find_one({
        "_id": heading_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not heading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Heading not found"
        )
    
    await headings_collection.delete_one({"_id": heading_object_id})
    return None

