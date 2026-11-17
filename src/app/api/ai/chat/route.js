/**
 * BEST - POST /api/ai/chat (WP-09, plan Sec. 6.4 / Sec. 7.5).
 *
 * Public civic concierge inquiry. Body: { message, language }.
 * 200 -> { reply, recommended_service, checklist, source } with
 * `Cache-Control: no-store`.
 *
 * The local engine always answers; in AI_MODE=hybrid with a Gemini key the
 * reply may be rewritten server-side (PII-scrubbed input, 2.5s timeout,
 * circuit breaker, silent fallback - Sec. 7.5). No IP is read or stored and
 * nothing is logged.
 */

import { errorResponse, jsonResponse, readJsonBody } from '../../../../lib/auth.js';
import { answerFromKnowledgeBase } from '../../../../lib/ai/chat.js';
import { enhanceChat } from '../../../../lib/ai/gemini.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_CHARS = 2000;

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return jsonResponse(
        { error: 'BAD_REQUEST', message: 'A message is required.' },
        { status: 400 },
      );
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return jsonResponse(
        { error: 'BAD_REQUEST', message: `The message is limited to ${MAX_MESSAGE_CHARS} characters.` },
        { status: 400 },
      );
    }

    const language = ['en', 'tl', 'ceb'].includes(body.language) ? body.language : 'auto';

    const local = answerFromKnowledgeBase(message, language);
    const result = await enhanceChat({ message, language, local });

    return jsonResponse(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
