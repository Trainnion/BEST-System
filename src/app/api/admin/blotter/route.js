/**
 * BEST System - GET /api/admin/blotter (WP-14, plan Sec. 1.3C, Sec. 6.4, Sec. 6.5).
 *
 * Staff blotter review queue.
 * Requires STAFF or ADMIN session with blotter review permission.
 *
 * Returns operational metadata only:
 *   tracking_code, incident_type, incident_date, incident_zone, urgency,
 *   status, created_at, updated_at, has_updates
 *
 * Sensitive narrative/exact location/exact time stay encrypted in the DB
 * and are NEVER returned in list queries. Staff detail view (/api/admin/blotter/[code])
 * decrypts on demand with audit logging.
 */

import { prisma } from '../../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../../lib/auth.js';
import {
  BLOTTER_STATUSES,
  BLOTTER_STATUS_GROUPS,
  INCIDENT_TYPES,
  INCIDENT_ZONES,
  URGENCY_LEVELS,
} from '../../../../lib/blotter/constants.js';

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
    requirePermission(user.role, PERMISSIONS.UPDATE_BLOTTER_STATUS);

    const url = new URL(request.url);
    const status = (url.searchParams.get('status') || '').trim().toUpperCase();
    const urgency = (url.searchParams.get('urgency') || '').trim().toUpperCase();
    const incidentType = (url.searchParams.get('type') || '').trim().toUpperCase();
    const zone = (url.searchParams.get('zone') || '').trim().toUpperCase();
    const search = (url.searchParams.get('search') || '').trim().slice(0, 64);
    const page = clampInt(url.searchParams.get('page'), PAGE_DEFAULT, 1, 100000);
    const size = clampInt(url.searchParams.get('size'), PAGE_SIZE_DEFAULT, 1, PAGE_SIZE_MAX);

    const where = {};
    if (Object.hasOwn(BLOTTER_STATUS_GROUPS, status)) {
      where.status = { in: BLOTTER_STATUS_GROUPS[status] };
    } else if (BLOTTER_STATUSES.includes(status)) {
      where.status = status;
    }
    if (URGENCY_LEVELS.includes(urgency)) where.urgency_level = urgency;
    if (INCIDENT_TYPES.includes(incidentType)) where.incident_type = incidentType;
    if (INCIDENT_ZONES.includes(zone)) where.incident_zone = zone;
    if (search) {
      where.OR = [
        { tracking_code: { contains: search, mode: 'insensitive' } },
        { incident_zone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, reports] = await prisma.$transaction([
      prisma.blotterReport.count({ where }),
      prisma.blotterReport.findMany({
        where,
        orderBy: [{ created_at: 'desc' }],
        skip: (page - 1) * size,
        take: size,
        select: {
          tracking_code: true,
          incident_type: true,
          incident_date: true,
          incident_zone: true,
          urgency_level: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: { select: { updates: true } },
        },
      }),
    ]);

    const items = reports.map((r) => ({
      id: r.tracking_code,
      tracking_code: r.tracking_code,
      incident_type: r.incident_type,
      incident_date: r.incident_date,
      incident_zone: r.incident_zone,
      urgency: r.urgency_level,
      status: r.status,
      update_count: r._count.updates,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

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
