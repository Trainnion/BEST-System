#!/usr/bin/env node
/**
 * BEST System - first ADMIN bootstrap (WP-05, plan Sec. 16.1 item 4).
 *
 * On a fresh production database this creates exactly one ADMIN account with a
 * random 20-character password. The password is printed ONCE and is stored only
 * as a bcrypt hash (cost 12); must_change_password=true forces a change at the
 * first login.
 *
 * Idempotent: if any SystemUser already exists, nothing is created and nothing
 * is printed except a short notice. A second run therefore makes no changes.
 *
 * Run: npm run bootstrap:admin   (or: node scripts/bootstrap-admin.js)
 */

import { randomInt } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;
const PASSWORD_LENGTH = 20;

// Safe alphabet: no quotes, spaces, backticks or shell metacharacters that
// would make the one-time password hard to copy, and no look-alikes (I, l, 1,
// O, 0).
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*-_=+';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function pick(alphabet) {
  return alphabet[randomInt(0, alphabet.length)];
}

/**
 * 20 random characters from the safe alphabet, guaranteed to contain at
 * least one uppercase letter, one lowercase letter, one digit and one symbol.
 */
function generatePassword() {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < PASSWORD_LENGTH) {
    chars.push(pick(ALL));
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    const swap = chars[i];
    chars[i] = chars[j];
    chars[j] = swap;
  }
  const password = chars.join('');
  // Keep clear of the documented denylist pattern (<word>2026!).
  return password.includes('2026!') ? generatePassword() : password;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Bootstrap failed: DATABASE_URL is not set. No user was created.');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const existingUsers = await prisma.systemUser.count();
    if (existingUsers > 0) {
      console.log(
        `Bootstrap skipped: ${existingUsers} system user(s) already exist. No changes were made.`,
      );
      return;
    }

    const password = generatePassword();
    const password_hash = await bcrypt.hash(password, BCRYPT_COST);

    try {
      await prisma.systemUser.create({
        data: {
          id: 'USR-0001',
          username: 'admin',
          password_hash,
          full_name: 'Barangay Administrator',
          role: 'ADMIN',
          is_active: true,
          is_demo: false,
          must_change_password: true,
        },
        select: { id: true },
      });
    } catch (error) {
      // A concurrent bootstrap won the race; treat it like a second run.
      if (error && error.code === 'P2002') {
        console.log('Bootstrap skipped: a system user was created concurrently. No changes were made.');
        return;
      }
      throw error;
    }

    console.log('Bootstrap admin created. This password is shown ONCE and is not stored anywhere.');
    console.log(`  Username: admin`);
    console.log(`  Password: ${password}`);
    console.log('  Store it now, then change it at first login (must_change_password=true).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Bootstrap failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
