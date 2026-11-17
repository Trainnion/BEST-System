import Link from 'next/link';
import { ArrowRight, Lock, Search, ShieldCheck } from 'lucide-react';

import RotatingGreeting from './RotatingGreeting';
import CitizenCard from './CitizenCard';

/**
 * Hero Section (Barangay Daro).
 *
 * Fast, lightweight, statically-rendered hero:
 * - High-contrast typography and clear call-to-actions.
 * - CitizenCard with real-time quick track and official service standards.
 * - Statutory compliance badges for R.A. 11261 and R.A. 10173.
 */

const HEADLINE_WORDS = ['Serbisyo', 'ng', 'barangay,', 'mas', 'malinaw.'];

export default function HeroAnimated() {
  return (
    <section
      className="relative mx-auto w-full max-w-content px-gutter pb-rhythm-5 pt-rhythm-5 sm:pt-rhythm-6"
      aria-labelledby="hero-title"
    >
      <div className="grid items-center gap-rhythm-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Left Column: Mission, Headlines, CTAs */}
        <div className="max-w-prose">
          {/* Top Telemetry Chip */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-600/30 bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
              <ShieldCheck size={14} aria-hidden="true" />
              Barangay Daro E-Services
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-mono font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              Offline-Ready
            </span>
          </div>

          {/* Large Headline */}
          <h1
            id="hero-title"
            className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50"
          >
            {HEADLINE_WORDS.map((word, index) => (
              <span
                key={word}
                className={`hero-word mr-[0.22em] inline-block ${
                  index === HEADLINE_WORDS.length - 1 ? 'text-gradient-runtime' : ''
                }`}
                style={{ '--i': index }}
              >
                {word}
              </span>
            ))}
          </h1>

          <div className="hero-sub mt-4">
            <RotatingGreeting />
            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-300">
              File a barangay clearance or certificate of indigency, follow progress with an
              anonymous tracking code, and read verified community announcements. BEST operates on the
              Barangay Daro local network and stays accessible even when external internet drops.
            </p>
          </div>

          {/* Action Button Row */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/services/request"
              className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:w-auto dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Request a document
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/track"
              className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:w-auto dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:bg-white/10"
            >
              <Search size={16} aria-hidden="true" />
              Track a request
            </Link>
            <Link
              href="/blotter"
              className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:w-auto dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              <Lock size={14} aria-hidden="true" />
              Anonymous Blotter
            </Link>
          </div>

          {/* Statutory and Privacy Trust Anchors */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
              Public lookups masked to <span className="font-mono font-bold text-slate-900 dark:text-slate-200">J*** D**</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              R.A. 11261 Jobseekers <span className="font-bold text-emerald-800 dark:text-emerald-300">₱0 Fee</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              Zero Cloud Tracking
            </span>
          </div>
        </div>

        {/* Right Column: Citizen Service & Fast-Track Card */}
        <div className="w-full">
          <CitizenCard />
        </div>
      </div>
    </section>
  );
}
