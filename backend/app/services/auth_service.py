from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status, Response
from app.database import get_users_collection, get_refresh_tokens_collection
from app.models.user import UserRegister, UserLogin
from app.utils.password_handler import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, create_refresh_token, verify_refresh_token
from app.settings.get_env import REFRESH_TOKEN_EXPIRATION_HOURS
from app.services.otp_service import create_otp
from app.services.email_service import send_verification_email, send_password_reset_email, send_email_change_otp
from app.services.password_reset_service import (
    create_password_reset_otp,
    verify_password_reset_otp as verify_password_reset_otp_service,
    delete_user_password_reset_otps,
    create_eligibility_entry,
    check_eligibility,
    delete_eligibility
)
from app.services.email_change_service import (
    create_email_change_otp,
    verify_email_change_otp as verify_email_change_otp_service,
    create_eligibility_entry as create_email_change_eligibility,
    check_eligibility as check_email_change_eligibility,
    delete_eligibility as delete_email_change_eligibility,
    create_new_email_otp,
    verify_new_email_otp as verify_new_email_otp_service,
    delete_user_email_change_otps
)
from app.utils.constants import INITIAL_CREDITS, INITIAL_MAX_RESUMES

async def register_user(user_data: UserRegister) -> dict:
    """Register a new user"""
    users_collection = get_users_collection()
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "is_admin": False,
        "is_verified": False,
        "is_revoked": False,
        "credits": INITIAL_CREDITS,
        "max_resume": INITIAL_MAX_RESUMES,
        "analytics": {
            "ai_calls_count": 0,
            "pdfs_generated_count": 0,
            "pdfs_downloaded_count": 0,
            "tokens_used": 0
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Generate OTP and send verification email
    try:
        otp_code = await create_otp(user_doc["_id"])
        send_verification_email(
            user_email=user_data.email,
            user_name=user_data.first_name,
            otp=otp_code
        )
    except Exception as e:
        # Log error but don't fail registration
        # User can request resend verification email later
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send verification email during registration: {e}")
    
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "first_name": user_doc["first_name"],
        "last_name": user_doc["last_name"],
        "is_admin": False,
        "is_verified": False,
        "created_at": user_doc["created_at"]
    }

async def login_user(user_data: UserLogin, response: Response) -> dict:
    """Login user and return tokens"""
    users_collection = get_users_collection()
    
    # Find user
    user = await users_collection.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is verified
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email to login."
        )
    
    # Check if user is revoked
    if user.get("is_revoked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account access has been revoked. Please contact support."
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user["_id"])})
    refresh_token = create_refresh_token(data={"sub": str(user["_id"])})
    
    # Store refresh token in database
    refresh_tokens_collection = get_refresh_tokens_collection()
    expires_at = datetime.utcnow() + timedelta(hours=REFRESH_TOKEN_EXPIRATION_HOURS)
    await refresh_tokens_collection.insert_one({
        "user_id": user["_id"],
        "token": refresh_token,
        "expires_at": expires_at,
        "created_at": datetime.utcnow()
    })
    
    # Set refresh token in httpOnly cookie (cross-site enabled)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Required for cross-site cookies
        samesite="none",  # Allows cross-site cookies
        max_age=REFRESH_TOKEN_EXPIRATION_HOURS * 3600,
        domain=None  # No domain restriction for cross-site cookies
    )
    
    # Get credits and max_resume (with defaults for existing users)
    credits = user.get("credits", INITIAL_CREDITS)
    max_resume = user.get("max_resume", INITIAL_MAX_RESUMES)
    is_admin = user.get("is_admin", False)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "is_admin": is_admin,
        "credits": credits,
        "max_resume": max_resume
    }

async def refresh_access_token(refresh_token: str, response: Response) -> dict:
    """Refresh access token using refresh token"""
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Verify refresh token exists in database
    refresh_tokens_collection = get_refresh_tokens_collection()
    token_doc = await refresh_tokens_collection.find_one({
        "token": refresh_token,
        "user_id": ObjectId(user_id)
    })
    
    if not token_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    # Check if token is expired
    if token_doc["expires_at"] < datetime.utcnow():
        await refresh_tokens_collection.delete_one({"_id": token_doc["_id"]})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    
    # Fetch user information
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Check if user is verified
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email to continue."
        )
    
    # Check if user is revoked
    if user.get("is_revoked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account access has been revoked. Please contact support."
        )
    
    # Create new access token
    new_access_token = create_access_token(data={"sub": user_id})
    
    # Get credits and max_resume (with defaults for existing users)
    credits = user.get("credits", INITIAL_CREDITS)
    max_resume = user.get("max_resume", INITIAL_MAX_RESUMES)
    is_admin = user.get("is_admin", False)
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "is_admin": is_admin,
        "credits": credits,
        "max_resume": max_resume
    }

async def logout_user(refresh_token: str, response: Response):
    """Logout user by invalidating refresh token"""
    refresh_tokens_collection = get_refresh_tokens_collection()
    await refresh_tokens_collection.delete_one({"token": refresh_token})
    
    # Clear cookie (cross-site)
    response.delete_cookie(
        key="refresh_token",
        domain=None,  # No domain restriction for cross-site cookies
        samesite="none",
        secure=True
    )
    
    return {"message": "Logged out successfully"}

async def verify_user_otp(email: str, otp: str) -> dict:
    """
    Verify OTP and mark user as verified
    
    Args:
        email: User's email address
        otp: OTP code to verify
        
    Returns:
        Success message
    """
    users_collection = get_users_collection()
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already verified
    if user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Verify OTP
    from app.services.otp_service import verify_otp
    is_valid = await verify_otp(user["_id"], otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Mark user as verified
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}}
    )
    
    return {
        "message": "Email verified successfully",
        "email": email
    }

async def resend_verification_email(email: str) -> dict:
    """
    Resend verification email to user
    
    Args:
        email: User's email address
        
    Returns:
        Success message
    """
    users_collection = get_users_collection()
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already verified
    if user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Delete existing OTPs and create new one
    from app.services.otp_service import create_otp, delete_user_otps
    await delete_user_otps(user["_id"])
    otp_code = await create_otp(user["_id"])
    
    # Send verification email
    send_verification_email(
        user_email=user["email"],
        user_name=user["first_name"],
        otp=otp_code
    )
    
    return {
        "message": "Verification email sent successfully",
        "email": email
    }

async def request_password_reset(email: str) -> dict:
    """
    Request password reset by sending OTP to user's email
    
    Args:
        email: User's email address
        
    Returns:
        Success message
    """
    users_collection = get_users_collection()
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        # Don't reveal if user exists or not for security
        # Return success message even if user doesn't exist
        return {
            "message": "If an account with this email exists, a password reset OTP has been sent.",
            "email": email
        }
    
    # Generate password reset OTP and send email
    try:
        otp_code = await create_password_reset_otp(user["_id"])
        send_password_reset_email(
            user_email=user["email"],
            user_name=user["first_name"],
            otp=otp_code
        )
    except Exception as e:
        # Log error but don't reveal if user exists
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email: {e}")
        # Still return success message for security
    
    return {
        "message": "If an account with this email exists, a password reset OTP has been sent.",
        "email": email
    }

async def verify_password_reset_otp(email: str, otp: str) -> dict:
    """
    Verify password reset OTP and create eligibility entry
    
    Args:
        email: User's email address
        otp: OTP code to verify
        
    Returns:
        Success message
    """
    users_collection = get_users_collection()
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify OTP
    is_valid = await verify_password_reset_otp_service(user["_id"], otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Create eligibility entry
    await create_eligibility_entry(user["_id"], email)
    
    return {
        "message": "OTP verified successfully. You can now reset your password.",
        "email": email
    }

async def reset_password(email: str, new_password: str) -> dict:
    """
    Reset user password after eligibility verification
    
    Args:
        email: User's email address
        new_password: New password to set
        
    Returns:
        Success message
    """
    users_collection = get_users_collection()
    
    # Check eligibility
    eligibility = await check_eligibility(email)
    if not eligibility:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first before setting new password"
        )
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Delete eligibility entry
    await delete_eligibility(email)
    
    # Delete any remaining password reset OTPs for this user
    await delete_user_password_reset_otps(user["_id"])
    
    return {
        "message": "Password reset successfully",
        "email": email
    }

async def update_user_name(user_id: str, first_name: str, last_name: str) -> dict:
    """
    Update user's first and last name
    
    Args:
        user_id: User's ID as string
        first_name: New first name
        last_name: New last name
        
    Returns:
        Updated user information
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
    
    # Update user name
    await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "first_name": first_name,
                "last_name": last_name,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated user
    updated_user = await users_collection.find_one({"_id": user_object_id})
    
    return {
        "id": str(updated_user["_id"]),
        "email": updated_user["email"],
        "first_name": updated_user["first_name"],
        "last_name": updated_user["last_name"],
        "is_admin": updated_user.get("is_admin", False),
        "is_verified": updated_user.get("is_verified", False),
        "credits": updated_user.get("credits", 0),
        "max_resume": updated_user.get("max_resume", 2),
        "created_at": updated_user["created_at"]
    }

async def request_email_change(user_id: str) -> dict:
    """
    Request email change by sending OTP to user's current email
    
    Args:
        user_id: User's ID as string
        
    Returns:
        Success message
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
    
    # Generate email change OTP and send email
    try:
        otp_code = await create_email_change_otp(user_object_id)
        send_email_change_otp(
            user_email=user["email"],
            user_name=user["first_name"],
            otp=otp_code
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send email change OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email change OTP"
        )
    
    return {
        "message": "Email change OTP has been sent to your current email address.",
        "email": user["email"]
    }

async def verify_email_change_otp(user_id: str, otp: str) -> dict:
    """
    Verify email change OTP and create eligibility entry
    
    Args:
        user_id: User's ID as string
        otp: OTP code to verify
        
    Returns:
        Success message
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
    
    # Verify OTP
    is_valid = await verify_email_change_otp_service(user_object_id, otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Create eligibility entry
    await create_email_change_eligibility(user_object_id)
    
    return {
        "message": "OTP verified successfully. You can now provide your new email address.",
        "email": user["email"]
    }

async def request_new_email(user_id: str, new_email: str) -> dict:
    """
    Request new email by sending OTP to new email address (requires eligibility)
    
    Args:
        user_id: User's ID as string
        new_email: New email address
        
    Returns:
        Success message
    """
    users_collection = get_users_collection()
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check eligibility
    eligibility = await check_email_change_eligibility(user_object_id)
    if not eligibility:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your current email first before setting a new email"
        )
    
    # Find user
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if new email is already in use
    existing_user = await users_collection.find_one({"email": new_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if new email is same as current email
    if user["email"] == new_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email must be different from current email"
        )
    
    # Generate new email OTP and send email
    try:
        otp_code = await create_new_email_otp(user_object_id, new_email)
        send_email_change_otp(
            user_email=new_email,
            user_name=user["first_name"],
            otp=otp_code
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send new email OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send new email OTP"
        )
    
    return {
        "message": "OTP has been sent to your new email address. Please verify to complete the email change.",
        "email": new_email
    }

async def verify_new_email_otp(user_id: str, new_email: str, otp: str) -> dict:
    """
    Verify new email OTP and update user's email
    
    Args:
        user_id: User's ID as string
        new_email: New email address
        otp: OTP code to verify
        
    Returns:
        Success message
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
    
    # Verify OTP
    is_valid = await verify_new_email_otp_service(user_object_id, new_email, otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Check if new email is already in use (double check)
    existing_user = await users_collection.find_one({"email": new_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Update user email
    await users_collection.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "email": new_email,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Delete eligibility entry
    await delete_email_change_eligibility(user_object_id)
    
    # Delete all email change OTPs for this user
    await delete_user_email_change_otps(user_object_id)
    
    return {
        "message": "Email changed successfully",
        "email": new_email
    }

