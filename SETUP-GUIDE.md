# Setup Guide — Best-Barangay-System (for AI agent)

> This file is a step-by-step checklist an AI agent can follow to deploy the
> Best-Barangay-System to a new PC. It assumes the target PC has Docker
> Desktop + WSL2 and Git installed.

---

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Docker Desktop | ≥ 29.8.0 | Runs the containers |
| WSL2 | — | Docker needs WSL2 |
| Git | — | Clone the repo |
| Node.js | ≥ 18 (optional) | Build the Next.js app (Docker does it) |

Verify:
```bash
docker --version        # 29.8+
docker compose version  # 5.5+
git --version
node --version          # 18+ (optional)
```

---

## 2. Get the Code

```bash
git clone https://github.com/Trainnion/BEST-System.git
cd BEST-System
```

If you just need the current state (no git history), copy the entire folder.

---

## 3. Environment Variables (.env)

The `.env` file contains secrets. **Do not commit it** (gitignored).

```bash
cp .env.example .env
```

Then edit `.env` and fill in these values:

| Variable | Required? | How to generate | Notes |
|---|---|---|---|
| `BEST_ENV` | Yes | `development` (or `production`) | `production` refuses demo data |
| `BEST_HOST` | Yes | LAN hostname, e.g. `best.lan` | Used by Caddyfile |
| `NEXT_PUBLIC_KIOSK` | No | `false` | Kiosk mode flag |
| `POSTGRES_PASSWORD` | Yes | `openssl rand -base64 32` | 32+ random chars |
| `SESSION_SECRET` | Yes | `openssl rand -base64 32` | Session cookie secret |
| `QR_HMAC_SECRET` | Yes | `openssl rand -base64 32` | Blotter proof-of-work nonces |
| `FIELD_ENC_KEY` | Yes* | `npm run keys:generate` | 44-char base64; *required if restoring an existing DB (encrypted data) |
| `FIELD_ENC_KEY_ID` | No | `fk-1` | Optional |
| `SESSION_IDLE_MS` | No | `900000` | 15-min inactivity timeout |
| `AI_MODE` | No | `local` | `local` or `hybrid` |
| `GEMINI_API_KEY` | No | — | Only for `AI_MODE=hybrid` |
| `SEED_DEMO_DATA` | No | `false` | Production refuses demo data |
| `BACKUP_AGE_PUBKEY` | No | `age-keygen -y` | Encrypted backups |
| `SPARE_HOST` | No | — | Warm spare for rsync |
| `DATABASE_URL` | No | — | Host-side Prisma only |

> ⚠️ Important: The `FIELD_ENC_KEY` is what decrypts the data in the database.
> If the database already has data (from a previous run), you **must copy the
> old `.env` (with the same FIELD_ENC_KEY)** to this PC, or the data will be
> unreadable.

---

## 4. Generate the Field Key

```bash
npm run keys:generate
```

This prints a 44-character base64 string. Paste it into `.env` as `FIELD_ENC_KEY`.

---

## 5. Install Dependencies & Build

```bash
npm ci
npx prisma generate
npm run build
```

> The Docker image builds the app anyway, but running `npm ci` locally ensures
> the dev tooling (Playwright, etc.) is available for testing.

---

## 6. Database

The database is a Docker container (`best_postgres`).

### If you have a database dump from the old PC

```bash
# 1. Start the stack (creates an empty database)
docker compose up -d

# 2. Wait for health
curl -sf http://127.0.0.1:3000/api/health

# 3. Restore the dump
docker compose exec best_postgres pg_restore -Fc -d best_barangay_db backup.dump
```

### If you're starting fresh (no dump)

```bash
# The stack auto-creates the database
docker compose up -d
```

---

## 7. Start the Stack

```bash
docker compose up -d --build
```

### Verify

```bash
docker compose ps
# best_app should be "healthy"
curl -sf http://127.0.0.1:3000/api/health
```

---

## 8. Run the Tests

```bash
bash ./scripts/run-tests.sh
```

Expected output:
```
56 passed (52.7s)
STEP: restore
RESULT: PASSED
```

---

## 9. Verify the Setup

| Check | Command | Expected |
|---|---|---|
| App healthy | `curl -sf http://127.0.0.1:3000/api/health` | `200 OK` |
| Containers | `docker compose ps` | `best_app` healthy |
| Field key | `docker compose exec best_app env \| grep FIELD_ENC_KEY` | 34-char base64 |
| Policy check | `npm run check:policy` | Exit 0 |
| Demo-creds check | `npm run check:demo-creds` | Exit 0 |

---

## 10. Cleanup (after moving)

```bash
# Local dev artifacts (gitignored)
rm -rf .next node_modules test-results graphify-out
npm ci
```

---

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| `best_app` unhealthy | Probing `localhost` resolves to IPv6 `::1`; use `127.0.0.1` in the healthcheck |
| `FIELD_ENC_KEY` not configured | Generated key not in `.env` OR not in the right place at module load |
| `prisma migrate` fails | Run `npx prisma migrate dev --name init` |
| Tests fail on `localhost` | Use `127.0.0.1` (IPv4) in the healthcheck |
| Playwright can't connect | `reuseExistingServer: true` in `playwright.config.js` (reuse existing `:3000` server) |

---

## Reference

- `docker-compose.yml` — stack definition (3 services: best_postgres, best_app, best_proxy)
- `Dockerfile` — Next.js image
- `Caddyfile` — HTTPS reverse proxy
- `scripts/run-tests.sh` — strict CI test runner
- `ops/README.md` — reliability/backup skeleton (WP-16)
- `docs/implementation-plan.md` — full spec (V5 encryption, invariants)
