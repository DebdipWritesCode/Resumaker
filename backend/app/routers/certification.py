from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.certification import CertificationCreate, CertificationUpdate, CertificationResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_certifications_collection

router = APIRouter(prefix="/api/certification", tags=["Certification"])

@router.get("/", response_model=List[CertificationResponse])
async def get_certifications(current_user: dict = Depends(get_current_user)):
    """Get all user's certifications"""
    certifications_collection = get_certifications_collection()
    cursor = certifications_collection.find({"user_id": ObjectId(current_user["user_id"])})
    certifications = await cursor.to_list(length=None)
    
    return [
        CertificationResponse(
            id=str(certification["_id"]),
            user_id=str(certification["user_id"]),
            title=certification["title"],
            start_date=certification["start_date"],
            end_date=certification["end_date"],
            instructor=certification.get("instructor"),
            platform=certification["platform"],
            certification_link=certification.get("certification_link"),
            created_at=certification["created_at"],
            updated_at=certification["updated_at"]
        )
        for certification in certifications
    ]

@router.get("/{certification_id}", response_model=CertificationResponse)
async def get_certification(
    certification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific certification by ID"""
    certifications_collection = get_certifications_collection()
    
    try:
        certification_object_id = ObjectId(certification_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid certification ID format"
        )
    
    certification = await certifications_collection.find_one({
        "_id": certification_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )
    
    return CertificationResponse(
        id=str(certification["_id"]),
        user_id=str(certification["user_id"]),
        title=certification["title"],
        start_date=certification["start_date"],
        end_date=certification["end_date"],
        instructor=certification.get("instructor"),
        platform=certification["platform"],
        certification_link=certification.get("certification_link"),
        created_at=certification["created_at"],
        updated_at=certification["updated_at"]
    )

@router.post("/", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
async def create_certification(
    certification_data: CertificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new certification"""
    certifications_collection = get_certifications_collection()
    
    certification_doc = {
        "user_id": ObjectId(current_user["user_id"]),
        "title": certification_data.title,
        "start_date": certification_data.start_date,
        "end_date": certification_data.end_date,
        "instructor": certification_data.instructor,
        "platform": certification_data.platform,
        "certification_link": certification_data.certification_link,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await certifications_collection.insert_one(certification_doc)
    certification_doc["_id"] = result.inserted_id
    
    return CertificationResponse(
        id=str(certification_doc["_id"]),
        user_id=str(certification_doc["user_id"]),
        title=certification_doc["title"],
        start_date=certification_doc["start_date"],
        end_date=certification_doc["end_date"],
        instructor=certification_doc["instructor"],
        platform=certification_doc["platform"],
        certification_link=certification_doc["certification_link"],
        created_at=certification_doc["created_at"],
        updated_at=certification_doc["updated_at"]
    )

@router.put("/{certification_id}", response_model=CertificationResponse)
async def update_certification(
    certification_id: str,
    certification_data: CertificationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific certification by ID"""
    certifications_collection = get_certifications_collection()
    
    try:
        certification_object_id = ObjectId(certification_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid certification ID format"
        )
    
    # Verify the certification exists and belongs to the user
    certification = await certifications_collection.find_one({
        "_id": certification_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    if certification_data.title is not None:
        update_data["title"] = certification_data.title
    if certification_data.start_date is not None:
        update_data["start_date"] = certification_data.start_date
    if certification_data.end_date is not None:
        update_data["end_date"] = certification_data.end_date
    if certification_data.set_instructor or certification_data.instructor is not None:
        update_data["instructor"] = certification_data.instructor
    if certification_data.platform is not None:
        update_data["platform"] = certification_data.platform
    if certification_data.set_certification_link or certification_data.certification_link is not None:
        update_data["certification_link"] = certification_data.certification_link
    
    await certifications_collection.update_one(
        {"_id": certification_object_id},
        {"$set": update_data}
    )
    
    updated = await certifications_collection.find_one({"_id": certification_object_id})
    return CertificationResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        title=updated["title"],
        start_date=updated["start_date"],
        end_date=updated["end_date"],
        instructor=updated.get("instructor"),
        platform=updated["platform"],
        certification_link=updated.get("certification_link"),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certification(
    certification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific certification by ID"""
    certifications_collection = get_certifications_collection()
    
    try:
        certification_object_id = ObjectId(certification_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid certification ID format"
        )
    
    # Verify the certification exists and belongs to the user
    certification = await certifications_collection.find_one({
        "_id": certification_object_id,
        "user_id": ObjectId(current_user["user_id"])
    })
    
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )
    
    await certifications_collection.delete_one({"_id": certification_object_id})
    return None
