'use client';

/**
 * TrackForm - FR-04 public document status lookup (/track).
 *
 * Static shell, live data: the form is server-rendered and the lookup runs in
 * the browser against GET /api/documents/track. Lookups are never cached
 * (`cache: 'no-store'`, no localStorage): an offline visit shows a clear
 * "needs connection" message instead of a stale result.
 */

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Search, ShieldCheck, WifiOff } from 'lucide-react';

import StatusPill from './StatusPill.jsx';
import { Field, TextInput } from './Field.jsx';
import { formatDate, peso } from './helpers.js';

const DOC_LABELS = Object.freeze({
  CLEARANCE: 'Barangay Clearance',
  INDIGENCY: 'Certificate of Indigency',
});

export default function TrackForm() {
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | found | not_found | offline | error
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const started = useRef(false);

  async function runLookup(rawCode) {
    const normalized = String(rawCode || '').trim().toUpperCase();
    if (!normalized) {
      setPhase('idle');
      setResult(null);
      setMessage('');
      return;
    }

    setPhase('loading');
    setResult(null);
    setMessage('');

    try {
      const response = await fetch(
        '/api/documents/track?code=' + encodeURIComponent(normalized),
        { cache: 'no-store' },
      );
      if (response.status === 404) {
        setPhase('not_found');
        return;
      }
      if (!response.ok) {
        setPhase('error');
        setMessage('That lookup could not be completed. Please try again in a moment.');
        return;
      }
      const data = await response.json();
      setResult(data);
      setPhase('found');
    } catch {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setPhase('offline');
      setMessage(
        offline
          ? 'You are offline. Document lookups need a connection to the barangay server, and lookups are never saved on this device.'
          : 'The barangay server could not be reached. Check your connection and try again.',
      );
    }
  }

  // Deep link support: /track?code=CLR-2026-XXXXXXXX fills and runs itself.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const initial = new URLSearchParams(window.location.search).get('code');
    if (initial) {
      const normalized = initial.trim().toUpperCase();
      setCode(normalized);
      runLookup(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-rhythm-4">
      <form
        className="glass max-w-xl p-rhythm-4"
        onSubmit={(event) => {
          event.preventDefault();
          runLookup(code);
        }}
      >
        <Field
          htmlFor="track-code"
          label="Tracking code"
          hint="Printed on your stub, for example CLR-2026-7K2M9QXA."
        >
          <TextInput
            id="track-code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="CLR-2026-XXXXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            autoFocus
            aria-describedby="track-code-hint"
            className="font-mono uppercase tracking-code"
          />
        </Field>

        <button
          type="submit"
          disabled={phase === 'loading' || !code.trim()}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-cyan-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
        >
          {phase === 'loading' ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-5 w-5" aria-hidden="true" />
          )}
          {phase === 'loading' ? 'Checking...' : 'Look up request'}
        </button>
      </form>

      <div aria-live="polite" className="max-w-xl">
        {phase === 'loading' ? (
          <div className="glass p-rhythm-4" aria-busy="true">
            <div className="glass-skeleton h-6 w-2/3" />
            <div className="glass-skeleton mt-3 h-4 w-full" />
            <div className="glass-skeleton mt-2 h-4 w-4/5" />
          </div>
        ) : null}

        {phase === 'not_found' ? (
          <div className="glass p-rhythm-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              We could not find that request
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              No request matches that code. Check the characters on your stub - codes look
              like <span className="font-mono text-cyan-700 dark:text-cyan-300">CLR-2026-XXXXXXXX</span> or{' '}
              <span className="font-mono text-cyan-700 dark:text-cyan-300">IND-2026-XXXXXXXX</span> - and try
              again. Nothing is shared when a code does not exist.
            </p>
          </div>
        ) : null}

        {phase === 'offline' || phase === 'error' ? (
          <div className="glass flex items-start gap-3 p-rhythm-4">
            {phase === 'offline' ? (
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-300" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Needs a connection</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{message}</p>
            </div>
          </div>
        ) : null}

        {phase === 'found' && result ? (
          <section className="glass p-rhythm-4" aria-label="Request status">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-sm font-semibold tracking-code text-cyan-700 dark:text-cyan-300">
                {result.tracking_code}
              </p>
              <StatusPill status={result.status} />
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Applicant</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {result.masked_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Document</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {DOC_LABELS[result.document_type] || result.document_type}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Fee</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {peso(result.fee_amount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Filed</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(result.created_at)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl border border-[var(--glass-border)] bg-slate-100/60 p-3 text-sm leading-relaxed text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">
              {result.pickup_advisory}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
