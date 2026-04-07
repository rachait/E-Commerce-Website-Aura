from fastapi import APIRouter, HTTPException, Depends
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import Address
from app.routes.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/account", tags=["account"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db


@router.get("/addresses")
async def get_addresses(current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"addresses": user.get("addresses", [])}


@router.post("/addresses")
async def add_address(address: Address, current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    addresses = user.get("addresses", [])
    new_address = address.dict()
    new_address["id"] = str(uuid.uuid4())
    new_address["createdAt"] = datetime.utcnow()

    if new_address.get("isDefault") or not addresses:
        for entry in addresses:
            entry["isDefault"] = False
        new_address["isDefault"] = True

    addresses.append(new_address)

    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"addresses": addresses}}
    )

    return {"message": "Address saved", "address": new_address}


@router.put("/addresses/{address_id}")
async def update_address(address_id: str, address: Address, current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    addresses = user.get("addresses", [])
    updated = None

    for idx, entry in enumerate(addresses):
        if entry.get("id") == address_id:
            updated = address.dict()
            updated["id"] = address_id
            updated["createdAt"] = entry.get("createdAt", datetime.utcnow())
            addresses[idx] = updated
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Address not found")

    if updated.get("isDefault"):
        for entry in addresses:
            if entry.get("id") != address_id:
                entry["isDefault"] = False

    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"addresses": addresses}}
    )

    return {"message": "Address updated", "address": updated}


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    addresses = user.get("addresses", [])
    next_addresses = [entry for entry in addresses if entry.get("id") != address_id]

    if len(next_addresses) == len(addresses):
        raise HTTPException(status_code=404, detail="Address not found")

    if next_addresses and not any(entry.get("isDefault") for entry in next_addresses):
        next_addresses[0]["isDefault"] = True

    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"addresses": next_addresses}}
    )

    return {"message": "Address deleted"}


@router.get("/payment-methods")
async def get_payment_methods(current_user_id: str = Depends(get_current_user)):
    db = _require_db()

    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"paymentMethods": user.get("paymentMethods", [])}


@router.post("/payment-methods")
async def add_payment_method(payload: dict, current_user_id: str = Depends(get_current_user)):
    db = _require_db()

    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    provider = str(payload.get("provider", "card"))
    last4 = str(payload.get("last4", "")).strip()
    label = str(payload.get("label", "Saved method"))

    if not last4 or len(last4) != 4 or not last4.isdigit():
        raise HTTPException(status_code=400, detail="last4 must be a 4-digit string")

    payment_method = {
        "id": str(uuid.uuid4()),
        "provider": provider,
        "last4": last4,
        "label": label,
        "isDefault": bool(payload.get("isDefault", False)),
        "createdAt": datetime.utcnow()
    }

    payment_methods = user.get("paymentMethods", [])
    if payment_method["isDefault"] or not payment_methods:
        for entry in payment_methods:
            entry["isDefault"] = False
        payment_method["isDefault"] = True

    payment_methods.append(payment_method)

    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"paymentMethods": payment_methods}}
    )

    return {"message": "Payment method saved", "paymentMethod": payment_method}
