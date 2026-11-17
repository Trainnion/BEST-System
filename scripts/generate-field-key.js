#!/usr/bin/env node
/**
 * BEST System - V5 field key generator (Sec. 12.3, ENC-01).
 *
 * Prints a fresh FIELD_ENC_KEY (32 random bytes, base64, 44 characters) to
 * stdout so a PERSON can paste it into `.env` (file permissions 600). It
 * never writes a file inside the repository, never sends the key anywhere,
 * and never prints anything else about the key.
 *
 * Run: npm run keys:generate
 */

import { randomBytes } from 'node:crypto';

process.stdout.write('# Paste into .env on the server PC; keep one spare copy off the server.\n');
process.stdout.write('# Never commit, log or store this key with the backups.\n');
process.stdout.write('FIELD_ENC_KEY=' + randomBytes(32).toString('base64') + '\n');
