from fastapi import APIRouter, Response, Cookie, HTTPException, status
from app.models.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.models.otp import OTPVerification, ResendVerification, OTPResponse
from app.models.password_reset import PasswordResetRequest, PasswordResetOTPVerification, ResetPassword, PasswordResetResponse
from app.services.auth_service import (
    register_user, login_user, refresh_access_token, logout_user, 
    verify_user_otp, resend_verification_email,
    request_password_reset, verify_password_reset_otp, reset_password
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user"""
    return await register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, response: Response):
    """Login user and get access token"""
    return await login_user(user_data, response)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(response: Response, refresh_token: str = Cookie(None)):
    """Refresh access token using refresh token from cookie"""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    return await refresh_access_token(refresh_token, response)

@router.post("/logout")
async def logout(response: Response, refresh_token: str = Cookie(None)):
    """Logout user and invalidate refresh token"""
    if not refresh_token:
        return {"message": "Already logged out"}
    return await logout_user(refresh_token, response)

@router.post("/verify-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
async def verify_otp(otp_data: OTPVerification):
    """Verify OTP and mark user as verified"""
    return await verify_user_otp(otp_data.email, otp_data.otp)

@router.post("/resend-verification", response_model=OTPResponse, status_code=status.HTTP_200_OK)
async def resend_verification(resend_data: ResendVerification):
    """Resend verification email to user"""
    return await resend_verification_email(resend_data.email)

@router.post("/forgot-password", response_model=PasswordResetResponse, status_code=status.HTTP_200_OK)
async def forgot_password(request_data: PasswordResetRequest):
    """Request password reset (sends OTP to email)"""
    return await request_password_reset(request_data.email)

@router.post("/verify-password-reset-otp", response_model=PasswordResetResponse, status_code=status.HTTP_200_OK)
async def verify_password_reset_otp_route(otp_data: PasswordResetOTPVerification):
    """Verify password reset OTP and create eligibility entry"""
    return await verify_password_reset_otp(otp_data.email, otp_data.otp)

@router.post("/reset-password", response_model=PasswordResetResponse, status_code=status.HTTP_200_OK)
async def reset_password_route(reset_data: ResetPassword):
    """Reset password after OTP verification"""
    return await reset_password(reset_data.email, reset_data.new_password)

