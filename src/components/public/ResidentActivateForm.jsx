'use client';

/**
 * ResidentActivateForm - /resident/activate (plan Sec. 13.3 step 3).
 *
 * POST /api/resident/activate { resident_no, activation_code, birth_date,
 * new_password }. Every mismatch answers with the same generic 400, so this
 * form never guesses which field was wrong. On success the masked name is
 * shown and the resident can continue straight to /services/request.
 */

import { useState } from 'react';
import { ArrowRight, BadgeCheck, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Field, TextInput } from './Field.jsx';

const GENERIC_FAILURE =
  'Activation failed. Check the resident number, the activation code and the birth date, then try again.';

export default function ResidentActivateForm() {
  const router = useRouter();
  const [residentNo, setResidentNo] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/resident/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_no: residentNo.trim(),
          activation_code: activationCode.trim(),
          birth_date: birthDate,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        setMaskedName((data && data.masked_name) || 'your account');
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      // The API already answers generically; the password policy is the one
      // check whose message is safe and useful to show verbatim.
      if (data && data.error === 'PASSWORD_POLICY') {
        setError(data.message);
      } else if (response.status === 400) {
        setError((data && data.message) || GENERIC_FAILURE);
      } else if (response.status === 401) {
        setError(GENERIC_FAILURE);
      } else {
        setError(GENERIC_FAILURE);
      }
    } catch {
      setError('The barangay server could not be reached. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (maskedName) {
    return (
      <section className="glass max-w-md p-rhythm-4" role="status">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          Account activated
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-50">
          Welcome, <span className="font-mono text-cyan-300">{maskedName}</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Your password is set and your resident session is active on this device. You can
          now file a clearance or indigency request.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/services/request')}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition active:scale-[0.98]"
        >
          Continue to your request
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </section>
    );
  }

  return (
    <form className="glass max-w-md p-rhythm-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <Field htmlFor="activate-resident-no" label="Resident number" hint="Printed on your activation slip.">
          <TextInput
            id="activate-resident-no"
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

        <Field
          htmlFor="activate-code"
          label="Activation code"
          hint="10 characters from the slip issued at the barangay hall. It expires after 7 days."
        >
          <TextInput
            id="activate-code"
            name="activation_code"
            value={activationCode}
            onChange={(event) => setActivationCode(event.target.value.toUpperCase())}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={16}
            className="font-mono tracking-code"
            required
          />
        </Field>

        <Field htmlFor="activate-birth-date" label="Birth date">
          <TextInput
            id="activate-birth-date"
            name="birth_date"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            autoComplete="bday"
            required
          />
        </Field>

        <Field
          htmlFor="activate-password"
          label="New password"
          hint="At least 10 characters. Use a passphrase you do not use anywhere else - common or demo passwords are refused."
        >
          <TextInput
            id="activate-password"
            name="new_password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
          />
        </Field>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm leading-relaxed text-rose-300"
          role="alert"
        >
          {error}
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
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
        )}
        {submitting ? 'Activating...' : 'Activate account'}
      </button>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        Already activated?{' '}
        <a href="/resident/login" className="font-semibold text-cyan-300 underline">
          Sign in instead
        </a>
        .
      </p>
    </form>
  );
}
