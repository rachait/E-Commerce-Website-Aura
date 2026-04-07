from fastapi import APIRouter, HTTPException, Depends, Request
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import OrderCreate, OrderResponse
from app.routes.auth import get_current_user
from datetime import datetime
from typing import List
import uuid
from fastapi.responses import Response
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

router = APIRouter(prefix="/api/orders", tags=["orders"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db

def _serialize_order(order: dict) -> dict:
    return {
        "id": str(order["_id"]),
        "orderId": order["orderId"],
        "userId": order["userId"],
        "items": order["items"],
        "totalAmount": order["totalAmount"],
        "paymentStatus": order.get("paymentStatus", "pending"),
        "status": order.get("status", "processing"),
        "timeline": order.get("timeline", []),
        "couponCode": order.get("couponCode"),
        "discountAmount": float(order.get("discountAmount", 0)),
        "returnStatus": order.get("returnStatus"),
        "shippingAddress": order["shippingAddress"],
        "createdAt": order["createdAt"]
    }

@router.post("/create")
async def create_order(order_data: OrderCreate, current_user_id: str = Depends(get_current_user)):
    """Create new order"""
    db = _require_db()

    discount_amount = 0.0
    coupon_code = (order_data.couponCode or "").strip().upper() or None
    final_total = float(order_data.totalAmount)

    if coupon_code:
        coupon = await db.coupons.find_one({"code": coupon_code, "isActive": True})
        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid coupon code")

        discount_type = coupon.get("discountType", "percent")
        discount_value = float(coupon.get("discountValue", 0))
        if discount_type == "flat":
            discount_amount = min(discount_value, final_total)
        else:
            discount_amount = min((final_total * discount_value) / 100.0, float(coupon.get("maxDiscount", 1e9)))

        final_total = round(max(final_total - discount_amount, 0), 2)

        await db.coupon_usage.insert_one({
            "code": coupon_code,
            "userId": current_user_id,
            "createdAt": datetime.utcnow()
        })
    
    order_doc = {
        "orderId": str(uuid.uuid4()),
        "userId": current_user_id,
        "items": [item.dict() for item in order_data.items],
        "totalAmount": final_total,
        "paymentStatus": "pending",
        "razorpayOrderId": None,
        "razorpayPaymentId": None,
        "couponCode": coupon_code,
        "discountAmount": round(discount_amount, 2),
        "shippingAddress": order_data.shippingAddress.dict(),
        "status": "processing",
        "timeline": [
            {
                "status": "processing",
                "note": "Order placed",
                "timestamp": datetime.utcnow()
            }
        ],
        "returnStatus": None,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.orders.insert_one(order_doc)
    
    return {
        "orderId": order_doc["orderId"],
        "id": str(result.inserted_id),
        "discountAmount": round(discount_amount, 2),
        "totalAmount": final_total
    }

@router.get("", response_model=List[OrderResponse])
async def get_user_orders(current_user_id: str = Depends(get_current_user)):
    """Get user orders"""
    db = _require_db()
    
    orders = await db.orders.find({"userId": current_user_id}).sort("createdAt", -1).to_list(None)
    
    return [_serialize_order(order) for order in orders]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user_id: str = Depends(get_current_user)):
    """Get order details"""
    db = _require_db()
    
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": current_user_id})
    except:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return _serialize_order(order)

@router.get("/{order_id}/invoice")
async def download_invoice(order_id: str, current_user_id: str = Depends(get_current_user)):
    """Generate and download order invoice as PDF"""
    db = _require_db()

    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": current_user_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 60

    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(48, y, "AURA Invoice")
    y -= 32

    pdf.setFont("Helvetica", 11)
    pdf.drawString(48, y, f"Order ID: {order.get('orderId', 'N/A')}")
    y -= 18
    created_at = order.get("createdAt")
    created_text = created_at.strftime("%Y-%m-%d %H:%M") if created_at else "N/A"
    pdf.drawString(48, y, f"Date: {created_text}")
    y -= 18
    pdf.drawString(48, y, f"Payment Status: {order.get('paymentStatus', 'N/A')}")
    y -= 28

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, y, "Items")
    y -= 18
    pdf.setFont("Helvetica", 10)

    for item in order.get("items", []):
        line = f"{item.get('productId', 'Item')}  x{item.get('quantity', 1)}  Size:{item.get('size', '-')}  Rs.{item.get('price', 0)}"
        pdf.drawString(52, y, line)
        y -= 16
        if y < 120:
            pdf.showPage()
            y = height - 60
            pdf.setFont("Helvetica", 10)

    y -= 12
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, y, f"Total Amount: Rs.{order.get('totalAmount', 0):.2f}")
    y -= 28

    address = order.get("shippingAddress", {})
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, y, "Shipping Address")
    y -= 18
    pdf.setFont("Helvetica", 10)
    pdf.drawString(52, y, str(address.get("name", "")))
    y -= 14
    pdf.drawString(52, y, str(address.get("address", "")))
    y -= 14
    city_state = f"{address.get('city', '')}, {address.get('state', '')} {address.get('pincode', '')}"
    pdf.drawString(52, y, city_state.strip())
    y -= 14
    pdf.drawString(52, y, f"Phone: {address.get('phone', '')}")

    pdf.showPage()
    pdf.save()

    pdf_data = buffer.getvalue()
    buffer.close()

    filename = f"invoice-{order.get('orderId', order_id)}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.get("/admin/all")
async def get_all_orders(current_user_id: str = Depends(get_current_user)):
    """Get all orders (admin only)"""
    db = _require_db()
    
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}).sort("createdAt", -1).to_list(None)
    
    return [_serialize_order(order) for order in orders]

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, request: Request, status: str = "", current_user_id: str = Depends(get_current_user)):
    """Update order status (admin only)"""
    db = _require_db()
    
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if not status:
        try:
            body = await request.json()
            status = body.get("status", "")
        except Exception:
            status = ""

    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    try:
        order_obj_id = ObjectId(order_id)
    except:
        raise HTTPException(status_code=404, detail="Order not found")
    
    result = await db.orders.find_one_and_update(
        {"_id": order_obj_id},
        {
            "$set": {"status": status},
            "$push": {
                "timeline": {
                    "status": status,
                    "note": f"Order moved to {status}",
                    "timestamp": datetime.utcnow()
                }
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}
