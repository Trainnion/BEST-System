// FR-03 - Anonymous blotter intake (plan Sec. 1.3C, Sec. 15).
// Static shell only: scrubbing, proof-of-work and submission all run in the
// citizen's browser; the server encrypts the sensitive fields before storage,
// so the page never touches the database.

import AnonymityStatement from '@/components/blotter/AnonymityStatement.jsx';
import BlotterForm from '@/components/blotter/BlotterForm.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Anonymous blotter report',
  description:
    'File an anonymous barangay blotter report. Personal details are scrubbed in your browser and the text is encrypted by the server before storage; no name, IP address, cookie or device detail is stored.',
};

export default function BlotterPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          Anonymous report
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          File a <span className="text-gradient-glass">blotter report</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          No login and no name. Write what happened, and this browser removes obvious personal
          details before sending it over HTTPS. The server encrypts your text before storing it,
          so only authorized barangay officers can read it.
        </p>
      </header>

      <div className="mt-rhythm-5 grid gap-rhythm-4">
        <AnonymityStatement />
        <BlotterForm />
      </div>

      <p className="mt-rhythm-5 max-w-prose text-xs leading-relaxed text-slate-500">
        Already filed?{' '}
        <a className="font-semibold text-cyan-300 underline-offset-4 hover:underline" href="/blotter/track">
          Check your report with the tracking code
        </a>
        . Keep the code safe - it is the only link to your report.
      </p>
    </main>
  );
}
