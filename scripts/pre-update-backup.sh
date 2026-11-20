#!/bin/sh
# BEST-SYSTEM pre-update backup (plan Sec 11.6).
#
# Run this before an update. It:
#   1. builds the image to be replaced (best_app),
#   2. tags that image as best_app:latest and best_app:previous so
#      scripts/rollback.sh can restore it,
#   3. dumps the database so a re-populate/restore is possible.
#
# Rollback:  docker compose stop best_app
#            docker compose up -d best_app          (after rollback.sh picks the tag)

set -eu

COMPOSE="${1:-docker compose}"

echo "=== BEST pre-update backup ==="

# 1) Build/pin the image about to be replaced.
echo "1. Building app image (tag best_app:2026)..."
"$COMPOSE" build best_app

# 2) Keep the image tag for rollback.sh (Sec 11.3).
echo "2. Tagging image: best_app:latest + best_app:previous"
docker tag best_app:2026 best_app:latest
docker tag best_app:2026 best_app:previous

# 3) Database dump.
TS=$(date +%Y%m%d-%H%M%S)
DUMP="/backups/hourly/preupdate-${TS}.dump.age"
mkdir -p /backups/hourly

if [ -n "${BACKUP_AGE_PUBKEY:-}" ]; then
  PGPASSWORD="${POSTGRES_PASSWORD:-}" docker compose exec -T best_postgres pg_dump \
    -h best_postgres -U best_admin -Fc best_barangay_db \
    | age -r "$BACKUP_AGE_PUBKEY" > "$DUMP"
else
  PGPASSWORD="${POSTGRES_PASSWORD:-}" docker compose exec -T best_postgres pg_dump \
    -h best_postgres -U best_admin -Fc best_barangay_db > "$DUMP"
fi

echo "3. Database dump: $DUMP"

echo "=== Pre-update backup complete. ==="
echo "IMAGE=best_app:2026 (also tagged best_app:latest and best_app:previous)"
echo "Dump=$DUMP"
