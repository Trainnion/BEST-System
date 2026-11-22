/**
 * BEST System - /api/business/[id] (WP-12, plan Sec. 6.4, Sec. 12.5, Sec. 6.5).
 *
 * GET - staff detail (Treasurer / Admin via the assessment permission).
 *   The top level row is fetched and the server field-level extension decrypts
 *   business_name / nature_of_business / business_address (V5). The read is
 *   audited with AuditLog action VIEW_ENCRYPTED before the plaintext is sent
 *   back; only field names are stored in the metadata, never the values.
 *   Full detail, checklist included.
 *
 * PATCH - Treasurer / Admin assessment of the in-person screening.
 *   Body: { checklist_items?: [{id,is_complied,remarks}], declared_gross_income?,
 *           assessed_fee?, status?, assessment_notes? }
 *   200 -> { success: true, business: { id,status,assessed_fee,declared_gross_income,
 *            assessment_notes, checklist } }
 *   400 -> bad body / bad values / unknown checklist item / disallowed status.
 *   401 -> no session, 403 -> role not allowed (Staff must get 403).
 *   404 -> business not found.
 *   409 -> disallowed status transition or unmet assessment requirements.
 *
 * Nothing is approved automatically. The Treasurer records the in-person
 * screening as TREASURER_ASSESSED, then explicitly approves or rejects the
 * application at the counter. APPROVED additionally requires the recorded
 * income, fee, notes and a fully complied checklist (plan Phase 5 gate).
 *
 * The endpoint records the in-person screening outcome and the Treasurer's
 * explicit counter decision (plan Sec. 6.1 maps REVENUE_ASSESSED /
 * INSPECTION_VERIFIED to TREASURER_ASSESSED). Nothing is approved by an
 * automated process; every write below is an authenticated Treasurer/Admin
 * action after the face-to-face assessment.
 *
 * The answer never carries the encrypted fields back; it returns operational
 * metadata plus the checklist.
 */

import { prisma } from '../../../../lib/db.js';
import {
  AuthError,
  STAFF_ROLES,
  errorResponse,
  jsonResponse,
  readJsonBody,
  requireSession,
  can,
  PERMISSIONS,
  randomId,
} from '../../../../lib/auth.js';
import { BUSINESS_STATUSES, canTransitionBusinessStatus } from '../../../../lib/business/status.js';
import { logEncryptedView } from '../../../../lib/audit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatMoney(value) {
  if (value && typeof value.toFixed === 'function') return value.toFixed(2);
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
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

// ---------------------------------------------------------------------------
// GET - staff detail (decrypt + audit before returning)
// ---------------------------------------------------------------------------
export async function GET(request, { params }) {
  try {
    const id = typeof params?.id === 'string' ? params.id.trim() : '';
    if (!id) {
      throw new AuthError(400, 'A business id is required.', 'BUSINESS_ID_REQUIRED');
    }

    const { user } = await requireSession(request, STAFF_ROLES);
    if (!can(user.role, PERMISSIONS.ASSESS_BUSINESS_INCOME)) {
      throw new AuthError(403, 'Your role may not use this endpoint.', 'PERMISSION_FORBIDDEN');
    }

    const entry = await prisma.businessClearanceEntry.findUnique({
      where: { id },
      include: { checklist_items: true },
    });
    if (!entry) {
      throw new AuthError(404, 'That business clearance could not be found.', 'BUSINESS_NOT_FOUND');
    }

    // Audit the encrypted read: action VIEW_ENCRYPTED, metadata holds field
    // names only. The plaintext is never logged.
    await logEncryptedView({
      userId: user.id,
      model: 'BusinessClearanceEntry',
      targetId: id,
      fields: ['business_name', 'nature_of_business', 'business_address'],
    });

    return jsonResponse({
      id: entry.id,
      status: entry.status,
      physical_appointment_date: entry.physical_appointment_date,
      declared_gross_income: formatMoney(entry.declared_gross_income),
      assessed_fee: formatMoney(entry.assessed_fee),
      assessment_notes: entry.assessment_notes,
      business_name: entry.business_name,
      nature_of_business: entry.nature_of_business,
      business_address: entry.business_address,
      checklist: mapChecklist(entry.checklist_items),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH - Treasurer assessment of the in-person screening
// ---------------------------------------------------------------------------
export async function PATCH(request, { params }) {
  try {
    const id = typeof params?.id === 'string' ? params.id.trim() : '';
    if (!id) {
      throw new AuthError(400, 'A business id is required.', 'BUSINESS_ID_REQUIRED');
    }

    const { user } = await requireSession(request, ['TREASURER', 'ADMIN']);
    if (!can(user.role, PERMISSIONS.ASSESS_BUSINESS_INCOME)) {
      throw new AuthError(403, 'Your role may not use this endpoint.', 'PERMISSION_FORBIDDEN');
    }

    const body = await readJsonBody(request);

    const existing = await prisma.businessClearanceEntry.findUnique({
      where: { id },
      include: { checklist_items: true },
    });
    if (!existing) {
      throw new AuthError(404, 'That business clearance could not be found.', 'BUSINESS_NOT_FOUND');
    }

    // --- declared_gross_income ---
    let newIncome = Number(existing.declared_gross_income);
    let hasIncome = false;
    if (body.declared_gross_income !== undefined) {
      hasIncome = true;
      const value = Number(body.declared_gross_income);
      if (!Number.isFinite(value) || value < 0) {
        throw new AuthError(400, 'declared_gross_income must be a number >= 0.', 'INCOME_INVALID');
      }
      newIncome = value;
    }

    // --- assessed_fee ---
    let newFee = Number(existing.assessed_fee);
    let hasFee = false;
    if (body.assessed_fee !== undefined) {
      hasFee = true;
      const value = Number(body.assessed_fee);
      if (!Number.isFinite(value) || value < 0) {
        throw new AuthError(400, 'assessed_fee must be a number >= 0.', 'FEE_INVALID');
      }
      newFee = value;
    }

    // --- assessment_notes ---
    let newNotes = existing.assessment_notes;
    let hasNotes = false;
    if (body.assessment_notes !== undefined) {
      hasNotes = true;
      if (typeof body.assessment_notes !== 'string') {
        throw new AuthError(400, 'assessment_notes must be a string.', 'NOTES_INVALID');
      }
      newNotes = body.assessment_notes.trim();
      if (newNotes === '') {
        throw new AuthError(400, 'assessment_notes must not be empty.', 'NOTES_INVALID');
      }
    }

    // --- checklist_items ---
    const checklistUpdates = Array.isArray(body.checklist_items) ? body.checklist_items : [];
    if (body.checklist_items !== undefined && !Array.isArray(body.checklist_items)) {
      throw new AuthError(400, 'checklist_items must be an array.', 'CHECKLIST_INVALID');
    }
    for (const item of checklistUpdates) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new AuthError(400, 'Each checklist item must be an object.', 'CHECKLIST_INVALID');
      }
      if (typeof item.id !== 'string' || !item.id.trim()) {
        throw new AuthError(400, 'Each checklist item requires an id.', 'CHECKLIST_INVALID');
      }
      if (item.is_complied !== undefined && typeof item.is_complied !== 'boolean') {
        throw new AuthError(400, 'is_complied must be a boolean.', 'CHECKLIST_INVALID');
      }
      if (item.remarks !== undefined && item.remarks !== null && typeof item.remarks !== 'string') {
        throw new AuthError(400, 'remarks must be a string or null.', 'CHECKLIST_INVALID');
      }
      const match = existing.checklist_items.find((c) => c.id === item.id.trim());
      if (!match) {
        throw new AuthError(400, 'Unknown checklist item id.', 'CHECKLIST_ITEM_NOT_FOUND');
      }
    }

    // --- status: the Treasurer records the in-person screening and the
    // counter decision. Nothing is set automatically, and the transition map
    // rejects skips or moves backwards.
    let requestedStatus = null;
    const statusProvided = body.status !== undefined && body.status !== null && body.status !== '';
    if (statusProvided) {
      requestedStatus = String(body.status).trim().toUpperCase();
      if (!BUSINESS_STATUSES.includes(requestedStatus)) {
        throw new AuthError(400, 'Unknown business status.', 'STATUS_INVALID');
      }
      if (!canTransitionBusinessStatus(existing.status, requestedStatus)) {
        throw new AuthError(409, 'That status transition is not allowed.', 'STATUS_TRANSITION_INVALID');
      }
    }

    const assessmentSubmitted = hasIncome || hasFee || hasNotes || checklistUpdates.length > 0;
    const finalStatus =
      requestedStatus !== null ? requestedStatus : assessmentSubmitted ? 'TREASURER_ASSESSED' : existing.status;

    if (finalStatus !== existing.status) {
      if (!canTransitionBusinessStatus(existing.status, finalStatus)) {
        throw new AuthError(409, 'That status transition is not allowed.', 'STATUS_TRANSITION_INVALID');
      }
      if (finalStatus === 'TREASURER_ASSESSED') {
        if (
          !Number.isFinite(newIncome) ||
          newIncome < 0 ||
          !Number.isFinite(newFee) ||
          newFee < 0 ||
          !newNotes
        ) {
          throw new AuthError(409, 'Income, fee and notes are required for the in-person screening.', 'ASSESSMENT_INCOMPLETE');
        }
      }
      if (finalStatus === 'APPROVED') {
        // Approval is only the Treasurer's counter decision after the
        // face-to-face assessment: the assessment core must already exist and
        // every checklist item must be complied. Merge pending checklist
        // edits so an approval cannot race a just-cleared requirement.
        const mergedChecklist = (existing.checklist_items || []).map((item) => {
          const patch = checklistUpdates.find((update) => update.id.trim() === item.id);
          return {
            is_complied:
              patch && patch.is_complied !== undefined ? patch.is_complied : item.is_complied,
          };
        });
        const complete =
          Number.isFinite(newIncome) &&
          newIncome >= 0 &&
          Number.isFinite(newFee) &&
          newFee >= 0 &&
          typeof newNotes === 'string' &&
          newNotes.trim() !== '' &&
          typeof existing.assessed_by_id === 'string' &&
          existing.assessed_by_id.trim() !== '' &&
          mergedChecklist.length > 0 &&
          mergedChecklist.every((item) => item.is_complied === true);
        if (!complete) {
          throw new AuthError(
            409,
            'Approval requires the recorded assessment and a fully complied checklist.',
            'APPROVAL_REQUIREMENTS_UNMET',
          );
        }
      }
    }

    // Apply checklist updates.
    const now = new Date();
    for (const item of checklistUpdates) {
      const itemId = item.id.trim();
      const updateData = {
        verified_by_id: user.id,
        verified_at: now,
      };
      if (item.is_complied !== undefined) updateData.is_complied = item.is_complied;
      if (item.remarks !== undefined) updateData.remarks = item.remarks === null ? null : String(item.remarks);
      await prisma.businessChecklistItem.update({
        where: { id: itemId },
        data: updateData,
      });
    }

    // Apply business updates.
    const updateData = {};
    if (hasIncome) updateData.declared_gross_income = newIncome;
    if (hasFee) updateData.assessed_fee = newFee;
    if (hasNotes) updateData.assessment_notes = newNotes;
    if (finalStatus !== existing.status) {
      updateData.status = finalStatus;
    }
    const isAssessmentAction = assessmentSubmitted || finalStatus === 'TREASURER_ASSESSED';
    if (isAssessmentAction) {
      updateData.assessed_by_id = user.id;
    }

    await prisma.businessClearanceEntry.update({
      where: { id },
      data: updateData,
    });

    const finalRecordedStatus = finalStatus;

    // Audit log: action ASSESS_BUSINESS, target BIZ id, metadata status only.
    await prisma.auditLog.create({
      data: {
        id: randomId('LOG'),
        user_id: user.id,
        action: 'ASSESS_BUSINESS',
        target_entity: 'BusinessClearance',
        target_id: id,
        metadata: { status: finalRecordedStatus },
      },
    });

    const updated = await prisma.businessClearanceEntry.findUnique({
      where: { id },
      include: { checklist_items: true },
    });

    return jsonResponse({
      success: true,
      business: {
        id: updated.id,
        status: updated.status,
        assessed_fee: formatMoney(updated.assessed_fee),
        declared_gross_income: formatMoney(updated.declared_gross_income),
        assessment_notes: updated.assessment_notes,
        checklist: mapChecklist(updated.checklist_items),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
