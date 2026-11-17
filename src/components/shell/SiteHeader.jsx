'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, ShieldCheck, X } from 'lucide-react';

/**
 * Shared public shell header (plan Sec. 7 shell routes).
 *
 * Every link is same-origin and statically renderable, so the header works from
 * the Service Worker cache and never reaches a remote origin. The current route
 * is exposed with aria-current rather than colour alone, and the nav collapses
 * to a single 44px toggle below lg so a 375px screen stays usable.
 *
 * This is one of the four allowed fingerprint surfaces on `/`: it is the only
 * nav element carrying `.glass`, so Full tier gets exactly one blurred header.
 */

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/track', label: 'Track' },
  { href: '/broadcasts', label: 'Announcements' },
  { href: '/directory', label: 'Directory' },
  { href: '/services/request', label: 'Request' },
  { href: '/services/kaagapay', label: 'Kaagapay' },
  { href: '/resident/login', label: 'Resident login' },
  { href: '/offline', label: 'Offline help' },
];

function isCurrent(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);

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
    <div className="site-header sticky top-0 z-40 px-3 pt-3">
      <header className="glass mx-auto w-full max-w-content px-3 py-2">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1.5 text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <span className="text-sm font-extrabold tracking-tight">BEST</span>
            <span className="hidden text-[11px] font-medium leading-tight text-slate-400 sm:inline">
              Barangay E-Services
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? 'page' : undefined}
                  className={`rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    current
                      ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="tap-target ml-auto inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:hidden"
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>

        {open ? (
          <nav
            id="site-mobile-nav"
            aria-label="Primary"
            className="mt-2 max-h-[70dvh] overflow-y-auto border-t border-white/10 pt-2 lg:hidden"
          >
            <ul className="grid grid-cols-2 gap-1">
              {NAV_LINKS.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={current ? 'page' : undefined}
                      className={`flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        current
                          ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </header>
    </div>
  );
}
