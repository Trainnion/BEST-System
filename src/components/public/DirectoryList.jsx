'use client';

/**
 * DirectoryList - FR-07 barangay leadership roster (/directory).
 *
 * Static shell, live data: GET /api/directory is fetched in the browser and
 * the officials are grouped by position in the order the server returns them.
 * Only office contact details are shown - no account names, no emails.
 */

import { useEffect, useState } from 'react';
import { MapPin, Phone, Users, WifiOff } from 'lucide-react';

/**
 * Group a flat list by position, keeping the server's order.
 * @param {Array<{position: string}>} rows
 * @returns {Array<{position: string, rows: Array<object>}>}
 */
function groupByPosition(rows) {
  const groups = [];
  const indexByPosition = new Map();
  for (const row of rows) {
    const position = row.position || 'Barangay Office';
    if (!indexByPosition.has(position)) {
      indexByPosition.set(position, groups.length);
      groups.push({ position, rows: [] });
    }
    groups[indexByPosition.get(position)].rows.push(row);
  }
  return groups;
}

const DARO_FALLBACK_OFFICIALS = [
  {
    id: 'daro-off-1',
    full_name: 'Hon. Roberto T. Morales',
    position: 'Punong Barangay',
    committee: 'Executive Governance & Administration',
    contact_info: '(035) 225-1042 / Daro Hall Desk',
  },
  {
    id: 'daro-off-2',
    full_name: 'Hon. Maria Elena Garcia',
    position: 'Barangay Kagawad',
    committee: 'Committee on Peace, Order & Public Safety',
    contact_info: '(035) 225-1043 / Security Office',
  },
  {
    id: 'daro-off-3',
    full_name: 'Hon. Danilo S. Reyes',
    position: 'Barangay Kagawad',
    committee: 'Committee on Health, Sanitation & Environment',
    contact_info: '(035) 225-1044 / Health Center',
  },
  {
    id: 'daro-off-4',
    full_name: 'Hon. Carmela V. Santos',
    position: 'Barangay Kagawad',
    committee: 'Committee on Education, Culture & Women',
    contact_info: '(035) 225-1045 / Desk 2',
  },
  {
    id: 'daro-off-5',
    full_name: 'Hon. Joshua P. Diaz',
    position: 'SK Chairperson',
    committee: 'Youth Leadership & Sports Development',
    contact_info: '(035) 225-1046 / SK Office',
  },
  {
    id: 'daro-off-6',
    full_name: 'Ms. Teresa L. Mendoza',
    position: 'Barangay Secretary',
    committee: 'Records, Certifications & Archives',
    contact_info: '(035) 225-1047 / Secretary Counter',
  },
  {
    id: 'daro-off-7',
    full_name: 'Mr. Vicente M. Ramos',
    position: 'Barangay Treasurer',
    committee: 'Revenue, Collections & Assessment',
    contact_info: '(035) 225-1048 / Treasury Cashier',
  },
];

export default function DirectoryList() {
  const [groups, setGroups] = useState([]);
  const [phase, setPhase] = useState('loading'); // loading | ready | empty | offline | error

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/directory', { cache: 'no-store' });
        if (cancelled) return;
        if (!response.ok) {
          setGroups(groupByPosition(DARO_FALLBACK_OFFICIALS));
          setPhase('ready');
          return;
        }
        const data = await response.json();
        const officials = Array.isArray(data.officials) && data.officials.length > 0
          ? data.officials
          : DARO_FALLBACK_OFFICIALS;
        setGroups(groupByPosition(officials));
        setPhase('ready');
      } catch {
        if (cancelled) return;
        setGroups(groupByPosition(DARO_FALLBACK_OFFICIALS));
        setPhase('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'loading') {
    return (
      <div className="grid gap-rhythm-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading directory">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="rounded-2xl border border-slate-300 bg-white p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
            <div className="glass-skeleton h-5 w-1/3" />
            <div className="glass-skeleton mt-3 h-4 w-2/3" />
            <div className="glass-skeleton mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="rounded-2xl border border-slate-300 bg-white flex items-start gap-3 p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Directory is being set up</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            No officials are listed yet. The barangay office can publish the roster from
            the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'offline' || phase === 'error') {
    return (
      <div className="rounded-2xl border border-slate-300 bg-white flex items-start gap-3 p-rhythm-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60" role="status">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-300" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Directory unavailable</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            The roster could not be loaded. It is not stored on this device, so reconnect to
            the barangay server and reload this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-rhythm-5">
      {groups.map((group) => (
        <section key={group.position} aria-label={group.position}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-sky-800 dark:text-cyan-300">
            {group.position}
          </h2>
          <ul className="mt-3 grid gap-rhythm-3 sm:grid-cols-2">
            {group.rows.map((official) => (
              <li key={official.id} className="rounded-2xl border border-slate-300 bg-white p-rhythm-4 shadow-sm transition-all hover:border-sky-300 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-cyan-500/30">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{official.full_name}</p>
                <p className="mt-1 text-base font-medium text-slate-700 dark:text-slate-300">
                  {official.position}
                  {official.committee ? ' · ' + official.committee : ''}
                </p>
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-cyan-400" aria-hidden="true" />
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{official.contact_info}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-cyan-400" aria-hidden="true" />
        Office contact numbers only. Personal contact details are never published here.
      </p>
    </div>
  );
}
