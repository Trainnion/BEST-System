// FR-01 - Clearance and indigency intake (plan Sec. 1.2 route tree, Sec. 12.4,
// Sec. 13.3 step 7).
// Static shell only: the session check and the submission all happen client-side,
// so this page never touches the database while rendering.

import DocumentRequestForm from '@/components/public/DocumentRequestForm.jsx';

export const metadata = {
  title: 'Request a document',
  description:
    'File a barangay clearance or certificate of indigency from your phone. Your purpose is encrypted on the server, the fee is shown before you send, and the request works from the outbox when you are offline.',
};

export default function ServiceRequestPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          FR-01 document intake
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          Request a <span className="text-gradient-glass">barangay document</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          Choose the document, describe what it is for and send it. Your details are encrypted
          on the server before they are stored, and you get a tracking code straight away.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <DocumentRequestForm />
      </div>
    </main>
  );
}