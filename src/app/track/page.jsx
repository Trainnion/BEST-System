// FR-04 - Public document status lookup (plan Sec. 1.2 route tree).
// Static shell only: the lookup runs client-side, so the page is precacheable
// and never touches the database while rendering.

import TrackForm from '@/components/public/TrackForm.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Track a request',
  description:
    'Check the status of a barangay clearance or indigency request with your tracking code. Names stay masked and lookups are never cached.',
};

export default function TrackPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-content px-gutter py-rhythm-6"
    >
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
          Public status lookup
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          Track your <span className="text-gradient-glass">barangay request</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          Enter the code printed on your stub. The applicant&apos;s name is always masked and
          the result appears once. Nothing about your lookup is stored.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <TrackForm />
      </div>

      <p className="mt-rhythm-5 max-w-prose text-xs leading-relaxed text-slate-500">
        Need help? Visit the barangay hall with your stub and a valid ID, or call the office
        number listed in the directory.
      </p>
    </main>
  );
}
