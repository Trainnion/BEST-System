'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Resident session control for the Digital Barangay ID page.
 *
 * The ID page is server-guarded, so this button is only reachable with a
 * verified resident session. Signing out clears the resident cookie and
 * returns to the resident sign-in page. It is not a card action and does not
 * print anything.
 */
export default function ResidentSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/resident/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('logout failed');
      }
      router.replace('/resident/login');
      router.refresh();
    } catch {
      setError('Could not sign out. Check the connection and try again.');
      setBusy(false);
    }
  }

  return (
    <section aria-label="Resident session" className="mx-auto mt-rhythm-5 max-w-[26rem]">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.12] dark:focus-visible:ring-cyan-400 disabled:cursor-wait disabled:opacity-70"
      >
        <LogOut size={16} aria-hidden="true" />
        {busy ? 'Signing out...' : 'Sign out'}
      </button>
      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        Finished? Sign out to end this resident session on this device.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
