from fastapi import APIRouter
import psutil
from datetime import datetime

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/cpu")
def cpu_metrics():
    per_core = psutil.cpu_percent(interval=0.1, percpu=True)
    total_percent = round(sum(per_core) / len(per_core), 1) if per_core else 0.0
    return {
        "total_percent": total_percent,
        "per_core": per_core,
        "core_count": psutil.cpu_count(),
        "frequency_mhz": psutil.cpu_freq().current if psutil.cpu_freq() else None,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/memory")
def memory_metrics():
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    return {
        "ram": {
            "total_gb": round(mem.total / (1024**3), 2),
            "available_gb": round(mem.available / (1024**3), 2),
            "used_gb": round(mem.used / (1024**3), 2),
            "percent": mem.percent,
        },
        "swap": {
            "total_gb": round(swap.total / (1024**3), 2),
            "used_gb": round(swap.used / (1024**3), 2),
            "percent": swap.percent,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/disk")
def disk_metrics():
    disk = psutil.disk_usage("/")
    io = psutil.disk_io_counters()
    return {
        "usage": {
            "total_gb": round(disk.total / (1024**3), 2),
            "used_gb": round(disk.used / (1024**3), 2),
            "free_gb": round(disk.free / (1024**3), 2),
            "percent": round(disk.used / disk.total * 100, 1),
        },
        "io": {
            "read_mb": round(io.read_bytes / (1024**2), 2) if io else None,
            "write_mb": round(io.write_bytes / (1024**2), 2) if io else None,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/network")
def network_metrics():
    net = psutil.net_io_counters()
    try:
        connections = len(psutil.net_connections())
    except (psutil.AccessDenied, PermissionError):
        connections = 0
    return {
        "bytes_sent_mb": round(net.bytes_sent / (1024**2), 2),
        "bytes_recv_mb": round(net.bytes_recv / (1024**2), 2),
        "packets_sent": net.packets_sent,
        "packets_recv": net.packets_recv,
        "active_connections": connections,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/history")
def metrics_history(limit: int = 60):
    from app.db import get_metrics_history
    return get_metrics_history(limit)
