from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# ============ USER SCHEMAS ============
class UserPreferences(BaseModel):
    style: List[str] = Field(default_factory=list)
    favoriteCategories: List[str] = Field(default_factory=list)

class Address(BaseModel):
    id: Optional[str] = None
    label: Optional[str] = "Home"
    name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    isDefault: bool = False

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    preferences: UserPreferences
    addresses: List[Address] = Field(default_factory=list)
    createdAt: datetime

# ============ OTP SCHEMAS ============
class SendOTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "User"

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    tempToken: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    name: Optional[str] = None
    password: Optional[str] = None
    isSignup: bool = False

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional[dict] = None

# ============ REVIEW SCHEMAS ============
class ProductReviewCreate(BaseModel):
    rating: int
    comment: str

class ProductReviewResponse(BaseModel):
    id: str
    userId: str
    userName: str
    rating: int
    comment: str
    createdAt: datetime

# ============ PRODUCT SCHEMAS ============
class ProductVariant(BaseModel):
    color: str
    size: str
    stock: int
    price: Optional[float] = None

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    subcategory: Optional[str] = None
    sizes: List[str]
    images: List[str]
    model3dUrl: Optional[str] = None
    stock: int
    featured: bool = False
    variants: List[ProductVariant] = Field(default_factory=list)

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    sizes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    model3dUrl: Optional[str] = None
    stock: Optional[int] = None
    featured: Optional[bool] = None
    variants: Optional[List[ProductVariant]] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    subcategory: Optional[str] = None
    sizes: List[str]
    images: List[str]
    model3dUrl: Optional[str]
    stock: int
    featured: bool
    variants: List[ProductVariant] = Field(default_factory=list)
    ratingAverage: float = 0.0
    ratingCount: int = 0
    createdAt: datetime

# ============ CART SCHEMAS ============
class CartItem(BaseModel):
    productId: str
    quantity: int
    size: str
    price: float

class CartResponse(BaseModel):
    userId: str
    items: List[CartItem]
    updatedAt: datetime

class AddToCartRequest(BaseModel):
    productId: str
    quantity: int
    size: str

class UpdateCartRequest(BaseModel):
    productId: str
    quantity: int

# ============ ORDER SCHEMAS ============
class OrderItem(BaseModel):
    productId: str
    name: Optional[str] = ""
    quantity: int
    size: str
    price: float
    image: Optional[str] = ""

class ShippingAddress(BaseModel):
    name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str

class OrderCreate(BaseModel):
    items: List[OrderItem]
    totalAmount: float
    shippingAddress: ShippingAddress
    couponCode: Optional[str] = None

class StatusEvent(BaseModel):
    status: str
    note: str
    timestamp: datetime

class OrderResponse(BaseModel):
    id: str
    orderId: str
    userId: str
    items: List[OrderItem]
    totalAmount: float
    paymentStatus: str
    status: str
    timeline: List[StatusEvent] = Field(default_factory=list)
    couponCode: Optional[str] = None
    discountAmount: float = 0
    returnStatus: Optional[str] = None
    shippingAddress: ShippingAddress
    createdAt: datetime

# ============ COUPON SCHEMAS ============
class CouponValidateRequest(BaseModel):
    code: str
    cartTotal: float

class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discountAmount: float
    finalTotal: float
    message: str

# ============ RETURNS SCHEMAS ============
class ReturnRequestCreate(BaseModel):
    orderId: str
    reason: str

class ReturnRequestResponse(BaseModel):
    id: str
    orderId: str
    userId: str
    reason: str
    status: str
    createdAt: datetime

# ============ PAYMENT SCHEMAS ============
class RazorpayOrderRequest(BaseModel):
    totalAmount: float
    orderId: str
    paymentMethod: Optional[str] = "razorpay"

class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# ============ CLOUDINARY SCHEMAS ============
class CloudinarySignatureResponse(BaseModel):
    signature: str
    timestamp: int
    api_key: str
    cloud_name: str

# ============ AI SCHEMAS ============
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    sessionId: Optional[str] = None

class RecommendationRequest(BaseModel):
    userId: str
    limit: int = 5

class StyleAdvisorRequest(BaseModel):
    productId: str
    userPreferences: Optional[UserPreferences] = None
