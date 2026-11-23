'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Shield,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

const DEFAULT_RESIDENT_NEXT = '/resident/account';
const DEFAULT_STAFF_NEXT = '/admin/dashboard';

function safeNext(raw, fallback = DEFAULT_RESIDENT_NEXT) {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  return value;
}

function UnifiedLoginContent({ initialRole = 'resident' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryRole = searchParams.get('role') || searchParams.get('portal') || searchParams.get('type');
  const initialActiveRole =
    queryRole === 'admin' || queryRole === 'staff'
      ? 'staff'
      : queryRole === 'resident'
        ? 'resident'
        : initialRole;

  const [activeRole, setActiveRole] = useState(initialActiveRole);

  // Resident Form State
  const [residentNo, setResidentNo] = useState('');
  const [residentPassword, setResidentPassword] = useState('');

  // Staff Form State
  const [username, setUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Status State
  const reason = searchParams.get('reason');
  const [error, setError] = useState(
    reason === 'timeout' || reason === 'idle_timeout'
      ? 'Your session timed out after 15 minutes of inactivity.'
      : reason === 'expired'
        ? 'Your session expired. Please sign in again.'
        : '',
  );
  const [loading, setLoading] = useState(false);
  const [lockWait, setLockWait] = useState(null);

  useEffect(() => {
    if (queryRole === 'admin' || queryRole === 'staff') {
      setActiveRole('staff');
    } else if (queryRole === 'resident') {
      setActiveRole('resident');
    }
  }, [queryRole]);

  // Clear errors when switching tabs
  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError('');
    setLockWait(null);
  };

  // Submit Resident Login
  async function handleResidentSubmit(e) {
    e.preventDefault();
    if (!residentNo.trim() || !residentPassword) {
      setError('Please provide both your resident number and password.');
      return;
    }

    setLoading(true);
    setError('');
    setLockWait(null);

    try {
      const response = await fetch('/api/resident/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_no: residentNo.trim(),
          password: residentPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          const waitSeconds = Number(data.retry_after_s) || 900;
          setLockWait(waitSeconds);
          setError(data.message || 'Account is temporarily locked due to too many failed attempts.');
        } else if (response.status === 401) {
          setError(data.message || 'Invalid resident number or password.');
        } else {
          setError(data.message || data.error || 'Login failed. Please check your credentials.');
        }
        setLoading(false);
        return;
      }

      // Success
      const target = safeNext(searchParams.get('next'), DEFAULT_RESIDENT_NEXT);
      router.push(target);
    } catch {
      setError('Unable to reach the barangay server. Please check your network connection.');
      setLoading(false);
    }
  }

  // Submit Staff / Admin Login
  async function handleStaffSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !staffPassword) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: staffPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || data.error || 'Authentication failed. Check your username and password.');
        setLoading(false);
        return;
      }

      // Success
      const target = safeNext(searchParams.get('next'), DEFAULT_STAFF_NEXT);
      router.push(target);
    } catch {
      setError('Cannot connect to the barangay terminal server. Check network connection.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Container Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white p-6 sm:p-10 shadow-2xl transition-colors dark:border-white/10 dark:bg-slate-900/90">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-600/20" />

        {/* Portal Header */}
        <div className="relative text-center mb-8">
          <Link
            href="/"
            title="Return to Public Homepage"
            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-600/25 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Barangay Daro Portal Sign In
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            One unified platform for residents, officials, and barangay staff
          </p>
        </div>

        {/* Role Tab Segmented Switcher */}
        <div className="relative mb-6 p-1.5 rounded-2xl border border-slate-300 bg-slate-100 dark:border-white/10 dark:bg-slate-950/60 flex gap-1.5">
          <button
            type="button"
            onClick={() => handleRoleChange('resident')}
            aria-pressed={activeRole === 'resident'}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              activeRole === 'resident'
                ? 'bg-white text-cyan-950 shadow-md border border-slate-300/80 dark:bg-cyan-500 dark:text-slate-950 dark:border-transparent'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className={`w-4 h-4 sm:w-5 sm:h-5 ${activeRole === 'resident' ? 'text-cyan-700 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Resident Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('staff')}
            aria-pressed={activeRole === 'staff'}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              activeRole === 'staff'
                ? 'bg-white text-sky-950 shadow-md border border-slate-300/80 dark:bg-sky-500 dark:text-slate-950 dark:border-transparent'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${activeRole === 'staff' ? 'text-sky-700 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Staff & Officials</span>
          </button>
        </div>

        {/* Notice / Alert Display */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-50 text-rose-800 text-sm flex items-start gap-3 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 dark:text-rose-400" />
            <div className="font-semibold leading-relaxed">
              {error}
              {lockWait && (
                <div className="mt-1 font-mono text-xs">
                  Please wait {Math.ceil(lockWait / 60)} minutes before trying again.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= RESIDENT LOGIN FORM ================= */}
        {activeRole === 'resident' && (
          <form onSubmit={handleResidentSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="resident-no-input"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300"
              >
                Resident Number
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="resident-no-input"
                  type="text"
                  value={residentNo}
                  onChange={(e) => setResidentNo(e.target.value)}
                  placeholder="e.g. 1000000001 (from your slip or ID)"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-sm dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                10-digit number issued on your barangay hall registration slip.
              </p>
            </div>

            <div>
              <label
                htmlFor="resident-password-input"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="resident-password-input"
                  type="password"
                  value={residentPassword}
                  onChange={(e) => setResidentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-sm dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950"
              >
                <span>{loading ? 'Verifying Resident...' : 'Sign In as Resident'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-3 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                First time using online services?{' '}
                <Link
                  href="/resident/activate"
                  className="font-bold text-cyan-700 hover:text-cyan-800 underline dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  Activate account with your slip
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* ================= STAFF / OFFICIAL LOGIN FORM ================= */}
        {activeRole === 'staff' && (
          <form onSubmit={handleStaffSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="staff-username-input"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300"
              >
                Official Username
              </label>
              <div className="relative">
                <Shield className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="staff-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or staff"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-sm dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Captain, Secretary, Admin, Clerk, Treasurer, or Lupon Member.
              </p>
            </div>

            <div>
              <label
                htmlFor="staff-password-input"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="staff-password-input"
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-sm dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950"
              >
                <span>{loading ? 'Authenticating Terminal...' : 'Sign In to Management Terminal'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terminal sessions automatically lock after 15 minutes of inactivity for security (NFR-06).
              </p>
            </div>
          </form>
        )}

        {/* Security & Compliance Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-600 dark:border-white/5 dark:text-slate-400 font-medium">
          <p>R.A. 10173 Protected Terminal · Offline-First Barangay LAN Network</p>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedLoginForm({ initialRole = 'resident' }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-sm text-slate-500">
          Loading login portal...
        </div>
      }
    >
      <UnifiedLoginContent initialRole={initialRole} />
    </Suspense>
  );
}
