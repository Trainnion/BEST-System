#!/bin/sh
# BEST-SYSTEM offline bundle (plan Sec 6.1 & 7.7).
# Builds a single tarball with the images, the compose files and the env
# template so the stack can be installed completely offline.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
TARBALL="$DIST/best-offline-bundle.tar.gz"

mkdir -p "$DIST"

echo "=== BEST offline bundle ==="

# 1) Docker images
echo "1. Saving images..."
docker save best_app postgres:16-alpine caddy:2-alpine \
  | gzip > "$DIST/layers.tar.gz"

# 2. Compose files + env template + build config
echo "2. Packaging compose / env / build files..."
tar -czf "$TARBALL" \
  -C "$ROOT" \
  docker-compose.yml \
  docker-compose.reliability.yml \
  Caddyfile \
  Dockerfile \
  .env.example \
  package.json \
  package-lock.json \
  scripts/ \
  ops/ \
  prisma/ \
  next.config.mjs \
  tailwind.config.js \
  postcss.config.js \
  jsconfig.json

echo "3. Done: $TARBALL"
