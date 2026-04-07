from fastapi.testclient import TestClient
from main import app


def test_root_endpoint_returns_status():
    client = TestClient(app)
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body.get("status") == "running"


def test_health_endpoint_returns_json_shape():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert "status" in body
