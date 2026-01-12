from fastapi import APIRouter, Response, Cookie, HTTPException, status, Depends
from app.models.user import UserRegister, UserLogin, TokenResponse, UserResponse, UpdateUserName
from app.models.otp import OTPVerification, ResendVerification, OTPResponse
from app.models.password_reset import PasswordResetRequest, PasswordResetOTPVerification, ResetPassword, PasswordResetResponse
from app.models.email_change import EmailChangeOTPVerification, NewEmailRequest, NewEmailOTPVerification, EmailChangeResponse
from app.middleware.auth_middleware import get_current_user
from app.services.auth_service import (
    register_user, login_user, refresh_access_token, logout_user, 
    verify_user_otp, resend_verification_email,
    request_password_reset, verify_password_reset_otp, reset_password,
    update_user_name, request_email_change, verify_email_change_otp,
    request_new_email, verify_new_email_otp
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

@router.put("/update-name", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_name_route(
    name_data: UpdateUserName,
    current_user: dict = Depends(get_current_user)
):
    """Update user's first and last name"""
    return await update_user_name(
        current_user["user_id"],
        name_data.first_name,
        name_data.last_name
    )

@router.post("/request-email-change", response_model=EmailChangeResponse, status_code=status.HTTP_200_OK)
async def request_email_change_route(
    current_user: dict = Depends(get_current_user)
):
    """Request email change (sends OTP to current email)"""
    return await request_email_change(current_user["user_id"])

@router.post("/verify-email-change-otp", response_model=EmailChangeResponse, status_code=status.HTTP_200_OK)
async def verify_email_change_otp_route(
    otp_data: EmailChangeOTPVerification,
    current_user: dict = Depends(get_current_user)
):
    """Verify email change OTP and create eligibility entry"""
    return await verify_email_change_otp(current_user["user_id"], otp_data.otp)

@router.post("/request-new-email", response_model=EmailChangeResponse, status_code=status.HTTP_200_OK)
async def request_new_email_route(
    email_data: NewEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request new email (sends OTP to new email address)"""
    return await request_new_email(current_user["user_id"], email_data.new_email)

@router.post("/verify-new-email-otp", response_model=EmailChangeResponse, status_code=status.HTTP_200_OK)
async def verify_new_email_otp_route(
    otp_data: NewEmailOTPVerification,
    current_user: dict = Depends(get_current_user)
):
    """Verify new email OTP and update user's email"""
    return await verify_new_email_otp(
        current_user["user_id"],
        otp_data.new_email,
        otp_data.otp
    )

