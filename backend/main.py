from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection, get_db
from config import settings
from app.routes import auth, products, cart, orders, payment, cloudinary, ai, coupons, account, returns, analytics
from datetime import datetime
from collections import defaultdict
from typing import Awaitable, cast
from prometheus_fastapi_instrumentator import Instrumentator

rate_limit_state = defaultdict(list)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await cast(Awaitable[None], connect_to_mongo())
        
        # Seed admin user if not exists
        db = get_db()
        if db is None:
            raise RuntimeError("Database unavailable after connect")
        admin_exists = await db.users.find_one({"role": "admin"})
        if not admin_exists:
            from app.utils.auth import hash_password
            admin_doc = {
                "email": "admin@aura.com",
                "password": hash_password("admin123"),
                "name": "Admin User",
                "role": "admin",
                "preferences": {
                    "style": [],
                    "favoriteCategories": []
                },
                "addresses": [],
                "createdAt": datetime.utcnow()
            }
            await db.users.insert_one(admin_doc)
            print("[OK] Admin user created: admin@aura.com / admin123")

        # Seed default coupons if missing
        existing_coupon = await db.coupons.find_one({"code": "WELCOME10"})
        if not existing_coupon:
            await db.coupons.insert_many([
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
            ])
            print("[OK] Default coupons seeded")
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {str(e)}")
        print("Backend will run without database. Please ensure MongoDB is running on localhost:27017")
    
    yield
    
    # Shutdown
    await close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title="AURA eCommerce API",
    description="Premium 3D eCommerce Platform with AI Features",
    version="1.0.0",
    lifespan=lifespan
)

# Expose Prometheus metrics at /metrics
Instrumentator(excluded_handlers=["/metrics"]).instrument(app).expose(app, include_in_schema=False)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

@app.middleware("http")
async def set_security_headers(request, call_next):
    client_ip = (request.client.host if request.client else "unknown")
    now_ts = datetime.utcnow().timestamp()
    window = settings.RATE_LIMIT_WINDOW_SECONDS
    max_requests = settings.RATE_LIMIT_MAX_REQUESTS

    request_times = rate_limit_state[client_ip]
    rate_limit_state[client_ip] = [ts for ts in request_times if now_ts - ts < window]

    if len(rate_limit_state[client_ip]) >= max_requests:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again shortly."}
        )

    rate_limit_state[client_ip].append(now_ts)

    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payment.router)
app.include_router(cloudinary.router)
app.include_router(ai.router)
app.include_router(coupons.router)
app.include_router(account.router)
app.include_router(returns.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to AURA eCommerce API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db = get_db()
        if db is None:
            return {"status": "unhealthy", "database": "disconnected", "error": "Database unavailable"}
        await db.command("ping")
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.1.0",
            "features": [
                "reviews",
                "variants",
                "advanced-search",
                "coupons",
                "addresses",
                "order-timeline",
                "returns",
                "analytics"
            ]
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive"}

@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    try:
        db = get_db()
        if db is None:
            raise RuntimeError("Database unavailable")
        await db.command("ping")
        return {"status": "ready"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not-ready", "error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
