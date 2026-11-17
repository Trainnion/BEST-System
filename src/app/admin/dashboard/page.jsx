'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldAlert,
  CreditCard,
  Users,
  Activity,
  PlusCircle,
  Radio,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    documentsCount: 0,
    blotterCount: 0,
    residentsCount: 0,
    broadcastsCount: 0,
  });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [docsRes, blotterRes, resRes, bcastRes, healthRes] = await Promise.all([
          fetch('/api/documents?status=UNDER_REVIEW&limit=1').catch(() => null),
          fetch('/api/admin/blotter?status=FILED&limit=1').catch(() => null),
          fetch('/api/admin/residents?size=1').catch(() => null),
          fetch('/api/broadcasts?limit=1').catch(() => null),
          fetch('/api/health').catch(() => null),
        ]);

        const [docsData, blotterData, resData, bcastData, healthData] = await Promise.all([
          docsRes?.ok ? docsRes.json() : { total: 0 },
          blotterRes?.ok ? blotterRes.json() : { total: 0 },
          resRes?.ok ? resRes.json() : { total: 0 },
          bcastRes?.ok ? bcastRes.json() : { broadcasts: [] },
          healthRes?.ok ? healthRes.json() : null,
        ]);

        if (active) {
          setStats({
            documentsCount: docsData.total || 0,
            blotterCount: blotterData.total || 0,
            residentsCount: resData.total || 0,
            broadcastsCount: bcastData.broadcasts?.length || 0,
          });
          setHealth(healthData);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Barangay Operations Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time queue monitoring, intake workflows, and system telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local Server Healthy</span>
          </div>
          {health?.ai_mode && (
            <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono uppercase">
              AI: {health.ai_mode}
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/documents"
          className="group p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/60 transition-all hover:border-cyan-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : stats.documentsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending Document Reviews</div>
        </Link>

        <Link
          href="/admin/blotter"
          className="group p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/60 transition-all hover:border-rose-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : stats.blotterCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Open Blotter Reports</div>
        </Link>

        <Link
          href="/admin/residents"
          className="group p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/60 transition-all hover:border-indigo-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : stats.residentsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Directory Residents</div>
        </Link>

        <Link
          href="/admin/treasury"
          className="group p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/60 transition-all hover:border-amber-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">Treasury</div>
          <div className="text-xs text-slate-400 mt-1">Cashier & Fee Settlement</div>
        </Link>
      </div>

      {/* Quick Action Station */}
      <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Quick Actions & Desk Workflows</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/documents"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-white/5 hover:border-white/20 transition text-sm font-medium text-slate-200"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Process Walk-In Documents</span>
          </Link>
          <Link
            href="/admin/residents"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-white/5 hover:border-white/20 transition text-sm font-medium text-slate-200"
          >
            <Users className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Issue Activation Slips</span>
          </Link>
          <Link
            href="/admin/broadcasts"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-white/5 hover:border-white/20 transition text-sm font-medium text-slate-200"
          >
            <Radio className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Publish Announcement</span>
          </Link>
          <Link
            href="/admin/treasury"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-white/5 hover:border-white/20 transition text-sm font-medium text-slate-200"
          >
            <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Issue Official Receipt (OR)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
