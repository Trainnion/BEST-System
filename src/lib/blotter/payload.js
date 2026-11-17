/**
 * BEST System - the encrypted blotter payload shape (WP-10, plan Sec. 12.5).
 *
 * V5: the citizen sends plaintext over HTTPS. The server puts these three
 * fields into ONE JSON string and the Prisma extension encrypts that string
 * into `BlotterReport.enc_payload` (AES-256-GCM, key id stored with the
 * ciphertext). Nothing else goes inside: the coarse zone, the incident date,
 * the urgency and the status stay readable so staff can queue and filter
 * reports (Sec. 12.5).
 *
 * The key names match the API field names, so the shape is one contract
 * shared by the public POST route and the staff detail route.
 */

/**
 * Build the JSON string that becomes `enc_payload`.
 *
 * @param {{narrative?: unknown, exact_location?: unknown, exact_time?: unknown}} input
 * @returns {string} the JSON payload, ready for the encrypting extension
 */
export function buildPayload(input) {
  const source = input && typeof input === 'object' ? input : {};
  return JSON.stringify({
    narrative: typeof source.narrative === 'string' ? source.narrative : '',
    exact_location: typeof source.exact_location === 'string' ? source.exact_location : '',
    exact_time: typeof source.exact_time === 'string' ? source.exact_time : '',
  });
}

/**
 * Parse a decrypted payload back into its three fields.
 *
 * @param {unknown} value the plaintext JSON string
 * @returns {{narrative: string, exact_location: string, exact_time: string}|null}
 *   null when the value is not a usable payload (a damaged record fails
 *   safely and never leaks content).
 */
export function parsePayload(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return {
    narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
    exact_location: typeof parsed.exact_location === 'string' ? parsed.exact_location : '',
    exact_time: typeof parsed.exact_time === 'string' ? parsed.exact_time : '',
  };
}

export default buildPayload;
