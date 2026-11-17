'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (NFR-06)
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // Warn when 2 minutes left
const PING_INTERVAL_MS = 4 * 60 * 1000; // Active heartbeat every 4 minutes

export default function SessionGuard({ children }) {
  const router = useRouter();
  const [timeLeftMs, setTimeLeftMs] = useState(IDLE_TIMEOUT_MS);
  const [isWarning, setIsWarning] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const lastPingRef = useRef(Date.now());

  const extendSession = useCallback(async () => {
    try {
      setIsPinging(true);
      const res = await fetch('/api/auth/ping', { method: 'POST' });
      if (res.ok) {
        lastActivityRef.current = Date.now();
        lastPingRef.current = Date.now();
        setTimeLeftMs(IDLE_TIMEOUT_MS);
        setIsWarning(false);
      } else if (res.status === 401) {
        router.push('/admin/login?reason=expired');
      }
    } catch {
      // offline or unreachable
    } finally {
      setIsPinging(false);
    }
  }, [router]);

  useEffect(() => {
    function handleActivity() {
      const now = Date.now();
      lastActivityRef.current = now;

      // Heartbeat ping if active and it's been more than PING_INTERVAL_MS
      if (now - lastPingRef.current > PING_INTERVAL_MS) {
        lastPingRef.current = now;
        fetch('/api/auth/ping', { method: 'POST' }).catch(() => {});
      }
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const timer = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        router.push('/admin/login?reason=timeout');
      } else if (remaining <= WARNING_THRESHOLD_MS) {
        setIsWarning(true);
      } else {
        setIsWarning(false);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [router]);

  const minutesLeft = Math.floor(timeLeftMs / 60000);
  const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);

  return (
    <>
      {isWarning && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-950/80 backdrop-blur-xl text-amber-200 shadow-2xl animate-pulse"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Session expiring: </span>
            <span className="font-mono">
              {minutesLeft}:{String(secondsLeft).padStart(2, '0')}
            </span>{' '}
            due to inactivity (15m policy).
          </div>
          <button
            type="button"
            onClick={extendSession}
            disabled={isPinging}
            className="ml-2 px-3 py-1 text-xs font-medium rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            Stay signed in
          </button>
        </div>
      )}
      {children}
    </>
  );
}
