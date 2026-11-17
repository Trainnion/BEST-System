# AGENTS.md — BEST System Repository Policy

**Project**: Barangay E-Services System Terminal [BEST] — offline-first barangay
hall system for R.A. 7160 / R.A. 10173 compliance. Team: Cadavid, Genella,
Gutib M., Gutib J., Saldua.

**Stack**: JavaScript ESM only (NO TypeScript), Next.js 14.2.x App Router,
PostgreSQL 16 + Prisma, Tailwind glassmorphism design system, Playwright CLI.

**Spec**: `docs/implementation-plan.md` is the single source of truth (V5,
Encryption at Rest). Work assignment: `docs/ai-work-distribution.md`. Read your
package's plan section before writing anything.

## Forbidden tools

- **The Superpowers skill is banned.** It must not be installed, loaded or
  invoked — including its slash commands and bundled workflows (AGENT-01).
  `npm run check:policy` fails the gate if it appears anywhere in the repo.
- **Only skills vendored in `.agents/skills/` may be used.** Vendored:
  `graphify` (architecture graph and impact queries), `ponytail` (zero-bloat
  lean JavaScript), `caveman` (terse, high-density reporting),
  `ui-ux-pro-max` (searchable design intelligence; run
  `python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <ux|style|typography|color|landing>`)
  and `frontend-design` (Anthropic visual-direction guidance, SKILL.md in
  `.agents/skills/frontend-design/`). Use both design skills for UI structure,
  visual and interaction decisions. The plan's Sec. 9 design system and the
  invariants always win when a skill suggestion conflicts with them. Other
  design skills (taste-skill, impeccable-design) are not vendored.

## Data and secrets rules

- **Fake data only.** Free models keep what you send them. Never paste real
  resident names, IDs, blotter text, passwords or `.env` values into any model
  prompt, issue or commit.
- **No real secrets or keys in the repository.** No real `.env`, no
  certificates, no key material committed.
- **A person generates keys and secrets.** `npm run keys:generate` prints a new
  `FIELD_ENC_KEY` (32 random bytes, base64) on the server PC and a team member
  pastes it into `.env` (file permissions `600`). The key never passes through
  a model. The administrator keeps one spare copy somewhere that is not the
  server and never with the encrypted backups (ENC-01).
- **No records keypair and no unlock step.** V5 removed the RSA records key,
  the two key custodians, the USB key copies, `/api/crypto/public-key` and the
  "Unlock Records" dialog. Do not reintroduce them.

## Invariants (summary of plan Sec. 10.3 — DO NOT VIOLATE)

1. No IP address column anywhere in `BlotterReport` (NFR-02, R.A. 10173).
2. No automated online approval for Business Clearances; in-person Treasurer
   screening is required (R.A. 7160 Sec. 152 anti-fraud policy).
3. Public lookups mask names to `J*** D**`; never transmit unmasked PII (NFR-01).
4. `@media print` is 100% solid black-and-white A4/Letter; no glass on
   certificates (NFR-05).
5. Never install, load or invoke Superpowers; only vendored skills (AGENT-01).
6. No runtime external origin: no CDN, Google Fonts, analytics or remote
   images; must work unplugged (OFFLINE-01).
7. No blotter narratives or resident PII to any external AI/API; never cache
   admin/authenticated responses or resident PII in the Service Worker (OFFLINE-02/03).
8. Homepage motion animates `transform`/`opacity` only, with a
   `prefers-reduced-motion` fallback (MOTION-01).
9. No plain-HTTP listener. Sensitive fields — blotter narrative and exact
   location/time, document purpose and CTC number, business name/nature/address,
   staff `internal_notes`, and staff-entered resident PII — are encrypted by the
   server with AES-256-GCM before storage. `FIELD_ENC_KEY` lives only in the
   server `.env`; it is never committed, logged, placed in the database or
   stored with backups (ENC-01).
10. No `resident_id` in request bodies; no resident-linked write without a
    verified resident session (AUTH-01).
11. No access logging and no forwarding of `Cookie`, `User-Agent`, `Referer` or
    `X-Forwarded-For` on blotter routes (ZK-LOG-01).
12. No `seed.demo.js`, demo accounts or default secrets in production builds
    (SEED-01).
13. No Katarungan Pambarangay / Lupon hearing, summons or escalation states
    (SCOPE-01).
14. No `backdrop-filter` or looping motion before the Full tier is confirmed;
    respect the Sec. 14 budgets (PERF-01).
15. 15-minute inactivity session timeout enforced **on the server** for staff
    and residents; the client countdown is a courtesy only (NFR-06).

**Naming**: the blotter is **anonymous**, not "zero-knowledge". The server holds
the field key and can decrypt, so "zero-knowledge" would be inaccurate. Rule IDs
such as `ZK-LOG-01` and test filenames such as `blotter-zk.spec.js` are retained
for traceability.

## Collaboration rules

- **At most 4 writing agents at once** (free-tier rate limits). Audit agents
  are read-only and produce reports only.
- **All subagents run at MAX or HIGH effort.** Set the model's `#max` (or
  `#high`) variant when the model offers one. If a roster model is out of
  credits, rate-limited, or has no effort variant, substitute another free
  model at MAX effort and record the substitution in
  `docs/ai-work-distribution.md`. Do not silently drop to a lower effort.
- **One owner per file.** Write only the files your work package owns
  (`docs/ai-work-distribution.md` Sec. 3). Fixes go back to the same agent
  session. Never edit `docs/implementation-plan.md` or
  `docs/ai-work-distribution.md`.
- **Digital Barangay ID is view-only** (plan Sec. 17): no print routes, no
  print buttons, no print permissions; physical card production is out of scope.
- Waves start only after the previous wave passes its gate; a person reviews
  HR-marked packages line by line.

## Working style

- **Graphify first** for architecture questions. Query
  `graphify-out/graph.json` (`graphify query`, `graphify affected`,
  `graphify explain`) before broad grepping.
- **Ponytail ladder**: smallest working diff; reuse existing code, the standard
  library and native platform features before adding a dependency. Never cut
  validation at trust boundaries, security, accessibility, error handling or
  anything the plan requires.
- **Caveman output**: answer first, no filler. Code, paths, commands, numbers
  and error strings stay exact. Security warnings and irreversible steps are
  written in plain prose.
- **Design skills on UI work**: before writing or polishing any UI, read
  `.agents/skills/frontend-design/SKILL.md` and query ui-ux-pro-max for the
  relevant domain. A skill never overrides OFFLINE-01 (no external origins or
  fonts), PERF-01 (no `backdrop-filter` before the Full tier), MOTION-01
  (reduced-motion fallback), NFR-05 print rules or Sec. 9 tokens.

## Policy check

- `npm run check:policy` → `node scripts/check-agent-policy.js`.
- Scans `src/`, `scripts/`, `ops/`, `package.json`, `docker-compose*.yml`,
  `Dockerfile`, `Caddyfile` and `.agents/`; excludes `node_modules`, `.git`,
  `.next`, `docs/`, `AGENTS.md` and generated files.
- Fails on the forbidden Superpowers token, and on `console.*`,
  `remoteAddress`, `user-agent` or `x-forwarded-for` under
  `src/app/api/blotter/**`. A missing `.agents/skills/` is a warning only.
