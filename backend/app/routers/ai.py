from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from app.models.ai import (
    GenerateSubpointsRequest,
    GenerateSubpointsResponse,
    RephraseTitleRequest,
    RephraseTitleResponse,
    RephraseSubpointsRequest,
    RephraseSubpointsResponse,
    ExtractResumeResponse,
    SaveExtractedResumeRequest,
    SaveExtractedResumeResponse,
    ExtractedResumeData,
    RephraseExperienceProjectRequest,
    RephraseExperienceProjectResponse,
    RephraseProjectSubpointsRequest,
    RephraseProjectSubpointsResponse,
    RephraseVolunteerDescriptionRequest,
    RephraseVolunteerDescriptionResponse
)
from app.models.uploaded_resume import UploadedResumeResponse
from app.services.openai_service import (
    generate_subpoints,
    rephrase_title,
    rephrase_subpoints,
    rephrase_experience_project_description,
    rephrase_project_subpoints,
    rephrase_volunteer_description,
    log_ai_usage
)
from app.services.pdf_extraction_service import extract_text_from_pdf, extract_resume_data_with_openai, convert_first_page_to_image
from app.services.cloudinary_service import upload_pdf_from_bytes, upload_image_from_bytes
from app.services.resume_save_service import save_extracted_resume_data
from app.middleware.auth_middleware import get_current_user
from app.database import get_uploaded_resumes_collection
from bson import ObjectId
from datetime import datetime
import tempfile
import os
import uuid

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/generate-subpoints", response_model=GenerateSubpointsResponse)
async def generate_subpoints_endpoint(
    request: GenerateSubpointsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate subpoints for a project or experience"""
    try:
        subpoints, tokens_used = await generate_subpoints(
            request.section,
            request.item_id,
            current_user["user_id"],
            request.tech_stack,
            request.name
        )
        return GenerateSubpointsResponse(
            subpoints=subpoints,
            tokens_used=tokens_used
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/rephrase-title", response_model=RephraseTitleResponse)
async def rephrase_title_endpoint(
    request: RephraseTitleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rephrase a title for better impact"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id = current_user["user_id"]
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id, CREDIT_COSTS.REPHRASE)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    try:
        rephrased_title, tokens_used = await rephrase_title(
            request.section,
            request.item_id,
            user_id,
            request.current_title
        )
        return RephraseTitleResponse(
            rephrased_title=rephrased_title,
            tokens_used=tokens_used
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/rephrase-subpoints", response_model=RephraseSubpointsResponse)
async def rephrase_subpoints_endpoint(
    request: RephraseSubpointsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rephrase subpoints for clarity and professionalism"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id = current_user["user_id"]
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id, CREDIT_COSTS.REPHRASE)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    try:
        rephrased_subpoints, tokens_used = await rephrase_subpoints(
            request.section,
            request.item_id,
            user_id,
            request.subpoints
        )
        return RephraseSubpointsResponse(
            rephrased_subpoints=rephrased_subpoints,
            tokens_used=tokens_used
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/extract-resume", response_model=ExtractResumeResponse)
async def extract_resume_endpoint(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Extract structured resume data from uploaded PDF"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id = current_user["user_id"]
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id, CREDIT_COSTS.EXTRACT_RESUME)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    # Validate file is PDF
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF"
        )
    
    temp_file_path = None
    try:
        # Read file content
        file_bytes = await file.read()
        
        # Create temporary file for pdfplumber
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(file_bytes)
            temp_file_path = temp_file.name
        
        # Extract text from PDF
        try:
            pdf_text = extract_text_from_pdf(temp_file_path)
            if not pdf_text or not pdf_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not extract text from PDF. The PDF might be empty or corrupted."
                )
        except HTTPException:
            raise  # Re-raise HTTPException as-is
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )
        
        # Extract structured data using OpenAI
        try:
            extracted_data, tokens_used = await extract_resume_data_with_openai(pdf_text)
        except HTTPException:
            raise  # Re-raise HTTPException as-is
        except Exception as e:
            # Check if it's a validation error (422) or general error (500)
            error_msg = str(e)
            if "validation" in error_msg.lower() or "validate" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Failed to validate extracted resume data: {error_msg}"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract resume data with OpenAI: {error_msg}"
            )
        
        # Only proceed with Cloudinary and DB if OpenAI extraction succeeded
        filename = f"{uuid.uuid4()}.pdf"
        
        # Upload PDF to Cloudinary
        try:
            cloudinary_result = await upload_pdf_from_bytes(file_bytes, user_id, filename)
            cloudinary_url = cloudinary_result["url"]
            cloudinary_public_id = cloudinary_result["public_id"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload PDF to Cloudinary: {str(e)}"
            )
        
        # Generate and upload thumbnail
        thumbnail_url = None
        thumbnail_public_id = None
        try:
            # Convert first page to image
            thumbnail_bytes = convert_first_page_to_image(temp_file_path, zoom=2.0)
            
            # Upload thumbnail to Cloudinary
            thumbnail_filename = f"{uuid.uuid4()}.png"
            thumbnail_result = await upload_image_from_bytes(thumbnail_bytes, user_id, thumbnail_filename)
            thumbnail_url = thumbnail_result["url"]
            thumbnail_public_id = thumbnail_result["public_id"]
        except Exception as e:
            # Log error but don't fail the entire request if thumbnail generation fails
            # Thumbnail is optional for UX, not critical for functionality
            print(f"Warning: Failed to generate thumbnail: {str(e)}")
        
        # Log AI usage and update user tokens
        try:
            await log_ai_usage(user_id, "extract_resume", "resume", "temp", tokens_used)
        except Exception as e:
            # Log error but don't fail the request if logging fails
            print(f"Warning: Failed to log AI usage: {str(e)}")
        
        # Save extraction record to database
        try:
            uploaded_resumes_collection = get_uploaded_resumes_collection()
            # Convert Pydantic model to dict for storage
            extracted_data_dict = extracted_data.model_dump()
            
            result = await uploaded_resumes_collection.insert_one({
                "user_id": ObjectId(user_id),
                "cloudinary_url": cloudinary_url,
                "cloudinary_public_id": cloudinary_public_id,
                "thumbnail_url": thumbnail_url,
                "thumbnail_public_id": thumbnail_public_id,
                "extracted_data": extracted_data_dict,
                "tokens_used": tokens_used,
                "uploaded_at": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            extraction_id = str(result.inserted_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save extraction record to database: {str(e)}"
            )
        
        return ExtractResumeResponse(
            extracted_data=extracted_data,
            extraction_id=extraction_id,
            resume_url=cloudinary_url,
            thumbnail_url=thumbnail_url or "",  # Return empty string if thumbnail generation failed
            tokens_used=tokens_used
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass  # Ignore cleanup errors

@router.post("/save-extracted-resume", response_model=SaveExtractedResumeResponse, status_code=status.HTTP_201_CREATED)
async def save_extracted_resume_endpoint(
    request: SaveExtractedResumeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save extracted resume data to database collections"""
    try:
        result = await save_extracted_resume_data(
            request.extracted_data,
            current_user["user_id"]
        )
        
        return SaveExtractedResumeResponse(
            heading_id=result.get("heading_id"),
            experience_ids=result.get("experience_ids", []),
            project_ids=result.get("project_ids", []),
            education_ids=result.get("education_ids", []),
            skill_ids=result.get("skill_ids", []),
            certification_ids=result.get("certification_ids", []),
            award_ids=result.get("award_ids", []),
            volunteer_ids=result.get("volunteer_ids", []),
            message="Resume data saved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save resume data: {str(e)}"
        )

@router.get("/uploaded-resumes", response_model=List[UploadedResumeResponse])
async def get_uploaded_resumes(
    current_user: dict = Depends(get_current_user)
):
    """Get all uploaded resumes for the current user"""
    try:
        uploaded_resumes_collection = get_uploaded_resumes_collection()
        user_id = current_user["user_id"]
        
        # Find all uploaded resumes for the user, sorted by most recent first
        cursor = uploaded_resumes_collection.find(
            {"user_id": ObjectId(user_id)}
        ).sort("uploaded_at", -1)
        
        resumes = await cursor.to_list(length=None)
        
        # Convert to response models
        result = []
        for resume in resumes:
            # Convert extracted_data dict back to ExtractedResumeData model
            extracted_data = ExtractedResumeData(**resume["extracted_data"])
            
            result.append(
                UploadedResumeResponse(
                    id=str(resume["_id"]),
                    user_id=str(resume["user_id"]),
                    cloudinary_url=resume["cloudinary_url"],
                    cloudinary_public_id=resume["cloudinary_public_id"],
                    thumbnail_url=resume.get("thumbnail_url"),
                    thumbnail_public_id=resume.get("thumbnail_public_id"),
                    extracted_data=extracted_data,
                    tokens_used=resume.get("tokens_used", 0),
                    uploaded_at=resume["uploaded_at"],
                    created_at=resume["created_at"],
                    updated_at=resume["updated_at"]
                )
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch uploaded resumes: {str(e)}"
        )

@router.post("/rephrase-experience-project", response_model=RephraseExperienceProjectResponse)
async def rephrase_experience_project_endpoint(
    request: RephraseExperienceProjectRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rephrase an experience project description to be resume-friendly"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id = current_user["user_id"]
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id, CREDIT_COSTS.REPHRASE)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    try:
        rephrased_description, tokens_used = await rephrase_experience_project_description(
            user_id,
            request.title,
            request.current_description,
            request.validation_rule
        )
        return RephraseExperienceProjectResponse(
            rephrased_description=rephrased_description,
            tokens_used=tokens_used
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rephrase experience project description: {str(e)}"
        )

@router.post("/rephrase-project-subpoints", response_model=RephraseProjectSubpointsResponse)
async def rephrase_project_subpoints_endpoint(
    request: RephraseProjectSubpointsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rephrase project subpoints to be resume-friendly"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id = current_user["user_id"]
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id, CREDIT_COSTS.REPHRASE)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    try:
        rephrased_subpoints, tokens_used = await rephrase_project_subpoints(
            user_id,
            request.title,
            request.current_subpoints,
            request.other_subpoints,
            request.validation_rule
        )
        return RephraseProjectSubpointsResponse(
            rephrased_subpoints=rephrased_subpoints,
            tokens_used=tokens_used
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rephrase project subpoints: {str(e)}"
        )

@router.post("/rephrase-volunteer-description", response_model=RephraseVolunteerDescriptionResponse)
async def rephrase_volunteer_description_endpoint(
    request: RephraseVolunteerDescriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rephrase a volunteer description to be resume-friendly"""
    from app.services.credit_service import deduct_credits
    from app.utils.constants import CREDIT_COSTS
    
    user_id = current_user["user_id"]
    
    # Deduct credits before processing
    try:
        await deduct_credits(user_id, CREDIT_COSTS.REPHRASE)
    except HTTPException:
        raise  # Re-raise HTTPException (insufficient credits)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process credits: {str(e)}"
        )
    
    try:
        rephrased_description, tokens_used = await rephrase_volunteer_description(
            user_id,
            request.title,
            request.current_description,
            request.validation_rule
        )
        return RephraseVolunteerDescriptionResponse(
            rephrased_description=rephrased_description,
            tokens_used=tokens_used
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rephrase volunteer description: {str(e)}"
        )

