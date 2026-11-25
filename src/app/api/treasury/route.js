/**
 * BEST System - GET /api/treasury (WP-13).
 * Treasurer/Admin queue: payable documents, payable businesses, recent payments.
 * Full names are returned only to authorized staff; public tracking stays masked.
 * no-store.
 */

import { prisma } from '../../../lib/db.js';
import {
  STAFF_ROLES,
  can,
  errorResponse,
  jsonResponse,
  requireSession,
  PERMISSIONS,
} from '../../../lib/auth.js';
import { formatMoney } from '../../../lib/treasury/helpers.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAllowed(role) {
  return role === 'TREASURER' || role === 'ADMIN';
}

export async function GET(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    if (!isAllowed(user.role) || !can(user.role, PERMISSIONS.RECORD_FEE_SETTLEMENT)) {
      return jsonResponse({ error: 'ROLE_FORBIDDEN', message: 'Your role may not use this endpoint.' }, { status: 403 });
    }

    const [documents, businesses, payments] = await prisma.$transaction([
      prisma.documentRequest.findMany({
        where: { status: 'PAYMENT_PENDING', payment: null },
        orderBy: { created_at: 'asc' },
        select: {
          tracking_code: true,
          document_type: true,
          fee_amount: true,
          created_at: true,
          resident: { select: { first_name: true, middle_name: true, last_name: true, suffix: true } },
        },
      }),
      prisma.businessClearanceEntry.findMany({
        where: { status: 'APPROVED', payment: null },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          assessed_fee: true,
          status: true,
          physical_appointment_date: true,
          owner: { select: { first_name: true, middle_name: true, last_name: true, suffix: true } },
        },
      }),
      prisma.paymentRecord.findMany({
        orderBy: { collected_at: 'desc' },
        take: 20,
        select: {
          id: true,
          receipt_or_no: true,
          payment_reference_no: true,
          amount: true,
          payment_method: true,
          collected_at: true,
          document_request_id: true,
          business_clearance_id: true,
        },
      }),
    ]);

    const payable_documents = documents.map((row) => ({
      tracking_code: row.tracking_code,
      document_type: row.document_type,
      fee_amount: formatMoney(row.fee_amount),
      resident_name: fullName(row.resident),
      created_at: row.created_at,
    }));

    const payable_businesses = businesses.map((row) => ({
      id: row.id,
      owner_name: fullName(row.owner),
      assessed_fee: formatMoney(row.assessed_fee),
      status: row.status,
      physical_appointment_date: row.physical_appointment_date,
    }));

    const recent_payments = payments.map((row) => ({
      id: row.id,
      transaction_no: row.id,
      official_receipt_no: row.receipt_or_no,
      payment_reference_no: row.payment_reference_no,
      amount: formatMoney(row.amount),
      payment_method: row.payment_method,
      collected_at: row.collected_at,
      target_type: row.document_request_id ? 'DOCUMENT_REQUEST' : 'BUSINESS_CLEARANCE',
      target_id: row.document_request_id || row.business_clearance_id,
    }));

    return jsonResponse({ payable_documents, payable_businesses, recent_payments }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

function fullName(person) {
  return [person?.first_name, person?.middle_name, person?.last_name, person?.suffix]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim())
    .join(' ');
}
