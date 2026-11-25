import bcrypt from 'bcryptjs';

import { prisma } from '../../../../lib/db.js';
import {
  AuthError,
  BCRYPT_COST,
  assertNoResidentId,
  assertPasswordPolicy,
  clearSessionCookie,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  try {
    const { user, session } = await requireSession(request, null, { allowMustChangePassword: true });
    const body = await readJsonBody(request);
    assertNoResidentId(body);

    const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';
    const confirmPassword = typeof body.confirm_password === 'string' ? body.confirm_password : '';
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AuthError(400, 'Enter your current password and the new password twice.', 'PASSWORD_FIELDS_REQUIRED');
    }
    if (currentPassword.length > 256 || newPassword.length > 128) {
      throw new AuthError(400, 'Password length is outside the allowed range.', 'PASSWORD_LENGTH_INVALID');
    }
    if (newPassword !== confirmPassword) {
      throw new AuthError(400, 'The new passwords do not match.', 'PASSWORD_CONFIRMATION_MISMATCH');
    }
    assertPasswordPolicy(newPassword, session.kind === 'resident' ? 'resident' : 'staff');

    await prisma.$transaction(async (tx) => {
      if (session.kind === 'staff') {
        const account = await tx.systemUser.findUnique({
          where: { id: user.id },
          select: { id: true, username: true, password_hash: true, is_active: true },
        });
        if (!account || !account.is_active) {
          throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_INVALID');
        }
        if (!(await bcrypt.compare(currentPassword, account.password_hash))) {
          throw new AuthError(401, 'Your current password is incorrect.', 'CURRENT_PASSWORD_INCORRECT');
        }
        if (newPassword.toLowerCase() === account.username.toLowerCase()) {
          throw new AuthError(400, 'The password must be different from your username.', 'PASSWORD_EQUALS_USERNAME');
        }
        if (await bcrypt.compare(newPassword, account.password_hash)) {
          throw new AuthError(400, 'Choose a password you have not used for this account.', 'PASSWORD_REUSED');
        }

        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
        await tx.systemUser.update({
          where: { id: account.id },
          data: {
            password_hash: passwordHash,
            must_change_password: false,
            session_valid_after: new Date(Date.now() + 1),
          },
        });
        await tx.auditLog.create({
          data: {
            id: randomId('LOG'),
            user_id: account.id,
            action: 'CHANGE_PASSWORD',
            target_entity: 'SystemUser',
            target_id: account.id,
            metadata: { self_service: true },
          },
        });
        return;
      }

      const credential = await tx.residentCredential.findUnique({
        where: { resident_id: user.id },
        select: { resident_id: true, password_hash: true, activated_at: true, is_active: true },
      });
      if (!credential || !credential.is_active || !credential.activated_at || !credential.password_hash) {
        throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_INVALID');
      }
      if (!(await bcrypt.compare(currentPassword, credential.password_hash))) {
        throw new AuthError(401, 'Your current password is incorrect.', 'CURRENT_PASSWORD_INCORRECT');
      }
      if (newPassword.toLowerCase() === credential.resident_id.toLowerCase()) {
        throw new AuthError(400, 'The password must be different from your resident number.', 'PASSWORD_EQUALS_RESIDENT_NUMBER');
      }
      if (await bcrypt.compare(newPassword, credential.password_hash)) {
        throw new AuthError(400, 'Choose a password you have not used for this account.', 'PASSWORD_REUSED');
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
      await tx.residentCredential.update({
        where: { resident_id: credential.resident_id },
        data: {
          password_hash: passwordHash,
          must_change_password: false,
          password_changed_at: new Date(),
          failed_attempts: 0,
          locked_until: null,
          session_valid_after: new Date(Date.now() + 1),
        },
      });
    });

    return jsonResponse(
      { success: true, message: 'Password changed. Sign in again with your new password.' },
      { status: 200, cookie: clearSessionCookie(session.kind) },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
