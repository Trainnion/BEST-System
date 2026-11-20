#!/bin/sh
# BEST-SYSTEM hourly encrypted backup (WP-16, plan Sec. 11.4, REL-01).
set -eu

if [ -z "${BACKUP_AGE_PUBKEY:-}" ]; then
  echo "ERROR: BACKUP_AGE_PUBKEY is not set. Backup aborted." >&2
  exit 1
fi

TS=$(date +%Y%m%d-%H%M)
H=/backups/hourly
mkdir -p "$H" /backups/daily /backups/weekly /backups/monthly

echo "[$(date -Iseconds)] Starting hourly encrypted pg_dump..."

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h best_postgres -U best_admin -Fc best_barangay_db \
  | age -r "$BACKUP_AGE_PUBKEY" > "$H/best-$TS.dump.age"

# Check if non-empty
if [ ! -s "$H/best-$TS.dump.age" ]; then
  echo "ERROR: Backup dump file is empty!" >&2
  rm -f "$H/best-$TS.dump.age"
  exit 1
fi

# Rotations
[ "$(date +%H)" = "01" ] && cp "$H/best-$TS.dump.age" /backups/daily/
[ "$(date +%u)" = "7" ] && [ "$(date +%H)" = "01" ] && cp "$H/best-$TS.dump.age" /backups/weekly/
[ "$(date +%d%H)" = "0101" ] && cp "$H/best-$TS.dump.age" /backups/monthly/

# Retention pruning
/app/prune.sh

date +%s > /backups/LAST_OK
echo "[$(date -Iseconds)] Hourly encrypted backup complete: best-$TS.dump.age"
