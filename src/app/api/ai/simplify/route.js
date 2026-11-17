/**
 * BEST - POST /api/ai/simplify (WP-09, plan Sec. 6.4 / Sec. 7.5).
 *
 * Staff-only broadcast summarizer and audio script (local template engine;
 * Gemini optional in hybrid mode). Body: { content, language }.
 * 200 -> { simplified_summary, audio_script, source } with no-store.
 *
 * The content is staff-authored broadcast text; it is still PII-scrubbed
 * before any optional hybrid enhancement leaves the process (Sec. 7.5).
 */

import {
  errorResponse,
  jsonResponse,
  readJsonBody,
  requireSession,
  STAFF_ROLES,
} from '../../../../lib/auth.js';
import { simplifyContent } from '../../../../lib/ai/simplify.js';
import { enhanceBroadcast } from '../../../../lib/ai/gemini.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CONTENT_CHARS = 10000;

export async function POST(request) {
  try {
    await requireSession(request, STAFF_ROLES);

    const body = await readJsonBody(request);
    const content = typeof body.content === 'string' ? body.content : '';

    if (!content.trim()) {
      return jsonResponse(
        { error: 'BAD_REQUEST', message: 'Content is required.' },
        { status: 400 },
      );
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return jsonResponse(
        { error: 'BAD_REQUEST', message: `Content is limited to ${MAX_CONTENT_CHARS} characters.` },
        { status: 400 },
      );
    }

    const language = ['en', 'tl', 'ceb'].includes(body.language) ? body.language : 'en';
    const local = simplifyContent(content, language);
    const result = await enhanceBroadcast({ content, language, local });

    return jsonResponse(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
