'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, X } from 'lucide-react';

export default function PasswordResetModal({ account, kind = 'staff', endpoint, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const minimumLength = kind === 'resident' ? 10 : 12;

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    setError('');
    setSuccess('');
  }, [account?.id]);

  if (!account) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({ new_password: password, confirm_password: confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not set this password.');

      setSuccess('Temporary password saved. Share it privately. The account owner must choose a new password at their next sign-in.');
      await onSaved?.();
    } catch (saveError) {
      setError(saveError.message || 'Could not set this password.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="password-reset-title" className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-cyan-400/10 dark:text-cyan-200"><KeyRound size={19} aria-hidden="true" /></span>
            <div>
              <h2 id="password-reset-title" className="text-lg font-bold text-slate-900 dark:text-white">Set a temporary password</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">For {account.full_name || account.name || 'this account'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close password reset" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-cyan-400/20 dark:bg-cyan-400/5 dark:text-cyan-100">
          Use at least {minimumLength} characters. The account owner will be required to replace this password after signing in.
          {account.is_active === false ? ' The account must also be reactivated before it can sign in.' : ''}
        </p>

        {error ? <p role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}
        {success ? <p role="status" className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">{success}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="temporary-password" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Temporary password</label>
            <input autoFocus id="temporary-password" type={showPasswords ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={minimumLength} maxLength={128} className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirm-temporary-password" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Confirm temporary password</label>
            <input id="confirm-temporary-password" type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={minimumLength} maxLength={128} className={inputClass} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button type="button" aria-pressed={showPasswords} onClick={() => setShowPasswords((shown) => !shown)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-white/5">
              {showPasswords ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              {showPasswords ? 'Hide password' : 'Show password'}
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} disabled={saving} className="min-h-10 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5">Close</button>
              <button type="submit" disabled={saving || Boolean(success) || !password || !confirmPassword} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">
                <KeyRound size={15} aria-hidden="true" /> {saving ? 'Saving…' : success ? 'Password saved' : 'Save password'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
