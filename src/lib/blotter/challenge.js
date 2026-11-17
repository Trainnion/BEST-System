/**
 * BEST System - proof-of-work challenges (WP-10, plan Sec. 15.1).
 *
 * Spam control without an IP address: the server issues a short-lived,
 * HMAC-signed nonce; the browser finds a SHA-256 solution with four leading
 * hexadecimal zeroes; the server verifies and consumes it before inserting
 * the report. The challenge store and the global daily counter live on
 * `globalThis` so a Next.js hot reload does not silently reset them.
 *
 * Nothing here reads, stores or derives a client address. The HMAC key is
 * derived from SESSION_SECRET with a labelled context and fails closed when
 * the secret is absent (the route answers 503 CONFIG_MISSING).
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { DAILY_CHALLENGE_CAP, POW_DIFFICULTY, POW_TTL_MS } from './constants.js';

const STORE_KEY = '__bestBlotterPowStoreV1';
const HMAC_LABEL = 'BEST|blotter|pow-challenge|v1';
const MAX_STORED_CHALLENGES = 5000;

/**
 * The process-wide store. `globalThis` survives Next.js HMR and route module
 * re-evaluation; the shape is intentionally small and contains no client data.
 * @returns {{challenges: Map<string, object>, day: string, issued: number}}
 */
function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      challenges: new Map(),
      day: '',
      issued: 0,
    };
  }
  return globalThis[STORE_KEY];
}

/**
 * The UTC day key used by the daily cap.
 * @param {Date} date
 * @returns {string}
 */
function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Derive the 32-byte challenge MAC key from SESSION_SECRET.
 * @param {string} secret
 * @returns {Buffer}
 */
function challengeKey(secret) {
  return createHmac('sha256', secret).update(HMAC_LABEL, 'utf8').digest();
}

/**
 * The signed payload. The signature covers the nonce, difficulty and expiry.
 * @param {Buffer} key
 * @param {string} nonce
 * @param {number} difficulty
 * @param {string} expiresAt
 * @returns {string} lowercase hex
 */
function signChallenge(key, nonce, difficulty, expiresAt) {
  return createHmac('sha256', key)
    .update(nonce + '.' + String(difficulty) + '.' + expiresAt, 'utf8')
    .digest('hex');
}

/**
 * Constant-time comparison of two hexadecimal strings.
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
function hexEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (left.length !== right.length || left.length === 0) return false;
  try {
    return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Count leading zero hexadecimal nibbles in a byte array.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function leadingZeroNibbles(bytes) {
  let nibbles = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    if (byte === 0) {
      nibbles += 2;
      continue;
    }
    if (byte < 16) nibbles += 1;
    break;
  }
  return nibbles;
}

/**
 * Does sha256(nonce + ':' + solution) have at least `difficulty` leading zeroes?
 * @param {string} nonce
 * @param {string} solution
 * @param {number} difficulty
 * @returns {boolean}
 */
export function solutionHasDifficulty(nonce, solution, difficulty) {
  const digest = createHash('sha256').update(nonce + ':' + solution, 'utf8').digest();
  return leadingZeroNibbles(digest) >= difficulty;
}

/**
 * Drop expired challenges and keep the map bounded. Called on every issue and
 * verify so an abandoned client cannot grow the process memory without bound.
 * @param {{challenges: Map<string, object>}} store
 * @param {number} now
 */
function prune(store, now) {
  for (const [nonce, record] of store.challenges) {
    if (!record || record.expires_at_ms <= now) store.challenges.delete(nonce);
  }
  while (store.challenges.size > MAX_STORED_CHALLENGES) {
    const oldest = store.challenges.keys().next();
    if (oldest.done) break;
    store.challenges.delete(oldest.value);
  }
}

/**
 * Issue a signed, single-use challenge and count it against the UTC day cap.
 *
 * @param {string} secret SESSION_SECRET, already validated by the caller
 * @param {number} [now]
 * @returns {{ok: true, challenge: {nonce: string, difficulty: number,
 *   expires_at: string, signature: string}} |
 *   {ok: false, status: 429, error: string}}
 */
export function issueChallenge(secret, now = Date.now()) {
  const store = getStore();
  prune(store, now);

  const today = utcDay(new Date(now));
  if (store.day !== today) {
    store.day = today;
    store.issued = 0;
  }
  if (store.issued >= DAILY_CHALLENGE_CAP) {
    return { ok: false, status: 429, error: 'RATE_LIMITED' };
  }

  const nonce = randomBytes(16).toString('hex');
  const difficulty = POW_DIFFICULTY;
  const expiresAt = new Date(now + POW_TTL_MS).toISOString();
  const signature = signChallenge(challengeKey(secret), nonce, difficulty, expiresAt);

  store.challenges.set(nonce, {
    nonce,
    difficulty,
    expires_at: expiresAt,
    expires_at_ms: now + POW_TTL_MS,
    signature,
  });
  store.issued += 1;

  return {
    ok: true,
    challenge: { nonce, difficulty, expires_at: expiresAt, signature },
  };
}

/**
 * Verify a submitted proof against an issued, unused, unexpired challenge and
 * consume it. The caller must insert the report only after this returns true.
 *
 * @param {unknown} pow the submitted { nonce, solution, signature }
 * @param {string} secret SESSION_SECRET
 * @param {number} [now]
 * @returns {boolean}
 */
export function verifyAndConsumeChallenge(pow, secret, now = Date.now()) {
  if (!pow || typeof pow !== 'object' || Array.isArray(pow)) return false;

  const nonce = typeof pow.nonce === 'string' ? pow.nonce.trim() : '';
  const solution = typeof pow.solution === 'string' ? pow.solution.trim() : '';
  const signature = typeof pow.signature === 'string' ? pow.signature.trim() : '';
  if (!nonce || !solution || !signature) return false;
  if (solution.length > 128) return false;

  const store = getStore();
  const record = store.challenges.get(nonce);
  if (!record) return false;

  if (record.expires_at_ms <= now) {
    store.challenges.delete(nonce);
    return false;
  }

  const expected = signChallenge(
    challengeKey(secret),
    record.nonce,
    record.difficulty,
    record.expires_at,
  );
  if (!hexEqual(expected, signature) || !hexEqual(record.signature, signature)) {
    return false;
  }

  if (!solutionHasDifficulty(record.nonce, solution, record.difficulty)) {
    return false;
  }

  // Single use: consume before the caller writes the report.
  store.challenges.delete(nonce);
  return true;
}
