'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Megaphone, Pause, Play } from 'lucide-react';

import useInView from '@/lib/hooks/useInView';
import { MOTION_EVENT } from '@/lib/hooks/useMotionPreference';
import { TickerSkeleton } from './Skeletons';

/**
 * S5 Broadcast ticker (plan Sec. 8.2, 8.4 rules 4-6).
 *
 * Titles come from the cached public /api/broadcasts endpoint; a bare array and
 * a `{ broadcasts: [...] }` envelope are both accepted so the route can evolve
 * without breaking the homepage. Only titles and categories render - the
 * summaries stay on /broadcasts.
 *
 * Nothing renders on the server: with JS disabled the ticker is simply absent
 * instead of showing a skeleton that can never resolve. In Full tier the
 * duplicated track scrolls (the copy is aria-hidden and unfocusable); in Lite,
 * reduced motion and print it collapses to a single static, scrollable list.
 * A visible Pause/Play button is always available whenever the loop is running.
 */

const CATEGORY_TONE = {
  URGENT: 'state-danger',
  HEALTH: 'state-info',
  AYUDA: 'state-success',
  SCHOLARSHIP: 'state-official',
  VETERINARY: 'state-neutral',
};

const FALLBACK_BROADCASTS = [
  {
    id: 'daro-bc-1',
    title: 'Q4 Social Pension & Ayuda Distribution - Barangay Daro Gymnasium, 8:00 AM - 4:00 PM',
    category: 'AYUDA',
    is_pinned: true,
  },
  {
    id: 'daro-bc-2',
    title: 'Community Health & Wellness Medical Check-up - Daro Health Center, Every Wednesday',
    category: 'HEALTH',
    is_pinned: false,
  },
  {
    id: 'daro-bc-3',
    title: 'Barangay Anti-Rabies Pet Vaccination Drive - Daro Covered Court, Saturday 9:00 AM',
    category: 'VETERINARY',
    is_pinned: false,
  },
  {
    id: 'daro-bc-4',
    title: 'Barangay Daro Educational Assistance Grant - Submission of Requirements Now Open',
    category: 'SCHOLARSHIP',
    is_pinned: false,
  },
];

function toItems(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.broadcasts)
      ? payload.broadcasts
      : [];
  const valid = list
    .filter((item) => item && typeof item.title === 'string' && item.title.trim() !== '')
    .slice(0, 12);
  return valid.length > 0 ? valid : FALLBACK_BROADCASTS;
}

export default function BroadcastTicker() {
  const [ref] = useInView({ threshold: 0.1, reveal: false, pauseOffscreen: true });
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    fetch('/api/broadcasts', { signal: controller.signal, headers: { accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : { broadcasts: [] }))
      .then((payload) => {
        if (!alive) return;
        const next = toItems(payload).sort(
          (a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)),
        );
        setItems(next);
        setLoaded(true);
      })
      .catch(() => {
        // Cached-route miss, offline with no SW, or an aborted mount: fall back to default bulletins.
        if (!alive) return;
        setItems(FALLBACK_BROADCASTS);
        setLoaded(true);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  // The loop only exists in Full tier; the tier is applied by the shell's
  // preference hook, so follow the shared event and initial attributes.
  useEffect(() => {
    const sync = () => {
      const root = document.documentElement;
      const reduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lite =
        root.getAttribute('data-motion') === 'lite' || root.getAttribute('data-fx') === 'lite';
      setLooping(!reduced && !lite);
    };

    sync();
    window.addEventListener(MOTION_EVENT, sync);
    return () => window.removeEventListener(MOTION_EVENT, sync);
  }, []);

  if (!hydrated) return null;
  if (loaded && items.length === 0) return null;

  const visible = items.length > 0;

  return (
    <section
      ref={ref}
      className="ticker mx-auto w-full max-w-content px-gutter py-rhythm-5"
      aria-labelledby="ticker-title"
    >
      <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="ticker-title"
            className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-300"
          >
            <Megaphone size={14} aria-hidden="true" />
            Live Bulletin Ticker
          </h2>

          {visible && looping ? (
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-pressed={paused}
              className="tap-target inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:text-white"
            >
              {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
              {paused ? 'Play' : 'Pause'}
            </button>
          ) : null}

          <Link
            href="/broadcasts"
            className="ml-auto rounded text-[11px] font-bold text-cyan-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-cyan-300"
          >
            All announcements
          </Link>
        </div>

        <div className="mt-2.5" data-paused={paused ? 'true' : 'false'}>
          {!loaded ? (
            <TickerSkeleton />
          ) : (
            <ul className="ticker-track hide-scrollbar items-center gap-6 py-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-slate-900 dark:text-slate-200"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CATEGORY_TONE[item.category] ?? 'state-neutral'
                    }`}
                  >
                    {item.category ?? 'News'}
                  </span>
                  <span className="font-semibold">{item.title}</span>
                </li>
              ))}
              {items.map((item) => (
                <li
                  key={`dup-${item.id}`}
                  data-dup="true"
                  aria-hidden="true"
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-slate-900 dark:text-slate-200"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CATEGORY_TONE[item.category] ?? 'state-neutral'
                    }`}
                  >
                    {item.category ?? 'News'}
                  </span>
                  <span className="font-semibold">{item.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
