/**
 * BEST System - /api/admin/residents (WP-14, plan Sec. 13, Sec. 6.4, Sec. 6.5).
 *
 * Resident Directory & Activation Slips for Staff/Admin.
 *
 * GET  - List & search residents.
 * POST - Issue one-time activation slip (Sec. 13.2) or Register resident (Assisted intake).
 */

import { prisma } from '../../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  maskName,
  readJsonBody,
  requirePermission,
  requireSession,
  issueActivation,
  randomId,
  PERMISSIONS,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_DEFAULT = 1;
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

function clampInt(raw, fallback, min, max) {
  const parsed = Number.parseInt(String(raw == null ? '' : raw), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    // Requires assisted intake / activation slip permission
    requirePermission(user.role, PERMISSIONS.ISSUE_ACTIVATION_SLIP);

    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').trim().slice(0, 64);
    const purok = (url.searchParams.get('purok') || '').trim();
    const page = clampInt(url.searchParams.get('page'), PAGE_DEFAULT, 1, 100000);
    const size = clampInt(url.searchParams.get('size'), PAGE_SIZE_DEFAULT, 1, PAGE_SIZE_MAX);

    const where = {};
    if (purok) where.purok = { contains: purok, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, residents] = await prisma.$transaction([
      prisma.resident.count({ where }),
      prisma.resident.findMany({
        where,
        orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          middle_name: true,
          suffix: true,
          birth_date: true,
          gender: true,
          civil_status: true,
          purok: true,
          is_registered_voter: true,
          is_verified: true,
          created_at: true,
          credential: {
            select: {
              activated_at: true,
              activation_expires: true,
              locked_until: true,
            },
          },
        },
      }),
    ]);

    const items = residents.map((r) => {
      const isActivated = !!r.credential?.activated_at;
      const hasPendingActivation =
        !isActivated && r.credential?.activation_expires && new Date(r.credential.activation_expires) > new Date();

      return {
        id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        middle_name: r.middle_name,
        suffix: r.suffix,
        birth_date: r.birth_date,
        gender: r.gender,
        civil_status: r.civil_status,
        purok: r.purok,
        is_registered_voter: r.is_registered_voter,
        is_verified: r.is_verified,
        is_activated: isActivated,
        has_pending_activation: !!hasPendingActivation,
        is_locked: !!(r.credential?.locked_until && new Date(r.credential.locked_until) > new Date()),
        created_at: r.created_at,
      };
    });

    return jsonResponse({
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size) || 1,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.ISSUE_ACTIVATION_SLIP);

    const body = await readJsonBody(request);
    const action = (body.action || '').trim().toUpperCase();

    if (action === 'ISSUE_ACTIVATION') {
      const residentId = (body.resident_id || '').trim();
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
      return jsonResponse({
        success: true,
        resident_id: resident.id,
        resident_name: `${resident.first_name} ${resident.last_name}`,
        activation_code: slip.activation_code,
        expires_at: slip.expires_at,
      });
    }

    if (action === 'CREATE_RESIDENT') {
      const {
        first_name,
        last_name,
        middle_name,
        suffix,
        birth_date,
        gender,
        civil_status,
        purok,
        street_address,
        contact_number,
        emergency_contact_name,
        emergency_contact_phone,
        is_registered_voter,
      } = body;

      if (!first_name || !last_name || !birth_date || !gender || !purok) {
        return jsonResponse(
          { error: 'BAD_INPUT', message: 'First name, last name, birth date, gender, and purok are required.' },
          { status: 400 },
        );
      }

      const count = await prisma.resident.count();
      const nextNum = String(count + 1).padStart(4, '0');
      const newId = `RES-${new Date().getFullYear()}-${nextNum}`;

      const created = await prisma.resident.create({
        data: {
          id: newId,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          middle_name: middle_name ? middle_name.trim() : null,
          suffix: suffix ? suffix.trim() : null,
          birth_date: new Date(birth_date),
          gender: gender.trim(),
          civil_status: civil_status || 'SINGLE',
          purok: purok.trim(),
          street_address: (street_address || purok).trim(),
          contact_number: (contact_number || '09000000000').trim(),
          emergency_contact_name: (emergency_contact_name || 'Relative').trim(),
          emergency_contact_phone: (emergency_contact_phone || '09000000000').trim(),
          is_registered_voter: typeof is_registered_voter === 'boolean' ? is_registered_voter : true,
          is_verified: true,
        },
        select: { id: true, first_name: true, last_name: true, purok: true },
      });

      return jsonResponse({ success: true, resident: created }, { status: 201 });
    }

    return jsonResponse({ error: 'UNKNOWN_ACTION', message: 'Action not supported.' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
