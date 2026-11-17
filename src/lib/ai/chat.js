/**
 * BEST - Local Kaagapay chat engine (WP-09, plan Sec. 7.5).
 *
 * Language detection (EN/TL/CEB stop-word lists) + intent matching over
 * kb.js. Deterministic, no network, no storage, no PII retention. The SAME
 * module runs on the server (/api/ai/chat) and in the citizen browser at
 * connectivity level L2. Gemini may REWRITE the reply in hybrid mode; the
 * final `source` field tells the UI which engine answered.
 */

import { KB_ENTRIES, OFFICE, getEntry } from './kb.js';

/**
 * Stop-word lists per language. The winner is the list with the most hits;
 * English is the fallback. Counts are normalized per list size so a longer
 * list does not win by length alone.
 */
const STOP_WORDS = {
  en: ['the', 'is', 'are', 'what', 'how', 'where', 'when', 'do', 'i', 'need', 'can', 'you', 'for', 'to', 'of', 'please', 'want', 'my', 'get', 'apply'],
  tl: ['po', 'opo', 'ako', 'ang', 'ng', 'mga', 'paano', 'saan', 'kailangan', 'ko', 'ba', 'yung', 'pwede', 'magkano', 'hindi', 'gusto', 'kung', 'para', 'sabi', 'ito'],
  ceb: ['ako', 'akoang', 'ang', 'mga', 'unsaon', 'asa', 'kinahanglan', 'nako', 'naku', 'ko', 'pwede', 'magkano', 'dili', 'ganahan', 'kung', 'para', 'kini', 'niini', 'dinhi', 'sila'],
};

/**
 * Detect the language of a message.
 * @param {string} text
 * @returns {'en'|'tl'|'ceb'}
 */
export function detectLanguage(text) {
  const source = String(text || '').toLowerCase();
  if (!source.trim()) return 'en';

  const words = source.split(/[^a-záéíóúñÁÉÍÓÚÑ]+/).filter(Boolean);
  const scores = { en: 0, tl: 0, ceb: 0 };

  for (const lang of Object.keys(STOP_WORDS)) {
    const list = STOP_WORDS[lang];
    let hits = 0;
    for (const word of words) {
      if (list.includes(word)) hits += 1;
    }
    // Normalized so list length does not decide the winner.
    scores[lang] = hits / Math.sqrt(list.length);
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'en';
}

/**
 * Intent keywords per service. Cebuano and Tagalog share many forms; both
 * lists include the words that actually appear in civic questions.
 */
const INTENT_KEYWORDS = [
  { topic: 'indigency', words: ['indigenc', 'indigent', 'walangpera', 'walang pera', 'kakapusan', 'kakaposan', 'kalisod', 'hospital assistance', 'scholarship', 'iskolar'] },
  { topic: 'clearance', words: ['clearance', 'sertipiko', 'sertificado', 'pagpapatunay', 'police clearance', 'nbi'] },
  { topic: 'business-clearance', words: ['business', 'negosyo', 'permit', 'tindahan', 'sari-sari', 'store', 'puhunan'] },
  { topic: 'blotter', words: ['blotter', 'reklamo', 'sumbong', 'report', 'insidente', 'incident', 'complaint', 'kalag'] },
  { topic: 'digital-id', words: ['digital id', 'id card', 'barangay id', 'e-id', 'eid', 'identification', 'resident id'] },
  { topic: 'office-hours', words: ['hours', 'oras', 'open', 'bukas', 'sara', 'horario', 'schedule', 'tawag', 'contact', 'location', 'asa', 'saan', 'where'] },
];

/**
 * Match a message to a KB topic (or null when nothing matches).
 * @param {string} text
 * @returns {string|null} topic key
 */
export function matchIntent(text) {
  const source = String(text || '').toLowerCase();
  if (!source.trim()) return null;

  let best = null;
  let bestScore = 0;
  for (const intent of INTENT_KEYWORDS) {
    let score = 0;
    for (const word of intent.words) {
      if (source.includes(word)) score += word.length >= 6 ? 2 : 1;
    }
    if (score > bestScore) {
      best = intent.topic;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

const SERVICE_MENU = {
  en: 'I can help with: Barangay Clearance, Certificate of Indigency, Business Clearance, anonymous Blotter reports, the Digital Barangay ID, and office hours. Which one do you need?',
  tl: 'Matutulungan kita sa: Barangay Clearance, Certificate of Indigency, Business Clearance, anonymous na Blotter report, Digital Barangay ID, at office hours. Alin ang kailangan mo?',
  ceb: 'Makatabang ko sa: Barangay Clearance, Certificate of Indigency, Business Clearance, anonymous nga Blotter report, Digital Barangay ID, ug office hours. Unsa ang kinahanglan nimo?',
};

/**
 * Answer a civic question from the local knowledge base.
 *
 * @param {string} message raw user message (not stored, not forwarded)
 * @param {string} [language] 'en' | 'tl' | 'ceb' | 'auto'/unknown -> detect
 * @returns {{ reply: string, recommended_service: string|null,
 *             checklist: string[], source: 'local' }}
 */
export function answerFromKnowledgeBase(message, language = 'auto') {
  const detected = ['en', 'tl', 'ceb'].includes(language) ? language : detectLanguage(message);
  const topic = matchIntent(message);
  const entry = topic ? getEntry(topic) : null;

  if (!entry) {
    return {
      reply: SERVICE_MENU[detected],
      recommended_service: null,
      checklist: [],
      source: 'local',
    };
  }

  const parts = [entry.answer[detected]];
  if (entry.fees[detected]) parts.push(entry.fees[detected]);
  parts.push(`Office hours: ${OFFICE.hours}.`);
  if (entry.steps[detected].length > 0) {
    const stepLabel = detected === 'tl' ? 'Mga hakbang' : detected === 'ceb' ? 'Mga lakang' : 'Steps';
    parts.push(
      `${stepLabel}: ${entry.steps[detected]
        .map((step, index) => `${index + 1}) ${step}`)
        .join(' ')}`,
    );
  }

  return {
    reply: parts.join(' '),
    recommended_service: entry.service,
    checklist: entry.checklist[detected].slice(),
    source: 'local',
  };
}

/** Topics available for the UI fallback menu (name + route). */
export function listServices() {
  return KB_ENTRIES.map((entry) => ({ topic: entry.topic, service: entry.service, route: entry.route }));
}
