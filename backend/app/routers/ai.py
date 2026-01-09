from fastapi import APIRouter, Depends, HTTPException, status
from app.models.ai import (
    GenerateSubpointsRequest,
    GenerateSubpointsResponse,
    RephraseTitleRequest,
    RephraseTitleResponse,
    RephraseSubpointsRequest,
    RephraseSubpointsResponse
)
from app.services.openai_service import generate_subpoints, rephrase_title, rephrase_subpoints
from app.middleware.auth_middleware import get_current_user

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
    try:
        rephrased_title, tokens_used = await rephrase_title(
            request.section,
            request.item_id,
            current_user["user_id"],
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
    try:
        rephrased_subpoints, tokens_used = await rephrase_subpoints(
            request.section,
            request.item_id,
            current_user["user_id"],
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

