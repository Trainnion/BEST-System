# BEST Design System - MASTER tokens

Barangay E-Services System Terminal (BEST). This file is the single source of truth for
every visual token. It is self-contained: no design skill, CLI or MCP server is required
to read or apply it, and no external asset may be introduced by following it.

- Owner: WP-01 (MOTION). Consumers: every UI work package.
- Source: implementation plan Sec. 2.2-2.3, 3.1-3.3, 8, 14.3.
- Implementation: `tailwind.config.js` (theme extension), `src/styles/globals.css`
  (base + glass), `src/styles/motion.css` (motion). Values here must match those files.
- Runtime contract: the server always renders the **Lite** tier. Full is a CSS
  enhancement applied to `<html data-fx="full" data-motion="full">` after hydration.

---

## 1. Surfaces and base palette

| Token | Value | Use |
| :--- | :--- | :--- |
| `--bg-0` / `obsidian` | `#0a0f1d` | Page base, app background |
| `--bg-1` / `obsidian-800` | `#0f172a` | Lower gradient stop, panels |
| `obsidian-700` | `#131c31` | Raised static surfaces |
| `--text-0` / slate-200 | `#e2e8f0` | Primary body text |
| `--text-1` / slate-400 | `#94a3b8` | Secondary text, metadata |
| `--text-2` / slate-500 | `#64748b` | Placeholders only (never body copy) |
| `--focus-ring` | `#22d3ee` | Focus outline, always visible |

Never use pure black (`#000`) or pure white (`#fff`) as a page surface. White at low
alpha is the only permitted highlight.

## 2. Semantic color matrix (Sec. 3.1)

Each state ships four parts: text (`fg`), surface (10% tint), border (30% tint) and a
soft 15px glow. Contrast values are for the 10% tinted surface on `#0a0f1d`.

| State | Text | Surface | Border / Glow | Contrast | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `success` | `#34d399` (`text-success-fg`) | `bg-success-surface` | `border-success-border`, `shadow-glow-success` | 7.8:1 AAA | Ready for pickup, released, OR issued, verified resident |
| `warning` | `#fcd34d` (`text-warning-fg`) | `bg-warning-surface` | `border-warning-border`, `shadow-glow-warning` | 8.2:1 AAA | Under review, interview scheduled, payment pending |
| `danger` | `#fb7185` (`text-danger-fg`) | `bg-danger-surface` | `border-danger-border`, `shadow-glow-danger` | 7.4:1 AAA | Rejected, non-compliant screening, critical urgency |
| `info` | `#22d3ee` (`text-info-fg`) | `bg-info-surface` | `border-info-border`, `shadow-glow-info` | 8.5:1 AAA | Active, action taken, AI-verified |
| `official` | `#fde68a` (`text-official-fg`) | `bg-official-surface` | `border-official-border`, `shadow-glow-official` | 9.1:1 AAA | RA seals, signature blocks, official directory |
| `neutral` | `#cbd5e1` (`text-slate-300`) | `bg-white/[0.04]` | `border-white/10` | 11.2:1 AAA | Default card, form field, inactive |

Utility classes `.state-success`, `.state-warning`, `.state-danger`, `.state-info`,
`.state-official`, `.state-neutral` bundle all four parts. Status is never communicated
by color alone: always pair with a text label (and an icon when a `StatusBadge` is used).

Rules:

1. Semantic colors describe **state**, not decoration. Do not tint a card "for looks".
2. No purple gradients, no neon-on-neon, no color-only meaning.
3. Glow shadows are accent only; they are never animated (Sec. 14.3).
4. Text on tinted surfaces must stay at or above 4.5:1; the values above are AAA.

## 3. Typography

| Role | Family | Fallbacks | Notes |
| :--- | :--- | :--- | :--- |
| UI / editorial | `Plus Jakarta Sans Variable` (`font-sans`) | system sans | Self-hosted via `@fontsource-variable/plus-jakarta-sans`, weights 200-800 |
| Codes / keys | `JetBrains Mono Variable` (`font-mono`) | system mono | Self-hosted via `@fontsource-variable/jetbrains-mono`; tracking codes only |

Load path: both packages are imported as CSS in `src/app/layout.jsx`, bundled by Next.
Never use the framework's remote Google font loader, a remote font stylesheet link, a
CDN, or a remote image. Latin-subset woff2 only (~27 KB Jakarta, ~40 KB Mono,
`font-display: swap`).

| Level | Tailwind | Size / line height | Weight | Use |
| :--- | :--- | :--- | :--- | :--- |
| Display | `text-5xl` / `sm:text-6xl` | 48/56 / 60/64 | 700-800 | Homepage headline only |
| H1 | `text-4xl` | 36/40 | 700 | Page title |
| H2 | `text-2xl` | 24/32 | 600 | Section heading |
| H3 | `text-lg` | 18/28 | 600 | Card heading |
| Body | `text-base` | 16/26 | 400 | Default copy |
| Small | `text-sm` | 14/22 | 400-500 | Metadata, helper text |
| Micro | `text-xs` | 12/18 | 500-600 | Labels, uppercase badges |
| Code | `font-mono text-sm` | 14/22 | 500 | `CLR-2026-XXXX`, `BLT-9K2M-48` |

Rules: headings use `text-wrap: balance`, paragraphs `text-wrap: pretty`; tracking codes
use `tracking-code` (0.06em); never set type below 12px; body copy is never slate-500.

## 4. Spacing - 8-point rhythm

4px is the base unit; layout spacing steps by 8px. Only 4 and 8 are sub-steps.

| Step | Pixels | Tailwind | Typical use |
| :--- | ---: | :--- | :--- |
| 0.5 | 4 | `gap-1` | Icon/label gap |
| 1 | 8 | `rhythm-2` | Tight stack, badge padding |
| 2 | 16 | `rhythm-3` | Card padding (compact), grid gap |
| 3 | 24 | `rhythm-4`, `gutter` | Card padding, page gutter |
| 4 | 32 | `rhythm-5` | Block separation |
| 5 | 48 | `rhythm-6`, `section` | Section separation |
| 6 | 64 | `rhythm-7` | Hero vertical padding |
| 7 | 96 | `rhythm-8` | Editorial whitespace on desktop |

Do not invent 10/14/18px paddings. Content width: `max-w-content` (72rem) for shells,
`max-w-prose` (68ch) for reading text. Touch targets: at least 44x44px (`tap-target`).

## 5. Radii

| Token | Value | Use |
| :--- | ---: | :--- |
| `rounded-lg` | 8px | Chips, inputs inside cards |
| `rounded-xl` | 12px | Inputs, skeletons, small cards |
| `rounded-2xl` | 16px | Glass-lite cards, list rows |
| `rounded-glass` | 20px | Standard `.glass` surface |
| `rounded-3xl` | 24px | Hero panels, `.glass-panel` |
| `rounded-full` | 9999px | Pills, badges, avatars |

Nesting rule: child radius <= parent radius - parent padding. No mixed radii on one card.

## 6. Elevation

| Token | Value | Use |
| :--- | :--- | :--- |
| `--elev-1` / `shadow-glass` | `0 2-8px rgba(0,0,0,.20-.25)` | Glass-lite cards, table rows |
| `--elev-2` | `0 8px 24px rgba(0,0,0,.25)` | Standard `.glass` card |
| `--elev-3` | `0 16px 40px rgba(0,0,0,.35)` | Hover lift, sticky navbar |
| `--elev-4` / `shadow-glass-lg` | `0 24px 60px rgba(0,0,0,.45)` | Modals, hero panels |
| `shadow-focus` | `0 0 0 2px #0a0f1d, 0 0 0 4px #22d3ee` | Focus ring on dark glass |

Elevation is expressed by shadow plus a top highlight gradient, never by scaling the
whole card. Hover lift is `-4px` translate at most, 180ms, and is disabled under
reduced motion and on touch-only layouts.

## 7. Glass tokens (Sec. 14.3)

| Token | Value |
| :--- | :--- |
| `--glass-fill` | `rgba(15, 23, 42, 0.82)` (Lite) |
| `--glass-fill-full` | `rgba(15, 23, 42, 0.55)` (Full) |
| `--glass-border` | `rgba(255, 255, 255, 0.10)` |
| `--glass-highlight` | `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0))` |
| `--glass-shadow` | `0 8px 24px rgba(0, 0, 0, 0.25)` |
| `--glass-blur` | `blur(12px) saturate(140%)` |

| Tier | Surface | Cost |
| :--- | :--- | :--- |
| Lite (default, no attribute) | Translucent fill + 1px border + soft shadow + top highlight | ~0 |
| Full (`html[data-fx="full"] .glass`) | Same + `backdrop-filter: blur(12px) saturate(140%)` | GPU |

Hard limits (PERF-01):

- At most **3** `backdrop-filter` elements in one viewport; blur radius **<= 12px**.
- Never on scrolling lists, tables, the ticker, or any layer wider/taller than 60% of
  the viewport.
- `.glass-lite` never blurs, in either tier. Ambient orbs are radial gradients only -
  never `filter: blur()`.
- Print: no glass, no shadow, no background color (print.css owns layout; `@media print`
  in motion.css kills motion).

Classes: `.glass`, `.glass-lite`, `.glass-panel`, `.glass-input`, `.glass-skeleton`.

## 8. Motion (Sec. 3.3, 8.3)

All motion is in `src/styles/motion.css`. Only `transform` and `opacity` animate.

| Token | Value |
| :--- | :--- |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--dur-fast` | `180ms` (hover, press) |
| `--dur-base` | `600ms` (reveal) |
| `--dur-slow` | `1200ms` (count-up, path draw base) |
| `--cycle` | `9.6s` (three-phrase greeting) |
| `--ticker-dur` | `40s` |

Keyframes: `rise-in`, `fade-in`, `orb-drift`, `draw-path`, `node-glow`, `pulse-ring`,
`ticker`, `cycle-3`, plus `shimmer` / `skeleton-pulse` for skeletons in globals.css.

Entrance timeline for the homepage (WP-07): 0ms paint + orbs, 100ms headline words
(70-90ms stagger via `--i`), 500ms sub-headline/greeting, 700ms CTAs (+3 pulse rings
then stop), 900ms ticket demo. Scroll-triggered: stats count-up, bento cards stagger,
journey path draw, ticker start.

Contract:

1. Motion is opt-in and only runs under `prefers-reduced-motion: no-preference`.
2. Before-states exist only under `html.js`, so no-JS and reduced-motion visitors never
   see invisible content.
3. Reduced motion: zero animations, everything in final state, ticker becomes a static
   scrollable list, counters show final values.
4. Motion-lite (`html[data-motion="lite"]`): reveals kept, ambient/ticker/cycle loops
   removed.
5. Off-screen or hidden tab -> `data-paused="true"` pauses loops (useInView).
6. Any auto-moving content over 5s (ticker) has a keyboard Pause/Play control.
7. Decorative layers are `aria-hidden`; all three greeting phrases are exposed once via
   `sr-only`; counters carry `aria-label` with the final value.

## 9. Skeletons

`.glass-skeleton` per Sec. 3.2: 5% white fill, 1px white/5 border, 12px radius,
`shimmer` sweep in Full. In Lite: opacity-only `skeleton-pulse`. Under reduced motion:
static block. Skeletons must match the final element's box size to keep CLS < 0.1 and
are `aria-hidden` with an adjacent `role="status"` "Loading" label where needed.

## 10. Accessibility

- Contrast: all body text >= 4.5:1 (target AAA on semantic tints); focus ring `#22d3ee`
  at 2px with 3px offset, never removed.
- Touch targets >= 44x44px; spacing >= 8px between adjacent targets.
- Keyboard: logical tab order, visible focus, skip link, no keyboard traps, Pause/Play
  for the ticker, Escape closes overlays.
- Semantics: one `h1` per page, landmarks (`header`, `nav`, `main`, `footer`), labelled
  form controls, `aria-live="polite"` for async status, error text tied via
  `aria-describedby`.
- Motion and photosensitivity: no flashing above 3 Hz; respect reduced motion,
  Save-Data and low memory (Lite).
- Language: `lang="en-PH"`; Tagalog/Bisaya strings are marked `lang="tl"` / `lang="ceb"`.
- No-JS: every public page renders readable content and working links without JS.

## 11. Forbidden

No external fonts, images, scripts, iframes, analytics, or CDN assets. No TypeScript.
No animation libraries. No remote `photo_url` (same-origin `/avatars/` only). No glass
on print output. No auto-playing audio. No color-only status. No placeholder lorem.

## 12. Change process

Tokens change in this file, `tailwind.config.js` and the matching CSS variables in one
commit. Adding a token requires a real UI need, an accessibility check and a note in
`design-system/DESIGN.md` if usage rules change.
