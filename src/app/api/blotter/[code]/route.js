/**
 * BEST System - /api/blotter/[code] (WP-10, plan Sec. 6.4, Sec. 12, Sec. 15).
 *
 * GET - public status lookup. Returns only the tracking code, incident
 *       class, status, day-only creation date and the public update notes.
 *       It never selects the encrypted payload, the internal notes, the
 *       assigned officer or any complainant field. An unknown or malformed
 *       code gets the same generic 404.
 *
 * PATCH - not served here. Staff work happens under /api/admin/blotter/[code]
 *         because the proxy strips the session cookie on every /api/blotter*
 *         path (Sec. 12.2). This route answers 405 without reading the body.
 *
 * No cookie is read, no cookie is set, no request header is read and nothing
 * is logged.
 */

import { prisma } from '../../../../lib/db.js';
import { errorResponse, jsonResponse } from '../../../../lib/auth.js';
import { TRACKING_PATTERN } from '../../../../lib/blotter/constants.js';
import { publicBlotterView } from '../../../../lib/blotter/view.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The only columns a public lookup may read. */
const PUBLIC_SELECT = Object.freeze({
  tracking_code: true,
  incident_type: true,
  status: true,
  created_at: true,
  updates: {
    select: {
      action_taken: true,
      public_notes: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
  },
});

/**
 * A generic not-found answer, identical for a malformed and an unknown code.
 * @returns {Response}
 */
function notFound() {
  return jsonResponse({ error: 'NOT_FOUND' }, { status: 404 });
}

/**
 * Normalise a tracking code from the path.
 * @param {unknown} raw
 * @returns {string} the code, or '' when it cannot be one
 */
function normalizeCode(raw) {
  const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  return TRACKING_PATTERN.test(code) ? code : '';
}

/**
 * @param {Request} request
 * @param {{params: {code: string}}} context
 * @returns {Promise<Response>}
 */
export async function GET(request, context) {
  try {
    const code = normalizeCode(context && context.params ? context.params.code : '');
    if (!code) return notFound();

    const row = await prisma.blotterReport.findUnique({
      where: { tracking_code: code },
      select: PUBLIC_SELECT,
    });
    if (!row) return notFound();

    return jsonResponse(publicBlotterView(row));
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Staff updates live under /api/admin/blotter/[code].
 * The body is never read and no session is touched here.
 * @returns {Response}
 */
export async function PATCH() {
  return jsonResponse(
    { error: 'METHOD_NOT_ALLOWED' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}
