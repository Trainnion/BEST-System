import { test, expect } from '@playwright/test';

// field.js asserts FIELD_ENC_KEY at module load time (assertFieldCryptoConfig()
// runs on import). Because ESM imports are hoisted, importing 'field.js' at the
// top of this file would fail the assertion before this block runs. We therefore:
//   1. Ensure FIELD_ENC_KEY is present in the test runner's environment before
//      any import of field.js, and
//   2. Use dynamic import so the module is loaded only after the key is set.
//
// The real key (44-char canonical base64) is read from .env on the host; a known
// valid 44-char key is provided as a fallback so the module does not throw at
// import time when the key is missing from process.env.
if (!process.env.FIELD_ENC_KEY) {
  process.env.FIELD_ENC_KEY = 'kILx1cLnFq0+AX+3xSm7U50r2jgzJTrvWxr+FPeW64g=';
}

const fieldModule = await import('../src/lib/crypto/field.js');
const { encryptField, decryptField, isFieldCiphertext } = fieldModule;

test.describe('V5 Field-Level Encryption at Rest (ENC-01, NFR-01)', () => {
  test('encryptField and decryptField execute transparent AES-256-GCM roundtrip with AAD context', () => {
    const plaintext = 'Confidential citizen blotter narrative text';
    const context = 'BlotterReport.enc_payload';

    const ciphertext = encryptField(plaintext, context);
    expect(isFieldCiphertext(ciphertext)).toBe(true);
    expect(ciphertext).not.toBe(plaintext);

    // Decrypt with same context succeeds
    const decrypted = decryptField(ciphertext, context);
    expect(decrypted).toBe(plaintext);

    // Tampered ciphertext fails closed
    const tampered = ciphertext.slice(0, -4) + 'AAAA';
    expect(() => decryptField(tampered, context)).toThrow();

    // Wrong AAD context fails closed
    expect(() => decryptField(ciphertext, 'Resident.contact_number')).toThrow();
  });
});
