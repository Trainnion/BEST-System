/**
 * BEST System - GET /api/broadcasts (WP-08, plan Sec. 6.4, FR-05).
 *
 *   200 -> { broadcasts: [ { id, title, category, is_pinned, start_date,
 *                            end_date, simplified_summary } ] }
 *
 * Public and read-only: only broadcasts whose window is open right now
 * (start_date <= now <= end_date), pinned first, then newest first. The
 * author is never selected, so no staff personal data can leak (NFR-01).
 *
 * Cacheable for a minute because announcements are not PII and the SW keeps a
 * copy for the offline fallback: public, max-age=60, stale-while-revalidate=300.
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

/** BroadcastCategory enum (prisma/schema.prisma). */
const CATEGORIES = Object.freeze(['AYUDA', 'HEALTH', 'VETERINARY', 'SCHOLARSHIP', 'URGENT']);

const LIMIT_DEFAULT = 20;
const LIMIT_MAX = 50;

const PUBLIC_CACHE_HEADERS = Object.freeze({
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
});

/**
 * Clamp an integer query parameter.
 * @param {unknown} raw
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInt(raw, fallback, min, max) {
  const parsed = Number.parseInt(String(raw === null || raw === undefined ? '' : raw), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * @returns {Promise<Response>}
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const category = (url.searchParams.get('category') || '').trim().toUpperCase();
    const limit = clampInt(url.searchParams.get('limit'), LIMIT_DEFAULT, 1, LIMIT_MAX);

    const now = new Date();
    const where = { start_date: { lte: now }, end_date: { gte: now } };

    if (category) {
      // A category outside the enum matches nothing: the filter stays honest
      // instead of silently dropping the filter and returning everything.
      if (!CATEGORIES.includes(category)) {
        return Response.json({ broadcasts: [] }, { status: 200, headers: PUBLIC_CACHE_HEADERS });
      }
      where.category = category;
    }

    const broadcasts = await prisma.communityBroadcast.findMany({
      where,
      orderBy: [{ is_pinned: 'desc' }, { start_date: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        is_pinned: true,
        start_date: true,
        end_date: true,
        simplified_summary: true,
      },
    });

    return Response.json({ broadcasts }, { status: 200, headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * BEST System - POST /api/broadcasts (WP-08/WP-14, plan Sec. 6.4, Sec. 6.5).
 * Publish announcement with AI summary / audio megaphone script.
 * Allowed roles: STAFF, OFFICIAL, ADMIN (PERMISSIONS.PUBLISH_BROADCASTS).
 */
export async function POST(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.PUBLISH_BROADCASTS);

    const body = await readJsonBody(request);
    const title = (body.title || '').trim();
    const content = (body.content || '').trim();
    const category = (body.category || '').trim().toUpperCase();
    const isPinned = Boolean(body.is_pinned);
    const startDate = body.start_date ? new Date(body.start_date) : new Date();
    const endDate = body.end_date ? new Date(body.end_date) : null;

    if (!title || title.length < 3) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Title must be at least 3 characters.' }, { status: 400 });
    }
    if (!content || content.length < 10) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Content must be at least 10 characters.' }, { status: 400 });
    }
    if (!CATEGORIES.includes(category)) {
      return jsonResponse(
        { error: 'BAD_INPUT', message: `Category must be one of: ${CATEGORIES.join(', ')}.` },
        { status: 400 },
      );
    }
    if (!endDate || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return jsonResponse(
        { error: 'BAD_INPUT', message: 'End date must be a valid future date after start date.' },
        { status: 400 },
      );
    }

    const { summarizeBroadcast, buildAudioScript } = await import('../../../lib/ai/simplify.js');
    const simplifiedSummary = body.simplified_summary?.trim() || summarizeBroadcast(content) || title;
    const audioScript = body.audio_script?.trim() || buildAudioScript(simplifiedSummary, 'tl');

    const count = await prisma.communityBroadcast.count();
    const nextId = `BCAST-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const broadcast = await prisma.communityBroadcast.create({
      data: {
        id: nextId,
        author_id: user.id,
        category,
        title,
        content,
        simplified_summary: simplifiedSummary,
        audio_script: audioScript,
        is_pinned: isPinned,
        start_date: startDate,
        end_date: endDate,
      },
      select: {
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
      },
    });

    return jsonResponse({ success: true, broadcast }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
