from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models.custom_resume import CustomResumeCreate, CustomResumeUpdate, CustomResumeResponse, UserElementsResponse
from app.models.heading import HeadingResponse
from app.models.education import EducationResponse
from app.models.experience import ExperienceResponse
from app.models.project import ProjectResponse
from app.models.skill import SkillResponse
from app.models.volunteer import VolunteerResponse
from app.models.certification import CertificationResponse
from app.models.award import AwardResponse
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
    get_awards_collection
)

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
        created_at=resume_doc["created_at"],
        updated_at=resume_doc["updated_at"]
    )


@router.post("/", response_model=CustomResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_resume(
    resume_data: CustomResumeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new custom resume"""
    custom_resumes_collection = get_custom_resumes_collection()
    user_id = ObjectId(current_user["user_id"])
    
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
    
    # Populate references for response
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
        created_at=resume_doc["created_at"],
        updated_at=resume_doc["updated_at"]
    )


@router.put("/{resume_id}", response_model=CustomResumeResponse)
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
    
    return CustomResumeResponse(
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
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
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
