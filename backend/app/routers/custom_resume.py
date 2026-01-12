from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List, Tuple
from bson import ObjectId
from datetime import datetime
import logging
import traceback
from app.models.custom_resume import CustomResumeCreate, CustomResumeUpdate, CustomResumeResponse, UserElementsResponse, SelectResumeElementsRequest, SelectResumeElementsResponse, SelectResumeElementsRequest, SelectResumeElementsResponse
from app.models.heading import HeadingResponse
from app.models.education import EducationResponse
from app.models.experience import ExperienceResponse
from app.models.project import ProjectResponse
from app.models.skill import SkillResponse
from app.models.volunteer import VolunteerResponse
from app.models.certification import CertificationResponse
from app.models.award import AwardResponse
from app.models.user import UserResponse
from app.middleware.auth_middleware import get_current_user
from app.database import (
    get_custom_resumes_collection,
    get_headings_collection,
    get_educations_collection,
    get_experiences_collection,
    get_projects_collection,
    get_skills_collection,
    get_volunteer_experiences_collection,
    get_certifications_collection,
    get_awards_collection,
    get_users_collection
)
from app.services.latex_generation_service import generate_latex_from_resume
from app.services.latex_service import compile_latex
from app.services.cloudinary_service import upload_latex_from_bytes, upload_pdf, upload_image_from_bytes
from app.services.pdf_extraction_service import convert_first_page_to_image
from app.services.openai_service import select_resume_elements_for_job
import tempfile
import os
import uuid
import shutil

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/custom-resume", tags=["Custom Resume"])


async def validate_referenced_ids(
    ids: List[str],
    collection,
    user_id: ObjectId,
    element_type: str
) -> List[ObjectId]:
    """Validate that all referenced IDs exist and belong to the user"""
    if not ids:
        return []
    
    object_ids = []
    for id_str in ids:
        try:
            object_ids.append(ObjectId(id_str))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {element_type} ID format: {id_str}"
            )
    
    # Check that all IDs exist and belong to the user
    cursor = collection.find({
        "_id": {"$in": object_ids},
        "user_id": user_id
    })
    found_docs = await cursor.to_list(length=None)
    found_ids = {doc["_id"] for doc in found_docs}
    
    # Check if any IDs are missing
    missing_ids = set(object_ids) - found_ids
    if missing_ids:
        missing_str = ", ".join(str(id) for id in missing_ids)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"One or more {element_type} IDs not found or do not belong to user: {missing_str}"
        )
    
    return object_ids


async def populate_references(
    resume_doc: dict,
    user_id: ObjectId
) -> dict:
    """Populate all referenced objects for a custom resume"""
    headings = []
    educations = []
    experiences = []
    projects = []
    skills = []
    volunteers = []
    certifications = []
    awards = []
    
    # Populate headings
    if resume_doc.get("heading_ids"):
        headings_collection = get_headings_collection()
        cursor = headings_collection.find({
            "_id": {"$in": resume_doc["heading_ids"]},
            "user_id": user_id
        })
        heading_docs = await cursor.to_list(length=None)
        headings = [
            HeadingResponse(
                id=str(heading["_id"]),
                user_id=str(heading["user_id"]),
                mobile=heading.get("mobile"),
                custom_links=heading.get("custom_links", []),
                created_at=heading["created_at"],
                updated_at=heading["updated_at"]
            )
            for heading in heading_docs
        ]
    
    # Populate educations
    if resume_doc.get("education_ids"):
        educations_collection = get_educations_collection()
        cursor = educations_collection.find({
            "_id": {"$in": resume_doc["education_ids"]},
            "user_id": user_id
        })
        education_docs = await cursor.to_list(length=None)
        educations = [
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
            for education in education_docs
        ]
    
    # Populate experiences
    if resume_doc.get("experience_ids"):
        experiences_collection = get_experiences_collection()
        cursor = experiences_collection.find({
            "_id": {"$in": resume_doc["experience_ids"]},
            "user_id": user_id
        })
        experience_docs = await cursor.to_list(length=None)
        experiences = [
            ExperienceResponse(
                id=str(experience["_id"]),
                user_id=str(experience["user_id"]),
                company=experience["company"],
                location=experience["location"],
                position=experience["position"],
                start_date=experience["start_date"],
                end_date=experience["end_date"],
                projects=experience.get("projects", []),
                created_at=experience["created_at"],
                updated_at=experience["updated_at"]
            )
            for experience in experience_docs
        ]
    
    # Populate projects
    if resume_doc.get("project_ids"):
        projects_collection = get_projects_collection()
        cursor = projects_collection.find({
            "_id": {"$in": resume_doc["project_ids"]},
            "user_id": user_id
        })
        project_docs = await cursor.to_list(length=None)
        projects = [
            ProjectResponse(
                id=str(project["_id"]),
                user_id=str(project["user_id"]),
                name=project["name"],
                start_date=project["start_date"],
                end_date=project["end_date"],
                tech_stack=project["tech_stack"],
                link=project.get("link"),
                link_label=project.get("link_label"),
                subpoints=project.get("subpoints", []),
                created_at=project["created_at"],
                updated_at=project["updated_at"]
            )
            for project in project_docs
        ]
    
    # Populate skills
    if resume_doc.get("skill_ids"):
        skills_collection = get_skills_collection()
        cursor = skills_collection.find({
            "_id": {"$in": resume_doc["skill_ids"]},
            "user_id": user_id
        })
        skill_docs = await cursor.to_list(length=None)
        skills = [
            SkillResponse(
                id=str(skill["_id"]),
                user_id=str(skill["user_id"]),
                category=skill["category"],
                items=skill["items"],
                created_at=skill["created_at"],
                updated_at=skill["updated_at"]
            )
            for skill in skill_docs
        ]
    
    # Populate volunteers
    if resume_doc.get("volunteer_ids"):
        volunteers_collection = get_volunteer_experiences_collection()
        cursor = volunteers_collection.find({
            "_id": {"$in": resume_doc["volunteer_ids"]},
            "user_id": user_id
        })
        volunteer_docs = await cursor.to_list(length=None)
        volunteers = [
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
            for volunteer in volunteer_docs
        ]
    
    # Populate certifications
    if resume_doc.get("certification_ids"):
        certifications_collection = get_certifications_collection()
        cursor = certifications_collection.find({
            "_id": {"$in": resume_doc["certification_ids"]},
            "user_id": user_id
        })
        certification_docs = await cursor.to_list(length=None)
        certifications = [
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
            for certification in certification_docs
        ]
    
    # Populate awards
    if resume_doc.get("award_ids"):
        awards_collection = get_awards_collection()
        cursor = awards_collection.find({
            "_id": {"$in": resume_doc["award_ids"]},
            "user_id": user_id
        })
        award_docs = await cursor.to_list(length=None)
        awards = [
            AwardResponse(
                id=str(award["_id"]),
                user_id=str(award["user_id"]),
                title=award["title"],
                date=award["date"],
                created_at=award["created_at"],
                updated_at=award["updated_at"]
            )
            for award in award_docs
        ]
    
    return {
        "headings": headings,
        "educations": educations,
        "experiences": experiences,
        "projects": projects,
        "skills": skills,
        "volunteers": volunteers,
        "certifications": certifications,
        "awards": awards
    }


@router.get("/", response_model=List[CustomResumeResponse])
async def get_custom_resumes(current_user: dict = Depends(get_current_user)):
    """Get all user's custom resumes"""
    custom_resumes_collection = get_custom_resumes_collection()
    user_id = ObjectId(current_user["user_id"])
    
    cursor = custom_resumes_collection.find({"user_id": user_id})
    resume_docs = await cursor.to_list(length=None)
    
    result = []
    for resume_doc in resume_docs:
        populated = await populate_references(resume_doc, user_id)
        result.append(
            CustomResumeResponse(
                id=str(resume_doc["_id"]),
                user_id=str(resume_doc["user_id"]),
                name=resume_doc["name"],
                headings=populated["headings"],
                educations=populated["educations"],
                experiences=populated["experiences"],
                projects=populated["projects"],
                skills=populated["skills"],
                volunteers=populated["volunteers"],
                certifications=populated["certifications"],
                awards=populated["awards"],
                latex_url=resume_doc.get("latex_url"),
                latex_public_id=resume_doc.get("latex_public_id"),
                cloudinary_url=resume_doc.get("cloudinary_url"),
                cloudinary_public_id=resume_doc.get("cloudinary_public_id"),
                pdf_url=resume_doc.get("cloudinary_url"),  # Alias for backward compatibility
                thumbnail_url=resume_doc.get("thumbnail_url"),
                thumbnail_public_id=resume_doc.get("thumbnail_public_id"),
                created_at=resume_doc["created_at"],
                updated_at=resume_doc["updated_at"]
            )
        )
    
    return result


@router.get("/user-elements", response_model=UserElementsResponse)
async def get_user_elements(current_user: dict = Depends(get_current_user)):
    """Get all resume elements for the authenticated user"""
    user_id = ObjectId(current_user["user_id"])
    elements = await fetch_all_user_elements(user_id)
    
    return UserElementsResponse(
        headings=elements["headings"],
        educations=elements["educations"],
        experiences=elements["experiences"],
        projects=elements["projects"],
        skills=elements["skills"],
        volunteers=elements["volunteers"],
        certifications=elements["certifications"],
        awards=elements["awards"]
    )


@router.get("/{resume_id}", response_model=CustomResumeResponse)
async def get_custom_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific custom resume by ID"""
    custom_resumes_collection = get_custom_resumes_collection()
    user_id = ObjectId(current_user["user_id"])
    
    try:
        resume_object_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid custom resume ID format"
        )
    
    resume_doc = await custom_resumes_collection.find_one({
        "_id": resume_object_id,
        "user_id": user_id
    })
    
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom resume not found"
        )
    
    populated = await populate_references(resume_doc, user_id)
    
    return CustomResumeResponse(
        id=str(resume_doc["_id"]),
        user_id=str(resume_doc["user_id"]),
        name=resume_doc["name"],
        headings=populated["headings"],
        educations=populated["educations"],
        experiences=populated["experiences"],
        projects=populated["projects"],
        skills=populated["skills"],
        volunteers=populated["volunteers"],
        certifications=populated["certifications"],
        awards=populated["awards"],
        latex_url=resume_doc.get("latex_url"),
        latex_public_id=resume_doc.get("latex_public_id"),
        cloudinary_url=resume_doc.get("cloudinary_url"),
        cloudinary_public_id=resume_doc.get("cloudinary_public_id"),
        pdf_url=resume_doc.get("cloudinary_url"),  # Alias for backward compatibility
        thumbnail_url=resume_doc.get("thumbnail_url"),
        thumbnail_public_id=resume_doc.get("thumbnail_public_id"),
        created_at=resume_doc["created_at"],
        updated_at=resume_doc["updated_at"]
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_custom_resume(
    resume_data: CustomResumeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new custom resume"""
    from app.services.credit_service import get_user_max_resume
    from app.utils.constants import INITIAL_MAX_RESUMES
    
    custom_resumes_collection = get_custom_resumes_collection()
    user_id = ObjectId(current_user["user_id"])
    user_id_str = current_user["user_id"]
    
    # Check max_resume limit
    try:
        max_resume = await get_user_max_resume(user_id_str)
    except HTTPException:
        # If user not found, use default
        max_resume = INITIAL_MAX_RESUMES
    
    # Count existing resumes for this user
    resume_count = await custom_resumes_collection.count_documents({"user_id": user_id})
    
    # Check if user has reached the limit
    if resume_count >= max_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum resume limit reached. You have {resume_count} resumes out of {max_resume} allowed. Purchase additional slots to create more resumes."
        )
    
    # Validate all referenced IDs
    heading_ids = await validate_referenced_ids(
        resume_data.heading_ids or [],
        get_headings_collection(),
        user_id,
        "heading"
    )
    education_ids = await validate_referenced_ids(
        resume_data.education_ids or [],
        get_educations_collection(),
        user_id,
        "education"
    )
    experience_ids = await validate_referenced_ids(
        resume_data.experience_ids or [],
        get_experiences_collection(),
        user_id,
        "experience"
    )
    project_ids = await validate_referenced_ids(
        resume_data.project_ids or [],
        get_projects_collection(),
        user_id,
        "project"
    )
    skill_ids = await validate_referenced_ids(
        resume_data.skill_ids or [],
        get_skills_collection(),
        user_id,
        "skill"
    )
    volunteer_ids = await validate_referenced_ids(
        resume_data.volunteer_ids or [],
        get_volunteer_experiences_collection(),
        user_id,
        "volunteer"
    )
    certification_ids = await validate_referenced_ids(
        resume_data.certification_ids or [],
        get_certifications_collection(),
        user_id,
        "certification"
    )
    award_ids = await validate_referenced_ids(
        resume_data.award_ids or [],
        get_awards_collection(),
        user_id,
        "award"
    )
    
    resume_doc = {
        "user_id": user_id,
        "name": resume_data.name,
        "heading_ids": heading_ids,
        "education_ids": education_ids,
        "experience_ids": experience_ids,
        "project_ids": project_ids,
        "skill_ids": skill_ids,
        "volunteer_ids": volunteer_ids,
        "certification_ids": certification_ids,
        "award_ids": award_ids,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await custom_resumes_collection.insert_one(resume_doc)
    resume_doc["_id"] = result.inserted_id
    resume_object_id = resume_doc["_id"]
    
    # Populate references for LaTeX generation
    populated = await populate_references(resume_doc, user_id)
    
    # Build CustomResumeResponse for PDF generation
    resume_response = CustomResumeResponse(
        id=str(resume_doc["_id"]),
        user_id=str(resume_doc["user_id"]),
        name=resume_doc["name"],
        headings=populated["headings"],
        educations=populated["educations"],
        experiences=populated["experiences"],
        projects=populated["projects"],
        skills=populated["skills"],
        volunteers=populated["volunteers"],
        certifications=populated["certifications"],
        awards=populated["awards"],
        latex_url=resume_doc.get("latex_url"),
        latex_public_id=resume_doc.get("latex_public_id"),
        cloudinary_url=resume_doc.get("cloudinary_url"),
        cloudinary_public_id=resume_doc.get("cloudinary_public_id"),
        pdf_url=resume_doc.get("cloudinary_url"),  # Alias for backward compatibility
        thumbnail_url=resume_doc.get("thumbnail_url"),
        thumbnail_public_id=resume_doc.get("thumbnail_public_id"),
        created_at=resume_doc["created_at"],
        updated_at=resume_doc["updated_at"]
    )
    
    # Fetch user data
    users_collection = get_users_collection()
    user_doc = await users_collection.find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        first_name=user_doc["first_name"],
        last_name=user_doc["last_name"],
        is_admin=user_doc.get("is_admin", False),
        is_verified=user_doc.get("is_verified", False),
        created_at=user_doc["created_at"]
    )
    
    # Generate PDF and upload to Cloudinary
    try:
        pdf_bytes, cloudinary_data = await generate_and_upload_resume_pdf(
            resume_response, user_data, resume_object_id, user_id
        )
        
        # Return PDF as Response
        filename = f"{resume_data.name.replace(' ', '_')}_resume.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        # Log the full traceback for debugging
        error_traceback = traceback.format_exc()
        logger.error(f"Error generating PDF in POST /api/custom-resume/: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.put("/{resume_id}")
async def update_custom_resume(
    resume_id: str,
    resume_data: CustomResumeUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific custom resume by ID"""
    custom_resumes_collection = get_custom_resumes_collection()
    user_id = ObjectId(current_user["user_id"])
    
    try:
        resume_object_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid custom resume ID format"
        )
    
    # Verify the custom resume exists and belongs to the user
    resume_doc = await custom_resumes_collection.find_one({
        "_id": resume_object_id,
        "user_id": user_id
    })
    
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom resume not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if resume_data.name is not None:
        update_data["name"] = resume_data.name
    
    # Validate and update each array if provided
    if resume_data.heading_ids is not None:
        update_data["heading_ids"] = await validate_referenced_ids(
            resume_data.heading_ids,
            get_headings_collection(),
            user_id,
            "heading"
        )
    
    if resume_data.education_ids is not None:
        update_data["education_ids"] = await validate_referenced_ids(
            resume_data.education_ids,
            get_educations_collection(),
            user_id,
            "education"
        )
    
    if resume_data.experience_ids is not None:
        update_data["experience_ids"] = await validate_referenced_ids(
            resume_data.experience_ids,
            get_experiences_collection(),
            user_id,
            "experience"
        )
    
    if resume_data.project_ids is not None:
        update_data["project_ids"] = await validate_referenced_ids(
            resume_data.project_ids,
            get_projects_collection(),
            user_id,
            "project"
        )
    
    if resume_data.skill_ids is not None:
        update_data["skill_ids"] = await validate_referenced_ids(
            resume_data.skill_ids,
            get_skills_collection(),
            user_id,
            "skill"
        )
    
    if resume_data.volunteer_ids is not None:
        update_data["volunteer_ids"] = await validate_referenced_ids(
            resume_data.volunteer_ids,
            get_volunteer_experiences_collection(),
            user_id,
            "volunteer"
        )
    
    if resume_data.certification_ids is not None:
        update_data["certification_ids"] = await validate_referenced_ids(
            resume_data.certification_ids,
            get_certifications_collection(),
            user_id,
            "certification"
        )
    
    if resume_data.award_ids is not None:
        update_data["award_ids"] = await validate_referenced_ids(
            resume_data.award_ids,
            get_awards_collection(),
            user_id,
            "award"
        )
    
    await custom_resumes_collection.update_one(
        {"_id": resume_object_id},
        {"$set": update_data}
    )
    
    updated = await custom_resumes_collection.find_one({"_id": resume_object_id})
    populated = await populate_references(updated, user_id)
    
    # Build CustomResumeResponse for PDF generation
    resume_response = CustomResumeResponse(
        id=str(updated["_id"]),
        user_id=str(updated["user_id"]),
        name=updated["name"],
        headings=populated["headings"],
        educations=populated["educations"],
        experiences=populated["experiences"],
        projects=populated["projects"],
        skills=populated["skills"],
        volunteers=populated["volunteers"],
        certifications=populated["certifications"],
        awards=populated["awards"],
        latex_url=updated.get("latex_url"),
        latex_public_id=updated.get("latex_public_id"),
        cloudinary_url=updated.get("cloudinary_url"),
        cloudinary_public_id=updated.get("cloudinary_public_id"),
        pdf_url=updated.get("cloudinary_url"),  # Alias for backward compatibility
        thumbnail_url=updated.get("thumbnail_url"),
        thumbnail_public_id=updated.get("thumbnail_public_id"),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )
    
    # Fetch user data
    users_collection = get_users_collection()
    user_doc = await users_collection.find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        first_name=user_doc["first_name"],
        last_name=user_doc["last_name"],
        is_admin=user_doc.get("is_admin", False),
        is_verified=user_doc.get("is_verified", False),
        created_at=user_doc["created_at"]
    )
    
    # Generate PDF and upload to Cloudinary
    try:
        pdf_bytes, cloudinary_data = await generate_and_upload_resume_pdf(
            resume_response, user_data, resume_object_id, user_id
        )
        
        # Return PDF as Response
        filename = f"{updated['name'].replace(' ', '_')}_resume.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        # Log the full traceback for debugging
        error_traceback = traceback.format_exc()
        logging.error(f"Error generating PDF in PUT /api/custom-resume/{resume_id}: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific custom resume by ID"""
    custom_resumes_collection = get_custom_resumes_collection()
    user_id = ObjectId(current_user["user_id"])
    
    try:
        resume_object_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid custom resume ID format"
        )
    
    # Verify the custom resume exists and belongs to the user
    resume_doc = await custom_resumes_collection.find_one({
        "_id": resume_object_id,
        "user_id": user_id
    })
    
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom resume not found"
        )
    
    await custom_resumes_collection.delete_one({"_id": resume_object_id})
    return None


@router.post("/{resume_id}/generate-pdf")
async def generate_pdf(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate PDF from custom resume by compiling LaTeX template"""
    custom_resumes_collection = get_custom_resumes_collection()
    users_collection = get_users_collection()
    user_id = ObjectId(current_user["user_id"])
    
    # Validate resume_id
    try:
        resume_object_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid custom resume ID format"
        )
    
    # Fetch custom resume
    resume_doc = await custom_resumes_collection.find_one({
        "_id": resume_object_id,
        "user_id": user_id
    })
    
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom resume not found"
        )
    
    # Populate references
    populated = await populate_references(resume_doc, user_id)
    
    # Build CustomResumeResponse
    resume_data = CustomResumeResponse(
        id=str(resume_doc["_id"]),
        user_id=str(resume_doc["user_id"]),
        name=resume_doc["name"],
        headings=populated["headings"],
        educations=populated["educations"],
        experiences=populated["experiences"],
        projects=populated["projects"],
        skills=populated["skills"],
        volunteers=populated["volunteers"],
        certifications=populated["certifications"],
        awards=populated["awards"],
        latex_url=resume_doc.get("latex_url"),
        latex_public_id=resume_doc.get("latex_public_id"),
        cloudinary_url=resume_doc.get("cloudinary_url"),
        cloudinary_public_id=resume_doc.get("cloudinary_public_id"),
        pdf_url=resume_doc.get("cloudinary_url"),  # Alias for backward compatibility
        thumbnail_url=resume_doc.get("thumbnail_url"),
        thumbnail_public_id=resume_doc.get("thumbnail_public_id"),
        created_at=resume_doc["created_at"],
        updated_at=resume_doc["updated_at"]
    )
    
    # Fetch user data
    user_doc = await users_collection.find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        first_name=user_doc["first_name"],
        last_name=user_doc["last_name"],
        is_admin=user_doc.get("is_admin", False),
        is_verified=user_doc.get("is_verified", False),
        created_at=user_doc["created_at"]
    )
    
    # Generate PDF and upload to Cloudinary using helper function
    try:
        pdf_bytes, cloudinary_data = await generate_and_upload_resume_pdf(
            resume_data, user_data, resume_object_id, user_id
        )
        
        # Return PDF as Response
        filename = f"{resume_data.name.replace(' ', '_')}_resume.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        # Log the full traceback for debugging
        error_traceback = traceback.format_exc()
        logger.error(f"Error generating PDF in POST /api/custom-resume/{resume_id}/generate-pdf: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post("/select-elements", response_model=SelectResumeElementsResponse)
async def select_resume_elements(
    request: SelectResumeElementsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Use AI to select relevant resume elements based on job description"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id_str = current_user["user_id"]
    user_id = ObjectId(user_id_str)
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id_str, CREDIT_COSTS.SELECT_RESUME_ELEMENTS)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    try:
        # Fetch all user's projects, awards, certifications, and volunteers
        projects_collection = get_projects_collection()
        awards_collection = get_awards_collection()
        certifications_collection = get_certifications_collection()
        volunteers_collection = get_volunteer_experiences_collection()
        
        # Fetch all elements for the user
        projects_cursor = projects_collection.find({"user_id": user_id})
        awards_cursor = awards_collection.find({"user_id": user_id})
        certifications_cursor = certifications_collection.find({"user_id": user_id})
        volunteers_cursor = volunteers_collection.find({"user_id": user_id})
        
        projects = await projects_cursor.to_list(length=None)
        awards = await awards_cursor.to_list(length=None)
        certifications = await certifications_cursor.to_list(length=None)
        volunteers = await volunteers_cursor.to_list(length=None)
        
        # Check if user has any elements
        if not projects and not awards and not certifications and not volunteers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No resume elements found. Please add projects, awards, certifications, or volunteer experiences first."
            )
        
        # Call AI service to select elements
        try:
            selected_ids, tokens_used = await select_resume_elements_for_job(
                user_id_str,
                request.job_description,
                projects,
                awards,
                certifications,
                volunteers
            )
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error(f"Error selecting resume elements with AI: {str(e)}\n{error_traceback}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to select resume elements: {str(e)}"
            )
        
        return SelectResumeElementsResponse(
            project_ids=selected_ids.get("project_ids", []),
            award_ids=selected_ids.get("award_ids", []),
            certification_ids=selected_ids.get("certification_ids", []),
            volunteer_ids=selected_ids.get("volunteer_ids", []),
            tokens_used=tokens_used
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error in select_resume_elements route: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process request: {str(e)}"
        )


async def generate_and_upload_resume_pdf(
    resume_data: CustomResumeResponse,
    user_data: UserResponse,
    resume_object_id: ObjectId,
    user_id: ObjectId
) -> Tuple[bytes, dict]:
    """
    Generate LaTeX, compile to PDF, upload to Cloudinary, and return PDF bytes and Cloudinary data.
    
    Returns:
        tuple: (pdf_bytes, cloudinary_data) where cloudinary_data contains:
            - latex_url, latex_public_id
            - cloudinary_url (PDF), cloudinary_public_id (PDF)
            - thumbnail_url, thumbnail_public_id
    """
    custom_resumes_collection = get_custom_resumes_collection()
    
    # Generate LaTeX
    try:
        logger.info(f"Generating LaTeX for resume {resume_data.id}")
        latex_content = generate_latex_from_resume(resume_data, user_data)
        logger.info(f"LaTeX generated successfully, length: {len(latex_content)}")
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error generating LaTeX: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate LaTeX: {str(e)}"
        )
    
    # Create temporary directory for LaTeX compilation
    temp_dir = None
    latex_file_path = None
    pdf_file_path = None
    
    try:
        temp_dir = tempfile.mkdtemp()
        latex_filename = f"resume_{uuid.uuid4()}.tex"
        pdf_filename = f"resume_{uuid.uuid4()}"
        latex_file_path = os.path.join(temp_dir, latex_filename)
        pdf_file_path = os.path.join(temp_dir, f"{pdf_filename}.pdf")
        
        # Write LaTeX to file
        with open(latex_file_path, "w", encoding="utf-8") as f:
            f.write(latex_content)
        
        # Compile LaTeX to PDF
        try:
            logger.info(f"Compiling LaTeX to PDF: {latex_file_path}")
            compiled_pdf_path = compile_latex(latex_file_path, pdf_filename, temp_dir)
            if not compiled_pdf_path or not os.path.exists(compiled_pdf_path):
                logger.error(f"LaTeX compilation failed: PDF not found at {compiled_pdf_path}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="LaTeX compilation failed: PDF was not generated"
                )
            pdf_file_path = compiled_pdf_path
            logger.info(f"PDF compiled successfully: {pdf_file_path}")
        except HTTPException:
            raise
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error(f"LaTeX compilation error: {str(e)}\n{error_traceback}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"LaTeX compilation failed: {str(e)}"
            )
        
        # Convert first page to image for thumbnail
        thumbnail_bytes = None
        try:
            thumbnail_bytes = convert_first_page_to_image(pdf_file_path, zoom=2.0)
        except Exception as e:
            # Log but don't fail if thumbnail generation fails
            print(f"Warning: Failed to generate thumbnail: {str(e)}")
        
        # Upload LaTeX to Cloudinary
        latex_url = None
        latex_public_id = None
        try:
            logger.info("Uploading LaTeX to Cloudinary")
            latex_bytes = latex_content.encode("utf-8")
            latex_filename_cloud = f"{uuid.uuid4()}.tex"
            latex_result = await upload_latex_from_bytes(latex_bytes, str(user_id), latex_filename_cloud)
            latex_url = latex_result["url"]
            latex_public_id = latex_result["public_id"]
            logger.info(f"LaTeX uploaded successfully: {latex_url}")
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error(f"Error uploading LaTeX to Cloudinary: {str(e)}\n{error_traceback}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload LaTeX to Cloudinary: {str(e)}"
            )
        
        # Upload PDF to Cloudinary
        cloudinary_url = None
        cloudinary_public_id = None
        try:
            logger.info(f"Uploading PDF to Cloudinary: {pdf_file_path}")
            pdf_filename_cloud = f"{uuid.uuid4()}.pdf"
            pdf_result = await upload_pdf(pdf_file_path, str(user_id), pdf_filename_cloud)
            cloudinary_url = pdf_result["url"]
            cloudinary_public_id = pdf_result["public_id"]
            logger.info(f"PDF uploaded successfully: {cloudinary_url}")
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error(f"Error uploading PDF to Cloudinary: {str(e)}\n{error_traceback}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload PDF to Cloudinary: {str(e)}"
            )
        
        # Upload thumbnail to Cloudinary
        thumbnail_url = None
        thumbnail_public_id = None
        if thumbnail_bytes:
            try:
                thumbnail_filename_cloud = f"{uuid.uuid4()}.png"
                thumbnail_result = await upload_image_from_bytes(thumbnail_bytes, str(user_id), thumbnail_filename_cloud)
                thumbnail_url = thumbnail_result["url"]
                thumbnail_public_id = thumbnail_result["public_id"]
            except Exception as e:
                # Log but don't fail if thumbnail upload fails
                print(f"Warning: Failed to upload thumbnail to Cloudinary: {str(e)}")
        
        # Update custom resume document with URLs and public IDs
        update_data = {
            "latex_url": latex_url,
            "latex_public_id": latex_public_id,
            "cloudinary_url": cloudinary_url,
            "cloudinary_public_id": cloudinary_public_id,
            "thumbnail_url": thumbnail_url,
            "thumbnail_public_id": thumbnail_public_id,
            "updated_at": datetime.utcnow()
        }
        
        await custom_resumes_collection.update_one(
            {"_id": resume_object_id},
            {"$set": update_data}
        )
        
        # Read PDF bytes for response
        with open(pdf_file_path, "rb") as f:
            pdf_bytes = f.read()
        
        cloudinary_data = {
            "latex_url": latex_url,
            "latex_public_id": latex_public_id,
            "cloudinary_url": cloudinary_url,
            "cloudinary_public_id": cloudinary_public_id,
            "thumbnail_url": thumbnail_url,
            "thumbnail_public_id": thumbnail_public_id
        }
        
        return pdf_bytes, cloudinary_data
    
    finally:
        # Clean up temporary files
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Warning: Failed to clean up temporary directory: {str(e)}")


async def fetch_all_user_elements(user_id: ObjectId) -> dict:
    """Fetch all resume elements for a user"""
    headings = []
    educations = []
    experiences = []
    projects = []
    skills = []
    volunteers = []
    certifications = []
    awards = []
    
    # Fetch headings
    headings_collection = get_headings_collection()
    cursor = headings_collection.find({"user_id": user_id})
    heading_docs = await cursor.to_list(length=None)
    headings = [
        HeadingResponse(
            id=str(heading["_id"]),
            user_id=str(heading["user_id"]),
            mobile=heading.get("mobile"),
            custom_links=heading.get("custom_links", []),
            created_at=heading["created_at"],
            updated_at=heading["updated_at"]
        )
        for heading in heading_docs
    ]
    
    # Fetch educations
    educations_collection = get_educations_collection()
    cursor = educations_collection.find({"user_id": user_id})
    education_docs = await cursor.to_list(length=None)
    educations = [
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
        for education in education_docs
    ]
    
    # Fetch experiences
    experiences_collection = get_experiences_collection()
    cursor = experiences_collection.find({"user_id": user_id})
    experience_docs = await cursor.to_list(length=None)
    experiences = [
        ExperienceResponse(
            id=str(experience["_id"]),
            user_id=str(experience["user_id"]),
            company=experience["company"],
            location=experience["location"],
            position=experience["position"],
            start_date=experience["start_date"],
            end_date=experience["end_date"],
            projects=experience.get("projects", []),
            created_at=experience["created_at"],
            updated_at=experience["updated_at"]
        )
        for experience in experience_docs
    ]
    
    # Fetch projects
    projects_collection = get_projects_collection()
    cursor = projects_collection.find({"user_id": user_id})
    project_docs = await cursor.to_list(length=None)
    projects = [
        ProjectResponse(
            id=str(project["_id"]),
            user_id=str(project["user_id"]),
            name=project["name"],
            start_date=project["start_date"],
            end_date=project["end_date"],
            tech_stack=project["tech_stack"],
            link=project.get("link"),
            link_label=project.get("link_label"),
            subpoints=project.get("subpoints", []),
            created_at=project["created_at"],
            updated_at=project["updated_at"]
        )
        for project in project_docs
    ]
    
    # Fetch skills
    skills_collection = get_skills_collection()
    cursor = skills_collection.find({"user_id": user_id})
    skill_docs = await cursor.to_list(length=None)
    skills = [
        SkillResponse(
            id=str(skill["_id"]),
            user_id=str(skill["user_id"]),
            category=skill["category"],
            items=skill["items"],
            created_at=skill["created_at"],
            updated_at=skill["updated_at"]
        )
        for skill in skill_docs
    ]
    
    # Fetch volunteers
    volunteers_collection = get_volunteer_experiences_collection()
    cursor = volunteers_collection.find({"user_id": user_id})
    volunteer_docs = await cursor.to_list(length=None)
    volunteers = [
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
        for volunteer in volunteer_docs
    ]
    
    # Fetch certifications
    certifications_collection = get_certifications_collection()
    cursor = certifications_collection.find({"user_id": user_id})
    certification_docs = await cursor.to_list(length=None)
    certifications = [
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
        for certification in certification_docs
    ]
    
    # Fetch awards
    awards_collection = get_awards_collection()
    cursor = awards_collection.find({"user_id": user_id})
    award_docs = await cursor.to_list(length=None)
    awards = [
        AwardResponse(
            id=str(award["_id"]),
            user_id=str(award["user_id"]),
            title=award["title"],
            date=award["date"],
            created_at=award["created_at"],
            updated_at=award["updated_at"]
        )
        for award in award_docs
    ]
    
    return {
        "headings": headings,
        "educations": educations,
        "experiences": experiences,
        "projects": projects,
        "skills": skills,
        "volunteers": volunteers,
        "certifications": certifications,
        "awards": awards
    }
