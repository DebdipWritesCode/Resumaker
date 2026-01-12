"""
Centralized environment variable exporter.
All environment variables are loaded and exported from here.
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database
MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/resume_customizer")

# Authentication
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
JWT_REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET_KEY", "")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRATION_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRATION_MINUTES", "15"))
REFRESH_TOKEN_EXPIRATION_HOURS: int = int(os.getenv("REFRESH_TOKEN_EXPIRATION_HOURS", "48"))

# Cloudinary
CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

# OpenAI
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

# Email (Gmail SMTP)
SMTP_EMAIL: str = os.getenv("SMTP_EMAIL", "")
SMTP_APP_PASSWORD: str = os.getenv("SMTP_APP_PASSWORD", "")

# Razorpay
RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

# Application
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "dev")
CORS_ORIGINS: List[str] = [
    origin.strip() 
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
]
# Cookie settings - set to None for cross-site cookies
COOKIE_DOMAIN: str | None = os.getenv("COOKIE_DOMAIN", None)

# Validate required environment variables
if ENVIRONMENT == "prod":
    required_vars = [
        ("JWT_SECRET_KEY", JWT_SECRET_KEY),
        ("JWT_REFRESH_SECRET_KEY", JWT_REFRESH_SECRET_KEY),
        ("MONGODB_URL", MONGODB_URL),
        ("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME),
        ("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY),
        ("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET),
        ("OPENAI_API_KEY", OPENAI_API_KEY),
        ("SMTP_EMAIL", SMTP_EMAIL),
        ("SMTP_APP_PASSWORD", SMTP_APP_PASSWORD),
        ("RAZORPAY_KEY_ID", RAZORPAY_KEY_ID),
        ("RAZORPAY_KEY_SECRET", RAZORPAY_KEY_SECRET),
    ]
    
    missing_vars = [var_name for var_name, var_value in required_vars if not var_value]
    if missing_vars:
        raise ValueError(f"Missing required environment variables in production: {', '.join(missing_vars)}")

