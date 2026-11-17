#!/bin/sh
# BEST-SYSTEM host container health watchdog (WP-16, plan Sec. 11.4).
# Intended for host systemd timer (every 30s) or cron.
# Restarts unhealthy containers automatically without exposing Docker socket into containers.

for c in best_app best_postgres; do
  s=$(docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null || echo missing)
  case "$s" in
    healthy|starting)
      ;;
    *)
      if command -v logger >/dev/null 2>&1; then
        logger -t best-watchdog "Restarting container $c (status: $s)"
      fi
      echo "Restarting unhealthy container: $c (status: $s)"
      docker restart "$c" || docker compose up -d "$c"
      ;;
  esac
done
