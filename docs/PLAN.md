# NextRaise Analytics — Redesign Implementation Plan

> **For agentic workers:** This is a single self-contained HTML app (vanilla JS + PostHog HogQL over `fetch`). There is no unit-test harness — **verification is visual**: serve the file, render each screen in Playwright (light + dark), screenshot, and confirm against the design system and real data. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild `nextraise-dashboard.vercel.app` as a premium "Refined SaaS" light/dark analytics console with 24 screens, every metric wired to real PostHog data (project 399417), shipped as one self-contained HTML file.

**Architecture:** Start from `source-live.html` (the real deployed app — it already contains the PostHog personal-API-key settings modal, the `runHogQL()` fetch helper, range handling, CSV/copy utilities, and working queries for the existing screens). Replace its CSS wholesale with the new Refined design system, replace its nav/router with the new 24-item grouped sidebar, restyle the existing screens' markup, and add 10 net-new screens with new real HogQL queries. Preserve every existing query's semantics (email/test/cohort-278743 exclusions, Asia/Kolkata TZ, `postgres.users`/`postgres.payments` as source of truth for subs/revenue).

**Tech Stack:** HTML + CSS custom properties (light/dark via `html[data-theme]`) + vanilla JS. Fonts: Inter (UI/numerals). Charts: hand-rolled inline SVG (bars, area, sparkline) — no chart lib. PostHog HogQL via the app's existing `runHogQL()`.

---

## Design System (locked — "Refined SaaS")

**Tokens** (from `concept-overview.html`, canonical):
- Light: `--bg #fbfcfe`, `--panel-bg #fff`, `--inset #f6f8fb`, `--border #e9edf3`, `--text #111726 / --text-2 #5a6474 / --text-3 #98a1b0`.
- Dark: `--bg #0c111b`, `--panel-bg #141b28`, `--inset #1a2130`, `--border #232c3d`, `--text #eef2f8 / #9aa7bd / #67748c`.
- Accents (both): `--blue #0065f4` (primary; dark `#5b9bff`), `--green`, `--violet`, `--amber`, `--teal`, `--red` with `-soft` fills.
- Radii `16/22px`. Shadows: soft (`--shadow-sm`, `--shadow`). Font-feature tabular-nums on.

**Components** (reuse classes verbatim across screens): `.sidebar/.brand/.nav-item/.nav-badge/.nav-div`, `.topbar/.page-title/.live/.seg/.btn`, `.kpi` (icon chip + label + 28px value + delta), `.panel/.panel-head/.legend`, `.bars` (SVG/flex bar chart), `.src` (horizontal source bars), `.table-wrap/table/.badge/.av/.rowbtn`, `.section-label/.pill`. Single blue primary accent; per-metric color only for data categories.

**Nav structure (24 items, grouped):**
- **OVERVIEW:** Overview, Daily, Insights, Search
- **GROWTH:** Acquire, Activate, Monetization, Retention, Lifecycle, Emails, Referrals, Influencers, Pro Users
- **PRODUCT:** Features, Quality
- **REPORTS:** Weekly, Monthly
- **OPERATIONS (kept legacy):** Exhausted Credits, Power Users, Expiring Soon, Abandoned, Ext. Uninstalled, Salahkart Users, Salahkart Pro
- Footer: Dark toggle, Settings.

**Verified real data (baseline, 2026-07-31, last 7d unless noted):** New signups 1,933 (+33.7% vs 1,446); 30d 5,649; all-time 11,669. Active Pro 164 / 13,373 users (1.23%). Revenue 30d ₹74,058 + $393.74, 108 payments, 103 payers. Daily signups 179/158/246/359/383/335/246. Sources: Google Ads 826, Direct 550, Chrome Ext 277, Meta Ads 217, Influencer 46.

---

## File Structure

- Create: `index.html` — the entire app (built by transforming `source-live.html`).
- Keep: `source-live.html` (reference for existing JS/queries — never shipped).
- Keep: `concept-overview.html` (canonical CSS + Overview markup to port in).
- `docs/PLAN.md` (this file), `docs/DATA-CONTRACT.md` (per-screen query map, produced in Task 1).

---

## Phase 0 — Foundation

### Task 1: Extract the data contract from the source
**Files:** Create `docs/DATA-CONTRACT.md`
- [ ] Grep `source-live.html` for every `runHogQL(` block; for each existing screen record: screen name, the HogQL, the DOM ids it fills, and the render function. (Query landmarks already located around lines 2926, 3704–3825, 4004–4306, 4562–4739, 5126–5841.)
- [ ] For each of the 10 net-new screens, write the intended real HogQL (see Task 8 for the drafts) into the contract.
- [ ] Verify each net-new query returns non-empty against PostHog project 399417 before it goes in a screen (via `execute-sql`). Record the sample result inline.

### Task 2: Build the app shell in `index.html`
**Files:** Create `index.html`
- [ ] Copy `source-live.html` → `index.html`. Delete its entire `<style>` block; paste the Refined design-system CSS from `concept-overview.html`.
- [ ] Replace the sidebar/nav markup with the 24-item grouped nav above (icons per `concept-overview.html`, group labels as `.nav-group`).
- [ ] Keep the existing settings modal + `runHogQL()` + range/`switchTab`/router JS. Re-point the router so each nav item shows its `#page-<id>` panel and lazy-loads on first view (preserve existing lazy-load pattern).
- [ ] Wire the footer Dark toggle to set `html[data-theme]` and persist to `localStorage`; default from `prefers-color-scheme`.
- [ ] **Verify:** serve on :8799, render `/index.html`, screenshot light + dark. Sidebar shows all 24 grouped items; toggle works; Settings modal opens. No console errors.

---

## Phase 1 — Overview (real)

### Task 3: Port the restyled Overview
**Files:** Modify `index.html` (`#page-overview`)
- [ ] Replace the Overview markup with the concept's KPI row + Daily Signups bars + Acquisition Sources + a table panel.
- [ ] Bind KPIs to the existing Overview queries' outputs (signups 7d/30d/all-time, active pro, 30d revenue, payers). Keep existing delta math.
- [ ] Render the daily-signups bar chart from the real daily array; render source bars from the real source query (bucketed: Google Ads/Direct/Chrome Ext/Meta Ads/Influencer/Other).
- [ ] **Verify:** with a valid PostHog key, numbers match the Task 1 baseline (±sync drift). Screenshot light + dark.

---

## Phase 2 — Existing core screens (restyle, keep queries)

### Task 4: Daily, Search, Activate, Monetization, Influencers, Pro Users
**Files:** Modify `index.html` (`#page-daily`, `#page-search`, `#page-activation`, `#page-revenue`, `#page-influencers`, `#page-pro`)
- [ ] For each: keep the existing query + render function; rewrite only the markup/classes to the Refined components (tables → `.table-wrap`, filters → `.seg`/`.chip`, KPIs → `.kpi`, avatars/badges as in concept). Rename nav label per the new scheme (Contact Lookup→Search, Revenue Analytics→Monetization, Activation→Activate).
- [ ] Preserve all filter chips, sort selects, CSV export, copy-all, and per-row copy behaviors.
- [ ] **Verify:** each screen renders with real data, all filters/exports still work, light + dark screenshots clean.

---

## Phase 3 — Legacy screens (kept, restyled)

### Task 5: Exhausted Credits, Power Users, Expiring Soon, Abandoned, Ext. Uninstalled, Salahkart Users, Salahkart Pro
**Files:** Modify `index.html` (their existing `#page-*`)
- [ ] Move under the OPERATIONS nav group. Restyle markup to Refined components; keep every query and interaction intact.
- [ ] **Verify:** real data renders; screenshots light + dark.

---

## Phase 4 — Net-new screens (build fully with real PostHog)

### Task 6: Acquire & Insights
**Files:** Modify `index.html` (new `#page-acquire`, `#page-insights`)
- [ ] **Acquire:** source×medium channel table + trend of signups by channel (real: reuse/extend the Overview source query with medium + prior-period delta). KPI row: total signups, top channel, paid vs organic split, influencer share.
- [ ] **Insights:** a compact "saved metrics" board — signup→onboarding→activation→pro funnel (via `query-funnel` events `signup_complete`→`onboarding_start`→`onboarding_complete`→`payment_completed`) + WoW deltas.
- [ ] **Verify:** funnel/channel numbers non-empty and sane; screenshots.

### Task 7: Retention & Lifecycle
**Files:** Modify `index.html` (new `#page-retention`, `#page-lifecycle`)
- [ ] **Retention:** weekly retention cohort grid from `query-retention` (returning event = `logged_in_session_start` or `$pageview` for signed-in). Heatmap cells styled with `--blue-soft`→`--blue`.
- [ ] **Lifecycle:** new/returning/resurrecting/dormant stacked bars from `query-lifecycle`.
- [ ] **Verify:** grids/bars populate; screenshots.

### Task 8: Emails, Referrals, Features, Quality
**Files:** Modify `index.html` (new `#page-emails`, `#page-referrals`, `#page-features`, `#page-quality`)
- [ ] **Emails:** funnel of `email_sent`→`email_delivered`→`email_opened`→`$workflows_email_link_clicked`, plus bounce/unsub counts (`email_bounced`, `email_unsubscribed`). KPI: send volume, delivery %, open %, CTR.
- [ ] **Referrals:** `referral_code_apply_attempt`→`referral_discount_applied`→`referral_purchase`→`referral_reward_granted` counts + top referrers (`argMax` referral_code).
- [ ] **Features:** usage leaderboard — counts of key feature events (`resume_upload_success`, `tailor_open`, `jobs_apply_click`, `analysis_results_view`, `ext_job_saved`, tracker events) over 7/30d with WoW delta bars.
- [ ] **Quality:** `$exception` volume trend + top issues via `query-error-tracking-issues-list`; `oauth_error`/`payment_failed`/`resume_upload_failed` counters; `$rageclick`/`$dead_click` counts.
- [ ] **Verify:** each query returns real rows; screenshots light + dark.

### Task 9: Weekly & Monthly reports
**Files:** Modify `index.html` (new `#page-weekly`, `#page-monthly`)
- [ ] **Weekly:** this-week-vs-last-week scorecard (signups, activations, new Pro, revenue, top channel, top feature) — each a KPI with delta, plus a 12-week trend bar strip.
- [ ] **Monthly:** same shape at month grain, 12-month trend; MRR/new-Pro/churn if derivable from `subscription_activated`/`subscription_terminated`.
- [ ] **Verify:** period math correct against manual spot-checks; screenshots.

---

## Phase 5 — Polish & ship

### Task 10: QA pass, responsive, deploy
**Files:** Modify `index.html`
- [ ] Cross-screen QA: consistent spacing, empty/loading/error states per screen (skeleton in `--inset`), keyboard focus rings, WCAG-AA contrast in both themes.
- [ ] Sidebar scroll behavior at ≥24 items; content min-width; graceful narrow-viewport.
- [ ] Final light + dark full-app screenshot sweep.
- [ ] Deploy: single `index.html` to Vercel (static). Confirm live parity.

---

## Self-Review notes
- **Spec coverage:** all 17 image sections + 7 kept legacy = 24 screens each have a task. Real-data requirement satisfied per-screen in Tasks 1/3/6–9. Light+dark verified every task.
- **Risk:** `postgres.*` warehouse sync lag (seen ~2h) and `plan_cache` value casing (basic/expired returned 0) — Task 1 must confirm real `plan_cache`/`sub_status` values before Monetization/Pro screens rely on them.
- **YAGNI:** no chart library, no build step, no framework — stays a single deployable file.
