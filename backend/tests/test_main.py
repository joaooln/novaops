from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db

# Initialize testing SQLite DB
init_db()

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "system" in response.json()


def test_overview():
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert "cpu_percent" in data
    assert "memory" in data
    assert "disk" in data
    assert "network" in data
    assert "uptime_seconds" in data


def test_metrics_cpu():
    response = client.get("/api/v1/metrics/cpu")
    assert response.status_code == 200
    data = response.json()
    assert "total_percent" in data
    assert "per_core" in data
    assert "core_count" in data


def test_metrics_memory():
    response = client.get("/api/v1/metrics/memory")
    assert response.status_code == 200
    data = response.json()
    assert "ram" in data
    assert "swap" in data


def test_metrics_disk():
    response = client.get("/api/v1/metrics/disk")
    assert response.status_code == 200
    data = response.json()
    assert "usage" in data
    assert "io" in data


def test_metrics_network():
    response = client.get("/api/v1/metrics/network")
    assert response.status_code == 200
    data = response.json()
    assert "bytes_sent_mb" in data
    assert "bytes_recv_mb" in data
    assert "active_connections" in data


def test_services_list():
    response = client.get("/api/v1/services/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert "status" in data[0]


def test_service_detail():
    response = client.get("/api/v1/services/frontend")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "frontend"
    assert "status" in data
    assert "logs" in data


def test_service_detail_not_found():
    response = client.get("/api/v1/services/non-existent-service")
    assert response.status_code == 404


def test_metrics_history():
    response = client.get("/api/v1/metrics/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_k8s_pvcs():
    response = client.get("/api/v1/k8s/pvcs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "name" in data[0]
        assert "status" in data[0]
        assert "capacity_gb" in data[0]
