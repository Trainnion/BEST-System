/**
 * BEST System - GET /api/resident/me (WP-06, Sec. 6.4 and Sec. 13.5).
 *
 *   200 OK -> { masked_name, expires_in_s }
 *   401    -> there is no valid resident session
 *
 * The name is masked to `J*** D**`. The answer re-issues the session cookie
 * with last = now and keeps the original iat, so the absolute 8 hour limit
 * cannot be pushed back. expires_in_s drives the countdown in the PWA.
 */

import {
  RESIDENT_ROLE,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user, session, cookie } = await requireSession(request, [RESIDENT_ROLE]);
    return jsonResponse(
      { masked_name: user.masked_name, expires_in_s: session.expires_in_s },
      { status: 200, cookie },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
