'use client';

/**
 * TrackLookup - public anonymous blotter status lookup (/blotter/track).
 *
 * GET /api/blotter/[code] returns only the code, incident class, status,
 * day-only dates and public updates. The narrative, exact location, exact
 * time, internal notes and assigned officer are never selected by the API,
 * so they cannot appear here. Lookups are never cached or stored.
 */

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Search, ShieldCheck, WifiOff } from 'lucide-react';

import StatusTimeline from './StatusTimeline.jsx';
import { Field, TextInput } from '@/components/public/Field.jsx';
import {
  BLOTTER_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
} from '@/lib/blotter/constants.js';
import { formatDay } from '@/lib/blotter/format.js';

const STATUS_CLASS = Object.freeze({
  FILED: 'state-info',
  UNDER_REVIEW: 'state-warning',
  ACTION_TAKEN: 'state-official',
  CLOSED: 'state-success',
});

export default function TrackLookup() {
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
      const response = await fetch('/api/blotter/' + encodeURIComponent(normalized), {
        cache: 'no-store',
      });
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
          ? 'You are offline. Blotter lookups need the barangay server, and results are never saved on this device.'
          : 'The barangay server could not be reached. Check your connection and try again.',
      );
    }
  }

  // Deep link support: /blotter/track?code=BLT-XXXX-XX.
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
          htmlFor="blotter-track-code"
          label="Anonymous tracking code"
          hint="Printed when you filed, for example BLT-7X9K-42."
        >
          <TextInput
            id="blotter-track-code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="BLT-XXXX-XX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={16}
            autoFocus
            aria-describedby="blotter-track-code-hint"
            className="font-mono uppercase tracking-code"
          />
        </Field>

        <button
          type="submit"
          disabled={phase === 'loading' || !code.trim()}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {phase === 'loading' ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-5 w-5" aria-hidden="true" />
          )}
          {phase === 'loading' ? 'Checking...' : 'Look up report'}
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
            <h2 className="text-lg font-semibold text-slate-100">Report not found</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              No report matches that code. Check the characters on your stub and try again.
              Nothing about a report is shared when a code does not exist.
            </p>
            <a
              href="/blotter"
              className="tap-target mt-4 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 font-semibold text-slate-200 transition hover:border-white/30"
            >
              File a report
            </a>
          </div>
        ) : null}

        {phase === 'offline' || phase === 'error' ? (
          <div className="glass flex items-start gap-3 p-rhythm-4">
            {phase === 'offline' ? (
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Needs a connection</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
            </div>
          </div>
        ) : null}

        {phase === 'found' && result ? (
          <section className="glass p-rhythm-4" aria-label="Report status">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-sm font-semibold tracking-code text-cyan-300">
                {result.tracking_code}
              </p>
              <span
                className={
                  'inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ' +
                  (STATUS_CLASS[result.status] || 'state-neutral')
                }
              >
                {BLOTTER_STATUS_LABELS[result.status] || result.status}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Incident type</dt>
                <dd className="mt-1 text-sm font-medium text-slate-100">
                  {INCIDENT_TYPE_LABELS[result.incident_type] || result.incident_type}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Filed</dt>
                <dd className="mt-1 text-sm font-medium text-slate-100">
                  {formatDay(result.created_at)}
                </dd>
              </div>
            </dl>

            <StatusTimeline status={result.status} updates={result.updates} />

            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">
              Public view only. Your narrative, exact location, exact time and staff internal
              notes are never returned by this lookup.
            </p>
          </section>
        ) : null}
      </div>

      <a
        href="/blotter"
        className="tap-target inline-flex w-fit items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30"
      >
        Back to anonymous filing
      </a>
    </div>
  );
}
