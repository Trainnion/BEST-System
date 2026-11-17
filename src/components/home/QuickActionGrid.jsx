'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  FileText,
  IdCard,
  Megaphone,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';

import useInView from '@/lib/hooks/useInView';

/**
 * AI Runtime Civic Bento Grid (plan Sec. 8.2 + ai-runtime Reference).
 *
 * Asymmetric bento grid with individual semantic color accents:
 * - Document Request: Featured wide card with Emerald/Cyan gradient.
 * - Anonymous Blotter: Rose encrypted intake badge.
 * - Business Clearance: Amber in-person Treasurer screening badge.
 * - Kaagapay AI Concierge: Purple civic assistant badge.
 * - Digital Barangay ID: Violet view-only badge.
 *
 * Full dark and light theme fidelity, compositor-only hover lift, accessible focus rings.
 */

const ACTIONS = [
  {
    href: '/services/request',
    label: 'Request a document',
    copy: 'Barangay clearance or certificate of indigency, filed online on the local network or at the counter window.',
    icon: FileText,
    featured: true,
    tag: 'R.A. 11261 ₱0 Eligible',
    theme: {
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
  },
  {
    href: '/track',
    label: 'Track a request',
    copy: 'Check live review and pickup status with your 12-character tracking code.',
    icon: Search,
    tag: 'Anonymous Lookups',
    theme: {
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    },
  },
  {
    href: '/blotter',
    label: 'File a blotter report',
    copy: 'Confidential incident intake encrypted on the server with zero IP logging.',
    icon: ShieldAlert,
    tag: 'AES-256 Encrypted',
    theme: {
      border: 'border-rose-500/30 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    },
  },
  {
    href: '/services/business-clearance',
    label: 'Business clearance',
    copy: 'Schedule mandatory in-person Treasurer assessment for barangay business permits.',
    icon: Store,
    tag: 'Treasurer Screening',
    theme: {
      border: 'border-amber-500/30 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    },
  },
  {
    href: '/id-card',
    label: 'Digital Barangay ID',
    copy: 'Cryptographically verified digital residency card. View-only access.',
    icon: IdCard,
    tag: 'View-Only',
    theme: {
      border: 'border-indigo-500/30 hover:border-indigo-500/50',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    },
  },
  {
    href: '/broadcasts',
    label: 'Announcements',
    copy: 'Ayuda, community health drives, scholarship schedules, and urgent notices.',
    icon: Megaphone,
    tag: 'Public Notices',
    theme: {
      border: 'border-sky-500/30 hover:border-sky-500/50',
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
  },
  {
    href: '/directory',
    label: 'Barangay directory',
    copy: 'Official contact list of Barangay Kagawads, SK Federation, and hall staff.',
    icon: Users,
    tag: 'Hall Staff',
    theme: {
      border: 'border-teal-500/30 hover:border-teal-500/50',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
    },
  },
  {
    href: '/services/kaagapay',
    label: 'Kaagapay Concierge',
    copy: 'Ask procedural civic questions to our offline-capable barangay assistant.',
    icon: Sparkles,
    tag: 'Civic Assistant',
    theme: {
      border: 'border-purple-500/30 hover:border-purple-500/50',
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    },
  },
];

export default function QuickActionGrid() {
  const [ref] = useInView({ threshold: 0.1, once: true, reveal: true, pauseOffscreen: false });

  return (
    <section
      className="cv-auto mx-auto w-full max-w-content px-gutter py-rhythm-6"
      aria-labelledby="quick-actions-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--glass-border)] pb-4">
        <div>
          <h2 id="quick-actions-title" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
            Citizen Action Hub
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Eight essential barangay e-services, unified under one offline-capable counter.
          </p>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[11px] text-slate-500 sm:flex dark:text-slate-400">
          <span>● R.A. 7160 / 11032 COMPLIANT</span>
        </div>
      </div>

      <ul
        ref={ref}
        className="qa-grid mt-rhythm-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          const linkClass = `group relative flex h-full flex-col rounded-2xl border bg-[var(--glass-fill)] p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            action.theme.border
          } ${action.featured ? 'justify-between sm:col-span-2 sm:row-span-2 p-5 sm:p-6' : 'gap-3'}`;

          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-xl border p-2.5 transition-transform duration-200 group-hover:scale-105 ${
                    action.theme.iconBg
                  } ${action.featured ? 'h-12 w-12' : 'h-10 w-10'}`}
                >
                  <Icon size={action.featured ? 22 : 18} aria-hidden="true" />
                </span>

                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase ${action.theme.badge}`}
                >
                  {action.tag}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <span
                  className={`font-bold tracking-tight text-slate-900 transition-colors group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-300 ${
                    action.featured ? 'text-lg sm:text-xl' : 'text-sm'
                  }`}
                >
                  {action.label}
                </span>
                <span
                  className={`leading-relaxed text-slate-600 dark:text-slate-400 ${
                    action.featured ? 'text-sm' : 'text-xs'
                  }`}
                >
                  {action.copy}
                </span>
              </div>

              {action.featured ? (
                <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-300">
                    File Application Online
                    <ArrowUpRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    Est. 5-7 mins
                  </span>
                </div>
              ) : (
                <div className="mt-auto flex items-center justify-end pt-1">
                  <span className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-500 dark:text-slate-500">
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </span>
                </div>
              )}
            </>
          );

          return (
            <li
              key={action.href}
              className={`qa-card ${action.featured ? 'sm:col-span-2 sm:row-span-2' : ''}`}
              style={{ '--i': index }}
            >
              <Link href={action.href} className={linkClass}>
                {cardContent}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
