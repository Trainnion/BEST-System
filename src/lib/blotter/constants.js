/**
 * BEST System - anonymous blotter constants (WP-10, plan Sec. 1.3C,
 * Sec. 6.4, Sec. 12, Sec. 15).
 *
 * Isomorphic: no Node-only imports, so the browser form, the tracking page
 * and the route handlers share one vocabulary. Nothing here is secret.
 */

/** Incident classes accepted by POST /api/blotter (plan line 378). */
export const INCIDENT_TYPES = Object.freeze([
  'NOISE',
  'PROPERTY_DAMAGE',
  'DISPUTE',
  'THEFT',
  'GENERAL',
]);

/** Citizen-facing labels for the incident classes. */
export const INCIDENT_TYPE_LABELS = Object.freeze({
  NOISE: 'Noise or disturbance',
  PROPERTY_DAMAGE: 'Property damage',
  DISPUTE: 'Dispute',
  THEFT: 'Theft',
  GENERAL: 'General concern',
});

/** Coarse public zones. The exact location is encrypted, never selected here. */
export const INCIDENT_ZONES = Object.freeze([
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
  'Other',
]);

/** Urgency levels of the Prisma `UrgencyLevel` enum. */
export const URGENCY_LEVELS = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/** Blotter lifecycle (plan Sec. 1.3C). SCOPE-01: nothing beyond CLOSED. */
export const BLOTTER_STATUSES = Object.freeze([
  'FILED',
  'UNDER_REVIEW',
  'ACTION_TAKEN',
  'CLOSED',
]);

/** The one transition map the PATCH handler enforces. */
export const BLOTTER_TRANSITIONS = Object.freeze({
  FILED: Object.freeze(['UNDER_REVIEW']),
  UNDER_REVIEW: Object.freeze(['ACTION_TAKEN', 'CLOSED']),
  ACTION_TAKEN: Object.freeze(['CLOSED']),
  CLOSED: Object.freeze([]),
});

/** Human labels for the public timeline. */
export const BLOTTER_STATUS_LABELS = Object.freeze({
  FILED: 'Filed',
  UNDER_REVIEW: 'Under review',
  ACTION_TAKEN: 'Action taken',
  CLOSED: 'Closed',
});

/** Tracking codes: BLT-XXXX-XX over the Crockford alphabet (no I, L, O, U). */
export const TRACKING_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * The public tracking format. The plan example (BLT-7X9K-42) and the
 * required literal format are 11 characters even though the prose says
 * "exactly 10"; the literal format is what this build issues.
 */
export const TRACKING_PATTERN = /^BLT-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/;

/** Proof-of-work: four leading hexadecimal zeroes (Sec. 15.1). */
export const POW_DIFFICULTY = 4;

/** A challenge is usable for five minutes and only once. */
export const POW_TTL_MS = 5 * 60 * 1000;

/** Global in-memory daily cap (UTC day), independent of any client address. */
export const DAILY_CHALLENGE_CAP = 200;

/**
 * Server-side length limits (plan Sec. 12.6 item 7).
 *   - the narrative is capped at 4,000 characters;
 *   - the exact location is a short free-text place ("behind the covered
 *     court, near the canal"), so 300 characters is generous;
 *   - the exact time is a clock time, so 64 characters is generous;
 *   - staff notes are bounded the same way.
 */
export const MAX_NARRATIVE_LENGTH = 4000;
export const MAX_EXACT_LOCATION_LENGTH = 300;
export const MAX_EXACT_TIME_LENGTH = 64;
export const MAX_ACTION_LENGTH = 500;
export const MAX_PUBLIC_NOTES_LENGTH = 4000;
export const MAX_INTERNAL_NOTES_LENGTH = 4000;

/**
 * Is this one of the five incident classes?
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIncidentType(value) {
  return typeof value === 'string' && INCIDENT_TYPES.includes(value);
}

/**
 * Is this one of the public coarse zones?
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIncidentZone(value) {
  return typeof value === 'string' && INCIDENT_ZONES.includes(value);
}

/**
 * Is this a stored blotter status?
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBlotterStatus(value) {
  return typeof value === 'string' && BLOTTER_STATUSES.includes(value);
}

/**
 * May the report move from `from` to `to`?
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  const allowed = BLOTTER_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}
