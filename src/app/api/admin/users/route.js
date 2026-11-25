/** Admin-only creation and listing of non-admin staff accounts. */

import bcrypt from 'bcryptjs';

import { prisma } from '../../../../lib/db.js';
import {
  BCRYPT_COST,
  PERMISSIONS,
  assertPasswordPolicy,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MANAGED_ROLES = Object.freeze(['STAFF', 'TREASURER', 'OFFICIAL']);
const GENERIC_NAMES = new Set(['admin', 'administrator', 'barangay administrator', 'barangay staff', 'staff', 'official']);

function accountView(user) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    must_change_password: user.must_change_password,
    last_login: user.last_login,
    created_at: user.created_at,
  };
}

async function requireAdmin(request) {
  const session = await requireSession(request, ['ADMIN']);
  requirePermission(session.user.role, PERMISSIONS.USER_ACCOUNTS_AUDIT);
  return session;
}

export async function GET(request) {
  try {
    const { cookie } = await requireAdmin(request);
    const users = await prisma.systemUser.findMany({
      where: { role: { in: MANAGED_ROLES } },
      orderBy: [{ is_active: 'desc' }, { full_name: 'asc' }],
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        is_active: true,
        must_change_password: true,
        last_login: true,
        created_at: true,
      },
    });
    return jsonResponse({ items: users.map(accountView) }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { user: admin, cookie } = await requireAdmin(request);
    const body = await readJsonBody(request);
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const role = typeof body.role === 'string' ? body.role.trim().toUpperCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (fullName.length < 2 || fullName.length > 120 || /[\u0000-\u001f\u007f]/.test(fullName) || GENERIC_NAMES.has(fullName.toLowerCase())) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Enter the staff member’s real full name.' }, { status: 400 });
    }
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.' }, { status: 400 });
    }
    if (!MANAGED_ROLES.includes(role)) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Choose Staff, Treasurer, or Official. Administrator accounts cannot be created here.' }, { status: 400 });
    }
    assertPasswordPolicy(password, 'staff');
    if (password.toLowerCase() === username) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'The password must be different from the username.' }, { status: 400 });
    }

    const existing = await prisma.systemUser.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      return jsonResponse({ error: 'USERNAME_TAKEN', message: 'That username is already in use.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const created = await prisma.$transaction(async (tx) => {
      const account = await tx.systemUser.create({
        data: {
          id: randomId('USR'),
          username,
          password_hash: passwordHash,
          full_name: fullName,
          role,
          is_active: true,
          must_change_password: false,
        },
        select: {
          id: true,
          username: true,
          full_name: true,
          role: true,
          is_active: true,
          must_change_password: true,
          last_login: true,
          created_at: true,
        },
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: admin.id,
          action: 'CREATE_STAFF_ACCOUNT',
          target_entity: 'SystemUser',
          target_id: account.id,
          metadata: { role: account.role },
        },
      });
      return account;
    });

    return jsonResponse({ success: true, user: accountView(created) }, { status: 201, cookie });
  } catch (error) {
    if (error?.code === 'P2002') {
      return jsonResponse({ error: 'USERNAME_TAKEN', message: 'That username is already in use.' }, { status: 409 });
    }
    return errorResponse(error);
  }
}
