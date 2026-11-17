/**
 * BEST System - business clearance fee helpers (WP-12).
 *
 * Pure helpers: no DB, no network, no PII. Safe to import in tests.
 *
 * The Treasurer's submitted assessed_fee is authoritative. This helper only
 * PROPOSES a fee from the declared gross income using a deterministic bracket;
 * it never overrides the Treasurer's value and it never returns a negative number.
 */

/**
 * Deterministic brackets (annual declared gross income -> proposed fee, PHP).
 *   - below 100,000         -> 500.00
 *   - 100,000 to 499,999   -> 1,000.00
 *   - 500,000 to 999,999   -> 2,000.00
 *   - 1,000,000 and above   -> 5,000.00
 * @type {ReadonlyArray<{ min: number, max: number, fee: number }>}
 */
export const BUSINESS_FEE_BRACKETS = Object.freeze([
  { min: 0, max: 99999.99, fee: 500 },
  { min: 100000, max: 499999.99, fee: 1000 },
  { min: 500000, max: 999999.99, fee: 2000 },
  { min: 1000000, max: Infinity, fee: 5000 },
]);

/**
 * Propose an assessed fee from the declared gross income. Returns 0 when the
 * income is not a finite non-negative number.
 * @param {unknown} declaredGrossIncome
 * @returns {number}
 */
export function proposeAssessedFee(declaredGrossIncome) {
  const income = Number(declaredGrossIncome);
  if (!Number.isFinite(income) || income < 0) return 0;
  for (const bracket of BUSINESS_FEE_BRACKETS) {
    if (income >= bracket.min && income <= bracket.max) return bracket.fee;
  }
  return 0;
}

/**
 * A submitted assessed fee is valid when it is a finite number >= 0.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidAssessedFee(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}
