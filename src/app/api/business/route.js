/**
 * BEST System - /api/business (WP-12, plan Sec. 6.4, Sec. 12.5, Sec. 13.3).
 *
 * POST - verified resident intake (in-person business clearance gateway).
 *   201 -> { id, business_name, physical_appointment_date, checklist }
 *   200 -> the SAME record when client_request_id was already used (replay).
 *   400 -> bad body, bad lengths, bad appointment date, resident_id in body.
 *   401 -> no verified resident session.
 *
 * GET - staff list (STAFF_ROLES).
 *   200 -> { items, total, page }. Staff receive the applicant's full name;
 *          encrypted business fields are never selected, decrypted or returned.
 *
 * Nothing about the request is logged. Public business views do not use this
 * staff-only handler.
 */

import { randomBytes } from 'node:crypto';

import { prisma } from '../../../lib/db.js';
import {
  AuthError,
  RESIDENT_ROLE,
  STAFF_ROLES,
  BUSINESS_APPLICANT_ROLE,
  assertNoResidentId,
  errorResponse,
  jsonResponse,
  readJsonBody,
  requireSession,
} from '../../../lib/auth.js';
import { BUSINESS_STATUSES } from '../../../lib/business/status.js';
import { BUSINESS_CHECKLIST_TEMPLATE } from '../../../lib/business/checklist.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CLIENT_REQUEST_ID = 128;
const MAX_ATTEMPTS = 6;
const PAGE_DEFAULT = 1;
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Bounded lengths for the plaintext business fields (plan Sec. 6.4 / Sec. 12.6
// server-side validation; the client caps mirror these maxLength values).
const MAX_BUSINESS_NAME_LENGTH = 200;
const MAX_NATURE_OF_BUSINESS_LENGTH = 200;
const MAX_BUSINESS_ADDRESS_LENGTH = 500;

function randomSuffix(length) {
  const bytes = randomBytes(length);
  let out = '';
  for (let index = 0; index < bytes.length; index += 1) {
    out += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return out;
}

function buildBizId() {
  return 'BIZ-2026-' + randomSuffix(4);
}

function buildChkId() {
  return 'CHK-2026-' + randomSuffix(4);
}

function clampInt(raw, fallback, min, max) {
  const parsed = Number.parseInt(String(raw === null || raw === undefined ? '' : raw), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function formatMoney(value) {
  if (value && typeof value.toFixed === 'function') return value.toFixed(2);
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

function uniqueField(error) {
  if (!error || error.code !== 'P2002') return null;
  const target = error.meta ? error.meta.target : null;
  if (Array.isArray(target) && target.length > 0) return String(target[0]);
  if (typeof target === 'string') return target;
  return '';
}

function mapChecklist(items) {
  return (items || []).map((item) => ({
    id: item.id,
    item_code: item.item_code,
    title: item.title,
    is_complied: item.is_complied,
    remarks: item.remarks === undefined ? null : item.remarks,
  }));
}

function parseFutureDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date ? value : new Date(String(value).trim());
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() <= Date.now()) return null;
  return date;
}

// ---------------------------------------------------------------------------
// POST - resident intake
// ---------------------------------------------------------------------------
export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    assertNoResidentId(body);

    const { user } = await requireSession(request, [RESIDENT_ROLE, BUSINESS_APPLICANT_ROLE]);

    const businessName = typeof body.business_name === 'string' ? body.business_name.trim() : '';
    const nature = typeof body.nature_of_business === 'string' ? body.nature_of_business.trim() : '';
    const address = typeof body.business_address === 'string' ? body.business_address.trim() : '';

    if (!businessName || !nature || !address) {
      throw new AuthError(400, 'Business name, nature and address are required.', 'BUSINESS_FIELDS_REQUIRED');
    }
    if (businessName.length > MAX_BUSINESS_NAME_LENGTH) {
      throw new AuthError(400, 'Business name is too long.', 'BUSINESS_NAME_TOO_LONG');
    }
    if (nature.length > MAX_NATURE_OF_BUSINESS_LENGTH) {
      throw new AuthError(400, 'Nature of business is too long.', 'NATURE_OF_BUSINESS_TOO_LONG');
    }
    if (address.length > MAX_BUSINESS_ADDRESS_LENGTH) {
      throw new AuthError(400, 'Business address is too long.', 'BUSINESS_ADDRESS_TOO_LONG');
    }

    const appointmentDate = parseFutureDate(body.physical_appointment_date);
    if (!appointmentDate) {
      throw new AuthError(400, 'physical_appointment_date must be a valid future date.', 'APPOINTMENT_DATE_INVALID');
    }

    const clientRequestId =
      typeof body.client_request_id === 'string' ? body.client_request_id.trim() : '';
    if (clientRequestId.length > MAX_CLIENT_REQUEST_ID) {
      throw new AuthError(400, 'client_request_id is too long.', 'CLIENT_REQUEST_ID_INVALID');
    }

    const respondWith = (row, status) =>
      jsonResponse(
        {
          id: row.id,
          business_name: row.business_name,
          physical_appointment_date: row.physical_appointment_date,
          checklist: mapChecklist(row.checklist_items),
        },
        { status },
      );

    // Offline replay: the same client_request_id answers 200 with the original
    // row, so a replay never creates a second request.
    if (clientRequestId) {
      const existing = await prisma.businessClearanceEntry.findUnique({
        where: { client_request_id: clientRequestId },
        include: { checklist_items: true },
      });
      if (existing) return respondWith(existing, 200);
    }

    let lastError = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const id = buildBizId();
      const checklistData = BUSINESS_CHECKLIST_TEMPLATE.map((item) => ({
        id: buildChkId(),
        item_code: item.item_code,
        title: item.title,
        is_complied: false,
      }));
      try {
        // Plaintext in: the Prisma field-level extension encrypts before the
        // write reaches the database (V5, plan Sec. 12.4 / Sec. 12.5).
        const created = await prisma.businessClearanceEntry.create({
          data: {
            id,
            resident_id: user.id,
            business_name: businessName,
            nature_of_business: nature,
            business_address: address,
            declared_gross_income: 0,
            physical_appointment_date: appointmentDate,
            status: 'INTAKE_SCHEDULED',
            assessed_fee: 0,
            client_request_id: clientRequestId || null,
            checklist_items: { create: checklistData },
          },
          include: { checklist_items: true },
        });
        return respondWith(created, 201);
      } catch (error) {
        const field = uniqueField(error);
        if (field === 'client_request_id') {
          const existing = await prisma.businessClearanceEntry.findUnique({
            where: { client_request_id: clientRequestId },
            include: { checklist_items: true },
          });
          if (existing) return respondWith(existing, 200);
          lastError = error;
          break;
        }
        if (field === 'id') {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError || new AuthError(500, 'A business clearance id could not be issued.', 'ID_GENERATION_FAILED');
  } catch (error) {
    return errorResponse(error);
  }
}

// ---------------------------------------------------------------------------
// GET - staff list
// ---------------------------------------------------------------------------
export async function GET(request) {
  try {
    await requireSession(request, STAFF_ROLES);

    const url = new URL(request.url);
    const status = (url.searchParams.get('status') || '').trim().toUpperCase();
    const page = clampInt(url.searchParams.get('page'), PAGE_DEFAULT, 1, 100000);
    const size = clampInt(
      url.searchParams.get('size') || url.searchParams.get('limit'),
      PAGE_SIZE_DEFAULT,
      1,
      PAGE_SIZE_MAX,
    );

    const where = {};
    if (BUSINESS_STATUSES.includes(status)) where.status = status;

    const [total, rows] = await prisma.$transaction([
      prisma.businessClearanceEntry.count({ where }),
      prisma.businessClearanceEntry.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
        // Allow-list only: encrypted business fields are never selected here.
        select: {
          id: true,
          status: true,
          physical_appointment_date: true,
          assessed_fee: true,
          declared_gross_income: true,
          owner: { select: { first_name: true, middle_name: true, last_name: true, suffix: true } },
          checklist_items: {
            select: { id: true, item_code: true, title: true, is_complied: true, remarks: true },
          },
          payment: { select: { id: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      status: row.status,
      physical_appointment_date: row.physical_appointment_date,
      assessed_fee: formatMoney(row.assessed_fee),
      declared_gross_income: formatMoney(row.declared_gross_income),
      owner_name: [row.owner.first_name, row.owner.middle_name, row.owner.last_name, row.owner.suffix]
        .filter((part) => typeof part === 'string' && part.trim())
        .map((part) => part.trim())
        .join(' '),
      has_payment: !!row.payment,
      checklist: mapChecklist(row.checklist_items),
    }));

    return jsonResponse({ items, total, page });
  } catch (error) {
    return errorResponse(error);
  }
}
