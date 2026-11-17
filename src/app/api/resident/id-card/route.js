/**
 * BEST System - GET /api/resident/id-card (WP-11, plan Sec. 17, Sec. 6.4).
 *
 *   200 OK -> the minimal digital ID view model (own card only)
 *   401    -> no valid resident session
 *   404    -> no card, or a query that targets a different resident/card
 *   500    -> an unexpected server error (generic message only)
 *
 * The card is VIEW ONLY. This handler returns data for a screen; it has no
 * file, document or paper export of any kind.
 *
 * Privacy rules enforced here:
 *   - the resident is always taken from the verified session cookie, never
 *     from the query string or the body;
 *   - `id` / `resident_id` in the query are only accepted when they name the
 *     session resident or that resident's own card, otherwise the same generic
 *     404 is returned as for a missing card;
 *   - the response is an explicit allow-list of fields: no contact number,
 *     e-mail, street address, demo flag or credential is ever serialised;
 *   - V5 encrypts resident PII server-side as `v1.<kid>.<iv>.<ct>.<tag>`
 *     with the AAD context `Resident.<column>`; only the two emergency
 *     contact fields are opened here, with FIELD_ENC_KEY, inside this server
 *     module;
 *   - a damaged emergency field falls back to "Not available" instead of
 *     failing the whole card, and never leaks the error or ciphertext;
 *   - values are never logged, and the response is no-store with no Set-Cookie.
 */

import {
  BUSINESS_APPLICANT_ROLE,
  RESIDENT_ROLE,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';
import { decryptField } from '../../../../lib/crypto/field.js';
import { prisma } from '../../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GENERIC_NOT_FOUND = 'No digital ID card is available for this account.';
const EMERGENCY_PLACEHOLDER = 'Not available';

/**
 * A strict YYYY-MM-DD date, or null for anything unusable.
 * @param {unknown} value
 * @returns {string|null}
 */
function dateOnly(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  return null;
}

/**
 * Only same-origin avatar paths are allowed (plan Sec. 7.6 item 3).
 * Anything else is replaced with null so the card falls back to initials.
 * @param {unknown} value
 * @returns {string|null}
 */
function safePhotoUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/avatars/')) return null;
  if (trimmed.startsWith('//') || trimmed.includes('\\') || trimmed.includes('..')) return null;
  return trimmed;
}

/**
 * Join the name parts without leaking extra whitespace.
 * @param {object} resident
 * @returns {string}
 */
function fullName(resident) {
  return [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
    .filter((part) => typeof part === 'string' && part.trim() !== '')
    .map((part) => part.trim())
    .join(' ');
}

/**
 * Open one V5 encrypted emergency field. A null, a damaged value, a rotated
 * key or a legacy plaintext value yields null, which the caller turns into a
 * safe placeholder: one unreadable field must never turn the card into a 500.
 *
 * @param {unknown} stored
 * @param {'emergency_contact_name'|'emergency_contact_phone'} column
 * @returns {string|null}
 */
function openEmergencyField(stored, column) {
  if (typeof stored !== 'string' || stored.trim() === '') return null;
  try {
    const value = decryptField(stored, 'Resident.' + column);
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Read the resident's card fields and open the two emergency fields one by
 * one. The Prisma extension decrypts top-level model rows only, so this query
 * intentionally reads the raw row and decrypts with the exact AAD context;
 * that lets one damaged field fall back without hiding card metadata.
 *
 * @param {string} residentId
 * @returns {Promise<object|null>}
 */
async function loadResidentCardRow(residentId) {
  const rows = await prisma.$queryRaw`
    SELECT
      "id",
      "first_name",
      "middle_name",
      "last_name",
      "suffix",
      "purok",
      "birth_date",
      "blood_type",
      "photo_url",
      "emergency_contact_name",
      "emergency_contact_phone"
    FROM "Resident"
    WHERE "id" = ${residentId}
    LIMIT 1
  `;
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  return {
    ...row,
    emergency_contact_name: openEmergencyField(row.emergency_contact_name, 'emergency_contact_name'),
    emergency_contact_phone: openEmergencyField(row.emergency_contact_phone, 'emergency_contact_phone'),
  };
}

/**
 * The complete response allow-list. Exported so the field list can be unit
 * tested without a database or a session.
 *
 * @param {object} card BarangayIDCard row
 * @param {object} resident Resident row
 * @param {{name: string, phone: string}} emergency already-opened or placeholder values
 * @returns {{
 *   id: string,
 *   card_number: string,
 *   barcode_data: string,
 *   status: string,
 *   issued_date: string|null,
 *   valid_until: string|null,
 *   full_name: string,
 *   resident_no: string,
 *   purok: string,
 *   birth_date: string|null,
 *   blood_type: string,
 *   photo_url: string|null,
 *   emergency_contact_name: string,
 *   emergency_contact_phone: string,
 * }}
 */
export function toCardViewModel(card, resident, emergency) {
  const contact = emergency && typeof emergency === 'object' ? emergency : {};
  return {
    id: String(card.id),
    card_number: String(card.card_number),
    barcode_data: String(card.barcode_data),
    status: String(card.status),
    issued_date: dateOnly(card.issued_date),
    valid_until: dateOnly(card.valid_until),
    full_name: fullName(resident),
    resident_no: String(resident.id),
    purok: typeof resident.purok === 'string' ? resident.purok : '',
    birth_date: dateOnly(resident.birth_date),
    blood_type:
      typeof resident.blood_type === 'string' && resident.blood_type.trim() !== ''
        ? resident.blood_type.trim()
        : 'Unknown',
    photo_url: safePhotoUrl(resident.photo_url),
    emergency_contact_name:
      typeof contact.name === 'string' && contact.name.trim() !== ''
        ? contact.name.trim()
        : EMERGENCY_PLACEHOLDER,
    emergency_contact_phone:
      typeof contact.phone === 'string' && contact.phone.trim() !== ''
        ? contact.phone.trim()
        : EMERGENCY_PLACEHOLDER,
  };
}

/**
 * GET the session resident's own card.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function GET(request) {
  try {
    const { user } = await requireSession(request, [
      RESIDENT_ROLE,
      BUSINESS_APPLICANT_ROLE,
    ]);

    // The card and the resident are queried separately: the extension
    // decrypts top-level model rows only, and the resident row needs its own
    // top-level handling for the emergency fields.
    const card = await prisma.barangayIDCard.findUnique({
      where: { resident_id: user.id },
    });
    if (!card) {
      return jsonResponse(
        { error: 'CARD_NOT_FOUND', message: GENERIC_NOT_FOUND },
        { status: 404 },
      );
    }

    // A query may name this resident or this card; anything else is the same
    // generic 404 as a missing card (no existence oracle for other residents).
    const params = new URL(request.url).searchParams;
    const ownIds = new Set([user.id, card.id]);
    for (const name of ['id', 'resident_id']) {
      const requested = params.get(name);
      if (requested !== null && !ownIds.has(requested)) {
        return jsonResponse(
          { error: 'CARD_NOT_FOUND', message: GENERIC_NOT_FOUND },
          { status: 404 },
        );
      }
    }

    const resident = await loadResidentCardRow(user.id);
    if (!resident) {
      return jsonResponse(
        { error: 'CARD_NOT_FOUND', message: GENERIC_NOT_FOUND },
        { status: 404 },
      );
    }

    const view = toCardViewModel(card, resident, {
      name: resident.emergency_contact_name,
      phone: resident.emergency_contact_phone,
    });

    // No cookie is re-issued on this endpoint on purpose: the card response is
    // read-only and must not carry Set-Cookie.
    return jsonResponse(view, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
