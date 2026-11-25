'use client';

/**
 * BlotterForm - public anonymous blotter intake (/blotter).
 *
 * Plan Sec. 1.3C, Sec. 7.5, Sec. 12.2, Sec. 12.5 and Sec. 15:
 *   1. the narrative is scrubbed IN THIS BROWSER with scrubPII() and triaged
 *      with assessUrgency() before anything is sent (Sec. 12.6 item 4);
 *   2. a proof-of-work challenge is solved locally (progress shown);
 *   3. the POST carries the scrubbed narrative, the exact location and the
 *      exact time as PLAINTEXT over HTTPS; the SERVER encrypts them before
 *      storage (Sec. 12.1) - there is no browser sealing in V5;
 *   4. the request also carries the operationally necessary plaintext
 *      (class, coarse zone, date, urgency) - never an identity;
 *   5. an optional, explicitly consented offline queue keeps the report on
 *      this device only, until it is delivered and purged.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Lock,
  MapPin,
  Send,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

import { Field, TextArea, TextInput } from '@/components/public/Field.jsx';
import { assessUrgency, scrubPII } from '@/lib/ai/scrub.js';
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  INCIDENT_ZONES,
  MAX_EXACT_LOCATION_LENGTH,
  MAX_NARRATIVE_LENGTH,
  URGENCY_LEVELS,
} from '@/lib/blotter/constants.js';
import { solveProofOfWork } from '@/lib/blotter/pow-client.js';
import { enqueue } from '@/lib/offline/outbox.js';

const MIN_NARRATIVE_CHARS = 10;
const DRAFT_KEY = 'best:blotter:draft';

const FINDING_LABELS = Object.freeze({
  mobile: 'phone number',
  landline: 'phone number',
  email: 'email address',
  'honorific-name': 'name',
  'name-introduction': 'name',
  address: 'address',
  'id-number': 'ID number',
});

const URGENCY_LABELS = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
});

/**
 * The browser's local calendar date as YYYY-MM-DD.
 * @returns {string}
 */
function localToday() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * A UUID v4 for the outbox entry id.
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

/**
 * Summarise scrub findings without ever returning the removed text.
 * @param {Array<{kind: string, count: number}>} findings
 * @returns {string}
 */
function summariseFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) return '';
  const totals = new Map();
  for (const finding of findings) {
    const label = FINDING_LABELS[finding.kind] || 'personal detail';
    totals.set(label, (totals.get(label) || 0) + finding.count);
  }
  return Array.from(totals.entries())
    .map(([label, count]) => count + ' ' + label + (count === 1 ? '' : 's'))
    .join(', ');
}

export default function BlotterForm() {
  const [incidentType, setIncidentType] = useState('GENERAL');
  const [incidentZone, setIncidentZone] = useState('Purok 1');
  const [incidentDate, setIncidentDate] = useState('');
  const [narrative, setNarrative] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [exactTime, setExactTime] = useState('');
  const [urgencyOverride, setUrgencyOverride] = useState('');

  const [consentToQueue, setConsentToQueue] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
  const [powAttempts, setPowAttempts] = useState(0);
  const [powPercent, setPowPercent] = useState(0);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const [queued, setQueued] = useState(false);

  const scrubbedPreview = useMemo(() => scrubPII(narrative), [narrative]);
  const detected = useMemo(
    () => assessUrgency(scrubbedPreview.text),
    [scrubbedPreview.text],
  );
  const findingsText = summariseFindings(scrubbedPreview.findings);

  useEffect(() => {
    setIncidentDate((current) => current || localToday());
  }, []);

  /**
   * Clear the local draft after a successful filing. The narrative, exact
   * location and exact time are only ever React state in this component; the
   * removeItem call also clears a key left behind by an older draft build.
   */
  function clearDraft() {
    setNarrative('');
    setExactLocation('');
    setExactTime('');
    setUrgencyOverride('');
    setConsentToQueue(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Storage may be disabled; the React state is still cleared.
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setQueued(false);

    if (!incidentDate) {
      setFormError('Choose the date the incident happened.');
      return;
    }

    const rawNarrative = narrative.trim();
    if (rawNarrative.length < MIN_NARRATIVE_CHARS) {
      setFormError(
        'Describe what happened in at least ' + MIN_NARRATIVE_CHARS + ' characters.',
      );
      return;
    }
    if (!exactLocation.trim()) {
      setFormError('Add the exact location. Only officers can read it.');
      return;
    }
    if (!exactTime) {
      setFormError('Add the exact time. Only officers can read it.');
      return;
    }

    setSubmitting(true);
    setStage('Checking the submitted details...');
    setPowAttempts(0);
    setPowPercent(0);

    const clientRequestId = newClientRequestId();
    let plainBody = null;

    try {
      // Scrub again at submit time so the text that is sent is the scrubbed
      // text (the preview above is only a courtesy).
      const scrubbed = scrubPII(rawNarrative);
      if (scrubbed.text.trim().length < MIN_NARRATIVE_CHARS) {
        setFormError('After removing personal details, the description is too short.');
        return;
      }

      setStage('Requesting a proof-of-work challenge...');
      const challengeResponse = await fetch('/api/blotter/challenge', { cache: 'no-store' });
      if (challengeResponse.status === 503) {
        setFormError(
          'Anonymous filing is temporarily unavailable because the server proof key is not configured. Please tell barangay staff.',
        );
        return;
      }
      if (challengeResponse.status === 429) {
        setFormError(
          'The anonymous filing limit for today has been reached. Please visit the barangay hall or try again tomorrow.',
        );
        return;
      }
      if (!challengeResponse.ok) {
        setFormError('A filing challenge could not be obtained. Please try again.');
        return;
      }
      const challenge = await challengeResponse.json();
      if (!challenge || typeof challenge.nonce !== 'string') {
        setFormError('The filing challenge could not be read. Please try again.');
        return;
      }

      setStage('Solving the anti-spam proof (this takes a moment)...');
      const solution = await solveProofOfWork(
        challenge.nonce,
        Number(challenge.difficulty),
        (progress) => {
          setPowAttempts(progress.attempts);
          setPowPercent(progress.percent);
        },
      );

      // V5: the text travels over HTTPS and the SERVER encrypts it before
      // storage (Sec. 12.1). There is no browser sealing any more.
      plainBody = {
        incident_type: incidentType,
        incident_zone: incidentZone,
        incident_date: incidentDate,
        urgency_level:
          urgencyOverride || assessUrgency(scrubbed.text).level.toUpperCase(),
        narrative: scrubbed.text.trim(),
        exact_location: exactLocation.trim(),
        exact_time: exactTime.trim(),
        pow: {
          nonce: challenge.nonce,
          solution,
          signature: challenge.signature,
        },
      };

      setStage('Sending your report...');
      const response = await fetch('/api/blotter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plainBody),
      });

      if (response.status === 201 || response.status === 200) {
        const data = await response.json().catch(() => null);
        if (data && data.tracking_code) {
          clearDraft();
          setResult(data);
          return;
        }
        setFormError('The report was accepted but its tracking code could not be read.');
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
          'The report could not be filed. Check the details and try again.',
      );
    } catch (error) {
      // A network failure can be queued only with explicit consent, and only
      // the text the citizen typed is handed to the outbox.
      const looksOffline =
        (typeof navigator !== 'undefined' && navigator.onLine === false) ||
        (typeof TypeError !== 'undefined' && error instanceof TypeError);

      if (!looksOffline || !consentToQueue || !plainBody) {
        setFormError(
          looksOffline
            ? 'The barangay server could not be reached. Nothing was sent.'
            : 'This device could not complete the proof. Reload and try again.',
        );
        return;
      }

      try {
        const queuedResult = await enqueue('blotter', plainBody, clientRequestId);
        if (queuedResult && queuedResult.ok) {
          setQueued(true);
        } else {
          setFormError(
            (queuedResult && queuedResult.error) ||
              'This device could not save the report while offline.',
          );
        }
      } catch {
        setFormError('This device could not save the report while offline.');
      }
    } finally {
      setSubmitting(false);
      setStage('');
    }
  }

  if (result) {
    return (
      <section className="glass max-w-xl p-rhythm-4" role="status">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CircleCheck className="h-5 w-5" aria-hidden="true" />
          Report filed anonymously
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">Your tracking code</h2>
        <p className="mt-2 break-all font-mono text-2xl font-bold tracking-code text-cyan-700 dark:text-cyan-300">
          {result.tracking_code}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Keep this code. It is the only key to your report - there is no name or account
          attached to it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={'/blotter/track?code=' + encodeURIComponent(result.tracking_code)}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98]"
          >
            Track this report
          </a>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30"
          >
            File another report
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
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">Waiting for the barangay server</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Your report text is stored on this device only, and it is deleted as soon as the
          server accepts it. A fresh anti-spam proof is obtained when it is sent, so an
          expired proof is never reused. Keep the details until it is accepted.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQueued(false)}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98]"
          >
            Try sending again
          </button>
          <a
            href="/offline"
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30"
          >
            Offline help
          </a>
        </div>
      </section>
    );
  }

  return (
    <form className="glass max-w-xl p-rhythm-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Lock className="h-4 w-4 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
          No login. No name. No cookie.
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide state-success">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Encrypted at rest
        </span>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Do not include names, phone numbers or plate numbers.
      </p>

      <fieldset className="mt-4 grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Incident details</legend>

        <Field
          htmlFor="blotter-type"
          label="Incident type"
          hint="Only the class is public; the details stay encrypted."
        >
          <select
            id="blotter-type"
            name="incident_type"
            className="glass-input"
            value={incidentType}
            onChange={(event) => setIncidentType(event.target.value)}
          >
            {INCIDENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {INCIDENT_TYPE_LABELS[value] || value}
              </option>
            ))}
          </select>
        </Field>

        <Field
          htmlFor="blotter-zone"
          label="Coarse zone"
          hint="Purok only. The exact spot is encrypted separately."
        >
          <select
            id="blotter-zone"
            name="incident_zone"
            className="glass-input"
            value={incidentZone}
            onChange={(event) => setIncidentZone(event.target.value)}
          >
            {INCIDENT_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </Field>

        <Field htmlFor="blotter-date" label="Incident date" hint="Date only. The exact time is encrypted.">
          <TextInput
            id="blotter-date"
            name="incident_date"
            type="date"
            value={incidentDate}
            onChange={(event) => setIncidentDate(event.target.value)}
            required
          />
        </Field>

        <Field
          htmlFor="blotter-urgency"
          label="Urgency"
          hint={'Auto-detected: ' + URGENCY_LABELS[detected.level.toUpperCase()] + '. You may override it.'}
        >
          <select
            id="blotter-urgency"
            name="urgency_level"
            className="glass-input"
            value={urgencyOverride}
            onChange={(event) => setUrgencyOverride(event.target.value)}
          >
            <option value="">
              Automatic ({URGENCY_LABELS[detected.level.toUpperCase()]})
            </option>
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {URGENCY_LABELS[level] || level}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <div className="mt-4 flex flex-col gap-4">
        <Field
          htmlFor="blotter-narrative"
          label="What happened?"
          hint="Write only what you are willing to send. Names, phone numbers and plate numbers are removed before sending, and the server encrypts the text before storing it."
        >
          <TextArea
            id="blotter-narrative"
            name="narrative"
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            maxLength={MAX_NARRATIVE_LENGTH}
            placeholder="Describe the incident without naming people."
            required
          />
        </Field>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400" aria-live="polite">
          {findingsText
            ? 'Before sending, this device will remove: ' + findingsText + '.'
            : 'No obvious names or phone numbers detected. Please re-read your text.'}
          {' '}
          Detected urgency: {URGENCY_LABELS[detected.level.toUpperCase()]}.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            htmlFor="blotter-location"
            label="Exact location"
            hint="Encrypted by the server. Example: behind the covered court, near the canal."
          >
            <TextInput
              id="blotter-location"
              name="exact_location"
              value={exactLocation}
              onChange={(event) => setExactLocation(event.target.value)}
              autoComplete="off"
              maxLength={MAX_EXACT_LOCATION_LENGTH}
              required
            />
          </Field>

          <Field htmlFor="blotter-time" label="Exact time" hint="Encrypted by the server. Use the time you saw it.">
            <TextInput
              id="blotter-time"
              name="exact_time"
              type="time"
              value={exactTime}
              onChange={(event) => setExactTime(event.target.value)}
              required
            />
          </Field>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        <input
          type="checkbox"
          checked={consentToQueue}
          onChange={(event) => setConsentToQueue(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
        />
        <span>
          If the server is unreachable, save the report on this device and send it when I
          reconnect. The text stays on this device only and is deleted once it is accepted.
        </span>
      </label>

      {submitting ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            <LoaderCircle className="h-4 w-4 animate-spin text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
            {stage || 'Working...'}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={powPercent}>
            <div
              className="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
              style={{ width: powPercent + '%' }}
            />
          </div>
          {powAttempts > 0 ? (
            <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
              {powAttempts.toLocaleString()} attempts - {powPercent}%
            </p>
          ) : null}
        </div>
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
        {submitting ? 'Filing...' : 'File anonymously'}
      </button>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Your narrative, exact location and exact time travel over HTTPS and are encrypted
        by the server before they are stored. Only authorized barangay officers can read
        them, and every read is written to the audit log.
      </p>
    </form>
  );
}
