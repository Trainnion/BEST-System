/** Staff-only list used by the broadcast manager, including expired posts. */

import { prisma } from '../../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.PUBLISH_BROADCASTS);
    const broadcasts = await prisma.communityBroadcast.findMany({
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
      take: 100,
      select: {
        id: true,
        category: true,
        title: true,
        simplified_summary: true,
        is_pinned: true,
        start_date: true,
        end_date: true,
      },
    });
    return Response.json({ broadcasts }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
