/**
 * BEST System - GET /api/public/stats (WP-07, plan Sec. 6.4 and 8.5).
 *
 *   200 OK -> { documents_released_ytd, active_broadcasts, officials_listed,
 *               avg_turnaround_days }
 *   503    -> { error: "STATS_UNAVAILABLE" }
 *
 * Aggregate counters only: no resident, document or broadcast row is ever
 * serialised. The success response is cacheable for a minute because the
 * numbers move at human speed; the failure response is never cached so a
 * recovered database is picked up on the next request.
 */

import { readPublicStats } from '../../../../lib/public/stats.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUCCESS_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const FAILURE_CACHE = 'no-store';

export async function GET() {
  try {
    const stats = await readPublicStats();
    return Response.json(stats, {
      status: 200,
      headers: { 'Cache-Control': SUCCESS_CACHE },
    });
  } catch {
    return Response.json(
      { error: 'STATS_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': FAILURE_CACHE } },
    );
  }
}
