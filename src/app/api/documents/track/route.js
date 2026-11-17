/**
 * BEST System - GET /api/documents/track (WP-08, plan Sec. 6.4, Sec. 13.4).
 *
 *   200 -> { tracking_code, document_type, status, masked_name, fee_amount,
 *            created_at, pickup_advisory }
 *   404 -> { error: 'NOT_FOUND' } - the SAME answer for a malformed code and
 *          for an unknown code, so the endpoint cannot be used to enumerate
 *          tracking codes (anti-enumeration, Sec. 13.4).
 *
 * Public, masked only (NFR-01: names are J*** D**), `Cache-Control: no-store`
 * so a lookup is never cached, and no IP address is read, stored or forwarded.
 */

import { prisma } from '../../../../lib/db.js';
import { errorResponse, jsonResponse, maskName } from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A short, status specific sentence the citizen reads under the status pill.
 * @param {string} status
 * @returns {string}
 */
function pickupAdvisory(status) {
  switch (status) {
    case 'SUBMITTED':
      return 'Your request has been received. Barangay staff will open it for review shortly.';
    case 'UNDER_REVIEW':
      return 'Staff is reviewing your request. Check back once it is marked ready for pickup.';
    case 'PAYMENT_PENDING':
      return 'Please settle the fee at the barangay hall treasury counter to continue.';
    case 'READY_FOR_PICKUP':
      return 'Your document is ready. Claim it at the barangay hall and bring a valid ID.';
    case 'RELEASED':
      return 'This document has already been released to the claimant.';
    case 'REJECTED':
      return 'This request was not approved. Visit the barangay hall for the details.';
    default:
      return 'Ask barangay staff about the current status of this request.';
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    // Normalise: trim + uppercase. Anything that does not match a stored code
    // answers with the identical 404 below.
    const code = (url.searchParams.get('code') || '').trim().toUpperCase();

    let row = null;
    if (code) {
      row = await prisma.documentRequest.findUnique({
        where: { tracking_code: code },
        select: {
          tracking_code: true,
          document_type: true,
          status: true,
          fee_amount: true,
          created_at: true,
          resident: { select: { first_name: true, last_name: true } },
        },
      });
    }

    if (!row) {
      return jsonResponse({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const fee = row.fee_amount;
    const feeAmount =
      fee && typeof fee.toFixed === 'function'
        ? fee.toFixed(2)
        : Number.isFinite(Number(fee))
          ? Number(fee).toFixed(2)
          : '0.00';

    return jsonResponse({
      tracking_code: row.tracking_code,
      document_type: row.document_type,
      status: row.status,
      masked_name: maskName(row.resident.first_name, row.resident.last_name),
      fee_amount: feeAmount,
      created_at: row.created_at,
      pickup_advisory: pickupAdvisory(row.status),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
