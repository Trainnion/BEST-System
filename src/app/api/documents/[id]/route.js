/**
 * BEST System - /api/documents/[id] (WP-08, plan Sec. 6.4, Sec. 12.4).
 *
 * GET  - staff detail view. Returns the request with the decrypted purpose and
 *        ctc_number plus operational metadata. Writes an AuditLog entry with
 *        action VIEW_ENCRYPTED before the answer leaves the server.
 *        200 -> { tracking_code, document_type, status, fee_amount,
 *                rejection_reason, qr_hash, purpose, ctc_number, masked_name,
 *                created_at, updated_at }
 *        401 / 403 / 404.
 *
 * PATCH - staff approve / reject / mark ready for pickup.
 *        Body: { status?, rejection_reason?, fee_amount? }
 *        200 -> operational metadata only (no purpose / ctc_number).
 *        400 / 403 / 404 / 409.
 */

import { prisma } from '../../../../lib/db.js';
import {
  AuthError,
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  maskName,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../../lib/auth.js';
import { logEncryptedView } from '../../../../lib/audit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCUMENT_STATUSES = Object.freeze([
  'SUBMITTED',
  'UNDER_REVIEW',
  'PAYMENT_PENDING',
  'READY_FOR_PICKUP',
  'RELEASED',
  'REJECTED',
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  SUBMITTED: Object.freeze(['UNDER_REVIEW', 'REJECTED']),
  UNDER_REVIEW: Object.freeze(['PAYMENT_PENDING', 'READY_FOR_PICKUP', 'REJECTED']),
  PAYMENT_PENDING: Object.freeze(['READY_FOR_PICKUP', 'REJECTED']),
  READY_FOR_PICKUP: Object.freeze(['RELEASED', 'REJECTED']),
  RELEASED: Object.freeze([]),
  REJECTED: Object.freeze([]),
});

function formatFee(value) {
  if (value && typeof value.toFixed === 'function') return value.toFixed(2);
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

function idFromParams(params) {
  return typeof params?.id === 'string' ? params.id.trim() : '';
}

// ---------------------------------------------------------------------------
// GET - staff detail (decrypts + audit)
// ---------------------------------------------------------------------------

export async function GET(request, { params }) {
  try {
    const id = idFromParams(params);
    if (!id) {
      throw new AuthError(400, 'A document id is required.', 'DOCUMENT_ID_REQUIRED');
    }

    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.DOCUMENT_REVIEW_APPROVAL);

    const row = await prisma.documentRequest.findUnique({
      where: { tracking_code: id },
      select: {
        tracking_code: true,
        document_type: true,
        status: true,
        fee_amount: true,
        purpose: true,
        ctc_number: true,
        rejection_reason: true,
        qr_hash: true,
        created_at: true,
        updated_at: true,
        resident: { select: { first_name: true, last_name: true } },
      },
    });

    if (!row) {
      throw new AuthError(404, 'That document could not be found.', 'DOCUMENT_NOT_FOUND');
    }

    // Audit the encrypted read BEFORE the plaintext leaves the server.
    await logEncryptedView({
      userId: user.id,
      model: 'DocumentRequest',
      targetId: id,
      fields: ['purpose', 'ctc_number'],
    });

    return jsonResponse({
      tracking_code: row.tracking_code,
      document_type: row.document_type,
      status: row.status,
      fee_amount: formatFee(row.fee_amount),
      purpose: row.purpose,
      ctc_number: row.ctc_number,
      rejection_reason: row.rejection_reason,
      qr_hash: row.qr_hash,
      masked_name: maskName(row.resident.first_name, row.resident.last_name),
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH - approve / reject / ready for pickup
// ---------------------------------------------------------------------------

export async function PATCH(request, { params }) {
  try {
    const id = idFromParams(params);
    if (!id) {
      throw new AuthError(400, 'A document id is required.', 'DOCUMENT_ID_REQUIRED');
    }

    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.DOCUMENT_REVIEW_APPROVAL);

    const body = await readJsonBody(request);

    const existing = await prisma.documentRequest.findUnique({
      where: { tracking_code: id },
      select: {
        tracking_code: true,
        status: true,
        fee_amount: true,
        rejection_reason: true,
        payment: { select: { id: true } },
      },
    });
    if (!existing) {
      throw new AuthError(404, 'That document could not be found.', 'DOCUMENT_NOT_FOUND');
    }

    // --- status ---
    const requestedStatus =
      body.status === undefined || body.status === null || body.status === ''
        ? null
        : String(body.status).trim().toUpperCase();

    if (requestedStatus !== null && !DOCUMENT_STATUSES.includes(requestedStatus)) {
      throw new AuthError(400, 'Unknown document status.', 'STATUS_INVALID');
    }
    if (
      requestedStatus !== null &&
      requestedStatus !== existing.status &&
      !ALLOWED_TRANSITIONS[existing.status].includes(requestedStatus)
    ) {
      throw new AuthError(409, 'That status transition is not allowed.', 'STATUS_TRANSITION_INVALID');
    }

    // --- rejection_reason ---
    let newRejectionReason = existing.rejection_reason;
    let hasRejectionReason = false;
    if (body.rejection_reason !== undefined) {
      hasRejectionReason = true;
      if (body.rejection_reason === null || body.rejection_reason === '') {
        newRejectionReason = null;
      } else if (typeof body.rejection_reason !== 'string') {
        throw new AuthError(400, 'rejection_reason must be a string.', 'REJECTION_REASON_INVALID');
      } else {
        const trimmed = body.rejection_reason.trim();
        if (trimmed.length > 500) {
          throw new AuthError(400, 'rejection_reason is too long.', 'REJECTION_REASON_INVALID');
        }
        newRejectionReason = trimmed || null;
      }
    }
    if (requestedStatus === 'REJECTED' && !newRejectionReason) {
      throw new AuthError(400, 'rejection_reason is required when rejecting.', 'REJECTION_REASON_REQUIRED');
    }

    // --- fee_amount ---
    let newFee = Number(existing.fee_amount);
    let hasFee = false;
    if (body.fee_amount !== undefined) {
      hasFee = true;
      const value = Number(body.fee_amount);
      if (!Number.isFinite(value) || value < 0) {
        throw new AuthError(400, 'fee_amount must be a number >= 0.', 'FEE_INVALID');
      }
      newFee = value;
    }

    const updateData = {};
    // A fee-bearing document may not be marked ready for pickup until the
    // Treasurer has recorded its payment (plan line 216: PAYMENT_PENDING ->
    // PAID -> READY_FOR_PICKUP). Zero-fee indigency skips this branch.
    if (
      requestedStatus === 'READY_FOR_PICKUP' &&
      Number(newFee) > 0 &&
      !existing.payment
    ) {
      throw new AuthError(
        409,
        'Payment must be recorded before the document is marked ready for pickup.',
        'PAYMENT_REQUIRED',
      );
    }
    if (requestedStatus !== null) updateData.status = requestedStatus;
    if (hasRejectionReason) updateData.rejection_reason = newRejectionReason;
    if (hasFee) updateData.fee_amount = newFee;
    // Track the reviewer on any status change.
    if (requestedStatus !== null && requestedStatus !== existing.status) {
      updateData.reviewed_by_id = user.id;
    }

    await prisma.documentRequest.update({
      where: { tracking_code: id },
      data: updateData,
    });

    const finalStatus = requestedStatus !== null ? requestedStatus : existing.status;

    await prisma.auditLog.create({
      data: {
        id: randomId('LOG'),
        user_id: user.id,
        action: 'UPDATE_DOCUMENT',
        target_entity: 'DocumentRequest',
        target_id: id,
        metadata: { status: finalStatus },
      },
    });

    const updated = await prisma.documentRequest.findUnique({
      where: { tracking_code: id },
      select: {
        tracking_code: true,
        document_type: true,
        status: true,
        fee_amount: true,
        rejection_reason: true,
        created_at: true,
        updated_at: true,
      },
    });

    return jsonResponse({
      success: true,
      document: {
        tracking_code: updated.tracking_code,
        document_type: updated.document_type,
        status: updated.status,
        fee_amount: formatFee(updated.fee_amount),
        rejection_reason: updated.rejection_reason,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}