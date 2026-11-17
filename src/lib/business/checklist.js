/**
 * BEST System - business clearance checklist helpers (WP-12).
 *
 * Pure helpers: no DB, no network, no PII. Safe to import in tests.
 */

/**
 * The four checklist items created with every business clearance. None of them
 * is ever auto-complied; the Treasurer verifies each one in person.
 * @type {ReadonlyArray<{ item_code: string, title: string }>}
 */
export const BUSINESS_CHECKLIST_TEMPLATE = Object.freeze([
  { item_code: 'DTI_SEC', title: 'DTI / SEC Registration' },
  { item_code: 'LEASE', title: 'Lease Contract / Proof of Business Address' },
  { item_code: 'FIRE', title: 'Fire Safety Inspection Certificate' },
  { item_code: 'SANITARY', title: 'Sanitary Permit' },
]);

/**
 * @param {unknown} itemCode
 * @returns {boolean}
 */
export function isBusinessChecklistCode(itemCode) {
  return BUSINESS_CHECKLIST_TEMPLATE.some((item) => item.item_code === itemCode);
}

/**
 * Every checklist item must be complied for approval.
 * @param {Array<{ is_complied?: unknown }>} items
 * @returns {boolean}
 */
export function allChecklistComplied(items) {
  return Array.isArray(items) && items.length > 0 && items.every((item) => item && item.is_complied === true);
}
