/**
 * BEST System - POST /api/auth/ping (WP-06, Sec. 6.4 and Sec. 16.3 step 3).
 *
 *   200 OK -> { ok: true, expires_in_s }
 *   401    -> there is no valid session
 *
 * "Stay signed in": this is the only call that slides the idle window of an
 * existing session. It never creates a session and it never extends the
 * absolute 8 hour limit. The cookie that comes back carries last = now and
 * the original iat.
 *
 * The plan lists this endpoint for staff and for residents, so either cookie
 * is accepted and the matching cookie is re-issued.
 */

import { errorResponse, jsonResponse, requireSession } from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { session, cookie } = await requireSession(request);
    return jsonResponse(
      { ok: true, expires_in_s: session.expires_in_s },
      { status: 200, cookie },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
