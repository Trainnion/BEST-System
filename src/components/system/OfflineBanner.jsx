'use client';

/**
 * BEST - OfflineBanner (WP-09, plan Sec. 7.1 / Sec. 7.3).
 *
 * "Server reachable" is decided by GET /api/health only; navigator.onLine
 * is advisory. While the server is unreachable the banner shows a live
 * region message, and a lightweight health poll runs every 30 s (and only
 * while offline) until the server answers again. Hidden when reachable.
 * Silent on failure: no console output, never throws during SSR.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 30 * 1000;
const HEALTH_TIMEOUT_MS = 4000;

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const probe = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      const response = await fetch('/api/health', {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response && response.ok) {
        const data = await response.json().catch(() => null);
        const stamp =
          data && typeof data.server_time === 'string' ? new Date(data.server_time) : new Date();
        setLastUpdated(stamp);
        setOffline(false);
      } else {
        setOffline(true);
      }
    } catch {
      setOffline(true);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    probe();

    const handleOnline = () => probe();
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll only while offline (checked inside the callback).
    timerRef.current = setInterval(() => {
      setOffline((current) => {
        if (current) probe();
        return current;
      });
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [probe]);

  if (!offline) return null;

  const shownTime =
    lastUpdated && !Number.isNaN(lastUpdated.getTime())
      ? lastUpdated.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
      : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-300/30 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-100 backdrop-blur-none"
      data-testid="offline-banner"
    >
      <span className="font-semibold">Offline</span>
      {' — showing saved content'}
      {shownTime ? `, last updated ${shownTime}` : ''}
      {'.'}
    </div>
  );
}
