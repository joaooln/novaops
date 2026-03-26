#!/bin/bash
# NovaOps — Production Deploy Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting NovaOps deployment..."

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker compose pull

# Start/update services with zero downtime
echo "⚡ Updating services..."
docker compose up -d --remove-orphans

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Health check
echo "🔍 Running health checks..."
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
if [ "$HEALTH" == "200" ]; then
  echo "✅ Deploy successful! All services are healthy."
else
  echo "❌ Health check failed (HTTP $HEALTH). Rolling back..."
  docker compose down
  docker compose up -d --scale frontend=1 --scale backend=1
  exit 1
fi

echo ""
echo "📊 Running containers:"
docker compose ps
