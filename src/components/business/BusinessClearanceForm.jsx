'use client';

/**
 * BusinessClearanceForm - FR-06 in-person gateway (/services/business-clearance).
 *
 * Plan Sec. 12.5 + Sec. 13.3:
 *   - verified resident session checked first;
 *   - business name, nature and address are sent as PLAINTEXT and the barangay
 *     server encrypts them at rest (server-side encryption, V5);
 *   - client_request_id = crypto.randomUUID() makes the POST idempotent;
 *   - network failure enqueues the payload in the outbox (kind 'business');
 *   - no approve button, no status transition, no print.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Download, LoaderCircle, Send, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { OUTBOX_EVENT, enqueue, listOutbox } from '@/lib/offline/outbox.js';
import { Field, TextArea, TextInput } from '@/components/public/Field.jsx';
import { formatDate, formatDateTime } from '@/components/public/helpers.js';

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

export default function BusinessClearanceForm() {
  const router = useRouter();

  const [sessionState, setSessionState] = useState('checking');
  const [maskedName, setMaskedName] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [nature, setNature] = useState('');
  const [address, setAddress] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState('');
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
          router.replace('/resident/login?next=/services/business-clearance');
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

  function validateFields() {
    const name = businessName.trim();
    const kind = nature.trim();
    const addr = address.trim();
    if (!name || !kind || !addr) {
      setFieldError('Business name, nature and address are required.');
      return false;
    }
    if (!appointmentDate) {
      setFieldError('Choose an appointment date.');
      return false;
    }
    const date = new Date(appointmentDate);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setFieldError('The appointment date must be in the future.');
      return false;
    }
    setFieldError('');
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!validateFields()) return;

    setSubmitting(true);

    const clientRequestId = requestIdRef.current || newClientRequestId();
    requestIdRef.current = clientRequestId;

    const payload = {
      business_name: businessName.trim(),
      nature_of_business: nature.trim(),
      business_address: address.trim(),
      physical_appointment_date: new Date(appointmentDate).toISOString(),
      client_request_id: clientRequestId,
    };

    try {
      const response = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 201 || response.status === 200) {
        const data = await response.json().catch(() => null);
        if (data && data.id) {
          requestIdRef.current = '';
          setResult(data);
          setQueued(false);
          return;
        }
        setFormError('The request was accepted but its answer could not be read. Try again.');
        return;
      }

      if (response.status === 401) {
        router.replace('/resident/login?next=/services/business-clearance');
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
        const queuedResult = await enqueue('business', payload, clientRequestId);
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

  function downloadNotice() {
    if (!result) return;
    const lines = [
      'Barangay Business Clearance - Appointment Notice',
      'Reference: ' + result.id,
      'Appointment date: ' + formatDateTime(result.physical_appointment_date),
      '',
      'Required checklist (bring originals to the hall):',
      ...(Array.isArray(result.checklist)
        ? result.checklist.map((item) => '- ' + item.title + ' (' + item.item_code + ')')
        : []),
      '',
      'No online approval is given. The Treasurer screens your declared income',
      'and books in person before any clearance is issued.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'business-appointment-' + result.id + '.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  if (sessionState === 'offline') {
    return (
      <div className="glass flex max-w-xl items-start gap-3 p-rhythm-4" role="status">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
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
      <section className="glass max-w-xl p-rhythm-4" role="status">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CircleCheck className="h-5 w-5" aria-hidden="true" />
          Appointment booked
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">Your reference</h2>
        <p className="mt-2 break-all font-mono text-2xl font-bold tracking-code text-cyan-700 dark:text-cyan-300">
          {result.id}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Appointment date</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(result.physical_appointment_date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Applicant</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {maskedName || 'Verified resident'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Checklist to bring
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {(Array.isArray(result.checklist) ? result.checklist : []).map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Keep this reference. Bring the original documents to the barangay hall on
          your appointment date. No clearance is issued online.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadNotice}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98]"
          >
            Download appointment notice
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setBusinessName('');
              setNature('');
              setAddress('');
              setAppointmentDate('');
            }}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30"
          >
            Book another
          </button>
        </div>
      </section>
    );
  }

  if (queued) {
    return (
      <section className="glass max-w-xl p-rhythm-4" role="status">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
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
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30"
          >
            Try sending again
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="glass max-w-xl p-rhythm-4" onSubmit={handleSubmit} noValidate>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200">Screening details</h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Filing as{' '}
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
            {maskedName || 'verified resident'}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Field
          htmlFor="biz-name"
          label="Business name"
          hint="Encrypted on the barangay server before storage."
        >
          <TextInput
            id="biz-name"
            name="business_name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required
            maxLength={200}
          />
        </Field>

        <Field htmlFor="biz-nature" label="Nature of business" hint="What the business does.">
          <TextInput
            id="biz-nature"
            name="nature_of_business"
            value={nature}
            onChange={(event) => setNature(event.target.value)}
            required
            maxLength={200}
          />
        </Field>

        <Field htmlFor="biz-address" label="Business address" hint="Where the business operates.">
          <TextArea
            id="biz-address"
            name="business_address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            maxLength={500}
          />
        </Field>

        <Field
          htmlFor="biz-appointment"
          label="Preferred appointment date"
          hint="Must be a future date. The Treasurer screens your income and books at the hall."
        >
          <TextInput
            id="biz-appointment"
            name="physical_appointment_date"
            type="date"
            value={appointmentDate}
            onChange={(event) => setAppointmentDate(event.target.value)}
            required
          />
        </Field>
      </div>

      {fieldError ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {fieldError}
        </p>
      ) : null}

      {formError ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-5 w-5" aria-hidden="true" />
        )}
        {submitting ? 'Sending...' : 'Book screening appointment'}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-500">
        Your business name, nature and address are encrypted on the barangay server before
        storage. No clearance is approved online.
      </p>
    </form>
  );
}
