from motor.motor_asyncio import AsyncIOMotorClient
from app.settings.get_env import MONGODB_URL
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db_name: str = None

database = Database()

def _extract_database_name(mongodb_url: str) -> str:
    """Extract database name from MongoDB URL"""
    try:
        # Parse the URL
        parsed = urlparse(mongodb_url)
        # Get database name from path (remove leading /)
        db_name = parsed.path.lstrip('/')
        # Remove query parameters if present
        if '?' in db_name:
            db_name = db_name.split('?')[0]
        # If database name is in the URL, return it
        if db_name:
            return db_name
        # Default database name
        return "resume_customizer"
    except Exception:
        # If parsing fails, return default
        return "resume_customizer"

async def connect_to_mongo():
    """Create database connection"""
    try:
        database.client = AsyncIOMotorClient(MONGODB_URL)
        # Extract and store database name
        database.db_name = _extract_database_name(MONGODB_URL)
        # Test the connection
        await database.client.admin.command('ping')
        logger.info(f"Connected to MongoDB successfully (database: {database.db_name})")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    if database.db_name:
        return database.client.get_database(database.db_name)
    # Fallback: try to get default database or use extracted name
    return database.client.get_database(_extract_database_name(MONGODB_URL))

# Collection getters
def get_users_collection():
    return get_database().users

def get_refresh_tokens_collection():
    return get_database().refresh_tokens

def get_headings_collection():
    return get_database().headings

def get_educations_collection():
    return get_database().educations

def get_experiences_collection():
    return get_database().experiences

def get_projects_collection():
    return get_database().projects

def get_skills_collection():
    return get_database().skills

def get_certifications_collection():
    return get_database().certifications

def get_awards_collection():
    return get_database().awards

def get_volunteer_experiences_collection():
    return get_database().volunteer_experiences

def get_resume_versions_collection():
    return get_database().resume_versions

def get_pdf_history_collection():
    return get_database().pdf_history

def get_ai_usage_logs_collection():
    return get_database().ai_usage_logs

