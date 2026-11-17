/**
 * BEST System - GET /api/directory (WP-08, plan Sec. 6.4, FR-07).
 *
 *   200 -> { officials: [ { id, full_name, position, committee, contact_info } ] }
 *
 * Public and read-only: active BarangayOfficial rows ordered by position then
 * full name. Only the OFFICE contact is returned - never user_id, never an
 * email, never a password hash (NFR-01 / invariant 3: no PII beyond what the
 * plan allows a public roster to show).
 *
 * Cacheable for a minute: public, max-age=60, stale-while-revalidate=300.
 */

import { prisma } from '../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  readJsonBody,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_CACHE_HEADERS = Object.freeze({
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
});

/**
 * @returns {Promise<Response>}
 */
export async function GET() {
  try {
    const officials = await prisma.barangayOfficial.findMany({
      where: { is_active: true },
      orderBy: [{ display_order: 'asc' }, { position: 'asc' }, { full_name: 'asc' }],
      select: {
        id: true,
        full_name: true,
        position: true,
        committee: true,
        contact_info: true,
        display_order: true,
        photo_url: true,
      },
    });

    return Response.json({ officials }, { status: 200, headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * BEST System - POST /api/directory (WP-14, plan Sec. 6.4, Sec. 6.5).
 * Create official. Allowed roles: OFFICIAL, ADMIN (PERMISSIONS.MANAGE_DIRECTORY).
 */
export async function POST(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.MANAGE_DIRECTORY);

    const body = await readJsonBody(request);
    const fullName = (body.full_name || '').trim();
    const position = (body.position || '').trim();
    const committee = (body.committee || '').trim();
    const contactInfo = (body.contact_info || '').trim();
    const displayOrder = Number.parseInt(body.display_order, 10) || 1;
    const photoUrl = body.photo_url ? String(body.photo_url).trim() : null;

    if (!fullName || !position) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Full name and position are required.' }, { status: 400 });
    }

    const count = await prisma.barangayOfficial.count();
    const nextId = `OFF-${String(count + 1).padStart(4, '0')}`;

    const official = await prisma.barangayOfficial.create({
      data: {
        id: nextId,
        full_name: fullName,
        position,
        committee: committee || 'General Governance',
        contact_info: contactInfo || 'Barangay Hall',
        display_order: displayOrder,
        photo_url: photoUrl,
        is_active: true,
      },
    });

    return jsonResponse({ success: true, official }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * BEST System - PATCH /api/directory (WP-14, plan Sec. 6.4, Sec. 6.5).
 * Update official. Allowed roles: OFFICIAL, ADMIN.
 */
export async function PATCH(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.MANAGE_DIRECTORY);

    const body = await readJsonBody(request);
    const id = (body.id || '').trim();
    if (!id) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Official ID is required.' }, { status: 400 });
    }

    const data = {};
    if (typeof body.full_name === 'string') data.full_name = body.full_name.trim();
    if (typeof body.position === 'string') data.position = body.position.trim();
    if (typeof body.committee === 'string') data.committee = body.committee.trim();
    if (typeof body.contact_info === 'string') data.contact_info = body.contact_info.trim();
    if (typeof body.display_order === 'number') data.display_order = body.display_order;
    if (typeof body.is_active === 'boolean') data.is_active = body.is_active;
    if (body.photo_url !== undefined) data.photo_url = body.photo_url ? String(body.photo_url).trim() : null;

    const official = await prisma.barangayOfficial.update({
      where: { id },
      data,
    });

    return jsonResponse({ success: true, official });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * BEST System - DELETE /api/directory (WP-14).
 * Soft-deactivate official. Allowed roles: OFFICIAL, ADMIN.
 */
export async function DELETE(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.MANAGE_DIRECTORY);

    const url = new URL(request.url);
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Official ID is required.' }, { status: 400 });
    }

    const official = await prisma.barangayOfficial.update({
      where: { id },
      data: { is_active: false },
    });

    return jsonResponse({ success: true, official });
  } catch (error) {
    return errorResponse(error);
  }
}
