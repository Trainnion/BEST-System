#!/usr/bin/env bash
# BEST-SYSTEM plan test runner for GitHub Actions CI/CD.
#
# This is the single script the CI/CD pipeline calls to validate the delivery
# plan (build -> gates -> tests -> restore). It is intentionally strict:
#   set -euo pipefail   -> fail fast on any error, unset variable, or pipe
#                         failure.
#
# Usage:
#   ./scripts/run-tests.sh            # run all stages
#   STAGE=prisma npm run $STAGE       # run a single stage
#
# Stages (see run_stage() below):
#   install  : npm ci
#   prisma   : prisma generate
#   build    : next build
#   policy   : check:policy + check:demo-creds
#   e2e      : Playwright e2e (needs a running app + Postgres)
#   restore  : npm run test:restore
#
# Exit codes: 0 = all green, 1 = a stage failed.
# The caller (GitHub Actions) should treat a non-zero exit as a failed job.

set -euo pipefail

PASS=0
FAIL=0

run_stage() {
  local name="$1"
  local cmd="$2"
  echo ""
  echo "============================================================"
  echo "  STEP: ${name}"
  echo "  CMD : ${cmd}"
  echo "============================================================"
  if eval "$cmd" 2>&1; then
    echo "  [PASS] ${name}"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] ${name}"
    FAIL=$((FAIL + 1))
  fi
  return 0
}

# ---- 0. pre-flight checks ------------------------------------------------
echo "============================================================"
echo "  BEST-SYSTEM plan test runner"
echo "  started: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "============================================================"

command -v node   >/dev/null 2>&1 || { echo "node is required but not found"; exit 1; }
command -v npm    >/dev/null 2>&1 || { echo "npm is required but not found"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker is required for E2E"; }

echo "  node: $(node -v) | npm: $(npm -v) | docker: $(docker --version 2>/dev/null || echo 'missing')"

# ---- 1. dependencies -----------------------------------------------------
run_stage "install" "npm ci"

# ---- 2. prisma client ----------------------------------------------------
run_stage "prisma" "npx prisma generate"

# ---- 3. build -------------------------------------------------------------
run_stage "build" "npm run build"

# ---- 4. security / policy gates -------------------------------------------
run_stage "policy" "npm run check:policy"
run_stage "demo-creds" "npm run check:demo-creds"

# ---- 5. end-to-end tests (requires a healthy stack) ------------------------
# Ensure the Docker stack (postgres + app + proxy) is up before playwright.
if ! docker compose ps --services | grep -qx best_app; then
  echo "--- starting best stack (docker compose up -d) ---"
  docker compose up -d
  for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
      echo "  app healthy at http://127.0.0.1:3000/api/health"
      break
    fi
    echo "  waiting for app health... ($i)"
    sleep 5
  done
  if ! curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "  [FAIL] app did not become healthy"
    docker compose logs best_app | tail -30
    exit 1
  fi
fi

echo ""
echo "--- running Playwright e2e ---"
npx playwright install chromium
npx playwright test

# ---- 6. restore / backup drill -------------------------------------------
run_stage "restore" "npm run test:restore"

# ---- summary -------------------------------------------------------------
echo ""
echo "============================================================"
echo "  BEST-SYSTEM plan test runner SUMMARY"
echo "  PASS=$PASS  FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "  RESULT: FAILED"
  exit 1
else
  echo "  RESULT: PASSED"
  exit 0
fi
