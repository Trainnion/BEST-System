'use client';

/**
 * ResidentLoginForm - /resident/login (plan Sec. 13.3 step 4, Sec. 6.4).
 *
 * POST /api/resident/login { resident_no, password }:
 *   200 -> continue to ?next= or /services/request
 *   401 -> one generic failure message (the API never says which check failed)
 *   429 -> the account is locked: show the retry_after_s wait
 *   400 -> missing fields / a body the API refuses
 */

import { useState } from 'react';
import { ArrowRight, LoaderCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, TextInput } from './Field.jsx';

const DEFAULT_NEXT = '/services/request';
const GENERIC_401 = 'Invalid resident number or password.';
const GENERIC_400 = 'Check your resident number and password, then try again.';

/**
 * Only same-origin relative paths are accepted as a redirect target.
 * @param {string|null} raw
 * @returns {string}
 */
function safeNext(raw) {
  if (typeof raw !== 'string') return DEFAULT_NEXT;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_NEXT;
  }
  return value;
}

function formatWait(seconds) {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return minutes + (minutes === 1 ? ' minute' : ' minutes');
  }
  return seconds + ' seconds';
}

export default function ResidentLoginForm() {
  const router = useRouter();
  const [residentNo, setResidentNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [wait, setWait] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setWait(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/resident/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resident_no: residentNo.trim(), password }),
      });

      if (response.ok) {
        const params = new URLSearchParams(window.location.search);
        router.replace(safeNext(params.get('next')));
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 429) {
        const headerWait = Number.parseInt(response.headers.get('Retry-After') || '', 10);
        const bodyWait = data && Number.isFinite(Number(data.retry_after_s))
          ? Number(data.retry_after_s)
          : null;
        const seconds = Number.isFinite(headerWait)
          ? headerWait
          : bodyWait !== null
            ? bodyWait
            : 900;
        setWait(seconds);
        setError(
          (data && data.message) ||
            'Too many failed attempts. This account is temporarily locked.',
        );
        return;
      }

      if (response.status === 401) {
        setError((data && data.message) || GENERIC_401);
        return;
      }

      setError((data && data.message) || GENERIC_400);
    } catch {
      setError('The barangay server could not be reached. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="glass max-w-md p-rhythm-4" onSubmit={handleSubmit} noValidate>
      <p className="flex items-center gap-2 text-sm font-bold text-sky-800 dark:text-cyan-300">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Verified resident access · Barangay Daro
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <Field htmlFor="resident-no" label="Resident number" hint="For example RES-2026-0001.">
          <TextInput
            id="resident-no"
            name="resident_no"
            value={residentNo}
            onChange={(event) => setResidentNo(event.target.value)}
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            required
          />
        </Field>

        <Field htmlFor="resident-password" label="Password">
          <TextInput
            id="resident-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </Field>
      </div>

      {error ? (
        <div
          className="mt-4 rounded-xl border border-rose-500/30 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-800 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          {error}
          {wait ? <span className="mt-1 block font-semibold text-rose-900 dark:text-rose-200">Try again in {formatWait(wait)}.</span> : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
      >
        {submitting ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        )}
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        No password yet?{' '}
        <a href="/resident/activate" className="font-bold text-sky-700 underline dark:text-cyan-300">
          Activate your account with the slip from the barangay hall
        </a>
        .
      </p>
    </form>
  );
}
