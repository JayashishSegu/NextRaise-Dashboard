# Kinetic Light Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the NextRaise analytics dashboard into the "Kinetic Light" system (light + dark "Command Deck") and restructure the Overview into a bento, changing zero backend/data logic.

**Architecture:** Single-file `index.html` (~11,700 lines). Two existing `:root` token blocks (L27, L1475) and matching `html[data-theme="dark"]` blocks (L96, L1499). Redesign works by (1) rewriting token values, (2) restyling shared shell components used across all tabs, (3) restructuring only the Overview tab body, (4) adding motion behind `prefers-reduced-motion`, (5) retuning the dark theme. Verification is visual: load the file in a browser via Playwright, screenshot, and check the console for errors after each stage.

**Tech Stack:** Hand-authored HTML/CSS/vanilla JS, CSS custom properties, IBM Plex Mono + Plus Jakarta Sans (already loaded), Playwright MCP / webapp-testing for verification, PostHog data via existing `/api/overview` + client HogQL.

---

## Conventions for every task

- **Edit target:** `~/nextraise-dashboard/index.html` only (unless noted).
- **Verify loop (the "test"):** serve the folder (`python3 -m http.server 8788` from repo root) and open `http://localhost:8788/index.html` in Playwright. The shell renders without an API key (data areas show existing empty/skeleton states — that is expected and acceptable for style verification). For data-populated shots, set `localStorage.nr_apiKey` + `nr_projectId` (project 399417) if a key is available, else rely on the deployed `/api/overview`.
- **Pass criteria each task:** target tab(s) render, `browser_console_messages` shows no new errors, screenshot matches the intended look, and `switchTab()` still moves between all tabs.
- **Commit** at the end of each task on branch `redesign/kinetic-light` with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- **Reduced-motion:** any new animation must be disabled by the existing guards; extend them, never bypass.

---

## Task 0: Baseline snapshot (safety net)

**Files:** none modified.

- [ ] **Step 1:** Start server: `cd ~/nextraise-dashboard && python3 -m http.server 8788 &`
- [ ] **Step 2:** Playwright `browser_navigate` to `http://localhost:8788/index.html`; `browser_take_screenshot` full page → save as `docs/superpowers/plans/_baseline-overview.png`. Click each sidebar tab (`#tab-report`, `#tab-daily`, `#tab-insights`, `#tab-acquire`, `#tab-activation`, `#tab-revenue`, `#tab-retention`, `#tab-influencers`, `#tab-pro`) and screenshot each.
- [ ] **Step 3:** Record `browser_console_messages` baseline (there may be pre-existing warnings; note them so new ones are distinguishable).
- [ ] **Step 4:** Commit nothing; this is a read-only checkpoint. Confirm current commit is the spec commit (`git log --oneline -1`).

---

## Task 1: Token layer + ambient background

**Files:** Modify `index.html` — `:root` (L27–~90), the second `:root` (L~1475), both `html[data-theme="dark"]` blocks, and the `body`/page-background rule.

- [ ] **Step 1:** Read both `:root` blocks and both dark blocks in full before editing. Confirm which token names existing components consume (e.g. `--bg`, `--surface`, `--border`, `--text`, `--blue`) so renames are avoided — **keep existing token names**, only change their values and add new ones.
- [ ] **Step 2:** Rewrite light `:root` values:
  - `--bg:#f2f5fa; --surface:rgba(255,255,255,.9); --surface-2:#f7f8fa; --border:#e6eaf1; --border-strong:#cbd0d8;`
  - `--text:#0a0f19; --text-2:#54607a; --text-3:#97a2b6;`
  - `--blue:#0065F4; --blue-dark:#1d4fd7; --blue-soft:#eef3ff; --blue2:#4f9bff;`
  - data accents: `--green:#0eb894; --violet:#6366F1; --amber:#e8890c; --red:#e0483d; --teal:#0891b2;` (keep existing `-soft`/`-text` variants, retune to match).
  - Add: `--radius:13px; --shadow-1:0 1px 2px rgba(16,24,40,.04); --shadow-2:0 10px 26px -16px rgba(16,24,40,.2); --shadow-hover:0 18px 36px -18px rgba(0,101,244,.4); --glass-blur:blur(4px);`
- [ ] **Step 3:** Add the ambient page background to the `body` (or the app root) rule:
  ```css
  background:
    radial-gradient(58% 42% at 84% -6%, rgba(99,102,241,.14), transparent 60%),
    radial-gradient(52% 38% at 10% 6%, rgba(0,101,244,.13), transparent 55%),
    radial-gradient(48% 44% at 62% 110%, rgba(14,184,148,.10), transparent 55%),
    var(--bg);
  ```
  Add a fixed pseudo-element (or a low-z decorative div already present) for the blueprint grid:
  ```css
  body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.4;
    background-image:linear-gradient(rgba(10,15,25,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,15,25,.04) 1px,transparent 1px);
    background-size:32px 32px;-webkit-mask-image:radial-gradient(circle at 55% 35%,#000,transparent 88%)}
  ```
  Ensure app content sits at `z-index:1` so it renders above the grid.
- [ ] **Step 4:** In the **second** `:root` (L1475) and its dark block: reconcile duplicates. For any token also defined at L27, delete the stale duplicate value at L1475 so there is one source of truth; keep only tokens unique to the later block.
- [ ] **Step 5:** Verify: reload in Playwright. Overview + 2 other tabs screenshot. Confirm background wash + grid visible, cards/text readable, no console errors. Spot-check text contrast on a card (should be near-black on white).
- [ ] **Step 6:** Commit: `git add index.html && git commit -m "style(dashboard): Kinetic Light token layer + ambient background"`

---

## Task 2: Shell components (applies to all tabs)

**Files:** Modify `index.html` — `.sidebar` (L182+), `.sidebar-nav` (L204), `.tab` (L212+), the topbar/header rule, card class(es), table classes, chip/badge/segmented-control classes.

- [ ] **Step 1: Sidebar.** Restyle `.sidebar` to glassy: `background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.74));backdrop-filter:blur(14px);box-shadow:1px 0 0 var(--border);`. Restyle `.tab` (nav item) to the v3 spec: 7px/9px padding, 11.5px weight-600, `--text-2`; `.tab.active` → `background:linear-gradient(90deg,rgba(0,101,244,.14),transparent);color:var(--blue)` with a glowing left rail via `::before` (`3px` gradient bar, `box-shadow:0 0 10px 1px rgba(0,101,244,.75)`). Keep all `id`s, `onclick="switchTab(...)"`, and `href` anchors unchanged.
- [ ] **Step 2: Nav icons.** If any nav item uses an emoji, replace with an inline Lucide-style SVG (14px, `stroke:currentColor;fill:none;stroke-width:1.8`). If icons are already SVG, only normalize stroke width/size. Do not remove text labels.
- [ ] **Step 3: Topbar.** Make the header sticky + frosted: `position:sticky;top:0;backdrop-filter:blur(10px);background:linear-gradient(180deg,rgba(242,245,250,.92),rgba(242,245,250,.5));border-bottom:1px solid var(--border)`. Restyle the Influencer/Perf/Overall control (`[data-view]` buttons) as a segmented pill; active = `linear-gradient(135deg,#0065F4,#4f9bff);color:#fff`. Restyle date-range + live indicators as `.pill`.
- [ ] **Step 4: Cards.** Define/normalize the card surface used by KPI/section cards: `background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-1),var(--shadow-2);backdrop-filter:var(--glass-blur)`. Hover: `transform:translateY(-2px) scale(1.008);box-shadow:var(--shadow-1),var(--shadow-hover)` with `transition:transform .18s,box-shadow .18s`.
- [ ] **Step 5: Tables.** Numerals → `font-family:'IBM Plex Mono';font-variant-numeric:tabular-nums`. Header → uppercase mono 8.5–9px `--text-3`. Row hover → `background:var(--table-head)`. Where a "share"/percentage column exists, render an inline gradient bar (`.bar{height:5px;border-radius:3px;background:linear-gradient(90deg,#0065F4,#4f9bff);box-shadow:0 0 7px rgba(0,101,244,.32)}`). Preserve `aria-sort` and sort handlers.
- [ ] **Step 6: Chips/badges.** Unify to a pill system: neutral `background:rgba(0,101,244,.1);color:var(--blue)`, positive `rgba(14,184,148,.15);color:#0a8f72`, mono 9px. Apply to sidebar `.tab-badge`.
- [ ] **Step 7: Verify.** Reload; click through ALL tabs; screenshot Overview, Revenue (has badge), Influencers (has badge), Search. Confirm no layout breakage, no console errors, badges/segmented control/tables styled, tab switching works.
- [ ] **Step 8: Commit:** `git commit -am "style(dashboard): Kinetic Light shell — sidebar, topbar, cards, tables, chips"`

---

## Task 3: Overview bento restructure

**Files:** Modify `index.html` — the Overview tab body only (locate via the panel that `switchTab('overview')` shows; find by the section wrapping the current Overview KPIs). Add scoped CSS for `.bento` and widget classes near the Overview styles.

- [ ] **Step 1:** Read the current Overview panel markup fully. Inventory every value it currently renders and the JS element ids/selectors that populate them (do NOT rename ids the JS writes to — wrap/move the existing value-bearing elements into the new layout instead of recreating them).
- [ ] **Step 2:** Add bento CSS (scoped under an `#overview .bento` or a new wrapper class to avoid affecting other tabs):
  ```css
  #ov-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:11px}
  @media(max-width:1024px){#ov-bento{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:640px){#ov-bento{grid-template-columns:1fr}}
  #ov-bento .span2{grid-column:span 2}#ov-bento .span4{grid-column:span 4}#ov-bento .row2{grid-row:span 2}
  ```
- [ ] **Step 3:** Rebuild the Overview body as the bento from the v3 mockup: hero (`span4 row2`), 4 KPI micro-tiles (`span2`), funnel (`span2`), channels table (`span2`), retention heatmap (`span2`), live tile (`span2`), plan mix (`span2`). **Reuse existing value elements** — move the JS-populated nodes into these containers. For widgets whose data the Overview already computes (signups, MRR, activation, paid convert, resumes, channels, live counts), bind directly. For retention heatmap and plan mix: if the values exist elsewhere in the file's queries, reuse; otherwise render the widget with the existing skeleton/empty state and add a `<!-- TODO(data): wire from <source> -->` marker — do not fabricate numbers.
- [ ] **Step 4:** Hero chart: replace/wrap the existing overview trend chart with the gradient-area + gridline + dual-series SVG treatment. If the current chart is generated by existing JS (e.g. a render function), restyle via CSS/SVG defs rather than replacing the data path. Add the hover crosshair only if the existing chart exposes an X-hover hook; otherwise defer (mark TODO) — never break the working chart.
- [ ] **Step 5: Verify.** Reload Overview. Confirm: all previously-shown numbers still appear (compare against `_baseline-overview.png`), bento reflows at 1024px and 640px (`browser_resize`), no console errors, no NaN/undefined in tiles. Screenshot at 1440 / 1024 / 640.
- [ ] **Step 6: Commit:** `git commit -am "feat(dashboard): Overview bento layout"`

---

## Task 4: Motion layer

**Files:** Modify `index.html` — add a small CSS/JS block near the Overview + shared styles; extend the reduced-motion guards (L164, L1858).

- [ ] **Step 1:** Add entrance keyframes + stagger:
  ```css
  @keyframes nrUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  #ov-bento > .card{animation:nrUp .5s cubic-bezier(.22,.61,.36,1) both}
  ```
  Apply incremental `animation-delay` (via inline style or `:nth-child`) ~30ms per tile.
- [ ] **Step 2:** Count-up: add a guarded JS helper that animates elements marked `data-count` (format `en-IN`, `₹ lakh`, `pct1`). Run it when the Overview tab becomes visible (hook into existing `switchTab('overview')` or the overview render callback), not on a timer. Skip entirely if `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- [ ] **Step 3:** Hero line draw-in via `stroke-dashoffset` using WAAPI `.animate(...)`, guarded by reduced-motion. Live dot: CSS ring-pulse keyframe.
- [ ] **Step 4:** Extend both reduced-motion `@media` blocks to also null the new `animation`s (the L1858 one already sets `animation:none!important` — confirm it covers `#ov-bento`).
- [ ] **Step 5: Verify.** Reload with motion ON: numbers count up once, cards stagger in, line draws, no jank, tab switches don't re-trigger jarringly. Then emulate reduced-motion (`browser` prefers-reduced-motion) and confirm everything renders instantly and fully readable. No console errors.
- [ ] **Step 6: Commit:** `git commit -am "feat(dashboard): Kinetic Light motion (reduced-motion safe)"`

---

## Task 5: Dark "Command Deck" pass

**Files:** Modify `index.html` — both `html[data-theme="dark"]` blocks and any dark-specific component overrides (sidebar L188/L1383, tab.active L1393+).

- [ ] **Step 1:** Retune dark tokens: page radial `#0b1830→#060b18→#04060f`; card `rgba(255,255,255,.04)` + `1px solid rgba(0,150,255,.16)` + subtle inset glow; text `#dbe6ff`/`#aebbd6`. Grid overlay: lower opacity, blue tint.
- [ ] **Step 2:** Neon data numerals in dark only: primary KPI/hero value gets `color:#5fd6ff;text-shadow:0 0 12px rgba(0,190,255,.55)`; green `#22D3A0`, indigo `#8b9bff`. Body text stays non-glowing for readability.
- [ ] **Step 3:** Dark sidebar/topbar glass: darker translucent surfaces; active rail glow brighter. Segmented control active stays brand-blue gradient.
- [ ] **Step 4: Verify.** Toggle the theme switch in Playwright; screenshot Overview + one dense table tab in dark. Contrast spot-check: primary text ≥4.5:1, data glyphs ≥3:1 on dark surface. Toggle back to light — confirm no leakage. No console errors.
- [ ] **Step 5: Commit:** `git commit -am "style(dashboard): dark Command Deck theme pass"`

---

## Task 6: Final review + deploy

- [ ] **Step 1:** Full click-through of every tab in both themes; confirm parity with baseline data and no console errors.
- [ ] **Step 2:** Run `/code-review` (or a self diff review) on the branch diff; fix any regressions.
- [ ] **Step 3:** Ask the user before deploying. On approval, deploy to Vercel (the project is linked; `npx vercel --prod` or the existing deploy path) and confirm `nextraise-dashboard-blue.vercel.app` serves the new build.
- [ ] **Step 4:** Merge `redesign/kinetic-light` per user's preference (PR or direct), then stop the visual-companion server.

---

## Self-Review (against spec)

- **Spec §4 tokens/type/motion** → Tasks 1, 2, 4. ✓
- **Spec §5 components** → Task 2 (sidebar, topbar, cards, tables, charts partial, chips). Charts fully addressed in Task 3 Step 4. ✓
- **Spec §6 Overview bento + data contract** → Task 3 (reuse existing value nodes; TODO markers for retention/plan-mix; no fabricated data). ✓
- **Spec §7 responsive/a11y** → Task 3 Step 5 (breakpoints), Task 4 (reduced-motion), Task 5 Step 4 (contrast). ✓
- **Spec §8 staged order** → Tasks 1→5 match token→shell→bento→motion→dark. ✓
- **Spec §9 verification / §10 rollback** → per-task verify loop + Task 6; branch-based rollback. ✓
- **Placeholder scan:** the only intentional TODOs are the flagged missing-data widgets (retention heatmap, plan mix) which the spec explicitly permits as follow-ups; all styling steps carry concrete values.
- **Type/selector consistency:** token names are preserved (not renamed); new ids (`#ov-bento`, `.span2/4`, `.row2`) are used consistently across Tasks 3–4.
