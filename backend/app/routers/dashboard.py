from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import List
import logging
from app.models.dashboard import (
    DashboardResponse,
    DashboardStats,
    RecentCustomResume,
    RecentPDF,
    ElementCounts,
    DashboardActivity
)
from app.middleware.auth_middleware import get_current_user
from app.database import (
    get_users_collection,
    get_custom_resumes_collection,
    get_headings_collection,
    get_educations_collection,
    get_experiences_collection,
    get_projects_collection,
    get_skills_collection,
    get_certifications_collection,
    get_awards_collection,
    get_volunteer_experiences_collection,
    get_ai_usage_logs_collection
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard data including stats, recent resumes, PDFs, element counts, and activity"""
    try:
        user_id = ObjectId(current_user["user_id"])
        
        # Get user document for stats
        users_collection = get_users_collection()
        user_doc = await users_collection.find_one({"_id": user_id})
        
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Extract user stats (exclude tokens_used from analytics)
        analytics = user_doc.get("analytics", {})
        credits = user_doc.get("credits", 0)
        max_resume = user_doc.get("max_resume", 2)
        ai_calls_count = analytics.get("ai_calls_count", 0)
        
        # Get custom resumes collection
        custom_resumes_collection = get_custom_resumes_collection()
        
        # Count total resumes
        resume_count = await custom_resumes_collection.count_documents({"user_id": user_id})
        
        # Count PDFs generated (custom resumes with cloudinary_url)
        pdfs_generated = await custom_resumes_collection.count_documents({
            "user_id": user_id,
            "cloudinary_url": {"$ne": None}
        })
        
        # Get recent custom resumes (last 10, sorted by updated_at desc)
        recent_resumes_cursor = custom_resumes_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(10)
        
        recent_resumes = []
        async for resume_doc in recent_resumes_cursor:
            recent_resumes.append(
                RecentCustomResume(
                    id=str(resume_doc["_id"]),
                    name=resume_doc.get("name", ""),
                    thumbnail_url=resume_doc.get("thumbnail_url"),
                    cloudinary_url=resume_doc.get("cloudinary_url"),
                    updated_at=resume_doc.get("updated_at", resume_doc.get("created_at")),
                    created_at=resume_doc.get("created_at")
                )
            )
        
        # Get recent PDFs (custom resumes with cloudinary_url, last 10, sorted by updated_at desc)
        recent_pdfs_cursor = custom_resumes_collection.find(
            {
                "user_id": user_id,
                "cloudinary_url": {"$ne": None}
            }
        ).sort("updated_at", -1).limit(10)
        
        recent_pdfs = []
        async for resume_doc in recent_pdfs_cursor:
            recent_pdfs.append(
                RecentPDF(
                    id=str(resume_doc["_id"]),
                    resume_name=resume_doc.get("name", ""),
                    cloudinary_url=resume_doc.get("cloudinary_url"),
                    thumbnail_url=resume_doc.get("thumbnail_url"),
                    generated_at=resume_doc.get("updated_at", resume_doc.get("created_at"))
                )
            )
        
        # Get element counts
        headings_count = await get_headings_collection().count_documents({"user_id": user_id})
        educations_count = await get_educations_collection().count_documents({"user_id": user_id})
        experiences_count = await get_experiences_collection().count_documents({"user_id": user_id})
        projects_count = await get_projects_collection().count_documents({"user_id": user_id})
        skills_count = await get_skills_collection().count_documents({"user_id": user_id})
        certifications_count = await get_certifications_collection().count_documents({"user_id": user_id})
        awards_count = await get_awards_collection().count_documents({"user_id": user_id})
        volunteers_count = await get_volunteer_experiences_collection().count_documents({"user_id": user_id})
        
        element_counts = ElementCounts(
            headings=headings_count,
            educations=educations_count,
            experiences=experiences_count,
            projects=projects_count,
            skills=skills_count,
            certifications=certifications_count,
            awards=awards_count,
            volunteers=volunteers_count
        )
        
        # Build activity feed
        recent_activity = []
        
        # Activity from custom resumes (creations and updates)
        activity_resumes_cursor = custom_resumes_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(20)
        
        async for resume_doc in activity_resumes_cursor:
            resume_id = str(resume_doc["_id"])
            resume_name = resume_doc.get("name", "")
            created_at = resume_doc.get("created_at")
            updated_at = resume_doc.get("updated_at", created_at)
            
            # Add creation activity
            recent_activity.append(
                DashboardActivity(
                    type="resume_created",
                    description=f"Created resume: {resume_name}",
                    timestamp=created_at,
                    resume_id=resume_id,
                    resume_name=resume_name
                )
            )
            
            # Add update activity if updated_at is different from created_at
            if updated_at and updated_at != created_at and resume_doc.get("cloudinary_url"):
                recent_activity.append(
                    DashboardActivity(
                        type="pdf_generated",
                        description=f"Generated PDF for: {resume_name}",
                        timestamp=updated_at,
                        resume_id=resume_id,
                        resume_name=resume_name
                    )
                )
        
        # Activity from AI usage logs (exclude tokens_used field using projection)
        ai_logs_collection = get_ai_usage_logs_collection()
        ai_activity_cursor = ai_logs_collection.find(
            {"user_id": user_id},
            {"tokens_used": 0}  # Exclude tokens_used from projection
        ).sort("created_at", -1).limit(20)
        
        async for log_doc in ai_activity_cursor:
            action_type = log_doc.get("action_type", "")
            section = log_doc.get("section", "")
            created_at = log_doc.get("created_at")
            
            # Create descriptive activity messages based on action type
            if action_type == "rephrase":
                description = f"Used AI to rephrase {section}"
            elif action_type == "generate_subpoints":
                description = f"Used AI to generate subpoints for {section}"
            elif action_type == "select_elements":
                description = f"Used AI to select resume elements"
            elif action_type == "extract_resume":
                description = f"Used AI to extract resume data"
            else:
                description = f"Used AI for {action_type} on {section}"
            
            recent_activity.append(
                DashboardActivity(
                    type="ai_used",
                    description=description,
                    timestamp=created_at
                )
            )
        
        # Sort all activities by timestamp (most recent first) and limit to 20
        recent_activity.sort(key=lambda x: x.timestamp, reverse=True)
        recent_activity = recent_activity[:20]
        
        # Build dashboard stats
        stats = DashboardStats(
            credits=credits,
            max_resume=max_resume,
            resume_count=resume_count,
            pdfs_generated=pdfs_generated,
            ai_calls_count=ai_calls_count
        )
        
        return DashboardResponse(
            stats=stats,
            recent_resumes=recent_resumes,
            recent_pdfs=recent_pdfs,
            element_counts=element_counts,
            recent_activity=recent_activity
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )
