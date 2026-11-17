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
          setPhase('error');
          return;
        }
        const data = await response.json();
        const officials = Array.isArray(data.officials) ? data.officials : [];
        if (officials.length === 0) {
          setGroups([]);
          setPhase('empty');
          return;
        }
        setGroups(groupByPosition(officials));
        setPhase('ready');
      } catch {
        if (cancelled) return;
        setGroups([]);
        setPhase('offline');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'loading') {
    return (
      <div className="grid gap-rhythm-3" aria-busy="true" aria-label="Loading directory">
        {[0, 1, 2].map((index) => (
          <div key={index} className="glass-lite p-rhythm-4">
            <div className="glass-skeleton h-5 w-1/4" />
            <div className="glass-skeleton mt-3 h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="glass-lite flex items-start gap-3 p-rhythm-4">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-slate-100">Directory is being set up</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            No officials are listed yet. The barangay office can publish the roster from
            the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'offline' || phase === 'error') {
    return (
      <div className="glass-lite flex items-start gap-3 p-rhythm-4" role="status">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-slate-100">Directory unavailable</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
            {group.position}
          </h2>
          <ul className="mt-3 grid gap-rhythm-3 sm:grid-cols-2">
            {group.rows.map((official) => (
              <li key={official.id} className="glass-lite p-rhythm-4">
                <p className="text-base font-semibold text-slate-50">{official.full_name}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {official.position}
                  {official.committee ? ' - ' + official.committee : ''}
                </p>
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-400">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
                  <span>{official.contact_info}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        Office contact numbers only. Personal contact details are never published here.
      </p>
    </div>
  );
}
