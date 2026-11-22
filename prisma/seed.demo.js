#!/usr/bin/env node
/**
 * BEST System - DEMO seed (WP-05, plan Sec. 10.2 and Sec. 16.1).
 *
 * DEV/TEST ONLY. Never run this in production: it creates demo residents,
 * demo ID cards, demo staff accounts with the documented Sec. 10.2 passwords
 * and sample requests/payments. Every row uses a fixed id and is upserted, so
 * two consecutive runs produce identical row counts and no duplicates.
 *
 * Guards (all checked before anything is written):
 *   - BEST_ENV must not be "production".
 *   - SEED_DEMO_DATA must be exactly "true".
 *   - DATABASE_URL and FIELD_ENC_KEY must be present.
 *
 * V5: this file passes PLAINTEXT demo values to the extended Prisma client
 * from src/lib/db.js. The field-encryption extension writes resident PII,
 * document purpose/CTC, business details, BlotterReport.enc_payload and
 * BlotterUpdate.internal_notes as `v1.<kid>.<iv>.<ct>.<tag>` ciphertext at
 * rest (AES-256-GCM, Sec. 12). No plaintext PII reaches the database, and no
 * key material is printed.
 *
 * Run: SEED_DEMO_DATA=true BEST_ENV=development node prisma/seed.demo.js
 */

import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

const DEMO_ENV_NAME = 'demo';

/** Documented Sec. 10.2 demo passwords. Fake values, not production secrets. */
const DEMO_USERS = [
  {
    id: 'USR-2026-0001',
    username: 'admin',
    password: 'AdminSecure2026!',
    full_name: 'Demo Administrator',
    role: 'ADMIN',
  },
  {
    id: 'USR-2026-0002',
    username: 'staff',
    password: 'StaffDesk2026!',
    full_name: 'Demo Frontline Staff',
    role: 'STAFF',
  },
  {
    id: 'USR-2026-0003',
    username: 'treasurer',
    password: 'TreasurerPay2026!',
    full_name: 'Demo Barangay Treasurer',
    role: 'TREASURER',
  },
  {
    id: 'USR-2026-0004',
    username: 'official',
    password: 'OfficialLead2026!',
    full_name: 'Demo Kagawad Reyes',
    role: 'OFFICIAL',
  },
];

const BCRYPT_COST = 12;

/** Resident plaintext is passed to the extension, which encrypts it at rest. */
const DEMO_RESIDENTS = [
  {
    id: 'RES-2026-0001',
    first_name: 'Demo Maria',
    middle_name: 'Clara',
    last_name: 'Santos',
    birth_date: '1990-03-12',
    gender: 'Female',
    civil_status: 'MARRIED',
    blood_type: 'O+',
    contact_number: '+639000000001',
    email: 'demo.maria.santos@example.test',
    purok: 'Purok 1',
    street_address: '1 Demo Street, Purok 1, Barangay Demo',
    emergency_contact_name: 'Demo Contact One',
    emergency_contact_phone: '+639000000101',
    years_of_residency: 12,
    consent_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'RES-2026-0002',
    first_name: 'Demo Juan',
    middle_name: 'Ramon',
    last_name: 'Dela Cruz',
    birth_date: '1985-07-04',
    gender: 'Male',
    civil_status: 'SINGLE',
    blood_type: 'A+',
    contact_number: '+639000000002',
    email: 'demo.juan.delacruz@example.test',
    purok: 'Purok 2',
    street_address: '2 Demo Street, Purok 2, Barangay Demo',
    emergency_contact_name: 'Demo Contact Two',
    emergency_contact_phone: '+639000000102',
    years_of_residency: 20,
    consent_at: '2026-01-16T08:00:00.000Z',
  },
  {
    id: 'RES-2026-0003',
    first_name: 'Demo Ana',
    middle_name: 'Liza',
    last_name: 'Reyes',
    birth_date: '1998-11-23',
    gender: 'Female',
    civil_status: 'SINGLE',
    blood_type: 'B+',
    contact_number: '+639000000003',
    email: 'demo.ana.reyes@example.test',
    purok: 'Purok 3',
    street_address: '3 Demo Street, Purok 3, Barangay Demo',
    emergency_contact_name: 'Demo Contact Three',
    emergency_contact_phone: '+639000000103',
    years_of_residency: 8,
    consent_at: '2026-02-02T08:00:00.000Z',
  },
  {
    id: 'RES-2026-0004',
    first_name: 'Demo Pedro',
    middle_name: 'Bautista',
    last_name: 'Mendoza',
    birth_date: '1972-02-09',
    gender: 'Male',
    civil_status: 'MARRIED',
    blood_type: 'AB+',
    contact_number: '+639000000004',
    email: 'demo.pedro.mendoza@example.test',
    purok: 'Purok 4',
    street_address: '4 Demo Street, Purok 4, Barangay Demo',
    emergency_contact_name: 'Demo Contact Four',
    emergency_contact_phone: '+639000000104',
    years_of_residency: 30,
    consent_at: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'RES-2026-0005',
    first_name: 'Demo Liza',
    middle_name: 'Mae',
    last_name: 'Garcia',
    birth_date: '2001-06-30',
    gender: 'Female',
    civil_status: 'SINGLE',
    blood_type: 'O-',
    contact_number: '+639000000005',
    email: 'demo.liza.garcia@example.test',
    purok: 'Purok 5',
    street_address: '5 Demo Street, Purok 5, Barangay Demo',
    emergency_contact_name: 'Demo Contact Five',
    emergency_contact_phone: '+639000000105',
    years_of_residency: 5,
    consent_at: '2026-03-01T08:00:00.000Z',
  },
];

const DEMO_ID_CARDS = [
  {
    id: 'BID-2026-0001',
    resident_id: 'RES-2026-0001',
    card_number: 'DEMO-CARD-2026-0001',
    barcode_data: 'BEST-DEMO-BID-2026-0001',
    issued_date: '2026-01-20T08:00:00.000Z',
    valid_until: '2029-01-20T08:00:00.000Z',
  },
  {
    id: 'BID-2026-0002',
    resident_id: 'RES-2026-0002',
    card_number: 'DEMO-CARD-2026-0002',
    barcode_data: 'BEST-DEMO-BID-2026-0002',
    issued_date: '2026-02-10T08:00:00.000Z',
    valid_until: '2029-02-10T08:00:00.000Z',
  },
];

/** Same OFF-0001..OFF-0007 ids as prisma/seed.reference.js (no duplicates). */
const DEMO_OFFICIALS = [
  {
    id: 'OFF-0001',
    full_name: 'Demo Punong Barangay Villanueva',
    position: 'Punong Barangay',
    committee: 'Executive Governance',
    contact_info: 'Barangay Hall (demo)',
    display_order: 1,
    is_active: true,
    user_id: null,
  },
  {
    id: 'OFF-0002',
    full_name: 'Demo Kagawad Reyes',
    position: 'Barangay Kagawad',
    committee: 'Committee on Peace and Order',
    contact_info: 'Barangay Hall (demo)',
    display_order: 2,
    is_active: true,
    user_id: 'USR-2026-0004',
  },
  {
    id: 'OFF-0003',
    full_name: 'Demo Kagawad Lim',
    position: 'Barangay Kagawad',
    committee: 'Committee on Health and Sanitation',
    contact_info: 'Barangay Hall (demo)',
    display_order: 3,
    is_active: true,
    user_id: null,
  },
  {
    id: 'OFF-0004',
    full_name: 'Demo Kagawad Torres',
    position: 'Barangay Kagawad',
    committee: 'Committee on Education and Youth',
    contact_info: 'Barangay Hall (demo)',
    display_order: 4,
    is_active: true,
    user_id: null,
  },
  {
    id: 'OFF-0005',
    full_name: 'Demo SK Chair Ramos',
    position: 'SK Chairperson',
    committee: 'Sangguniang Kabataan',
    contact_info: 'Barangay Hall (demo)',
    display_order: 5,
    is_active: true,
    user_id: null,
  },
  {
    id: 'OFF-0006',
    full_name: 'Demo Secretary Flores',
    position: 'Barangay Secretary',
    committee: 'Records and Documentation',
    contact_info: 'Barangay Hall (demo)',
    display_order: 6,
    is_active: true,
    user_id: null,
  },
  {
    id: 'OFF-0007',
    full_name: 'Demo Treasurer Castillo',
    position: 'Barangay Treasurer',
    committee: 'Finance and Treasury',
    contact_info: 'Barangay Hall (demo)',
    display_order: 7,
    is_active: true,
    user_id: null,
  },
];

const DEMO_BROADCASTS = [
  {
    id: 'BCAST-2026-0001',
    author_id: 'USR-2026-0002',
    category: 'AYUDA',
    title: 'Q4 Social Pension & Ayuda Distribution Schedule',
    content:
      'Schedule for Senior Citizens and Indigent Families. Please proceed to Barangay Daro Hall Counter 2 with your valid ID and senior citizen booklet.',
    is_pinned: true,
    start_date: '2026-11-01T08:00:00.000Z',
    end_date: '2026-11-30T17:00:00.000Z',
  },
  {
    id: 'BCAST-2026-0002',
    author_id: 'USR-2026-0002',
    category: 'HEALTH',
    title: 'Free Community Health & Medical Check-Up',
    content:
      'Free blood pressure monitoring, blood sugar screening, and basic maintenance medicines distribution at the Barangay Daro Health Center.',
    is_pinned: false,
    start_date: '2026-11-05T08:00:00.000Z',
    end_date: '2026-12-15T17:00:00.000Z',
  },
  {
    id: 'BCAST-2026-0003',
    author_id: 'USR-2026-0004',
    category: 'VETERINARY',
    title: 'Anti-Rabies Pet Vaccination Drive',
    content:
      'Free anti-rabies vaccination and pet registration for dogs and cats at the Purok 3 Covered Court from 8:00 AM to 12:00 PM.',
    is_pinned: false,
    start_date: '2026-11-10T08:00:00.000Z',
    end_date: '2026-12-10T17:00:00.000Z',
  },
  {
    id: 'BCAST-2026-0004',
    author_id: 'USR-2026-0001',
    category: 'SCHOLARSHIP',
    title: 'Barangay Educational Assistance Program',
    content:
      'Application for college educational assistance is now open. Submit certificate of enrollment, indigency clearance, and grades to the SK Office.',
    is_pinned: false,
    start_date: '2026-11-12T08:00:00.000Z',
    end_date: '2027-01-31T17:00:00.000Z',
  },
];

const DOCUMENT_SEEDS = [
  {
    tracking_code: 'CLR-2026-DEMO0001',
    resident_id: 'RES-2026-0001',
    document_type: 'CLEARANCE',
    purpose_label: 'Demo: barangay clearance for local employment.',
    ctc_number: 'DEMO-CTC-0001',
    ctc_issued_date: '2026-11-02T08:00:00.000Z',
    status: 'UNDER_REVIEW',
    fee_amount: '50.00',
    client_request_id: 'b1a2c3d4-0001-4a1b-8c2d-000000000001',
    reviewed_by_id: 'USR-2026-0002',
  },
  {
    tracking_code: 'IND-2026-DEMO0002',
    resident_id: 'RES-2026-0002',
    document_type: 'INDIGENCY',
    purpose_label: 'Demo: certificate of indigency for medical assistance.',
    ctc_number: null,
    ctc_issued_date: null,
    status: 'READY_FOR_PICKUP',
    fee_amount: '0.00',
    client_request_id: 'b1a2c3d4-0002-4a1b-8c2d-000000000002',
    reviewed_by_id: 'USR-2026-0002',
  },
  {
    tracking_code: 'CLR-2026-DEMO0003',
    resident_id: 'RES-2026-0003',
    document_type: 'CLEARANCE',
    purpose_label: 'Demo: barangay clearance for a small business permit.',
    ctc_number: 'DEMO-CTC-0003',
    ctc_issued_date: '2026-11-04T08:00:00.000Z',
    status: 'RELEASED',
    fee_amount: '50.00',
    client_request_id: 'b1a2c3d4-0003-4a1b-8c2d-000000000003',
    reviewed_by_id: 'USR-2026-0001',
  },
];

const DEMO_BUSINESSES = [
  {
    id: 'BIZ-2026-0001',
    resident_id: 'RES-2026-0004',
    declared_gross_income: '120000.00',
    physical_appointment_date: '2026-11-20T09:00:00.000Z',
    status: 'INTAKE_SCHEDULED',
    assessed_by_id: null,
    assessed_fee: '0.00',
    assessment_notes: null,
    client_request_id: 'c1a2c3d4-0001-4a1b-8c2d-000000000101',
    business_label: 'Demo Sari-Sari Store',
    nature_label: 'Retail of dry goods',
    address_label: '10 Demo Street, Purok 4, Barangay Demo',
  },
  {
    id: 'BIZ-2026-0002',
    resident_id: 'RES-2026-0005',
    declared_gross_income: '480000.00',
    physical_appointment_date: '2026-11-18T10:00:00.000Z',
    status: 'TREASURER_ASSESSED',
    assessed_by_id: 'USR-2026-0003',
    assessed_fee: '750.00',
    assessment_notes: 'Demo assessment: in-person Treasurer screening completed.',
    client_request_id: 'c1a2c3d4-0002-4a1b-8c2d-000000000102',
    business_label: 'Demo Bakery',
    nature_label: 'Bakery and pastry production',
    address_label: '11 Demo Street, Purok 5, Barangay Demo',
  },
];

/** Anonymous demo reports; enc_payload is plaintext here and encrypted by the extension. */
const DEMO_BLOTTERS = [
  {
    tracking_code: 'BLT-DEM0-01',
    incident_type: 'Noise Complaint',
    incident_zone: 'Purok 1',
    incident_date: '2026-11-10',
    urgency_level: 'LOW',
    status: 'FILED',
    assigned_officer_id: null,
    created_at: '2026-11-10T02:00:00.000Z',
    narrative: 'Demo narrative: loud music after quiet hours near the basketball court.',
    exact_location: 'Demo basketball court, Purok 1',
    exact_time: '22:15',
  },
  {
    tracking_code: 'BLT-DEM0-02',
    incident_type: 'Stray Animals',
    incident_zone: 'Purok 3',
    incident_date: '2026-11-11',
    urgency_level: 'MEDIUM',
    status: 'UNDER_REVIEW',
    assigned_officer_id: 'USR-2026-0002',
    created_at: '2026-11-11T03:00:00.000Z',
    narrative: 'Demo narrative: a group of stray dogs near the covered court at dusk.',
    exact_location: 'Demo covered court, Purok 3',
    exact_time: '18:40',
  },
];

const DEMO_BLOTTER_UPDATES = [
  {
    id: 'BUP-DEMO01',
    blotter_tracking_code: 'BLT-DEM0-01',
    action_taken: 'Received at the desk',
    public_notes: 'Demo public note: the desk officer will follow up.',
    internal_notes: 'Demo staff-only note: verify the quiet-hours schedule.',
    recorded_by_id: 'USR-2026-0002',
    created_at: '2026-11-10T04:00:00.000Z',
  },
  {
    id: 'BUP-DEMO02',
    blotter_tracking_code: 'BLT-DEM0-02',
    action_taken: 'Assigned for review',
    public_notes: 'Demo public note: the report is under review.',
    internal_notes: 'Demo staff-only note: coordinate with the barangay veterinary desk.',
    recorded_by_id: 'USR-2026-0002',
    created_at: '2026-11-11T05:00:00.000Z',
  },
];

const CHECKLIST_TITLES = {  DTI_SEC: 'DTI / SEC Registration',
  LEASE: 'Lease Contract or Proof of Ownership',
  FIRE: 'Fire Safety Inspection Certificate',
  SANITARY: 'Sanitary Permit',
  INSPECTION: 'On-site Inspection',
};

const DEMO_CHECKLISTS = [
  { id: 'CHK-2026-0001', business_id: 'BIZ-2026-0001', item_code: 'DTI_SEC', is_complied: true, verified_by_id: 'USR-2026-0002', verified_at: '2026-11-12T08:00:00.000Z', remarks: 'Demo: copy received at the desk.' },
  { id: 'CHK-2026-0002', business_id: 'BIZ-2026-0001', item_code: 'LEASE', is_complied: false, verified_by_id: null, verified_at: null, remarks: 'Demo: awaiting the applicant.' },
  { id: 'CHK-2026-0003', business_id: 'BIZ-2026-0001', item_code: 'FIRE', is_complied: false, verified_by_id: null, verified_at: null, remarks: null },
  { id: 'CHK-2026-0004', business_id: 'BIZ-2026-0001', item_code: 'SANITARY', is_complied: false, verified_by_id: null, verified_at: null, remarks: null },
  { id: 'CHK-2026-0005', business_id: 'BIZ-2026-0001', item_code: 'INSPECTION', is_complied: false, verified_by_id: null, verified_at: null, remarks: null },
  { id: 'CHK-2026-0011', business_id: 'BIZ-2026-0002', item_code: 'DTI_SEC', is_complied: true, verified_by_id: 'USR-2026-0002', verified_at: '2026-11-11T08:00:00.000Z', remarks: 'Demo: verified at intake.' },
  { id: 'CHK-2026-0012', business_id: 'BIZ-2026-0002', item_code: 'LEASE', is_complied: true, verified_by_id: 'USR-2026-0002', verified_at: '2026-11-11T08:05:00.000Z', remarks: 'Demo: verified at intake.' },
  { id: 'CHK-2026-0013', business_id: 'BIZ-2026-0002', item_code: 'FIRE', is_complied: true, verified_by_id: 'USR-2026-0003', verified_at: '2026-11-12T08:10:00.000Z', remarks: 'Demo: verified by the Treasurer.' },
  { id: 'CHK-2026-0014', business_id: 'BIZ-2026-0002', item_code: 'SANITARY', is_complied: true, verified_by_id: 'USR-2026-0003', verified_at: '2026-11-12T08:15:00.000Z', remarks: 'Demo: verified by the Treasurer.' },
  { id: 'CHK-2026-0015', business_id: 'BIZ-2026-0002', item_code: 'INSPECTION', is_complied: true, verified_by_id: 'USR-2026-0003', verified_at: '2026-11-12T08:20:00.000Z', remarks: 'Demo: on-site inspection recorded.' },
];

const DEMO_PAYMENTS = [
  {
    id: 'PAY-2026-0001',
    document_request_id: 'CLR-2026-DEMO0003',
    business_clearance_id: null,
    amount: '50.00',
    receipt_or_no: 'OR-2026-000001',
    payment_method: 'CASH',
    collected_by_id: 'USR-2026-0003',
    remarks: 'Demo official receipt for a released clearance.',
    collected_at: '2026-11-12T02:00:00.000Z',
  },
  {
    id: 'PAY-2026-0002',
    document_request_id: null,
    business_clearance_id: 'BIZ-2026-0002',
    amount: '750.00',
    receipt_or_no: 'OR-2026-000002',
    payment_method: 'CASH',
    collected_by_id: 'USR-2026-0003',
    remarks: 'Demo official receipt for a business clearance assessment.',
    collected_at: '2026-11-13T02:30:00.000Z',
  },
];

const DEMO_IDS = {
  residents: DEMO_RESIDENTS.map((row) => row.id),
  cards: DEMO_ID_CARDS.map((row) => row.id),
  officials: DEMO_OFFICIALS.map((row) => row.id),
  users: DEMO_USERS.map((row) => row.id),
  broadcasts: DEMO_BROADCASTS.map((row) => row.id),
  documents: DOCUMENT_SEEDS.map((row) => row.tracking_code),
  businesses: DEMO_BUSINESSES.map((row) => row.id),
  blotters: DEMO_BLOTTERS.map((row) => row.tracking_code),
  blotterUpdates: DEMO_BLOTTER_UPDATES.map((row) => row.id),
  checklists: DEMO_CHECKLISTS.map((row) => row.id),
  payments: DEMO_PAYMENTS.map((row) => row.id),
};

function refuse(message) {
  console.error(message);
  process.exit(1);
}

function assertDemoEnvironment() {
  const bestEnv = (process.env.BEST_ENV || '').trim().toLowerCase();
  if (bestEnv === 'production') {
    refuse(
      'REFUSED: prisma/seed.demo.js must never run in production (BEST_ENV=production). No data was written.',
    );
  }
  if ((process.env.SEED_DEMO_DATA || '').trim().toLowerCase() !== 'true') {
    refuse(
      'REFUSED: demo data is disabled. Set SEED_DEMO_DATA=true (and keep BEST_ENV=development) to run this DEV/TEST-only seed.',
    );
  }
  if (!process.env.DATABASE_URL) {
    refuse('REFUSED: DATABASE_URL is not set. No data was written.');
  }
  if (!process.env.FIELD_ENC_KEY) {
    refuse('REFUSED: FIELD_ENC_KEY is not set; PII cannot be encrypted. No data was written.');
  }
}

const iso = (value) => new Date(value);

function demoQrHash(trackingCode) {
  // Stable unique demo signature, not a production HMAC.
  return 'demo-' + createHash('sha256').update('BEST|demo-qr|' + trackingCode).digest('hex');
}

async function main() {
  assertDemoEnvironment();

  const { prisma } = await import('../src/lib/db.js');
  try {
    // Never hijack a real account whose username collides with a demo account.
    const conflictingUsers = await prisma.systemUser.findMany({
      where: {
        username: { in: DEMO_USERS.map((user) => user.username) },
        NOT: { id: { in: DEMO_IDS.users } },
      },
      select: { id: true, username: true },
    });
    if (conflictingUsers.length > 0) {
      throw new Error(
        'Refusing to overwrite existing non-demo SystemUser usernames: ' +
          conflictingUsers.map((user) => user.username).join(', '),
      );
    }

    // --- Staff accounts (Sec. 10.2 demo passwords, bcrypt cost 12) ----------
    for (const user of DEMO_USERS) {
      const { id, username, password, full_name, role } = user;
      const password_hash = await bcrypt.hash(password, BCRYPT_COST);
      const fields = {
        username,
        password_hash,
        full_name,
        role,
        is_active: true,
        is_demo: true,
        must_change_password: false,
      };
      await prisma.systemUser.upsert({
        where: { id },
        create: { id, ...fields },
        update: fields,
      });
    }

    // --- Residents (plaintext here; the extension encrypts PII at rest) ------
    for (const resident of DEMO_RESIDENTS) {
      const fields = {
        first_name: resident.first_name,
        middle_name: resident.middle_name,
        last_name: resident.last_name,
        birth_date: iso(resident.birth_date),
        gender: resident.gender,
        civil_status: resident.civil_status,
        blood_type: resident.blood_type,
        contact_number: resident.contact_number,
        email: resident.email,
        purok: resident.purok,
        street_address: resident.street_address,
        emergency_contact_name: resident.emergency_contact_name,
        emergency_contact_phone: resident.emergency_contact_phone,
        is_registered_voter: true,
        years_of_residency: resident.years_of_residency,
        data_privacy_consent_at: iso(resident.consent_at),
        is_verified: true,
        is_demo: true,
      };
      await prisma.resident.upsert({
        where: { id: resident.id },
        create: { id: resident.id, ...fields },
        update: fields,
      });
    }

    // --- Resident credentials (passwords for 1-3, 5; activation code for 4) ---
    const residentPasswordHash = await bcrypt.hash('ResidentPass2026!', BCRYPT_COST);
    const elenaActivationHash = await bcrypt.hash('DEMO7ACT04', BCRYPT_COST);
    const nowTimestamp = new Date();
    const sevenDaysFromNow = new Date(nowTimestamp.getTime() + 7 * 24 * 60 * 60 * 1000);

    const DEMO_RESIDENT_CREDS = [
      { resident_id: 'RES-2026-0001', password_hash: residentPasswordHash, activated_at: nowTimestamp, activation_hash: null, activation_expires: null, issued_by_id: 'USR-2026-0002' },
      { resident_id: 'RES-2026-0002', password_hash: residentPasswordHash, activated_at: nowTimestamp, activation_hash: null, activation_expires: null, issued_by_id: 'USR-2026-0002' },
      { resident_id: 'RES-2026-0003', password_hash: residentPasswordHash, activated_at: nowTimestamp, activation_hash: null, activation_expires: null, issued_by_id: 'USR-2026-0002' },
      { resident_id: 'RES-2026-0004', password_hash: null, activated_at: null, activation_hash: elenaActivationHash, activation_expires: sevenDaysFromNow, issued_by_id: 'USR-2026-0002' },
      { resident_id: 'RES-2026-0005', password_hash: residentPasswordHash, activated_at: nowTimestamp, activation_hash: null, activation_expires: null, issued_by_id: 'USR-2026-0002' },
    ];

    for (const cred of DEMO_RESIDENT_CREDS) {
      await prisma.residentCredential.upsert({
        where: { resident_id: cred.resident_id },
        create: cred,
        update: cred,
      });
    }

    // --- Digital ID cards (1:1, view-only module) ---------------------------
    for (const card of DEMO_ID_CARDS) {
      const fields = {
        resident_id: card.resident_id,
        card_number: card.card_number,
        barcode_data: card.barcode_data,
        issued_date: iso(card.issued_date),
        valid_until: iso(card.valid_until),
        status: 'ACTIVE',
      };
      await prisma.barangayIDCard.upsert({
        where: { id: card.id },
        create: { id: card.id, ...fields },
        update: fields,
      });
    }

    // --- Officials: same ids as seed.reference.js, demo names only ----------
    for (const official of DEMO_OFFICIALS) {
      const fields = {
        full_name: official.full_name,
        position: official.position,
        committee: official.committee,
        contact_info: official.contact_info,
        display_order: official.display_order,
        is_active: official.is_active,
        user_id: official.user_id,
        photo_url: null,
      };
      await prisma.barangayOfficial.upsert({
        where: { id: official.id },
        create: { id: official.id, ...fields },
        update: fields,
      });
    }

    // --- Public welfare broadcasts ------------------------------------------
    for (const broadcast of DEMO_BROADCASTS) {
      const fields = {
        author_id: broadcast.author_id,
        category: broadcast.category,
        title: broadcast.title,
        content: broadcast.content,
        simplified_summary: null,
        audio_script: null,
        is_pinned: broadcast.is_pinned,
        start_date: iso(broadcast.start_date),
        end_date: iso(broadcast.end_date),
      };
      await prisma.communityBroadcast.upsert({
        where: { id: broadcast.id },
        create: { id: broadcast.id, ...fields },
        update: fields,
      });
    }

    // --- Document requests (plaintext purpose/CTC; extension encrypts) ------
    for (const document of DOCUMENT_SEEDS) {
      const fields = {
        resident_id: document.resident_id,
        document_type: document.document_type,
        purpose: document.purpose_label,
        ctc_number: document.ctc_number,
        ctc_issued_date: document.ctc_issued_date ? iso(document.ctc_issued_date) : null,
        status: document.status,
        rejection_reason: null,
        fee_amount: document.fee_amount,
        qr_hash: demoQrHash(document.tracking_code),
        client_request_id: document.client_request_id,
        ai_verification: null,
        reviewed_by_id: document.reviewed_by_id,
      };
      await prisma.documentRequest.upsert({
        where: { tracking_code: document.tracking_code },
        create: { tracking_code: document.tracking_code, ...fields },
        update: fields,
      });
    }

    // --- Business clearance entries (plaintext fields; extension encrypts) --
    for (const business of DEMO_BUSINESSES) {
      const fields = {
        resident_id: business.resident_id,
        business_name: business.business_label,
        nature_of_business: business.nature_label,
        business_address: business.address_label,
        declared_gross_income: business.declared_gross_income,
        physical_appointment_date: iso(business.physical_appointment_date),
        status: business.status,
        assessed_by_id: business.assessed_by_id,
        assessed_fee: business.assessed_fee,
        assessment_notes: business.assessment_notes,
        client_request_id: business.client_request_id,
      };
      await prisma.businessClearanceEntry.upsert({
        where: { id: business.id },
        create: { id: business.id, ...fields },
        update: fields,
      });
    }

    // --- Anonymous blotter reports (plaintext payload; extension encrypts) --
    for (const blotter of DEMO_BLOTTERS) {
      const { tracking_code, narrative, exact_location, exact_time, ...rest } = blotter;
      const fields = {
        incident_type: rest.incident_type,
        incident_zone: rest.incident_zone,
        incident_date: iso(rest.incident_date),
        enc_payload: JSON.stringify({ narrative, exact_location, exact_time }),
        urgency_level: rest.urgency_level,
        status: rest.status,
        assigned_officer_id: rest.assigned_officer_id,
        created_at: iso(rest.created_at),
      };
      await prisma.blotterReport.upsert({
        where: { tracking_code },
        create: { tracking_code, ...fields },
        update: fields,
      });
    }

    // --- Blotter updates (plaintext internal_notes; extension encrypts) -----
    for (const update of DEMO_BLOTTER_UPDATES) {
      const fields = {
        blotter_tracking_code: update.blotter_tracking_code,
        action_taken: update.action_taken,
        public_notes: update.public_notes,
        internal_notes: update.internal_notes,
        recorded_by_id: update.recorded_by_id,
        created_at: iso(update.created_at),
      };
      await prisma.blotterUpdate.upsert({
        where: { id: update.id },
        create: { id: update.id, ...fields },
        update: fields,
      });
    }

    // --- Business checklist items (5 per business) --------------------------
    for (const item of DEMO_CHECKLISTS) {
      const fields = {
        business_id: item.business_id,
        item_code: item.item_code,
        title: CHECKLIST_TITLES[item.item_code],
        is_complied: item.is_complied,
        verified_by_id: item.verified_by_id,
        verified_at: item.verified_at ? iso(item.verified_at) : null,
        remarks: item.remarks,
      };
      await prisma.businessChecklistItem.upsert({
        where: { id: item.id },
        create: { id: item.id, ...fields },
        update: fields,
      });
    }

    // --- Official receipt payments -----------------------------------------
    for (const payment of DEMO_PAYMENTS) {
      const fields = {
        document_request_id: payment.document_request_id,
        business_clearance_id: payment.business_clearance_id,
        amount: payment.amount,
        receipt_or_no: payment.receipt_or_no,
        payment_method: payment.payment_method,
        collected_by_id: payment.collected_by_id,
        remarks: payment.remarks,
        collected_at: iso(payment.collected_at),
      };
      await prisma.paymentRecord.upsert({
        where: { id: payment.id },
        create: { id: payment.id, ...fields },
        update: fields,
      });
    }

    // --- Concise counts -----------------------------------------------------
    const counts = {
      'demo residents': await prisma.resident.count({ where: { id: { in: DEMO_IDS.residents } } }),
      'demo ID cards': await prisma.barangayIDCard.count({ where: { id: { in: DEMO_IDS.cards } } }),
      'BarangayOfficial rows (OFF-0001..OFF-0007)': await prisma.barangayOfficial.count({
        where: { id: { in: DEMO_IDS.officials } },
      }),
      'demo SystemUsers': await prisma.systemUser.count({ where: { id: { in: DEMO_IDS.users } } }),
      'demo broadcasts': await prisma.communityBroadcast.count({ where: { id: { in: DEMO_IDS.broadcasts } } }),
      'demo document requests': await prisma.documentRequest.count({
        where: { tracking_code: { in: DEMO_IDS.documents } },
      }),
      'demo business entries': await prisma.businessClearanceEntry.count({
        where: { id: { in: DEMO_IDS.businesses } },
      }),
      'demo blotter reports': await prisma.blotterReport.count({
        where: { tracking_code: { in: DEMO_IDS.blotters } },
      }),
      'demo blotter updates': await prisma.blotterUpdate.count({
        where: { id: { in: DEMO_IDS.blotterUpdates } },
      }),
      'demo checklist items': await prisma.businessChecklistItem.count({
        where: { id: { in: DEMO_IDS.checklists } },
      }),
      'demo payments (official receipts)': await prisma.paymentRecord.count({
        where: { id: { in: DEMO_IDS.payments } },
      }),
    };

    console.log(`Demo seed complete (${DEMO_ENV_NAME} data only; BEST_ENV is not production).`);
    for (const [label, value] of Object.entries(counts)) {
      console.log(`  ${label}: ${value}`);
    }
    const totalUsers = await prisma.systemUser.count();
    const totalResidents = await prisma.resident.count();
    console.log(`  SystemUser total rows: ${totalUsers}`);
    console.log(`  Resident total rows: ${totalResidents}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Demo seed failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
