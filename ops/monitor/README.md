# Uptime Kuma Monitoring Configuration (WP-16, plan Sec. 11.5)

The `best_monitor` container runs Uptime Kuma locally on the server PC. It runs on the internal Docker network and exposes port `3001` on `127.0.0.1` only.

## Setup Instructions

1. Start the reliability overlay:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.reliability.yml up -d best_monitor
   ```

2. Open browser on server PC: `http://127.0.0.1:3001`
   - Create local admin account.

3. Add Monitor:
   - **Type**: HTTP(s)
   - **Name**: BEST Public Health Probe
   - **URL**: `http://best_app:3000/api/health`
   - **Heartbeat Interval**: 60 seconds
   - **Retries**: 3
   - **Description**: Probes local app health and AI mode.

4. Add Deep Health Monitor (Staff / Admin):
   - **Type**: HTTP(s)
   - **Name**: BEST Deep Telemetry
   - **URL**: `http://best_app:3000/api/health/deep`
   - **Heartbeat Interval**: 300 seconds

5. Alerts:
   - Configure local sound or on-screen notification when 3 consecutive probes fail.
   - Monthly availability report exported to CSV for Barangay IT compliance.
