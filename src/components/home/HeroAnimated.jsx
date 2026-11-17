import Link from 'next/link';
import { ArrowRight, Lock, Search, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

import RotatingGreeting from './RotatingGreeting';
import RuntimeConsole from './RuntimeConsole';

/**
 * AI Runtime Sovereign Hero (plan Sec. 8.2, 8.3 + ai-runtime Reference).
 *
 * Statically rendered server component for optimal LCP.
 * Features:
 * - High-tech civic headline with dual-theme gradient accents.
 * - Interactive RuntimeConsole telemetry dock in right column.
 * - High-contrast accessible CTAs with subtle glowing micro-borders.
 * - Statutory compliance chips (R.A. 11261, R.A. 10173, air-gapped).
 */

const HEADLINE_WORDS = ['Serbisyo', 'ng', 'barangay,', 'mas', 'malinaw.'];

export default function HeroAnimated() {
  return (
    <section
      className="relative mx-auto w-full max-w-content overflow-x-clip px-gutter pb-rhythm-5 pt-rhythm-5 sm:pt-rhythm-6"
      aria-labelledby="hero-title"
    >
      <div className="grid items-center gap-rhythm-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Left Column: Mission, Headlines, CTAs */}
        <div className="max-w-prose">
          {/* Top Telemetry Chip */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
              <ShieldCheck size={14} aria-hidden="true" />
              BEST Terminal Appliance
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Air-Gapped MAN
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
              anonymous tracking code, and read real-time welfare bulletins. BEST operates on an
              independent municipal node that stays responsive when internet connectivity drops.
            </p>
          </div>

          {/* Action Button Row */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="cta-pulse relative inline-flex w-full rounded-full sm:w-auto">
              <Link
                href="/services/request"
                className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-600 hover:shadow-cyan-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:w-auto dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                Request a document
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </span>
            <Link
              href="/track"
              className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-200 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:w-auto dark:bg-white/[0.05] dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Search size={16} aria-hidden="true" />
              Track a request
            </Link>
            <Link
              href="/blotter"
              className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:w-auto dark:text-rose-300"
            >
              <Lock size={14} aria-hidden="true" />
              Anonymous Blotter
            </Link>
          </div>

          {/* Statutory and Privacy Trust Anchors */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--glass-border)] pt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
              Public lookups masked to <span className="font-mono font-medium text-slate-800 dark:text-slate-200">J*** D**</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              R.A. 11261 First Time Jobseekers <span className="font-semibold text-emerald-700 dark:text-emerald-300">₱0 Fee</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Zero Remote Analytics / No CDN
            </span>
          </div>
        </div>

        {/* Right Column: AI Runtime Sovereign Telemetry Console */}
        <div className="w-full">
          <RuntimeConsole />
        </div>
      </div>
    </section>
  );
}
