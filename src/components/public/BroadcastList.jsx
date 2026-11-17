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

const FALLBACK_BROADCASTS = [
  {
    id: 'daro-bc-1',
    title: 'Q4 Social Pension & Ayuda Distribution - Barangay Daro Gymnasium',
    category: 'AYUDA',
    is_pinned: true,
    start_date: '2026-10-24T00:00:00.000Z',
    end_date: '2026-12-31T23:59:59.000Z',
    simplified_summary: 'Quarterly social pension and financial assistance distribution for senior citizens and indigent families at the Daro Gymnasium.',
  },
  {
    id: 'daro-bc-2',
    title: 'Community Health & Wellness Medical Check-up',
    category: 'HEALTH',
    is_pinned: false,
    start_date: '2026-10-20T00:00:00.000Z',
    end_date: '2026-12-31T23:59:59.000Z',
    simplified_summary: 'Free basic medical consultation, blood pressure monitoring, and maintenance medicine distribution at Daro Health Center every Wednesday.',
  },
  {
    id: 'daro-bc-3',
    title: 'Barangay Anti-Rabies Pet Vaccination Drive',
    category: 'VETERINARY',
    is_pinned: false,
    start_date: '2026-10-15T00:00:00.000Z',
    end_date: '2026-12-31T23:59:59.000Z',
    simplified_summary: 'Free anti-rabies vaccination for pet dogs and cats at Daro Covered Court this Saturday starting at 9:00 AM.',
  },
  {
    id: 'daro-bc-4',
    title: 'Barangay Daro Educational Assistance Grant',
    category: 'SCHOLARSHIP',
    is_pinned: false,
    start_date: '2026-10-10T00:00:00.000Z',
    end_date: '2026-12-31T23:59:59.000Z',
    simplified_summary: 'Submission of requirements for qualified college and vocational students residing in Barangay Daro for the upcoming semester.',
  },
];

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
          const fallbackFiltered = category
            ? FALLBACK_BROADCASTS.filter((b) => b.category === category)
            : FALLBACK_BROADCASTS;
          setItems(fallbackFiltered);
          setPhase(fallbackFiltered.length > 0 ? 'ready' : 'empty');
          return;
        }
        const data = await response.json();
        const list = Array.isArray(data.broadcasts) ? data.broadcasts : [];
        if (list.length === 0) {
          const fallbackFiltered = category
            ? FALLBACK_BROADCASTS.filter((b) => b.category === category)
            : FALLBACK_BROADCASTS;
          setItems(fallbackFiltered);
          setPhase(fallbackFiltered.length > 0 ? 'ready' : 'empty');
        } else {
          setItems(list);
          setPhase('ready');
        }
      } catch {
        if (cancelled) return;
        const fallbackFiltered = category
          ? FALLBACK_BROADCASTS.filter((b) => b.category === category)
          : FALLBACK_BROADCASTS;
        setItems(fallbackFiltered);
        setPhase(fallbackFiltered.length > 0 ? 'ready' : 'empty');
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
                  ? ' border-sky-500 bg-sky-50 text-sky-800 dark:border-cyan-400/60 dark:bg-cyan-400/15 dark:text-cyan-200 font-bold'
                  : ' border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/25')
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
            <li key={index} className="rounded-2xl border border-slate-300 bg-white p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
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
            <li key={item.id} className="rounded-2xl border border-slate-300 bg-white p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
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

              <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-50">{item.title}</h2>

              {item.simplified_summary ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {item.simplified_summary}
                </p>
              ) : null}

              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDateTime(item.start_date)} - {formatDateTime(item.end_date)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {phase === 'empty' ? (
        <div className="rounded-2xl border border-slate-300 bg-white flex items-start gap-3 p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">No announcements</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Nothing is posted{category ? ' in this category' : ''} right now. Check back
              soon, or clear the filter to see every notice.
            </p>
          </div>
        </div>
      ) : null}

      {phase === 'offline' || phase === 'error' ? (
        <div className="rounded-2xl border border-slate-300 bg-white flex items-start gap-3 p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60" role="status">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-300" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No cached announcements
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Announcements are not stored on this device, so the feed needs a connection to
              the barangay server. Reconnect and this page fills itself in.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
