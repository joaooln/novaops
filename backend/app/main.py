import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psutil
import platform
from datetime import datetime

from app.config import settings
from app.routers import metrics, services, k8s
from app.db import init_db, add_metric, prune_old_metrics


async def metrics_collector_daemon():
    # Allow the server to fully start
    await asyncio.sleep(2)
    # Trigger first call to initialize cpu_percent calculations
    psutil.cpu_percent(interval=None)
    
    prune_counter = 0
    while True:
        try:
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            net = psutil.net_io_counters()
            
            try:
                connections = len(psutil.net_connections())
            except Exception:
                connections = 0
                
            await asyncio.to_thread(
                add_metric,
                cpu=cpu,
                ram_percent=mem.percent,
                ram_used=round(mem.used / (1024**3), 2),
                ram_total=round(mem.total / (1024**3), 2),
                disk_percent=round(disk.used / disk.total * 100, 1),
                disk_used=round(disk.used / (1024**3), 2),
                disk_total=round(disk.total / (1024**3), 2),
                net_sent=round(net.bytes_sent / (1024**2), 2),
                net_recv=round(net.bytes_recv / (1024**2), 2),
                connections=connections,
            )
            
            prune_counter += 1
            if prune_counter >= 360: # Prune older than 24h once an hour (360 * 10s = 3600s)
                await asyncio.to_thread(prune_old_metrics, hours=24)
                prune_counter = 0
        except Exception as e:
            # Safe catch to prevent daemon failure from crashing FastAPI app
            pass
            
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    init_db()
    # Start the collector task
    collector_task = asyncio.create_task(metrics_collector_daemon())
    yield
    # Shutdown collector task
    collector_task.cancel()
    try:
        await collector_task
    except asyncio.CancelledError:
        pass


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
app.include_router(k8s.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "system": platform.system(),
    }


@app.get("/api/v1/overview")
def overview():
    cpu = psutil.cpu_percent(interval=0.1)
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
