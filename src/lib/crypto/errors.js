/**
 * BEST System - crypto core (WP-03) - error taxonomy (V5).
 *
 * Every failure in this package is a `CryptoError` with a stable, machine
 * readable `code`. Messages are deliberately generic: they never contain
 * plaintext, key material or the ciphertext itself, and clients must branch
 * on `code` only (V5 contract, Sec. 12.4).
 *
 * Plain `Error` / `OpenSSLError` objects are never allowed to escape this
 * package, because their messages can leak crypto internals.
 */

export const CRYPTO_ERROR_CODES = Object.freeze({
  /** Caller passed something the API cannot use (wrong type, empty context...). */
  BAD_INPUT: 'BAD_INPUT',
  /** Stored value does not match the `v1.<kid>.<iv>.<ct>.<tag>` contract. */
  INVALID_FORMAT: 'INVALID_FORMAT',
  /** Stored value uses a format version other than v1. */
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  /** The key id inside the ciphertext is not loaded on this server. */
  KID_UNKNOWN: 'KID_UNKNOWN',
  /** AES-256-GCM authentication failed: wrong key, wrong column (AAD) or tampered data. */
  DECRYPT_FAILED: 'DECRYPT_FAILED',
  /** FIELD_ENC_KEY is present but malformed (not base64, not 32 bytes, bad key id). */
  FIELD_KEY_INVALID: 'FIELD_KEY_INVALID',
  /** Required configuration (FIELD_ENC_KEY) is not present. */
  NOT_CONFIGURED: 'NOT_CONFIGURED',
});

export class CryptoError extends Error {
  /**
   * @param {string} code one of CRYPTO_ERROR_CODES
   * @param {string} [message] generic human readable detail (never plaintext/key material)
   */
  constructor(code, message) {
    super(message || code || CRYPTO_ERROR_CODES.BAD_INPUT);
    this.name = 'CryptoError';
    this.code = code || CRYPTO_ERROR_CODES.BAD_INPUT;
  }
}

export default CryptoError;
