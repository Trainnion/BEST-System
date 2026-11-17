import { test, expect } from '@playwright/test';
import {
  encryptField,
  decryptField,
  isFieldCiphertext,
} from '../src/lib/crypto/field.js';

test.describe('V5 Field-Level Encryption at Rest (ENC-01, NFR-01)', () => {
  test('encryptField and decryptField execute transparent AES-256-GCM roundtrip with AAD context', () => {
    // Generate a temporary 32-byte key for in-memory test if not set
    if (!process.env.FIELD_ENC_KEY) {
      process.env.FIELD_ENC_KEY = Buffer.alloc(32, 0x42).toString('base64');
    }

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
