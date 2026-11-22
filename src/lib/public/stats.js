/**
 * Public, aggregate-only homepage counters (plan Sec. 6.4, 8.5).
 *
 * Both the build-time homepage render and GET /api/public/stats read through
 * this module, so the two can never disagree. Only counts and one average are
 * returned: no tracking codes, no names, no per-row data leaves this module,
 * which keeps the endpoint inside R.A. 10173 / NFR-01.
 *
 * Any database problem is left to the caller: the homepage catches it so a
 * build without a database still succeeds, and the API turns it into a 503.
 */

import prisma from '../db.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Read the four public counters.
 *
 * @returns {Promise<{
 *   documents_released_ytd: number,
 *   active_broadcasts: number,
 *   officials_listed: number,
 *   avg_turnaround_days: number,
 * }>}
 */
export async function readPublicStats() {
  const now = new Date();
  // Local calendar year: the barangay reports "this year" in its own timezone.
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [documentsReleasedYtd, activeBroadcasts, officialsListed, releasedTiming] =
    await Promise.all([
      prisma.documentRequest.count({
        where: { status: 'RELEASED', created_at: { gte: yearStart } },
      }),
      prisma.communityBroadcast.count({
        where: { start_date: { lte: now }, end_date: { gte: now } },
      }),
      // Count only the roster the public directory actually shows (FR-07).
      prisma.barangayOfficial.count({ where: { is_active: true } }),
      // Two timestamp columns are the minimum needed for an average. They are
      // consumed in-process and never returned, so no row data is exposed.
      prisma.documentRequest.findMany({
        where: { status: 'RELEASED' },
        select: { created_at: true, updated_at: true },
      }),
    ]);

  let avgTurnaroundDays = 0;
  if (releasedTiming.length > 0) {
    const totalDays = releasedTiming.reduce((sum, row) => {
      const delta = row.updated_at.getTime() - row.created_at.getTime();
      return sum + Math.max(0, delta) / DAY_MS;
    }, 0);
    avgTurnaroundDays = Math.round((totalDays / releasedTiming.length) * 10) / 10;
  }

  return {
    documents_released_ytd: documentsReleasedYtd,
    active_broadcasts: activeBroadcasts,
    officials_listed: officialsListed,
    avg_turnaround_days: avgTurnaroundDays,
  };
}

export default readPublicStats;
