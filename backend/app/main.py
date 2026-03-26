from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psutil
import platform
from datetime import datetime

from app.config import settings
from app.routers import metrics, services


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="NovaOps API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/v1")
app.include_router(services.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "system": platform.system(),
    }


@app.get("/api/v1/overview")
async def overview():
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    return {
        "cpu_percent": cpu,
        "memory": {
            "total_gb": round(mem.total / (1024**3), 2),
            "used_gb": round(mem.used / (1024**3), 2),
            "percent": mem.percent,
        },
        "disk": {
            "total_gb": round(disk.total / (1024**3), 2),
            "used_gb": round(disk.used / (1024**3), 2),
            "percent": round(disk.used / disk.total * 100, 1),
        },
        "network": {
            "bytes_sent_mb": round(net.bytes_sent / (1024**2), 2),
            "bytes_recv_mb": round(net.bytes_recv / (1024**2), 2),
        },
        "uptime_seconds": int(datetime.utcnow().timestamp() - psutil.boot_time()),
        "timestamp": datetime.utcnow().isoformat(),
    }
