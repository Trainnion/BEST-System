import AnimatedCounter from '@/components/home/AnimatedCounter';
import BroadcastTicker from '@/components/home/BroadcastTicker';
import HeroAnimated from '@/components/home/HeroAnimated';
import JourneyTrack from '@/components/home/JourneyTrack';
import QuickActionGrid from '@/components/home/QuickActionGrid';
import { readPublicStats } from '@/lib/public/stats';

/**
 * Animated "Living Glass" homepage (plan Sec. 8).
 *
 * force-static: the HTML is generated once, so `/` has no request-time database
 * dependency and the Service Worker can pre-cache it. The counters read the
 * aggregate stats at build time inside try/catch - a build machine without a
 * database still produces a complete page and the numbers render as "-".
 *
 * Entrance timeline (Sec. 8.3) is CSS-only in motion.css; only the counters,
 * quick-action grid, journey and ticker hydrate, which keeps route JS small.
 */

export const dynamic = 'force-static';

export const metadata = {
  title: 'Barangay services, made clear',
  description:
    'BEST homepage: request and track barangay documents, read welfare announcements, find officials and reach the hall - online on the barangay network or offline from a cached page.',
};

async function loadStats() {
  try {
    return await readPublicStats();
  } catch {
    // No database at build time (or a cold schema) is not a page failure.
    return null;
  }
}

export default async function HomePage() {
  const stats = await loadStats();

  return (
    <main id="main" className="relative">
      <HeroAnimated />

      {/* S2 - aggregate counters. Values are server-rendered; Full motion only
          replays them as a count-up when the strip first scrolls into view. */}
      <section
        className="mx-auto w-full max-w-content px-gutter py-rhythm-4"
        aria-labelledby="stats-title"
      >
        <div className="glass-lite p-rhythm-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2
              id="stats-title"
              className="text-[11px] font-bold uppercase tracking-wide text-cyan-300"
            >
              Barangay service at a glance
            </h2>
            <p className="text-[11px] text-slate-400">Aggregates only - no personal data.</p>
          </div>

          <dl className="mt-rhythm-4 grid grid-cols-2 gap-rhythm-4 sm:grid-cols-4">
            <AnimatedCounter
              label="Documents released this year"
              value={stats ? stats.documents_released_ytd : null}
              hint="Released since 1 January"
            />
            <AnimatedCounter
              label="Active announcements"
              value={stats ? stats.active_broadcasts : null}
              hint="Published and not yet ended"
            />
            <AnimatedCounter
              label="Officials listed"
              value={stats ? stats.officials_listed : null}
              hint="Barangay, SK and hall staff"
            />
            <AnimatedCounter
              label="Average turnaround"
              value={stats ? stats.avg_turnaround_days : null}
              suffix="days"
              decimals={1}
              hint="Filing to release"
            />
          </dl>
        </div>
      </section>

      <QuickActionGrid />
      <JourneyTrack />
      <BroadcastTicker />
    </main>
  );
}
