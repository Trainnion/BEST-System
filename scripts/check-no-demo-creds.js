#!/usr/bin/env node
/**
 * BEST System - production demo-credential tripwire (WP-05, plan Sec. 16.1
 * item 5 and Sec. 16.2).
 *
 * In production (BEST_ENV=production) this exits 1 when:
 *   - any SystemUser or Resident has is_demo=true;
 *   - any stored staff password hash matches one of the documented Sec. 10.2
 *     demo passwords (bcrypt.compare);
 *   - SEED_DEMO_DATA=true;
 *   - POSTGRES_PASSWORD, SESSION_SECRET, QR_HMAC_SECRET or FIELD_ENC_KEY is
 *     missing, shorter than 32 characters, or a known placeholder/sample value.
 *
 * DATABASE_URL is required for the database checks in production. Outside
 * production the tripwire is skipped with a notice and exits 0: demo data is
 * allowed in development.
 *
 * This script never prints hashes, secret values or connection strings.
 *
 * NOTE: wiring this into `npm run check:policy` (scripts/check-agent-policy.js)
 * is a separate owner task; this file is runnable on its own with
 * `npm run check:demo-creds`.
 *
 * Run: BEST_ENV=production DATABASE_URL=... node scripts/check-no-demo-creds.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/** Fake, already-documented demo passwords (plan Sec. 10.2). Not secrets. */
const DEMO_PASSWORDS = [
  'AdminSecure2026!',
  'StaffDesk2026!',
  'TreasurerPay2026!',
  'OfficialLead2026!',
];

const REQUIRED_SECRETS = ['POSTGRES_PASSWORD', 'SESSION_SECRET', 'QR_HMAC_SECRET', 'FIELD_ENC_KEY'];

const KNOWN_PLACEHOLDERS = new Set([
  'changeme',
  'change-me',
  'change_me',
  'change me',
  'replaceme',
  'replace-me',
  'password',
  'postgres',
  'secret',
  'example',
  'sample',
  'placeholder',
  'default',
  'admin',
  'test',
]);

/**
 * Placeholder/sample detection only, never printed with the value.
 * @param {string} value
 * @returns {boolean}
 */
function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  if (KNOWN_PLACEHOLDERS.has(normalized)) return true;
  if (/^change[_\s-]?me/.test(normalized)) return true;
  if (/^replace[_\s-]?me/.test(normalized)) return true;
  if (/^your[_\s-]/.test(normalized)) return true;
  if (/^set[_\s-]?me/.test(normalized)) return true;
  if (/^sample[_\s-]/.test(normalized)) return true;
  if (/^placeholder/.test(normalized)) return true;
  if (/^<.+>$/.test(normalized)) return true;
  return false;
}

function isProduction() {
  return (process.env.BEST_ENV || '').trim().toLowerCase() === 'production';
}

async function checkDatabase(violations) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    violations.push('DATABASE_URL is missing: production database checks cannot run.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    const demoUsers = await prisma.systemUser.count({ where: { is_demo: true } });
    if (demoUsers > 0) {
      violations.push(`SystemUser rows with is_demo=true: ${demoUsers}.`);
    }

    const demoResidents = await prisma.resident.count({ where: { is_demo: true } });
    if (demoResidents > 0) {
      violations.push(`Resident rows with is_demo=true: ${demoResidents}.`);
    }

    const users = await prisma.systemUser.findMany({ select: { password_hash: true } });
    let matchingHashes = 0;
    for (const user of users) {
      for (const demoPassword of DEMO_PASSWORDS) {
        let matches = false;
        try {
          matches = await bcrypt.compare(demoPassword, user.password_hash);
        } catch {
          matches = false;
        }
        if (matches) {
          matchingHashes += 1;
          break;
        }
      }
    }
    if (matchingHashes > 0) {
      violations.push(
        `SystemUser password hashes matching a documented Sec. 10.2 demo password: ${matchingHashes}.`,
      );
    }
  } catch {
    // Never echo the driver error: it can contain host or credential details.
    violations.push('Production database check could not complete (database unreachable or query failed).');
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!isProduction()) {
    console.log('DEVELOPMENT: production tripwire skipped (BEST_ENV is not production).');
    if (!process.env.DATABASE_URL) {
      console.warn('WARNING: DATABASE_URL is not set - database checks skipped.');
    }
    return;
  }

  const violations = [];

  for (const name of REQUIRED_SECRETS) {
    const value = process.env[name];
    if (typeof value !== 'string' || value.trim() === '') {
      violations.push(`${name} is missing.`);
    } else if (isPlaceholder(value)) {
      violations.push(`${name} equals a known placeholder/sample value.`);
    } else if (value.trim().length < 32) {
      violations.push(`${name} is shorter than 32 characters.`);
    }
  }

  if ((process.env.SEED_DEMO_DATA || '').trim().toLowerCase() === 'true') {
    violations.push('SEED_DEMO_DATA=true: production must not seed demo data.');
  }

  await checkDatabase(violations);

  if (violations.length > 0) {
    console.error('PRODUCTION TRIPWIRE FAILED: refusing to continue.');
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Production tripwire passed: no demo credentials, demo rows or sample secrets found.');
}

main().catch(() => {
  // Do not print the error object: environment values must never leak.
  console.error('PRODUCTION TRIPWIRE FAILED: the check could not complete.');
  process.exitCode = 1;
});
