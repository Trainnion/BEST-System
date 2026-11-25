import bcrypt from 'bcryptjs';

import { prisma } from '../../../../../../lib/db.js';
import {
  AuthError,
  BCRYPT_COST,
  PERMISSIONS,
  assertNoResidentId,
  assertPasswordPolicy,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
} from '../../../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MANAGED_ROLES = new Set(['STAFF', 'TREASURER', 'OFFICIAL']);

export async function PATCH(request, context) {
  try {
    const { user: admin, cookie } = await requireSession(request, ['ADMIN']);
    requirePermission(admin.role, PERMISSIONS.USER_ACCOUNTS_AUDIT);

    const userId = typeof context?.params?.id === 'string' ? context.params.id.trim() : '';
    if (!userId) throw new AuthError(400, 'Staff account ID is required.', 'ACCOUNT_ID_REQUIRED');

    const body = await readJsonBody(request);
    assertNoResidentId(body);
    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';
    const confirmPassword = typeof body.confirm_password === 'string' ? body.confirm_password : '';
    if (!newPassword || !confirmPassword) {
      throw new AuthError(400, 'Enter the temporary password twice.', 'PASSWORD_FIELDS_REQUIRED');
    }
    if (newPassword.length > 128) throw new AuthError(400, 'Password must be 128 characters or fewer.', 'PASSWORD_LENGTH_INVALID');
    if (newPassword !== confirmPassword) {
      throw new AuthError(400, 'The passwords do not match.', 'PASSWORD_CONFIRMATION_MISMATCH');
    }
    assertPasswordPolicy(newPassword, 'staff');

    await prisma.$transaction(async (tx) => {
      const target = await tx.systemUser.findUnique({
        where: { id: userId },
        select: { id: true, username: true, password_hash: true, role: true },
      });
      if (!target || !MANAGED_ROLES.has(target.role)) {
        throw new AuthError(404, 'Staff account not found.', 'ACCOUNT_NOT_FOUND');
      }
      if (newPassword.toLowerCase() === target.username.toLowerCase()) {
        throw new AuthError(400, 'The password must be different from the username.', 'PASSWORD_EQUALS_USERNAME');
      }
      if (await bcrypt.compare(newPassword, target.password_hash)) {
        throw new AuthError(400, 'Choose a password that is different from the current password.', 'PASSWORD_REUSED');
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
      await tx.systemUser.update({
        where: { id: target.id },
        data: {
          password_hash: passwordHash,
          must_change_password: true,
          session_valid_after: new Date(Date.now() + 1),
        },
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: admin.id,
          action: 'RESET_STAFF_PASSWORD',
          target_entity: 'SystemUser',
          target_id: target.id,
          metadata: { role: target.role, must_change_password: true },
        },
      });
    });

    return jsonResponse({ success: true, must_change_password: true }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
