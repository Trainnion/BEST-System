/**
 * Treasury helpers (WP-13). Validation, masking, and id generation for
 * /api/treasury and /api/treasury/pay. Server-side only.
 */

import { randomInt } from 'node:crypto';

export const PAYMENT_METHODS = Object.freeze(['CASH', 'GCASH_MOCK']);
export const GCASH_REFERENCE_PATTERN = /^[A-Za-z0-9-]{6,40}$/;
export const PAYMENT_ID_YEAR = '2026';
export const PAYMENT_ID_PREFIX = 'PAY-' + PAYMENT_ID_YEAR + '-';
export const LOG_ID_PREFIX = 'LOG-';
export const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const MAX_ID_ATTEMPTS = 8;

export function normalizeGcashReference(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidGcashReference(value) {
  return GCASH_REFERENCE_PATTERN.test(value);
}

export function normalizePaymentMethod(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function isValidPaymentMethod(value) {
  return PAYMENT_METHODS.includes(value);
}

export function parseAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function decimalToNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

export function amountsEqual(a, b) {
  return Math.round(a * 100) === Math.round(b * 100);
}

export function formatMoney(value) {
  const n = decimalToNumber(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export function randomSuffix(length = 4) {
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += ID_ALPHABET[randomInt(0, ID_ALPHABET.length)];
  }
  return out;
}

export function buildPaymentId() {
  return PAYMENT_ID_PREFIX + randomSuffix(4);
}

export function buildLogId() {
  return LOG_ID_PREFIX + PAYMENT_ID_YEAR + '-' + randomSuffix(8);
}

export function uniqueField(error) {
  if (!error || error.code !== 'P2002') return null;
  const target = error.meta ? error.meta.target : null;
  if (Array.isArray(target) && target.length > 0) return String(target[0]);
  if (typeof target === 'string') return target;
  return '';
}

export function asTrimmedString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}
