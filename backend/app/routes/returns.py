from fastapi import APIRouter, HTTPException, Depends
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import ReturnRequestCreate, ReturnRequestResponse
from app.routes.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/returns", tags=["returns"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db


@router.post("", response_model=ReturnRequestResponse)
async def create_return_request(payload: ReturnRequestCreate, current_user_id: str = Depends(get_current_user)):
    db = _require_db()

    try:
        order_obj = ObjectId(payload.orderId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await db.orders.find_one({"_id": order_obj, "userId": current_user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("status") != "delivered":
        raise HTTPException(status_code=400, detail="Only delivered orders can be returned")

    existing = await db.return_requests.find_one({"orderId": payload.orderId, "userId": current_user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Return request already exists for this order")

    request_doc = {
        "orderId": payload.orderId,
        "userId": current_user_id,
        "reason": payload.reason,
        "status": "requested",
        "createdAt": datetime.utcnow()
    }

    result = await db.return_requests.insert_one(request_doc)

    await db.orders.update_one(
        {"_id": order_obj},
        {
            "$set": {"returnStatus": "requested"},
            "$push": {
                "timeline": {
                    "status": "return-requested",
                    "note": "Customer requested return",
                    "timestamp": datetime.utcnow()
                }
            }
        }
    )

    return {
        "id": str(result.inserted_id),
        "orderId": payload.orderId,
        "userId": current_user_id,
        "reason": payload.reason,
        "status": "requested",
        "createdAt": request_doc["createdAt"]
    }


@router.get("")
async def get_my_returns(current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    returns = await db.return_requests.find({"userId": current_user_id}).sort("createdAt", -1).to_list(None)

    return [{
        "id": str(entry["_id"]),
        "orderId": entry["orderId"],
        "reason": entry.get("reason", ""),
        "status": entry.get("status", "requested"),
        "createdAt": entry.get("createdAt")
    } for entry in returns]


@router.get("/admin")
async def get_all_returns(current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    returns = await db.return_requests.find({}).sort("createdAt", -1).to_list(None)
    return [{
        "id": str(entry["_id"]),
        "orderId": entry["orderId"],
        "userId": entry["userId"],
        "reason": entry.get("reason", ""),
        "status": entry.get("status", "requested"),
        "createdAt": entry.get("createdAt")
    } for entry in returns]


@router.put("/{return_id}/status")
async def update_return_status(return_id: str, status: str, current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if status not in ["requested", "approved", "picked-up", "refunded", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid return status")

    try:
        return_obj = ObjectId(return_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid return request ID")

    updated = await db.return_requests.find_one_and_update(
        {"_id": return_obj},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}},
        return_document=True
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Return request not found")

    await db.orders.update_one(
        {"_id": ObjectId(updated["orderId"])},
        {
            "$set": {"returnStatus": status},
            "$push": {
                "timeline": {
                    "status": f"return-{status}",
                    "note": f"Return status updated to {status}",
                    "timestamp": datetime.utcnow()
                }
            }
        }
    )

    return {"message": "Return status updated"}
