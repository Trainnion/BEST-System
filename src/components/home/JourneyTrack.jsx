'use client';

import { ClipboardCheck, PackageCheck, Send, ShieldCheck, Wallet } from 'lucide-react';

import useInView from '@/lib/hooks/useInView';

/**
 * Service Request Lifecycle Track (Barangay Daro).
 *
 * Demonstrates the 4-step statutory document lifecycle:
 * 1. Apply: Intake online or at hall counter.
 * 2. Review: Records verification against barangay roster.
 * 3. Assessment: Fee payment at Treasurer or statutory ₱0 indigency waiver.
 * 4. Pickup: Physical document release with vector QR validation.
 *
 * High-contrast light and dark styling, zero lag.
 */

const STEPS = [
  {
    step: '01',
    title: 'Intake & Filing',
    copy: 'Submit application online via local network terminal or in person at the records window.',
    icon: Send,
    badge: 'Step 1: Input',
  },
  {
    step: '02',
    title: 'Staff Verification',
    copy: 'Records officer validates resident record, purpose statement, and valid identification.',
    icon: ClipboardCheck,
    badge: 'Step 2: Review',
  },
  {
    step: '03',
    title: 'Assessment & Fee',
    copy: 'Treasurer assesses statutory fee, or issues ₱0 waiver under R.A. 11261 for jobseekers.',
    icon: Wallet,
    badge: 'Step 3: Clearance',
  },
  {
    step: '04',
    title: 'Document Release',
    copy: 'Claim stamped document bearing Punong Barangay seal and vector QR validation hash.',
    icon: PackageCheck,
    badge: 'Step 4: Fulfillment',
  },
];

export default function JourneyTrack() {
  const [ref] = useInView({ threshold: 0.25, once: true, reveal: true, pauseOffscreen: false });

  return (
    <section
      ref={ref}
      className="journey cv-auto mx-auto w-full max-w-content px-gutter py-rhythm-6"
      aria-labelledby="journey-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-300 pb-4 dark:border-white/10">
        <div>
          <h2 id="journey-title" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
            Civic Service Lifecycle
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Predictable, transparent 4-stage progression for all Barangay Daro document requests.
          </p>
        </div>
      </div>

      <div className="relative mt-rhythm-5">
        {/* Horizontal Connector Line for Desktop */}
        <svg
          className="journey-svg pointer-events-none absolute inset-x-0 top-[26px] hidden h-2 w-full sm:block"
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
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-cyan-600/40 dark:text-cyan-400/40"
          />
        </svg>

        <ol className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="journey-node group flex flex-col justify-between rounded-2xl border border-slate-300 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-cyan-600 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-cyan-400/40"
                style={{ '--i': index }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-600/30 bg-cyan-50 text-cyan-800 shadow-sm transition-transform duration-150 group-hover:scale-105 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs font-black text-cyan-800 dark:text-cyan-400">
                      {step.step}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {step.badge}
                    </p>
                    <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-medium dark:text-slate-400">
                      {step.copy}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-200 pt-2.5 font-mono text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
                  <span>Official Hall Window</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
