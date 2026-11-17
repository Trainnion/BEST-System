'use client';

import { ClipboardCheck, PackageCheck, Send, Wallet } from 'lucide-react';

import useInView from '@/lib/hooks/useInView';

/**
 * S4 Request journey (plan Sec. 8.2).
 *
 * Mirrors the document state machine: Apply -> Review -> Pay or Free ->
 * Pickup. The line is an inline SVG with `pathLength="1"`, so the existing
 * `draw-path` keyframes need no JavaScript maths; the four nodes light in
 * sequence via `--i`. Runs once and sits fully drawn under reduced motion,
 * Lite, print and no-JS.
 */

const STEPS = [
  {
    title: 'Apply',
    copy: 'Online on the barangay network or in person at the counter.',
    icon: Send,
  },
  {
    title: 'Review',
    copy: 'Staff check the purpose statement and the requirements.',
    icon: ClipboardCheck,
  },
  {
    title: 'Pay or free',
    copy: 'Settle the fee at the Treasurer, or none for indigency.',
    icon: Wallet,
  },
  {
    title: 'Pickup',
    copy: 'Bring the tracking code to the release window.',
    icon: PackageCheck,
  },
];

export default function JourneyTrack() {
  const [ref] = useInView({ threshold: 0.3, once: true, reveal: true, pauseOffscreen: false });

  return (
    <section
      ref={ref}
      className="journey cv-auto mx-auto w-full max-w-content px-gutter py-rhythm-6"
      aria-labelledby="journey-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="journey-title" className="text-xl font-semibold text-slate-100 sm:text-2xl">
          How a request moves
        </h2>
        <p className="text-xs text-slate-400">Same four steps online, at the hall or on paper.</p>
      </div>

      <div className="relative mt-rhythm-5">
        <svg
          className="journey-svg pointer-events-none absolute inset-x-0 top-[22px] hidden h-2 w-full sm:block"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className="journey-path"
            d="M0 1 H100"
            pathLength="1"
            fill="none"
            stroke="rgba(34, 211, 238, 0.45)"
            strokeWidth="0.7"
          />
        </svg>

        <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="journey-node glass-lite flex flex-col gap-2 bg-obsidian-800/80 p-rhythm-3"
                style={{ '--i': index }}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-obsidian-800 text-cyan-300">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-100">
                  <span className="mr-1 font-mono text-[11px] text-cyan-400" aria-hidden="true">
                    {index + 1}.
                  </span>
                  {step.title}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400">{step.copy}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
