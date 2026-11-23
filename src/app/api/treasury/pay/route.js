/**
 * BEST System - POST /api/treasury/pay (WP-13).
 * Counter fee settlement: BEST transaction number and PaymentRecord creation.
 * Decision 1: document becomes READY_FOR_PICKUP (PAID == PaymentRecord exists),
 * business stays APPROVED.
 */

import { prisma } from '../../../../lib/db.js';
import {
  AuthError,
  PERMISSIONS,
  can,
  errorResponse,
  jsonResponse,
  readJsonBody,
  requireSession,
  STAFF_ROLES,
} from '../../../../lib/auth.js';
import {
  MAX_ID_ATTEMPTS,
  amountsEqual,
  asTrimmedString,
  buildLogId,
  buildPaymentId,
  decimalToNumber,
  formatMoney,
  isValidGcashReference,
  isValidPaymentMethod,
  normalizeGcashReference,
  normalizePaymentMethod,
  parseAmount,
  uniqueField,
} from '../../../../lib/treasury/helpers.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function badRequest(code, message) {
  return jsonResponse({ error: code, message }, { status: 400 });
}

function conflict(code, message) {
  return jsonResponse({ error: code, message }, { status: 409 });
}

export async function POST(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    if (!can(user.role, PERMISSIONS.RECORD_FEE_SETTLEMENT)) {
      throw new AuthError(403, 'Your role may not use this endpoint.', 'ROLE_FORBIDDEN');
    }

    const body = await readJsonBody(request);
    const documentId = typeof body.document_request_id === 'string' ? body.document_request_id.trim() : '';
    const businessId = typeof body.business_clearance_id === 'string' ? body.business_clearance_id.trim() : '';

    if (!!documentId === !!businessId) {
      return badRequest('TARGET_REQUIRED', 'Provide exactly one of document_request_id or business_clearance_id.');
    }

    const paymentMethod = normalizePaymentMethod(body.payment_method);
    if (!isValidPaymentMethod(paymentMethod)) {
      return badRequest('PAYMENT_METHOD_INVALID', 'payment_method must be CASH or GCASH_MOCK.');
    }

    const gcashReferenceNo = normalizeGcashReference(body.gcash_reference_no);
    if (paymentMethod === 'GCASH_MOCK' && !isValidGcashReference(gcashReferenceNo)) {
      return badRequest('GCASH_REFERENCE_INVALID', 'Provide a GCash reference number using 6-40 letters, numbers, or hyphens.');
    }
    if (paymentMethod === 'CASH' && gcashReferenceNo) {
      return badRequest('GCASH_REFERENCE_NOT_APPLICABLE', 'A GCash reference number can only be provided for GCash payments.');
    }

    const amount = parseAmount(body.amount);
    if (amount == null || !(amount > 0)) {
      return badRequest('AMOUNT_INVALID', 'amount must be greater than 0.');
    }

    const remarks = asTrimmedString(body.remarks, 500) || null;
    const targetEntity = documentId ? 'DOCUMENT_REQUEST' : 'BUSINESS_CLEARANCE';
    const targetId = documentId || businessId;

    let lastError = null;
    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
      const paymentId = buildPaymentId();
      try {
        const result = await prisma.$transaction(async (tx) => {
          if (documentId) {
            const doc = await tx.documentRequest.findUnique({
              where: { tracking_code: documentId },
              select: { tracking_code: true, status: true, fee_amount: true, payment: { select: { id: true } } },
            });
            if (!doc) {
              return { kind: 'error', response: badRequest('TARGET_NOT_FOUND', 'Document request was not found.') };
            }
            if (doc.payment || doc.status === 'READY_FOR_PICKUP' || doc.status === 'RELEASED') {
              return { kind: 'error', response: conflict('ALREADY_PAID', 'This document already has a payment record.') };
            }
            if (doc.status !== 'PAYMENT_PENDING') {
              return { kind: 'error', response: conflict('INVALID_STATE', 'Document must be PAYMENT_PENDING before settlement.') };
            }
            const expected = decimalToNumber(doc.fee_amount);
            if (!amountsEqual(amount, expected)) {
              return { kind: 'error', response: badRequest('AMOUNT_MISMATCH', 'amount must exactly equal the target fee.') };
            }

            const payment = await tx.paymentRecord.create({
              data: {
                id: paymentId,
                document_request_id: doc.tracking_code,
                amount: expected,
                gcash_reference_no: gcashReferenceNo || null,
                payment_method: paymentMethod,
                collected_by_id: user.id,
                remarks,
              },
            });
            await tx.documentRequest.update({
              where: { tracking_code: doc.tracking_code },
              data: { status: 'READY_FOR_PICKUP' },
            });
            await tx.auditLog.create({
              data: {
                id: buildLogId(),
                user_id: user.id,
                action: 'RECORD_PAYMENT',
                target_entity: targetEntity,
                target_id: targetId,
                metadata: { payment_id: payment.id, transaction_no: payment.id, amount: formatMoney(expected) },
                ip_address: null,
              },
            });
            return {
              kind: 'ok',
              payment,
              target_status: 'READY_FOR_PICKUP',
              target_type: targetEntity,
              target_id: targetId,
            };
          }

          const biz = await tx.businessClearanceEntry.findUnique({
            where: { id: businessId },
            select: { id: true, status: true, assessed_fee: true, payment: { select: { id: true } } },
          });
          if (!biz) {
            return { kind: 'error', response: badRequest('TARGET_NOT_FOUND', 'Business clearance was not found.') };
          }
          if (biz.payment) {
            return { kind: 'error', response: conflict('ALREADY_PAID', 'This business clearance already has a payment record.') };
          }
          if (biz.status !== 'APPROVED') {
            return { kind: 'error', response: conflict('INVALID_STATE', 'Business clearance must be APPROVED before settlement.') };
          }
          const expected = decimalToNumber(biz.assessed_fee);
          if (!amountsEqual(amount, expected)) {
            return { kind: 'error', response: badRequest('AMOUNT_MISMATCH', 'amount must exactly equal the target fee.') };
          }

          const payment = await tx.paymentRecord.create({
            data: {
              id: paymentId,
              business_clearance_id: biz.id,
              amount: expected,
              gcash_reference_no: gcashReferenceNo || null,
              payment_method: paymentMethod,
              collected_by_id: user.id,
              remarks,
            },
          });
          await tx.auditLog.create({
            data: {
              id: buildLogId(),
              user_id: user.id,
              action: 'RECORD_PAYMENT',
              target_entity: targetEntity,
              target_id: targetId,
              metadata: { payment_id: payment.id, transaction_no: payment.id, amount: formatMoney(expected) },
              ip_address: null,
            },
          });
          return {
            kind: 'ok',
            payment,
            target_status: 'APPROVED',
            target_type: targetEntity,
            target_id: targetId,
          };
        });

        if (result.kind === 'error') return result.response;

        const payment = result.payment;
        return jsonResponse(
          {
            success: true,
            payment: {
              id: payment.id,
              transaction_no: payment.id,
              gcash_reference_no: payment.gcash_reference_no,
              amount: formatMoney(payment.amount),
              payment_method: payment.payment_method,
              collected_at: payment.collected_at,
              target_type: result.target_type,
              target_id: result.target_id,
            },
            target_status: result.target_status,
          },
          { status: 201 },
        );
      } catch (error) {
        const field = uniqueField(error);
        if (field === 'gcash_reference_no') {
          return conflict('GCASH_REFERENCE_ALREADY_USED', 'That GCash reference number is already recorded.');
        }
        if (field === 'document_request_id' || field === 'business_clearance_id') {
          return conflict('ALREADY_PAID', 'This target already has a payment record.');
        }
        if (field === 'id' || field === '') {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError || new AuthError(500, 'Could not record the payment.', 'PAYMENT_CREATE_FAILED');
  } catch (error) {
    return errorResponse(error);
  }
}
