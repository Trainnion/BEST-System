/**
 * BEST System - server-side blotter identifiers and dates (WP-10).
 *
 * Tracking codes are Crockford base32 so a citizen reading a paper stub
 * never confuses I/1, L/1, O/0 or U/V. The alphabet is drawn with randomInt,
 * which is rejection sampled by Node, so no modulo bias is introduced.
 *
 * The format is the plan's literal `BLT-XXXX-XX` (example BLT-7X9K-42).
 * No client address, user string or sequence is mixed into the code.
 */

import { randomInt } from 'node:crypto';

import { TRACKING_ALPHABET } from './constants.js';

/** How many times a unique code is redrawn after a collision. */
export const MAX_ID_ATTEMPTS = 8;

/**
 * A random string over the unambiguous alphabet.
 * @param {number} length
 * @returns {string}
 */
export function randomCrockford(length) {
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += TRACKING_ALPHABET[randomInt(0, TRACKING_ALPHABET.length)];
  }
  return out;
}

/**
 * A new public tracking code: BLT-XXXX-XX.
 * @returns {string}
 */
export function buildTrackingCode() {
  return 'BLT-' + randomCrockford(4) + '-' + randomCrockford(2);
}

/**
 * A BlotterUpdate id: BUP-XXXX.
 * @returns {string}
 */
export function buildUpdateId() {
  return 'BUP-' + randomCrockford(4);
}

/**
 * An AuditLog id: LOG-XXXXXXXXXX.
 * @returns {string}
 */
export function buildAuditLogId() {
  return 'LOG-' + randomCrockford(10);
}

/**
 * Truncate a date to the start of its UTC hour (Sec. 15.1 timing control).
 * @param {Date} [date]
 * @returns {Date}
 */
export function truncateToHour(date = new Date()) {
  const copy = new Date(date.getTime());
  copy.setUTCMinutes(0, 0, 0);
  return copy;
}

/**
 * Parse a strict date-only value into the UTC midnight Date Prisma stores in
 * a @db.Date column. Returns null for anything that is not a real calendar
 * date (2026-02-31 is rejected, not rolled forward).
 * @param {unknown} value
 * @returns {Date|null}
 */
export function parseDateOnly(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(trimmed + 'T00:00:00.000Z');
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== trimmed) return null;
  return parsed;
}

/**
 * The Prisma unique-constraint field of a P2002 error, or ''.
 * @param {unknown} error
 * @returns {string}
 */
export function uniqueField(error) {
  if (!error || error.code !== 'P2002') return '';
  const target = error.meta ? error.meta.target : null;
  if (Array.isArray(target) && target.length > 0) return String(target[0]);
  if (typeof target === 'string') return target;
  return '';
}
