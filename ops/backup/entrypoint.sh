#!/bin/sh
set -eu

echo "[best_backup] Initializing automated backup scheduler..."

# Register cron schedules
# Hourly backup at minute 0
# Spare sync every 15 minutes
cat <<EOF > /etc/crontabs/root
0 * * * * /app/backup.sh >> /var/log/backup.log 2>&1
*/15 * * * * /app/sync-spare.sh >> /var/log/sync.log 2>&1
EOF

# Run first backup on start if volume is ready
echo "[best_backup] Running initial verification backup..."
/app/backup.sh || true

echo "[best_backup] Starting cron daemon..."
exec crond -f -l 2
