/**
 * BEST System - V5 field-level encryption at rest (WP-03, Sec. 12.4).
 *
 * Stored format (one text value per column):
 *
 *     v1.<kid>.<iv>.<ciphertext>.<tag>
 *
 * - `v1` and `<kid>` are plain text; iv (12 bytes), ciphertext and tag (16
 *   bytes) are canonical base64 (exactly what Buffer.toString('base64')
 *   emits).
 * - AES-256-GCM. The authenticated context (AAD) is exactly
 *   `<PrismaModel>.<column>`, for example `Resident.contact_number` or
 *   `BlotterReport.enc_payload`, so a value copied into another column or
 *   model fails to decrypt.
 * - The key is FIELD_ENC_KEY (32 random bytes, base64). FIELD_ENC_KEY_ID
 *   defaults to `fk-1`. The configuration is validated at module load: a
 *   server with a missing or malformed key refuses to start.
 * - Missing/null values pass through unchanged. Every failure throws a
 *   CryptoError with a stable code and a generic message - never plaintext,
 *   never key material, never logged here.
 *
 * This module is SERVER SIDE ONLY (node:crypto + process.env). It is never
 * shipped to a browser, and there is no public-key endpoint in V5.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { CryptoError, CRYPTO_ERROR_CODES } from './errors.js';

/** Storage format version prefix. */
export const FIELD_FORMAT_VERSION = 'v1';

/** AES-GCM IV length in bytes. */
export const FIELD_IV_BYTES = 12;

/** AES-GCM authentication tag length in bytes. */
export const FIELD_TAG_BYTES = 16;

/** FIELD_ENC_KEY must decode to exactly this many bytes. */
export const FIELD_KEY_BYTES = 32;

/** Default key id when FIELD_ENC_KEY_ID is not set. */
export const DEFAULT_KEY_ID = 'fk-1';

/** Key id written into new ciphertexts (`FIELD_ENC_KEY_ID`, default `fk-1`). */
export const CURRENT_KEY_ID = (process.env.FIELD_ENC_KEY_ID || '').trim() || DEFAULT_KEY_ID;

/**
 * The columns the Prisma extension encrypts at rest (Sec. 12.5). Exactly one
 * source of truth for `<Model>.<column>` AAD contexts.
 */
export const ENCRYPTED_COLUMNS = Object.freeze({
  Resident: Object.freeze([
    'contact_number',
    'email',
    'street_address',
    'emergency_contact_name',
    'emergency_contact_phone',
  ]),
  DocumentRequest: Object.freeze(['purpose', 'ctc_number']),
  BusinessClearanceEntry: Object.freeze([
    'business_name',
    'nature_of_business',
    'business_address',
  ]),
  BlotterReport: Object.freeze(['enc_payload']),
  BlotterUpdate: Object.freeze(['internal_notes']),
});

/**
 * Canonical standard base64 (exactly what Buffer.toString('base64') emits).
 * The empty string is allowed only where the caller asks for it (AES-GCM of
 * an empty plaintext produces an empty ciphertext part).
 * @param {string} value
 * @param {{allowEmpty?: boolean}} [options]
 * @returns {boolean}
 */
function isCanonicalBase64(value, options = {}) {
  if (typeof value !== 'string') return false;
  if (value.length === 0) return options.allowEmpty === true;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const buffer = Buffer.from(value, 'base64');
  if (buffer.length === 0) return false;
  return buffer.toString('base64') === value;
}

/** Key ids are short printable tokens, e.g. `fk-1`, `fk-2`. */
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

let fieldConfig = null;

/**
 * Load and validate FIELD_ENC_KEY / FIELD_ENC_KEY_ID from the environment.
 * Idempotent; the result is cached for the process lifetime.
 * @returns {{ keys: Map<string, Buffer>, currentKeyId: string }}
 */
function loadFieldConfig() {
  if (fieldConfig) return fieldConfig;
  const raw = process.env.FIELD_ENC_KEY;
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new CryptoError(CRYPTO_ERROR_CODES.NOT_CONFIGURED, 'FIELD_ENC_KEY is not configured');
  }
  const encoded = raw.trim();
  if (!isCanonicalBase64(encoded)) {
    throw new CryptoError(CRYPTO_ERROR_CODES.FIELD_KEY_INVALID, 'FIELD_ENC_KEY must be canonical base64');
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== FIELD_KEY_BYTES) {
    throw new CryptoError(
      CRYPTO_ERROR_CODES.FIELD_KEY_INVALID,
      'FIELD_ENC_KEY must decode to exactly ' + FIELD_KEY_BYTES + ' bytes',
    );
  }
  const configuredId = (process.env.FIELD_ENC_KEY_ID || '').trim();
  if (configuredId && !KEY_ID_PATTERN.test(configuredId)) {
    throw new CryptoError(CRYPTO_ERROR_CODES.FIELD_KEY_INVALID, 'FIELD_ENC_KEY_ID is malformed');
  }
  const currentKeyId = configuredId || DEFAULT_KEY_ID;
  fieldConfig = { keys: new Map([[currentKeyId, key]]), currentKeyId };
  return fieldConfig;
}

/**
 * Assert that the field encryption configuration is usable. Called at module
 * load (so importing src/lib/db.js refuses to start a badly configured app)
 * and safe to call again anywhere.
 *
 * During static analysis and build time (`next build`), Next.js imports route
 * handlers to collect route metadata. If FIELD_ENC_KEY is not yet provisioned
 * in the build environment (e.g. multi-stage Docker build without secrets),
 * assertion is deferred until runtime calls.
 */
export function assertFieldCryptoConfig() {
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    process.env.npm_lifecycle_event === 'build'
  ) {
    return;
  }
  loadFieldConfig();
}

/** Validate at module load: refuse to import when the key is missing/invalid. */
assertFieldCryptoConfig();

/**
 * @param {string} context `<PrismaModel>.<column>` AAD context
 * @returns {string}
 */
function assertContext(context) {
  if (typeof context !== 'string' || context.trim() === '') {
    throw new CryptoError(CRYPTO_ERROR_CODES.BAD_INPUT, 'an AAD context is required');
  }
  return context;
}

/** @returns {Buffer} the current encryption key */
function currentKey() {
  const { keys, currentKeyId } = loadFieldConfig();
  return keys.get(currentKeyId);
}

/**
 * Encrypt one field value. null/undefined pass through unchanged.
 * @param {string|null|undefined} plain
 * @param {string} context e.g. `Resident.contact_number`
 * @returns {string|null|undefined} `v1.<kid>.<iv>.<ct>.<tag>`
 */
export function encryptField(plain, context) {
  if (plain === null || plain === undefined) return plain;
  if (typeof plain !== 'string') {
    throw new CryptoError(CRYPTO_ERROR_CODES.BAD_INPUT, 'the field value must be a string');
  }
  const contextString = assertContext(context);
  const iv = randomBytes(FIELD_IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', currentKey(), iv, { authTagLength: FIELD_TAG_BYTES });
  cipher.setAAD(Buffer.from(contextString, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    FIELD_FORMAT_VERSION,
    loadFieldConfig().currentKeyId,
    iv.toString('base64'),
    ciphertext.toString('base64'),
    tag.toString('base64'),
  ].join('.');
}

/**
 * True when the value has the exact shape of a V5 field ciphertext (5 dot
 * separated parts, v1, known key-id shape, canonical base64 parts). Used to
 * fail closed instead of silently "decrypting" plaintext.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isFieldCiphertext(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split('.');
  if (parts.length !== 5) return false;
  const [version, kid, iv, ciphertext, tag] = parts;
  if (version !== FIELD_FORMAT_VERSION) return false;
  if (!KEY_ID_PATTERN.test(kid)) return false;
  if (!isCanonicalBase64(iv) || Buffer.from(iv, 'base64').length !== FIELD_IV_BYTES) return false;
  if (!isCanonicalBase64(ciphertext, { allowEmpty: true })) return false;
  if (!isCanonicalBase64(tag) || Buffer.from(tag, 'base64').length !== FIELD_TAG_BYTES) return false;
  return true;
}

/**
 * Decrypt one stored field value with the exact `<Model>.<column>` context.
 * Tampered data, a wrong context (AAD) or an unknown key id throws
 * CryptoError; null/undefined pass through unchanged.
 * @param {string|null|undefined} stored
 * @param {string} context e.g. `BlotterReport.enc_payload`
 * @returns {string|null|undefined}
 */
export function decryptField(stored, context) {
  if (stored === null || stored === undefined) return stored;
  if (typeof stored !== 'string') {
    throw new CryptoError(CRYPTO_ERROR_CODES.INVALID_FORMAT, 'the stored value is not a ciphertext string');
  }
  const contextString = assertContext(context);
  const parts = stored.split('.');
  if (parts.length !== 5) {
    throw new CryptoError(CRYPTO_ERROR_CODES.INVALID_FORMAT, 'the stored value is not a v1 ciphertext');
  }
  const [version, kid, iv, ciphertext, tag] = parts;
  if (version !== FIELD_FORMAT_VERSION) {
    throw new CryptoError(
      CRYPTO_ERROR_CODES.UNSUPPORTED_VERSION,
      'the stored value uses an unsupported format version',
    );
  }
  const { keys } = loadFieldConfig();
  const key = keys.get(kid);
  if (!key) {
    throw new CryptoError(CRYPTO_ERROR_CODES.KID_UNKNOWN, 'the stored value uses an unknown key id');
  }
  if (!isCanonicalBase64(iv) || Buffer.from(iv, 'base64').length !== FIELD_IV_BYTES) {
    throw new CryptoError(CRYPTO_ERROR_CODES.INVALID_FORMAT, 'the stored value is not a v1 ciphertext');
  }
  if (!isCanonicalBase64(ciphertext, { allowEmpty: true })) {
    throw new CryptoError(CRYPTO_ERROR_CODES.INVALID_FORMAT, 'the stored value is not a v1 ciphertext');
  }
  if (!isCanonicalBase64(tag) || Buffer.from(tag, 'base64').length !== FIELD_TAG_BYTES) {
    throw new CryptoError(CRYPTO_ERROR_CODES.INVALID_FORMAT, 'the stored value is not a v1 ciphertext');
  }
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'), {
      authTagLength: FIELD_TAG_BYTES,
    });
    decipher.setAAD(Buffer.from(contextString, 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    if (error instanceof CryptoError) throw error;
    throw new CryptoError(
      CRYPTO_ERROR_CODES.DECRYPT_FAILED,
      'the stored value failed authentication (wrong key, wrong column or tampered data)',
    );
  }
}
