/**
 * BEST System - /api/documents (WP-08, plan Sec. 6.4, Sec. 12.4, Sec. 13.3).
 *
 * POST - verified resident intake (Clearance / Indigency).
 *   201 -> { success: true, tracking_code, fee_amount, qr_hash }
 *   200 -> the SAME tracking_code / fee_amount / qr_hash when the
 *          client_request_id was already used (offline replay must not create
 *          a second row - plan Sec. 6.4 "Offline write rules").
 *   400 -> a body that carries resident_id, an unknown document_type, or a
 *          purpose / ctc_number that is missing or out of bounds.
 *   401 -> no verified resident session (the resident is taken from the
 *          session only; invariant 10 / AUTH-01).
 *   503 -> { error: 'CONFIG_MISSING' } when QR_HMAC_SECRET is absent. The
 *          handler fails closed and never falls back to a default secret.
 *
 * GET - staff processing queue (STAFF with document review permission).
 *   200 -> { items, total, page }. Every item carries the tracking code, the
 *          type, the status, the fee, created/updated dates and the MASKED
 *          resident name (NFR-01: J*** D**). purpose and ctc_number are
 *          encrypted by the server and are never selected here.
 *
 * Nothing about the request - no body, no PII, no tracking code - is logged.
 */

import { createHmac, randomBytes } from 'node:crypto';

import { prisma } from '../../../lib/db.js';
import {
  AuthError,
  RESIDENT_ROLE,
  STAFF_ROLES,
  assertNoResidentId,
  can,
  errorResponse,
  jsonResponse,
  maskName,
  readJsonBody,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fee rule (verified against the plan):
 *   CLEARANCE -> 50.00 - DocumentRequest.fee_amount @default(50.00)
 *                (prisma/schema.prisma, plan Sec. 4 data model line "fee_amount
 *                Decimal @default(50.00)"), the "reasonable fee" of R.A. 7160
 *                Sec. 152(c).
 *   INDIGENCY -> 0.00 - plan Sec. 1.3 state machine:
 *                "UNDER_REVIEW --> INDIGENCY_FREE: Indigency Approved (Zero Fee)".
 */
const FEE_BY_TYPE = Object.freeze({ CLEARANCE: 50, INDIGENCY: 0 });

const DOCUMENT_TYPES = Object.freeze(['CLEARANCE', 'INDIGENCY']);
const QUEUE_STATUSES = Object.freeze([
  'SUBMITTED',
  'UNDER_REVIEW',
  'PAYMENT_PENDING',
  'READY_FOR_PICKUP',
  'RELEASED',
  'REJECTED',
]);

/**
 * Crockford base32: no I, L, O or U, so a code read off a paper stub cannot
 * be confused (1 -> I, 0 -> O). 256 = 32 * 8, so `byte % 32` is uniform.
 */
const TRACKING_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TRACKING_YEAR = '2026';
const MAX_CODE_ATTEMPTS = 6;

const PAGE_DEFAULT = 1;
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;
const MAX_CLIENT_REQUEST_ID = 128;
const MAX_PURPOSE_CHARS = 2000;
const MAX_CTC_CHARS = 64;

/**
 * Read QR_HMAC_SECRET. Returns '' when it is missing: the caller fails closed
 * with 503. A default secret is never substituted (SEED-01 / invariant 12).
 * @returns {string}
 */
function qrHmacSecret() {
  const env = process.env || {};
  const value = env.QR_HMAC_SECRET;
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * A present (but maybe empty) value that should be treated as provided.
 * @param {unknown} value
 * @returns {boolean}
 */
function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Format a money value as a 2 decimal string, whatever Prisma returns.
 * @param {unknown} value
 * @returns {string}
 */
function formatFee(value) {
  if (value && typeof value.toFixed === 'function') return value.toFixed(2);
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

/**
 * The Prisma unique-constraint field of a P2002 error, or null.
 * @param {unknown} error
 * @returns {string|null}
 */
function uniqueField(error) {
  if (!error || error.code !== 'P2002') return null;
  const target = error.meta ? error.meta.target : null;
  if (Array.isArray(target) && target.length > 0) return String(target[0]);
  if (typeof target === 'string') return target;
  return '';
}

/**
 * 8 random characters over the unambiguous alphabet.
 * @returns {string}
 */
function randomSuffix() {
  const bytes = randomBytes(8);
  let out = '';
  for (let index = 0; index < bytes.length; index += 1) {
    out += TRACKING_ALPHABET[bytes[index] % TRACKING_ALPHABET.length];
  }
  return out;
}

/**
 * CLR-2026-XXXXXXXX or IND-2026-XXXXXXXX.
 * @param {string} documentType
 * @returns {string}
 */
function buildTrackingCode(documentType) {
  const prefix = documentType === 'INDIGENCY' ? 'IND' : 'CLR';
  return prefix + '-' + TRACKING_YEAR + '-' + randomSuffix();
}

/**
 * HMAC-SHA256(QR_HMAC_SECRET, tracking_code) as lowercase hex.
 * @param {string} secret
 * @param {string} trackingCode
 * @returns {string}
 */
function hmacHex(secret, trackingCode) {
  return createHmac('sha256', secret).update(trackingCode, 'utf8').digest('hex');
}

/**
 * The idempotent (and fresh) success answer.
 * @param {{tracking_code: string, fee_amount: unknown, qr_hash: string}} row
 * @param {number} status
 * @returns {Response}
 */
function successResponse(row, status) {
  return jsonResponse(
    {
      success: true,
      tracking_code: row.tracking_code,
      fee_amount: formatFee(row.fee_amount),
      qr_hash: row.qr_hash,
    },
    { status },
  );
}

/**
 * Clamp an integer query parameter.
 * @param {unknown} raw
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInt(raw, fallback, min, max) {
  const parsed = Number.parseInt(String(raw === null || raw === undefined ? '' : raw), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

// ---------------------------------------------------------------------------
// POST - resident intake
// ---------------------------------------------------------------------------

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    // Invariant 10 / AUTH-01: the resident always comes from the session.
    assertNoResidentId(body);

    const { user } = await requireSession(request, [RESIDENT_ROLE]);

    const documentType =
      typeof body.document_type === 'string' ? body.document_type.trim().toUpperCase() : '';
    if (!DOCUMENT_TYPES.includes(documentType)) {
      throw new AuthError(
        400,
        'document_type must be CLEARANCE or INDIGENCY.',
        'DOCUMENT_TYPE_INVALID',
      );
    }

    if (typeof body.purpose !== 'string') {
      throw new AuthError(400, 'purpose is required.', 'PURPOSE_REQUIRED');
    }
    const purposeText = body.purpose.trim();
    if (!purposeText) {
      throw new AuthError(400, 'purpose is required.', 'PURPOSE_REQUIRED');
    }
    if (purposeText.length > MAX_PURPOSE_CHARS) {
      throw new AuthError(
        400,
        'purpose is too long.',
        'PURPOSE_TOO_LONG',
      );
    }

    let ctcText = null;
    if (isPresent(body.ctc_number)) {
      if (typeof body.ctc_number !== 'string') {
        throw new AuthError(400, 'ctc_number must be a string.', 'CTC_INVALID');
      }
      ctcText = body.ctc_number.trim();
      if (ctcText.length > MAX_CTC_CHARS) {
        throw new AuthError(400, 'ctc_number is too long.', 'CTC_TOO_LONG');
      }
      if (!ctcText) ctcText = null;
    }

    const clientRequestId =
      typeof body.client_request_id === 'string' ? body.client_request_id.trim() : '';
    if (clientRequestId.length > MAX_CLIENT_REQUEST_ID) {
      throw new AuthError(400, 'client_request_id is too long.', 'CLIENT_REQUEST_ID_INVALID');
    }

    // Offline replay: the same client_request_id answers 200 with the row that
    // already exists, so a replay never creates a second request.
    if (clientRequestId) {
      const existing = await prisma.documentRequest.findUnique({
        where: { client_request_id: clientRequestId },
        select: { tracking_code: true, fee_amount: true, qr_hash: true },
      });
      if (existing) return successResponse(existing, 200);
    }

    const secret = qrHmacSecret();
    if (!secret) {
      // Fail closed: no default secret, no fallback algorithm.
      return jsonResponse({ error: 'CONFIG_MISSING' }, { status: 503 });
    }

    let lastError = null;
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const trackingCode = buildTrackingCode(documentType);
      const qrHash = hmacHex(secret, trackingCode);
      try {
        const created = await prisma.documentRequest.create({
          data: {
            tracking_code: trackingCode,
            resident_id: user.id,
            document_type: documentType,
            // Plaintext here: the Prisma extension encrypts before storage (V5).
            purpose: purposeText,
            ctc_number: ctcText,
            status: 'SUBMITTED',
            fee_amount: FEE_BY_TYPE[documentType],
            qr_hash: qrHash,
            client_request_id: clientRequestId || null,
          },
          select: { tracking_code: true, fee_amount: true, qr_hash: true },
        });
        return successResponse(created, 201);
      } catch (error) {
        const field = uniqueField(error);
        if (field === 'client_request_id') {
          // A concurrent replay of the same id won the race: answer with its row.
          const existing = await prisma.documentRequest.findUnique({
            where: { client_request_id: clientRequestId },
            select: { tracking_code: true, fee_amount: true, qr_hash: true },
          });
          if (existing) return successResponse(existing, 200);
          lastError = error;
          break;
        }
        if (field === 'tracking_code' || field === 'qr_hash') {
          // Collision on the 8 character suffix: draw again.
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError || new AuthError(500, 'A tracking code could not be issued.', 'CODE_GENERATION_FAILED');
  } catch (error) {
    return errorResponse(error);
  }
}

// ---------------------------------------------------------------------------
// GET - staff queue
// ---------------------------------------------------------------------------

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function GET(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.DOCUMENT_REVIEW_APPROVAL);

    const url = new URL(request.url);
    const status = (url.searchParams.get('status') || '').trim().toUpperCase();
    const type = (url.searchParams.get('type') || '').trim().toUpperCase();
    // Search is limited to the tracking code or the resident's last name: no
    // encrypted field is searchable and nothing unmasked leaves this handler.
    const search = (url.searchParams.get('search') || '').trim().slice(0, 64);
    const page = clampInt(url.searchParams.get('page'), PAGE_DEFAULT, 1, 100000);
    const size = clampInt(
      url.searchParams.get('size') || url.searchParams.get('limit'),
      PAGE_SIZE_DEFAULT,
      1,
      PAGE_SIZE_MAX,
    );

    const where = {};
    if (QUEUE_STATUSES.includes(status)) where.status = status;
    if (DOCUMENT_TYPES.includes(type)) where.document_type = type;
    if (search) {
      where.OR = [
        { tracking_code: { contains: search, mode: 'insensitive' } },
        { resident: { last_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await prisma.$transaction([
      prisma.documentRequest.count({ where }),
      prisma.documentRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
        select: {
          tracking_code: true,
          document_type: true,
          status: true,
          fee_amount: true,
          created_at: true,
          updated_at: true,
          resident: { select: { first_name: true, last_name: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      tracking_code: row.tracking_code,
      document_type: row.document_type,
      status: row.status,
      fee_amount: formatFee(row.fee_amount),
      created_at: row.created_at,
      updated_at: row.updated_at,
      masked_name: maskName(row.resident.first_name, row.resident.last_name),
    }));

    return jsonResponse({ items, total, page });
  } catch (error) {
    return errorResponse(error);
  }
}