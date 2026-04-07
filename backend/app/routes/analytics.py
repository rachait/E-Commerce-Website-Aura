from fastapi import APIRouter, HTTPException, Depends
from bson.objectid import ObjectId
from database import get_db
from app.routes.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def _require_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db


@router.get("/admin/overview")
async def admin_overview(current_user_id: str = Depends(get_current_user)):
    db = _require_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    orders = await db.orders.find({}).to_list(None)
    products = await db.products.find({}).to_list(None)
    users = await db.users.find({"role": "user"}).to_list(None)
    carts = await db.cart.find({}).to_list(None)

    total_revenue = sum(float(order.get("totalAmount", 0)) for order in orders if order.get("paymentStatus") == "completed")
    total_orders = len(orders)
    completed_orders = len([order for order in orders if order.get("paymentStatus") == "completed"])
    conversion_rate = round((completed_orders / max(total_orders, 1)) * 100, 2)

    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            key = item.get("productId")
            product_sales[key] = product_sales.get(key, 0) + int(item.get("quantity", 0))

    top_products = []
    product_by_id = {str(p.get("_id")): p for p in products}
    for pid, qty in sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]:
        p = product_by_id.get(pid)
        top_products.append({
            "productId": pid,
            "name": p.get("name", pid) if p else pid,
            "quantity": qty
        })

    low_stock = [{
        "id": str(p["_id"]),
        "name": p.get("name", ""),
        "stock": p.get("stock", 0)
    } for p in products if int(p.get("stock", 0)) <= 5]

    repeat_users = 0
    for entry in users:
        count = len([order for order in orders if order.get("userId") == str(entry.get("_id"))])
        if count >= 2:
            repeat_users += 1

    repeat_rate = round((repeat_users / max(len(users), 1)) * 100, 2)
    abandoned_carts = len([cart for cart in carts if len(cart.get("items", [])) > 0])

    last_7_days = datetime.utcnow() - timedelta(days=7)
    sales_last_7_days = sum(
        float(order.get("totalAmount", 0))
        for order in orders
        if order.get("paymentStatus") == "completed" and order.get("createdAt") and order["createdAt"] >= last_7_days
    )

    return {
        "revenue": {
            "total": round(total_revenue, 2),
            "last7Days": round(sales_last_7_days, 2)
        },
        "orders": {
            "total": total_orders,
            "completed": completed_orders,
            "conversionRate": conversion_rate
        },
        "products": {
            "count": len(products),
            "top": top_products,
            "lowStock": low_stock
        },
        "customers": {
            "count": len(users),
            "repeatRate": repeat_rate,
            "abandonedCarts": abandoned_carts
        }
    }
