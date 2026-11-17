// Digital Barangay ID viewer (plan Sec. 17, route tree Sec. 1.2).
//
// Server-side guard: the resident session is verified here, before any client
// code runs. A missing or expired session redirects to the resident sign-in
// page with a safe `next` target. The page itself renders no personal data;
// the client viewer fetches the allow-listed view model after hydration.
//
// View-only by design: no print route, control, permission or stylesheet is
// provided for this card.

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import IDCardViewer from '@/components/id-card/IDCardViewer.jsx';
import {
  AuthError,
  BUSINESS_APPLICANT_ROLE,
  RESIDENT_ROLE,
  requireSession,
} from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Digital Barangay ID',
  description:
    'View your own digital Barangay ID: card details, Code 128 barcode and emergency contact. Verified resident sign-in is required.',
};

export default async function IdCardPage() {
  const headerStore = headers();
  const cookieHeader = headerStore.get('cookie') || '';

  // Only the cookie header is forwarded; no host, referrer or client address.
  const request = new Request('http://localhost/id-card', {
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  try {
    await requireSession(request, [RESIDENT_ROLE, BUSINESS_APPLICANT_ROLE]);
  } catch (error) {
    if (error instanceof AuthError) redirect('/resident/login?next=/id-card');
    throw error;
  }

  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="mx-auto max-w-[26rem]">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
          Verified resident
          <span aria-hidden="true" className="text-cyan-500/70">
            &middot;
          </span>
          View only
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          Your Digital <span className="text-gradient-glass">Barangay ID</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          Show this screen when the barangay hall asks for your digital ID. It is a viewer for your
          own record only, and it stays tied to this signed-in session.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          No card details are written into this page. They are fetched securely after it opens.
        </p>
      </header>

      <div className="mt-rhythm-5">
        <IDCardViewer />
      </div>

      <noscript>
        <p className="mx-auto mt-4 w-full max-w-[26rem] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-slate-300">
          The live card is loaded securely in the browser and needs JavaScript. Ask the barangay
          hall staff to open your record for you.
        </p>
      </noscript>
    </main>
  );
}
