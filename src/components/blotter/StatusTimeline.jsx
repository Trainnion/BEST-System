/**
 * StatusTimeline - public, day-only blotter status timeline.
 *
 * Only the four stored lifecycle states exist (SCOPE-01: no hearing, summons
 * or escalation state). Each public update is a staff-written action and an
 * optional public note; internal notes never reach this component.
 */

import {
  BLOTTER_STATUSES,
  BLOTTER_STATUS_LABELS,
} from '@/lib/blotter/constants.js';
import { formatDay } from '@/lib/blotter/format.js';

/**
 * @param {{
 *   status?: string,
 *   updates?: Array<{action_taken: string, public_notes: string|null, created_at: string|null}>,
 * }} props
 * @returns {JSX.Element}
 */
export default function StatusTimeline({ status, updates }) {
  const current = typeof status === 'string' ? status.toUpperCase() : '';
  const currentIndex = BLOTTER_STATUSES.indexOf(current);
  const rows = Array.isArray(updates) ? updates : [];

  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        Progress
      </h3>
      <ol className="mt-3 flex flex-col gap-2">
        {BLOTTER_STATUSES.map((step, index) => {
          const reached = currentIndex >= 0 && index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={
                  'mt-1 h-3 w-3 shrink-0 rounded-full border ' +
                  (reached
                    ? 'border-cyan-700 bg-cyan-700 dark:border-cyan-300 dark:bg-cyan-300'
                    : 'border-slate-300 bg-transparent dark:border-white/20')
                }
              />
              <span
                className={
                  'text-sm ' +
                  (isCurrent
                    ? 'font-semibold text-cyan-800 dark:text-cyan-200'
                    : reached
                      ? 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-500')
                }
              >
                {BLOTTER_STATUS_LABELS[step] || step}
              </span>
            </li>
          );
        })}
      </ol>

      {rows.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Public updates
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {rows.map((update, index) => (
              <li
                key={String(index) + (update.created_at || '')}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {formatDay(update.created_at)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {update.action_taken}
                </p>
                {update.public_notes ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {update.public_notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          No public update has been recorded yet. Keep your tracking code and check again.
        </p>
      )}
    </div>
  );
}
