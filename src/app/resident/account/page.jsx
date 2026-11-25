'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CalendarDays, FileText, LogOut, RefreshCw, UserRound } from 'lucide-react';
import PasswordChangeForm from '../../../components/auth/PasswordChangeForm.jsx';

const REQUEST_LABELS = {
  CLEARANCE: 'Barangay Clearance',
  INDIGENCY: 'Certificate of Indigency',
  BUSINESS_CLEARANCE: 'Business Clearance Screening',
};

function readableStatus(status) {
  return String(status || '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusStyle(status) {
  if (status === 'REJECTED') return 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200';
  if (status === 'RELEASED' || status === 'APPROVED') return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200';
  if (status === 'READY_FOR_PICKUP') return 'border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200';
  return 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ResidentAccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [error, setError] = useState('');

  const loadAccount = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [accountResponse, requestResponse] = await Promise.all([
        fetch('/api/resident/account', { cache: 'no-store', credentials: 'same-origin' }),
        fetch('/api/resident/requests', { cache: 'no-store', credentials: 'same-origin' }),
      ]);
      if (accountResponse.status === 401 || requestResponse.status === 401) {
        router.replace(`/resident/login?next=${encodeURIComponent('/resident/account')}`);
        return;
      }
      const blockedResponse = accountResponse.status === 403 ? accountResponse : requestResponse.status === 403 ? requestResponse : null;
      if (blockedResponse) {
        const blockedData = await blockedResponse.clone().json().catch(() => ({}));
        if (blockedData.error === 'PASSWORD_CHANGE_REQUIRED') {
          router.replace('/password/change?type=resident&required=1');
          return;
        }
      }
      const [accountData, requestData] = await Promise.all([accountResponse.json(), requestResponse.json()]);
      if (!accountResponse.ok) throw new Error(accountData.message || 'Could not load your resident account.');
      if (!requestResponse.ok) throw new Error(requestData.message || 'Could not load your request history.');
      setAccount(accountData.account);
      setItems(Array.isArray(requestData.items) ? requestData.items : []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load your resident account.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      const response = await fetch('/api/resident/logout', { method: 'POST', cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Could not sign out. Check the connection and try again.');
      router.replace('/resident/login');
      router.refresh();
    } catch (signOutFailure) {
      setSignOutError(signOutFailure.message || 'Could not sign out. Check the connection and try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Resident Portal</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">My account and requests</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">View your profile and follow the status of forms you have requested.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => loadAccount(true)} disabled={loading || refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-60 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5">
              <RefreshCw size={16} aria-hidden="true" className={refreshing ? 'animate-spin' : ''} />
              Refresh status
            </button>
            <button type="button" onClick={handleSignOut} disabled={signingOut} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-500/10">
              <LogOut size={16} aria-hidden="true" /> {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>

        {signOutError ? <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{signOutError}</p> : null}
        {error ? <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}

        {loading ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">Loading your account…</div>
        ) : (
          <>
            {account ? (
              <section aria-labelledby="profile-heading" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <h2 id="profile-heading" className="flex items-center gap-2 text-lg font-bold"><UserRound size={19} aria-hidden="true" /> Resident profile</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Full name</dt><dd className="mt-1 font-semibold">{account.full_name}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resident number</dt><dd className="mt-1 font-mono font-semibold">{account.resident_no}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Purok</dt><dd className="mt-1 font-semibold">{account.purok}</dd></div>
                </dl>
              </section>
            ) : null}

            <PasswordChangeForm mode="resident" />

            <section aria-labelledby="requests-heading" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="requests-heading" className="flex items-center gap-2 text-lg font-bold"><FileText size={19} aria-hidden="true" /> My request history</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Statuses are updated by barangay staff as your request is processed.</p>
                </div>
                <Link href="/services/request" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">
                  Request a document
                </Link>
              </div>

              {items.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15">
                  <BadgeCheck className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                  <p className="mt-2 font-semibold">No requests yet</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your submitted forms will appear here with their latest status.</p>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {items.map((item) => (
                    <li key={`${item.kind}-${item.id}`} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-bold">{REQUEST_LABELS[item.document_type || item.kind] || 'Barangay Service Request'}</h3>
                          <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{item.id}</p>
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><CalendarDays size={15} aria-hidden="true" /> Submitted {formatDate(item.created_at)}</p>
                          {item.appointment_date ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">In-person screening: {formatDate(item.appointment_date)}</p> : null}
                        </div>
                        <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}>{readableStatus(item.status)}</span>
                      </div>
                      {item.rejection_reason ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200"><strong>Reason:</strong> {item.rejection_reason}</p> : null}
                      {item.transaction_no ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Payment transaction: <span className="font-mono font-semibold">{item.transaction_no}</span></p> : null}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated {formatDate(item.updated_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href="/id-card" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5">View digital barangay ID</Link>
              <Link href="/track" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5">Track a request</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
