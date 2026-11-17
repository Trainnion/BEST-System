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
    <main id="main" className="relative min-h-screen">
      <HeroAnimated />
      <BroadcastTicker />

      {/* S2 - aggregate counters */}
      <section
        className="mx-auto w-full max-w-content px-gutter py-rhythm-4"
        aria-labelledby="stats-title"
      >
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
              <h2
                id="stats-title"
                className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-cyan-300"
              >
                Barangay Daro Services at a Glance
              </h2>
            </div>
            <p className="font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Official public aggregates · Zero personal data transmitted
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
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
    </main>
  );
}
