/** Authenticated resident profile. The resident is always taken from session. */

import { prisma } from '../../../../lib/db.js';
import {
  BUSINESS_APPLICANT_ROLE,
  RESIDENT_ROLE,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function fullName(resident) {
  return [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ');
}

export async function GET(request) {
  try {
    const { user, cookie } = await requireSession(request, [RESIDENT_ROLE, BUSINESS_APPLICANT_ROLE]);
    const resident = await prisma.resident.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        suffix: true,
        purok: true,
      },
    });
    if (!resident) {
      return Response.json({ error: 'RESIDENT_NOT_FOUND', message: 'Resident account could not be found.' }, {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    return jsonResponse({
      account: {
        resident_no: resident.id,
        full_name: fullName(resident),
        purok: resident.purok,
      },
    }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
