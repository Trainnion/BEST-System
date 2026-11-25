'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function PasswordChangeForm({ mode = 'staff', forced = false }) {
  const router = useRouter();
  const errorRef = useRef(null);
  const resident = mode === 'resident';
  const minimumLength = resident ? 10 : 12;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not change your password.');

      const loginPath = resident ? '/resident/login?reason=password_changed' : '/login?role=staff&reason=password_changed';
      router.replace(loginPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || 'Could not change your password.');
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-cyan-400/10 dark:text-cyan-200">
          <KeyRound size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{forced ? 'Set a new password' : 'Change password'}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {forced
              ? 'Your account has a temporary password. Replace it to continue.'
              : 'Enter your current password to confirm this change. You will need to sign in again afterward.'}
          </p>
        </div>
      </div>

      {error ? (
        <div ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`${mode}-current-password`} className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            {forced ? 'Temporary or current password' : 'Current password'}
          </label>
          <input
            id={`${mode}-current-password`}
            name="current_password"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            maxLength={256}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${mode}-new-password`} className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">New password</label>
          <input
            id={`${mode}-new-password`}
            name="new_password"
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={minimumLength}
            maxLength={128}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use at least {minimumLength} characters and avoid common passwords.</p>
        </div>

        <div>
          <label htmlFor={`${mode}-confirm-password`} className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Confirm new password</label>
          <input
            id={`${mode}-confirm-password`}
            name="confirm_password"
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={minimumLength}
            maxLength={128}
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            aria-pressed={showPasswords}
            onClick={() => setShowPasswords((shown) => !shown)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {showPasswords ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>
          <button type="submit" disabled={saving || !currentPassword || !newPassword || !confirmPassword} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">
            <KeyRound size={16} aria-hidden="true" /> {saving ? 'Saving password…' : 'Save new password'}
          </button>
        </div>
      </form>
    </section>
  );
}
