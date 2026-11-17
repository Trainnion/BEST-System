'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  FileCheck2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/**
 * Citizen Fast-Track & Service Card (Barangay Daro).
 *
 * Lightweight, accessible, zero-lag civic card:
 * - Real tracking search input with instant navigation to /track.
 * - Current counter status and service operating hours.
 * - Standard fee and turnaround schedule (R.A. 11261 zero-fee compliant).
 */

export default function CitizenCard() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) {
      router.push(`/track?code=${encodeURIComponent(clean)}`);
    } else {
      router.push('/track');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-md transition-all sm:p-6 dark:border-white/10 dark:bg-slate-900 dark:shadow-xl">
      {/* Header with Daro Status */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-600/30 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Barangay Daro Service Desk
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              E-Services & Document Processing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
          <span>Counters Open</span>
        </div>
      </div>

      {/* Real Fast-Track Lookup Form */}
      <div className="mt-4">
        <label
          htmlFor="hero-track-input"
          className="block text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          Quick Track Application
        </label>
        <form onSubmit={handleTrackSubmit} className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="hero-track-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CLR-2026-7K2M9QXA"
              maxLength={24}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 font-mono text-sm text-slate-900 uppercase tracking-wide placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="tap-target inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            Track
          </button>
        </form>
      </div>

      {/* Official Processing Standards */}
      <div className="mt-4 space-y-2 border-t border-slate-200 pt-3.5 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Official Release Standards
        </p>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <FileCheck2 size={16} className="text-cyan-700 dark:text-cyan-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Barangay Clearance
            </span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-900 dark:text-white">₱50.00</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Same-Day Release</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-emerald-700 dark:text-emerald-400" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Certificate of Indigency
              </span>
              <span className="block text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                R.A. 11261 Jobseekers Waived
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">₱0.00 Free</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Same-Day Release</span>
          </div>
        </div>
      </div>

      {/* Office schedule note */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-cyan-700 dark:text-cyan-400" />
          Mon - Fri: 8:00 AM - 5:00 PM
        </span>
        <Link
          href="/services/request"
          className="font-bold text-cyan-700 hover:underline dark:text-cyan-400"
        >
          File online &rarr;
        </Link>
      </div>
    </div>
  );
}
