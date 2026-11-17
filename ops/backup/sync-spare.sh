#!/bin/sh
# BEST-SYSTEM warm spare backup sync (WP-16, plan Sec. 11.2 & 11.4).
# Synchronizes encrypted dumps every 15 minutes to warm spare PC over LAN.
set -eu

if [ -z "${SPARE_HOST:-}" ]; then
  # No warm spare configured; skip silently
  exit 0
fi

echo "[$(date -Iseconds)] Syncing encrypted backups to warm spare ($SPARE_HOST)..."

rsync -avz --timeout=30 -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10" \
  /backups/ "best_sync@${SPARE_HOST}:/mnt/backupdisk/dumps/" || {
  echo "WARNING: Could not sync to spare host $SPARE_HOST" >&2
}
