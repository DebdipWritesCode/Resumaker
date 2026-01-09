from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection
from app.settings.get_env import CORS_ORIGINS, ENVIRONMENT
from app.routers import auth, ai, admin, compile as compile_router, heading, education

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
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

@app.get("/")
async def root():
    return {"message": "Resume Customizer API", "environment": ENVIRONMENT}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

