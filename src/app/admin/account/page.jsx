'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, UserRound } from 'lucide-react';
import PasswordChangeForm from '../../../components/auth/PasswordChangeForm.jsx';

export default function AdminAccountPage() {
  const [account, setAccount] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/account', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not load your staff profile.');
        if (active) {
          setAccount(data.account);
          setFullName(data.account.full_name || '');
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load your staff profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ full_name: fullName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not save your staff profile.');
      setAccount(data.account);
      setFullName(data.account.full_name);
      setSuccess('Your name is saved and will be used on certificates you process.');
      window.dispatchEvent(new Event('best-staff-profile-updated'));
    } catch (saveError) {
      setError(saveError.message || 'Could not save your staff profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-300">Staff Portal</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">My account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Set the real name that will appear as the staff member processing a certificate.</p>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}
      {success ? <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">{success}</p> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        {loading ? <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading profile…</p> : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 dark:bg-cyan-400/10 dark:text-cyan-200"><UserRound size={20} aria-hidden="true" /></span>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Staff profile</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{account?.username} · {account?.role}</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="staff-full-name" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Full name</label>
                <input id="staff-full-name" name="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Use your actual first and last name. Generic account labels are not accepted as certificate signatories.</p>
              </div>
              <button type="submit" disabled={saving || loading || !fullName.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">
                <BadgeCheck size={17} aria-hidden="true" /> {saving ? 'Saving…' : 'Save name'}
              </button>
            </form>
          </>
        )}
      </section>

      <PasswordChangeForm mode="staff" />
    </div>
  );
}
