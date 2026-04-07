from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = None
db = None

async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.products.create_index("subcategory")
    await db.products.create_index("featured")
    await db.orders.create_index("userId")
    await db.orders.create_index("orderId", unique=True)
    await db.cart.create_index("userId", unique=True)
    await db.product_reviews.create_index([("productId", 1), ("createdAt", -1)])
    await db.product_reviews.create_index([("productId", 1), ("userId", 1)], unique=True)
    await db.coupons.create_index("code", unique=True)
    await db.coupon_usage.create_index([("code", 1), ("userId", 1), ("createdAt", -1)])
    await db.user_activity.create_index([("userId", 1), ("type", 1), ("createdAt", -1)])
    await db.return_requests.create_index([("orderId", 1), ("userId", 1)], unique=True)
    
    # OTP tokens index with TTL (auto-delete after expiry)
    await db.otp_tokens.create_index("expiresAt", expireAfterSeconds=0)
    await db.otp_tokens.create_index("email")
    
    print("[OK] Connected to MongoDB")

async def close_mongo_connection():
    global client
    if client:
        client.close()
    print("[OK] Closed MongoDB connection")

def get_db():
    return db
