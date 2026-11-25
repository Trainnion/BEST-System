/** Admin-only activation or deactivation for a resident login account. */

import { prisma } from '../../../../../../lib/db.js';
import {
  PERMISSIONS,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
} from '../../../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, context) {
  try {
    const { user, cookie } = await requireSession(request, ['ADMIN']);
    requirePermission(user.role, PERMISSIONS.USER_ACCOUNTS_AUDIT);

    const residentId = typeof context?.params?.id === 'string' ? context.params.id.trim() : '';
    if (!residentId) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Resident ID is required.' }, { status: 400 });
    }

    const body = await readJsonBody(request);
    if (typeof body.is_active !== 'boolean') {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Choose whether this account should be active.' }, { status: 400 });
    }

    const credential = await prisma.residentCredential.findUnique({
      where: { resident_id: residentId },
      select: { resident_id: true },
    });
    if (!credential) {
      return jsonResponse({ error: 'NOT_FOUND', message: 'This resident does not have an account yet.' }, { status: 404 });
    }

    const account = await prisma.$transaction(async (tx) => {
      const data = { is_active: body.is_active };
      if (body.is_active) {
        data.session_valid_after = new Date(Date.now());
      } else {
        data.session_valid_after = new Date(Date.now() + 1);
        data.activation_hash = null;
        data.activation_expires = null;
      }

      const updated = await tx.residentCredential.update({
        where: { resident_id: residentId },
        data,
        select: { resident_id: true, is_active: true, activated_at: true },
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: user.id,
          action: body.is_active ? 'ACTIVATE_RESIDENT_ACCOUNT' : 'DEACTIVATE_RESIDENT_ACCOUNT',
          target_entity: 'ResidentCredential',
          target_id: residentId,
          metadata: { is_active: body.is_active },
        },
      });
      return updated;
    });

    return jsonResponse({ success: true, account }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
