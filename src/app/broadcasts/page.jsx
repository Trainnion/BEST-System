// FR-05 - Community welfare announcements (plan Sec. 1.2 route tree).
// Static shell only: the feed is fetched client-side from GET /api/broadcasts,
// so the page is precacheable and never touches the database while rendering.

import BroadcastList from '@/components/public/BroadcastList.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Announcements',
  description:
    'Active barangay community notices: ayuda, health, veterinary, scholarship and urgent updates, pinned notices first.',
};

export default function BroadcastsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          Community welfare notices
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          Barangay <span className="text-gradient-glass">announcements</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          Only notices whose posting window is open are shown. Pinned notices stay at the top
          of the list.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <BroadcastList />
      </div>
    </main>
  );
}
