/**
 * Small display helpers shared by the public client components.
 * Formatting only: no PII, no storage, no network.
 */

/**
 * ISO date -> "15 Nov 2026" in the viewer's locale.
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * ISO date/time -> "15 Nov 2026, 3:04 PM".
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

/**
 * Money -> "PHP 50.00".
 * @param {unknown} amount
 * @returns {string}
 */
export function peso(amount) {
  const number = Number(amount);
  if (!Number.isFinite(number)) return 'PHP 0.00';
  return 'PHP ' + number.toFixed(2);
}
