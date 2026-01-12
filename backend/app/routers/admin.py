from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.admin import (
    AdminUsersResponse,
    AdminStatsResponse,
    AdminUserDetailResponse,
    AdminAIUsageResponse,
    AdminPDFStatsResponse,
    PlatformStats,
    AIUsageStats,
    PDFStats,
    CreateAdminRequest,
    CreateAdminResponse,
    UpdateCreditsRequest,
    UpdateCreditsResponse,
    RevokeUserResponse,
    UnrevokeUserResponse,
    DeleteUserResponse
)
from app.models.user import UserWithAnalytics, UserAnalytics
from app.middleware.auth_middleware import get_current_admin_user
from app.database import (
    get_users_collection,
    get_ai_usage_logs_collection,
    get_pdf_history_collection
)
from app.services.admin_service import (
    create_admin,
    delete_user,
    revoke_user,
    unrevoke_user,
    update_user_credits
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/users", response_model=AdminUsersResponse)
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_admin_user)
):
    """Get all users with analytics"""
    users_collection = get_users_collection()
    
    cursor = users_collection.find().skip(skip).limit(limit)
    users = []
    
    async for user in cursor:
        analytics = user.get("analytics", {})
        user_analytics = UserAnalytics(
            ai_calls_count=analytics.get("ai_calls_count", 0),
            pdfs_generated_count=analytics.get("pdfs_generated_count", 0),
            pdfs_downloaded_count=analytics.get("pdfs_downloaded_count", 0),
            tokens_used=analytics.get("tokens_used", 0),
            last_ai_call_at=analytics.get("last_ai_call_at"),
            last_pdf_generated_at=analytics.get("last_pdf_generated_at")
        )
        
        users.append(UserWithAnalytics(
            id=str(user["_id"]),
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            is_admin=user.get("is_admin", False),
            is_verified=user.get("is_verified", False),
            is_revoked=user.get("is_revoked", False),
            credits=user.get("credits", 0),
            max_resume=user.get("max_resume", 2),
            created_at=user["created_at"],
            analytics=user_analytics
        ))
    
    total = await users_collection.count_documents({})
    
    return AdminUsersResponse(users=users, total=total)

@router.get("/stats", response_model=AdminStatsResponse)
async def get_platform_stats(current_user: dict = Depends(get_current_admin_user)):
    """Get overall platform statistics"""
    users_collection = get_users_collection()
    ai_logs_collection = get_ai_usage_logs_collection()
    pdf_history_collection = get_pdf_history_collection()
    
    total_users = await users_collection.count_documents({})
    
    # Calculate total AI calls and tokens
    total_ai_calls = await ai_logs_collection.count_documents({})
    ai_cursor = ai_logs_collection.find({}, {"tokens_used": 1})
    total_tokens = sum([doc.get("tokens_used", 0) async for doc in ai_cursor])
    
    # Calculate PDF stats
    total_pdfs_generated = await pdf_history_collection.count_documents({})
    total_pdfs_downloaded = await pdf_history_collection.count_documents({"downloaded_at": {"$ne": None}})
    
    # Active users (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = await users_collection.count_documents({
        "$or": [
            {"analytics.last_ai_call_at": {"$gte": thirty_days_ago}},
            {"analytics.last_pdf_generated_at": {"$gte": thirty_days_ago}}
        ]
    })
    
    stats = PlatformStats(
        total_users=total_users,
        total_ai_calls=total_ai_calls,
        total_pdfs_generated=total_pdfs_generated,
        total_pdfs_downloaded=total_pdfs_downloaded,
        active_users_last_30_days=active_users
    )
    
    return AdminStatsResponse(stats=stats)

@router.get("/user/{user_id}", response_model=AdminUserDetailResponse)
async def get_user_detail(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Get detailed user analytics"""
    users_collection = get_users_collection()
    ai_logs_collection = get_ai_usage_logs_collection()
    pdf_history_collection = get_pdf_history_collection()
    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    analytics = user.get("analytics", {})
    user_analytics = UserAnalytics(
        ai_calls_count=analytics.get("ai_calls_count", 0),
        pdfs_generated_count=analytics.get("pdfs_generated_count", 0),
        pdfs_downloaded_count=analytics.get("pdfs_downloaded_count", 0),
        tokens_used=analytics.get("tokens_used", 0),
        last_ai_call_at=analytics.get("last_ai_call_at"),
        last_pdf_generated_at=analytics.get("last_pdf_generated_at")
    )
    
    user_response = UserWithAnalytics(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        is_admin=user.get("is_admin", False),
        is_verified=user.get("is_verified", False),
        is_revoked=user.get("is_revoked", False),
        credits=user.get("credits", 0),
        max_resume=user.get("max_resume", 2),
        created_at=user["created_at"],
        analytics=user_analytics
    )
    
    # AI usage stats
    ai_cursor = ai_logs_collection.find({"user_id": ObjectId(user_id)})
    total_tokens = 0
    last_call_at = None
    async for log in ai_cursor:
        total_tokens += log.get("tokens_used", 0)
        if not last_call_at or log["created_at"] > last_call_at:
            last_call_at = log["created_at"]
    
    ai_usage = AIUsageStats(
        user_id=user_id,
        user_email=user["email"],
        total_calls=analytics.get("ai_calls_count", 0),
        total_tokens=total_tokens,
        last_call_at=last_call_at
    )
    
    # PDF stats
    pdfs_generated = await pdf_history_collection.count_documents({"user_id": ObjectId(user_id)})
    pdfs_downloaded = await pdf_history_collection.count_documents({
        "user_id": ObjectId(user_id),
        "downloaded_at": {"$ne": None}
    })
    
    last_generated = None
    last_pdf = await pdf_history_collection.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("compiled_at", -1)]
    )
    if last_pdf:
        last_generated = last_pdf.get("compiled_at")
    
    pdf_stats = PDFStats(
        user_id=user_id,
        user_email=user["email"],
        pdfs_generated=pdfs_generated,
        pdfs_downloaded=pdfs_downloaded,
        last_generated_at=last_generated
    )
    
    return AdminUserDetailResponse(
        user=user_response,
        ai_usage=[ai_usage],
        pdf_stats=pdf_stats
    )

@router.get("/ai-usage", response_model=AdminAIUsageResponse)
async def get_ai_usage_stats(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_admin_user)
):
    """Get AI usage statistics"""
    users_collection = get_users_collection()
    ai_logs_collection = get_ai_usage_logs_collection()
    
    # Aggregate AI usage by user
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "total_calls": {"$sum": 1},
                "total_tokens": {"$sum": "$tokens_used"},
                "last_call_at": {"$max": "$created_at"}
            }
        },
        {"$sort": {"total_calls": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    usage_list = []
    total_calls = 0
    total_tokens = 0
    
    async for result in ai_logs_collection.aggregate(pipeline):
        user = await users_collection.find_one({"_id": result["_id"]})
        if user:
            usage_list.append(AIUsageStats(
                user_id=str(result["_id"]),
                user_email=user["email"],
                total_calls=result["total_calls"],
                total_tokens=result["total_tokens"],
                last_call_at=result.get("last_call_at")
            ))
            total_calls += result["total_calls"]
            total_tokens += result["total_tokens"]
    
    return AdminAIUsageResponse(
        usage=usage_list,
        total_calls=total_calls,
        total_tokens=total_tokens
    )

@router.get("/pdf-stats", response_model=AdminPDFStatsResponse)
async def get_pdf_stats(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_admin_user)
):
    """Get PDF generation/download statistics"""
    users_collection = get_users_collection()
    pdf_history_collection = get_pdf_history_collection()
    
    # Aggregate PDF stats by user
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "pdfs_generated": {"$sum": 1},
                "pdfs_downloaded": {
                    "$sum": {"$cond": [{"$ne": ["$downloaded_at", None]}, 1, 0]}
                },
                "last_generated_at": {"$max": "$compiled_at"}
            }
        },
        {"$sort": {"pdfs_generated": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    stats_list = []
    total_generated = 0
    total_downloaded = 0
    
    async for result in pdf_history_collection.aggregate(pipeline):
        user = await users_collection.find_one({"_id": result["_id"]})
        if user:
            stats_list.append(PDFStats(
                user_id=str(result["_id"]),
                user_email=user["email"],
                pdfs_generated=result["pdfs_generated"],
                pdfs_downloaded=result["pdfs_downloaded"],
                last_generated_at=result.get("last_generated_at")
            ))
            total_generated += result["pdfs_generated"]
            total_downloaded += result["pdfs_downloaded"]
    
    return AdminPDFStatsResponse(
        stats=stats_list,
        total_generated=total_generated,
        total_downloaded=total_downloaded
    )

@router.post("/create-admin", response_model=CreateAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    request: CreateAdminRequest,
    current_user: dict = Depends(get_current_admin_user)
):
    """Create a new admin user. Only existing admins can create new admins."""
    result = await create_admin(request.email)
    return CreateAdminResponse(
        message=result["message"],
        user_id=result["user_id"],
        email=result["email"],
        is_admin=result["is_admin"]
    )

@router.delete("/users/{user_id}", response_model=DeleteUserResponse)
async def delete_user_route(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete a user. Only admins can delete users."""
    result = await delete_user(user_id)
    return DeleteUserResponse(
        message=result["message"],
        user_id=result["user_id"]
    )

@router.post("/users/{user_id}/revoke", response_model=RevokeUserResponse)
async def revoke_user_route(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Revoke user access. Revoked users cannot login or refresh tokens, but their data remains in the database. Only admins can revoke users."""
    result = await revoke_user(user_id)
    return RevokeUserResponse(
        message=result["message"],
        user_id=result["user_id"],
        is_revoked=result["is_revoked"]
    )

@router.post("/users/{user_id}/unrevoke", response_model=UnrevokeUserResponse)
async def unrevoke_user_route(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Unrevoke user access. This restores the user's ability to login and refresh tokens. Only admins can unrevoke users."""
    result = await unrevoke_user(user_id)
    return UnrevokeUserResponse(
        message=result["message"],
        user_id=result["user_id"],
        is_revoked=result["is_revoked"]
    )

@router.put("/users/{user_id}/credits", response_model=UpdateCreditsResponse)
async def update_user_credits_route(
    user_id: str,
    request: UpdateCreditsRequest,
    current_user: dict = Depends(get_current_admin_user)
):
    """Update user credits. Only admins can update user credits."""
    result = await update_user_credits(user_id, request.credits)
    return UpdateCreditsResponse(
        message=result["message"],
        user_id=result["user_id"],
        credits=result["credits"]
    )

