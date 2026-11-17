'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';

import useTheme from '@/lib/hooks/useTheme';

/**
 * Atlas Nav Island Dock (plan Sec. 7 + Atlas Reference).
 *
 * Fast, lightweight floating island dock for Barangay Daro:
 * - Floating centered island dock geometry with rounded-full pill elevation.
 * - Live sovereign status indicator (Offline-Ready Local Network).
 * - Instant Dark/Light theme switcher with zero layout shift.
 * - Quick "Track" action pill for instant citizen access.
 * - Responsive mobile island drawer with grouped civic actions.
 */

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/track', label: 'Track' },
  { href: '/services/request', label: 'Request' },
  { href: '/broadcasts', label: 'Announcements' },
  { href: '/directory', label: 'Directory' },
  { href: '/services/kaagapay', label: 'Kaagapay' },
  { href: '/resident/login', label: 'Resident' },
];

function isCurrent(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme, mounted } = useTheme();

  // Navigation always closes the small-screen panel.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="site-header sticky top-3.5 z-40 px-3 sm:px-6">
      <header className="mx-auto w-full max-w-5xl rounded-full border border-slate-300 bg-white/95 px-3.5 py-1.5 shadow-md transition-all sm:px-4 sm:py-2 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-lg dark:shadow-black/20">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Brand + Barangay Daro Beacon */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-full py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-slate-50"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-600/30 bg-cyan-50 text-cyan-700 shadow-sm transition-transform duration-150 hover:scale-105 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">
                  BEST
                </span>
                <span className="hidden text-[9px] font-mono tracking-wider text-cyan-800 uppercase sm:inline dark:text-cyan-400">
                  BARANGAY DARO
                </span>
              </span>
            </Link>

            {/* Offline-Ready Status Beacon */}
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-800 sm:inline-flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              <span className="tracking-wide uppercase">LOCAL NETWORK ACTIVE</span>
            </div>
          </div>

          {/* Center: Primary Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? 'page' : undefined}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    current
                      ? 'bg-cyan-100 text-cyan-900 font-bold ring-1 ring-cyan-500 dark:bg-cyan-400/15 dark:text-cyan-200 dark:ring-cyan-400/40'
                      : 'text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Action Pill + Theme Switcher + Mobile Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Track Pill */}
            <Link
              href="/track"
              className="hidden items-center gap-1.5 rounded-full border border-cyan-600/30 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 transition-colors hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:inline-flex dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200 dark:hover:bg-cyan-400/20 dark:hover:text-white"
            >
              <Search size={13} aria-hidden="true" />
              <span>Track</span>
            </Link>

            {/* Theme Switcher (Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={mounted ? (isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme') : 'Toggle Theme'}
              title={mounted ? (isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme') : 'Toggle Theme'}
              className="tap-target relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {mounted ? (
                isDark ? (
                  <Sun size={15} aria-hidden="true" className="text-amber-400" />
                ) : (
                  <Moon size={15} aria-hidden="true" className="text-slate-700" />
                )
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-dashed border-slate-400"></span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setOpen((curr) => !curr)}
              aria-expanded={open}
              aria-controls="site-mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="tap-target inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 md:hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Island Drawer */}
        {open ? (
          <nav
            id="site-mobile-nav"
            aria-label="Primary"
            className="mt-3 max-h-[75dvh] overflow-y-auto border-t border-slate-200 pt-3 md:hidden dark:border-white/10"
          >
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-mono text-slate-600 uppercase dark:text-slate-400">
              <span>Barangay Daro Services</span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                Connected
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5">
              {NAV_LINKS.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={current ? 'page' : undefined}
                      className={`flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        current
                          ? 'bg-cyan-100 text-cyan-900 font-bold ring-1 ring-cyan-500 dark:bg-cyan-400/15 dark:text-cyan-200 dark:ring-cyan-400/40'
                          : 'text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 px-1 dark:border-white/10">
              <span className="text-xs text-slate-600 dark:text-slate-400">Color Appearance</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="tap-target inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
              >
                {isDark ? (
                  <>
                    <Sun size={14} className="text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-slate-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </nav>
        ) : null}
      </header>
    </div>
  );
}
