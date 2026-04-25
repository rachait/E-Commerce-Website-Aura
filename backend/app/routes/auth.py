from fastapi import APIRouter, HTTPException, Depends, status, Header
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import (
    UserRegister, UserLogin, UserResponse, UserPreferences,
    SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse
)
from app.utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.utils.otp import generate_otp, send_otp_email, is_valid_otp, is_valid_email
from datetime import datetime, timedelta
from typing import Optional
from config import settings
import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to get current authenticated user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_id

# ============ OTP ENDPOINTS ============

@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(request: SendOTPRequest):
    """Send OTP to email for login/signup"""
    db = _require_db()
    
    # Validate email format
    if not is_valid_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    try:
        smtp_configured = bool(settings.SENDER_EMAIL and settings.SENDER_PASSWORD)
        if not smtp_configured:
            raise HTTPException(
                status_code=503,
                detail="Email service is not configured. Please contact support."
            )

        otp = generate_otp(6)
        otp_expiry = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

        # Send OTP via email first. Persist only on successful delivery.
        name = request.name or "User"
        success = await send_otp_email(request.email, otp, name)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again.")
        
        # Store OTP in database
        await db.otp_tokens.update_one(
            {"email": request.email},
            {
                "$set": {
                    "email": request.email,
                    "otp": otp,
                    "expiresAt": otp_expiry,
                    "createdAt": datetime.utcnow(),
                    "attempts": 0
                }
            },
            upsert=True
        )

        return SendOTPResponse(
            success=True,
            message=f"OTP sent to {request.email}"
        )

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error sending OTP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@router.get("/admin/users")
async def get_all_users_admin(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
):
    """List users for admin portal with summary stats."""
    db = _require_db()

    admin_user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not admin_user or admin_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = {"role": {"$ne": "admin"}}
    if search:
        query = {
            "$and": [
                query,
                {
                    "$or": [
                        {"name": {"$regex": search, "$options": "i"}},
                        {"email": {"$regex": search, "$options": "i"}}
                    ]
                }
            ]
        }

    users = await db.users.find(query).sort("createdAt", -1).skip(offset).limit(limit).to_list(limit)
    total_users = await db.users.count_documents({"role": {"$ne": "admin"}})
    verified_users = await db.users.count_documents({"role": {"$ne": "admin"}, "emailVerified": True})

    recent_users = await db.users.count_documents({
        "role": {"$ne": "admin"},
        "createdAt": {"$gte": datetime.utcnow() - timedelta(days=7)}
    })

    return {
        "summary": {
            "totalUsers": total_users,
            "verifiedUsers": verified_users,
            "newLast7Days": recent_users
        },
        "users": [
            {
                "id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "user"),
                "emailVerified": user.get("emailVerified", False),
                "createdAt": user.get("createdAt")
            }
            for user in users
        ]
    }

@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and authenticate user"""
    db = _require_db()
    
    try:
        # Find OTP record
        otp_record = await db.otp_tokens.find_one({"email": request.email})
        
        if not otp_record:
            raise HTTPException(status_code=400, detail="No OTP request found for this email")
        
        # Check attempt limit
        if otp_record.get("attempts", 0) >= 5:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new OTP")
        
        # Verify OTP
        if not is_valid_otp(otp_record["otp"], request.otp, otp_record["expiresAt"]):
            # Increment failed attempts
            await db.otp_tokens.update_one(
                {"email": request.email},
                {"$inc": {"attempts": 1}}
            )
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Handle signup
        if request.isSignup:
            # Check if user already exists
            existing_user = await db.users.find_one({"email": request.email})
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            if not request.password or not request.name:
                raise HTTPException(status_code=400, detail="Password and name required for signup")
            
            # Create new user
            user_doc = {
                "email": request.email,
                "password": hash_password(request.password),
                "name": request.name,
                "role": "user",
                "emailVerified": True,
                "preferences": {
                    "style": [],
                    "favoriteCategories": []
                },
                "addresses": [],
                "createdAt": datetime.utcnow()
            }
            
            result = await db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)
        else:
            # Handle login - find existing user
            user = await db.users.find_one({"email": request.email})
            if not user:
                raise HTTPException(status_code=404, detail="User not found. Please sign up first.")
            
            user_id = str(user["_id"])

        # Clear OTP record only after successful account resolution.
        await db.otp_tokens.delete_one({"email": request.email})
        
        # Create JWT token
        access_token = create_access_token({"sub": user_id})
        
        # Fetch user data
        user_data = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return VerifyOTPResponse(
            success=True,
            message="Authentication successful",
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "role": user_data.get("role", "user")
            }
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error verifying OTP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

# ============ TRADITIONAL AUTH ENDPOINTS (Legacy) ============

@router.post("/register")
async def register(user_data: UserRegister):
    """Register new user (Legacy - OTP method recommended)"""
    db = _require_db()
    
    # Check if user already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_doc = {
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": "user",
        "preferences": {
            "style": [],
            "favoriteCategories": []
        },
        "addresses": [],
        "createdAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    
    # Create JWT token
    access_token = create_access_token({"sub": str(result.inserted_id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "email": user_data.email,
            "name": user_data.name,
            "role": "user"
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    """Login user (Legacy - OTP method recommended)"""
    db = _require_db()
    
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    access_token = create_access_token({"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user")
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user_id: str = Depends(get_current_user)):
    """Get current user info"""
    db = _require_db()
    
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user"),
        "preferences": user.get("preferences", {"style": [], "favoriteCategories": []}),
        "addresses": user.get("addresses", []),
        "createdAt": user["createdAt"]
    }
