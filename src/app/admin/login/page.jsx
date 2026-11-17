'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    reason === 'timeout'
      ? 'Your session timed out after 15 minutes of inactivity.'
      : reason === 'expired'
      ? 'Your session expired. Please sign in again.'
      : '',
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || 'Login failed. Check your credentials.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError('Cannot connect to barangay server. Check network connection.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl border border-slate-300 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900/90 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none dark:bg-cyan-500/15" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none dark:bg-blue-600/15" />

        <div className="relative text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Barangay Staff Portal</h1>
          <p className="text-sm font-medium text-slate-600 mt-1 dark:text-slate-400">Authorized personnel and officials only · Barangay Daro</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-50 text-rose-800 text-sm flex items-start gap-3 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 dark:text-rose-400" />
            <div className="font-semibold">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300">
              Staff Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or staff"
                required
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-sm dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Terminal'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-600 dark:border-white/5 dark:text-slate-400 font-medium">
          <p>R.A. 10173 Protected Terminal · All access is audited</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
          Loading portal...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
