# ops/ — Reliability & Operations (SKELETON)

> WP-02 created this outline. **WP-16 (Wave 5) owns the real scripts and
> completes this directory** per docs/implementation-plan.md Sec. 11 and the
> `docker-compose.reliability.yml` overlay.

## Planned layout

```
ops/
  backup/
    Dockerfile          # alpine + postgresql16-client + age + rsync + openssh-client
    backup.sh           # hourly pg_dump -Fc, age-encrypted, to /backups/hourly (REL-01)
    sync-spare.sh       # rsync over LAN every 15 min to the warm spare (SPARE_HOST)
    prune.sh            # retention: hourly 48, daily 14, weekly 8, monthly 12
  scripts/
    rollback.sh         # previous image tag + pre-update dump; <= 30 min recovery
    promote-spare.sh    # promote the warm spare, repoint the DNS name; <= 60 min RTO
    restore-drill.sh    # monthly restore test from the last hourly dump
    cert-check.sh       # TLS certificate age check (warn at 21 days left)
  monitor/
    README.md           # Uptime Kuma setup: 60 s probes on /api/health,
                        # alert after 3 consecutive failures (Sec. 11.5)
```

## Ground rules (already binding)

- Backups are hourly, encrypted (age public key from `BACKUP_AGE_PUBKEY`),
  stored on a second disk (`/mnt/backupdisk`, LUKS) and restore-tested monthly
  (REL-01).
- The backup container sees the dumps volume read-only; only the public key
  goes into the environment — private keys never touch the server (E2E-01).
- Docker logs are capped at 5 MB x 3 (json-file); no access logging anywhere
  (ZK-LOG-01).
- No external runtime origins; monitoring and sync stay on the LAN (OFFLINE-01).

## Status

| Item | Owner | State |
| :--- | :--- | :--- |
| This skeleton | WP-02 | done (Wave 1) |
| `docker-compose.reliability.yml` overlay | WP-16 | skeleton only |
| backup / watchdog / monitor scripts | WP-16 | pending |
