'use client';

import useInView from '@/lib/hooks/useInView';
import StatusBadge from './StatusBadge';

/**
 * L2 sample ticket card (plan Sec. 8.2, 8.3 step 900 ms).
 *
 * This is the only hero surface besides the header that carries `.glass`, so
 * the homepage stays inside the four-blur budget (header, this card and the
 * two CTA panels). The status cycles on existing CSS keyframes; the hook only
 * pauses the loop when the card leaves the viewport or the tab is hidden.
 *
 * Everything here is invented sample data. The masked name follows the plan's
 * public rule (`J*** D**`) and no real tracking code is present.
 */

const SAMPLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'READY_FOR_PICKUP'];

export default function TicketDemo() {
  const [ref] = useInView({
    threshold: 0.25,
    reveal: false,
    pauseOffscreen: true,
  });

  return (
    <div
      ref={ref}
      className="hero-ticket glass p-rhythm-4 sm:p-rhythm-5"
      style={{ '--cycle': '7.2s' }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Request snapshot</h2>
        <span className="state-neutral inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
          Sample only
        </span>
      </div>

      <dl className="mt-4 grid gap-2 font-mono text-xs">
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2 dark:border-white/5">
          <dt className="text-slate-600 dark:text-slate-400">Tracking code</dt>
          <dd className="text-cyan-700 dark:text-cyan-300">CLR-2026-0000</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2 dark:border-white/5">
          <dt className="text-slate-600 dark:text-slate-400">Name</dt>
          <dd className="text-slate-800 dark:text-slate-200">J*** D**</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-slate-600 dark:text-slate-400">Document</dt>
          <dd className="text-slate-800 dark:text-slate-200">Barangay clearance</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Status
        </p>
        <div className="cycle-3 mt-2 h-8" aria-hidden="true">
          {SAMPLE_STATUSES.map((status, index) => (
            <StatusBadge
              key={status}
              status={status}
              className="w-max"
              style={{ '--i': index }}
            />
          ))}
        </div>
        <span className="sr-only">
          Sample status cycles through submitted, under review and ready for pickup.
        </span>
      </div>

      <p className="mt-4 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-400">
        Sample data for illustration. A live request shows the same fields with real,
        masked values.
      </p>
    </div>
  );
}
