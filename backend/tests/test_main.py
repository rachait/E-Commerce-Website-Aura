from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ready():
    response = client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_list_products():
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) == 3
    assert products[0]["name"] == "Aura Sneaker X1"


def test_get_product():
    response = client.get("/api/products/1")
    assert response.status_code == 200
    product = response.json()
    assert product["id"] == 1
    assert product["name"] == "Aura Sneaker X1"


def test_get_product_not_found():
    response = client.get("/api/products/999")
    assert response.status_code == 404


def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert b"http_requests_total" in response.content or b"python_gc" in response.content
