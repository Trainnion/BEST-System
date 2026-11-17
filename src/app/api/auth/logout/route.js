/**
 * BEST System - POST /api/auth/logout (WP-06, Sec. 6.4 and Sec. 16.3).
 *
 *   200 OK -> the session cookie is cleared
 *   401    -> there is no valid staff session
 *
 * The account's session_valid_after is moved to now, so every cookie that was
 * already issued for this staff member stops working, not just the one that
 * came with this request.
 */

import {
  SESSION_KIND_STAFF,
  STAFF_ROLES,
  clearSessionCookie,
  endStaffSession,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    await endStaffSession(user.id);
    return jsonResponse(
      { ok: true },
      { status: 200, cookie: clearSessionCookie(SESSION_KIND_STAFF) },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
