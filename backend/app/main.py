from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.database import (
    connect_to_mongo, close_mongo_connection, 
    get_otps_collection, get_refresh_tokens_collection,
    get_password_reset_otps_collection, get_password_reset_eligibility_collection
)
from app.settings.get_env import CORS_ORIGINS, ENVIRONMENT, REFRESH_TOKEN_EXPIRATION_HOURS
from app.routers import auth, ai, admin, compile as compile_router, heading, education, experience, project, skill, certification, award, volunteer, custom_resume, payment

logger = logging.getLogger(__name__)

async def create_ttl_indexes():
    """Create TTL indexes for OTPs, refresh tokens, and password reset collections"""
    try:
        # Create TTL index for OTPs (expire after 15 minutes = 900 seconds)
        otps_collection = get_otps_collection()
        await otps_collection.create_index("expires_at", expireAfterSeconds=900)
        logger.info("TTL index created for OTPs collection (15 minutes)")
        
        # Create TTL index for refresh tokens (expire after REFRESH_TOKEN_EXPIRATION_HOURS)
        refresh_tokens_collection = get_refresh_tokens_collection()
        expire_after_seconds = REFRESH_TOKEN_EXPIRATION_HOURS * 3600
        await refresh_tokens_collection.create_index("expires_at", expireAfterSeconds=expire_after_seconds)
        logger.info(f"TTL index created for refresh_tokens collection ({REFRESH_TOKEN_EXPIRATION_HOURS} hours)")
        
        # Create TTL index for password reset OTPs (expire after 15 minutes = 900 seconds)
        password_reset_otps_collection = get_password_reset_otps_collection()
        await password_reset_otps_collection.create_index("expires_at", expireAfterSeconds=900)
        logger.info("TTL index created for password_reset_otps collection (15 minutes)")
        
        # Create TTL index for password reset eligibility (expire after 15 minutes = 900 seconds)
        password_reset_eligibility_collection = get_password_reset_eligibility_collection()
        await password_reset_eligibility_collection.create_index("expires_at", expireAfterSeconds=900)
        logger.info("TTL index created for password_reset_eligibility collection (15 minutes)")
    except Exception as e:
        # Index might already exist, which is fine
        logger.warning(f"TTL index creation warning (may already exist): {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await create_ttl_indexes()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Resume Customizer API",
    description="Backend API for Resume Customizer application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(compile_router.router)
app.include_router(heading.router)
app.include_router(education.router)
app.include_router(experience.router)
app.include_router(project.router)
app.include_router(skill.router)
app.include_router(certification.router)
app.include_router(award.router)
app.include_router(volunteer.router)
app.include_router(custom_resume.router)
app.include_router(payment.router)

@app.get("/")
async def root():
    return {"message": "Resume Customizer API", "environment": ENVIRONMENT}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

