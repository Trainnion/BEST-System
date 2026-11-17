# BEST System — AI Work Distribution Plan

**Project:** Barangay E-Services System Terminal [BEST]  
**Source plan:** `docs/implementation-plan.md` (V4, 2,444 lines)  
**Project root:** `C:\Users\Lloyd\Desktop\BEST system`  
**Distribution version:** 1.0  
**Date:** 2026-11-14  
**Status:** Distribution saved only — no repository, code, or agents started.

---

## 0. Decisions already made

| Decision | Value |
| :--- | :--- |
| Project location | `C:\Users\Lloyd\Desktop\BEST system` |
| Current phase | Planning / distribution only |
| Model budget | Free models only |
| Design skills | Follow the written doctrine in Sections 2–3; do not install external skills |
| Superpowers | Banned (`AGENT-01`); do not install, load, or invoke it |
| Max concurrent writers | 4 (proposed; lower if free-tier rate limits bite) |
| Orchestrator | `opencode/deepseek-v4.1-flash-free` (this session) |

**Design-skill note:** `taste-skill`, `impeccable-design`, `awesome-design`, and `ui-ux-pro-max` are not present in this environment. Agents must follow the written design rules in the plan (Sections 2 and 3) instead. The folders may be vendored later under `.agents/skills/` without changing this distribution.

---

## 1. Operating model

1. **One orchestrator, many workers.** I own interface contracts, file ownership, merge decisions, and every phase gate.
2. **One writer per file set per wave.** No two writing agents touch the same file in the same wave. Shared files (`package.json`, `src/app/layout.jsx`, `prisma/schema.prisma`) have a single named owner.
3. **Phase gates are hard.** Wave N+1 does not start until Wave N's gate passes. Parallelism happens only inside a wave.
4. **Fresh context, explicit briefs.** Subagents do not inherit this conversation. Every brief includes the plan path, exact sections, invariants, write scope, acceptance gate, and report format.
5. **Same session for fixes.** If a work package fails its gate, the same subagent session receives the fix brief; a new agent is not spawned.
6. **Read-only audits.** `explore` agents never edit. They return findings only.
7. **Free-model fallback.** If an OpenRouter `:free` model is rate-limited or unavailable, fall back to an OpenCode free model. Never escalate to a paid model.
8. **No external runtime origins.** Agents must not add CDNs, Google Fonts, analytics, remote images, or any runtime external request.

---

## 2. Free-only roster

| Call sign | Agent type | Model | Responsibility |
| :--- | :--- | :--- | :--- |
| **ORCH** | primary (me) | `opencode/deepseek-v4.1-flash-free` | contracts, integration, gates, final review |
| **ARCH** | general | `opencode/glm-5.3-flash-free` | schema, auth/security, admin backend, complex refactors |
| **BUILD** | general | `opencode/minimax-m3.1-flash-free` | APIs, crypto, blotter, treasury, ops |
| **UI** | general | `opencode/longcat-2.5-free` | citizen pages, forms, business flow |
| **MOTION** | general | `opencode/iceman-free` | homepage, print engine, functional tests |
| **PWA** | general | `opencode/mimo-v2.6-flash-free` | service worker, outbox, AI widget, ID viewer |
| **QA** | general | `opencode/inkling-2-small-free` | resilience and performance tests |
| **VISION** | explore | `opencode/nemotron-3.5-super-vl-free` | screenshot, print, mobile, reduced-motion audit |
| **AUDIT-1** | explore | `openrouter/flint-v1.0:free` | independent invariant/security review |
| **AUDIT-2** | explore | `openrouter/particle-1:free` | second-opinion review |

All models above are free. `explore` is read-only; `general` may write inside its assigned scope.

---

## 3. Work packages

### Wave 1 — Foundations (3 agents in parallel)

| WP | Work | Agent / model | Exclusive write scope | Gate |
| :--- | :--- | :--- | :--- | :--- |
| **WP-01** | Next.js scaffold, design tokens, motion CSS, Playwright config | **MOTION** / `opencode/iceman-free` | `package.json`, `next.config.mjs`, `jsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `src/app/layout.jsx`, `src/styles/**`, `design-system/**`, `src/lib/hooks/**`, `playwright.config.js`, `.gitignore` | `npm install`; `npm run build` with placeholder page; no TypeScript; self-hosted fonts; production CSP present |
| **WP-02** | Containers, policy, env, Caddy | **ARCH** / `opencode/glm-5.3-flash-free` | `docker-compose.yml`, `docker-compose.reliability.yml`, `Dockerfile`, `.dockerignore`, `Caddyfile`, `.env.example`, `scripts/docker-entrypoint.sh`, `scripts/check-agent-policy.js`, `AGENTS.md`, `ops/**` skeleton only | `docker compose config`; `node scripts/check-agent-policy.js` exits 0; no default DB password; no plain-HTTP listener |
| **WP-03** | Crypto core and key tooling | **BUILD** / `opencode/minimax-m3.1-flash-free` | `src/lib/crypto/**`, `src/app/api/crypto/public-key/route.js`, `scripts/generate-records-key.js` | Seal/open roundtrip; GCM tamper fails; fingerprint matches; private key never on server |

**Wave 1 deliverables in detail**

- **WP-01:** Next.js 14.2.25, React 18.3.1, Tailwind 3.4.14, Lucide, `@fontsource-variable` packages, ESM JavaScript only, semantic tokens, `motion.css` (Section 3.3), `html.js` bootstrap, `useMotionPreference`, `useInView`, Playwright projects (Desktop Chrome, Mobile Chrome, Desktop Reduced Motion, Mobile Low-End).
- **WP-02:** PostgreSQL 16 Alpine, app container, required Caddy HTTPS proxy, no access logs, blotter header stripping, entrypoint guard, `AGENTS.md` with the invariants, policy script.
- **WP-03:** AES-256-GCM + RSA-OAEP-3072 envelope, `seal()`/`open()`, public-key endpoint, encrypted private-key file (PBKDF2-SHA256 600,000 iterations + AES-256-GCM), field-level encryption helper.

### Wave 2 — Data and identity (3 agents in parallel)

| WP | Work | Agent / model | Exclusive write scope | Gate |
| :--- | :--- | :--- | :--- | :--- |
| **WP-04** | Prisma schema, migration, db client, constants | **ARCH** / `opencode/glm-5.3-flash-free` | `prisma/schema.prisma`, `prisma/migrations/**`, `src/lib/db.js`, `src/lib/constants.js` | `npx prisma validate`; `npx prisma generate`; migration applies; all models and FK actions present |
| **WP-05** | Reference/demo seeds, bootstrap admin, demo tripwire | **MOTION** / `opencode/iceman-free` | `prisma/seed.reference.js`, `prisma/seed.demo.js`, `scripts/bootstrap-admin.js`, `scripts/check-no-demo-creds.js` | Both seeds run twice with no duplicates; production refuses demo data; demo passwords rejected |
| **WP-06** | Auth, sessions, resident activation, RBAC core | **BUILD** / `opencode/minimax-m3.1-flash-free` | `src/lib/auth.js`, `src/app/api/auth/**`, `src/app/api/resident/{activate,login,logout,me}/**`, `src/app/api/residents/[id]/activation/route.js` | JWE `HttpOnly; Secure; SameSite=Strict`; 15-min server idle + 8-hour absolute; lockout; no `resident_id` accepted in bodies |

**Wave 2 dependency:** WP-04 owns the schema. WP-05 and WP-06 start only after WP-04's migration gate passes.

### Wave 3 — Citizen-facing (3 agents in parallel)

| WP | Work | Agent / model | Exclusive write scope | Gate |
| :--- | :--- | :--- | :--- | :--- |
| **WP-07** | Living Glass homepage and motion | **MOTION** / `opencode/iceman-free` | `src/app/page.jsx`, `src/components/home/**`, `src/components/Skeletons.jsx` | Reduced-motion and no-JS safe; print safe; CLS < 0.1; animated within 1 s |
| **WP-08** | Public pages, document intake, resident pages | **UI** / `opencode/longcat-2.5-free` | `src/app/{track,broadcasts,directory,offline,resident/login,resident/activate}/**`, `src/app/services/request/**`, `src/app/api/documents/{route,track,[id]}/**`, `src/app/api/public/stats/**`, `src/components/{Navbar,Footer,StatusBadge,OfflineBanner,SyncStatus}.jsx` | Submit → track; masked PII; 401 without session; 400 when `resident_id` is present |
| **WP-09** | PWA, outbox, local AI, Kaagapay | **PWA** / `opencode/mimo-v2.6-flash-free` | `public/sw.js`, `public/manifest.webmanifest`, `public/icons/**`, `scripts/gen-precache.js`, `src/lib/offline/**`, `src/lib/ai/**`, `src/app/api/ai/**`, `src/app/api/health/**`, `src/app/services/kaagapay/**`, `src/components/{ServiceWorkerRegistrar,AIKaagapayWidget}.jsx` | Offline shell works; outbox delivers exactly once; no admin/authenticated caching; EN/TL/CEB local answers with `source: "local"` |

**Wave 3 note:** WP-08 consumes WP-09's outbox API. The interface (`enqueue`, `replay`, `purge`) must be agreed in the brief before either starts.

### Wave 4 — Sensitive modules (4 agents in parallel)

| WP | Work | Agent / model | Exclusive write scope | Gate |
| :--- | :--- | :--- | :--- | :--- |
| **WP-10** | Zero-knowledge blotter | **BUILD** / `opencode/minimax-m3.1-flash-free` | `src/app/blotter/**`, `src/app/api/blotter/**`, `src/lib/sanitizer.js`, proof-of-work helpers | No IP/cookie/UA/Referer in blotter path; ciphertext only; POW enforced; no `Set-Cookie`; tracking works |
| **WP-11** | Digital Barangay ID viewer | **PWA** / `opencode/mimo-v2.6-flash-free` | `src/app/id-card/**`, `src/app/api/resident/id-card/route.js`, `src/components/{DigitalIDCard,BarcodeDisplay}.jsx` | Own card only; no print route/button; 3D flip in Full, tap-to-swap in Lite; barcode decodes |
| **WP-12** | Business clearance gateway | **UI** / `opencode/longcat-2.5-free` | `src/app/services/business-clearance/**`, `src/app/api/business/**`, business checklist components | No automated approval; checklist and appointment generated; treasurer screening required |
| **WP-13** | Treasury and receipts | **ARCH** / `opencode/glm-5.3-flash-free` | `src/app/admin/treasury/**`, `src/app/api/treasury/**`, receipt components | Unique OR; audit log; payment updates the target correctly; counter-only flow works offline |

**Wave 4 note:** WP-10 and WP-11 depend on WP-03 and WP-06. WP-12 and WP-13 depend on WP-04 and WP-06.

### Wave 5 — Admin, print, reliability (3 agents in parallel)

| WP | Work | Agent / model | Exclusive write scope | Gate |
| :--- | :--- | :--- | :--- | :--- |
| **WP-14** | Admin shell, queues, RBAC screens | **ARCH** / `opencode/glm-5.3-flash-free` | `src/app/admin/{login,layout.jsx,dashboard,residents,documents/page.jsx,broadcasts,directory}/**`, `src/components/{AdminSidebar,SessionGuard,ServerUnreachable}.jsx`, `src/app/api/residents/route.js`, `src/app/api/documents/{assisted,[id]}/**`, `src/app/api/broadcasts/**`, `src/app/api/directory/**` | Role isolation; server-enforced timeout; no stale admin cache; activation slip and assisted intake work |
| **WP-15** | Print fidelity engine | **MOTION** / `opencode/iceman-free` | `src/app/admin/documents/print/[id]/**`, `src/components/{PrintClearance,PrintIndigency,QRCodeDisplay}.jsx`, `src/styles/print.css` | A4/Letter exact; pure B&W; QR verifies; zero glass/nav artifacts; decrypts in memory only |
| **WP-16** | Reliability and ops | **BUILD** / `opencode/minimax-m3.1-flash-free` | `ops/**`, `docker-compose.reliability.yml` (complete), `scripts/{pre-update-backup,rollback,promote-spare,test-restore,make-offline-bundle}.sh`, `src/app/api/health/deep/route.js` | Hourly encrypted backup; restore drill; failover drill; watchdog; health-deep reports backup age |

**Wave 5 note:** WP-14 owns `admin/layout.jsx`; WP-13 owns only `admin/treasury/**`; WP-15 owns only `admin/documents/print/**`. No overlap.

### Wave 6 — Verification (6 agents: 3 writers + 3 read-only)

| WP | Work | Agent / model | Exclusive write scope | Gate |
| :--- | :--- | :--- | :--- | :--- |
| **WP-17** | Functional E2E | **MOTION** / `opencode/iceman-free` | `tests-e2e/{citizen-flow,business-gateway,rbac-security,print-fidelity}.spec.js` | All pass on Desktop and Mobile |
| **WP-18** | Resilience/performance E2E | **QA** / `opencode/inkling-2-small-free` | `tests-e2e/{offline-resilience,zero-external-origins,homepage-animation,performance-budget}.spec.js` | All pass, including low-end and reduced-motion projects |
| **WP-19** | Security/crypto E2E | **BUILD** / `opencode/minimax-m3.1-flash-free` | `tests-e2e/{blotter-zk,e2e-encryption,resident-auth}.spec.js` | All pass, including tamper and cookie-stripping tests |
| **WP-20** | Independent audit | **AUDIT-1** / `openrouter/flint-v1.0:free` | none (read-only) | Invariants, secrets, policy, permission boundaries |
| **WP-21** | Independent audit | **AUDIT-2** / `openrouter/particle-1:free` | none (read-only) | Second-opinion code/security review |
| **WP-22** | Visual audit | **VISION** / `opencode/nemotron-3.5-super-vl-free` | none (read-only) | Desktop/mobile/print/reduced-motion screenshots |

**Wave 6 note:** WP-18's performance suite requires the `mobile-low-end` Playwright project; WP-01 must include it. All test authors start only after Waves 3–5 interfaces are frozen.

---

## 4. Dependency graph

```text
WP-01 (scaffold) ─┬─> WP-04 (schema) ─┬─> WP-05 (seeds)
WP-02 (infra) ────┤                   ├─> WP-06 (auth)
WP-03 (crypto) ───┘                   │
                                     ├─> WP-07 (homepage)
                                     ├─> WP-08 (public/docs) <── WP-09 (PWA/AI)
                                     ├─> WP-09 (PWA/AI)
                                     ├─> WP-10 (blotter) <── WP-03, WP-09
                                     ├─> WP-11 (ID) <── WP-06
                                     ├─> WP-12 (business)
                                     └─> WP-13 (treasury) <── WP-06

WP-04/05/06 ──> WP-14 (admin)
WP-06/14 ─────> WP-15 (print)
WP-02/04 ─────> WP-16 (ops)

WP-07..WP-16 ──> WP-17/18/19 (E2E)
WP-01..WP-16 ──> WP-20/21/22 (audits)
```

**Critical path:** WP-01/02/03 → WP-04 → WP-06 → WP-08/10/11 → WP-14 → WP-15/16 → WP-19/17/18.

---

## 5. File-ownership rules

- `package.json` — WP-01 only. Other agents request dependency additions through the orchestrator.
- `src/app/layout.jsx`, `src/styles/**` — WP-01, except `src/styles/print.css` (WP-15).
- `prisma/schema.prisma`, `prisma/migrations/**` — WP-04 only.
- `src/lib/crypto/**` — WP-03 only; all others import, never edit.
- `src/lib/auth.js` — WP-06 only.
- `src/lib/offline/**`, `src/lib/ai/**`, `public/sw.js` — WP-09 only.
- `src/app/admin/layout.jsx` — WP-14 only.
- `src/app/admin/treasury/**` — WP-13 only.
- `src/app/admin/documents/print/**`, `src/styles/print.css` — WP-15 only.
- `tests-e2e/**` — WP-17/18/19 only; one spec file per work package.
- `docker-compose.yml`, `Dockerfile`, `Caddyfile`, `AGENTS.md` — WP-02; WP-16 may extend only `docker-compose.reliability.yml`.
- `ops/**` — WP-16 after WP-02 creates the skeleton.

**No agent may edit a file outside its exclusive scope.** If a change is needed elsewhere, it reports the request to the orchestrator.

---

## 6. Agent brief template

Every subagent prompt must contain:

```text
ROLE: <call sign> — <one-line responsibility>
MODEL: <free model id>
PROJECT ROOT: C:\Users\Lloyd\Desktop\BEST system
SOURCE PLAN: docs/implementation-plan.md

READ FIRST:
- docs/implementation-plan.md, sections <X.Y–A.B>
- AGENTS.md (invariants, banned skills)

YOUR EXCLUSIVE WRITE SCOPE:
- <exact paths/directories>

DO NOT:
- Edit files outside your scope.
- Add TypeScript, external runtime origins, CDNs, Google Fonts, analytics, or remote images.
- Install or invoke the Superpowers skill or any plugin/command with that name.
- Use a paid model, or call external AI APIs for blotter or resident PII.
- Start work dependent on another unfinished work package.

DELIVER:
- <files and behavior>

ACCEPTANCE GATE:
- <commands and pass conditions>

REPORT:
1. Files created/changed.
2. Commands run + results.
3. Gate status (PASS/FAIL).
4. Risks, assumptions, and anything the orchestrator must decide.
```

---

## 7. Gate protocol

After every wave, the orchestrator runs:

```text
npm run check:policy
npm run check:demo-creds
npx prisma validate
npx prisma migrate deploy
npm run build
npx playwright test <wave-specific specs>
docker compose config
```

For Waves 4–6, an `explore` audit runs before the gate is accepted. A failed gate goes back to the owning agent's session with the exact failing output.

---

## 8. Plan issues and proposed defaults

These are real contradictions in the source plan. The defaults below unblock execution unless overridden.

| # | Issue | Proposed default |
| :-: | :--- | :--- |
| 1 | `DocumentStatus` lacks `AI_FLAGGED`, `INDIGENCY_FREE`, `PAID` used by state machine 1.3A | Keep the Prisma enum canonical: AI flags live in `ai_verification`; indigency goes `UNDER_REVIEW → READY_FOR_PICKUP` with `fee_amount = 0`; payment moves `PAYMENT_PENDING → READY_FOR_PICKUP` |
| 2 | `BusinessStatus` lacks `CHECKLIST_ISSUED`, `REVENUE_ASSESSED`, `INSPECTION_VERIFIED`, `APPROVED_BY_TREASURER`, `REJECTED_NON_COMPLIANT` used by state machine 1.3B | Keep the Prisma enum canonical and map labels in the UI/API transitions |
| 3 | Plan says "12 tables" but the schema defines 13 models | Treat 13 as correct; update the plan text later |
| 4 | Playwright uses `http://localhost:3000` while V4 requires HTTPS | `PLAYWRIGHT_BASE_URL` env var; default to `https://best.lan`; allow `http://localhost:3000` only for explicit local-dev runs |
| 5 | Sec. 14.5 references a `mobile-low-end` Playwright project, but the config lists only three projects | Add the `mobile-low-end` project (`devices['Moto G4']`) in WP-01 |
| 6 | Phase 1 calls `best_proxy` optional; V4 calls it required | Treat Caddy as required from Wave 1 |
| 7 | `docker-compose.yml` uses obsolete `version: '3.8'` | Remove it (Compose v2 warns) |
| 8 | Design skills are not installed | Follow the written doctrine in Sections 2–3; do not install external skills |
| 9 | `.env.example` lists `BEST_HOST` twice | De-duplicate in WP-02 |

---

## 9. Risks and mitigations

| Risk | Mitigation |
| :--- | :--- |
| Free models produce inconsistent code | Small work packages, strict file ownership, hard gates, independent audits |
| Free-tier rate limits | Cap at 4 concurrent writers; fall back to OpenCode free models; retry with backoff |
| Context-window limits | Each brief cites only the relevant plan sections; orchestrator supplies interface contracts |
| Design skills absent | Written doctrine + VISION screenshot audit + manual review |
| EN/TL/CEB knowledge base quality | Human native-speaker review before release (plan Sec. 7.5 delivery note) |
| Security/legal correctness | Independent security audit, invariant checks, human sign-off on R.A. 10173/R.A. 7160 language |
| Docker daemon not running | Verify `docker info` before Wave 1; start Docker Desktop if needed |
| Windows/Docker path issues | Keep the project under `C:\Users\Lloyd\Desktop\BEST system`; use quoted paths in scripts |
| Plan contradictions | Defaults in Section 8; record any override in this file |

---

## 10. Next step

When you say **"Start Wave 1"**, I will:

1. Create/initialize `C:\Users\Lloyd\Desktop\BEST system` as a git repository.
2. Archive the source plan at `docs/implementation-plan.md`.
3. Write the root `AGENTS.md` with the invariants and the Superpowers ban.
4. Launch WP-01, WP-02, and WP-03 in parallel on free models.
5. Report each agent's files, commands, gate result, and any decisions needed.
6. Run the Wave 1 gate and only then proceed to Wave 2.

No code or agents have been started yet.
