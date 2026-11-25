// FR-03 - Public anonymous blotter status lookup (plan Sec. 6.4 + Sec. 15).
// Static shell only: the lookup runs client-side, returns day-only timestamps
// and never caches or stores a result.

import TrackLookup from '@/components/blotter/TrackLookup.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Track an anonymous blotter report',
  description:
    'Check the public status of an anonymous blotter report with its tracking code. The lookup returns no narrative, exact location, exact time or staff internal notes.',
};

export default function BlotterTrackPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-cyan-300">
          Public status lookup
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          Track your <span className="text-gradient-glass">anonymous report</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          Enter the tracking code you received when you filed. Only the incident class, public
          status and staff public notes are shown, with day-only dates.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <TrackLookup />
      </div>
    </main>
  );
}
