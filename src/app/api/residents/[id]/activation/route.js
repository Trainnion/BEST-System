/**
 * BEST System - POST /api/residents/[id]/activation (plan Sec. 6.4, Sec. 6.5, Sec. 13.2).
 *
 * Issue a one-time activation slip for a resident.
 * Allowed roles: STAFF, ADMIN (PERMISSIONS.ISSUE_ACTIVATION_SLIP).
 */

import { prisma } from '../../../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  requirePermission,
  requireSession,
  issueActivation,
  PERMISSIONS,
} from '../../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.ISSUE_ACTIVATION_SLIP);

    const residentId = (context?.params?.id || '').trim();
    if (!residentId) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Resident ID is required.' }, { status: 400 });
    }

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, first_name: true, last_name: true },
    });
    if (!resident) {
      return jsonResponse({ error: 'NOT_FOUND', message: 'Resident not found.' }, { status: 404 });
    }

    const slip = await issueActivation(residentId, user.id);

    return jsonResponse(
      {
        success: true,
        resident_id: resident.id,
        activation_code: slip.activation_code,
        expires_at: slip.expires_at,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
