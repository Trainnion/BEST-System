/**
 * BEST System - POST /api/resident/login (WP-06, Sec. 6.4 and Sec. 13.3 step 4).
 *
 *   200 OK -> { resident_no, masked_name, expires_in_s } + the best_res cookie
 *   400    -> a missing field, or a body that carries a resident_id
 *   401    -> wrong resident number or password (one generic answer for every
 *             case: unknown number, never activated, wrong password)
 *   429    -> the account is locked, with a Retry-After header
 *
 * The failure counters live on the ResidentCredential row, so no IP address is
 * ever stored. Five failures lock the account for 15 minutes; every further
 * lock doubles the wait, up to 24 hours.
 */

import {
  RESIDENT_ROLE,
  SESSION_KIND_RESIDENT,
  assertNoResidentId,
  authenticateResident,
  errorResponse,
  issueSessionFor,
  jsonResponse,
  maskName,
  readJsonBody,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await readJsonBody(request);
  try {
    assertNoResidentId(body);
    const { resident } = await authenticateResident(body.resident_no, body.password);
    const issued = await issueSessionFor(SESSION_KIND_RESIDENT, resident.id, RESIDENT_ROLE);
    return jsonResponse(
      {
        resident_no: resident.id,
        masked_name: maskName(resident.first_name, resident.last_name),
        expires_in_s: issued.expires_in_s,
      },
      { status: 200, cookie: issued.cookie },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
