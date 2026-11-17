'use client';

import Link from 'next/link';
import { Gauge } from 'lucide-react';

import useMotionPreference from '@/lib/hooks/useMotionPreference';

/**
 * Shared public shell footer (plan Sec. 14.2).
 *
 * The effect switch is the documented manual override: it stores only the UI
 * preference `best:fx` (never personal data) and immediately applies the tier
 * through useMotionPreference. Lite remains the default until the visitor or
 * the device probe says otherwise.
 *
 * The view-only line is a product rule, not decoration: the Digital Barangay
 * ID has no print or export path anywhere in BEST.
 */

export default function SiteFooter() {
  const { tier, setTier } = useMotionPreference();

  const baseButton =
    'tap-target inline-flex items-center rounded-lg border px-3 py-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';
  const activeButton = 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200';
  const idleButton = 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-100';

  return (
    <footer className="site-footer mt-rhythm-6 border-t border-white/10 bg-obsidian/60">
      <div className="mx-auto flex w-full max-w-content flex-col gap-4 px-gutter py-rhythm-5 text-xs text-slate-400 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-semibold text-slate-300">
            BEST - Barangay E-Services System Terminal
          </p>
          <p>Digital Barangay IDs are view-only: they cannot be printed or exported.</p>
          <p>
            <Link
              href="/offline"
              className="rounded font-semibold text-cyan-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Offline help
            </Link>{' '}
            · R.A. 7160 service standards · R.A. 10173 privacy by design
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Gauge size={16} aria-hidden="true" className="text-slate-500" />
          <div role="group" aria-label="Visual effects" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTier('lite')}
              aria-pressed={tier === 'lite'}
              className={`${baseButton} ${tier === 'lite' ? activeButton : idleButton}`}
            >
              Lite
            </button>
            <button
              type="button"
              onClick={() => setTier('full')}
              aria-pressed={tier === 'full'}
              className={`${baseButton} ${tier === 'full' ? activeButton : idleButton}`}
            >
              Full effects
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
