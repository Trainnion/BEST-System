import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';

import RotatingGreeting from './RotatingGreeting';
import TicketDemo from './TicketDemo';

/**
 * L1 hero (plan Sec. 8.2, 8.3).
 *
 * A server component on purpose: the headline, greeting and CTAs need no
 * JavaScript, so the first paint is final markup and the headline is the
 * Largest Contentful Paint element. Word rise, greeting fade and CTA spring
 * are CSS-only and gated on html.js + motion preference in motion.css.
 *
 * Blur budget: exactly two `.glass` surfaces live here (the two CTA panels).
 * The ticket card next to them is the third and the header is the fourth.
 */

const HEADLINE_WORDS = ['Serbisyo', 'ng', 'barangay,', 'mas', 'malinaw.'];

export default function HeroAnimated() {
  return (
    <section
      className="mx-auto w-full max-w-content overflow-x-clip px-gutter pb-rhythm-5 pt-rhythm-5 sm:pt-rhythm-6"
      aria-labelledby="hero-title"
    >
      <div className="grid items-center gap-rhythm-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="max-w-prose">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
            <ShieldCheck size={14} aria-hidden="true" />
            Barangay E-Services System Terminal
          </p>

          <h1
            id="hero-title"
            className="mt-4 text-4xl font-bold leading-[1.08] text-slate-50 sm:text-5xl lg:text-6xl"
          >
            {HEADLINE_WORDS.map((word, index) => (
              <span
                key={word}
                className={`hero-word mr-[0.22em] ${
                  index === HEADLINE_WORDS.length - 1 ? 'text-gradient-glass' : ''
                }`}
                style={{ '--i': index }}
              >
                {word}
              </span>
            ))}
          </h1>

          <div className="hero-sub mt-4">
            <RotatingGreeting />
            <p className="mt-3 text-base leading-relaxed text-slate-300 sm:text-lg">
              File a clearance or indigency request, follow it with a tracking code, read
              every announcement and reach the hall. BEST runs on the barangay network and
              keeps the pages you already opened working when the connection drops.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="cta-pulse relative inline-flex w-full rounded-glass sm:w-auto">
              <Link
                href="/services/request"
                className="glass hero-cta tap-target inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-fast hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:w-auto"
              >
                Request a document
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </span>
            <Link
              href="/track"
              className="glass hero-cta tap-target inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors duration-fast hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:w-auto"
            >
              <Search size={16} aria-hidden="true" />
              Track a request
            </Link>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            No account needed to track. Names stay masked as <span className="font-mono">J*** D**</span>{' '}
            in every public lookup.
          </p>
        </div>

        <TicketDemo />
      </div>
    </section>
  );
}
