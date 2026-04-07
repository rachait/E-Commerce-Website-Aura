from fastapi import APIRouter, HTTPException
from app.schemas.schemas import CloudinarySignatureResponse
from app.utils.cloudinary_helper import generate_upload_signature

router = APIRouter(prefix="/api/cloudinary", tags=["cloudinary"])

@router.get("/signature", response_model=CloudinarySignatureResponse)
async def get_upload_signature():
    """Generate Cloudinary upload signature for unsigned uploads"""
    try:
        signature_data = generate_upload_signature()
        return signature_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate signature: {str(e)}")
