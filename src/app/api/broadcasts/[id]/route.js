/**
 * Staff-only broadcast editing. Public broadcast reads remain on
 * /api/broadcasts and do not expose full announcement narratives.
 */

import { prisma } from '../../../../lib/db.js';
import {
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIES = Object.freeze(['AYUDA', 'HEALTH', 'VETERINARY', 'SCHOLARSHIP', 'URGENT']);
const SELECT_BROADCAST = Object.freeze({
  id: true,
  category: true,
  title: true,
  content: true,
  simplified_summary: true,
  audio_script: true,
  is_pinned: true,
  start_date: true,
  end_date: true,
  created_at: true,
});

function idFromParams(params) {
  const id = typeof params?.id === 'string' ? params.id.trim() : '';
  return /^BCAST-[0-9]{4}-[0-9]{4}$/.test(id) ? id : '';
}

function validateBody(body, startDate) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim().toUpperCase() : '';
  const endDate = body.end_date ? new Date(body.end_date) : null;

  if (title.length < 3 || title.length > 200) {
    return { error: 'Title must be between 3 and 200 characters.' };
  }
  if (content.length < 10 || content.length > 20000) {
    return { error: 'Announcement content must be between 10 and 20,000 characters.' };
  }
  if (!CATEGORIES.includes(category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(', ')}.` };
  }
  if (!endDate || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    return { error: 'End date must be after the broadcast start date.' };
  }
  if (typeof body.is_pinned !== 'boolean') {
    return { error: 'is_pinned must be true or false.' };
  }
  for (const field of ['simplified_summary', 'audio_script']) {
    const value = body[field];
    if (value != null && (typeof value !== 'string' || value.length > 5000)) {
      return { error: `${field} must be text of at most 5,000 characters.` };
    }
  }

  return {
    data: {
      title,
      content,
      category,
      is_pinned: body.is_pinned,
      end_date: endDate,
      simplified_summary: typeof body.simplified_summary === 'string' ? body.simplified_summary.trim() || null : null,
      audio_script: typeof body.audio_script === 'string' ? body.audio_script.trim() || null : null,
    },
  };
}

export async function GET(request, { params }) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.PUBLISH_BROADCASTS);
    const id = idFromParams(params);
    if (!id) return jsonResponse({ error: 'NOT_FOUND', message: 'Broadcast was not found.' }, { status: 404 });

    const broadcast = await prisma.communityBroadcast.findUnique({
      where: { id },
      select: SELECT_BROADCAST,
    });
    if (!broadcast) return jsonResponse({ error: 'NOT_FOUND', message: 'Broadcast was not found.' }, { status: 404 });

    return Response.json({ broadcast }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.PUBLISH_BROADCASTS);
    const id = idFromParams(params);
    if (!id) return jsonResponse({ error: 'NOT_FOUND', message: 'Broadcast was not found.' }, { status: 404 });

    const existing = await prisma.communityBroadcast.findUnique({
      where: { id },
      select: { id: true, start_date: true },
    });
    if (!existing) return jsonResponse({ error: 'NOT_FOUND', message: 'Broadcast was not found.' }, { status: 404 });

    const body = await readJsonBody(request);
    const validated = validateBody(body, existing.start_date);
    if (validated.error) {
      return jsonResponse({ error: 'BAD_INPUT', message: validated.error }, { status: 400 });
    }

    const broadcast = await prisma.communityBroadcast.update({
      where: { id },
      data: validated.data,
      select: SELECT_BROADCAST,
    });
    return Response.json({ success: true, broadcast }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.PUBLISH_BROADCASTS);
    const id = idFromParams(params);
    if (!id) return jsonResponse({ error: 'NOT_FOUND', message: 'Broadcast was not found.' }, { status: 404 });

    const deleted = await prisma.$transaction(async (tx) => {
      const existing = await tx.communityBroadcast.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) return false;

      await tx.communityBroadcast.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: user.id,
          action: 'DELETE_BROADCAST',
          target_entity: 'CommunityBroadcast',
          target_id: id,
          metadata: { operation: 'delete' },
        },
      });
      return true;
    });
    if (!deleted) return jsonResponse({ error: 'NOT_FOUND', message: 'Broadcast was not found.' }, { status: 404 });

    return Response.json({ success: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
