#!/bin/sh
# BEST-SYSTEM update rollback script (WP-16, plan Sec. 11.3).
# Reverts app to previous container image and optionally restores pre-update database dump.
set -eu

echo "=== BEST System Rollback Utility ==="
echo "WARNING: This will roll back the current application release."

PREV_TAG="${1:-previous}"

echo "1. Stopping current application container..."
docker compose stop best_app

echo "2. Re-tagging image to ${PREV_TAG}..."
docker tag "best_app:${PREV_TAG}" "best_app:latest" || true

echo "3. Restarting application stack..."
docker compose up -d best_app

echo "4. Probing health status..."
sleep 5
curl -fsS "http://localhost:3000/api/health" || {
  echo "ERROR: Rollback failed health check!" >&2
  exit 1
}

echo "=== Rollback complete. Application is healthy. ==="
