/**
 * BEST System - GET /api/auth/me (WP-06, Sec. 6.4 and Sec. 16.3 step 5).
 *
 *   200 OK -> { user: { username, role, full_name, must_change_password }, expires_in_s }
 *   401    -> there is no valid staff session
 *
 * The answer re-issues the session cookie with last = now (sliding window) and
 * keeps the original iat, so the absolute 8 hour limit cannot be pushed back.
 * expires_in_s drives the countdown in SessionGuard.
 */

import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user, session, cookie } = await requireSession(request, STAFF_ROLES);
    return jsonResponse(
      {
        user: {
          username: user.username,
          role: user.role,
          full_name: user.full_name,
          must_change_password: user.must_change_password,
        },
        expires_in_s: session.expires_in_s,
      },
      { status: 200, cookie },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
