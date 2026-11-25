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

export async function PATCH(request, context) {
  try {
    const { user: admin, cookie } = await requireSession(request, ['ADMIN']);
    requirePermission(admin.role, PERMISSIONS.USER_ACCOUNTS_AUDIT);

    const residentId = typeof context?.params?.id === 'string' ? context.params.id.trim() : '';
    if (!residentId) throw new AuthError(400, 'Resident ID is required.', 'ACCOUNT_ID_REQUIRED');

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
    assertPasswordPolicy(newPassword, 'resident');
    if (newPassword.toLowerCase() === residentId.toLowerCase()) {
      throw new AuthError(400, 'The password must be different from the resident number.', 'PASSWORD_EQUALS_RESIDENT_NUMBER');
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.residentCredential.findUnique({
        where: { resident_id: residentId },
        select: { resident_id: true, password_hash: true, activated_at: true },
      });
      if (!target) throw new AuthError(404, 'Resident account not found.', 'ACCOUNT_NOT_FOUND');
      if (!target.activated_at || !target.password_hash) {
        throw new AuthError(409, 'This resident has not activated an account. Issue an activation slip instead.', 'ACCOUNT_NOT_ACTIVATED');
      }
      if (await bcrypt.compare(newPassword, target.password_hash)) {
        throw new AuthError(400, 'Choose a password that is different from the current password.', 'PASSWORD_REUSED');
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
      await tx.residentCredential.update({
        where: { resident_id: target.resident_id },
        data: {
          password_hash: passwordHash,
          must_change_password: true,
          password_changed_at: new Date(),
          failed_attempts: 0,
          locked_until: null,
          session_valid_after: new Date(Date.now() + 1),
        },
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: admin.id,
          action: 'RESET_RESIDENT_PASSWORD',
          target_entity: 'ResidentCredential',
          target_id: target.resident_id,
          metadata: { must_change_password: true },
        },
      });
    });

    return jsonResponse({ success: true, must_change_password: true }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
