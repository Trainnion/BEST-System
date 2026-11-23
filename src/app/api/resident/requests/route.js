/** Own request history. No resident id is accepted from the caller. */

import { prisma } from '../../../../lib/db.js';
import {
  BUSINESS_APPLICANT_ROLE,
  RESIDENT_ROLE,
  errorResponse,
  jsonResponse,
  requireSession,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

export async function GET(request) {
  try {
    const { user, cookie } = await requireSession(request, [RESIDENT_ROLE, BUSINESS_APPLICANT_ROLE]);
    const [documents, businesses] = await prisma.$transaction([
      prisma.documentRequest.findMany({
        where: { resident_id: user.id },
        orderBy: { created_at: 'desc' },
        select: {
          tracking_code: true,
          document_type: true,
          status: true,
          fee_amount: true,
          rejection_reason: true,
          created_at: true,
          updated_at: true,
          payment: { select: { id: true } },
        },
      }),
      prisma.businessClearanceEntry.findMany({
        where: { resident_id: user.id },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          status: true,
          assessed_fee: true,
          physical_appointment_date: true,
          created_at: true,
          updated_at: true,
          payment: { select: { id: true } },
        },
      }),
    ]);

    const items = [
      ...documents.map((item) => ({
        id: item.tracking_code,
        kind: 'DOCUMENT',
        document_type: item.document_type,
        status: item.status,
        fee_amount: money(item.fee_amount),
        rejection_reason: item.rejection_reason,
        appointment_date: null,
        transaction_no: item.payment?.id || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      ...businesses.map((item) => ({
        id: item.id,
        kind: 'BUSINESS_CLEARANCE',
        document_type: null,
        status: item.status,
        fee_amount: money(item.assessed_fee),
        rejection_reason: null,
        appointment_date: item.physical_appointment_date,
        transaction_no: item.payment?.id || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return jsonResponse({ items }, { status: 200, cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
