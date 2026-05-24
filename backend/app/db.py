import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.environ.get("METRICS_DB_PATH", "metrics.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu REAL NOT NULL,
                ram_percent REAL NOT NULL,
                ram_used REAL NOT NULL,
                ram_total REAL NOT NULL,
                disk_percent REAL NOT NULL,
                disk_used REAL NOT NULL,
                disk_total REAL NOT NULL,
                net_sent REAL NOT NULL,
                net_recv REAL NOT NULL,
                connections INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_timestamp ON system_metrics(timestamp)"
        )
        conn.commit()


def add_metric(
    cpu: float,
    ram_percent: float,
    ram_used: float,
    ram_total: float,
    disk_percent: float,
    disk_used: float,
    disk_total: float,
    net_sent: float,
    net_recv: float,
    connections: int,
):
    timestamp = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO system_metrics (
                timestamp, cpu, ram_percent, ram_used, ram_total,
                disk_percent, disk_used, disk_total, net_sent, net_recv, connections
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp,
                cpu,
                ram_percent,
                ram_used,
                ram_total,
                disk_percent,
                disk_used,
                disk_total,
                net_sent,
                net_recv,
                connections,
            ),
        )
        conn.commit()


def get_metrics_history(limit: int = 720):
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            SELECT * FROM (
                SELECT timestamp, cpu, ram_percent, ram_used, ram_total,
                       disk_percent, disk_used, disk_total, net_sent, net_recv, connections
                FROM system_metrics
                ORDER BY timestamp DESC
                LIMIT ?
            ) ORDER BY timestamp ASC
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]


def prune_old_metrics(hours: int = 24):
    cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    with get_db_connection() as conn:
        conn.execute("DELETE FROM system_metrics WHERE timestamp < ?", (cutoff,))
        conn.commit()
