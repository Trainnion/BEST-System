/**
 * BEST - Optional Gemini enhancement (WP-09, plan Sec. 7.5 hybrid safeguards).
 *
 * SERVER-ONLY: this module is imported exclusively by /api/ai/* route
 * handlers, never by client components (the CSP connect-src 'self' would
 * block the browser anyway).
 *
 * Safeguards, all binding:
 *  - Only used when AI_MODE === 'hybrid' AND GEMINI_API_KEY is set.
 *  - Input is scrubbed with scrubPII() BEFORE it leaves the process.
 *  - 2.5s AbortController timeout on every request.
 *  - Circuit breaker: opens for 60s after 2 consecutive failures.
 *  - ANY failure silently returns the local result. Nothing ever throws out.
 *  - NEVER used for blotter: only chat replies and broadcast summaries can
 *    be enhanced (OFFLINE-03 / R.A. 10173).
 *  - Prompts are never logged, and no API key is hardcoded here; the key
 *    comes from the environment set up by a person (AGENTS.md).
 */

import { scrubPII } from './scrub.js';

const TIMEOUT_MS = 2500;
const BREAKER_OPEN_MS = 60 * 1000;
const BREAKER_THRESHOLD = 2;

/** Effective AI mode for the running process. */
export function aiMode() {
  return process.env.AI_MODE === 'hybrid' ? 'hybrid' : 'local';
}

/** Module-level circuit breaker state (one process = one hall server). */
const breaker = { consecutiveFailures: 0, openUntil: 0 };

function breakerOpen() {
  return Date.now() < breaker.openUntil;
}

function recordFailure() {
  breaker.consecutiveFailures += 1;
  if (breaker.consecutiveFailures >= BREAKER_THRESHOLD) {
    breaker.openUntil = Date.now() + BREAKER_OPEN_MS;
    breaker.consecutiveFailures = 0;
  }
}

function recordSuccess() {
  breaker.consecutiveFailures = 0;
  breaker.openUntil = 0;
}

/**
 * Endpoint. Configurable through GEMINI_API_URL; falls back to the official
 * Google Generative Language API. This constant lives ONLY in this
 * server-side module - no endpoint or key is ever shipped to client code.
 */
const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function endpoint() {
  return process.env.GEMINI_API_URL || DEFAULT_ENDPOINT;
}

function available() {
  return (
    aiMode() === 'hybrid' &&
    Boolean(process.env.GEMINI_API_KEY) &&
    !breakerOpen()
  );
}

/** One generateContent call. Returns text or null on any failure. */
async function callGemini(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${endpoint()}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join(' ');
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try to enhance a Kaagapay chat reply. Never used for blotter.
 *
 * @param {{ message: string, language: string, local: {reply: string, recommended_service: (string|null), checklist: string[], source: string} }} input
 * @returns {Promise<object>} the enhanced result, or exactly the local result
 */
export async function enhanceChat({ message, language, local }) {
  if (!available()) return local;

  // PII is scrubbed BEFORE anything leaves the process (Sec. 7.5).
  const { text: safeMessage } = scrubPII(message || '');
  const { text: safeReply } = scrubPII(local.reply || '');

  const prompt = [
    'You assist a Philippine barangay hall citizen concierge.',
    'Rewrite the answer in the same language, keeping every fact, fee, step and requirement exactly as given. Keep it under 120 words. Plain text only.',
    `Answer language: ${language}.`,
    `Question: ${safeMessage}`,
    `Existing answer: ${safeReply}`,
  ].join('\n');

  const improved = await callGemini(prompt);
  if (improved === null) {
    recordFailure();
    return local; // silent fallback, Sec. 7.5
  }
  recordSuccess();
  return { ...local, reply: improved, source: 'gemini' };
}

/**
 * Try to paraphrase a broadcast simplification result. Never used for
 * blotter. Falls back to exactly the local result on any failure.
 *
 * @param {{ content: string, language: string, local: {simplified_summary: string, audio_script: string, source: string} }} input
 * @returns {Promise<object>}
 */
export async function enhanceBroadcast({ content, language, local }) {
  if (!available()) return local;

  const { text: safeContent } = scrubPII(content || '');
  const { text: safeSummary } = scrubPII(local.simplified_summary || '');

  const prompt = [
    'Rewrite this barangay announcement summary in plain, short sentences in the same language. Keep all dates, amounts and requirements exactly as given. Under 80 words. Plain text only.',
    `Language: ${language}.`,
    `Original: ${safeContent}`,
    `Existing summary: ${safeSummary}`,
  ].join('\n');

  const improved = await callGemini(prompt);
  if (improved === null) {
    recordFailure();
    return local;
  }
  recordSuccess();
  // The audio script keeps its local template form (it is read aloud by
  // staff, not generated speech) and stays attributable to the local engine.
  return { ...local, simplified_summary: improved, source: 'gemini' };
}
