'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Radio,
  Plus,
  Sparkles,
  Volume2,
  Calendar,
  Pin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'URGENT', label: 'Urgent / Emergency' },
  { value: 'AYUDA', label: 'Ayuda / Relief' },
  { value: 'HEALTH', label: 'Health Mission' },
  { value: 'VETERINARY', label: 'Veterinary / Anti-Rabies' },
  { value: 'SCHOLARSHIP', label: 'Scholarship / Youth' },
];

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('URGENT');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [simplifiedSummary, setSimplifiedSummary] = useState('');
  const [audioScript, setAudioScript] = useState('');
  const [editingId, setEditingId] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcasts', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load broadcasts');
      const data = await res.json();
      setBroadcasts(data.broadcasts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  async function handleAiSimplify() {
    if (!content.trim() || content.length < 10) {
      alert('Please enter at least a sentence of broadcast content first.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, language: 'tl' }),
      });
      if (!res.ok) throw new Error('AI summarization failed');
      const data = await res.json();
      setSimplifiedSummary(data.simplified_summary || '');
      setAudioScript(data.audio_script || '');
    } catch (err) {
      alert(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function resetForm() {
    setEditingId('');
    setTitle('');
    setCategory('URGENT');
    setContent('');
    setIsPinned(false);
    setEndDate('');
    setSimplifiedSummary('');
    setAudioScript('');
  }

  async function handleEdit(broadcastId) {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/broadcasts/${encodeURIComponent(broadcastId)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.broadcast) throw new Error(data.message || 'Could not load this broadcast for editing.');

      const broadcast = data.broadcast;
      setEditingId(broadcast.id);
      setTitle(broadcast.title || '');
      setCategory(broadcast.category || 'URGENT');
      setContent(broadcast.content || '');
      setIsPinned(!!broadcast.is_pinned);
      setEndDate(broadcast.end_date ? new Date(broadcast.end_date).toISOString().slice(0, 10) : '');
      setSimplifiedSummary(broadcast.simplified_summary || '');
      setAudioScript(broadcast.audio_script || '');
      setSuccess('Broadcast loaded. Make your changes and save them.');
    } catch (err) {
      setError(err.message || 'Could not load this broadcast for editing.');
    }
  }

  async function handleDelete(broadcast) {
    if (!window.confirm(`Delete “${broadcast.title}”? This announcement will be removed from the public feed.`)) return;
    setDeletingId(broadcast.id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/broadcasts/${encodeURIComponent(broadcast.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not delete this broadcast.');
      if (editingId === broadcast.id) resetForm();
      setSuccess('Broadcast deleted.');
      await fetchBroadcasts();
    } catch (err) {
      setError(err.message || 'Could not delete this broadcast.');
    } finally {
      setDeletingId('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !endDate) {
      setError('Please provide title, content, and an expiration date.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(editingId ? `/api/broadcasts/${encodeURIComponent(editingId)}` : '/api/broadcasts', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content: content.trim(),
          is_pinned: isPinned,
          end_date: new Date(endDate).toISOString(),
          simplified_summary: simplifiedSummary.trim() || null,
          audio_script: audioScript.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish announcement');
      }

      setSuccess(editingId ? 'Broadcast updated successfully.' : 'Broadcast announcement published successfully.');
      resetForm();
      await fetchBroadcasts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Radio className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          <span>Community Broadcast Publisher</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Draft announcements, generate simplified citizen summaries, and create megaphone audio scripts.
        </p>
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

      {/* Grid: Publisher Form + Active Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Publisher Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>{editingId ? 'Edit Announcement' : 'Compose Announcement'}</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {editingId && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <span>Editing {editingId}</span>
                <button type="button" onClick={resetForm} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20">
                  <X className="h-4 w-4" /> Cancel edit
                </button>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Libreng Anti-Rabies Vaccination Caravan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-base focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Expiration / End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-base focus:outline-none focus:border-amber-500"
                >
                </input>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Announcement Narrative *
                </label>
                <button
                  type="button"
                  onClick={handleAiSimplify}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:border-amber-500/30 dark:text-amber-300 text-xs font-bold transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'Generating AI...' : 'AI Simplify & Megaphone'}</span>
                </button>
              </div>
              <textarea
                required
                rows="5"
                placeholder="Enter complete announcement details, dates, venue, requirements, and instructions for barangay residents..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* AI Generated Previews */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simplified Citizen Summary (Kiosk & Ticker Display)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Extractive plain-language summary for citizen kiosks..."
                  value={simplifiedSummary}
                  onChange={(e) => setSimplifiedSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-cyan-50/50 dark:bg-slate-950/40 border border-cyan-300 dark:border-cyan-500/20 text-slate-900 dark:text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Megaphone / Audio Broadcast Script (Barangay Patrol Speaker)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Audio script for patrol mobile megaphone..."
                  value={audioScript}
                  onChange={(e) => setAudioScript(e.target.value)}
                  className="w-full p-3 rounded-xl bg-purple-50/50 dark:bg-slate-950/40 border border-purple-300 dark:border-purple-500/20 text-slate-900 dark:text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Pin to top of public portal
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? (editingId ? 'Saving...' : 'Publishing...') : (editingId ? 'Save Changes' : 'Publish Broadcast')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Broadcast Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Broadcasts</span>
              <span className="text-xs font-mono text-slate-400">{broadcasts.length} listed</span>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading announcements...</div>
            ) : broadcasts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No community broadcasts yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 space-y-2 hover:border-slate-300 dark:hover:border-white/15 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                        {b.category}
                      </span>
                      {b.is_pinned && (
                        <span className="flex items-center gap-1 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                          <Pin className="w-3.5 h-3.5" /> Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{b.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {b.simplified_summary || 'Open this broadcast to review its full announcement.'}
                    </p>
                    <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {new Date(b.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(b.id)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        aria-label={`Edit broadcast ${b.title}`}
                      >
                        <Pencil className="h-4 w-4" /> Edit broadcast
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b)}
                        disabled={deletingId === b.id}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-800 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:opacity-60 dark:border-rose-400/30 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        aria-label={`Delete broadcast ${b.title}`}
                      >
                        <Trash2 className="h-4 w-4" /> {deletingId === b.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
