from fastapi import APIRouter, HTTPException, Depends
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import CouponValidateRequest, CouponValidateResponse
from app.routes.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/coupons", tags=["coupons"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db


def _compute_discount(coupon: dict, cart_total: float) -> float:
    discount_type = coupon.get("discountType", "percent")
    discount_value = float(coupon.get("discountValue", 0))
    max_discount = float(coupon.get("maxDiscount", 1e9))

    if discount_type == "flat":
        return min(discount_value, cart_total)

    percent_discount = (cart_total * discount_value) / 100.0
    return min(percent_discount, max_discount, cart_total)


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(request: CouponValidateRequest, current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    code = request.code.strip().upper()

    coupon = await db.coupons.find_one({"code": code, "isActive": True})
    if not coupon:
        return {
            "valid": False,
            "code": code,
            "discountAmount": 0,
            "finalTotal": request.cartTotal,
            "message": "Invalid coupon code"
        }

    now = datetime.utcnow()
    if coupon.get("startsAt") and coupon["startsAt"] > now:
        return {
            "valid": False,
            "code": code,
            "discountAmount": 0,
            "finalTotal": request.cartTotal,
            "message": "Coupon is not active yet"
        }

    if coupon.get("expiresAt") and coupon["expiresAt"] < now:
        return {
            "valid": False,
            "code": code,
            "discountAmount": 0,
            "finalTotal": request.cartTotal,
            "message": "Coupon expired"
        }

    min_order = float(coupon.get("minOrderValue", 0))
    if request.cartTotal < min_order:
        raise HTTPException(status_code=400, detail=f"Minimum order value is {min_order}")

    usage_count = await db.coupon_usage.count_documents({"code": code})
    usage_limit = int(coupon.get("usageLimit", 0))
    if usage_limit > 0 and usage_count >= usage_limit:
        return {
            "valid": False,
            "code": code,
            "discountAmount": 0,
            "finalTotal": request.cartTotal,
            "message": "Coupon usage limit reached"
        }

    user_usage = await db.coupon_usage.count_documents({"code": code, "userId": current_user_id})
    per_user_limit = int(coupon.get("perUserLimit", 1))
    if user_usage >= per_user_limit:
        return {
            "valid": False,
            "code": code,
            "discountAmount": 0,
            "finalTotal": request.cartTotal,
            "message": "Coupon already used"
        }

    discount_amount = round(_compute_discount(coupon, request.cartTotal), 2)
    final_total = round(max(request.cartTotal - discount_amount, 0), 2)

    return {
        "valid": True,
        "code": code,
        "discountAmount": discount_amount,
        "finalTotal": final_total,
        "message": "Coupon applied"
    }


@router.post("/seed-defaults")
async def seed_default_coupons(current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    defaults = [
        {
            "code": "WELCOME10",
            "discountType": "percent",
            "discountValue": 10,
            "minOrderValue": 999,
            "maxDiscount": 1200,
            "usageLimit": 5000,
            "perUserLimit": 1,
            "isActive": True,
            "createdAt": datetime.utcnow()
        },
        {
            "code": "AURA500",
            "discountType": "flat",
            "discountValue": 500,
            "minOrderValue": 2999,
            "usageLimit": 5000,
            "perUserLimit": 2,
            "isActive": True,
            "createdAt": datetime.utcnow()
        }
    ]

    inserted = 0
    for coupon in defaults:
        result = await db.coupons.update_one({"code": coupon["code"]}, {"$setOnInsert": coupon}, upsert=True)
        if result.upserted_id:
            inserted += 1

    return {"message": f"Seeded {inserted} new coupon(s)"}
