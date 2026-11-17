// Verified resident sign-in (plan Sec. 1.2 route tree, Sec. 13.3 step 4).
// Static shell only: the form posts to /api/resident/login from the browser,
// so this page never reads a session or the database while rendering.

import ResidentLoginForm from '@/components/public/ResidentLoginForm.jsx';

export const metadata = {
  title: 'Resident sign-in',
  description:
    'Sign in with your resident number and password to file clearance or indigency requests. Accounts are activated with a slip issued at the barangay hall.',
};

export default function ResidentLoginPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
          Verified resident access
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          Resident <span className="text-gradient-glass">sign in</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
          Residents are created at the barangay hall. Use the resident number and password you
          set when you activated your account.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <ResidentLoginForm />
      </div>
    </main>
  );
}
