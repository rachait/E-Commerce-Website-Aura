from fastapi import APIRouter, HTTPException, Depends
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import ChatRequest, RecommendationRequest, StyleAdvisorRequest
from app.routes.auth import get_current_user
from datetime import datetime
import uuid
from typing import Optional

# Note: This is a placeholder for AI integration
# In production, integrate with OpenAI GPT-5.2 via emergentintegrations

router = APIRouter(prefix="/api/ai", tags=["ai"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db

@router.post("/chat")
async def chat(request: ChatRequest, current_user_id: Optional[str] = None):
    """AI chatbot conversation endpoint"""
    db = _require_db()
    
    # Get or create session
    session_id = request.sessionId or str(uuid.uuid4())
    
    # Store chat in MongoDB
    chat_doc = {
        "sessionId": session_id,
        "userId": current_user_id,
        "messages": [{"role": msg.role, "content": msg.content, "timestamp": datetime.utcnow()} for msg in request.messages],
        "createdAt": datetime.utcnow()
    }
    
    # Insert or update chat history
    await db.chat_history.update_one(
        {"sessionId": session_id},
        {"$set": chat_doc},
        upsert=True
    )
    
    # TODO: Call OpenAI GPT-5.2 via emergentintegrations
    # For now, return a placeholder response
    ai_response = {
        "role": "assistant",
        "content": "I'm Aura's AI fashion assistant. How can I help you find the perfect style today?",
        "timestamp": datetime.utcnow()
    }
    
    return {
        "sessionId": session_id,
        "response": ai_response
    }

@router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest, current_user_id: str = Depends(get_current_user)):
    """Get personalized product recommendations"""
    db = _require_db()

    viewed = await db.user_activity.find(
        {"userId": current_user_id, "type": "product_view"}
    ).sort("createdAt", -1).limit(40).to_list(40)

    viewed_product_ids = [entry.get("productId") for entry in viewed if entry.get("productId")]

    categories = []
    if viewed_product_ids:
        object_ids = []
        for pid in viewed_product_ids:
            try:
                object_ids.append(ObjectId(pid))
            except Exception:
                continue

        if object_ids:
            viewed_products = await db.products.find({"_id": {"$in": object_ids}}).to_list(None)
            categories = [p.get("category") for p in viewed_products if p.get("category")]

    if categories:
        products = await db.products.find({"category": {"$in": categories}}).sort("ratingAverage", -1).limit(request.limit).to_list(request.limit)
    else:
        products = await db.products.find({"featured": True}).limit(request.limit).to_list(request.limit)
    
    return {
        "recommendations": [{
            "id": str(p["_id"]),
            "name": p["name"],
            "price": p["price"],
            "image": p["images"][0] if p["images"] else None,
            "category": p["category"]
        } for p in products]
    }

@router.get("/recently-viewed")
async def get_recently_viewed(limit: int = 10, current_user_id: str = Depends(get_current_user)):
    """Get recently viewed products for the logged in user"""
    db = _require_db()

    views = await db.user_activity.find(
        {"userId": current_user_id, "type": "product_view"}
    ).sort("createdAt", -1).limit(limit * 3).to_list(limit * 3)

    seen = set()
    unique_product_ids = []
    for entry in views:
        pid = entry.get("productId")
        if pid and pid not in seen:
            seen.add(pid)
            unique_product_ids.append(pid)
        if len(unique_product_ids) >= limit:
            break

    object_ids = []
    for pid in unique_product_ids:
        try:
            object_ids.append(ObjectId(pid))
        except Exception:
            continue

    if not object_ids:
        return {"products": []}

    products = await db.products.find({"_id": {"$in": object_ids}}).to_list(None)
    product_map = {str(p["_id"]): p for p in products}

    ordered = []
    for pid in unique_product_ids:
        product = product_map.get(pid)
        if product:
            ordered.append({
                "id": str(product["_id"]),
                "name": product.get("name", ""),
                "price": product.get("price", 0),
                "image": (product.get("images") or [None])[0],
                "category": product.get("subcategory") or product.get("category", "")
            })

    return {"products": ordered}

@router.post("/style-advisor")
async def get_style_advice(request: StyleAdvisorRequest):
    """Get AI styling advice for a product"""
    db = _require_db()
    
    # Get product details
    try:
        product = await db.products.find_one({"_id": ObjectId(request.productId)})
    except:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # TODO: Call OpenAI GPT-5.2 for styling advice
    # For now, return placeholder advice
    advice = {
        "product": product["name"],
        "styling_tips": [
            "This piece works great with minimalist accessories",
            "Perfect for both casual and formal occasions",
            "Pairs well with neutral colors"
        ],
        "complementary_items": []
    }
    
    return advice
