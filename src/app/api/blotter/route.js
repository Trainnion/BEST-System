/**
 * BEST System - POST /api/blotter (WP-10, plan Sec. 1.3C, Sec. 6.4, Sec. 12,
 * Sec. 15).
 *
 * Public, unauthenticated, anonymous intake. The citizen sends PLAINTEXT over
 * HTTPS and the server encrypts the sensitive fields before storage:
 *   - `narrative`, `exact_location` and `exact_time` go into ONE JSON string
 *     that becomes `BlotterReport.enc_payload`; the Prisma extension encrypts
 *     it (AES-256-GCM, key id stored with the ciphertext);
 *   - the coarse zone, incident type, incident date, urgency and status stay
 *     readable so staff can queue and filter reports (Sec. 12.5);
 *   - proof-of-work replaces IP rate limiting and is consumed before insert;
 *   - `created_at` is truncated to the UTC hour so a public timestamp cannot
 *     be correlated with a network log (Sec. 15.1);
 *   - an optional `X-Client-Request-Id` header (UUID v4, sent only by the
 *     offline outbox replay) is hashed with SHA-256 and used for a 24-hour
 *     in-memory de-duplication of replays. The hash is never written to the
 *     database and never logged (Sec. 6.4);
 *   - no cookie is read, no cookie is set, no other request header is
 *     inspected and nothing is logged.
 *
 * Length limits (Sec. 6.4 / Sec. 12.6 item 7):
 *   - narrative:      at most 4,000 characters (at least 10 after trimming);
 *   - exact_location: a short free-text place, at most 300 characters;
 *   - exact_time:     a clock time, at most 64 characters.
 *
 * 201 -> { success: true, tracking_code, status: "FILED" }
 * 200 -> the same body when a replay's X-Client-Request-Id was already seen
 *        (the original report is returned, no second row is written)
 * 400 -> invalid body, a resident_id, an oversized field or bad proof
 * 503 -> { error: "CONFIG_MISSING" } when SESSION_SECRET is absent or shorter
 *        than 32 characters (fail closed, never a default), matching the
 *        challenge route's gate
 */

import { createHash } from 'node:crypto';

import { prisma } from '../../../lib/db.js';
import {
  AuthError,
  assertNoResidentId,
  errorResponse,
  jsonResponse,
  readJsonBody,
} from '../../../lib/auth.js';
import {
  INCIDENT_TYPES,
  INCIDENT_ZONES,
  MAX_EXACT_LOCATION_LENGTH,
  MAX_EXACT_TIME_LENGTH,
  MAX_NARRATIVE_LENGTH,
  URGENCY_LEVELS,
} from '../../../lib/blotter/constants.js';
import { verifyAndConsumeChallenge } from '../../../lib/blotter/challenge.js';
import { buildPayload } from '../../../lib/blotter/payload.js';
import {
  buildTrackingCode,
  parseDateOnly,
  truncateToHour,
  uniqueField,
} from '../../../lib/blotter/tracking.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Mirror of the client-side floor so junk bodies are rejected cheaply. */
const MIN_NARRATIVE_LENGTH = 10;

/** SESSION_SECRET must meet the challenge route's 32-character floor. */
const MIN_SECRET_LENGTH = 32;

const DEDUP_KEY = '__bestBlotterReplayDedupV1';
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours, in memory only
const MAX_DEDUP_ENTRIES = 1000;

/**
 * The process-wide replay de-duplication store. `globalThis` survives
 * Next.js HMR; the values are SHA-256 hashes, never the raw client id.
 * @returns {Map<string, {at: number, tracking_code: string, status: string}>}
 */
function getDedupStore() {
  if (!globalThis[DEDUP_KEY]) {
    globalThis[DEDUP_KEY] = new Map();
  }
  return globalThis[DEDUP_KEY];
}

/**
 * Drop expired hashes and keep the map bounded.
 * @param {Map<string, {at: number}>} store
 * @param {number} now
 */
function pruneDedup(store, now) {
  for (const [key, entry] of store) {
    if (!entry || now - entry.at >= DEDUP_TTL_MS) store.delete(key);
  }
  while (store.size > MAX_DEDUP_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

/**
 * The SHA-256 hash of the outbox replay header, or '' when absent/invalid.
 * @param {Request} request
 * @returns {string}
 */
function replayHash(request) {
  let raw = '';
  try {
    raw = (request.headers.get('x-client-request-id') || '').trim();
  } catch {
    raw = '';
  }
  // UUID shape only; anything weirder is ignored rather than trusted.
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(raw)) {
    return '';
  }
  return createHash('sha256').update(raw.toLowerCase(), 'utf8').digest('hex');
}

/**
 * A previously replayed submission's answer, or null.
 * @param {string} key the SHA-256 hash from replayHash()
 * @returns {{tracking_code: string, status: string}|null}
 */
function dedupLookup(key) {
  if (!key) return null;
  const now = Date.now();
  const store = getDedupStore();
  pruneDedup(store, now);
  const hit = store.get(key);
  if (hit && now - hit.at < DEDUP_TTL_MS) return hit;
  if (hit) store.delete(key);
  return null;
}

/**
 * Remember a submission's answer so a replay returns it without a new row.
 * @param {string} key the SHA-256 hash from replayHash()
 * @param {string} trackingCode
 * @param {string} status
 */
function dedupRemember(key, trackingCode, status) {
  if (!key) return;
  const now = Date.now();
  const store = getDedupStore();
  pruneDedup(store, now);
  store.set(key, { at: now, tracking_code: trackingCode, status });
}

/**
 * Normalise a value against a fixed list.
 * @param {unknown} value
 * @param {readonly string[]} allowed
 * @param {string} field
 * @returns {string}
 * @throws {AuthError} 400
 */
function pickAllowed(value, allowed, field) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const match = allowed.find((entry) => entry.toLowerCase() === raw.toLowerCase());
  if (!match) {
    throw new AuthError(
      400,
      field + ' must be one of: ' + allowed.join(', ') + '.',
      'FIELD_INVALID',
    );
  }
  return match;
}

/**
 * Read a bounded free-text field.
 * @param {unknown} value
 * @param {string} field
 * @param {number} maxLength
 * @param {boolean} required
 * @returns {string}
 * @throws {AuthError} 400
 */
function boundedText(value, field, maxLength, required) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    if (required) {
      throw new AuthError(400, field + ' is required.', 'FIELD_REQUIRED');
    }
    return '';
  }
  if (raw.length > maxLength) {
    throw new AuthError(
      400,
      field + ' is too long (at most ' + maxLength + ' characters).',
      'FIELD_TOO_LONG',
    );
  }
  return raw;
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    assertNoResidentId(body);

    // A replay whose 24-hour hash is known gets the original answer back
    // without burning a fresh proof or writing a second row.
    const replay = replayHash(request);
    const seen = dedupLookup(replay);
    if (seen) {
      return jsonResponse(
        { success: true, tracking_code: seen.tracking_code, status: seen.status },
        { status: 200 },
      );
    }

    const incidentType = pickAllowed(body.incident_type, INCIDENT_TYPES, 'incident_type');
    const incidentZone = pickAllowed(body.incident_zone, INCIDENT_ZONES, 'incident_zone');

    const incidentDate = parseDateOnly(body.incident_date);
    if (!incidentDate) {
      throw new AuthError(
        400,
        'incident_date must be a real date in YYYY-MM-DD form.',
        'INCIDENT_DATE_INVALID',
      );
    }

    const urgencyLevel =
      body.urgency_level === undefined || body.urgency_level === null || body.urgency_level === ''
        ? 'MEDIUM'
        : pickAllowed(body.urgency_level, URGENCY_LEVELS, 'urgency_level');

    const narrative = boundedText(
      body.narrative,
      'narrative',
      MAX_NARRATIVE_LENGTH,
      true,
    );
    if (narrative.length < MIN_NARRATIVE_LENGTH) {
      throw new AuthError(
        400,
        'narrative must be at least ' + MIN_NARRATIVE_LENGTH + ' characters.',
        'NARRATIVE_TOO_SHORT',
      );
    }
    // The exact place is a short free-text spot ("behind the covered court");
    // the exact time is a clock time. Both bounds are documented in
    // src/lib/blotter/constants.js (MAX_EXACT_LOCATION_LENGTH / MAX_EXACT_TIME_LENGTH).
    const exactLocation = boundedText(
      body.exact_location,
      'exact_location',
      MAX_EXACT_LOCATION_LENGTH,
      true,
    );
    const exactTime = boundedText(
      body.exact_time,
      'exact_time',
      MAX_EXACT_TIME_LENGTH,
      true,
    );

    const secret = typeof process.env.SESSION_SECRET === 'string' ? process.env.SESSION_SECRET.trim() : '';
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
      return jsonResponse({ error: 'CONFIG_MISSING' }, { status: 503 });
    }

    // Consume the single-use proof before any row is written.
    if (!verifyAndConsumeChallenge(body.pow, secret)) {
      throw new AuthError(
        400,
        'Proof of work is missing, wrong, expired or already used. Request a fresh challenge and try again.',
        'POW_INVALID',
      );
    }

    // The Prisma extension encrypts this string into BlotterReport.enc_payload.
    const payload = buildPayload({ narrative, exact_location: exactLocation, exact_time: exactTime });
    const createdAt = truncateToHour();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const trackingCode = buildTrackingCode();
      try {
        await prisma.blotterReport.create({
          data: {
            tracking_code: trackingCode,
            incident_type: incidentType,
            incident_zone: incidentZone,
            incident_date: incidentDate,
            enc_payload: payload,
            urgency_level: urgencyLevel,
            status: 'FILED',
            created_at: createdAt,
          },
        });
        dedupRemember(replay, trackingCode, 'FILED');
        return jsonResponse(
          { success: true, tracking_code: trackingCode, status: 'FILED' },
          { status: 201 },
        );
      } catch (error) {
        if (uniqueField(error) === 'tracking_code') continue;
        throw error;
      }
    }

    throw new AuthError(500, 'A tracking code could not be issued.', 'CODE_GENERATION_FAILED');
  } catch (error) {
    return errorResponse(error);
  }
}
