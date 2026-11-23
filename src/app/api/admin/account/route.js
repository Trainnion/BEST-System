/** Staff can manage the display name on their own account. */

import { prisma } from '../../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user, cookie } = await requireSession(request, STAFF_ROLES);
    return jsonResponse({ account: { full_name: user.full_name, role: user.role, username: user.username } }, {
      status: 200,
      cookie,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const { user, cookie } = await requireSession(request, STAFF_ROLES);
    const body = await readJsonBody(request);
    if (typeof body.full_name !== 'string') {
      return Response.json({ error: 'BAD_INPUT', message: 'Enter your full name.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const fullName = body.full_name.trim();
    const genericNames = new Set(['admin', 'administrator', 'barangay administrator', 'barangay staff', 'staff', 'official']);
    if (fullName.length < 2 || fullName.length > 120 || /[\u0000-\u001f\u007f]/.test(fullName)) {
      return Response.json({ error: 'BAD_INPUT', message: 'Full name must be 2 to 120 characters.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }
    if (genericNames.has(fullName.toLowerCase())) {
      return Response.json({ error: 'BAD_INPUT', message: 'Enter your real name instead of a generic role label.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const account = await prisma.$transaction(async (tx) => {
      const updated = await tx.systemUser.update({
        where: { id: user.id },
        data: { full_name: fullName },
        select: { full_name: true, role: true, username: true },
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: user.id,
          action: 'UPDATE_PROFILE',
          target_entity: 'SystemUser',
          target_id: user.id,
          metadata: { field: 'full_name' },
        },
      });
      return updated;
    });

    return jsonResponse({ success: true, account }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
