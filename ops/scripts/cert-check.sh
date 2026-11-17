#!/bin/sh
# BEST-SYSTEM TLS certificate expiration check (WP-16, plan Sec. 11.3 & 12.2).
# Warns if certificate has 21 days or fewer left before expiration.
set -eu

CERT_FILE="${1:-certs/best.crt}"

if [ ! -f "$CERT_FILE" ]; then
  echo "NOTICE: Certificate file $CERT_FILE not found. In automated dev mode, cert is self-managed by Caddy."
  exit 0
fi

EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

echo "Certificate $CERT_FILE expires in $DAYS_LEFT days ($EXPIRY_DATE)."

if [ "$DAYS_LEFT" -le 21 ]; then
  echo "WARNING: Certificate expires in $DAYS_LEFT days (threshold: 21 days)!" >&2
  exit 1
fi

echo "Certificate is healthy."
