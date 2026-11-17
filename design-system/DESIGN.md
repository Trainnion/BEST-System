# BEST Design Doctrine (DESIGN.md)

How to apply the tokens in `design-system/MASTER.md` when building BEST screens.
This doctrine is written down in the repo on purpose: no external design skill, token
CLI or MCP server is needed to follow it.

## 1. Art direction

A sophisticated Philippine digital governance terminal. Deep obsidian slate, cyan/teal
ambient light, crisp frosted glass, editorial typography, generous whitespace. It should
feel like a calm public-service counter at night: precise, legible, trustworthy.

Anti-slop rules:

- No centered hero with a three-card feature strip. Use asymmetric editorial composition
  (weighted columns, one dominant action, supporting rail).
- No purple/blue gradient soup, no glass on everything, no icon confetti.
- No unlabeled decoration: every orb, glow and ring is `aria-hidden`.
- No stock photos, no remote images, no image above the fold on `/`.
- No lorem ipsum, no "coming soon" blocks instead of content. Use real labels and
  honest empty states ("No announcements yet").
- Every visible state has a text label; color never carries meaning alone.

## 2. Composition

- Shell: `max-w-content` (72rem), `px-gutter` (24px), sections separated by
  `py-rhythm-6` (48px) or `rhythm-7` (64px) on desktop.
- Rhythm: 8-point scale only (4, 8, 16, 24, 32, 48, 64, 96).
- Density: public citizen pages are airy and thumb-first; admin queues are denser
  (16px card padding, 44px rows) but keep 12px type minimum.
- Hierarchy: display headline -> one supporting paragraph -> primary action -> details.
  Secondary actions are glass-lite, never equal weight to the primary CTA.
- Asymmetry: a 7/5 or 8/4 desktop split with the primary task on the left (or on top on
  mobile). Bento grids may vary card spans, but never create a hole in the grid.

## 3. Surfaces

| Need | Class | Notes |
| :--- | :--- | :--- |
| Card, form panel, ticket | `.glass` | Max 3 blurring instances per viewport in Full |
| Bento tile, list row, table | `.glass-lite` | Never blurs |
| Modal / hero panel | `.glass-panel` | Highest elevation, 24px radius |
| Input / select / textarea | `.glass-input` | 44px min height, cyan focus |
| Loading placeholder | `.glass-skeleton` | Match final box size |

Do not stack glass on glass. A card inside a panel is flat (`bg-white/[0.03]`, 1px
`white/10` border) or `.glass-lite`. Backgrounds use the body gradient plus at most the
three ambient orbs from `layout.jsx`.

Borders are 1px `white/10`; dividers are 1px `white/10` inside cards. Shadows follow the
elevation table; hover lift is -4px with `--dur-fast` and no glow change beyond the
semantic glow already present.

## 4. Color in use

- Base UI is neutral glass; semantic color appears only on status, alerts, official
  marks and the primary CTA accent.
- Status: `.state-*` classes with a text label (`Ready for pickup`, `Under review`,
  `Rejected`, `Verified`, `Official`). Never encode status with a bare dot.
- Primary CTA: cyan solid (`bg-cyan-400 text-obsidian`) on dark glass; secondary:
  `border-white/15 bg-white/[0.04] text-slate-100`; destructive: danger border + text,
  never a full red fill except in a confirm dialog.
- Verification/official marks use `official` amber, not gold gradients.
- Links are underlined on hover; do not rely on color alone to mark links in prose.

## 5. Typography in use

- Plus Jakarta Sans everywhere by default. JetBrains Mono only for tracking codes,
  receipt/OR numbers, timestamps in tables and the sample ticket.
- Tracking codes are uppercase, `tracking-code`, with `tabular-nums` in tables.
- Headline max 12 words; body line length 60-70ch on desktop.
- Use sentence case for UI labels ("Request a document"), uppercase only for micro
  badges and table headers.
- Numbers in stats use `tabular-nums` and keep final values in server HTML (count-up is
  a visual enhancement only).

## 6. Motion in use

1. Use `useInView` (`src/lib/hooks/useInView.js`) for every scroll reveal; put
   `data-reveal` and `--i` (0..n) on the element. Do not write new keyframes in pages.
2. Use `useMotionPreference` (`src/lib/hooks/useMotionPreference.js`) for the Lite/Full
   toggle in the footer; it also honours Save-Data, low memory, reduced motion and
   `?fx=lite|full`.
3. Animate only `transform` and `opacity`. Never animate width, height, top, left,
   box-shadow, filter or background-position.
4. One-shot animations beat loops. Loops must pause off-screen (`data-paused`) and be
   removable in Lite.
5. Any auto-advancing content over 5s needs a visible, keyboard-accessible Pause/Play.
6. Interaction feedback: 180ms spring on press (`active:scale-[0.98]`), 180ms hover lift
   on cards, no bounce on layout containers.

## 7. Accessibility checklist (per screen)

- [ ] One `h1`, landmarks used, skip link reaches `#main`.
- [ ] All controls reachable and operable by keyboard; focus visible at 3:1 against
      adjacent colors.
- [ ] Touch targets >= 44x44px with >= 8px separation.
- [ ] Text contrast >= 4.5:1; semantic tints verified (`MASTER.md` table).
- [ ] Reduced motion: no animation, final values visible, ticker static.
- [ ] No-JS: content and links usable; nothing hidden by `.js`-only before-states.
- [ ] Save-Data / 2 GB device: resolves to Lite, no blur, no loops.
- [ ] Status not color-only; images have alt text; decorative layers `aria-hidden`.
- [ ] Forms: labels, `aria-describedby` errors, `aria-live` status, 44px controls.
- [ ] Print: glass, nav and motion removed; black-on-white output (print.css, WP-15).

## 8. Content voice

Plain, respectful, local. English first with Tagalog and Bisaya available in the same
surface (mark `lang` attributes). Address the citizen as "you"; the barangay as "the
barangay". Never promise an approval online that requires an in-person step. Say what is
stored, what is private and what the next step is. No jargon like "entity", "payload",
"transactional pipeline" in citizen copy.

Examples:

- Good: "Your request was received. Keep this code: CLR-2026-0412."
- Good: "Business clearance is completed in person at the barangay hall."
- Avoid: "Submission acknowledged by the intake pipeline."
- Avoid: "Your application is being processed by the system."

## 9. Performance guardrails

- No images above the fold on `/`; gradients and inline SVG only.
- Icons imported one by one from `lucide-react` (no barrel import of the whole set).
- Kaagapay widget and 3D ID card code are lazy (`next/dynamic`), loaded on open.
- Below-the-fold sections use `.cv-auto` (`content-visibility: auto`).
- Budgets per citizen route (compressed first load): HTML 30 KB, JS 90 KB, CSS 25 KB,
  fonts 45 KB, total 150 KB; LCP <= 2.5 s on Slow 4G, CLS <= 0.1, INP <= 200 ms.
- Nothing loads from another origin, ever. The production CSP enforces it.

## 10. Review gate

Before a UI work package is accepted:

1. Tokens used only from `MASTER.md`; no ad-hoc hex values in components.
2. Glass count and blur radius within PERF-01 limits.
3. Keyboard pass, reduced-motion pass, no-JS pass, 360px-width pass.
4. One `npm run build` and the relevant Playwright projects pass.
5. Screens match this doctrine; any deviation is documented here first.
