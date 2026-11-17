/**
 * BEST System - day-only formatting for public blotter answers (Sec. 15.1).
 *
 * Public timestamps are day precision only: exact times live inside the
 * encrypted payload and must never be reconstructed from a public response.
 * Isomorphic and dependency free.
 */

/**
 * The YYYY-MM-DD part of a Date or an ISO string, or null.
 * @param {Date|string|null|undefined} value
 * @returns {string|null}
 */
export function dayOnly(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * "15 Nov 2026" for a day-only value, rendered in UTC so a date never shifts.
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDay(value) {
  const day = dayOnly(value);
  if (!day) return '-';
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(day + 'T00:00:00.000Z'));
  } catch {
    return day;
  }
}

export default dayOnly;
