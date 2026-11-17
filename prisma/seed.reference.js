#!/usr/bin/env node
/**
 * BEST System - reference seed (WP-05, plan Sec. 16.1 item 1).
 *
 * Production-safe and idempotent. Everything here is public, non-personal
 * directory data: the seven official barangay positions. No resident PII, no
 * staff accounts, no passwords and no demo flags are written by this file.
 *
 * NOTE ON THE PLAN WORDING: Sec. 16.1 calls this file the "offices,
 * categories, committees" seed, but the V4 Prisma schema has no separate
 * reference tables for offices, categories or committees. Rather than invent
 * tables (and edit a schema this work package does not own), the closest
 * faithful equivalent is the BarangayOfficial directory (FR-07), where each
 * row carries a position and a committee label. The rows are created as
 * "Vacant" and inactive because reference data must never claim that a real
 * person holds office; staff activate and rename them from the admin roster.
 *
 * Run: node prisma/seed.reference.js
 * Safe to run any number of times: every row is upserted by its fixed id, so
 * two consecutive runs leave exactly the same seven rows.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * The seven official positions of a barangay directory (FR-07).
 * Fixed ids OFF-0001..OFF-0007 are shared with prisma/seed.demo.js so the
 * demo seed updates these same rows instead of creating duplicates.
 */
const REFERENCE_OFFICIALS = [
  {
    id: 'OFF-0001',
    full_name: 'Vacant',
    position: 'Punong Barangay',
    committee: 'Executive Governance',
    contact_info: 'Barangay Hall',
    display_order: 1,
    is_active: false,
  },
  {
    id: 'OFF-0002',
    full_name: 'Vacant',
    position: 'Barangay Kagawad',
    committee: 'Committee on Peace and Order',
    contact_info: 'Barangay Hall',
    display_order: 2,
    is_active: false,
  },
  {
    id: 'OFF-0003',
    full_name: 'Vacant',
    position: 'Barangay Kagawad',
    committee: 'Committee on Health and Sanitation',
    contact_info: 'Barangay Hall',
    display_order: 3,
    is_active: false,
  },
  {
    id: 'OFF-0004',
    full_name: 'Vacant',
    position: 'Barangay Kagawad',
    committee: 'Committee on Education and Youth',
    contact_info: 'Barangay Hall',
    display_order: 4,
    is_active: false,
  },
  {
    id: 'OFF-0005',
    full_name: 'Vacant',
    position: 'SK Chairperson',
    committee: 'Sangguniang Kabataan',
    contact_info: 'Barangay Hall',
    display_order: 5,
    is_active: false,
  },
  {
    id: 'OFF-0006',
    full_name: 'Vacant',
    position: 'Barangay Secretary',
    committee: 'Records and Documentation',
    contact_info: 'Barangay Hall',
    display_order: 6,
    is_active: false,
  },
  {
    id: 'OFF-0007',
    full_name: 'Vacant',
    position: 'Barangay Treasurer',
    committee: 'Finance and Treasury',
    contact_info: 'Barangay Hall',
    display_order: 7,
    is_active: false,
  },
];

const REFERENCE_IDS = REFERENCE_OFFICIALS.map((official) => official.id);

async function main() {
  for (const official of REFERENCE_OFFICIALS) {
    const { id, ...fields } = official;
    await prisma.barangayOfficial.upsert({
      where: { id },
      create: { id, ...fields, user_id: null, photo_url: null },
      update: { ...fields, user_id: null, photo_url: null },
    });
  }

  const referenceCount = await prisma.barangayOfficial.count({
    where: { id: { in: REFERENCE_IDS } },
  });
  const totalCount = await prisma.barangayOfficial.count();
  console.log('Reference seed complete (production-safe, no PII).');
  console.log(`  BarangayOfficial reference rows (OFF-0001..OFF-0007): ${referenceCount}`);
  console.log(`  BarangayOfficial total rows: ${totalCount}`);
}

main()
  .catch((error) => {
    console.error('Reference seed failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
