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
 * Civic Action Bento Grid (Barangay Daro).
 *
 * High-contrast, zero-lag bento grid with individual semantic color accents:
 * - Document Request: Featured wide card with Emerald highlight.
 * - Anonymous Blotter: Rose intake badge.
 * - Business Clearance: Amber in-person Treasurer screening badge.
 * - Kaagapay AI Concierge: Purple civic assistant badge.
 * - Digital Barangay ID: Violet view-only badge.
 *
 * Full dark and light theme fidelity, solid white cards on light canvas.
 */

const ACTIONS = [
  {
    href: '/services/request',
    label: 'Request a document',
    copy: 'Barangay clearance or certificate of indigency, filed online or at the hall window.',
    icon: FileText,
    featured: true,
    tag: 'R.A. 11261 ₱0 Eligible',
    theme: {
      border: 'border-slate-300 hover:border-emerald-600 dark:border-emerald-500/30 dark:hover:border-emerald-500/50',
      iconBg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      badge: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    },
  },
  {
    href: '/track',
    label: 'Track a request',
    copy: 'Check review and pickup status with your 12-character tracking code.',
    icon: Search,
    tag: 'Public Lookup',
    theme: {
      border: 'border-slate-300 hover:border-cyan-600 dark:border-cyan-500/30 dark:hover:border-cyan-500/50',
      iconBg: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
      badge: 'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    href: '/blotter',
    label: 'File a blotter report',
    copy: 'Confidential incident intake encrypted on the server with zero IP logging.',
    icon: ShieldAlert,
    tag: 'Encrypted Intake',
    theme: {
      border: 'border-slate-300 hover:border-rose-600 dark:border-rose-500/30 dark:hover:border-rose-500/50',
      iconBg: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
      badge: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    },
  },
  {
    href: '/services/business-clearance',
    label: 'Business clearance',
    copy: 'Schedule mandatory in-person Treasurer assessment for barangay business permits.',
    icon: Store,
    tag: 'Treasurer Screening',
    theme: {
      border: 'border-slate-300 hover:border-amber-600 dark:border-amber-500/30 dark:hover:border-amber-500/50',
      iconBg: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      badge: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    },
  },
  {
    href: '/id-card',
    label: 'Digital Barangay ID',
    copy: 'Cryptographically verified digital residency card. View-only access.',
    icon: IdCard,
    tag: 'View-Only',
    theme: {
      border: 'border-slate-300 hover:border-indigo-600 dark:border-indigo-500/30 dark:hover:border-indigo-500/50',
      iconBg: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      badge: 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
    },
  },
  {
    href: '/broadcasts',
    label: 'Announcements',
    copy: 'Ayuda, health drives, scholarship schedules, and urgent community bulletins.',
    icon: Megaphone,
    tag: 'Public Notices',
    theme: {
      border: 'border-slate-300 hover:border-sky-600 dark:border-sky-500/30 dark:hover:border-sky-500/50',
      iconBg: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
      badge: 'bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
    },
  },
  {
    href: '/directory',
    label: 'Barangay directory',
    copy: 'Official contact list of Barangay Daro Kagawads, SK Federation, and hall staff.',
    icon: Users,
    tag: 'Hall Staff',
    theme: {
      border: 'border-slate-300 hover:border-teal-600 dark:border-teal-500/30 dark:hover:border-teal-500/50',
      iconBg: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
      badge: 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
    },
  },
  {
    href: '/services/kaagapay',
    label: 'Kaagapay Concierge',
    copy: 'Ask procedural civic questions to our offline-capable barangay assistant.',
    icon: Sparkles,
    tag: 'Civic Assistant',
    theme: {
      border: 'border-slate-300 hover:border-purple-600 dark:border-purple-500/30 dark:hover:border-purple-500/50',
      iconBg: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      badge: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30',
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
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-300 pb-4 dark:border-white/10">
        <div>
          <h2 id="quick-actions-title" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
            Barangay Daro Services Hub
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Seven essential public services, accessible online or at the barangay hall counter.
          </p>
        </div>
      </div>

      <ul
        ref={ref}
        className="qa-grid mt-rhythm-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          const linkClass = `group relative flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-slate-900 dark:border-white/10 ${
            action.theme.border
          } ${action.featured ? 'justify-between sm:col-span-2 sm:row-span-2 p-5 sm:p-6' : 'gap-3'}`;

          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-xl border p-2.5 transition-transform duration-150 group-hover:scale-105 ${
                    action.theme.iconBg
                  } ${action.featured ? 'h-12 w-12' : 'h-10 w-10'}`}
                >
                  <Icon size={action.featured ? 22 : 18} aria-hidden="true" />
                </span>

                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${action.theme.badge}`}
                >
                  {action.tag}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <span
                  className={`font-bold tracking-tight text-slate-900 transition-colors group-hover:text-cyan-700 dark:text-slate-100 dark:group-hover:text-cyan-300 ${
                    action.featured ? 'text-lg sm:text-xl' : 'text-sm'
                  }`}
                >
                  {action.label}
                </span>
                <span
                  className={`leading-relaxed text-slate-600 font-medium dark:text-slate-400 ${
                    action.featured ? 'text-sm' : 'text-xs'
                  }`}
                >
                  {action.copy}
                </span>
              </div>

              {action.featured ? (
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    File Application Online
                    <ArrowUpRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Est. 5-7 mins
                  </span>
                </div>
              ) : (
                <div className="mt-auto flex items-center justify-end pt-1">
                  <span className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-700 dark:text-slate-500">
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
