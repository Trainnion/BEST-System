#!/usr/bin/env node
// BEST-SYSTEM repository policy gate (`npm run check:policy`).
// Owner: WP-02 (ARCH). See docs/implementation-plan.md Sec. 10.3 and AGENTS.md.
//
// Checks:
//   1. The forbidden Superpowers token must not appear in any scanned file
//      (AGENT-01 / invariant 5).
//   2. Under src/app/api/blotter/** (when it exists): no console.*, no
//      remoteAddress, no user-agent, no x-forwarded-for (ZK-LOG-01 /
//      invariant 11; Sec. 15).
//
// Exits 0 on a clean repository, 1 on any violation.
// The skill folder .agents/skills/ is OPTIONAL: a missing folder is only a
// warning, never a failure (docs/ai-work-distribution.md Sec. 6, item 5).

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();

const FORBIDDEN_TOKEN = 'superpowers'; // this file is excluded from its own scan

// ZK-LOG-01 patterns for blotter API handlers.
const BLOTTER_PATTERNS = [
  { re: /console\s*\./, label: 'console.*' },
  { re: /remoteAddress/, label: 'remoteAddress' },
  { re: /user-?agent/i, label: 'user-agent' },
  { re: /x-forwarded-for/i, label: 'x-forwarded-for' },
];

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'playwright-report',
  'test-results',
]);

// Generated files never carry a policy judgment.
const SKIP_FILE_BASENAMES = new Set(['check-agent-policy.js', 'package-lock.json']);

/** Files and directories scanned (everything else is out of scope). */
const SCAN_DIRS = ['src', 'scripts', 'ops', '.agents'];
const SCAN_FILES = [
  'package.json',
  'docker-compose.yml',
  'docker-compose.reliability.yml',
  'Dockerfile',
  'Caddyfile',
];

const violations = [];

function isBlotterApi(relPath) {
  const norm = relPath.split(path.sep).join('/');
  return norm.startsWith('src/app/api/blotter/');
}

function scanFile(absPath, relPath) {
  let text;
  try {
    text = readFileSync(absPath, 'utf8');
  } catch {
    return; // unreadable or binary: skip
  }

  const lines = text.split(/\r?\n/);

  // 1. Forbidden Superpowers token (case-insensitive, any word form).
  const tokenRe = new RegExp(FORBIDDEN_TOKEN, 'i');
  lines.forEach((line, i) => {
    if (tokenRe.test(line)) {
      violations.push(`${relPath}:${i + 1}: forbidden skill token "${FORBIDDEN_TOKEN}" (AGENT-01)`);
    }
  });

  // 2. Zero-knowledge rules for blotter API handlers.
  if (isBlotterApi(relPath)) {
    lines.forEach((line, i) => {
      for (const { re, label } of BLOTTER_PATTERNS) {
        if (re.test(line)) {
          violations.push(`${relPath}:${i + 1}: forbidden pattern in blotter handler: ${label} (ZK-LOG-01)`);
        }
      }
    });
  }
}

function walkDir(dir, relBase) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_FILE_BASENAMES.has(entry)) continue;
    const abs = path.join(dir, entry);
    const rel = path.join(relBase, entry);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIR_NAMES.has(entry)) walkDir(abs, rel);
    } else if (st.isFile()) {
      scanFile(abs, rel);
    }
  }
}

// --- Scan --------------------------------------------------------------------

for (const dir of SCAN_DIRS) {
  walkDir(path.join(ROOT, dir), dir);
}
for (const file of SCAN_FILES) {
  const abs = path.join(ROOT, file);
  if (existsSync(abs) && statSync(abs).isFile() && !SKIP_FILE_BASENAMES.has(file)) {
    scanFile(abs, file);
  }
}

// --- Optional vendored skills --------------------------------------------------

if (!existsSync(path.join(ROOT, '.agents', 'skills'))) {
  console.log('WARNING: .agents/skills/ is missing. No skills are vendored for this project; agents follow the written design sections of docs/implementation-plan.md. This is allowed (warning only).');
}

// --- Verdict -------------------------------------------------------------------

if (violations.length > 0) {
  console.error(`POLICY CHECK: FAIL (${violations.length} violation${violations.length === 1 ? '' : 's'})`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('POLICY CHECK: PASS');
console.log('  - No forbidden skill token in scanned files.');
console.log('  - No zero-knowledge violations under src/app/api/blotter/.');

// --- Demo-credential tripwire (SEED-01; plan Sec. 16.1 item 5) ------------------
// Also run by this check, when WP-05's script is present. Missing file: warning
// only, so a Wave 1 checkout still passes.

const tripwire = path.join(ROOT, 'scripts', 'check-no-demo-creds.js');

if (!existsSync(tripwire)) {
  console.log('WARNING: scripts/check-no-demo-creds.js is missing (WP-05); demo-credential tripwire skipped.');
} else {
  const result = spawnSync(process.execPath, [tripwire], { stdio: 'inherit', env: process.env });
  if (result.error) {
    console.error('POLICY CHECK: FAIL — demo-credential tripwire (check-no-demo-creds.js) could not be run:', result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`POLICY CHECK: FAIL — demo-credential tripwire (scripts/check-no-demo-creds.js) exited with code ${result.status}.`);
    process.exit(1);
  }
  console.log('  - Demo-credential tripwire (check-no-demo-creds.js): PASS.');
}
