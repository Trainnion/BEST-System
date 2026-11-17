/**
 * BEST System - the blotter views (WP-10, plan Sec. 6.4 + Sec. 12.5 + Sec. 15).
 *
 * `publicBlotterView` is built from an explicit Prisma `select`; this module
 * never sees the encrypted payload, the internal notes, the assigned officer
 * or staff data. Public timestamps are day precision only.
 *
 * `staffBlotterView` is the authorized staff detail: it carries the
 * decrypted narrative, exact location and exact time plus the staff internal
 * notes. It is only ever called from /api/admin/blotter/[code], which
 * requires a staff session and writes a VIEW_ENCRYPTED audit row first.
 */

import { dayOnly } from './format.js';

/**
 * @param {{
 *   tracking_code: string,
 *   incident_type: string,
 *   status: string,
 *   created_at: Date|string,
 *   updates?: Array<{action_taken: string, public_notes?: string|null, created_at: Date|string}>,
 * }} row
 * @returns {{
 *   tracking_code: string,
 *   incident_type: string,
 *   status: string,
 *   updates: Array<{action_taken: string, public_notes: string|null, created_at: string|null}>,
 *   created_at: string|null,
 * }}
 */
export function publicBlotterView(row) {
  const updates = Array.isArray(row.updates) ? row.updates.slice() : [];
  updates.sort((left, right) => {
    const a = left && left.created_at ? new Date(left.created_at).getTime() : 0;
    const b = right && right.created_at ? new Date(right.created_at).getTime() : 0;
    return a - b;
  });

  return {
    tracking_code: row.tracking_code,
    incident_type: row.incident_type,
    status: row.status,
    updates: updates.map((update) => ({
      action_taken: update.action_taken,
      public_notes: typeof update.public_notes === 'string' ? update.public_notes : null,
      created_at: dayOnly(update.created_at),
    })),
    created_at: dayOnly(row.created_at),
  };
}

/**
 * The full timestamp as an ISO string, or null.
 * @param {Date|string|null|undefined} value
 * @returns {string|null}
 */
function isoOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * The staff detail view of one report.
 *
 * @param {{
 *   tracking_code: string,
 *   incident_type: string,
 *   incident_zone?: string|null,
 *   incident_date?: Date|string|null,
 *   urgency_level?: string|null,
 *   status: string,
 *   created_at: Date|string,
 * }} report
 * @param {Array<{
 *   id?: string,
 *   action_taken: string,
 *   public_notes?: string|null,
 *   internal_notes?: string|null,
 *   created_at: Date|string,
 * }>} updates
 * @param {{narrative: string, exact_location: string, exact_time: string}|null} payload
 * @returns {object} the staff detail payload
 */
export function staffBlotterView(report, updates, payload) {
  const rows = Array.isArray(updates) ? updates.slice() : [];
  rows.sort((left, right) => {
    const a = left && left.created_at ? new Date(left.created_at).getTime() : 0;
    const b = right && right.created_at ? new Date(right.created_at).getTime() : 0;
    return a - b;
  });

  return {
    tracking_code: report.tracking_code,
    incident_type: report.incident_type,
    incident_zone: typeof report.incident_zone === 'string' ? report.incident_zone : null,
    incident_date: dayOnly(report.incident_date),
    urgency_level: typeof report.urgency_level === 'string' ? report.urgency_level : null,
    status: report.status,
    created_at: isoOrNull(report.created_at),
    narrative: payload ? payload.narrative : '',
    exact_location: payload ? payload.exact_location : '',
    exact_time: payload ? payload.exact_time : '',
    updates: rows.map((update) => ({
      id: typeof update.id === 'string' ? update.id : null,
      action_taken: update.action_taken,
      public_notes: typeof update.public_notes === 'string' ? update.public_notes : null,
      internal_notes: typeof update.internal_notes === 'string' ? update.internal_notes : null,
      created_at: isoOrNull(update.created_at),
    })),
  };
}

export default publicBlotterView;
