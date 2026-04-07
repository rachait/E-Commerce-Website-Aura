from fastapi import APIRouter, HTTPException, Depends
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import CartResponse, AddToCartRequest, UpdateCartRequest
from app.routes.auth import get_current_user
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.get("", response_model=CartResponse)
async def get_cart(current_user_id: str = Depends(get_current_user)):
    """Get user cart"""
    db = get_db()
    
    cart = await db.cart.find_one({"userId": current_user_id})
    
    if not cart:
        return {
            "userId": current_user_id,
            "items": [],
            "updatedAt": datetime.utcnow()
        }
    
    return {
        "userId": current_user_id,
        "items": cart.get("items", []),
        "updatedAt": cart["updatedAt"]
    }

@router.post("/add")
async def add_to_cart(item: AddToCartRequest, current_user_id: str = Depends(get_current_user)):
    """Add item to cart"""
    db = get_db()
    
    # Get product details
    try:
        product = await db.products.find_one({"_id": ObjectId(item.productId)})
    except:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_item = {
        "productId": item.productId,
        "quantity": item.quantity,
        "size": item.size,
        "price": product["price"]
    }
    
    # Find existing cart or create new one
    cart = await db.cart.find_one({"userId": current_user_id})
    
    if cart:
        # Check if item already in cart
        existing_item = None
        for idx, cart_item in enumerate(cart.get("items", [])):
            if cart_item["productId"] == item.productId and cart_item["size"] == item.size:
                existing_item = idx
                break
        
        if existing_item is not None:
            cart["items"][existing_item]["quantity"] += item.quantity
        else:
            cart["items"].append(new_item)
        
        cart["updatedAt"] = datetime.utcnow()
        await db.cart.update_one({"userId": current_user_id}, {"$set": cart})
    else:
        cart_doc = {
            "userId": current_user_id,
            "items": [new_item],
            "updatedAt": datetime.utcnow()
        }
        await db.cart.insert_one(cart_doc)
    
    return {"message": "Item added to cart"}

@router.put("/update")
async def update_cart(item: UpdateCartRequest, current_user_id: str = Depends(get_current_user)):
    """Update item quantity in cart"""
    db = get_db()
    
    cart = await db.cart.find_one({"userId": current_user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    for cart_item in cart.get("items", []):
        if cart_item["productId"] == item.productId:
            if item.quantity <= 0:
                cart["items"].remove(cart_item)
            else:
                cart_item["quantity"] = item.quantity
            break
    
    cart["updatedAt"] = datetime.utcnow()
    await db.cart.update_one({"userId": current_user_id}, {"$set": cart})
    
    return {"message": "Cart updated"}

@router.delete("/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user_id: str = Depends(get_current_user)):
    """Remove item from cart"""
    db = get_db()
    
    cart = await db.cart.find_one({"userId": current_user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["items"] = [item for item in cart.get("items", []) if item["productId"] != product_id]
    cart["updatedAt"] = datetime.utcnow()
    
    await db.cart.update_one({"userId": current_user_id}, {"$set": cart})
    
    return {"message": "Item removed from cart"}

@router.delete("/clear")
async def clear_cart(current_user_id: str = Depends(get_current_user)):
    """Clear user cart"""
    db = get_db()
    
    await db.cart.update_one(
        {"userId": current_user_id},
        {"$set": {"items": [], "updatedAt": datetime.utcnow()}}
    )
    
    return {"message": "Cart cleared"}
