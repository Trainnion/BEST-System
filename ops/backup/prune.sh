#!/bin/sh
# BEST-SYSTEM backup retention policy pruner (WP-16, plan Sec. 11.4).
# Keeps: 48 hourly, 14 daily, 8 weekly, 12 monthly.
set -eu

H=/backups/hourly

if [ -d "$H" ]; then
  find "$H" -name '*.age' -mmin +2880 -delete
fi

if [ -d "/backups/daily" ]; then
  find /backups/daily -name '*.age' -mtime +14 -delete
fi

if [ -d "/backups/weekly" ]; then
  find /backups/weekly -name '*.age' -mtime +56 -delete
fi

if [ -d "/backups/monthly" ]; then
  find /backups/monthly -name '*.age' -mtime +365 -delete
fi
