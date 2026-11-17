#!/bin/sh
# BEST-SYSTEM container entrypoint (docs/implementation-plan.md Sec. 6.2, Sec. 16).
# Wave-1 safe: scripts and seed files created by later waves are used only when
# they exist, so the container still boots on a clean Wave 1 repository.
set -e

# SEED-01: production refuses to boot with demo data enabled (Sec. 16.1).
if [ "$BEST_ENV" = "production" ] && [ "$SEED_DEMO_DATA" = "true" ]; then
  echo "REFUSING TO START: SEED_DEMO_DATA=true in production" >&2
  exit 1
fi

# SEED-01 tripwire (WP-05 creates the script). Non-production only warns.
if [ -f scripts/check-no-demo-creds.js ]; then
  if ! node scripts/check-no-demo-creds.js; then
    if [ "$BEST_ENV" = "production" ]; then
      echo "REFUSING TO START: check-no-demo-creds.js failed in production" >&2
      exit 1
    fi
    echo "WARNING: check-no-demo-creds.js reported issues (non-production; continuing)" >&2
  fi
fi

# Prisma CLI is baked into the image; migrate deploy needs no internet.
node node_modules/prisma/build/index.js migrate deploy

# Reference data: offices, categories, committees (idempotent, production-safe).
if [ -f prisma/seed.reference.js ]; then
  node prisma/seed.reference.js
fi

# Demo data: DEV/TEST ONLY, never in production, and the file is removed from
# production images unless built with INCLUDE_DEMO=1 (Sec. 16.1).
if [ "$SEED_DEMO_DATA" = "true" ] && [ "$BEST_ENV" != "production" ] && [ -f prisma/seed.demo.js ]; then
  node prisma/seed.demo.js
fi

# First-start bootstrap: creates one ADMIN with a one-time random password when
# no users exist (WP-05 creates the script).
if [ -f scripts/bootstrap-admin.js ]; then
  node scripts/bootstrap-admin.js
fi

exec node server.js
