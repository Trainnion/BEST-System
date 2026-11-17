'use client';

/**
 * BEST - Kaagapay concierge chat shell (WP-09, plan Sec. 7.5 / route tree
 * Sec. 1.2). Thin client over POST /api/ai/chat; when the hall server is
 * unreachable (connectivity level L2) the SAME local engine from
 * src/lib/ai/chat.js answers in the browser, marked "Offline assistant".
 *
 * No external origins, no console output, works at 375 px. The disclaimer
 * below is binding: answers come from the local knowledge base, which is
 * sample copy pending team review - not legal advice.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { answerFromKnowledgeBase } from '@/lib/ai/chat.js';
import { scrubPII } from '@/lib/ai/scrub.js';

const MAX_MESSAGE_CHARS = 2000;

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'en', label: 'English' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ceb', label: 'Bisaya' },
];

const SAMPLE_QUESTIONS = [
  { label: 'Paano kumuha ng barangay clearance?', message: 'Paano po kumuha ng barangay clearance?' },
  { label: 'Certificate of Indigency', message: 'Ano po ang requirements para sa certificate of indigency?' },
  { label: 'Business clearance', message: 'How do I apply for a business clearance?' },
  { label: 'Blotter report', message: 'Paano po mag-file ng anonymous blotter report?' },
  { label: 'Digital ID', message: 'Paano po makita ang aking digital barangay ID?' },
  { label: 'Office hours', message: 'Anong oras bukas ang barangay hall?' },
];

/** Deep links for a recommended service (routes per the plan Sec. 1.2). */
const SERVICE_ROUTES = {
  'Barangay Clearance': '/services/request',
  'Certificate of Indigency': '/services/request',
  'Business Clearance': '/services/business-clearance',
  'Anonymous Blotter Report': '/blotter',
  'Digital Barangay ID (view-only)': '/id-card',
  'Office Hours': '/',
};

let messageUid = 0;
const nextUid = () => `msg-${++messageUid}`;

export default function KaagapayChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('auto');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const node = listRef.current;
    if (node && node.scrollTo) node.scrollTo({ top: node.scrollHeight });
  }, [messages]);

  const push = useCallback((message) => {
    setMessages((current) => [...current, message]);
  }, []);

  const send = useCallback(
    async (rawText) => {
      const text = String(rawText || '').trim().slice(0, MAX_MESSAGE_CHARS);
      if (!text || busy) return;

      setInput('');
      setBusy(true);
      push({ id: nextUid(), role: 'user', text });

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, language }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!response || !response.ok) throw new Error(`status ${response ? response.status : 'none'}`);
        const data = await response.json();
        push({
          id: nextUid(),
          role: 'assistant',
          text: String(data.reply || ''),
          checklist: Array.isArray(data.checklist) ? data.checklist : [],
          recommended_service: data.recommended_service || null,
          source: data.source === 'gemini' ? 'gemini' : 'local',
        });
      } catch {
        // L2: the same local engine answers in the browser (plan Sec. 7.1).
        // The message is scrubbed before the local matcher ever sees it, so
        // no personal detail is even kept in component state.
        const { text: safeText } = scrubPII(text);
        const local = answerFromKnowledgeBase(safeText, language);
        push({
          id: nextUid(),
          role: 'assistant',
          text: local.reply,
          checklist: local.checklist,
          recommended_service: local.recommended_service,
          source: 'local',
          offline: true,
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, language, push],
  );

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 pb-24 pt-8" style={{ minWidth: 0 }}>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kaagapay Concierge</h1>
        <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
          Civic questions in English, Tagalog or Bisaya. Answers come from a
          local knowledge base pending team review — not legal advice.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/80" aria-label="Kaagapay conversation">
        <div
          ref={listRef}
          className="max-h-[50vh] min-h-[220px] space-y-3 overflow-y-auto pr-1"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
              Ask a question below, or pick one of the sample questions.
            </p>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-sky-600 px-4 py-3 text-base font-semibold text-white shadow-sm dark:bg-cyan-500/20 dark:text-cyan-50'
                  : 'mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-100 px-4 py-3 text-base text-slate-900 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100'
              }
            >
              <p className="whitespace-pre-wrap break-words">{message.text}</p>

              {message.role === 'assistant' ? (
                <p className="mt-2">
                  <span className="inline-block rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:border-slate-500/40 dark:bg-slate-900/60 dark:text-slate-300">
                    {message.source === 'gemini' ? 'AI-enhanced' : 'Offline assistant'}
                    {message.offline ? ' · device' : ''}
                  </span>
                </p>
              ) : null}

              {message.role === 'assistant' && message.checklist && message.checklist.length > 0 ? (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-400">Requirements</p>
                  <ul className="mt-1 space-y-1">
                    {message.checklist.map((item, index) => (
                      <li key={`${message.id}-item-${index}`}>
                        <a
                          className="font-semibold text-sky-700 underline decoration-dotted underline-offset-2 hover:text-sky-900 dark:text-cyan-300 dark:hover:text-cyan-200"
                          href={
                            (message.recommended_service && SERVICE_ROUTES[message.recommended_service]) ||
                            '/services/request'
                          }
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
          {busy ? (
            <p className="mr-auto rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-base font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-400" role="status">
              Thinking…
            </p>
          ) : null}
        </div>

        <form
          className="mt-4 flex flex-col gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-400" htmlFor="kaagapay-language">
              Language
            </label>
            <select
              id="kaagapay-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-600/60 dark:bg-slate-900/80 dark:text-slate-200"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              id="kaagapay-message"
              name="message"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={MAX_MESSAGE_CHARS}
              autoComplete="off"
              placeholder="Ask about clearances, fees, hours, steps…"
              aria-label="Your question for Kaagapay"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length === 0}
              className="shrink-0 rounded-xl bg-sky-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              Send
            </button>
          </div>
        </form>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => send(sample.message)}
              disabled={busy}
              className="rounded-full border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 dark:border-slate-600/60 dark:bg-transparent dark:text-slate-300 dark:hover:border-slate-400"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </section>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-500 font-medium">
        Disclaimer: answers come from a local knowledge base that is sample
        copy pending team review — not legal advice. Fees and steps must be
        confirmed at the barangay hall. No personal information is stored.
      </p>
    </main>
  );
}
