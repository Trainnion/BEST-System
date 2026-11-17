'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Building2,
} from 'lucide-react';

import useMotionPreference from '@/lib/hooks/useMotionPreference';
import useTheme from '@/lib/hooks/useTheme';

/**
 * Vantix Architectural Footer (plan Sec. 14.2 + Vantix Reference).
 *
 * High-craft civic footer for Barangay Daro:
 * - Giant architectural typography watermark: "BARANGAY DARO".
 * - Clean municipal telemetry ribbon with active local network status.
 * - 4-column structured civic directory matrix:
 *     1. Municipal identity & contact hotlines
 *     2. Resident civic services
 *     3. Public transparency & assistance
 *     4. Statutory compliance & legal mandates
 * - Performance engine switch (Lite / Full) & Dark/Light theme control.
 * - Smooth Back-to-Top anchor.
 */

export default function SiteFooter() {
  const pathname = usePathname() || '/';

  // Do not render public civic footer on admin portal pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const { tier, setTier } = useMotionPreference();
  const { theme, isDark, toggleTheme, mounted } = useTheme();

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const basePill =
    'tap-target inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500';
  const activePill =
    'border-cyan-600 bg-cyan-100 text-cyan-900 font-bold dark:border-cyan-400/40 dark:bg-cyan-400/15 dark:text-cyan-200';
  const idlePill =
    'border-slate-300 bg-slate-100 text-slate-700 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-slate-100';

  return (
    <footer className="site-footer relative mt-rhythm-6 overflow-hidden border-t border-slate-300 bg-white pt-12 pb-8 transition-colors dark:border-white/10 dark:bg-slate-950">
      {/* Vantix Architectural Background Watermark */}
      <div
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[14vw] font-black tracking-tighter text-slate-900/[0.04] dark:text-white/[0.02]"
        aria-hidden="true"
      >
        BARANGAY DARO
      </div>

      <div className="relative mx-auto w-full max-w-content px-gutter">
        {/* 4-Column Structured Directory Matrix */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Municipal Hall Identity & Contacts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="font-extrabold text-base tracking-tight">Barangay Daro</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Autonomous Municipal Barangay Services Terminal. Providing fast, accessible, offline-first digital government for all residents of Barangay Daro.
            </p>
            <div className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-400" />
                <span>Barangay Hall Compound, Daro</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-cyan-700 dark:text-cyan-400" />
                <span>Hall Desk: (045) 900-BEST / 911 Direct</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="shrink-0 text-cyan-700 dark:text-cyan-400" />
                <span>Monday - Friday: 8:00 AM - 5:00 PM</span>
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
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Barangay Clearance & Indigency
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Track Application by Code
                </Link>
              </li>
              <li>
                <Link
                  href="/blotter"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Anonymous Incident Blotter Intake
                </Link>
              </li>
              <li>
                <Link
                  href="/services/business-clearance"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Business Clearance (Treasurer)
                </Link>
              </li>
              <li>
                <Link
                  href="/id-card"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
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
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Public Welfare Announcements
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Barangay Officials & SK Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/services/kaagapay"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Kaagapay Civic Concierge
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Unified Portal Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/offline"
                  className="font-medium text-slate-700 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  Offline Resilience & Cache Help
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Statutory Framework & Legal Mandate */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200">
              <Scale size={14} className="text-cyan-700 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Statutory Standards
              </h3>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <span className="font-semibold text-slate-900 dark:text-slate-300">R.A. 7160</span> — Local Government Code of 1991 (Service Charters)
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-slate-300">R.A. 10173</span> — Data Privacy Act of 2012 (Privacy by Design)
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-slate-300">R.A. 11261</span> — First-Time Jobseekers Assistance (₱0 Waiver)
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-slate-300">R.A. 11032</span> — Ease of Doing Business Act
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Utility Bar: Controls, Disclaimers, and Back-to-Top */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-600 sm:flex-row dark:border-white/10 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            {/* Visual Effects Preference */}
            <div className="flex items-center gap-2">
              <Gauge size={15} aria-hidden="true" className="text-slate-500" />
              <span className="text-[11px] font-semibold">Performance:</span>
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
              <span className="text-[11px] font-semibold">Theme:</span>
              <div role="group" aria-label="Theme selector" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mounted && toggleTheme()}
                  aria-pressed={!isDark}
                  className={`${basePill} ${!isDark ? activePill : idlePill}`}
                >
                  <Sun size={12} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => mounted && toggleTheme()}
                  aria-pressed={isDark}
                  className={`${basePill} ${isDark ? activePill : idlePill}`}
                >
                  <Moon size={12} />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Legal statement + Back to Top */}
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-center sm:text-right">
              Digital Barangay IDs are view-only. Operating on the local barangay hall network.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="tap-target inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowUp size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] font-medium text-slate-500 dark:text-slate-600">
          © {new Date().getFullYear()} Barangay Daro · BEST (Barangay E-Services System Terminal)
        </div>
      </div>
    </footer>
  );
}
