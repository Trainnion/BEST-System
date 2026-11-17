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

  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broadcasts?limit=50');
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
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content: content.trim(),
          is_pinned: isPinned,
          end_date: new Date(endDate).toISOString(),
          simplified_summary: simplifiedSummary.trim() || undefined,
          audio_script: audioScript.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish announcement');
      }

      setSuccess('Broadcast announcement published successfully.');
      setTitle('');
      setContent('');
      setSimplifiedSummary('');
      setAudioScript('');
      setIsPinned(false);
      setEndDate('');
      fetchBroadcasts();
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
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <Radio className="w-7 h-7 text-amber-400" />
          <span>Community Broadcast Publisher</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
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
        <div className="lg:col-span-7 p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <span>Compose Announcement</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Libreng Anti-Rabies Vaccination Caravan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Expiration / End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                >
                </input>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Full Announcement Narrative *
                </label>
                <button
                  type="button"
                  onClick={handleAiSimplify}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium transition disabled:opacity-50"
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
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* AI Generated Previews */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simplified Citizen Summary (Kiosk & Ticker Display)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Extractive plain-language summary for citizen kiosks..."
                  value={simplifiedSummary}
                  onChange={(e) => setSimplifiedSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/40 border border-cyan-500/20 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Megaphone / Audio Broadcast Script (Barangay Patrol Speaker)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Audio script for patrol mobile megaphone..."
                  value={audioScript}
                  onChange={(e) => setAudioScript(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/40 border border-purple-500/20 text-slate-200 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-white/20 text-amber-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  Pin to top of public portal
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Publishing...' : 'Publish Broadcast'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Broadcast Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
              <span>Active Broadcasts</span>
              <span className="text-xs font-mono text-slate-400">{broadcasts.length} live</span>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading announcements...</div>
            ) : broadcasts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No active community broadcasts.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 hover:border-white/15 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {b.category}
                      </span>
                      {b.is_pinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white">{b.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {b.simplified_summary || b.content}
                    </p>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {new Date(b.end_date).toLocaleDateString()}</span>
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
