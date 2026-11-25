'use client';

/**
 * OfflineOutbox - the pending write queue viewer (/offline).
 *
 * Reads the shared outbox contract from src/lib/offline/outbox.js:
 * OUTBOX_EVENT, listOutbox(), removeEntry(id), replayOutbox(). The list is
 * re-read whenever the outbox publishes OUTBOX_EVENT, so a replay started
 * elsewhere refreshes this view.
 *
 * Every entry shows PENDING, NEEDS_LOGIN or NEEDS_ATTENTION with a readable
 * reason, plus Retry and Remove controls. Nothing here writes to localStorage
 * directly - the outbox module owns the store.
 */

import { useEffect, useState } from 'react';
import { CircleAlert, Inbox, LoaderCircle, RefreshCw, Server, Trash2, WifiOff } from 'lucide-react';

import { OUTBOX_EVENT, listOutbox, removeEntry, replayOutbox } from '@/lib/offline/outbox.js';
import { formatDateTime } from './helpers.js';

const KIND_LABELS = Object.freeze({
  document: 'Document request',
  business: 'Business clearance',
  blotter: 'Blotter report',
});

const STATUS_META = Object.freeze({
  PENDING: { label: 'Pending', className: 'state-info' },
  SENDING: { label: 'Sending', className: 'state-info' },
  NEEDS_LOGIN: { label: 'Needs sign-in', className: 'state-warning' },
  NEEDS_ATTENTION: { label: 'Needs attention', className: 'state-danger' },
});

const BUTTON_BASE =
  'tap-target inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition';

/**
 * Normalise whatever the outbox stores into one of the display states.
 * @param {object} entry
 * @returns {'PENDING'|'SENDING'|'NEEDS_LOGIN'|'NEEDS_ATTENTION'}
 */
function statusOf(entry) {
  const raw = String((entry && (entry.status || entry.state)) || 'PENDING').toUpperCase();
  if (raw === 'NEEDS_ATTENTION' || raw === 'FAILED' || raw === 'ERROR' || raw === 'REJECTED') {
    return 'NEEDS_ATTENTION';
  }
  if (raw === 'NEEDS_LOGIN' || raw === 'AWAITING_LOGIN') return 'NEEDS_LOGIN';
  if (raw === 'SENDING') return 'SENDING';
  return 'PENDING';
}

/**
 * A human sentence for why an entry sits where it sits.
 * @param {object} entry
 * @param {'PENDING'|'NEEDS_LOGIN'|'NEEDS_ATTENTION'} status
 * @returns {string}
 */
function reasonOf(entry, status) {
  const stored =
    (entry && (entry.reason || entry.error || entry.last_error || entry.message)) || '';
  if (typeof stored === 'string' && stored.trim()) {
    return status === 'NEEDS_ATTENTION'
      ? 'The server rejected this request: ' + stored.trim()
      : stored.trim();
  }
  if (status === 'NEEDS_LOGIN') {
    return 'Your resident session expired. Sign in again and this item is sent automatically.';
  }
  if (status === 'SENDING') {
    return 'Sending this request to the barangay server right now.';
  }
  if (status === 'NEEDS_ATTENTION') {
    return 'The server rejected this request, so it will not be retried. Remove it or ask barangay staff for help.';
  }
  return 'Waiting for a connection to the barangay server. It is sent automatically when the server answers.';
}

export default function OfflineOutbox() {
  const [entries, setEntries] = useState([]);
  const [health, setHealth] = useState('checking'); // checking | up | down
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function refresh() {
    try {
      const rows = await listOutbox();
      setEntries(Array.isArray(rows) ? rows : []);
    } catch {
      setEntries([]);
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener(OUTBOX_EVENT, refresh);
    window.addEventListener('online', refresh);

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/health', { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled) setHealth(response.ok && data && data.ok ? 'up' : 'down');
      } catch {
        if (!cancelled) setHealth('down');
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(OUTBOX_EVENT, refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);

  async function handleRetry() {
    setBusy(true);
    setNote('');
    try {
      const summary = await replayOutbox();
      if (summary && summary.disabled) {
        setNote('The outbox is disabled on this device (kiosk mode), so nothing was sent.');
      } else {
        const sent = (summary && summary.sent) || 0;
        const left = (summary && summary.remaining) || 0;
        setNote(
          'Replay finished: ' +
            sent +
            ' sent, ' +
            left +
            ' still queued on this device.',
        );
      }
    } catch {
      setNote('The replay could not run. It will be tried again when the server answers.');
    } finally {
      setBusy(false);
      refresh();
    }
  }

  async function handleRemove(entry) {
    setBusy(true);
    setNote('');
    try {
      const result = await removeEntry(entry.id);
      setNote(
        result && result.ok
          ? 'The item was removed from this device.'
          : 'That item could not be removed. Try again.',
      );
    } catch {
      setNote('That item could not be removed. Try again.');
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const pending = entries.filter((entry) => {
    const status = statusOf(entry);
    return status === 'PENDING' || status === 'SENDING';
  }).length;
  const attention = entries.length - pending;

  return (
    <section className="glass p-rhythm-4" aria-labelledby="outbox-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="outbox-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pending on this device
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-cyan-700 dark:text-cyan-300">{pending}</span> waiting
          <span aria-hidden="true"> · </span>
          <span className="font-semibold text-rose-700 dark:text-rose-300">{attention}</span> needing attention
        </p>
      </div>

      <p
        className={
          'mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ' +
          (health === 'up'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
            : health === 'down'
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300')
        }
        role="status"
      >
        {health === 'up' ? (
          <Server className="h-4 w-4" aria-hidden="true" />
        ) : health === 'down' ? (
          <WifiOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {health === 'up'
          ? 'Server reachable - queued items can be sent now.'
          : health === 'down'
            ? 'Server not reachable - queued items stay safe on this device.'
            : 'Checking whether the barangay server is reachable...'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRetry}
          disabled={busy || entries.length === 0}
          className={
            BUTTON_BASE +
            ' border-cyan-300 bg-cyan-50 text-cyan-800 hover:border-cyan-500 dark:border-cyan-400/50 dark:bg-cyan-400/15 dark:text-cyan-200 dark:hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60'
          }
        >
          {busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Retry all
        </button>
      </div>

      {note ? (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300" role="status">
          {note}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-rhythm-4 dark:border-white/10 dark:bg-white/[0.04]">
          <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Nothing is queued. Requests you send while offline appear here with a Retry
            button, and they are sent automatically once the server answers.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-rhythm-3">
          {entries.map((entry) => {
            const status = statusOf(entry);
            const meta = STATUS_META[status];
            const kindLabel = KIND_LABELS[entry.kind] || entry.kind || 'Request';
            return (
              <li key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-rhythm-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{kindLabel}</p>
                  <span
                    className={
                      'inline-flex min-h-[26px] items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ' +
                      meta.className
                    }
                  >
                    {meta.label}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {reasonOf(entry, status)}
                </p>

                <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-500">
                  {entry.id}
                  {entry.created_at ? ' - queued ' + formatDateTime(entry.created_at) : ''}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={busy}
                    className={
                      BUTTON_BASE +
                      ' border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60'
                    }
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry)}
                    disabled={busy}
                    className={
                      BUTTON_BASE +
                      ' border-rose-300 bg-rose-50 text-rose-800 hover:border-rose-500 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60'
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {attention > 0 ? (
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Items that need attention are not retried automatically: the server already
          answered them. Fix the cause (often a missing sign-in) before retrying.
        </p>
      ) : null}
    </section>
  );
}
