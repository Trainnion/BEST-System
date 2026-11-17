'use client';

import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  WifiOff,
  Zap,
} from 'lucide-react';

import useInView from '@/lib/hooks/useInView';
import StatusBadge from './StatusBadge';

/**
 * BEST Municipal Runtime Console (plan Sec. 8.2 + ai-runtime Reference).
 *
 * Sovereign, air-gapped telemetry console with 3 interactive inspection tabs:
 * 1. Queue Telemetry: Live document state machine simulation (SUBMITTED -> UNDER_REVIEW -> READY_FOR_PICKUP).
 * 2. Cryptographic Shield: AES-256-GCM encrypted envelope preview and zero-IP anonymizer audit (ZK-LOG-01).
 * 3. Network Appliance: Air-gapped LAN diagnostics (127.0.0.1:5432, zero CDN leaks, 100% self-hosted).
 */

const TABS = [
  { id: 'queue', label: 'Civic Queue', icon: Activity },
  { id: 'crypto', label: 'Crypto Shield', icon: ShieldCheck },
  { id: 'network', label: 'Sovereign Node', icon: Server },
];

const STAGES = [
  {
    status: 'SUBMITTED',
    title: 'Application Intake',
    desc: 'Citizen filed via LAN portal with masked identity J*** D**.',
    time: '00:00:12',
  },
  {
    status: 'UNDER_REVIEW',
    title: 'Staff Verification',
    desc: 'Barangay records officer validated residency & CTC.',
    time: '00:03:45',
  },
  {
    status: 'READY_FOR_PICKUP',
    title: 'Ready for Release',
    desc: 'Signed by Punong Barangay with security QR hash.',
    time: '00:07:20',
  },
];

export default function RuntimeConsole() {
  const [activeTab, setActiveTab] = useState('queue');
  const [currentStageIdx, setCurrentStageIdx] = useState(1);
  const [showEncryptedRaw, setShowEncryptedRaw] = useState(true);

  const [ref] = useInView({
    threshold: 0.2,
    reveal: false,
    pauseOffscreen: true,
  });

  const currentStage = STAGES[currentStageIdx];

  return (
    <div
      ref={ref}
      className="hero-ticket glass rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 shadow-xl sm:p-5 transition-all"
    >
      {/* Console Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <Terminal size={15} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-slate-900 uppercase dark:text-white">
              Municipal Runtime Console
            </h2>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
              NODE: BEST-SAN-GABRIEL-01 · AIR-GAPPED
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div
          role="tablist"
          aria-label="Console inspection modes"
          className="flex rounded-full border border-[var(--glass-border)] bg-slate-200/50 p-1 dark:bg-white/[0.04]"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`tap-target flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-cyan-500/20 dark:text-cyan-200 dark:shadow-none'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={12} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Civic Queue Telemetry */}
      {activeTab === 'queue' && (
        <div
          id="panel-queue"
          role="tabpanel"
          aria-labelledby="tab-queue"
          className="mt-4 space-y-4"
        >
          {/* Active Ticket Banner */}
          <div className="rounded-xl border border-[var(--glass-border)] bg-slate-100/60 p-3 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500 dark:text-slate-400">TRACKING ID</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-300">CLR-2026-08492</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Citizen</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">J*** D** (Masked)</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Service</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">Barangay Clearance</span>
            </div>
          </div>

          {/* Interactive Stage Pipeline */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase dark:text-slate-400">
              <span>Lifecycle Pipeline</span>
              <span className="text-cyan-600 dark:text-cyan-400">Click stage to simulate</span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {STAGES.map((s, idx) => {
                const isCurrent = idx === currentStageIdx;
                const isPast = idx < currentStageIdx;
                return (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => setCurrentStageIdx(idx)}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      isCurrent
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-200'
                        : isPast
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                        : 'border-[var(--glass-border)] bg-transparent text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px]">0{idx + 1}</span>
                      {isPast ? (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      ) : isCurrent ? (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                        </span>
                      ) : (
                        <Clock size={12} className="text-slate-400" />
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10px] font-bold tracking-tight truncate">
                      {s.status}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Details */}
          <div className="rounded-xl border border-[var(--glass-border)] bg-slate-100/40 p-3 text-xs dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentStage.title}
              </span>
              <StatusBadge status={currentStage.status} />
            </div>
            <p className="mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentStage.desc}
            </p>
            <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400 border-t border-[var(--glass-border)] pt-2">
              <span>LATENCY: 1.2ms</span>
              <span>SIGNATURE: VERIFIED (ED25519)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cryptographic Shield Inspector */}
      {activeTab === 'crypto' && (
        <div
          id="panel-crypto"
          role="tabpanel"
          aria-labelledby="tab-crypto"
          className="mt-4 space-y-3 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Lock size={13} />
              <span className="font-bold">AES-256-GCM FIELD CIPHER</span>
            </div>
            <button
              type="button"
              onClick={() => setShowEncryptedRaw((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-cyan-600 hover:underline dark:text-cyan-400"
            >
              {showEncryptedRaw ? <EyeOff size={11} /> : <Eye size={11} />}
              <span>{showEncryptedRaw ? 'Show Decrypted' : 'Show Raw Cipher'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-slate-900 p-3 text-[11px] text-slate-200">
            {showEncryptedRaw ? (
              <div className="space-y-1">
                <p className="text-amber-400"># Encrypted at rest (ENC-01 compliant)</p>
                <p className="text-slate-400">cipher_version: &quot;v1&quot;</p>
                <p className="text-slate-400">iv: &quot;9f4d1e028ab776c5&quot;</p>
                <p className="text-emerald-400 break-all">
                  narrative: &quot;v1.0a8f7b92c4e138a09f87c538e1f0e21a4d...&quot;
                </p>
                <p className="text-slate-400">tag: &quot;4a77bc9024f812&quot;</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-cyan-400"># Authorized Server Decryption</p>
                <p className="text-slate-300">purpose: &quot;Local Employment (First-Time Jobseeker)&quot;</p>
                <p className="text-slate-300">statutory_fee: &quot;₱0.00 (R.A. 11261 Waived)&quot;</p>
                <p className="text-slate-300">resident_status: &quot;VERIFIED_PERMANENT&quot;</p>
                <p className="text-emerald-400">ip_logging: &quot;DISABLED (ZK-LOG-01)&quot;</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[10px] text-emerald-800 dark:text-emerald-300">
            <span className="font-bold">ZK-LOG-01 AUDIT:</span> Blotter & Tracking endpoints scrub Remote-IP, User-Agent, and Cookies before disk commit.
          </div>
        </div>
      )}

      {/* Tab 3: Air-Gapped Network Appliance */}
      {activeTab === 'network' && (
        <div
          id="panel-network"
          role="tabpanel"
          aria-labelledby="tab-network"
          className="mt-4 space-y-3 font-mono text-xs"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-slate-100/50 p-2.5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-slate-700 dark:text-slate-300">Local Postgres Cluster</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                127.0.0.1:5432
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-slate-100/50 p-2.5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <WifiOff size={14} className="text-amber-600 dark:text-amber-400" />
                <span className="text-slate-700 dark:text-slate-300">External Origin Dependency</span>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                0 (OFFLINE-01)
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-slate-100/50 p-2.5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-700 dark:text-slate-300">Service Worker Offline Cache</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                ENABLED (PWA)
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-slate-100/50 p-2.5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-slate-700 dark:text-slate-300">Warm Spare Heartbeat</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Every 15 min
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-[10px] text-cyan-800 dark:text-cyan-300">
            Unplugged municipal appliance: fully operable during typhoons and grid disconnections.
          </div>
        </div>
      )}

      {/* Console Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-2.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Cpu size={12} className="text-cyan-600 dark:text-cyan-400" />
          CIVIC-RUNTIME: RUNNING
        </span>
        <span>R.A. 7160 / 10173</span>
      </div>
    </div>
  );
}
