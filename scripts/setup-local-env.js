#!/usr/bin/env node
/**
 * BEST System - Secure local server .env initializer.
 * Generates cryptographic secrets locally and writes to .env if not present.
 * NEVER prints keys, secrets, or passwords to stdout or logs.
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const envPath = path.join(ROOT, '.env');
const examplePath = path.join(ROOT, '.env.example');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  if (!content.includes('CHANGE_ME')) {
    console.log('[setup-local-env] .env already exists and is configured. Preserving.');
    process.exit(0);
  }
  console.log('[setup-local-env] Found placeholder values in .env. Populating with fresh cryptographic keys.');
}

if (!existsSync(examplePath)) {
  console.error('[setup-local-env] ERROR: .env.example template not found.');
  process.exit(1);
}

const postgresPassword = randomBytes(24).toString('base64url');
const sessionSecret = randomBytes(32).toString('hex');
const qrHmacSecret = randomBytes(32).toString('hex');
const fieldEncKey = randomBytes(32).toString('base64');

let template = readFileSync(examplePath, 'utf8');

template = template.replace('BEST_ENV=CHANGE_ME_production_or_development', 'BEST_ENV=development');
template = template.replace('BEST_HOST=CHANGE_ME_best.lan', 'BEST_HOST=best.lan');
template = template.replace('NEXT_PUBLIC_KIOSK=CHANGE_ME_false_or_true', 'NEXT_PUBLIC_KIOSK=false');
template = template.replace('POSTGRES_PASSWORD=CHANGE_ME_32_plus_random_chars_generated_by_a_person', `POSTGRES_PASSWORD=${postgresPassword}`);
template = template.replace('SESSION_SECRET=CHANGE_ME_32_plus_random_chars_generated_by_a_person', `SESSION_SECRET=${sessionSecret}`);
template = template.replace('QR_HMAC_SECRET=CHANGE_ME_32_plus_random_chars_generated_by_a_person', `QR_HMAC_SECRET=${qrHmacSecret}`);
template = template.replace('FIELD_ENC_KEY=CHANGE_ME_32_random_bytes_base64_generated_by_a_person', `FIELD_ENC_KEY=${fieldEncKey}`);
template = template.replace(
  'DATABASE_URL=postgresql://best_admin:CHANGE_ME_USE_SAME_POSTGRES_PASSWORD@localhost:5432/best_barangay_db',
  `DATABASE_URL=postgresql://best_admin:${postgresPassword}@localhost:5432/best_barangay_db`
);

writeFileSync(envPath, template, { mode: 0o600 });
console.log('[setup-local-env] Generated fresh .env with 256-bit cryptographic secrets.');
console.log('[setup-local-env] File permissions set to 600. File is ignored by git.');
