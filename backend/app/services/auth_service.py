from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status, Response
from app.database import get_users_collection, get_refresh_tokens_collection
from app.models.user import UserRegister, UserLogin
from app.utils.password_handler import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, create_refresh_token, verify_refresh_token
from app.settings.get_env import COOKIE_DOMAIN, REFRESH_TOKEN_EXPIRATION_HOURS

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
    
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "first_name": user_doc["first_name"],
        "last_name": user_doc["last_name"],
        "is_admin": False,
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
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_DOMAIN != "localhost",
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRATION_HOURS * 3600,
        domain=COOKIE_DOMAIN if COOKIE_DOMAIN != "localhost" else None
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"]
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
    
    # Create new access token
    new_access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"]
    }

async def logout_user(refresh_token: str, response: Response):
    """Logout user by invalidating refresh token"""
    refresh_tokens_collection = get_refresh_tokens_collection()
    await refresh_tokens_collection.delete_one({"token": refresh_token})
    
    # Clear cookie
    response.delete_cookie(
        key="refresh_token",
        domain=COOKIE_DOMAIN if COOKIE_DOMAIN != "localhost" else None
    )
    
    return {"message": "Logged out successfully"}

