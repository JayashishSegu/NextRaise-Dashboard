# NextRaise Analytics Dashboard — "Kinetic Light" Redesign

**Date:** 2026-08-10
**Target:** `~/nextraise-dashboard/index.html` (single-file app, deployed to Vercel)
**Scope:** Visual reskin + Overview layout upgrade. Keep all existing logic, data-loading, tabs, and PostHog wiring intact.

---

## 1. Goal

Redesign the internal analytics dashboard into a **futuristic but readable** "analytics OS," tuned to NextRaise's brand. The current design reads as a generic light SaaS dashboard. The redesign must feel premium and distinctive through **information density, precision typography, purposeful glow, and meaningful motion** — not through decoration.

Chosen direction: **Kinetic Light** (light-first, electric-blue precision) with a paired dark **"Command Deck"** mode on the existing theme toggle.

Design database grounding (ui-ux-pro-max): style = *Data-Dense Dashboard* (full light+dark), colors = blue data + amber/status accents, tabular numerals, hover tooltips, row-highlight, minimal padding, grid layout. Anti-patterns to avoid: ornate decoration, missing filtering.

## 2. Non-Goals (YAGNI)

- No rewrite of data-loading, HogQL queries, caching, or `/api/*` serverless functions.
- No new metrics or tabs. No changes to `switchTab` routing or the Influencer/Perf/Overall model.
- No framework migration. Stays a single hand-authored `index.html`.
- No full rebuild of inner tabs' internal layouts — they inherit the new component styles, but their structure is unchanged except where the shared shell (sidebar, topbar, cards, tables, charts) touches them.

## 3. Constraints

- **Production file, ~730 KB.** All edits must be surgical and reversible. Commit before/after; keep a `git` checkpoint.
- Must not regress any tab. Overview is the only structurally-changed tab.
- Existing theming works via `html[data-theme="dark"]` + `nr_theme` localStorage + a toggle. Reuse it — do not invent a parallel system.
- Respect `prefers-reduced-motion` (already partially present) — extend to all new motion.
- Charts/tables must stay legible at data density; glow/blur must never reduce number contrast below WCAG AA (4.5:1 text, 3:1 for large glyphs/data).

## 4. Design System

### 4.1 Tokens (rewrite `:root`, extend, mirror in `[data-theme="dark"]`)

**Light ("Kinetic Light")**
- Surfaces: page `#f2f5fa` with a subtle 3-blob gradient-mesh wash (blue/indigo/green, low alpha) + faint 32px blueprint grid masked to center. Card surface `rgba(255,255,255,.88)` + `backdrop-filter: blur(4px)`.
- Lines: `--border #e6eaf1`.
- Ink: `--ink #0a0f19`, `--ink2 #54607a`, `--ink3 #97a2b6`.
- Brand/interactive: `--blue #0065F4`, `--blue2 #4f9bff`.
- Data/semantic accents (charts, tiers, status only): green `#0eb894`, indigo `#6366F1`, amber `#e8890c`, red `#e0483d`, cyan `#0891b2`.
- Radius: card `13px`, control `9–10px`. Elevation: `0 1px 2px rgba(16,24,40,.04), 0 10px 26px -16px rgba(16,24,40,.2)`.

**Dark ("Command Deck")** — retune existing dark tokens, do not restyle from scratch:
- Page: deep navy radial `#0b1830 → #060b18 → #04060f`. Card `rgba(255,255,255,.04)` + `1px solid rgba(0,150,255,.16)`, subtle inset glow.
- Neon data colors with text-shadow glow on primary numerals only (blue `#5fd6ff`, green `#22D3A0`, indigo `#8b9bff`). Keep body text `#dbe6ff` at AA contrast.

### 4.2 Typography

Keep brand fonts already loaded: **Plus Jakarta Sans** (UI/headings), **IBM Plex Mono** (all numerals + micro-labels). Numerals use `font-variant-numeric: tabular-nums` to prevent layout shift on count-up/live updates. Micro-labels: 9–10px uppercase, `.06–.1em` tracking, `--ink3`.

### 4.3 Motion (governed by ui-ux-pro-max §7; GSAP/CSS runtime, NOT hyperframes video contract)

- Card entrance: staggered fade-up, ~30ms/item, 500ms `cubic-bezier(.22,.61,.36,1)`, `both`.
- KPI numerals: count-up on load/refresh, ~1100ms, cubic ease-out, locale-formatted (`en-IN`, ₹ lakh).
- Hero line: draw-in via `stroke-dashoffset` (~1300ms), area fade after.
- Live: breathing dot (ring pulse), active-nav rail glow.
- Hover: `translateY(-2px) scale(1.008)` + elevated glow shadow, 180ms.
- All wrapped in `@media (prefers-reduced-motion: reduce)` → no transforms, instant final values.

## 5. Components to restyle (shared shell)

1. **Sidebar** — glassy blurred surface; grouped nav (Overview / Growth); Lucide-style inline SVG icons (replace any emoji); active item = gradient tint + glowing left rail; mono badges (₹4.2L, counts). Keep existing `switchTab`, ids, and hrefs.
2. **Topbar** — sticky frosted bar; page title; ⌘K command hint (visual only unless trivial to wire to existing search); Influencer/Perf/Overall segmented control (restyle existing control); date-range + Live pills.
3. **KPI cards** — top/left accent rail per metric color, mono value, delta pill (green up / red down), optional sparkline. Precision corner tick.
4. **Tables** — mono tabular numerals, uppercase mono header, row hover highlight, inline gradient bars for share columns, `aria-sort` retained.
5. **Charts** — gradient area fill + gridlines + dual series; consistent stroke; hover crosshair + value flag where an existing chart supports hover; skeleton/shimmer on load; respect reduced-motion (data readable immediately).
6. **Chips / badges / segmented controls** — unified pill system.

## 6. Overview layout upgrade (the one structural change)

Restructure the Overview tab body into a **6-column bento** (collapses to 2-col < 1024px, 1-col < 640px):
- **Hero (span 4 × 2 rows):** Signups trend — big gradient-text value, delta, 1D/7D/30D/MTD mini-segments, dual-series area chart, hover crosshair.
- **4 KPI micro-tiles (span 2 each):** Pro MRR, Activation, Paid Convert, Resumes built — each with sparkline + delta.
- **Signup → Pro funnel (span 2):** Signup → Resume → Activated → Pro, with counts + %.
- **Acquisition channels table (span 2):** source / share bar / users / conv.
- **Weekly retention heatmap (span 2):** W0–W7 tonal grid.
- **Live tile (span 2):** live sessions + today's signups/revenue/auto-applies.
- **Plan mix (span 2):** Pro / Sprint / Trial / Free bars.

**Data contract:** the bento is a presentation layer over the Overview's existing computed values (from `/api/overview` + client HogQL). Each widget binds to values the Overview already fetches. If a widget needs a value not currently computed (e.g. retention heatmap, plan mix), it either (a) reuses an existing tab's query already present in the file, or (b) is marked as a follow-up and rendered from the nearest available data — no new backend work in this scope. Widgets with no available data show the existing empty/skeleton state, never a broken frame.

## 7. Responsive & Accessibility

- Breakpoints 640 / 1024 / 1440. No horizontal scroll. Bento reflows; charts simplify (fewer ticks) on narrow.
- Contrast: verify AA on both themes independently, especially mono numerals on glass and neon-on-dark.
- Keyboard: focus rings preserved on nav/controls/rows; segmented control and sortable tables keyboard-operable.
- `prefers-reduced-motion` honored globally.

## 8. Implementation approach (surgical, staged)

Order chosen so each stage is independently verifiable and reversible on the live file:
1. **Token layer** — rewrite `:root` + `[data-theme="dark"]` values; add mesh/grid background; add reduced-motion guard. (Global look shifts; structure unchanged.)
2. **Shell components** — sidebar, topbar, cards, tables, charts, chips. Applies across all tabs.
3. **Overview bento** — restructure only the Overview tab body markup into the grid; wire widgets to existing data.
4. **Motion** — entrance stagger, count-up, hero draw-in, hover/live; all behind reduced-motion.
5. **Dark "Command Deck" pass** — retune dark tokens + neon/glow, verify contrast.

Each stage: edit → load locally in browser (Playwright/`webapp-testing`) with a test PostHog key or the existing cached data → screenshot → verify no tab regressed → commit.

## 9. Verification

- Every tab renders without console errors after each stage.
- Overview widgets show real data (or correct empty/skeleton), not placeholders.
- Both themes pass a contrast spot-check.
- Reduced-motion mode shows a static, fully-readable dashboard.
- Deploy to Vercel only after local verification; confirm the `nextraise-dashboard-blue` alias serves the new build.

## 10. Rollback

Single-file: `git revert` / restore prior `index.html`. Keep the pre-redesign commit tagged.
