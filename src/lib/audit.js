/**
 * BEST System - WP-03 - audit helper for encrypted-field views (Sec. 12.6).
 *
 * Feature agents call `logEncryptedView(...)` after a staff-only endpoint
 * decrypts sensitive fields. It writes one `AuditLog` row:
 *
 *   - action: `VIEW_ENCRYPTED`
 *   - target_entity: the Prisma model, e.g. `BlotterReport`
 *   - target_id: String(targetId)
 *   - metadata: `{ fields: [column names] }` - field NAMES only, never
 *     plaintext, never ciphertext
 *   - ip_address: null (no IP is recorded for these views)
 *
 * Failures propagate to the caller: an audited view that cannot be audited
 * must not silently succeed.
 */

import { randomBytes } from 'node:crypto';
import { prisma } from './db.js';

/**
 * Crockford base32 alphabet (no I, L, O, U to keep ids unambiguous).
 */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Build an AuditLog id: `LOG-` + 10 Crockford characters.
 * @returns {string}
 */
export function buildAuditId() {
  const bytes = randomBytes(10);
  let id = 'LOG-';
  for (const byte of bytes) {
    id += CROCKFORD_ALPHABET[byte % 32];
  }
  return id;
}

/**
 * Write an audit row for one encrypted-field view.
 * @param {{
 *   userId: string,
 *   model: string,
 *   targetId: string|number,
 *   fields: string[],
 * }} input
 * @returns {Promise<object>} the created AuditLog row
 */
export async function logEncryptedView({ userId, model, targetId, fields }) {
  return prisma.auditLog.create({
    data: {
      id: buildAuditId(),
      user_id: userId,
      action: 'VIEW_ENCRYPTED',
      target_entity: model,
      target_id: String(targetId),
      metadata: { fields: Array.isArray(fields) ? fields.map(String) : [] },
      ip_address: null,
    },
  });
}

export default logEncryptedView;
