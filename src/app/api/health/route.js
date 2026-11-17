/**
 * BEST - GET /api/health (WP-09, plan Sec. 6.4 / Sec. 7.3).
 *
 * The client source of truth for "server reachable" (OfflineBanner and the
 * outbox replay triggers); `navigator.onLine` is advisory only. 200 always
 * carries { ok: true, ai_mode, server_time } with `Cache-Control: no-store`.
 *
 * No auth, no PII, no DB dependency: this probe must answer even when the
 * database is down so the UI can tell "server up, feature down" apart.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = 'no-store, no-cache, must-revalidate, max-age=0';

export async function GET() {
  const ai_mode = process.env.AI_MODE === 'hybrid' ? 'hybrid' : 'local';
  const body = JSON.stringify({
    ok: true,
    ai_mode,
    server_time: new Date().toISOString(),
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': NO_STORE,
      Pragma: 'no-cache',
    },
  });
}
