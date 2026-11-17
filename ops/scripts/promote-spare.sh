#!/bin/sh
# BEST-SYSTEM promote spare PC script (WP-16, plan Sec. 11.3 & 11.7).
# Promotes the warm spare machine to become the primary hall server.
# RTO target: <= 60 minutes.
set -eu

echo "=== BEST System: Promoting Warm Spare to Primary ==="

if [ ! -f .env ]; then
  echo "ERROR: .env file missing on spare machine. Cannot boot primary services." >&2
  exit 1
fi

echo "1. Checking latest synchronized backup..."
LATEST_DUMP=$(ls -t /mnt/backupdisk/dumps/hourly/*.age 2>/dev/null | head -n 1 || true)

if [ -n "$LATEST_DUMP" ]; then
  echo "Found latest dump: $LATEST_DUMP"
  echo "Please run restore-drill or restore script with the offline age private key if database needs re-population."
fi

echo "2. Starting core services on this machine..."
docker compose up -d best_postgres
docker compose up -d best_app best_proxy

echo "3. Verifying health of new primary..."
sleep 5
curl -fsS -k "http://localhost:3000/api/health" || {
  echo "ERROR: Spare server failed to start cleanly." >&2
  exit 1
}

echo "=== Warm spare is now ACTIVE. ==="
echo "ACTION REQUIRED: Update local router DNS / hosts to point best.lan to this machine's IP address."
