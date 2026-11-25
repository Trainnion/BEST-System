'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CircleUserRound, KeyRound, Plus, ShieldOff, UserRoundCheck, UsersRound } from 'lucide-react';
import PasswordResetModal from '../../../components/admin/PasswordResetModal.jsx';

const ROLES = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'OFFICIAL', label: 'Official' },
];

function roleLabel(role) {
  return ROLES.find((item) => item.value === role)?.label || role;
}

function dateLabel(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [changingId, setChangingId] = useState('');
  const [passwordResetTarget, setPasswordResetTarget] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ full_name: '', username: '', role: 'STAFF', password: '' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not load staff accounts.');
      setUsers(data.items || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load staff accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not create this staff account.');
      setForm({ full_name: '', username: '', role: 'STAFF', password: '' });
      setSuccess(`Account created for ${data.user.full_name}. Give the staff member their username and initial password privately.`);
      await loadUsers();
    } catch (createError) {
      setError(createError.message || 'Could not create this staff account.');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(account) {
    const nextActive = !account.is_active;
    if (!nextActive && !window.confirm(`Deactivate ${account.full_name}? This signs them out and prevents another login until you reactivate the account.`)) {
      return;
    }

    setChangingId(account.id);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(account.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ is_active: nextActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update this account.');
      setSuccess(`${account.full_name}'s account is ${nextActive ? 'active' : 'deactivated'}.`);
      await loadUsers();
    } catch (updateError) {
      setError(updateError.message || 'Could not update this account.');
    } finally {
      setChangingId('');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-300">Administration</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          <UsersRound className="h-7 w-7 text-sky-700 dark:text-cyan-300" aria-hidden="true" />
          Staff accounts
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Create Staff, Treasurer, and Official logins. Deactivating an account immediately ends its active access; you can reactivate it later.
        </p>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}
      {success ? <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">{success}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-cyan-400/10 dark:text-cyan-200"><Plus size={19} aria-hidden="true" /></span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create a staff login</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Administrator accounts are managed separately and cannot be created here.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="staff-full-name" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Full name</label>
            <input id="staff-full-name" name="full_name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} autoComplete="name" required minLength={2} maxLength={120} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
          </div>
          <div>
            <label htmlFor="staff-username" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Username</label>
            <input id="staff-username" name="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="off" required minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">3–32 letters, numbers, dots, underscores, or hyphens.</p>
          </div>
          <div>
            <label htmlFor="staff-role" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Access role</label>
            <select id="staff-role" name="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white">
              {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="staff-password" className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">Initial password</label>
            <input id="staff-password" name="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" required minLength={12} maxLength={128} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 12 characters. Give it to the staff member privately.</p>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={creating} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">
              <BadgeCheck size={17} aria-hidden="true" /> {creating ? 'Creating account…' : 'Create staff account'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current staff accounts</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{users.length} account{users.length === 1 ? '' : 's'} · administrator accounts are hidden</p>
          </div>
          <button type="button" onClick={loadUsers} disabled={loading} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Staff member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 dark:divide-white/5 dark:text-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Loading staff accounts…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No staff accounts found.</td></tr>
              ) : users.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200"><CircleUserRound size={18} aria-hidden="true" /></span>
                      <div><div className="font-bold text-slate-900 dark:text-white">{account.full_name}</div><div className="text-xs text-slate-500 dark:text-slate-400">@{account.username}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{roleLabel(account.role)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${account.is_active ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>
                        {account.is_active ? <UserRoundCheck size={13} aria-hidden="true" /> : <ShieldOff size={13} aria-hidden="true" />}
                        {account.is_active ? 'Active' : 'Deactivated'}
                      </span>
                      {account.must_change_password ? <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">Password change required</div> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{dateLabel(account.last_login)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => setPasswordResetTarget(account)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20">
                        <KeyRound size={14} aria-hidden="true" /> Set password
                      </button>
                      <button type="button" onClick={() => handleToggle(account)} disabled={changingId === account.id} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${account.is_active ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20' : 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20'}`}>
                        {account.is_active ? <ShieldOff size={14} aria-hidden="true" /> : <UserRoundCheck size={14} aria-hidden="true" />}
                        {changingId === account.id ? 'Saving…' : account.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PasswordResetModal
        account={passwordResetTarget}
        kind="staff"
        endpoint={passwordResetTarget ? `/api/admin/users/${encodeURIComponent(passwordResetTarget.id)}/password` : ''}
        onClose={() => setPasswordResetTarget(null)}
        onSaved={loadUsers}
      />
    </div>
  );
}
