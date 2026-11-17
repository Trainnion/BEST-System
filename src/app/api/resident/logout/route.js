/**
 * BEST System - POST /api/resident/logout (WP-06, Sec. 6.4 and Sec. 13.3).
 *
 *   200 OK -> the best_res cookie is cleared
 *   401    -> there is no valid resident session
 *
 * The ResidentCredential's session_valid_after is moved to now, so every
 * cookie that was already issued for this resident stops working.
 */

import {
  RESIDENT_ROLE,
  SESSION_KIND_RESIDENT,
  clearSessionCookie,
  endResidentSession,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user } = await requireSession(request, [RESIDENT_ROLE]);
    await endResidentSession(user.id);
    return jsonResponse(
      { ok: true },
      { status: 200, cookie: clearSessionCookie(SESSION_KIND_RESIDENT) },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
