import cloudinary
import cloudinary.uploader
from app.settings.get_env import (
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
)

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

async def upload_pdf(file_path: str, user_id: str, filename: str) -> dict:
    """Upload PDF to Cloudinary"""
    try:
        result = cloudinary.uploader.upload(
            file_path,
            resource_type="raw",
            folder=f"resumes/{user_id}",
            public_id=filename,
            format="pdf"
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"]
        }
    except Exception as e:
        raise Exception(f"Failed to upload PDF to Cloudinary: {str(e)}")

async def delete_pdf(public_id: str):
    """Delete PDF from Cloudinary"""
    try:
        cloudinary.uploader.destroy(public_id, resource_type="raw")
    except Exception as e:
        raise Exception(f"Failed to delete PDF from Cloudinary: {str(e)}")

