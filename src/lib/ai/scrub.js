/**
 * BEST - Local PII scrub and urgency triage (WP-09, plan Sec. 7.5 / Sec. 15).
 *
 * Runs in the CITIZEN BROWSER before the plaintext is POSTed over HTTPS (V5
 * has no browser sealing), and again server-side before any optional hybrid
 * enhancement. It is a pure regex
 * pipeline: NOTHING is sent anywhere by this module, nothing is stored, and
 * it never contacts the network. Used for blotter triage where external AI
 * is NEVER allowed (OFFLINE-03).
 *
 * Scrub classes per Sec. 7.5: PH mobile/landline numbers, e-mails,
 * honorific + capitalized name, name-introduction cues (EN/TL/CEB), address
 * cues (Purok, Blk/Lot, Street), and ID numbers.
 */

/** Each class: a regex whose matches are replaced with a fixed token. */
const SCRUB_RULES = [
  {
    kind: 'mobile',
    token: '[removed-phone]',
    re: /(?:\+63|0)\s*9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/g,
  },
  {
    kind: 'landline',
    token: '[removed-phone]',
    re: /(?:\+63|0)\s*\(?\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  },
  {
    kind: 'email',
    token: '[removed-email]',
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  },
  {
    kind: 'honorific-name',
    token: '[removed-name]',
    re: /\b(?:Mr|Mrs|Ms|Dr|Dra|Sir|Madam|Kuya|Ate|Mang|Aling|Ginang|Ginoong|Bb)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g,
  },
  {
    kind: 'name-introduction',
    token: '[removed-name]',
    re:
      /\b(?:my name is|i am|i'm)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b|ako(?:\s+po)?\s+si\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b|ang\s+ngalan\s+nako(?:\s+si)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi,
  },
  {
    kind: 'address',
    token: '[removed-address]',
    re: /\b(?:Purok|Sitio|Blk|Block|Lot|Phase|Subdivision|Subd|St\.?|Street)\s*[#0-9A-Za-z][0-9A-Za-z-]*/g,
  },
  {
    kind: 'id-number',
    token: '[removed-id]',
    re: /\b(?:[A-Z]{1,4}-\d{2}-\d{6,7}|\d{2}-\d{4}\.\d{3}|\d{4}-\d{4}-\d{4})\b/g,
  },
];

/**
 * Scrub personally identifying text.
 *
 * @param {string} text raw user text
 * @returns {{ text: string, findings: Array<{ kind: string, count: number }> }}
 *   the sanitized text and a per-class summary of what was removed. No raw
 *   match content is returned - only counts.
 */
export function scrubPII(text) {
  const source = typeof text === 'string' ? text : '';
  const findings = [];
  let scrubbed = source;

  for (const rule of SCRUB_RULES) {
    // Reset lastIndex because every rule regex is global/stateful.
    rule.re.lastIndex = 0;
    const found = source.match(rule.re);
    if (found && found.length > 0) {
      findings.push({ kind: rule.kind, count: found.length });
      scrubbed = scrubbed.replace(rule.re, rule.token);
    }
  }

  return { text: scrubbed, findings };
}

/**
 * Urgency keyword weights (EN / TL / CEB), Sec. 7.5 "weighted keywords".
 * Deliberately conservative: high urgency only on clear danger words.
 */
const URGENCY_KEYWORDS = [
  // Highest weight: immediate danger
  { re: /\b(?:kill|stab(?:bed)?|shot|gun|knife|blood|dead|died|body)\b/gi, weight: 5 },
  { re: /\b(?:patay|namatay|tinusok|nasaktan|dugo)\b/gi, weight: 5 },
  { re: /\b(?:patay|namatay|tinusok|saksak|baril|dugo)\b/gi, weight: 5 },
  { re: /\b(?:sunog|nasunog|fire|burning|kalayo)\b/gi, weight: 5 },
  { re: /\b(?:threat|threaten(?:ed)?|gun|weapon|attack|harass(?:ed|ment))\b/gi, weight: 3 },
  { re: /\b(?:banta|pagbabanta|nananakot|pananakot|inabot|sinuntok|sinabunutan)\b/gi, weight: 3 },
  { re: /\b(?:gipusil|gikabat|gikahadlok|gipanghawla|gikulong)\b/gi, weight: 3 },
  // Moderate: property and intrusion
  { re: /\b(?:steal|stole|stolen|rob(?:bed|bery)?|theft|broken into|vandal)\b/gi, weight: 2 },
  { re: /\b(?:nakaw|nanakaw|ninakaw|nanlabas|tumangay|snatcher|nagkalat)\b/gi, weight: 2 },
  { re: /\b(?:nakaw|kinawat|gikawat|nanakaw|tumangay)\b/gi, weight: 2 },
  // Low: general disturbances and disputes
  { re: /\b(?:noise|drunk|argument|quarrel|disturbance|fight|trending)\b/gi, weight: 1 },
  { re: /\b(?:ingay|laseng|away|gulo|tampuhan|nag-aaway|inuman)\b/gi, weight: 1 },
  { re: /\b(?:saba|hilanat|away|gubot|nagkinahanglan|nag-away)\b/gi, weight: 1 },
];

/**
 * Assess urgency of a (preferably scrubbed) text from weighted keyword hits.
 *
 * @param {string} text
 * @returns {{ level: 'low'|'medium'|'high', score: number,
 *             matches: string[] }} matches are the keyword classes hit
 *   (described by weight class), not the raw text.
 */
export function assessUrgency(text) {
  const source = typeof text === 'string' ? text : '';
  let score = 0;
  const matches = [];

  for (const entry of URGENCY_KEYWORDS) {
    entry.re.lastIndex = 0;
    if (entry.re.test(source)) {
      score += entry.weight;
      matches.push(entry.weight >= 4 ? 'danger' : entry.weight >= 2 ? 'property' : 'disturbance');
    }
  }

  const level = score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low';
  return { level, score, matches: [...new Set(matches)] };
}
