/**
 * BEST System - POST /api/auth/login (WP-06, Sec. 6.4).
 *
 *   200 OK  -> { user: { username, role, full_name, must_change_password } } + Set-Cookie
 *   400      -> a missing field, or a body that carries a resident_id
 *   401      -> wrong username or password (one generic answer for every case)
 *
 * The answer never says whether the account exists: an unknown or inactive
 * account still pays for one bcrypt comparison. No IP address is read or
 * stored, and the body may never carry a resident_id (invariant 10).
 */

import {
  SESSION_KIND_STAFF,
  assertNoResidentId,
  authenticateStaff,
  errorResponse,
  issueSessionFor,
  jsonResponse,
  readJsonBody,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await readJsonBody(request);
  try {
    assertNoResidentId(body);
    const user = await authenticateStaff(body.username, body.password);
    const issued = await issueSessionFor(SESSION_KIND_STAFF, user.id, user.role);
    return jsonResponse(
      {
        user: {
          username: user.username,
          role: user.role,
          full_name: user.full_name,
          must_change_password: user.must_change_password,
        },
      },
      { status: 200, cookie: issued.cookie },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
