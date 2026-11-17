/**
 * BEST System - business clearance status helpers (WP-12).
 *
 * Pure helpers: no DB, no network, no PII. Safe to import in tests.
 */

/** Stored business clearance statuses (Prisma BusinessStatus enum). */
export const BUSINESS_STATUSES = Object.freeze([
  'INTAKE_SCHEDULED',
  'IN_PERSON_SCREENING',
  'TREASURER_ASSESSED',
  'APPROVED',
  'REJECTED',
]);

/** Allowed forward transitions. Skipping or moving backwards is rejected. */
export const BUSINESS_TRANSITIONS = Object.freeze({
  INTAKE_SCHEDULED: Object.freeze(['IN_PERSON_SCREENING']),
  IN_PERSON_SCREENING: Object.freeze(['TREASURER_ASSESSED', 'REJECTED']),
  TREASURER_ASSESSED: Object.freeze(['APPROVED', 'REJECTED']),
  APPROVED: Object.freeze([]),
  REJECTED: Object.freeze([]),
});

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBusinessStatus(value) {
  return typeof value === 'string' && BUSINESS_STATUSES.includes(value);
}

/**
 * A transition is allowed when it moves one step forward along the lifecycle,
 * or is a no-op on the same status. Skipping or moving backwards is rejected.
 * @param {unknown} from
 * @param {unknown} to
 * @returns {boolean}
 */
export function canTransitionBusinessStatus(from, to) {
  if (typeof from !== 'string' || typeof to !== 'string') return false;
  if (!BUSINESS_STATUSES.includes(from) || !BUSINESS_STATUSES.includes(to)) return false;
  if (from === to) return true;
  const allowed = BUSINESS_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

/**
 * TREASURER_ASSESSED requires income, fee and notes.
 * @param {{ declared_gross_income?: unknown, assessed_fee?: unknown, assessment_notes?: unknown }} values
 * @returns {boolean}
 */
export function hasAssessmentCore(values) {
  const income = Number(values && values.declared_gross_income);
  const fee = Number(values && values.assessed_fee);
  const notes = values && values.assessment_notes;
  return (
    Number.isFinite(income) &&
    income >= 0 &&
    Number.isFinite(fee) &&
    fee >= 0 &&
    typeof notes === 'string' &&
    notes.trim() !== ''
  );
}

/**
 * APPROVED additionally requires an assessor and a fully complied checklist.
 * @param {{
 *   assessed_by_id?: unknown,
 *   declared_gross_income?: unknown,
 *   assessed_fee?: unknown,
 *   assessment_notes?: unknown,
 *   checklist?: Array<{ is_complied?: unknown }>,
 * }} values
 * @returns {boolean}
 */
export function hasApprovalRequirements(values) {
  if (!hasAssessmentCore(values)) return false;
  if (typeof (values && values.assessed_by_id) !== 'string' || !(values.assessed_by_id).trim()) {
    return false;
  }
  const checklist = Array.isArray(values && values.checklist) ? values.checklist : [];
  if (checklist.length === 0) return false;
  return checklist.every((item) => item && item.is_complied === true);
}
