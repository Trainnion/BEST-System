/**
 * BEST System - GET /api/blotter/challenge (WP-10, plan Sec. 6.4 + Sec. 15.1).
 *
 * Issues a five-minute, HMAC-signed, single-use proof-of-work challenge and
 * counts it against a process-wide daily cap (200 per UTC day). There is no
 * IP address, cookie or header input anywhere in this handler.
 *
 * 200 -> { nonce, difficulty, expires_at, signature }
 * 429 -> { error: "RATE_LIMITED" } when the UTC day cap is reached
 * 503 -> { error: "CONFIG_MISSING" } when SESSION_SECRET is absent or short
 */

import { jsonResponse } from '../../../../lib/auth.js';
import { issueChallenge } from '../../../../lib/blotter/challenge.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** SESSION_SECRET must be at least the auth core's 32 characters. */
const MIN_SECRET_LENGTH = 32;

/**
 * @returns {Promise<Response>}
 */
export async function GET() {
  const raw = process.env.SESSION_SECRET;
  const secret = typeof raw === 'string' ? raw.trim() : '';
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return jsonResponse({ error: 'CONFIG_MISSING' }, { status: 503 });
  }

  const result = issueChallenge(secret);
  if (!result.ok) {
    return jsonResponse(
      { error: result.error },
      { status: result.status, headers: { 'Retry-After': '3600' } },
    );
  }
  return jsonResponse(result.challenge);
}
