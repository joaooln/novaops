from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter(prefix="/services", tags=["services"])

# Mock services — in production, replace with real Docker/K8s API calls
MOCK_SERVICES = [
    {"name": "frontend",  "image": "novaops-frontend:latest",  "port": 3000},
    {"name": "backend",   "image": "novaops-backend:latest",   "port": 8000},
    {"name": "nginx",     "image": "nginx:alpine",             "port": 80},
    {"name": "postgres",  "image": "postgres:16-alpine",       "port": 5432},
    {"name": "redis",     "image": "redis:7-alpine",           "port": 6379},
]


@router.get("/")
async def list_services():
    services = []
    for svc in MOCK_SERVICES:
        status = random.choices(
            ["running", "running", "running", "degraded", "stopped"],
            weights=[70, 70, 70, 15, 5],
        )[0]
        services.append({
            **svc,
            "status": status,
            "uptime_hours": round(random.uniform(1, 720), 1),
            "cpu_percent": round(random.uniform(0.5, 45.0), 1),
            "memory_mb": round(random.uniform(50, 512), 1),
            "restarts": random.randint(0, 3),
            "last_checked": datetime.utcnow().isoformat(),
        })
    return services


@router.get("/{service_name}")
async def get_service(service_name: str):
    svc = next((s for s in MOCK_SERVICES if s["name"] == service_name), None)
    if not svc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
    return {
        **svc,
        "status": "running",
        "uptime_hours": round(random.uniform(100, 720), 1),
        "logs": [
            f"[INFO] {datetime.utcnow().isoformat()} Service started",
            f"[INFO] {datetime.utcnow().isoformat()} Health check passed",
            f"[INFO] {datetime.utcnow().isoformat()} Ready to accept connections",
        ],
    }
