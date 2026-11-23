'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Search,
  Key,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function AdminResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [purok, setPurok] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Slip modal state
  const [activeSlip, setActiveSlip] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Assisted Intake Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResident, setNewResident] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    birth_date: '',
    gender: 'FEMALE',
    civil_status: 'SINGLE',
    purok: 'Purok 1',
    street_address: '',
    contact_number: '',
    is_registered_voter: true,
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (purok) params.set('purok', purok);
      params.set('page', String(page));
      params.set('size', '15');

      const res = await fetch(`/api/admin/residents?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load residents');
      }
      const data = await res.json();
      setResidents(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Error loading residents');
    } finally {
      setLoading(false);
    }
  }, [search, purok, page]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  async function handleIssueSlip(residentId) {
    setSlipLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ISSUE_ACTIVATION',
          resident_id: residentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not issue activation slip');
      }
      setActiveSlip(data);
      setCopied(false);
      fetchResidents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSlipLoading(false);
    }
  }

  async function handleCreateResident(e) {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_RESIDENT',
          ...newResident,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create resident');
      }
      setShowCreateModal(false);
      fetchResidents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  function handleCopyCode() {
    if (!activeSlip?.activation_code) return;
    navigator.clipboard.writeText(activeSlip.activation_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Resident Directory & Activation</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Issue 7-day one-time activation slips and register verified walk-in residents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-sm text-white shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Resident</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Resident ID (RES-...), name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="w-full md:w-56">
          <input
            type="text"
            value={purok}
            onChange={(e) => {
              setPurok(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by Purok (e.g. Purok 2)"
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Residents Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-base">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-400 text-sm uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Resident ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Purok</th>
                <th className="py-3.5 px-4">Birth Date</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading resident records...
                  </td>
                </tr>
              ) : residents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No matching residents found in directory.
                  </td>
                </tr>
              ) : (
                residents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-300">{r.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {r.last_name}, {r.first_name} {r.middle_name ? `${r.middle_name[0]}.` : ''}{' '}
                      {r.suffix || ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{r.purok}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm font-medium">
                      {new Date(r.birth_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.is_activated ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activated
                        </span>
                      ) : r.has_pending_activation ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Slip Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20">
                          Unactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleIssueSlip(r.id)}
                        disabled={slipLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:border-indigo-500/30 dark:text-indigo-300 text-sm font-bold transition disabled:opacity-50"
                      >
                        <Key className="w-4 h-4" />
                        <span>Issue Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {residents.length} of {total} residents
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Activation Slip Modal */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setActiveSlip(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white">Barangay Activation Slip</h3>
            <p className="text-xs text-slate-400 mt-1">
              Issue this code to <span className="font-semibold text-white">{activeSlip.resident_name}</span>.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-white/10">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                One-Time Activation Code (Valid 7 Days)
              </div>
              <div className="text-3xl font-mono font-black text-cyan-400 tracking-widest selection:bg-cyan-500 selection:text-black">
                {activeSlip.activation_code}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Resident ID: <span className="font-mono text-slate-300">{activeSlip.resident_id}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Resident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Assisted Resident Registration</h3>
            <p className="text-xs text-slate-400 mb-6">
              Register a verified barangay resident physically presenting in person.
            </p>

            <form onSubmit={handleCreateResident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newResident.first_name}
                    onChange={(e) => setNewResident({ ...newResident, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newResident.last_name}
                    onChange={(e) => setNewResident({ ...newResident, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={newResident.middle_name}
                    onChange={(e) => setNewResident({ ...newResident, middle_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Suffix (Jr, Sr, III)</label>
                  <input
                    type="text"
                    value={newResident.suffix}
                    onChange={(e) => setNewResident({ ...newResident, suffix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Birth Date *</label>
                  <input
                    type="date"
                    required
                    value={newResident.birth_date}
                    onChange={(e) => setNewResident({ ...newResident, birth_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
                  <select
                    value={newResident.gender}
                    onChange={(e) => setNewResident({ ...newResident, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Civil Status</label>
                  <select
                    value={newResident.civil_status}
                    onChange={(e) => setNewResident({ ...newResident, civil_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="WIDOWED">Widowed</option>
                    <option value="SEPARATED">Separated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Purok *</label>
                  <input
                    type="text"
                    required
                    value={newResident.purok}
                    onChange={(e) => setNewResident({ ...newResident, purok: e.target.value })}
                    placeholder="e.g. Purok 3"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={newResident.street_address}
                    onChange={(e) => setNewResident({ ...newResident, street_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  {createLoading ? 'Saving...' : 'Register Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
