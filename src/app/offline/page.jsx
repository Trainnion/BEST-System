// Offline fallback and pending outbox viewer (plan Sec. 1.2 route tree,
// Sec. 6.4 offline write rules, Sec. 13.5).
// Static shell only: the live queue is read client-side from the shared
// outbox, so this page is precacheable and never touches the database while
// rendering. The rules below are plain HTML, so the page is still useful with
// JavaScript disabled.

import OfflineOutbox from '@/components/public/OfflineOutbox.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Offline and pending requests',
  description:
    'What BEST keeps on this device when the server is unreachable: the pending outbox, its 10 entry and 7 day limits, and how replay works.',
};

const RULES = [
  'Up to 10 unsent items are kept on this device, and any item older than 7 days is dropped.',
  'Only document, business and blotter requests are queued. Nothing is sent while you are offline.',
  'Items carry no password and no session cookie: after reconnecting you sign in again and the queue continues.',
  'A rejected request (4xx) is not retried automatically - it waits here marked "needs attention". Only an expired session (401) waits for you to sign in again.',
];

export default function OfflinePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-gutter py-rhythm-6">
      <header className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
          Offline fallback
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">
          Working <span className="text-gradient-glass">without a connection</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          BEST is built for the barangay LAN and for phones that drop signal. Requests you
          send while the server is unreachable stay on this device until it answers back.
        </p>
      </header>

      <section className="mt-rhythm-5 max-w-prose glass p-rhythm-4" aria-labelledby="offline-rules">
        <h2 id="offline-rules" className="text-lg font-semibold text-slate-100">
          How the pending queue behaves
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span aria-hidden="true" className="mt-0.5 text-cyan-400">
                +
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-white/10 pt-3 font-mono text-xs tracking-code text-slate-400">
          queue capacity: 10 entries - retention: 7 days - kinds: document | business | blotter
        </p>
      </section>

      <div className="mt-rhythm-5">
        <OfflineOutbox />
      </div>

      <noscript>
        <p className="mt-4 max-w-prose rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-200">
          JavaScript is switched off, so the live queue cannot be listed here. The rules above
          still apply: reconnect, turn JavaScript on and reopen this page to see and retry the
          items saved on this device.
        </p>
      </noscript>
    </main>
  );
}
