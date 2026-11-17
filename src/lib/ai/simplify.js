/**
 * BEST - Local broadcast simplifier (WP-09, plan Sec. 7.5).
 *
 * Extractive summary (lead sentence + sentences containing dates or amounts)
 * plus a template megaphone/audio script per language. Deterministic, no
 * network, no storage, no external calls. Gemini may paraphrase the RESULT
 * server-side in hybrid mode (see gemini.js); this module itself is local.
 */

const AMOUNT_RE = /(?:₱|PHP|Php|P)\s?\d[\d,]*(?:\.\d{1,2})?/g;
const DATE_RE =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Enero|Pebrero|Marso|Abril|Mayo|Hunyo|Hulyo|Agosto|Setyembre|Oktubre|Nobyembre|Disyembre|Enero|Pebrero)\s+\d{1,2}(?:\s*,?\s*\d{4})?|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/gi;
const TIME_RE = /\b\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm|ng umaga|ng hapon|ng gabi|sa buntag|sa hapon|sa gabii)\b/g;

/** Split content into plain sentences (naive, offline-safe). */
function splitSentences(content) {
  return String(content || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+|(?<=[.!?…])$/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countMatches(text, re) {
  re.lastIndex = 0;
  const found = text.match(re);
  return found ? found.length : 0;
}

/**
 * Extractive summary: the lead sentence plus the most information-dense
 * later sentences (those carrying dates, times or money amounts).
 *
 * @param {string} content raw broadcast content
 * @returns {string} a short summary (or a trimmed fallback)
 */
export function summarizeBroadcast(content) {
  const sentences = splitSentences(content);
  if (sentences.length === 0) return '';

  const lead = sentences[0];
  const picked = [lead];

  for (const sentence of sentences.slice(1)) {
    if (picked.length >= 4) break;
    const score =
      countMatches(sentence, AMOUNT_RE) +
      countMatches(sentence, DATE_RE) +
      countMatches(sentence, TIME_RE);
    if (score > 0) picked.push(sentence);
  }

  return picked.join(' ');
}

/** Template audio (megaphone) script per language. */
const AUDIO_TEMPLATES = {
  en: (summary) => `Attention, residents of our barangay. Here is an important announcement. ${summary} Thank you for listening.`,
  tl: (summary) => `Mga kapitbahay, pakikinggan po. Mahalagang pahayag po ito. ${summary} Salamat po sa inyong pakikinig.`,
  ceb: (summary) => `Mga taga-barangay, pamati intawon. Mahinungdanong pahibalo kini. ${summary} Salamat sa inyong pamati.`,
};

/**
 * Simplify a broadcast locally.
 *
 * @param {string} content raw staff-authored broadcast content
 * @param {string} [language] 'en' | 'tl' | 'ceb' (unknown falls back to 'en')
 * @returns {{ simplified_summary: string, audio_script: string, source: 'local' }}
 */
export function simplifyContent(content, language = 'en') {
  const summary = summarizeBroadcast(content);
  const lang = ['en', 'tl', 'ceb'].includes(language) ? language : 'en';
  const script = summary ? AUDIO_TEMPLATES[lang](summary) : '';
  return { simplified_summary: summary, audio_script: script, source: 'local' };
}
