/**
 * BEST System - POST /api/documents/assisted (plan Sec. 6.4, Sec. 6.5, Sec. 13.3).
 *
 * Assisted walk-in document intake by staff/admin.
 * Requires STAFF or ADMIN session with ASSISTED_INTAKE permission.
 * Unlike resident self-intake, this explicitly takes resident_id because
 * staff is physically verifying the resident in person.
 */

import { createHmac, randomBytes } from 'node:crypto';
import { prisma } from '../../../../lib/db.js';
import {
  AuthError,
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  readJsonBody,
  requirePermission,
  requireSession,
  PERMISSIONS,
} from '../../../../lib/auth.js';
import { buildAuditId } from '../../../../lib/audit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCUMENT_TYPES = Object.freeze(['CLEARANCE', 'INDIGENCY']);
const FEE_BY_TYPE = Object.freeze({ CLEARANCE: 50, INDIGENCY: 0 });
const TRACKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const TRACKING_YEAR = '2026';

function randomSuffix() {
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += TRACKING_ALPHABET[bytes[i] % TRACKING_ALPHABET.length];
  }
  return out;
}

function buildTrackingCode(documentType) {
  const prefix = documentType === 'INDIGENCY' ? 'IND' : 'CLR';
  return `${prefix}-${TRACKING_YEAR}-${randomSuffix()}`;
}

function hmacHex(secret, trackingCode) {
  return createHmac('sha256', secret).update(trackingCode, 'utf8').digest('hex');
}

export async function POST(request) {
  try {
    const { user } = await requireSession(request, STAFF_ROLES);
    requirePermission(user.role, PERMISSIONS.ASSISTED_INTAKE);

    const body = await readJsonBody(request);
    const residentId = (body.resident_id || '').trim();
    const documentType = (body.document_type || '').trim().toUpperCase();
    const purpose = (body.purpose || '').trim();
    const ctcNumber = body.ctc_number ? String(body.ctc_number).trim() : null;

    if (!residentId) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Resident ID is required.' }, { status: 400 });
    }
    if (!DOCUMENT_TYPES.includes(documentType)) {
      return jsonResponse(
        { error: 'BAD_INPUT', message: 'document_type must be CLEARANCE or INDIGENCY.' },
        { status: 400 },
      );
    }
    if (!purpose || purpose.length < 5) {
      return jsonResponse(
        { error: 'BAD_INPUT', message: 'Purpose is required (minimum 5 characters).' },
        { status: 400 },
      );
    }

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, first_name: true, last_name: true },
    });
    if (!resident) {
      return jsonResponse({ error: 'NOT_FOUND', message: 'Resident not found.' }, { status: 404 });
    }

    const secret = process.env.QR_HMAC_SECRET;
    if (!secret || secret.trim().length < 32) {
      return jsonResponse({ error: 'CONFIG_MISSING', message: 'QR HMAC key is not configured.' }, { status: 503 });
    }

    const feeAmount = FEE_BY_TYPE[documentType] ?? 50;

    let createdDoc = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const trackingCode = buildTrackingCode(documentType);
      const qrHash = hmacHex(secret.trim(), trackingCode);

      try {
        createdDoc = await prisma.$transaction(async (tx) => {
          const doc = await tx.DocumentRequest.create({
            data: {
              tracking_code: trackingCode,
              resident_id: resident.id,
              document_type: documentType,
              purpose, // Prisma extension encrypts at rest
              ctc_number: ctcNumber, // Prisma extension encrypts at rest
              fee_amount: feeAmount,
              qr_hash: qrHash,
              status: 'UNDER_REVIEW', // Assisted intake is already in front of staff
            },
          });

          await tx.auditLog.create({
            data: {
              id: buildAuditId(),
              user_id: user.id,
              action: 'ASSISTED_INTAKE',
              target_entity: 'DocumentRequest',
              target_id: trackingCode,
              metadata: {
                resident_id: resident.id,
                document_type: documentType,
              },
            },
          });

          return doc;
        });
        break;
      } catch (err) {
        if (err && err.code === 'P2002') continue;
        throw err;
      }
    }

    if (!createdDoc) {
      return jsonResponse({ error: 'GENERATE_FAILED', message: 'Could not allocate tracking code.' }, { status: 500 });
    }

    return jsonResponse(
      {
        success: true,
        tracking_code: createdDoc.tracking_code,
        fee_amount: feeAmount.toFixed(2),
        qr_hash: createdDoc.qr_hash,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
