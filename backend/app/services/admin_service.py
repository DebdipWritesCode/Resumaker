from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.database import get_users_collection

async def create_admin(email: str) -> dict:
    """
    Create a new admin user by setting is_admin=True for an existing user.
    Only existing admins can call this function.
    
    Args:
        email: Email of the user to make admin
        
    Returns:
        Dictionary with admin creation details
    """
    users_collection = get_users_collection()
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already an admin
    if user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an admin"
        )
    
    # Update user to admin
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_admin": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "User promoted to admin successfully",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "is_admin": True
    }

async def delete_user(user_id: str) -> dict:
    """
    Delete a user from the database.
    Only admins can call this function.
    
    Args:
        user_id: ID of the user to delete
        
    Returns:
        Dictionary with deletion confirmation
    """
    users_collection = get_users_collection()
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Find user
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user
    await users_collection.delete_one({"_id": user_object_id})
    
    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }

async def revoke_user(user_id: str) -> dict:
    """
    Revoke user access by setting is_revoked=True.
    Revoked users cannot login or refresh tokens, but their data remains in the database.
    Only admins can call this function.
    
    Args:
        user_id: ID of the user to revoke
        
    Returns:
        Dictionary with revocation confirmation
    """
    users_collection = get_users_collection()
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Find user
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already revoked
    if user.get("is_revoked", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already revoked"
        )
    
    # Revoke user
    await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "is_revoked": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "User access revoked successfully",
        "user_id": user_id,
        "is_revoked": True
    }

async def unrevoke_user(user_id: str) -> dict:
    """
    Unrevoke user access by setting is_revoked=False.
    This restores the user's ability to login and refresh tokens.
    Only admins can call this function.
    
    Args:
        user_id: ID of the user to unrevoke
        
    Returns:
        Dictionary with unrevocation confirmation
    """
    users_collection = get_users_collection()
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Find user
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already unrevoked
    if not user.get("is_revoked", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not revoked"
        )
    
    # Unrevoke user
    await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "is_revoked": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "User access restored successfully",
        "user_id": user_id,
        "is_revoked": False
    }

async def update_user_credits(user_id: str, credits: int) -> dict:
    """
    Update user credits.
    Only admins can call this function.
    
    Args:
        user_id: ID of the user to update
        credits: New credit amount (must be non-negative)
        
    Returns:
        Dictionary with updated credits
    """
    users_collection = get_users_collection()
    
    # Validate credits
    if credits < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credits must be non-negative"
        )
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Find user
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update credits
    await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "credits": credits,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "User credits updated successfully",
        "user_id": user_id,
        "credits": credits
    }
