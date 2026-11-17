/**
 * BEST System - POST /api/resident/activate (WP-06, Sec. 6.4 and Sec. 13.3).
 *
 *   200 OK -> { resident_no, masked_name, expires_in_s } + the best_res cookie
 *   400    -> a generic answer for every mismatch (unknown resident, wrong
 *             code, wrong birth date, expired code, code already used), a
 *             missing field, a password that breaks the policy, or a body
 *             that carries a resident_id
 *
 * The endpoint is public: whoever holds the paper slip holds the code. The
 * code is single use, it lives for 7 days and only its bcrypt hash is stored.
 * The answer never says which check failed, so the endpoint cannot be used to
 * find out whether a resident number exists.
 */

import {
  RESIDENT_ROLE,
  SESSION_KIND_RESIDENT,
  activateResidentAccount,
  assertNoResidentId,
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
    const result = await activateResidentAccount({
      residentNo: body.resident_no,
      activationCode: body.activation_code,
      birthDate: body.birth_date,
      newPassword: body.new_password,
    });
    const issued = await issueSessionFor(SESSION_KIND_RESIDENT, result.resident.id, RESIDENT_ROLE);
    return jsonResponse(
      {
        resident_no: result.resident.id,
        masked_name: result.maskedName,
        expires_in_s: issued.expires_in_s,
      },
      { status: 200, cookie: issued.cookie },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
