'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';

export default function AdminDirectoryPage() {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    committee: '',
    contact_info: '',
    display_order: 1,
    photo_url: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchOfficials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/directory');
      if (!res.ok) throw new Error('Failed to load officials directory');
      const data = await res.json();
      setOfficials(data.officials || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficials();
  }, [fetchOfficials]);

  function openCreateModal() {
    setIsEditing(false);
    setCurrentId('');
    setFormData({
      full_name: '',
      position: '',
      committee: '',
      contact_info: '',
      display_order: officials.length + 1,
      photo_url: '',
    });
    setShowModal(true);
  }

  function openEditModal(official) {
    setIsEditing(true);
    setCurrentId(official.id);
    setFormData({
      full_name: official.full_name,
      position: official.position,
      committee: official.committee,
      contact_info: official.contact_info,
      display_order: official.display_order || 1,
      photo_url: official.photo_url || '',
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = '/api/directory';
      const method = isEditing ? 'PATCH' : 'POST';
      const payload = isEditing ? { id: currentId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save official');

      setSuccess(isEditing ? 'Official updated successfully.' : 'New official added.');
      setShowModal(false);
      fetchOfficials();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this official from the active directory?')) return;
    try {
      const res = await fetch(`/api/directory?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to deactivate official');
      }
      setSuccess('Official removed from active roster.');
      fetchOfficials();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-emerald-400" />
            <span>Barangay Leadership Directory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the official leadership roster displayed to citizens.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm text-white shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Official</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Officials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            Loading leadership directory...
          </div>
        ) : officials.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            No active officials listed.
          </div>
        ) : (
          officials.map((official) => (
            <div
              key={official.id}
              className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-white/20 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Order #{official.display_order || 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(official)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(official.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{official.full_name}</h3>
                <div className="text-xs font-semibold text-emerald-400 mt-0.5">{official.position}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Committee: <span className="text-slate-300">{official.committee}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Contact: <span className="text-slate-300">{official.contact_info}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {isEditing ? 'Edit Official' : 'Add Barangay Official'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter official credentials and position for the public directory.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hon. Juan Dela Cruz"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Position *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Punong Barangay or Barangay Kagawad"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Committee / Assignment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Committee on Peace and Order"
                  value={formData.committee}
                  onChange={(e) => setFormData({ ...formData, committee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Info</label>
                  <input
                    type="text"
                    placeholder="e.g. Hall Tel: 123-4567"
                    value={formData.contact_info}
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Official'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
