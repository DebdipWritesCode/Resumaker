from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.database import get_users_collection
from app.utils.constants import INITIAL_CREDITS, INITIAL_MAX_RESUMES

async def get_user_credits(user_id: str) -> int:
    """Get current credit balance for a user"""
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return credits, defaulting to INITIAL_CREDITS if not present (for existing users)
    return user.get("credits", INITIAL_CREDITS)

async def check_credits(user_id: str, required_credits: int) -> bool:
    """Check if user has enough credits"""
    current_credits = await get_user_credits(user_id)
    return current_credits >= required_credits

async def deduct_credits(user_id: str, amount: int) -> None:
    """
    Deduct credits from user account.
    Raises HTTPException if insufficient credits.
    """
    users_collection = get_users_collection()
    user_object_id = ObjectId(user_id)
    
    # Get current credits
    current_credits = await get_user_credits(user_id)
    
    # Check if user has enough credits
    if current_credits < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credits. You need {amount} credits but only have {current_credits} credits."
        )
    
    # Deduct credits atomically
    result = await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$inc": {"credits": -amount},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

async def add_credits(user_id: str, amount: int) -> None:
    """Add credits to user account"""
    users_collection = get_users_collection()
    user_object_id = ObjectId(user_id)
    
    # Add credits atomically
    result = await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$inc": {"credits": amount},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

async def get_user_max_resume(user_id: str) -> int:
    """Get max_resume limit for a user"""
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return max_resume, defaulting to INITIAL_MAX_RESUMES if not present (for existing users)
    return user.get("max_resume", INITIAL_MAX_RESUMES)

async def increment_max_resume(user_id: str) -> None:
    """Increment max_resume limit by 1"""
    users_collection = get_users_collection()
    user_object_id = ObjectId(user_id)
    
    result = await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$inc": {"max_resume": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
