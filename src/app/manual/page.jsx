'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Shield,
  Users,
  Copy,
  Check,
  Printer,
  Search,
  ExternalLink,
  Lock,
  CreditCard,
  Radio,
  FileText,
  AlertTriangle,
  LifeBuoy,
  Key,
} from 'lucide-react';

const ADMIN_ACCOUNTS = [
  {
    role: 'ADMIN',
    title: 'IT Administrator / Systems Admin',
    username: 'admin',
    password: 'AdminSecure2026!',
    scope: 'System telemetry, disaster recovery, security auditing, database backups, audit log inspection, and deep health monitoring.',
    permissions: ['Manage Users', 'View Audit Logs', 'Deep Telemetry (/api/health/deep)', 'All Review Queues', 'Restore Drills'],
    restrictions: ['Cannot view citizen personal Digital ID cards (privacy isolation)', 'Cannot bypass Treasurer income screenings'],
    loginPath: '/admin/login',
  },
  {
    role: 'STAFF',
    title: 'Administrative Frontline Desk Staff',
    username: 'staff',
    password: 'StaffDesk2026!',
    scope: 'Document queue review, assisted walk-in intake, blotter investigation with decrypted narrative views, issuing 7-day activation slips, and welfare broadcasts.',
    permissions: ['Approve/Reject Clearances & Indigency', 'Issue 7-Day Activation Slips', 'Walk-in Assisted Intake', 'Inspect Decrypted Blotter', 'Publish Broadcasts'],
    restrictions: ['Cannot collect treasury cash or issue Official Receipts', 'Cannot modify system users or deep health config'],
    loginPath: '/admin/login',
  },
  {
    role: 'TREASURER',
    title: 'Barangay Treasurer & Cashier',
    username: 'treasurer',
    password: 'TreasurerPay2026!',
    scope: 'Municipal revenue collection, cashier operations, issuing sequential Official Receipts (OR), and mandatory in-person business tax screening.',
    permissions: ['Collect ₱50 Clearance Fees', 'Issue Official Receipts (OR-2026-XXXX)', 'Business Gross Revenue Assessment', 'Move Status to READY_FOR_PICKUP'],
    restrictions: ['Cannot approve initial clearance applications', 'Cannot inspect blotter records', 'Cannot modify user accounts'],
    loginPath: '/admin/login',
  },
  {
    role: 'OFFICIAL',
    title: 'Punong Barangay / Kagawad',
    username: 'official',
    password: 'OfficialLead2026!',
    scope: 'Executive barangay announcements, leadership directory management, and attested certificate signatory.',
    permissions: ['Publish Emergency Broadcasts', 'Manage Leadership Directory (/admin/directory)', 'Attested Signatory on Clearances'],
    restrictions: ['Cannot handle treasury cash', 'Cannot perform database administration'],
    loginPath: '/admin/login',
  },
];

const CITIZEN_ACCOUNTS = [
  {
    id: 'RES-2026-0001',
    name: 'Demo Maria Clara Santos',
    birthDate: '1990-03-12',
    password: 'ResidentPass2026!',
    status: 'Activated Citizen • Active Voter',
    card: 'CARD-2026-0001 (Active Digital ID)',
    address: '1 Demo Street, Purok 1',
    useCase: 'Instant self-service Clearance and Indigency filing, viewing Digital ID Card.',
  },
  {
    id: 'RES-2026-0002',
    name: 'Demo Juan Ramon Dela Cruz',
    birthDate: '1985-07-04',
    password: 'ResidentPass2026!',
    status: 'Activated Citizen • Active Voter',
    card: 'CARD-2026-0002 (Active Digital ID)',
    address: '2 Demo Street, Purok 2',
    useCase: 'Fee-exempt Indigency application (R.A. 11261 First-Time Jobseeker), eGovPH Digital ID inspection.',
  },
  {
    id: 'RES-2026-0003',
    name: 'Demo Ana Reyes',
    birthDate: '1998-11-23',
    password: 'ResidentPass2026!',
    status: 'Activated Citizen • Micro-Enterprise Owner',
    card: 'Registered Business Applicant (BIZ-2026-0001)',
    address: '3 Demo Street, Purok 3',
    useCase: 'Scheduling mandatory in-person business permit screening pursuant to R.A. 7160 Sec. 152.',
  },
  {
    id: 'RES-2026-0004',
    name: 'Demo Pedro Mendoza',
    birthDate: '1972-02-09',
    activationCode: 'DEMO7ACT04',
    status: 'Pending Activation (7-Day Slip Issued)',
    card: 'Walk-In Resident Candidate',
    address: '4 Demo Street, Purok 4',
    useCase: 'Demonstrating the first-time activation flow at /resident/activate with 7-day Crockford slip.',
  },
  {
    id: 'RES-2026-0005',
    name: 'Demo Liza Garcia',
    birthDate: '2001-06-30',
    password: 'ResidentPass2026!',
    status: 'Activated Citizen • Senior / Accessibility Focus',
    card: 'Resident ID Cardholder',
    address: '5 Demo Street, Purok 5',
    useCase: 'Accessing municipal services with high-contrast accessibility mode on public lobby kiosks.',
  },
  {
    id: 'ANONYMOUS_PUBLIC',
    name: 'Anonymous Community Member',
    status: 'Public / Kiosk Visitor (No Login)',
    card: 'Unauthenticated Public Persona',
    address: 'Anywhere on Barangay LAN',
    useCase: 'Filing anonymous blotter reports (Proof-of-Work), querying masked document tracking, asking AI Kaagapay.',
  },
];

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  }

  const filteredAdmin = ADMIN_ACCOUNTS.filter(
    (a) =>
      a.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.scope.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredCitizen = CITIZEN_ACCOUNTS.filter(
    (c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.useCase.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-[var(--text-0)] font-sans pb-16 transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-5 h-5 text-white dark:text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                BEST System Operations & User Manual
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Barangay E-Services System Terminal • V5 Field Encryption Specification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-[var(--glass-border)] transition dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
            >
              <Printer className="w-4 h-4" />
              <span>Print Manual</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 transition dark:bg-cyan-400 dark:text-slate-950"
            >
              <span>Back to Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-[var(--glass-border)] max-w-md dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold transition ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Administrative & Staff Manual</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold transition ${
                activeTab === 'citizen'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Citizen & Resident Guide</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts or workflows..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[var(--glass-border)] text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-500 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400"
            />
          </div>
        </div>

        {/* TAB 1: ADMINISTRATIVE MANUAL */}
        {activeTab === 'admin' && (
          <div className="space-y-10">
            {/* Accounts Directory */}
            <section className="space-y-4">
              <div className="border-b border-[var(--glass-border)] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span>Administrative Accounts & Role Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    All administrative staff log in through <code className="text-cyan-700 dark:text-cyan-300">/admin/login</code>.
                    Sessions expire after 15 minutes of server idle time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAdmin.map((acc) => (
                  <div
                    key={acc.role}
                    className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                          Role: {acc.role}
                        </span>
                        <Link
                          href={acc.loginPath}
                          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition"
                        >
                          <span>Open Login</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{acc.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{acc.scope}</p>

                      {/* Credentials Box */}
                      <div className="my-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-[var(--glass-border)] font-mono text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Username: </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-white font-bold">{acc.username}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.username, `${acc.role}-user`)}
                              className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition"
                              title="Copy username"
                            >
                              {copiedKey === `${acc.role}-user` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Password: </span>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-700 dark:text-cyan-300 font-bold">{acc.password}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.password, `${acc.role}-pass`)}
                              className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition"
                              title="Copy password"
                            >
                              {copiedKey === `${acc.role}-pass` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Permissions List */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Permitted Modules: </span>
                          <span className="text-slate-700 dark:text-slate-300">{acc.permissions.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-rose-700 dark:text-rose-400">Statutory Restrictions: </span>
                          <span className="text-slate-500 dark:text-slate-400">{acc.restrictions.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step-by-Step Staff Workflows */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Primary Administrative Workflows</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                    <span>1. Processing Document Clearance Requests</span>
                  </h3>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Document Queue</strong> (<code className="text-cyan-700 dark:text-cyan-400">/admin/documents</code>).</li>
                    <li>Click <strong>Review</strong> on any pending application. Decryption is audited automatically.</li>
                    <li>Verify citizen's purpose and CTC Cedula number.</li>
                    <li>If Clearance (₱50), click <strong>Require Payment</strong>. Moves to <code>PAYMENT_PENDING</code>.</li>
                    <li>If Indigency (Free), click <strong>Approve & Ready</strong>. Moves to <code>READY_FOR_PICKUP</code>.</li>
                    <li>Once paid and printed, click <strong>Confirm Released to Citizen</strong>.</li>
                  </ol>
                </div>

                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <span>2. Anonymous Blotter Investigation</span>
                  </h3>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Anonymous Blotter</strong> (<code className="text-rose-700 dark:text-rose-400">/admin/blotter</code>).</li>
                    <li>Click <strong>Inspect & Update</strong>. Sensitive narrative decrypts server-side with audit logging.</li>
                    <li>Set status to <code>ACTION_TAKEN</code>. Record tanod unit dispatch in <strong>Action Taken</strong>.</li>
                    <li>Enter a public advisory note (visible to citizen) and confidential internal notes (server-encrypted).</li>
                    <li>Once settled, mark status as <code>CLOSED</code>.</li>
                  </ol>
                </div>

                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <span>3. Treasury Fee Settlement & Official Receipts</span>
                  </h3>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Treasurer opens <strong>Treasury & ORs</strong> (<code className="text-amber-700 dark:text-amber-400">/admin/treasury</code>).</li>
                    <li>Search applicant by Tracking Code (<code>CLR-2026-XXXX</code>).</li>
                    <li>Collect statutory ₱50.00 fee (Cash or Mock Payment).</li>
                    <li>Input the sequential Official Receipt (OR) Number (e.g. <code>OR-2026-0001</code>).</li>
                    <li>Click <strong>Record Payment & Issue OR</strong>. Request moves to <code>READY_FOR_PICKUP</code>.</li>
                  </ol>
                </div>

                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <span>4. Issuing Resident 7-Day Activation Slips</span>
                  </h3>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Residents Directory</strong> (<code className="text-indigo-700 dark:text-indigo-400">/admin/residents</code>).</li>
                    <li>Search applicant by Name or Resident ID (<code>RES-2026-0004</code>).</li>
                    <li>Click <strong>Issue Slip</strong>. A 10-char Crockford base32 code is generated.</li>
                    <li>Click <strong>Print Slip</strong> or write code on physical card for citizen.</li>
                    <li>Resident activates account at <code>/resident/activate</code> within 7 days.</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Disaster Recovery & System Operations */}
            <section className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Disaster Recovery & Ops Reference (Plan Sec. 11)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-[var(--glass-border)] space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white">Automated Backups</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Runs hourly via <code>best_backup</code> container. AES/age encrypted with retention of 48 hourly,
                    14 daily, 8 weekly, and 12 monthly dumps.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-[var(--glass-border)] space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white">Warm Spare Failover</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Run <code>sh ops/scripts/promote-spare.sh</code> on the backup PC. Repoint router DNS for{' '}
                    <code>best.lan</code> to the spare IP. RTO &le; 60 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-[var(--glass-border)] space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white">Deep Health Telemetry</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Admin probe endpoint at <code>/api/health/deep</code> reports database latency, disk volume
                    percentage, certificate age, and monthly uptime.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: CITIZEN & RESIDENT GUIDE */}
        {activeTab === 'citizen' && (
          <div className="space-y-10">
            {/* Citizen Personas & Seeded Accounts */}
            <section className="space-y-4">
              <div className="border-b border-[var(--glass-border)] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span>Citizen Accounts & Resident Directory</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Residents access self-service features via <code className="text-cyan-700 dark:text-cyan-300">/resident/login</code>{' '}
                    or activate using <code className="text-cyan-700 dark:text-cyan-300">/resident/activate</code>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCitizen.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl flex flex-col justify-between space-y-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">{c.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-[var(--glass-border)] text-slate-600 dark:text-slate-300">
                          {c.card}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.name}</h3>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">{c.status}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Address: {c.address}</div>

                      {/* Credentials */}
                      <div className="my-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-[var(--glass-border)] text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Birth Date: </span>
                          <span className="text-slate-700 dark:text-slate-300">{c.birthDate}</span>
                        </div>
                        {c.password && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Password: </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-700 dark:text-cyan-300 font-bold">{c.password}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.password, `${c.id}-pass`)}
                                className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition"
                              >
                                {copiedKey === `${c.id}-pass` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {c.activationCode && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Activation Code: </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-700 dark:text-amber-400 font-bold">{c.activationCode}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.activationCode, `${c.id}-code`)}
                                className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition"
                              >
                                {copiedKey === `${c.id}-code` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.useCase}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Citizen Service Guides */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                <LifeBuoy className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Citizen Step-by-Step Service Tutorials</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-cyan-700 dark:text-cyan-300">
                    1. First-Time Account Activation (/resident/activate)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Activate your 7-day desk slip to begin requesting certifications from your phone:
                  </p>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Go to <code>/resident/activate</code> on your phone or kiosk.</li>
                    <li>Enter your <strong>Resident Number</strong> (e.g. <code>RES-2026-0004</code>).</li>
                    <li>Enter the 10-character <strong>Activation Code</strong> from your slip (e.g. <code>DEMO7ACT04</code>).</li>
                    <li>Enter your <strong>Birth Date</strong> (e.g. <code>1960-05-18</code>).</li>
                    <li>Set a private password of at least 10 characters.</li>
                    <li>Click <strong>Activate Account</strong> to sign in immediately.</li>
                  </ol>
                </div>

                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                    2. Applying for Clearance or Free Indigency
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Submit document requests online without standing in queue:
                  </p>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Sign in at <code>/resident/login</code>.</li>
                    <li>Select <strong>Barangay Clearance</strong> (₱50 fee) or <strong>Certificate of Indigency</strong> (Free).</li>
                    <li>Type your statement of purpose and optional Cedula (CTC) number.</li>
                    <li>Click <strong>Submit Request</strong>. Save your tracking code (e.g. <code>CLR-2026-DEMO0001</code>).</li>
                    <li>Check progress anytime at <code>/track</code>. Your name is always privacy-masked as <code>J*** D**</code>.</li>
                  </ol>
                </div>

                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-rose-700 dark:text-rose-300">
                    3. Filing an Anonymous Incident Blotter (/blotter)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Report community concerns safely with zero identity tracking:
                  </p>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <code>/blotter</code>. No login or registration required.</li>
                    <li>Choose category (Noise, Dispute, Sanitation, Animal Hazard) and Purok.</li>
                    <li>Describe the incident. The system automatically scrubs personal names and phones.</li>
                    <li>Solve the lightweight 1-second proof-of-work verification.</li>
                    <li>Click <strong>Submit Anonymous Report</strong> and save your tracking code (<code>BLT-XXXX-XX</code>).</li>
                  </ol>
                </div>

                <div className="p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] space-y-3 shadow-sm">
                  <h3 className="font-bold text-base text-purple-700 dark:text-purple-300">
                    4. Digital Barangay ID & Kaagapay Civic AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Access digital credentials and 24/7 civic inquiry concierge:
                  </p>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>View your official view-only Digital ID Card at <code>/id-card</code>.</li>
                    <li>Card displays offline vector QR code and Code 128 barcode matching eGovPH standards.</li>
                    <li>Ask Kaagapay questions at <code>/services/kaagapay</code> in Tagalog, Cebuano, or English.</li>
                    <li>Get instant checklists for business clearances, health center visits, and office hours.</li>
                  </ol>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
