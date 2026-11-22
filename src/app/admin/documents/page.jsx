'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Plus,
  AlertCircle,
  Eye,
  X,
  CreditCard,
} from 'lucide-react';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail / Action modal
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Assisted Intake Modal
  const [showAssistedModal, setShowAssistedModal] = useState(false);
  const [assistedData, setAssistedData] = useState({
    resident_id: '',
    document_type: 'CLEARANCE',
    purpose: '',
    ctc_number: '',
  });
  const [assistedLoading, setAssistedLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load document queue');
      const data = await res.json();
      setDocuments(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleOpenDetail(docId) {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) throw new Error('Failed to fetch document details');
      const data = await res.json();
      setSelectedDoc(data);
      setRejectionReason('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateStatus(newStatus) {
    if (!selectedDoc) return;
    if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${selectedDoc.tracking_code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: newStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Could not update document status');
      }
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssistedSubmit(e) {
    e.preventDefault();
    setAssistedLoading(true);
    setError('');
    try {
      const res = await fetch('/api/documents/assisted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assistedData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to file assisted request');
      setShowAssistedModal(false);
      setAssistedData({ resident_id: '', document_type: 'CLEARANCE', purpose: '', ctc_number: '' });
      fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssistedLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            <span>Document Review Queue</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Review clearances, indigency applications, and process assisted desk intake.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAssistedModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-bold text-sm text-white shadow-lg shadow-cyan-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Assisted Walk-In Intake</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-base focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="PAYMENT_PENDING">Payment Pending</option>
          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
          <option value="RELEASED">Released</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-base focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Document Types</option>
          <option value="CLEARANCE">Barangay Clearance (₱50)</option>
          <option value="INDIGENCY">Certificate of Indigency (Free)</option>
        </select>
      </div>

      {/* Queue Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-base">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-400 text-sm uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Tracking Code</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Resident</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading queue items...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No documents matching current filters.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.tracking_code} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-700 dark:text-cyan-300">
                      {doc.tracking_code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {doc.document_type === 'CLEARANCE' ? 'Barangay Clearance' : 'Indigency Certificate'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{doc.masked_name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {Number(doc.fee_amount) > 0 ? `₱${Number(doc.fee_amount).toFixed(2)}` : 'FREE'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          doc.status === 'READY_FOR_PICKUP'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                            : doc.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
                            : doc.status === 'PAYMENT_PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                            : 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(doc.tracking_code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-transparent text-sm font-semibold transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                      </button>

                      {['READY_FOR_PICKUP', 'RELEASED'].includes(doc.status) && (
                        <Link
                          href={`/admin/documents/print/${doc.tracking_code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs text-cyan-300 font-medium transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Decision Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Review: {selectedDoc.tracking_code}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Encrypted fields decrypted server-side with audit logging.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Applicant: </span>
                  <span className="font-semibold text-white">{selectedDoc.masked_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Document Type: </span>
                  <span className="font-semibold text-cyan-300">{selectedDoc.document_type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Purpose: </span>
                  <span className="text-slate-200">{selectedDoc.purpose}</span>
                </div>
                {selectedDoc.ctc_number && (
                  <div>
                    <span className="text-slate-400">CTC / Cedula No.: </span>
                    <span className="font-mono text-amber-300">{selectedDoc.ctc_number}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Fee Amount: </span>
                  <span className="font-mono font-bold text-white">
                    ₱{Number(selectedDoc.fee_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedDoc.status !== 'RELEASED' && selectedDoc.status !== 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rejection Reason (if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete requirements, non-resident"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
              >
                Close
              </button>

              {selectedDoc.status === 'SUBMITTED' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition"
                >
                  Start Review
                </button>
              )}

              {selectedDoc.status === 'UNDER_REVIEW' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-semibold text-sm transition"
                  >
                    Reject
                  </button>

                  {Number(selectedDoc.fee_amount) > 0 ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('PAYMENT_PENDING')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
                    >
                      Require Payment (₱{Number(selectedDoc.fee_amount).toFixed(2)})
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('READY_FOR_PICKUP')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
                    >
                      Approve & Ready
                    </button>
                  )}
                </>
              )}

              {selectedDoc.status === 'PAYMENT_PENDING' && (
                <p className="text-xs text-amber-300/90 max-w-xs">
                  Waiting for the Treasurer to record payment. The document moves to
                  Ready for Pickup automatically after settlement.
                </p>
              )}

              {selectedDoc.status === 'READY_FOR_PICKUP' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('RELEASED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
                >
                  Confirm Released to Citizen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assisted Walk-in Modal */}
      {showAssistedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAssistedModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Assisted Walk-In Intake</h3>
            <p className="text-xs text-slate-400 mb-6">
              Physically verified resident intake conducted by authorized desk staff.
            </p>

            <form onSubmit={handleAssistedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resident ID (RES-YYYY-XXXX) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RES-2026-0001"
                  value={assistedData.resident_id}
                  onChange={(e) => setAssistedData({ ...assistedData, resident_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Type *
                </label>
                <select
                  value={assistedData.document_type}
                  onChange={(e) => setAssistedData({ ...assistedData, document_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                >
                  <option value="CLEARANCE">Barangay Clearance (₱50.00)</option>
                  <option value="INDIGENCY">Certificate of Indigency (Free)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purpose Statement *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. For employment application requirement at XYZ Corp."
                  value={assistedData.purpose}
                  onChange={(e) => setAssistedData({ ...assistedData, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>

              {assistedData.document_type === 'CLEARANCE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Community Tax Certificate (CTC / Cedula) No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CTC-2026-987654"
                    value={assistedData.ctc_number}
                    onChange={(e) => setAssistedData({ ...assistedData, ctc_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssistedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assistedLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-slate-950 text-sm font-bold hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
                >
                  {assistedLoading ? 'Submitting...' : 'File Document Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
