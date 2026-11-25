// FR-06 - Business clearance in-person gateway (plan Sec. 1.2 route tree,
// Sec. 1.3B, Sec. 6.4, Sec. 12.5). Static shell only: the session check and the
// server-side encrypted submission all happen client-side, so this page never
// touches the database while rendering.

import BusinessClearanceForm from '@/components/business/BusinessClearanceForm.jsx';

export const metadata = {
  title: 'Business clearance (in person)',
  description:
    'Schedule an in-person business clearance screening. Your business details are encrypted on the server before storage; approval only happens at the barangay hall.',
};

export default function BusinessClearancePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-cyan-300">
          FR-06 business clearance
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          Business clearance, <span className="text-gradient-glass">in person</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          Book a screening appointment and download your checklist. Approval is
          never given online - the Treasurer screens your declared income and books
          at the barangay hall before any clearance is issued.
        </p>
      </header>

      <section className="glass mt-rhythm-4 max-w-xl p-rhythm-4" aria-labelledby="screening-notice">
        <h2 id="screening-notice" className="text-base font-semibold text-amber-900 dark:text-amber-200">
          Mandatory in-person screening
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>No online approval exists for business clearances.</li>
          <li>The Treasurer screens declared gross income and books in person.</li>
          <li>All checklist items must be complied and verified at the hall.</li>
          <li>Bring the original documents listed on your downloaded checklist.</li>
        </ul>
      </section>

      <div className="mt-rhythm-5">
        <BusinessClearanceForm />
      </div>
    </main>
  );
}
