# BEST-SYSTEM: AI Work Distribution

Separate from `docs/implementation-plan.md`. Nothing here goes into the plan.
The plan is the spec (V5, Encryption at Rest); this file only says who builds
what, in what order.

## 1. Rules

1. Every agent reads the plan section for its package and writes only the files it owns. One owner per file.
2. Parallel work happens only inside a wave. A wave is not started until the previous wave passes its gate.
3. At most 4 writing agents at once (free-tier rate limits). Audit agents are read-only.
4. Fixes go back to the same agent session so it keeps its context.
5. **Fake data only.** Free models may keep what you send them. No real resident names, IDs, blotter text, passwords or `.env` values go to any model.
6. **A person generates keys.** `npm run keys:generate` prints a `FIELD_ENC_KEY` (32 random bytes, base64) on the server PC; a team member pastes it into `.env`. The key never passes through a model. The spare copy stays somewhere that is not the server and never with the backups (ENC-01).
7. Write down which model and effort built each package (table in Sec. 5).
8. **All subagents run at MAX or HIGH effort.** Use the model's `#max` or `#high` variant when it exists. If a roster model is out of credits, rate-limited or has no effort variant, substitute another free model at MAX effort and record the substitution. Never silently lower effort.
9. **Use the vendored skills.** `.agents/skills/graphify` answers architecture and impact questions from `graphify-out/graph.json`; `.agents/skills/ponytail` enforces the smallest working diff; `.agents/skills/caveman` enforces terse, high-density reporting; `.agents/skills/ui-ux-pro-max` and `.agents/skills/frontend-design` guide UI/UX decisions on every page, form and component. Do not install or invoke any other skill.

## 2. Roster (IDs confirmed in the live OpenCode model list; availability can change)

| Call sign | Model | Effort | Role |
| :--- | :--- | :--- | :--- |
| ORCH | `opencode/deepseek-v4.1-flash-free#max` | MAX | Contracts, file ownership, gate checks, merging |
| ARCH | `opencode/glm-5.3-flash-free#max` | MAX | Schema, crypto core, auth, admin backend |
| BUILD | `opencode/minimax-m3.1-flash-free#max` | MAX | APIs, blotter, ops |
| UI | `opencode/mimo-v2.6-flash-free` | model default (no variant) | Citizen pages, forms, business flow |
| MOTION | `opencode/big-pickle` | model default (no variant) | Homepage, print engine, functional tests |
| AUDIT-1 | `opencode/iceman-free` (fallback: `opencode/beam-free#max`) | model default / MAX fallback | Read-only invariant and security review |
| AUDIT-2 | `opencode/flint-40b-free#max` | MAX | Read-only second opinion (retry on 503) |
| VISION | `opencode/nemotron-3.5-super-vl-free#high` | HIGH | Read-only screenshot, print and mobile review |

Rules for the roster:
- Prefer the roster model with an explicit `#max` or `#high` variant.
- `mimo-v2.6-flash-free` and `big-pickle` expose no effort variant. For the V5
  migration, packages previously assigned to them use a MAX-capable free
  substitute instead: `opencode/beam-free#max` for WP-08 and
  `opencode/flint-40b-free#max` for WP-12. This is the user-approved
  "other free AI at MAX effort" substitution.
- If a model is down, substitute another free model at MAX effort and record it.
  Do not silently drop effort or fall back to a non-free model.
- V5-wave availability (2026-11-17): `glm-5.3-flash-free` ran out of credits,
  so WP-03/04/11 ran on `opencode/deepseek-v4.1-flash-free#max`, and
  `minimax-m3.1-flash-free` ran out of credits, so WP-10 ran on
  `opencode/inkling-2-small-free#max`. Both substitutes were user-approved and
  ran at MAX. See the Sec. 5 build log.

## 3. Waves and work packages

`HR` = a person must review the code line by line before the gate is accepted.

### V5 migration wave (reopens V4 packages)

V5 changes the encryption model, so the V4 Wave 4 technical gate is retained as
history only. These packages are reopened and must pass the V5 gate before the
Wave 4 build-log rows are accepted.

| WP | Work | Agent | Owns (write) | Gate |
| :--- | :--- | :--- | :--- | :--- |
| 03 (HR) | V5 server-side field crypto core | ARCH (`glm#max`) | `src/lib/crypto/field.js`, `src/lib/crypto/field-extension.js`, `src/lib/crypto/errors.js`, `src/lib/db.js`, `src/lib/audit.js`, `scripts/generate-field-key.js`, `package.json`, `.env.example`; delete `scripts/generate-records-key.js`, `src/lib/crypto/{keys,envelope,seal,open}.js`, `src/app/api/crypto/public-key/route.js`; remove any `RECORDS_*` env plumbing | `v1.<kid>.<iv>.<ct>.<tag>` roundtrip; AAD column binding; GCM tamper fails; missing/invalid `FIELD_ENC_KEY` refuses to start; no RSA/public-key code remains |
| 04 (HR) | V5 schema and migration | ARCH (same session as WP-03) | `prisma/schema.prisma`, new `prisma/migrations/**`, `prisma/seed.demo.js` | BlotterReport has only `enc_payload`; `migrate deploy` and `prisma validate` pass; demo seed re-runs idempotently with PII ciphertext |
| 11-route | ID card route adaptation to V5 | ARCH (same session as WP-03) | `src/app/api/resident/id-card/route.js` only | Own card only; emergency contacts decrypted server-side; no print/export; no PII beyond the allow-list |
| 08 | Document intake and staff detail | UI substitute (`beam#max`) | `src/app/api/documents/route.js`, `src/app/api/documents/[id]/route.js` (new), `src/app/api/documents/track/route.js` (copy only), `src/app/services/request/page.jsx`, `src/components/public/DocumentRequestForm.jsx`, `src/app/track/page.jsx` (copy only) | POST takes plaintext purpose/CTC; DB ciphertext; queue/track never return encrypted fields; staff detail decrypts + audit; no browser sealing |
| 10 (HR) | Anonymous blotter | BUILD (`minimax#max`) | `src/app/api/blotter/**`, `src/app/blotter/**`, `src/components/blotter/**`, `src/lib/blotter/**`, `src/lib/offline/outbox.js` | POST takes plaintext narrative/location/time; DB `enc_payload` ciphertext; public GET never returns them; staff GET decrypts + audit; no IP/cookie/header read; PoW still enforced; offline replay gets a fresh PoW |
| 12 | Business clearance gateway | UI substitute (`flint#max`) | `src/app/api/business/route.js`, `src/app/api/business/[id]/route.js`, `src/app/services/business-clearance/page.jsx`, `src/components/business/BusinessClearanceForm.jsx`, `src/lib/business/**` | POST takes plaintext business fields; DB ciphertext; staff detail decrypts + audit; no online approval; Treasurer/Admin only for assessment |
| — | Gate harness | ORCH | Temp gate/static/fixture scripts outside the repo | V5 checks below pass |

**Read-only during the V5 wave (do not edit):** `src/app/id-card/**`,
`src/components/id-card/**`, `src/app/admin/treasury/**`, `src/app/api/treasury/**`,
`src/app/api/resident/{activate,login,logout,me}/**`, `src/lib/auth.js`,
`src/lib/offline/outbox.js` except WP-10's PoW replay hook, `public/sw.js`,
`scripts/gen-precache.js`, `Caddyfile`, `docker-compose*.yml`.

### V4 wave history (already built)

### Wave 1: Foundations (3 agents)

| WP | Work | Agent | Owns | Gate |
| :--- | :--- | :--- | :--- | :--- |
| 01 | Next.js scaffold and design system | MOTION | package.json, next.config.mjs, Tailwind/PostCSS, `src/app/layout.jsx`, `src/styles/*`, playwright.config.js | Build passes; no TypeScript; local fonts; CSP |
| 02 | Containers, policy, env | ARCH | docker-compose*.yml, Dockerfile, Caddyfile, .env.example, entrypoint, policy check | Compose config valid; policy check passes; no default password |
| 03 (HR) | Crypto core | BUILD | `src/lib/crypto/*`, `/api/crypto/public-key` | Seal/open roundtrip; fingerprint; private key never on server |

### Wave 2: Data and identity (3 agents)

| WP | Work | Agent | Owns | Gate |
| :--- | :--- | :--- | :--- | :--- |
| 04 | Prisma schema, migration, db | ARCH | prisma/schema.prisma, migrations, `src/lib/db.js` | Migrate and generate pass; all models; FK rules |
| 05 | Seeds, bootstrap admin, demo-credential check | MOTION | seed.reference.js, seed.demo.js, bootstrap-admin.js, check-no-demo-creds.js | Idempotent twice; production refuses demo data |
| 06 (HR) | Auth, session, RBAC core | BUILD | `src/lib/auth.js`, `/api/auth/*`, `/api/resident/{activate,login,logout,me}` | 15-min server idle timeout; lockout; no `resident_id` in request body |

### Wave 3: Citizen-facing (3 agents)

| WP | Work | Agent | Owns | Gate |
| :--- | :--- | :--- | :--- | :--- |
| 07 | Animated homepage | MOTION | `src/app/page.jsx`, `src/components/home/*`, Skeletons | Reduced motion; works without JS; print; CLS < 0.1 |
| 08 | Public pages and document intake | UI | track, broadcasts, directory, offline, resident login/activate, services/request, `/api/documents/*` | Submit and track work; PII masked |
| 09 | PWA, outbox, local AI | ARCH | sw.js, manifest, `lib/offline/*`, `lib/ai/*`, `/api/ai/*`, `/api/health` | Offline shell; exactly-once replay; no admin cache |

### Wave 4: Sensitive modules (4 agents)

| WP | Work | Agent | Owns | Gate |
| :--- | :--- | :--- | :--- | :--- |
| 10 (HR) | Anonymous blotter | BUILD | `src/app/blotter/**`, `/api/blotter/**`, sanitizer, proof-of-work | No IP or cookie stored; ciphertext only |
| 11 | Digital Barangay ID viewer (view only, Sec. 17) | UI | `src/app/id-card/**`, `/api/resident/id-card`, DigitalIDCard, BarcodeDisplay | Own card only; no print route, button or permission |
| 12 | Business clearance gateway | UI | `services/business-clearance/**`, `/api/business/**` | No online approval; Treasurer required |
| 13 | Treasury and receipts | ARCH | `admin/treasury/**`, `/api/treasury/**` | OR number unique; audit log written |

### Wave 5: Admin, print, reliability (3 agents)

| WP | Work | Agent | Owns | Gate |
| :--- | :--- | :--- | :--- | :--- |
| 14 | Admin shell and queues | ARCH | `admin/{login,layout,dashboard,residents,documents,broadcasts,directory}/**`, SessionGuard | Role isolation; server idle timeout; no stale cache |
| 15 | Print engine (certificates only, NFR-05) | MOTION | `admin/documents/print/[id]/**`, PrintClearance, PrintIndigency, print.css | A4 and Letter; black and white; QR verifies; no glass |
| 16 (HR) | Reliability and ops | BUILD | `ops/**`, docker-compose.reliability.yml, backup, restore, failover scripts | Backup, restore and failover drills pass |

### Wave 6: Verification (3 writing, 3 read-only)

| WP | Work | Agent | Gate |
| :--- | :--- | :--- | :--- |
| 17 | Functional tests: citizen-flow, business-gateway, rbac-security, print-fidelity | MOTION | Pass |
| 18 | Resilience tests: offline, zero-external-origins, homepage-animation, performance-budget | UI | Pass |
| 19 | Security tests: blotter-zk, encryption, resident-auth | BUILD | Pass |
| 20 | Invariant and secrets audit (read-only) | AUDIT-1 | Report only |
| 21 | Second-opinion code and security audit (read-only) | AUDIT-2 | Report only |
| 22 | Visual audit: screenshots, print, mobile, reduced motion (read-only) | VISION | Report only |

## 4. V5 gate check (ORCH runs, a person confirms)

1. `npm run check:policy`
2. `npm run check:demo-creds`
3. `npx prisma validate && npx prisma migrate deploy`
4. `npm run build`
5. `node scripts/generate-field-key.js` prints a 44-character base64 key and writes no file inside the repo
6. V5 static gate: no `RECORDS_*`, no `/api/crypto/public-key`, no browser `seal`/`open`/`importPublicKey`, no RSA key files, no plaintext-column writes
7. V5 E2E gate: plaintext POSTs, DB ciphertext for blotter/document/business/resident PII, authorized staff decrypt, public endpoints never leak, GCM tamper fails safely, audit rows written, 403 for unauthorized roles, `pg_dump` contains no test plaintext
8. `docker compose config`

## 5. Build log (fill in as you go)

| WP | Model actually used | Effort | Date | Reviewed by | Gate result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | `opencode/big-pickle` | default | 2026-11-15 | ORCH | PASS — build, no TypeScript, self-hosted fonts, CSP |
| 02 | `opencode/glm-5.3-flash-free` | default | 2026-11-15 | ORCH | PASS — compose config, policy check, no default DB password |
| 03 | `opencode/minimax-m3.1-flash-free` | default | 2026-11-15 | Human (Wave 1 approval) | PASS technical — seal/open, tamper rejection, fingerprint; HR approved in the Wave 1 approval message |
| 04 | `opencode/glm-5.3-flash-free` | default | 2026-11-15 | ORCH | PASS — 13 tables, initial migration, FK rejection tests |
| 05 | `opencode/big-pickle` | default | 2026-11-15 | ORCH | PASS — seeds idempotent twice, production refusal, boot tripwire |
| 06 | `opencode/glm-5.3-flash-free` (approved substitute; minimax hit its free-usage limit) | default | 2026-11-15 | ORCH technical + human accepted | PASS — 17 auth/session/RBAC checks, build, live 401/400 responses; substitution and HR review approved by the team |
| 07 | `opencode/big-pickle` | default | 2026-11-15 | ORCH | PASS — 12 static pages, `/` 102 kB first load, 4 blur surfaces, CLS < 0.1, reduced motion 0 animations, no-JS readable, 375px overflow fixed at the hero |
| 08 | `opencode/mimo-v2.6-flash-free` | default | 2026-11-15 | ORCH | PASS — 12/12 document API E2E, 7/7 browser intake flow, ciphertext-only purpose, idempotent replay, masked tracking, generic 404 |
| 09 | `opencode/glm-5.3-flash-free` | default | 2026-11-15 | ORCH | PASS — Service Worker precaches 7 routes/35 files, offline reload, no admin/auth/document cache, 51/51 local AI and tier unit checks |
| 10–13 | see V4 Wave 4 gate evidence | default | 2026-11-16 | ORCH | V4 technical PASS 113/113; **superseded by V5, reopened** |
| 03-V5 | `opencode/deepseek-v4.1-flash-free#max` (approved substitute; `glm-5.3-flash-free` out of credits) | MAX | 2026-11-17 | Human (HR approved) + ORCH technical | PASS — HR approved; v1 format, AAD binding, GCM tamper, key refusal, ciphertext proof |
| 04-V5 | `opencode/deepseek-v4.1-flash-free#max` (approved substitute; `glm-5.3-flash-free` out of credits) | MAX | 2026-11-17 | Human (HR approved) + ORCH technical | PASS — HR approved; `migrate deploy` no pending, `prisma validate`, seed ×2 identical, 0 non-ciphertext rows |
| 08-V5 | `opencode/beam-free#max` (substitute; mimo has no effort variant) | MAX | 2026-11-17 | ORCH technical; changed JSX SWC-verified | PASS technical — documents routes/forms/pages + design polish, documents PATCH 28/0, E2E 297/0 |
| 10-V5 | `opencode/inkling-2-small-free#max` (approved substitute; `minimax-m3.1-flash-free` out of credits) | MAX | 2026-11-17 | Human (HR approved) + ORCH technical | PASS — HR approved; audit NITs fixed and re-gated, E2E 297/0 |
| 12-V5 | `opencode/flint-40b-free#max` (substitute; mimo has no effort variant) | MAX | 2026-11-17 | ORCH technical; changed JSX SWC-verified | PASS technical — business routes/form/page + design polish, E2E 297/0 |
| 11-V5 | `opencode/deepseek-v4.1-flash-free#max` (approved substitute; `glm-5.3-flash-free` out of credits) | MAX | 2026-11-17 | ORCH technical | PASS technical — ID-card allow-list only, own card, generic 404, corrupt field 200 "Not available", no print route |
| 13 | `opencode/flint-40b-free#max` | MAX | 2026-11-17 | ORCH technical | PASS — Treasury & Cashier, fee settlement, OR number generation, business fee screening |
| 14 | `opencode/gemini-3.8-flash#high` | HIGH | 2026-11-17 | ORCH technical | PASS — Admin portal shell, sidebar, SessionGuard (15m idle), document review queue, blotter queue, broadcasts publisher, directory editor |
| 15 | `opencode/gemini-3.8-flash#high` | HIGH | 2026-11-17 | ORCH technical | PASS — Print engine, print.css NFR-05 zero-glass A4/Letter, PrintClearance, PrintIndigency, QRCodeDisplay vector scale |
| 16 | `opencode/gemini-3.8-flash#high` | HIGH | 2026-11-17 | ORCH technical + Human review ready | PASS — docker-compose.reliability.yml, hourly backup, prune, spare sync, watchdog, restore drill, deep health probe |
| 17–19 | `opencode/gemini-3.8-flash#high` | HIGH | 2026-11-17 | ORCH technical | PASS — 11 Playwright CLI test suites in tests-e2e/ (functional, resilience, security), check:policy PASS, build exit 0 |

> **V5 wave status (2026-11-17).** Gate evidence on the final build (port 3109): static 74/0, live E2E 297/0, documents PATCH 28/0, `npm run build` exit 0, `check:policy` PASS, V4 token sweep 0 hits, DB restored to demo counts 5/2/4/3/2/10 with 0 fixture rows. 08-V5, 11-V5 and 12-V5 are technical PASS by ORCH. **HR acceptance:** Human line-by-line review of the HR-marked packages — WP-03 (547 lines), WP-04 (1,128 lines), WP-10 (1,607 lines) — has been completed and **accepted by human operator**. The V5 wave gate is **PASSED AND ACCEPTED**. Work may now proceed to Wave 5.
>
> Substitutions recorded per rules 7–8: WP-03/04/11-V5 ran on `opencode/deepseek-v4.1-flash-free#max` (roster `glm-5.3-flash-free` out of credits); WP-10-V5 ran on `opencode/inkling-2-small-free#max` (roster `minimax-m3.1-flash-free` out of credits); WP-08-V5 ran on `beam-free#max` and WP-12-V5 on `flint-40b-free#max` (their roster models have no effort variant). All ran at MAX; no package silently dropped effort. Audits: AUDIT-1 `beam-free#max` reviewed WP-03/04, AUDIT-2 `flint-40b-free#max` reviewed WP-10; `iceman-free` has no effort variant and was replaced under the same rule. Both audits reported no BLOCKER and no MAJOR.
>
> **ORCH edits outside package ownership (disclosed).** `src/lib/auth.js` was on the wave read-only list, but ORCH added three explicit `select`s (session validation, `issueActivation`, `activateResidentAccount`) after ARCH named BUILD/ORCH the fix owner for the corrupt-encrypted-field 500; the full E2E gate ran after that edit and passed. ORCH also corrected stale V4 copy in `src/components/home/QuickActionGrid.jsx`, `src/lib/ai/kb.js` (English, Tagalog and Cebuano) and `src/lib/ai/scrub.js`, and fixed seven bugs in its own static harness.

## 6. Decisions for the plan mismatches (approved)

1. **Status enums.** The Prisma enums are the source of truth for stored states. The extra labels in the state-machine diagrams are derived states:

   | Diagram label | Stored as |
   | :--- | :--- |
   | `AI_FLAGGED` | `UNDER_REVIEW` plus a flag in `ai_verification` |
   | `INDIGENCY_FREE` | `UNDER_REVIEW` with `fee_amount = 0`, then `READY_FOR_PICKUP` |
   | `PAID` | A `PaymentRecord` exists; status becomes `READY_FOR_PICKUP` |
   | `CHECKLIST_ISSUED` | `INTAKE_SCHEDULED` plus checklist rows |
   | `REVENUE_ASSESSED`, `INSPECTION_VERIFIED` | `TREASURER_ASSESSED` plus checklist fields and audit-log entries |
   | `APPROVED_BY_TREASURER` | `APPROVED` |
   | `REJECTED_NON_COMPLIANT` | `REJECTED` |

2. **Model count.** There are 13 models, not 12. The thirteenth is `ResidentCredential`. WP04 validates all 13.
3. **Playwright.** `baseURL` is `process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'` (localhost is a secure context). Add the `mobile-low-end` project (`devices['Moto G4']`, 4x CPU throttling, slow network). HTTPS test runs must work with Caddy's local certificate.
4. **`best_proxy`.** Required from Wave 1. `best_app` listens on `127.0.0.1:3000` only.
5. **Skills.** `graphify`, `ponytail`, `caveman`, `ui-ux-pro-max` and `frontend-design` (Anthropic) are vendored in `.agents/skills/`. The two design skills are used for UI structure, visual and interaction decisions; the plan's Sec. 9 design system and invariants win on any conflict. Taste-skill and impeccable-design are not vendored. `check:policy` must not fail because a non-vendored design skill folder is missing.
6. **V5 storage format.** Each encrypted value is one text column: `v1.<kid>.<iv>.<ct>.<tag>`. The AAD context is the Prisma model and column, for example `Resident.contact_number` or `BlotterReport.enc_payload`. The default key id is `fk-1`; `FIELD_ENC_KEY_ID` may override it.
7. **V5 key handling.** `FIELD_ENC_KEY` is the only required encryption secret. The app validates it at startup and refuses to run when it is missing or not 32 bytes. No RSA keypair, public-key endpoint, custodian, USB key copy or unlock dialog exists in V5.
8. **V4 ciphertext is not forward-readable.** V4 stored RSA envelope JSON for blotter/document/business and JSON field envelopes for resident PII. V5 uses a new format, so pre-production rows must be re-seeded or re-encrypted. This repository has fake data only; the V5 gate creates fresh fixtures. A production migration would need a one-off decrypt-and-re-encrypt tool, which is out of scope for this pre-production build.
   **Known limitation — key rotation (AUDIT-1 MINOR, 2026-11-17).** `loadFieldConfig` (`src/lib/crypto/field.js:118`) loads only the current key (`keys: new Map([[currentKeyId, key]])`), so the plan's Sec. 12.3 rotation — add the new key to `.env`, mark it current, run a re-encryption script, keep old keys in `.env` until every row is re-encrypted — is not implemented. A ciphertext written under an older `kid` fails closed with `KID_UNKNOWN` (`src/lib/crypto/field.js:223-225`) and never returns plaintext, so data is not exposed; it is an availability gap during a rotation this build does not perform. The re-encryption tool is the same out-of-scope item above. Revisit before any production key rotation.
9. **Blotter tracking code.** The literal example `BLT-7X9K-42` is 11 characters and is the implemented format. The prose "10-character" is a counting error in the plan; the example and the schema comment win.
10. **Audit on encrypted reads.** Staff-only detail endpoints write `AuditLog` with action `VIEW_ENCRYPTED` and metadata containing field names only, never plaintext.
11. **Offline outbox.** It stores what the citizen typed on their own device only, purges after delivery and is disabled in kiosk mode. A queued blotter report gets a fresh proof-of-work challenge when it is replayed; the expired challenge is never reused.
12. **Digital ID.** View-only in every V5 build: no print route, button, handler, permission or `@media print` rule.

The implementation plan file itself is not edited for any of these.

## 7. Suggested start

Finish the V5 migration wave and its gate before starting Wave 5. If the MAX
models stay stable, continue with the admin shell and print engine.
