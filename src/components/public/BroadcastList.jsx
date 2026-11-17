'use client';

/**
 * BroadcastList - FR-05 community welfare notices (/broadcasts).
 *
 * Static shell, live data: the page renders instantly and this component
 * fetches GET /api/broadcasts client-side. Category chips filter the feed,
 * pinned notices stay first, skeletons show while loading, and an offline
 * visit says plainly that no announcements are cached on this device.
 */

import { useEffect, useState } from 'react';
import { CalendarDays, Megaphone, Pin, WifiOff } from 'lucide-react';

import { formatDateTime } from './helpers.js';

const CATEGORIES = Object.freeze([
  { value: '', label: 'All' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'AYUDA', label: 'Ayuda' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'VETERINARY', label: 'Veterinary' },
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
]);

const CHIP_BASE =
  'tap-target inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition';

export default function BroadcastList() {
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [phase, setPhase] = useState('loading'); // loading | ready | empty | offline | error

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase('loading');
      const query = category ? '?category=' + encodeURIComponent(category) : '';
      try {
        const response = await fetch('/api/broadcasts' + query, { cache: 'no-store' });
        if (cancelled) return;
        if (!response.ok) {
          setPhase('error');
          return;
        }
        const data = await response.json();
        const list = Array.isArray(data.broadcasts) ? data.broadcasts : [];
        setItems(list);
        setPhase(list.length > 0 ? 'ready' : 'empty');
      } catch {
        if (cancelled) return;
        setItems([]);
        setPhase('offline');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="flex flex-col gap-rhythm-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter announcements by category"
      >
        {CATEGORIES.map((entry) => {
          const active = entry.value === category;
          return (
            <button
              key={entry.value || 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(entry.value)}
              className={
                CHIP_BASE +
                (active
                  ? ' border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                  : ' border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25')
              }
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {phase === 'loading' ? (
        <ul className="grid gap-rhythm-3" aria-busy="true" aria-label="Loading announcements">
          {[0, 1, 2].map((index) => (
            <li key={index} className="glass-lite p-rhythm-4">
              <div className="glass-skeleton h-5 w-1/3" />
              <div className="glass-skeleton mt-3 h-4 w-full" />
              <div className="glass-skeleton mt-2 h-4 w-2/3" />
            </li>
          ))}
        </ul>
      ) : null}

      {phase === 'ready' ? (
        <ul className="grid gap-rhythm-3">
          {items.map((item) => (
            <li key={item.id} className="glass-lite p-rhythm-4">
              <div className="flex flex-wrap items-center gap-2">
                {item.is_pinned ? (
                  <span className="state-official inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    <Pin className="h-3 w-3" aria-hidden="true" />
                    Pinned
                  </span>
                ) : null}
                <span className="state-neutral inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  {String(item.category || '').toLowerCase()}
                </span>
              </div>

              <h2 className="mt-3 text-base font-semibold text-slate-50">{item.title}</h2>

              {item.simplified_summary ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.simplified_summary}
                </p>
              ) : null}

              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDateTime(item.start_date)} - {formatDateTime(item.end_date)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {phase === 'empty' ? (
        <div className="glass-lite flex items-start gap-3 p-rhythm-4">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">No announcements</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Nothing is posted{category ? ' in this category' : ''} right now. Check back
              soon, or clear the filter to see every notice.
            </p>
          </div>
        </div>
      ) : null}

      {phase === 'offline' || phase === 'error' ? (
        <div className="glass-lite flex items-start gap-3 p-rhythm-4" role="status">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              No cached announcements
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Announcements are not stored on this device, so the feed needs a connection to
              the barangay server. Reconnect and this page fills itself in.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
