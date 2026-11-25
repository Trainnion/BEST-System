/** Admin-only activation or deactivation of non-admin staff accounts. */

import { prisma } from '../../../../../lib/db.js';
import {
  PERMISSIONS,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
} from '../../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, context) {
  try {
    const { user: admin, cookie } = await requireSession(request, ['ADMIN']);
    requirePermission(admin.role, PERMISSIONS.USER_ACCOUNTS_AUDIT);

    const userId = typeof context?.params?.id === 'string' ? context.params.id.trim() : '';
    if (!userId) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Staff account ID is required.' }, { status: 400 });
    }

    const body = await readJsonBody(request);
    if (typeof body.is_active !== 'boolean') {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Choose whether this account should be active.' }, { status: 400 });
    }

    const target = await prisma.systemUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true, is_active: true },
    });
    if (!target || target.role === 'ADMIN') {
      return jsonResponse({ error: 'NOT_FOUND', message: 'Staff account not found.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const account = await tx.systemUser.update({
        where: { id: target.id },
        data: body.is_active
          ? { is_active: true, session_valid_after: new Date(Date.now()) }
          : { is_active: false, session_valid_after: new Date(Date.now() + 1) },
        select: {
          id: true,
          username: true,
          full_name: true,
          role: true,
          is_active: true,
          last_login: true,
          created_at: true,
        },
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: admin.id,
          action: body.is_active ? 'ACTIVATE_STAFF_ACCOUNT' : 'DEACTIVATE_STAFF_ACCOUNT',
          target_entity: 'SystemUser',
          target_id: target.id,
          metadata: { role: target.role, is_active: body.is_active },
        },
      });
      return account;
    });

    return jsonResponse({ success: true, user: updated }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
