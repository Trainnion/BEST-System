/**
 * BEST System - /api/admin/blotter/[code] (WP-10, plan Sec. 1.3C, Sec. 6.4,
 * Sec. 6.5, Sec. 12, Sec. 15).
 *
 * Staff work lives HERE and not under /api/blotter: the proxy strips the
 * session cookie on every /api/blotter* path (Sec. 12.2), so a staff route
 * there could never see a session.
 *
 * GET  - STAFF or ADMIN with the blotter update permission.
 *        Decrypts the narrative, the exact location and the exact time on
 *        the server, writes a VIEW_ENCRYPTED audit row with the field names
 *        only (never plaintext) and returns the staff detail view.
 *        400/401/403/404/500 as described in the plan.
 *
 * PATCH - same role and permission.
 *        Body: { action_taken, public_notes, internal_notes, status }
 *        Enforces FILED -> UNDER_REVIEW -> ACTION_TAKEN -> CLOSED (and
 *        UNDER_REVIEW -> CLOSED), with a concurrency guard, a BlotterUpdate
 *        row and an UPDATE_BLOTTER audit row whose target is the anonymous
 *        tracking code. `internal_notes` arrives as PLAINTEXT and the
 *        Prisma extension encrypts it inside the transaction (Sec. 12.1).
 *        The answer is the PUBLIC status view: internal notes never leave
 *        this route in a public shape.
 */

import { prisma } from '../../../../../lib/db.js';
import {
  AuthError,
  PERMISSIONS,
  assertNoResidentId,
  errorResponse,
  jsonResponse,
  readJsonBody,
  requirePermission,
  requireSession,
} from '../../../../../lib/auth.js';
import { logEncryptedView } from '../../../../../lib/audit.js';
import {
  BLOTTER_STATUSES,
  MAX_ACTION_LENGTH,
  MAX_INTERNAL_NOTES_LENGTH,
  MAX_PUBLIC_NOTES_LENGTH,
  TRACKING_PATTERN,
  canTransition,
} from '../../../../../lib/blotter/constants.js';
import { parsePayload } from '../../../../../lib/blotter/payload.js';
import {
  buildAuditLogId,
  buildUpdateId,
} from '../../../../../lib/blotter/tracking.js';
import { publicBlotterView, staffBlotterView } from '../../../../../lib/blotter/view.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The only columns a public answer may read. */
const PUBLIC_SELECT = Object.freeze({
  tracking_code: true,
  incident_type: true,
  status: true,
  created_at: true,
  updates: {
    select: {
      action_taken: true,
      public_notes: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
  },
});

/**
 * A generic not-found answer, identical for a malformed and an unknown code.
 * @returns {Response}
 */
function notFound() {
  return jsonResponse({ error: 'NOT_FOUND' }, { status: 404 });
}

/**
 * Normalise a tracking code from the path.
 * @param {unknown} raw
 * @returns {string} the code, or '' when it cannot be one
 */
function normalizeCode(raw) {
  const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  return TRACKING_PATTERN.test(code) ? code : '';
}

/**
 * Require a staff session that may work on blotter reports.
 * @param {Request} request
 * @returns {Promise<{user: object, session: object, cookie: string}>}
 * @throws {AuthError} 401 / 403
 */
async function requireBlotterStaff(request) {
  const { user } = await requireSession(request, ['STAFF', 'ADMIN']);
  requirePermission(user.role, PERMISSIONS.UPDATE_BLOTTER_STATUS);
  return user;
}

/**
 * @param {unknown} raw
 * @returns {string}
 * @throws {AuthError} 400
 */
function normalizeStatus(raw) {
  const value = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!BLOTTER_STATUSES.includes(value)) {
    throw new AuthError(400, 'status is not a blotter status.', 'STATUS_INVALID');
  }
  return value;
}

/**
 * Read an optional bounded text field.
 * @param {unknown} value
 * @param {string} field
 * @param {number} maxLength
 * @returns {string|null}
 * @throws {AuthError} 400
 */
function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new AuthError(400, field + ' must be text.', 'FIELD_INVALID');
  }
  const text = value.trim();
  if (!text) return null;
  if (text.length > maxLength) {
    throw new AuthError(
      400,
      field + ' is too long (at most ' + maxLength + ' characters).',
      'FIELD_TOO_LONG',
    );
  }
  return text;
}

/**
 * The staff detail of one report.
 *
 * @param {Request} request
 * @param {{params: {code: string}}} context
 * @returns {Promise<Response>}
 */
export async function GET(request, context) {
  try {
    const user = await requireBlotterStaff(request);

    const code = normalizeCode(context && context.params ? context.params.code : '');
    if (!code) return notFound();

    let report = null;
    let updates = [];
    try {
      // Two top-level queries on purpose: the extension decrypts
      // `enc_payload` and `internal_notes` on the way out (Sec. 12.1).
      report = await prisma.blotterReport.findUnique({
        where: { tracking_code: code },
        select: {
          tracking_code: true,
          incident_type: true,
          incident_zone: true,
          incident_date: true,
          urgency_level: true,
          status: true,
          created_at: true,
          enc_payload: true,
        },
      });
      if (!report) return notFound();

      updates = await prisma.blotterUpdate.findMany({
        where: { blotter_tracking_code: code },
        select: {
          id: true,
          action_taken: true,
          public_notes: true,
          internal_notes: true,
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
      });
    } catch {
      // A damaged ciphertext (GCM tag mismatch) or a dead connection: fail
      // safely and leak nothing (plan Sec. 12.7 item 3).
      throw new AuthError(
        500,
        'This report could not be read. It may be damaged; ask an administrator to check the record.',
        'REPORT_UNREADABLE',
      );
    }

    const payload = parsePayload(report.enc_payload);
    if (!payload) {
      throw new AuthError(
        500,
        'This report could not be read. It may be damaged; ask an administrator to check the record.',
        'REPORT_UNREADABLE',
      );
    }

    // Audit BEFORE the answer: field names only, never plaintext.
    const fields = ['enc_payload'];
    if (updates.some((update) => update.internal_notes)) fields.push('internal_notes');
    await logEncryptedView({
      userId: user.id,
      model: 'BlotterReport',
      targetId: code,
      fields,
    });

    return jsonResponse(staffBlotterView(report, updates, payload));
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Staff update of one report.
 *
 * @param {Request} request
 * @param {{params: {code: string}}} context
 * @returns {Promise<Response>}
 */
export async function PATCH(request, context) {
  try {
    const user = await requireBlotterStaff(request);

    const body = await readJsonBody(request);
    assertNoResidentId(body);

    const code = normalizeCode(context && context.params ? context.params.code : '');
    if (!code) return notFound();

    const nextStatus = normalizeStatus(body.status);
    const actionTaken = optionalText(body.action_taken, 'action_taken', MAX_ACTION_LENGTH);
    if (!actionTaken) {
      throw new AuthError(400, 'action_taken is required.', 'ACTION_TAKEN_REQUIRED');
    }
    const publicNotes = optionalText(body.public_notes, 'public_notes', MAX_PUBLIC_NOTES_LENGTH);
    // Plaintext in, ciphertext in the column: the extension encrypts it.
    const internalNotes = optionalText(
      body.internal_notes,
      'internal_notes',
      MAX_INTERNAL_NOTES_LENGTH,
    );

    const existing = await prisma.blotterReport.findUnique({
      where: { tracking_code: code },
      select: { status: true },
    });
    if (!existing) return notFound();

    if (!canTransition(existing.status, nextStatus)) {
      throw new AuthError(
        400,
        'status cannot move from ' + existing.status + ' to ' + nextStatus + '.',
        'STATUS_TRANSITION_INVALID',
      );
    }

    let written = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const updateId = buildUpdateId();
      const auditId = buildAuditLogId();
      try {
        await prisma.$transaction(async (tx) => {
          const moved = await tx.blotterReport.updateMany({
            where: { tracking_code: code, status: existing.status },
            data: { status: nextStatus },
          });
          if (moved.count !== 1) {
            throw new AuthError(
              409,
              'The report status changed while you were updating it. Reload and try again.',
              'STATUS_CONFLICT',
            );
          }

          await tx.blotterUpdate.create({
            data: {
              id: updateId,
              blotter_tracking_code: code,
              action_taken: actionTaken,
              public_notes: publicNotes,
              internal_notes: internalNotes,
              recorded_by_id: user.id,
            },
          });

          await tx.auditLog.create({
            data: {
              id: auditId,
              user_id: user.id,
              action: 'UPDATE_BLOTTER',
              // The target is the anonymous tracking code, never a person.
              target_entity: 'BlotterReport',
              target_id: code,
              metadata: {
                update_id: updateId,
                status: nextStatus,
                has_internal_notes: Boolean(internalNotes),
              },
            },
          });
        });
        written = true;
        break;
      } catch (error) {
        // Only the random BlotterUpdate / AuditLog ids can collide here.
        if (error && error.code === 'P2002') continue;
        throw error;
      }
    }

    if (!written) {
      throw new AuthError(500, 'The update could not be recorded.', 'UPDATE_FAILED');
    }

    const row = await prisma.blotterReport.findUnique({
      where: { tracking_code: code },
      select: PUBLIC_SELECT,
    });
    if (!row) return notFound();

    return jsonResponse(publicBlotterView(row));
  } catch (error) {
    return errorResponse(error);
  }
}
