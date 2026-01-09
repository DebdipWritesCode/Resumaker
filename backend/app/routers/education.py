from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.education import EducationCreate, EducationUpdate, EducationResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_educations_collection

router = APIRouter(prefix="/api/education", tags=["Education"])

@router.get("/", response_model=List[EducationResponse])
async def get_educations(current_user: dict = Depends(get_current_user)):
    """Get all user's educations"""
    educations_collection = get_educations_collection()
    cursor = educations_collection.find({"user_id": ObjectId(current_user["user_id"])})
    educations = await cursor.to_list(length=None)
    
    return [
        EducationResponse(
            id=str(education["_id"]),
            user_id=str(education["user_id"]),
            institution=education["institution"],
            location=education["location"],
            degree=education["degree"],
            gpa=education.get("gpa"),
            max_gpa=education.get("max_gpa"),
            start_date=education["start_date"],
            end_date=education["end_date"],
            courses=education.get("courses"),
            created_at=education["created_at"],
            updated_at=education["updated_at"]
        )
        for education in educations
    ]

@router.get("/{education_id}", response_model=EducationResponse)
async def get_education(
    education_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific education by ID"""
    educations_collection = get_educations_collection()
    
    try:
        education_object_id = ObjectId(education_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid education ID format"
        )
    
    education = await educations_collection.find_one({
        "_id": education_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education not found"
        )
    
    return EducationResponse(
        id=str(education["_id"]),
        user_id=str(education["user_id"]),
        institution=education["institution"],
        location=education["location"],
        degree=education["degree"],
        gpa=education.get("gpa"),
        max_gpa=education.get("max_gpa"),
        start_date=education["start_date"],
        end_date=education["end_date"],
        courses=education.get("courses"),
        created_at=education["created_at"],
        updated_at=education["updated_at"]
    )

@router.post("/", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
async def create_education(
    education_data: EducationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new education"""
    educations_collection = get_educations_collection()
    
    education_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "institution": education_data.institution,
        "location": education_data.location,
        "degree": education_data.degree,
        "gpa": education_data.gpa,
        "max_gpa": education_data.max_gpa,
        "start_date": education_data.start_date,
        "end_date": education_data.end_date,
        "courses": education_data.courses or [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await educations_collection.insert_one(education_doc)
    education_doc["_id"] = result.inserted_id
    
    return EducationResponse(
        id=str(education_doc["_id"]),
        user_id=str(education_doc["user_id"]),
        institution=education_doc["institution"],
        location=education_doc["location"],
        degree=education_doc["degree"],
        gpa=education_doc["gpa"],
        max_gpa=education_doc["max_gpa"],
        start_date=education_doc["start_date"],
        end_date=education_doc["end_date"],
        courses=education_doc["courses"],
        created_at=education_doc["created_at"],
        updated_at=education_doc["updated_at"]
    )

@router.put("/{education_id}", response_model=EducationResponse)
async def update_education(
    education_id: str,
    education_data: EducationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific education by ID"""
    educations_collection = get_educations_collection()
    
    try:
        education_object_id = ObjectId(education_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid education ID format"
        )
    
    # Verify the education exists and belongs to the user
    education = await educations_collection.find_one({
        "_id": education_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if education_data.institution is not None:
        update_data["institution"] = education_data.institution
    if education_data.location is not None:
        update_data["location"] = education_data.location
    if education_data.degree is not None:
        update_data["degree"] = education_data.degree
    if education_data.gpa is not None:
        update_data["gpa"] = education_data.gpa
    if education_data.max_gpa is not None:
        update_data["max_gpa"] = education_data.max_gpa
    if education_data.start_date is not None:
        update_data["start_date"] = education_data.start_date
    if education_data.end_date is not None:
        update_data["end_date"] = education_data.end_date
    if education_data.courses is not None:
        update_data["courses"] = education_data.courses
    
    await educations_collection.update_one(
        {"_id": education_object_id},
        {"$set": update_data}
    )
    
    updated = await educations_collection.find_one({"_id": education_object_id})
    return EducationResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        institution=updated["institution"],
        location=updated["location"],
        degree=updated["degree"],
        gpa=updated.get("gpa"),
        max_gpa=updated.get("max_gpa"),
        start_date=updated["start_date"],
        end_date=updated["end_date"],
        courses=updated.get("courses"),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(
    education_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific education by ID"""
    educations_collection = get_educations_collection()
    
    try:
        education_object_id = ObjectId(education_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid education ID format"
        )
    
    # Verify the education exists and belongs to the user
    education = await educations_collection.find_one({
        "_id": education_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education not found"
        )
    
    await educations_collection.delete_one({"_id": education_object_id})
    return None
