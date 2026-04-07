import cloudinary
from cloudinary.uploader import unsigned_upload
import time
from config import settings

def init_cloudinary():
    """Initialize Cloudinary"""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )

def generate_upload_signature():
    """Generate unsigned upload signature for Cloudinary"""
    timestamp = int(time.time())
    
    params = {
        "timestamp": timestamp,
        "folder": "aura_ecommerce",
        "resource_type": "auto"
    }
    
    # Create signature
    signature = cloudinary.utils.cloudinary_api.sign_request(params, settings.CLOUDINARY_API_SECRET)
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": settings.CLOUDINARY_API_KEY,
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME
    }

def cloudinary_url_to_public_id(url: str) -> str:
    """Extract public_id from Cloudinary URL"""
    # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
    parts = url.split('/')
    return parts[-1].split('.')[0] if parts else ""
