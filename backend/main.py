from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="Aura E-Commerce API", version="1.0.0")

# Expose /metrics for Prometheus scraping
Instrumentator().instrument(app).expose(app)


@app.get("/healthz", tags=["health"])
def health():
    return {"status": "ok"}


@app.get("/readyz", tags=["health"])
def ready():
    return {"status": "ready"}


@app.get("/api/products", tags=["products"])
def list_products():
    return [
        {"id": 1, "name": "Aura Sneaker X1", "price": 129.99, "stock": 50},
        {"id": 2, "name": "Aura Running Pro", "price": 159.99, "stock": 30},
        {"id": 3, "name": "Aura Casual Slip-On", "price": 89.99, "stock": 100},
    ]


@app.get("/api/products/{product_id}", tags=["products"])
def get_product(product_id: int):
    products = {
        1: {"id": 1, "name": "Aura Sneaker X1", "price": 129.99, "stock": 50},
        2: {"id": 2, "name": "Aura Running Pro", "price": 159.99, "stock": 30},
        3: {"id": 3, "name": "Aura Casual Slip-On", "price": 89.99, "stock": 100},
    }
    if product_id not in products:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return products[product_id]
