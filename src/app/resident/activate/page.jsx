// Resident account activation (plan Sec. 1.2 route tree, Sec. 13.3 step 3).
// Static shell only: the form posts to /api/resident/activate from the browser,
// so this page never reads a session or the database while rendering.

import ResidentActivateForm from '@/components/public/ResidentActivateForm.jsx';

export const metadata = {
  title: 'Activate your account',
  description:
    'Activate a resident account with the one-time slip issued at the barangay hall: resident number, activation code, birth date and a new password of at least 10 characters.',
};

export default function ResidentActivatePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          One-time activation slip
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          Activate your <span className="text-gradient-glass">resident account</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          Staff at the barangay hall verify your ID and hand you a slip with a 10 character
          code. It works once and expires after 7 days.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <ResidentActivateForm />
      </div>
    </main>
  );
}
