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
 * S3 Quick Action Center (plan Sec. 8.2).
 *
 * An asymmetric bento rather than a flat strip: one wide request card plus
 * seven smaller entries. Cards use `.glass-lite`, which never gains
 * backdrop-filter, so the blur budget and low-end GPUs are untouched. The
 * hover lift is a transform only; the stagger is a one-shot animation keyed
 * off `--i` after the grid enters the viewport.
 */

const ACTIONS = [
  {
    href: '/services/request',
    label: 'Request a document',
    copy: 'Barangay clearance or certificate of indigency, filed from this page or at the hall counter.',
    icon: FileText,
    featured: true,
  },
  {
    href: '/track',
    label: 'Track a request',
    copy: 'Status with your tracking code.',
    icon: Search,
  },
  {
    href: '/blotter',
    label: 'File a blotter report',
    copy: 'Anonymous intake, encrypted on the server.',
    icon: ShieldAlert,
  },
  {
    href: '/services/business-clearance',
    label: 'Business clearance',
    copy: 'Book the in-person Treasurer screening.',
    icon: Store,
  },
  {
    href: '/id-card',
    label: 'Digital Barangay ID',
    copy: 'View only, for signed-in residents.',
    icon: IdCard,
  },
  {
    href: '/broadcasts',
    label: 'Announcements',
    copy: 'Ayuda, health, scholarship and urgent notices.',
    icon: Megaphone,
  },
  {
    href: '/directory',
    label: 'Barangay directory',
    copy: 'Officials, SK and hall staff.',
    icon: Users,
  },
  {
    href: '/services/kaagapay',
    label: 'Kaagapay',
    copy: 'Ask the local civic concierge.',
    icon: Sparkles,
  },
];

export default function QuickActionGrid() {
  const [ref] = useInView({ threshold: 0.1, once: true, reveal: true, pauseOffscreen: false });

  return (
    <section
      className="cv-auto mx-auto w-full max-w-content px-gutter py-rhythm-6"
      aria-labelledby="quick-actions-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="quick-actions-title" className="text-xl font-semibold text-slate-100 sm:text-2xl">
          Where do you need to go?
        </h2>
        <p className="text-xs text-slate-400">Seven services, one counter queue.</p>
      </div>

      <ul
        ref={ref}
        className="qa-grid mt-rhythm-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          const linkClass = `glass-lite group flex h-full flex-col gap-3 p-rhythm-3 transition-transform duration-fast hover:-translate-y-1 hover:border-cyan-400/25 hover:shadow-glow-info active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            action.featured ? 'justify-between p-rhythm-4 sm:p-rhythm-5' : ''
          }`;
          const cardBody = (
            <>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span
                  className={`font-semibold text-slate-100 ${
                    action.featured ? 'text-lg sm:text-xl' : 'text-sm'
                  }`}
                >
                  {action.label}
                </span>
                <span
                  className={`leading-relaxed text-slate-400 ${
                    action.featured ? 'text-sm' : 'text-[11px]'
                  }`}
                >
                  {action.copy}
                </span>
              </span>
              {action.featured ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">
                  Start a request
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              ) : null}
            </>
          );

          // Waves 4-5 own these three routes; until they ship, skip the Link
          // prefetch so the router does not request a page that does not exist.
          // The anchors stay live and become normal prefetching links later.
          return (
            <li
              key={action.href}
              className={`qa-card ${action.featured ? 'col-span-2 lg:row-span-2' : ''}`}
              style={{ '--i': index }}
            >
              {action.href === '/blotter' ? (
                <Link href="/blotter" prefetch={false} className={linkClass}>
                  {cardBody}
                </Link>
              ) : action.href === '/services/business-clearance' ? (
                <Link href="/services/business-clearance" prefetch={false} className={linkClass}>
                  {cardBody}
                </Link>
              ) : action.href === '/id-card' ? (
                <Link href="/id-card" prefetch={false} className={linkClass}>
                  {cardBody}
                </Link>
              ) : (
                <Link href={action.href} className={linkClass}>
                  {cardBody}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
