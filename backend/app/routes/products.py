from fastapi import APIRouter, HTTPException, Query, Header, Depends
from bson.objectid import ObjectId
from database import get_db
from app.schemas.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductReviewCreate,
    ProductReviewResponse
)
from app.routes.auth import get_current_user
from datetime import datetime
from typing import Optional, List

router = APIRouter(prefix="/api/products", tags=["products"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db

def serialize_product(p: dict) -> dict:
    """Normalize product documents so older/incomplete records don't break APIs."""
    images = p.get("images")
    if not images and p.get("image"):
        images = [p["image"]]

    return {
        "id": str(p["_id"]),
        "name": p.get("name", ""),
        "description": p.get("description", ""),
        "price": p.get("price", 0),
        "category": p.get("category", ""),
        "subcategory": p.get("subcategory"),
        "sizes": p.get("sizes", []),
        "images": images or [],
        "model3dUrl": p.get("model3dUrl"),
        "stock": p.get("stock", 0),
        "featured": p.get("featured", False),
        "variants": p.get("variants", []),
        "ratingAverage": float(p.get("ratingAverage", p.get("rating", 0) or 0)),
        "ratingCount": int(p.get("ratingCount", p.get("reviews", 0) or 0)),
        "createdAt": p.get("createdAt", datetime.utcnow())
    }

@router.get("", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    size: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    featured: Optional[bool] = Query(None),
    sortBy: Optional[str] = Query("newest"),
    limit: int = Query(20),
    offset: int = Query(0)
):
    """Get all products with advanced filters"""
    db = _require_db()

    category_normalized = (category or "").strip().lower()

    query: dict = {}
    if category_normalized and category_normalized not in ["all", "new", "new-collection"]:
        if category_normalized in ["men", "women", "unisex"]:
            query["$or"] = [
                {"category": {"$regex": category_normalized, "$options": "i"}},
                {"subcategory": {"$regex": category_normalized, "$options": "i"}},
                {"name": {"$regex": category_normalized, "$options": "i"}},
                {"description": {"$regex": category_normalized, "$options": "i"}}
            ]
        else:
            query["$or"] = [
                {"category": {"$regex": f"^{category_normalized}$", "$options": "i"}},
                {"subcategory": {"$regex": f"^{category_normalized}$", "$options": "i"}}
            ]

    if search:
        search_query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"subcategory": {"$regex": search, "$options": "i"}}
            ]
        }
        if query:
            query = {"$and": [query, search_query]}
        else:
            query = search_query

    if featured is not None:
        query["featured"] = bool(featured)

    if size:
        size_query = {
            "$or": [
                {"sizes": size},
                {"variants": {"$elemMatch": {"size": size}}}
            ]
        }
        if query:
            query = {"$and": [query, size_query]}
        else:
            query = size_query

    if in_stock is True:
        stock_query = {
            "$or": [
                {"stock": {"$gt": 0}},
                {"variants": {"$elemMatch": {"stock": {"$gt": 0}}}}
            ]
        }
        if query:
            query = {"$and": [query, stock_query]}
        else:
            query = stock_query

    products = await db.products.find(query).to_list(None)

    serialized = [serialize_product(p) for p in products]

    if min_price is not None:
        serialized = [p for p in serialized if float(p.get("price", 0)) >= min_price]
    if max_price is not None:
        serialized = [p for p in serialized if float(p.get("price", 0)) <= max_price]

    if category_normalized in ["new", "new-collection"]:
        sortBy = "newest"

    if sortBy == "price-low":
        serialized.sort(key=lambda x: float(x.get("price", 0)))
    elif sortBy == "price-high":
        serialized.sort(key=lambda x: float(x.get("price", 0)), reverse=True)
    elif sortBy == "rating":
        serialized.sort(key=lambda x: float(x.get("ratingAverage", 0)), reverse=True)
    else:
        serialized.sort(key=lambda x: x.get("createdAt", datetime.utcnow()), reverse=True)

    return serialized[offset:offset + limit]

@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(limit: int = Query(8)):
    """Get featured products"""
    db = _require_db()
    
    products = await db.products.find({"featured": True}).limit(limit).to_list(limit)

    return [serialize_product(p) for p in products]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get single product"""
    db = _require_db()
    
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    serialized = serialize_product(product)

    rating_stats = await db.product_reviews.aggregate([
        {"$match": {"productId": product_id}},
        {"$group": {"_id": "$productId", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    if rating_stats:
        serialized["ratingAverage"] = round(float(rating_stats[0].get("avg", 0)), 2)
        serialized["ratingCount"] = int(rating_stats[0].get("count", 0))

    return serialized

@router.get("/{product_id}/reviews", response_model=List[ProductReviewResponse])
async def get_product_reviews(product_id: str, limit: int = Query(20)):
    """Get recent reviews for a product"""
    db = _require_db()
    reviews = await db.product_reviews.find({"productId": product_id}).sort("createdAt", -1).limit(limit).to_list(limit)

    return [{
        "id": str(r["_id"]),
        "userId": r["userId"],
        "userName": r.get("userName", "User"),
        "rating": int(r.get("rating", 0)),
        "comment": r.get("comment", ""),
        "createdAt": r.get("createdAt", datetime.utcnow())
    } for r in reviews]

@router.post("/{product_id}/reviews", response_model=ProductReviewResponse)
async def add_product_review(
    product_id: str,
    review_data: ProductReviewCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Add or update a review for a product"""
    db = _require_db()

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating should be between 1 and 5")

    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    user_name = user.get("name", "User") if user else "User"

    review_doc = {
        "productId": product_id,
        "userId": current_user_id,
        "userName": user_name,
        "rating": int(review_data.rating),
        "comment": review_data.comment,
        "createdAt": datetime.utcnow()
    }

    await db.product_reviews.update_one(
        {"productId": product_id, "userId": current_user_id},
        {"$set": review_doc},
        upsert=True
    )

    stats = await db.product_reviews.aggregate([
        {"$match": {"productId": product_id}},
        {"$group": {"_id": "$productId", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]).to_list(1)

    if stats:
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {
                "$set": {
                    "ratingAverage": round(float(stats[0].get("avg", 0)), 2),
                    "ratingCount": int(stats[0].get("count", 0))
                }
            }
        )

    saved = await db.product_reviews.find_one({"productId": product_id, "userId": current_user_id})

    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load saved review")

    return {
        "id": str(saved["_id"]),
        "userId": saved["userId"],
        "userName": saved.get("userName", "User"),
        "rating": int(saved.get("rating", 0)),
        "comment": saved.get("comment", ""),
        "createdAt": saved.get("createdAt", datetime.utcnow())
    }

@router.post("/{product_id}/track-view")
async def track_product_view(product_id: str, authorization: Optional[str] = Header(None)):
    """Track product views for personalized recommendations"""
    db = _require_db()
    if not authorization:
        return {"tracked": False, "reason": "anonymous"}

    try:
        user_id = await get_current_user(authorization)
    except Exception:
        return {"tracked": False, "reason": "invalid-token"}

    await db.user_activity.insert_one({
        "userId": user_id,
        "type": "product_view",
        "productId": product_id,
        "createdAt": datetime.utcnow()
    })

    return {"tracked": True}

@router.post("", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate, 
    authorization: Optional[str] = Header(None)
):
    """Create new product (admin only)"""
    db = _require_db()
    
    # Verify admin access
    current_user_id = await get_current_user(authorization)
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product_doc = {
        "name": product_data.name,
        "description": product_data.description,
        "price": product_data.price,
        "category": product_data.category,
        "sizes": product_data.sizes,
        "images": product_data.images,
        "model3dUrl": product_data.model3dUrl,
        "stock": product_data.stock,
        "featured": product_data.featured,
        "variants": [variant.dict() for variant in product_data.variants],
        "ratingAverage": 0,
        "ratingCount": 0,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.products.insert_one(product_doc)
    
    return {
        "id": str(result.inserted_id),
        "name": product_data.name,
        "description": product_data.description,
        "price": product_data.price,
        "category": product_data.category,
        "sizes": product_data.sizes,
        "images": product_data.images,
        "model3dUrl": product_data.model3dUrl,
        "stock": product_data.stock,
        "featured": product_data.featured,
        "variants": [variant.dict() for variant in product_data.variants],
        "ratingAverage": 0,
        "ratingCount": 0,
        "createdAt": datetime.utcnow()
    }

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str, 
    product_data: ProductUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update product (admin only)"""
    db = _require_db()
    
    current_user_id = await get_current_user(authorization)
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        product_obj_id = ObjectId(product_id)
    except:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    
    result = await db.products.find_one_and_update(
        {"_id": product_obj_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return serialize_product(result)

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    authorization: Optional[str] = Header(None)
):
    """Delete product (admin only)"""
    db = _require_db()
    
    current_user_id = await get_current_user(authorization)
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        product_obj_id = ObjectId(product_id)
    except:
        raise HTTPException(status_code=404, detail="Product not found")
    
    result = await db.products.delete_one({"_id": product_obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}
