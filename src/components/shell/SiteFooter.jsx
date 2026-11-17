'use client';

import Link from 'next/link';
import {
  ArrowUp,
  Clock,
  Gauge,
  MapPin,
  Moon,
  Phone,
  Scale,
  ShieldCheck,
  Sun,
  Terminal,
} from 'lucide-react';

import useMotionPreference from '@/lib/hooks/useMotionPreference';
import useTheme from '@/lib/hooks/useTheme';

/**
 * Vantix Architectural Footer (plan Sec. 14.2 + Vantix Reference).
 *
 * High-craft sovereign civic footer featuring:
 * - Giant architectural typography watermark: "BARANGAY SAN GABRIEL".
 * - Live sovereign MAN telemetry strip with air-gapped status indicators.
 * - 4-column structured civic directory matrix:
 *     1. Municipal identity & contact hotlines
 *     2. Resident civic services
 *     3. Public transparency & guides
 *     4. Statutory compliance & legal mandates
 * - Performance engine switch (Lite / Full) & Dark/Light theme control.
 * - Smooth Back-to-Top anchor.
 * - Statutory compliance notices (R.A. 7160, R.A. 10173, view-only Digital ID).
 */

export default function SiteFooter() {
  const { tier, setTier } = useMotionPreference();
  const { theme, isDark, toggleTheme, mounted } = useTheme();

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const basePill =
    'tap-target inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';
  const activePill =
    'border-cyan-500/40 bg-cyan-500/15 text-cyan-600 dark:border-cyan-400/40 dark:bg-cyan-400/15 dark:text-cyan-200 shadow-xs';
  const idlePill =
    'border-[var(--glass-border)] bg-slate-100 text-slate-600 hover:text-slate-950 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-slate-100';

  return (
    <footer className="site-footer relative mt-rhythm-6 overflow-hidden border-t border-[var(--glass-border)] bg-[var(--bg-0)]/90 backdrop-blur-md pt-12 pb-8 transition-colors">
      {/* Vantix Architectural Background Watermark */}
      <div
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[12vw] font-black tracking-tighter text-slate-900/[0.03] dark:text-white/[0.02]"
        aria-hidden="true"
      >
        BARANGAY SAN GABRIEL
      </div>

      <div className="relative mx-auto w-full max-w-content px-gutter">
        {/* Top Sovereign Telemetry Ribbon */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
              <Terminal size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                BEST Terminal Appliance <span className="font-mono text-xs font-normal text-cyan-600 dark:text-cyan-300">v5.2-LTS</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Air-gapped municipal node · Local hardware root of trust
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LAN: 127.0.0.1:5432 OK</span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-700 sm:flex dark:text-cyan-300">
              <ShieldCheck size={13} />
              <span>AES-256-GCM ACTIVE</span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-700 md:flex dark:text-amber-300">
              <span>ZERO CDN LEAK</span>
            </div>
          </div>
        </div>

        {/* 4-Column Structured Directory Matrix */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Municipal Hall Identity & Contacts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="font-extrabold text-base tracking-tight">Barangay San Gabriel</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Autonomous Municipal Barangay Services Terminal. Providing sovereign, offline-first digital government for every resident.
            </p>
            <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span>Barangay Hall Compound, San Gabriel</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span>Hotline: (045) 900-BEST / 911</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span>Mon - Fri: 8:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>

          {/* Column 2: Resident Civic Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Civic Services
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/services/request"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Barangay Clearance & Indigency
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Track Application by Code
                </Link>
              </li>
              <li>
                <Link
                  href="/blotter"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Anonymous Blotter Incident Intake
                </Link>
              </li>
              <li>
                <Link
                  href="/services/business-clearance"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Business Clearance (Treasurer)
                </Link>
              </li>
              <li>
                <Link
                  href="/id-card"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Digital Barangay ID (View-Only)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Public Transparency & Portal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Transparency & Help
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/broadcasts"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Public Welfare Announcements
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Barangay & SK Officials Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/services/kaagapay"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Kaagapay Civic Concierge
                </Link>
              </li>
              <li>
                <Link
                  href="/manual"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Complete System Operations Manual
                </Link>
              </li>
              <li>
                <Link
                  href="/offline"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Offline Emergency Resilience Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Statutory Framework & Legal Mandate */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200">
              <Scale size={14} className="text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Statutory Mandates
              </h3>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-300">R.A. 7160</span> — Local Government Code of 1991 (Service Standards)
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-300">R.A. 10173</span> — Data Privacy Act of 2012 (Zero PII Transmit)
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-300">R.A. 11261</span> — First Time Jobseekers Assistance Act (₱0 Fee)
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-300">R.A. 11032</span> — Ease of Doing Business Act
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Utility Bar: Controls, Disclaimers, and Back-to-Top */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--glass-border)] pt-6 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            {/* Visual Effects Preference */}
            <div className="flex items-center gap-2">
              <Gauge size={15} aria-hidden="true" className="text-slate-400" />
              <span className="text-[11px] font-medium">FX:</span>
              <div role="group" aria-label="Visual effects" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTier('lite')}
                  aria-pressed={tier === 'lite'}
                  className={`${basePill} ${tier === 'lite' ? activePill : idlePill}`}
                >
                  Lite
                </button>
                <button
                  type="button"
                  onClick={() => setTier('full')}
                  aria-pressed={tier === 'full'}
                  className={`${basePill} ${tier === 'full' ? activePill : idlePill}`}
                >
                  Full
                </button>
              </div>
            </div>

            {/* Theme Preference Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium">Theme:</span>
              <div role="group" aria-label="Theme selector" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mounted && toggleTheme()}
                  aria-pressed={isDark}
                  className={`${basePill} ${isDark ? activePill : idlePill}`}
                >
                  <Moon size={12} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => mounted && toggleTheme()}
                  aria-pressed={!isDark}
                  className={`${basePill} ${!isDark ? activePill : idlePill}`}
                >
                  <Sun size={12} />
                  <span>Light</span>
                </button>
              </div>
            </div>
          </div>

          {/* Legal statement + Back to Top */}
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-center sm:text-right">
              Digital Barangay IDs are view-only. Unplugged sovereign appliance.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="tap-target inline-flex items-center justify-center rounded-full border border-[var(--glass-border)] bg-slate-100 p-2 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-950 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowUp size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Barangay San Gabriel · BEST (Barangay E-Services System Terminal)
        </div>
      </div>
    </footer>
  );
}
