'use client';

/**
 * DocumentRequestForm - FR-01 Clearance / Indigency intake (/services/request).
 *
 * Plan Sec. 12.4 + Sec. 13.3 step 7:
 *   - the resident session is checked first (GET /api/resident/me); a 401
 *     sends the resident to /resident/login?next=/services/request;
 *   - purpose and ctc_number are sent as plaintext over HTTPS and encrypted by
 *     the server before storage (V5, ENC-01); no browser sealing is used;
 *   - client_request_id = crypto.randomUUID() makes the POST idempotent;
 *   - a network failure enqueues the payload in the outbox (kind 'document')
 *     and shows the queued state with the pending count.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  FileText,
  LoaderCircle,
  Send,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { OUTBOX_EVENT, enqueue, listOutbox } from '@/lib/offline/outbox.js';
import { Field, TextArea, TextInput } from './Field.jsx';
import { peso } from './helpers.js';

/** Fee rule: CLEARANCE 50.00 (plan data model default), INDIGENCY 0.00
 *  (plan Sec. 1.3 "INDIGENCY_FREE: Indigency Approved (Zero Fee)"). */
const FEES = Object.freeze({ CLEARANCE: '50.00', INDIGENCY: '0.00' });

const MIN_PURPOSE_CHARS = 20;
const MAX_PURPOSE_CHARS = 2000;
const MAX_CTC_CHARS = 64;

/**
 * A UUID v4 for the idempotency key; randomUUID when the browser has it.
 * @returns {string}
 */
function newClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return (
    hex.slice(0, 8) +
    '-' +
    hex.slice(8, 12) +
    '-' +
    hex.slice(12, 16) +
    '-' +
    hex.slice(16, 20) +
    '-' +
    hex.slice(20)
  );
}

const TYPE_OPTIONS = Object.freeze([
  {
    value: 'CLEARANCE',
    title: 'Barangay Clearance',
    fee: FEES.CLEARANCE,
    blurb: 'For employment, school, permit and other barangay clearance needs.',
  },
  {
    value: 'INDIGENCY',
    title: 'Certificate of Indigency',
    fee: FEES.INDIGENCY,
    blurb: 'For social welfare, medical and scholarship applications. No fee.',
  },
]);

export default function DocumentRequestForm() {
  const router = useRouter();

  const [sessionState, setSessionState] = useState('checking'); // checking | ok | offline
  const [maskedName, setMaskedName] = useState('');

  const [documentType, setDocumentType] = useState('CLEARANCE');
  const [purpose, setPurpose] = useState('');
  const [ctcNumber, setCtcNumber] = useState('');

  const [purposeError, setPurposeError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [queued, setQueued] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const requestIdRef = useRef('');

  const refreshPendingCount = useCallback(async () => {
    try {
      const rows = await listOutbox();
      setPendingCount(Array.isArray(rows) ? rows.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/resident/me', { cache: 'no-store' });
        if (cancelled) return;
        if (response.status === 401) {
          router.replace('/resident/login?next=/services/request');
          return;
        }
        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (!cancelled && data && data.masked_name) setMaskedName(data.masked_name);
        }
        if (!cancelled) setSessionState('ok');
      } catch {
        if (!cancelled) setSessionState('offline');
      }
    })();

    refreshPendingCount();
    window.addEventListener(OUTBOX_EVENT, refreshPendingCount);

    return () => {
      cancelled = true;
      window.removeEventListener(OUTBOX_EVENT, refreshPendingCount);
    };
  }, [router, refreshPendingCount]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setPurposeError('');

    const purposeText = purpose.trim();
    if (purposeText.length < MIN_PURPOSE_CHARS) {
      setPurposeError(
        'Describe the purpose in at least ' + MIN_PURPOSE_CHARS + ' characters so staff can review it.',
      );
      return;
    }
    if (purposeText.length > MAX_PURPOSE_CHARS) {
      setPurposeError('The purpose is too long. Keep it under ' + MAX_PURPOSE_CHARS + ' characters.');
      return;
    }

    setSubmitting(true);

    const clientRequestId = requestIdRef.current || newClientRequestId();
    requestIdRef.current = clientRequestId;

    const ctcText = ctcNumber.trim();
    if (ctcText.length > MAX_CTC_CHARS) {
      setFormError('The CTC number is too long.');
      setSubmitting(false);
      return;
    }

    const payload = {
      document_type: documentType,
      purpose: purposeText,
      client_request_id: clientRequestId,
    };
    if (ctcText) payload.ctc_number = ctcText;

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 201 || response.status === 200) {
        const data = await response.json().catch(() => null);
        if (data && data.tracking_code) {
          requestIdRef.current = '';
          setResult(data);
          setQueued(false);
          return;
        }
        setFormError('The request was accepted but its answer could not be read. Try again.');
        return;
      }

      if (response.status === 401) {
        router.replace('/resident/login?next=/services/request');
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      setFormError(
        (data && data.message) ||
          'The request could not be submitted. Check the details and try again.',
      );
    } catch (error) {
      const looksOffline =
        (typeof navigator !== 'undefined' && navigator.onLine === false) ||
        (typeof TypeError !== 'undefined' && error instanceof TypeError);
      if (!looksOffline) {
        setFormError('The request could not be sent. Check the details and try again.');
        return;
      }
      try {
        const queuedResult = await enqueue('document', payload, clientRequestId);
        if (queuedResult && queuedResult.ok) {
          setQueued(true);
          refreshPendingCount();
        } else {
          setFormError(
            (queuedResult && queuedResult.error) ||
              'This device could not queue the request while offline. Reconnect and submit again.',
          );
        }
      } catch {
        setFormError(
          'You appear to be offline and this device could not queue the request. Reconnect and submit again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionState === 'offline') {
    return (
      <div className="glass flex max-w-xl items-start gap-3 p-rhythm-4" role="status">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-300" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Needs a connection</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Your resident session could not be checked. Reconnect to the barangay server and
            reload this page - nothing you type is sent while you are offline.
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <section className="glass max-w-xl p-rhythm-4" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
          <CircleCheck className="h-5 w-5" aria-hidden="true" />
          Request received
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">Your tracking code</h2>
        <p className="mt-2 break-all font-mono text-2xl font-bold tracking-code text-cyan-700 dark:text-cyan-300">
          {result.tracking_code}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Fee to settle</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {peso(result.fee_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Applicant</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {maskedName || 'Verified resident'}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Keep this code. It shows the status of your request at any time, even from another
          device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={'/track?code=' + encodeURIComponent(result.tracking_code)}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98]"
          >
            View tracking
            <FileText className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setPurpose('');
              setCtcNumber('');
            }}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30"
          >
            File another request
          </button>
        </div>
      </section>
    );
  }

  if (queued) {
    return (
      <section className="glass max-w-xl p-rhythm-4" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-500 dark:text-amber-300">
          <WifiOff className="h-5 w-5" aria-hidden="true" />
          Saved on this device
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">Queued until you reconnect</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The server could not be reached, so your request was written to this
          device&apos;s outbox. It is sent automatically when the barangay server answers
          again - you do not need to retype it.
        </p>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          Pending on this device:{' '}
          <span className="font-semibold text-cyan-700 dark:text-cyan-300">{pendingCount}</span>{' '}
          {pendingCount === 1 ? 'item' : 'items'}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/offline"
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98]"
          >
            Review pending items
          </a>
          <button
            type="button"
            onClick={() => setQueued(false)}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30"
          >
            Try sending again
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="glass max-w-xl p-rhythm-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Filing as{' '}
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
            {maskedName || 'verified resident'}
          </span>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide state-success">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Secured by the server
        </span>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200">Document type</legend>
        <div className="mt-2 grid gap-2">
          {TYPE_OPTIONS.map((option) => {
            const active = documentType === option.value;
            return (
              <label
                key={option.value}
                className={
                  'tap-target flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ' +
                  (active
                    ? 'border-cyan-500/60 bg-cyan-500/10 dark:border-cyan-400/60 dark:bg-cyan-400/10'
                    : 'border-[var(--glass-border)] bg-slate-100/50 hover:bg-slate-200/50 dark:bg-white/[0.04] dark:hover:border-white/25')
                }
              >
                <input
                  type="radio"
                  name="document_type"
                  value={option.value}
                  checked={active}
                  onChange={() => setDocumentType(option.value)}
                  className="mt-1 h-4 w-4 shrink-0 accent-cyan-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {option.blurb}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                    Fee: {peso(option.fee)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-4">
        <Field
          htmlFor="request-purpose"
          label="Purpose of the request"
          hint={
            'At least ' +
            MIN_PURPOSE_CHARS +
            ' characters. Your purpose is encrypted on the server before it is stored.'
          }
          error={purposeError}
        >
          <TextArea
            id="request-purpose"
            name="purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            maxLength={MAX_PURPOSE_CHARS}
            placeholder="Example: needed for my child's school enrollment requirement."
            required
            aria-invalid={purposeError ? 'true' : 'false'}
            aria-describedby={purposeError ? 'request-purpose-error' : 'request-purpose-hint'}
          />
        </Field>

        <Field
          htmlFor="request-ctc"
          label="CTC number (optional)"
          hint="Community tax certificate number, if you already have one."
        >
          <TextInput
            id="request-ctc"
            name="ctc_number"
            value={ctcNumber}
            onChange={(event) => setCtcNumber(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            maxLength={MAX_CTC_CHARS}
            aria-describedby="request-ctc-hint"
          />
        </Field>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--glass-border)] bg-slate-100/60 p-3 text-sm text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">
        Fee before you send:{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{peso(FEES[documentType])}</span>
        {documentType === 'CLEARANCE' ? ' - settled at the treasury counter.' : ' - no fee.'}
      </div>

      {formError ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm leading-relaxed text-rose-600 dark:text-rose-300"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting ? 'true' : 'false'}
        className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/70 dark:bg-cyan-400 dark:text-slate-950"
      >
        {submitting ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-5 w-5" aria-hidden="true" />
        )}
        {submitting ? 'Sending...' : 'Submit request'}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Your purpose and CTC number are encrypted on the server before they are stored.
      </p>
    </form>
  );
}