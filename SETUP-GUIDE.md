# Setup Guide — Best-Barangay-System (Local-Only, no Docker)

> This file is a step-by-step checklist an AI agent can follow to deploy the
> Best-Barangay-System on a new PC **without Docker**. It assumes the target PC
> has Node.js ≥ 18, PostgreSQL ≥ 16, and Git installed.

---

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js + npm | ≥ 18 | Runs the Next.js app |
| PostgreSQL | ≥ 16 | Database server |
| Git | — | Clone the repo |

Install (Windows):
- **Node.js**: [nodejs.org](https://nodejs.org/) (installer includes npm)
- **PostgreSQL**: [postgresql.org](https://www.postgresql.org/download/windows/) (or via winget: `winget install PostgreSQL`)

Verify:
```bash
node --version      # 18+
npm --version
psql --version      # 16+
pg_isready
```

---

## 2. Get the Code

```bash
git clone https://github.com/Trainnion/BEST-System.git
cd BEST-System
```

If you just need the current state (no git history), copy the entire folder.

---

## 3. PostgreSQL Setup

### Start PostgreSQL

```bash
# Windows service (if installed as a service)
NET START postgresql-16

# Or, if using a portable/standalone install:
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

### Create the database and user

```bash
# Log in as the postgres superuser (change password as needed)
psql -U postgres -c "CREATE DATABASE best_barangay_db;"
psql -U postgres -c "CREATE USER best_admin WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE best_barangay_db TO best_admin;"
```

### Verify

```bash
psql -U best_admin -d best_barangay_db -c "SELECT 1;"
```

---

## 4. Environment Variables (.env)

The `.env` file contains secrets. **Do not commit it** (gitignored).

```bash
cp .env.example .env
```

Then edit `.env` and fill in these values:

| Variable | Required? | How to generate | Notes |
|---|---|---|---|
| `BEST_ENV` | Yes | `development` (or `production`) | `production` refuses demo data |
| `BEST_HOST` | No | `localhost` (or LAN hostname) | Used by Caddyfile |
| `NEXT_PUBLIC_KIOSK` | No | `false` | Kiosk mode flag |
| `POSTGRES_PASSWORD` | Yes | (your choice) | Matches the PostgreSQL password you set |
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
| `DATABASE_URL` | **Yes** | `postgresql://best_admin:YOUR_PASSWORD@localhost:5432/best_barangay_db` | **Required for local Prisma** |

> ⚠️ Important: The `FIELD_ENC_KEY` is what decrypts the data in the database.
> If the database already has data (from a previous run), you **must copy the
> old `.env` (with the same FIELD_ENC_KEY)** to this PC, or the data will be
> unreadable.

---

## 5. Generate the Field Key

```bash
npm run keys:generate
```

This prints a 44-character base64 string. Paste it into `.env` as `FIELD_ENC_KEY`.

---

## 6. Install Dependencies & Build

```bash
npm ci
npx prisma generate
npm run build
```

> The Docker image builds the app anyway, but running `npm ci` locally ensures
> the dev tooling (Playwright, etc.) is available for testing.

---

## 7. Database Migrations

Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev --name init
```

This creates the tables in the `best_barangay_db` database.

---

## 8. Start the App

```bash
npm run dev
```

The Next.js app will be available at `http://localhost:3000`.

### Verify

```bash
curl -sf http://localhost:3000/api/health
# → 200 OK
```

Alternatively, for production:

```bash
npm run build
npm start
```

---

## 9. Run the Tests

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

## 10. Verify the Setup

| Check | Command | Expected |
|---|---|---|
| App healthy | `curl -sf http://localhost:3000/api/health` | `200 OK` |
| PostgreSQL | `pg_isready` | `accepting connections` |
| Prisma client | `npx prisma status` | `Healthy` |
| Field key in `.env` | `grep FIELD_ENC_KEY .env` | 44-char base64 |
| Policy check | `npm run check:policy` | Exit 0 |
| Demo-creds check | `npm run check:demo-creds` | Exit 0 |

---

## 11. Cleanup (after moving)

```bash
# Local dev artifacts (gitignored)
rm -rf .next node_modules test-results graphify-out
npm ci
```

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `database URL is not configured` | Set `DATABASE_URL` in `.env` to `postgresql://best_admin:YOUR_PASSWORD@localhost:5432/best_barangay_db` |
| `no pg_hba.conf entry for host` | Add `host all all 127.0.0.1/32 scram-sha-256` to `postgresql.conf` or `pg_hba.conf` |
| `port 3000 already in use` | Kill the existing process or change `PORT` in `.env` to `3001` |
| `FIELD_ENC_KEY` not configured | Generated key not in `.env` OR not in the right place at module load |
| Tests fail on `localhost` | Use `127.0.0.1` (IPv4) in the healthcheck |
| Playwright can't connect | `reuseExistingServer: true` in `playwright.config.js` (reuse existing `:3000` server) |

---

## Reference

- `.env.example` — environment template
- `prisma/schema.prisma` — database schema
- `scripts/run-tests.sh` — strict CI test runner
- `ops/README.md` — reliability/backup skeleton (WP-16)
- `docs/implementation-plan.md` — full spec (V5 encryption, invariants)
