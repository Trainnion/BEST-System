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

function toItems(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.broadcasts)
      ? payload.broadcasts
      : [];
  return list
    .filter((item) => item && typeof item.title === 'string' && item.title.trim() !== '')
    .slice(0, 12);
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
        // Cached-route miss, offline with no SW, or an aborted mount: hide it.
        if (!alive) return;
        setItems([]);
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
      <div className="glass-lite overflow-hidden p-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="ticker-title"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-cyan-300"
          >
            <Megaphone size={14} aria-hidden="true" />
            Announcements
          </h2>

          {visible && looping ? (
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-pressed={paused}
              className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors duration-fast hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
              {paused ? 'Play' : 'Pause'}
            </button>
          ) : null}

          <Link
            href="/broadcasts"
            className="ml-auto rounded text-[11px] font-semibold text-cyan-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            All announcements
          </Link>
        </div>

        <div className="mt-2" data-paused={paused ? 'true' : 'false'}>
          {!loaded ? (
            <TickerSkeleton />
          ) : (
            <ul className="ticker-track hide-scrollbar items-center gap-6 py-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-slate-200"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CATEGORY_TONE[item.category] ?? 'state-neutral'
                    }`}
                  >
                    {item.category ?? 'News'}
                  </span>
                  <span>{item.title}</span>
                </li>
              ))}
              {items.map((item) => (
                <li
                  key={`dup-${item.id}`}
                  data-dup="true"
                  aria-hidden="true"
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-slate-200"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CATEGORY_TONE[item.category] ?? 'state-neutral'
                    }`}
                  >
                    {item.category ?? 'News'}
                  </span>
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
