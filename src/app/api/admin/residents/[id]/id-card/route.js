/** Staff/Admin digital ID issuance and maintenance. Cards remain view-only. */

import { prisma } from '../../../../../../lib/db.js';
import {
  PERMISSIONS,
  errorResponse,
  jsonResponse,
  randomId,
  readJsonBody,
  requirePermission,
  requireSession,
} from '../../../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CARD_STATUSES = new Set(['ACTIVE', 'EXPIRED', 'REVOKED']);

function parseDateInput(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // The barangay is in UTC+8; keep the selected date valid through its local day.
  const date = new Date(`${value}T15:59:59.999Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

function dateOnly(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : null;
}

function cardResponse(card) {
  return {
    id: card.id,
    card_number: card.card_number,
    status: card.status,
    issued_date: dateOnly(card.issued_date),
    valid_until: dateOnly(card.valid_until),
  };
}

function cardConflict() {
  return jsonResponse(
    { error: 'CARD_ALREADY_EXISTS', message: 'This resident already has a digital ID. Refresh the list and edit the existing card.' },
    { status: 409 },
  );
}

export async function POST(request, context) {
  try {
    const { user } = await requireSession(request, ['STAFF', 'ADMIN']);
    requirePermission(user.role, PERMISSIONS.MANAGE_ID_CARDS);

    const residentId = typeof context?.params?.id === 'string' ? context.params.id.trim() : '';
    if (!residentId) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Resident ID is required.' }, { status: 400 });
    }

    const body = await readJsonBody(request);
    const validUntil = parseDateInput(body.valid_until);
    if (!validUntil || validUntil <= new Date()) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Choose a valid future expiration date.' }, { status: 400 });
    }

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, is_verified: true },
    });
    if (!resident) {
      return jsonResponse({ error: 'NOT_FOUND', message: 'Resident not found.' }, { status: 404 });
    }
    if (!resident.is_verified) {
      return jsonResponse({ error: 'RESIDENT_NOT_VERIFIED', message: 'Verify this resident before issuing a digital ID.' }, { status: 409 });
    }

    const existing = await prisma.barangayIDCard.findUnique({
      where: { resident_id: residentId },
      select: { id: true },
    });
    if (existing) return cardConflict();

    const year = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
    }).format(new Date());
    const suffix = randomId('CARD').slice('CARD-'.length);
    const cardId = `BID-${year}-${suffix}`;
    const cardNumber = `DID-${year}-${suffix}`;

    try {
      const card = await prisma.$transaction(async (tx) => {
        const created = await tx.barangayIDCard.create({
          data: {
            id: cardId,
            resident_id: residentId,
            card_number: cardNumber,
            barcode_data: `BEST-${cardNumber}`,
            issued_date: new Date(),
            valid_until: validUntil,
            status: 'ACTIVE',
          },
        });
        await tx.auditLog.create({
          data: {
            id: randomId('LOG'),
            user_id: user.id,
            action: 'ISSUE_DIGITAL_ID',
            target_entity: 'BarangayIDCard',
            target_id: created.id,
            metadata: { resident_id: residentId, card_number: cardNumber, status: 'ACTIVE' },
          },
        });
        return created;
      });

      return jsonResponse({ success: true, card: cardResponse(card) }, { status: 201 });
    } catch (error) {
      if (error?.code === 'P2002') return cardConflict();
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request, context) {
  try {
    const { user } = await requireSession(request, ['STAFF', 'ADMIN']);
    requirePermission(user.role, PERMISSIONS.MANAGE_ID_CARDS);

    const residentId = typeof context?.params?.id === 'string' ? context.params.id.trim() : '';
    if (!residentId) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Resident ID is required.' }, { status: 400 });
    }

    const body = await readJsonBody(request);
    const data = {};
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
      if (!CARD_STATUSES.has(status)) {
        return jsonResponse({ error: 'BAD_INPUT', message: 'Choose Active, Expired, or Revoked.' }, { status: 400 });
      }
      data.status = status;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'valid_until')) {
      const validUntil = parseDateInput(body.valid_until);
      if (!validUntil) {
        return jsonResponse({ error: 'BAD_INPUT', message: 'Choose a valid expiration date.' }, { status: 400 });
      }
      data.valid_until = validUntil;
    }
    if (Object.keys(data).length === 0) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'Choose a status or expiration date to update.' }, { status: 400 });
    }

    const existing = await prisma.barangayIDCard.findUnique({ where: { resident_id: residentId } });
    if (!existing) {
      return jsonResponse({ error: 'NOT_FOUND', message: 'No digital ID has been issued to this resident yet.' }, { status: 404 });
    }

    const validUntil = data.valid_until || existing.valid_until;
    const status = data.status || existing.status;
    if (validUntil < existing.issued_date) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'The expiration date cannot be before the issue date.' }, { status: 400 });
    }
    if (status === 'ACTIVE' && validUntil <= new Date()) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'An expired card cannot be marked Active. Choose a future expiration date.' }, { status: 400 });
    }
    if (status === 'EXPIRED' && validUntil > new Date()) {
      return jsonResponse({ error: 'BAD_INPUT', message: 'An Expired card must have an expiration date in the past. Use Revoked to disable a card early.' }, { status: 400 });
    }

    const card = await prisma.$transaction(async (tx) => {
      const updated = await tx.barangayIDCard.update({
        where: { resident_id: residentId },
        data,
      });
      await tx.auditLog.create({
        data: {
          id: randomId('LOG'),
          user_id: user.id,
          action: 'UPDATE_DIGITAL_ID',
          target_entity: 'BarangayIDCard',
          target_id: updated.id,
          metadata: {
            status: updated.status,
            valid_until: dateOnly(updated.valid_until),
          },
        },
      });
      return updated;
    });

    return jsonResponse({ success: true, card: cardResponse(card) });
  } catch (error) {
    return errorResponse(error);
  }
}
