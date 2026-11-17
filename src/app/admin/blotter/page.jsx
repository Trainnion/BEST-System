'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  Eye,
  X,
  FileEdit,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function AdminBlotterPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected report detail & action modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form inputs for status update
  const [actionTaken, setActionTaken] = useState('');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [nextStatus, setNextStatus] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (urgencyFilter) params.set('urgency', urgencyFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('size', '15');

      const res = await fetch(`/api/admin/blotter?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load blotter queue');
      const data = await res.json();
      setReports(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Error fetching blotter reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, search, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleOpenDetail(trackingCode) {
    setDetailLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/blotter/${trackingCode}`);
      if (!res.ok) throw new Error('Failed to retrieve decrypted blotter report');
      const data = await res.json();
      setSelectedReport(data);
      setActionTaken('');
      setPublicNotes('');
      setInternalNotes('');
      setNextStatus(
        data.status === 'FILED'
          ? 'UNDER_REVIEW'
          : data.status === 'UNDER_REVIEW'
          ? 'ACTION_TAKEN'
          : 'CLOSED',
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleUpdateBlotter(e) {
    e.preventDefault();
    if (!selectedReport) return;
    if (!actionTaken.trim()) {
      alert('Action taken summary is required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/blotter/${selectedReport.tracking_code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          action_taken: actionTaken.trim(),
          public_notes: publicNotes.trim() || undefined,
          internal_notes: internalNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || d.error || 'Failed to record blotter update');
      }

      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 text-rose-400" />
          <span>Anonymous Blotter Queue</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review community incident reports, update investigation status, and log actions taken.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search tracking code (BLOT-...) or zone"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400"
        >
          <option value="">All Statuses</option>
          <option value="FILED">Filed</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ACTION_TAKEN">Action Taken</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={urgencyFilter}
          onChange={(e) => {
            setUrgencyFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400"
        >
          <option value="">All Urgency Levels</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical (Immediate Dispatch)</option>
        </select>
      </div>

      {/* Blotter Queue Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Tracking Code</th>
                <th className="py-3.5 px-4">Incident Type</th>
                <th className="py-3.5 px-4">Zone / Purok</th>
                <th className="py-3.5 px-4">Urgency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date Filed</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading blotter reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No matching blotter reports found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.tracking_code} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-rose-300">
                      {report.tracking_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {report.incident_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{report.incident_zone}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          report.urgency === 'CRITICAL' || report.urgency === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                            : 'bg-slate-700/40 text-slate-300 border border-white/10'
                        }`}
                      >
                        {report.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          report.status === 'CLOSED'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : report.status === 'ACTION_TAKEN'
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : report.status === 'UNDER_REVIEW'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(report.tracking_code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Update</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decrypted Review & Update Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Blotter: {selectedReport.tracking_code}
                </h3>
                <div className="text-xs text-rose-300/80 font-mono">
                  AES-256-GCM Decrypted • Access Audited
                </div>
              </div>
            </div>

            {/* Decrypted Payload Card */}
            <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4 text-xs pb-3 border-b border-white/5">
                <div>
                  <span className="text-slate-400">Incident Type: </span>
                  <span className="font-semibold text-white">{selectedReport.incident_type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Zone / Purok: </span>
                  <span className="font-semibold text-white">{selectedReport.incident_zone}</span>
                </div>
                <div>
                  <span className="text-slate-400">Exact Incident Date: </span>
                  <span className="text-slate-300">{selectedReport.incident_date}</span>
                </div>
                <div>
                  <span className="text-slate-400">Exact Location: </span>
                  <span className="text-slate-300">{selectedReport.exact_location || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Confidential Citizen Narrative:
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedReport.narrative}
                </div>
              </div>
            </div>

            {/* Updates History */}
            {selectedReport.updates && selectedReport.updates.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Action History:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedReport.updates.map((u, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>Action: {u.action_taken}</span>
                        <span className="text-slate-500 font-mono">
                          {new Date(u.created_at).toLocaleString()}
                        </span>
                      </div>
                      {u.public_notes && (
                        <div className="text-slate-400 mt-1">Public: {u.public_notes}</div>
                      )}
                      {u.internal_notes && (
                        <div className="text-amber-300/80 mt-0.5">Internal: {u.internal_notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update Form */}
            {selectedReport.status !== 'CLOSED' && (
              <form onSubmit={handleUpdateBlotter} className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-cyan-400" />
                  <span>Record Blotter Update & Investigation Step</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Next Status *</label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                    >
                      {selectedReport.status === 'FILED' && (
                        <option value="UNDER_REVIEW">Under Review</option>
                      )}
                      <option value="ACTION_TAKEN">Action Taken (Tanod Dispatched)</option>
                      <option value="CLOSED">Closed (Resolved / Dismissed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Action Taken *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dispatched barangay tanod unit"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Public Note (Visible to citizen tracking with code)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Investigation ongoing. Mediation scheduled."
                    value={publicNotes}
                    onChange={(e) => setPublicNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confidential Internal Staff Notes (Server-encrypted, never shown to citizen)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Tanod Perez interviewed Purok Leader. No physical altercation reported."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{actionLoading ? 'Saving...' : 'Submit Update'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
