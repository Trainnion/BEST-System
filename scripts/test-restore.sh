#!/bin/sh
# BEST-SYSTEM monthly restore drill gate (plan Sec. 11.6, package.json test:restore).
set -eu

echo "=== Running BEST Monthly Restore Drill ==="
sh ./ops/scripts/restore-drill.sh
