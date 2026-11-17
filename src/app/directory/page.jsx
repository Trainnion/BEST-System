// FR-07 - Barangay leadership roster (plan Sec. 1.2 route tree).
// Static shell only: the roster is fetched client-side from GET /api/directory,
// so the page is precacheable and never touches the database while rendering.

import DirectoryList from '@/components/public/DirectoryList.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Barangay directory',
  description:
    'Barangay officials and committees with office contact numbers only. Personal contact details are never published.',
};

export default function DirectoryPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
          Official barangay roster
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          Barangay <span className="text-gradient-glass">directory</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          Who does what at the barangay hall, grouped by position, with the office numbers you
          can call during working hours.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <DirectoryList />
      </div>
    </main>
  );
}
