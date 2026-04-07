from fastapi import APIRouter, HTTPException
from app.schemas.schemas import RazorpayOrderRequest, PaymentVerificationRequest
from app.utils.razorpay_helper import create_razorpay_order, verify_payment_signature
from config import settings
from database import get_db
from bson.objectid import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/payment", tags=["payment"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db

@router.post("/create-order")
async def create_order(request: RazorpayOrderRequest):
    """Create Razorpay order"""
    db = _require_db()
    try:
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=500,
                detail="Razorpay is not configured on server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env"
            )

        order = create_razorpay_order(request.totalAmount, request.orderId)

        await db.orders.update_one(
            {"orderId": request.orderId},
            {
                "$set": {
                    "razorpayOrderId": order["id"],
                    "paymentStatus": "pending",
                    "paymentMethod": (request.paymentMethod or "razorpay").lower()
                }
            }
        )

        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.post("/verify")
async def verify_payment(request: PaymentVerificationRequest):
    """Verify Razorpay payment signature"""
    db = _require_db()
    
    try:
        # Verify signature
        is_valid = verify_payment_signature(
            request.razorpay_order_id,
            request.razorpay_payment_id,
            request.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Update order with payment details
        result = await db.orders.find_one_and_update(
            {"razorpayOrderId": request.razorpay_order_id},
            {
                "$set": {
                    "paymentStatus": "completed",
                    "razorpayPaymentId": request.razorpay_payment_id
                },
                "$push": {
                    "timeline": {
                        "status": "payment-completed",
                        "note": "Payment captured successfully",
                        "timestamp": datetime.utcnow()
                    }
                }
            },
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "orderId": result["orderId"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")
