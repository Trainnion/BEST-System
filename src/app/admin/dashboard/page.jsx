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
  ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    documentsCount: 0,
    blotterCount: 0,
    residentsCount: 0,
    broadcastsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [docsRes, blotterRes, resRes, bcastRes] = await Promise.all([
          fetch('/api/documents?status=UNDER_REVIEW&limit=1').catch(() => null),
          fetch('/api/admin/blotter?status=FILED&limit=1').catch(() => null),
          fetch('/api/admin/residents?size=1').catch(() => null),
          fetch('/api/broadcasts?limit=1').catch(() => null),
        ]);

        const [docsData, blotterData, resData, bcastData] = await Promise.all([
          docsRes?.ok ? docsRes.json() : { total: 0 },
          blotterRes?.ok ? blotterRes.json() : { total: 0 },
          resRes?.ok ? resRes.json() : { total: 0 },
          bcastRes?.ok ? bcastRes.json() : { broadcasts: [] },
        ]);

        if (active) {
          setStats({
            documentsCount: docsData.total || 0,
            blotterCount: blotterData.total || 0,
            residentsCount: resData.total || 0,
            broadcastsCount: bcastData.broadcasts?.length || 0,
          });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Barangay Operations Overview</h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Real-time queue monitoring, intake workflows, and system telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/documents"
          className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-cyan-500 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 transition-all dark:hover:border-cyan-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : stats.documentsCount}
          </div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">Pending Document Reviews</div>
        </Link>

        <Link
          href="/admin/blotter"
          className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-rose-500 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 transition-all dark:hover:border-rose-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : stats.blotterCount}
          </div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">Open Blotter Reports</div>
        </Link>

        <Link
          href="/admin/residents"
          className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 transition-all dark:hover:border-indigo-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : stats.residentsCount}
          </div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">Directory Residents</div>
        </Link>

        <Link
          href="/admin/treasury"
          className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-500 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 transition-all dark:hover:border-amber-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Treasury</div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">Cashier & Fee Settlement</div>
        </Link>
      </div>

      {/* Quick Action Station */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <span>Quick Actions & Desk Workflows</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/documents"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 dark:hover:border-white/20 transition text-base font-semibold text-slate-800 dark:text-slate-200"
          >
            <PlusCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Process Documents</span>
          </Link>
          <Link
            href="/admin/residents"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 dark:hover:border-white/20 transition text-base font-semibold text-slate-800 dark:text-slate-200"
          >
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Activation Slips</span>
          </Link>
          <Link
            href="/admin/broadcasts"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 dark:hover:border-white/20 transition text-base font-semibold text-slate-800 dark:text-slate-200"
          >
            <Radio className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>New Announcement</span>
          </Link>
          <Link
            href="/admin/treasury"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 dark:hover:border-white/20 transition text-base font-semibold text-slate-800 dark:text-slate-200"
          >
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Issue Official Receipt</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
