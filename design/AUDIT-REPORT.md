# NextRaise dashboard — design fidelity audit

**Verdict: the deployed app is not 100% the same as the approved design.**

- 266 deviations survived adversarial verification (31 blockers, 147 major, 75 minor, 13 info)
- 185 spec requirements verified as correctly implemented
- 14 audit dimensions + 1 completeness critic, 29 agents, every finding re-checked by an independent verifier instructed to refute it
- Measured from live DOM captures of https://nextraise-dashboard-blue.vercel.app at 1440x900, 1024x800, 768x1024 and 402x874, in both appearances, against the prototypes rendered at the same viewports

Data-value differences (real PostHog numbers vs the prototype mock baseline) were excluded by rule and are not counted as defects.

## BLOCKER (31)

### Between 601px and 960px neither the phone nor the desktop design exists — the pre-redesign legacy console renders
`Completeness critic` · both · verdict CRITIC

**Designed:** One of the two approved surfaces at every width: the phone app (README §1 'Phone layout (402×874)') or the desktop console (README:97 'Desktop: 24px page padding, 16px grid gap, sidebar 248px, content max 1040–1200px').

**Deployed:** The entire mobile glass layer is scoped to `@media (max-width:600px)` and the whole desktop console to `@media (min-width:961px)`; the JS render branches use the same two gates. At 601–960px (iPad portrait 768, split-screen laptop) none of them apply, so the legacy screen renders: a 190px sidebar, an 'Growth performance / How the business is performing, and what to do next' heading, a 'Key opportunities' card and a 'Pro-plan rate' gauge — none of which appear anywhere in the approved design.

**Evidence:** index.html:2999 `@media (max-width:600px){` (mobile glass block) and index.html:2682 `@media (min-width:961px){` (desktop console block); index.html:6972 `const ndIsMobile = () => ... matchMedia('(max-width:600px)').matches`; index.html:6671 `const ndIsDesk = () => ... matchMedia('(min-width:961px)').matches`; index.html:7144-7145 `if (ndIsMobile()) {...} if (ndIsDesk()) {...}` with a legacy fall-through; index.html:1037-1039 `@media (max-width: 960px) { .sidebar { width: 190px; } ... }`; cap/live-tablet-768.png shows that legacy screen.

**Fix:** Give the two designed layouts contiguous coverage — raise the phone breakpoint (or add a tablet branch that reuses the desktop console at a reduced grid) so `ndIsMobile()` and `ndIsDesk()` between them cover every viewport, and delete the legacy fall-through.

### The eight generic More pages are not built from the designed shared page view-model — no dimension audited them
`Completeness critic` · both · verdict CRITIC

**Designed:** README:135 — 'Each of the eight generic pages renders from one shared view-model: blurb line, 3 KPI tiles, then one or more table sections (label column flexes, value columns fixed 76px, right-aligned)', with the per-page content of README:136-143 (e.g. Daily = today / yesterday / 7-day average + a 14-day table of Signups, Paid, Rate; Retention = D1/D7/D30 return + 5 weekly cohorts).

**Deployed:** Each page has its own bespoke fetch+render pair with no shared view-model. Daily emits FOUR icon-chip KPI tiles (Signups Today, Activations Today, Signups·30d, Revenue·30d), an undesigned ApexCharts area chart, and a five-column table (Day / Signups / Activations / Payments / Revenue) over 30 days, not 14. Acquire, Insights and Referrals also emit four tiles; Retention emits three but as Cohorts / Avg W1 Return / Newest Cohort with a 9-column W0–W6 grid and no D1/D7/D30 figures. The 76px fixed value column exists nowhere in the file.

**Evidence:** README.md:135-143; index.html:12689 `async function fetchDaily()` and index.html:12733-12737 `oKpi('i-users',...'Signups Today'...), oKpi('i-check-circle',...'Activations Today'...), oKpi('i-star',...'Signups · 30d'...), oKpi('i-coins',...'Revenue · 30d'...)`; index.html:12751-12753 `<th>Day</th><th>Signups</th><th>Activations</th><th>Payments</th><th>Revenue</th>`; index.html:12346-12349 (Retention's three tiles); `grep -n "76px" index.html` returns only index.html:2583, an unrelated `.nb-ranks.cvp` grid.

**Fix:** Build one page view-model module (blurb, 3 KPI tiles, table sections with a flexing label column and 76px right-aligned value columns) and re-render all eight pages through it with the README:136-143 content sets.

### Mobile range pill stays near-white in dark mode (white text on white)
`Dark appearance` · mobile · verdict CONFIRMED

**Designed:** In dark appearance the range chip should sit on a dark surface driven by the remapped tokens (spec --neutral-0 #131A2B / --surface-glass rgba(19,26,43,.82)), with --text-heading #F2F5FB readable on it.

**Deployed:** The chip keeps its light-mode background rgba(255,255,255,.88) and border rgba(255,255,255,.9) in dark, while its text flips to rgb(242,245,251) — effectively white text on a white pill. Only the text colour changed between appearances.

**Evidence:** live-mob-dark.txt:115 `[16,60,142,44] | button.gdr-btn | {"id":"gdrTabBtn-overview"} | 14/600/normal/normal | rgb(242, 245, 251) | rgba(255, 255, 255, 0.88) | r:999px | b:1 rgba(255, 255, 255, 0.9) | sh:rgba(15, 28, 61, 0.25) 0px 4px 14px -8px` vs live-mob-light.txt:115 identical bg/border/shadow with `rgb(15, 28, 61)` text. Source: index.html:3051-3054 `html[data-theme="light"] .nd-sub .gdr-btn{ ... border:1px solid rgba(255,255,255,.9) !important; background:rgba(255,255,255,.88) !important; box-shadow:0 4px 14px -8px rgba(15,28,61,.25) !important; ... }` — hardcoded literals inside the `@media (max-width:600px)` block that comes after, and out-specifies, the dark rule at index.html:2966.

**Fix:** Replace the literals at index.html:3053 with var(--nd-card)/var(--nd-edge)/var(--nd-sh), or add a `html[data-theme="light"][data-appearance="dark"] .nd-sub .gdr-btn` override inside the ≤600px block.

### Mobile attribution segmented control keeps its light track AND white thumb in dark (white label on white thumb)
`Dark appearance` · mobile · verdict ADJUSTED

**Designed:** README dark equivalents: segmented track `rgba(255,255,255,.06)`, thumb `rgba(255,255,255,.22 → .10)`. The desktop dark rule already does this (`rgba(255,255,255,.07)`).

**Deployed:** Track stays `rgba(15, 28, 61, 0.055)` with inset `rgba(15, 28, 61, 0.07) 0px 1px 3px 0px` (live-mob-dark.txt:122, identical to light), and the thumb stays `background:#fff` (index.html:3066) because its only dark override, index.html:2965, uses `::before` inside `:is()` and is an invalid, never-matching selector. The active label renders rgb(242,245,251) (live-mob-dark.txt:125) on that white thumb.

**Evidence:** live-mob-dark.txt:122 `[16,118,362,48] | div.bucket-seg | {"id":"bucketSeg","aria-label":"Attribution view"} | ... | rgb(242, 245, 251) | rgba(15, 28, 61, 0.055) | r:999px | b:- | sh:rgba(15, 28, 61, 0.07) 0px 1px 3px 0px inset` — byte-identical bg/shadow to live-mob-light.txt:122. Source: index.html:3061-3067 `html[data-theme="light"] .nd-head .bucket-seg{ ... background:rgba(15,28,61,.055) !important; ... box-shadow:inset 0 1px 3px rgba(15,28,61,.07) !important; }` … `::before{ ... background:#fff; ... }` — inside `@media (max-width:600px)`, after and out-specifying index.html:2964-2965.

**Fix:** Add `html[data-theme="light"][data-appearance="dark"] .nd-head .bucket-seg{...}` inside the ≤600px block, or drive 3063/3064/3067 from --nd-100 / --nd-hair / --nd-0 instead of literals.

### "Signup → Pro by period" conversion table card is absent from the desktop Overview
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** A card spanning 7 of 12 columns, padding 16/20/8, titled "Signup → Pro by period" (15px/700/-0.01em), with a 4-column grid Period / Signups / Pro / Rate (headers 11px/700/0.08em uppercase, --text-subtle), 40px rows separated by a 1px --neutral-100 top border, and the Rate cell coloured var(--text-success) when >=1.2%, var(--amber-700) when >=0.8%, else var(--text-danger). README Overview §1: "conversion table spans 7".

**Deployed:** The card does not exist anywhere in the deployed desktop Overview. renderOverviewConsole() builds the grid and stops after "Recent payments"; the legacy "Pro-plan rate by period" card (index.html:7379-7383) is unreachable on desktop because renderOverview() returns early at index.html:7145 (`if (ndIsDesk()) { try { renderOverviewConsole(); return; }`).

**Evidence:** proto-desk-light.txt: `[272,838,661,326] | div | {"data-dc-tpl":"148","data-card":""} ... p:16/20/8/20` and `[293,855,619,31] | div | {"data-dc-tpl":"149"} | 15/700/-0.15px/23.25px ... TXT«Signup → Pro by period»`, with headers `TXT«Period»` `TXT«Signups»` `TXT«Pro»` `TXT«Rate»` and rate cells `13/700 ... rgb(18, 148, 91) | TXT«1.42%»`. live-desk-light.txt: `#overviewArea` is `[281,69,1117,849]` and its last child is `[1029,490,346,404] | div.ndc.nd-s4.ndc-panel.ndc-list` (Recent payments) — 24 + 381 + 16 + 404 + 24 = 849, i.e. exactly two rows of cards. index.html:6828-6866 (renderOverviewConsole area.innerHTML ends with the Recent payments panel).

**Fix:** Append a `<div class="ndc nd-s7 ndc-panel">` conversion card to the renderOverviewConsole innerHTML (index.html:6866) with the Period/Signups/Pro/Rate grid from _ovData.convByPeriod, add a `.nd-s7{grid-column:span 7}` rule next to `.nd-s8`/`.nd-s4` (index.html:2845), and colour the rate cell with the 1.2% / 0.8% thresholds from DesktopOverview.dc.html:970.

### Pro subscribers card (span 5) is absent from the desktop Overview
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** A card spanning 5 of 12 columns, padding 20, gap 16, containing: a 40px/800/-0.03em count baseline-aligned with a 13px/500 muted caption "active Pro · {pct} of {users}"; an 8px ProgressBar toned var(--success-500) with label "Pro share of all users" and caption "{pct}"; then a 3-up grid of --neutral-50 tiles at radius 12px / padding 12px showing 18px/800 values labelled "Active Pro", "Active Basic", "Expired Pro" (11px/500). README Overview §1: "Pro subscribers card spans 5".

**Deployed:** The card does not exist in the deployed desktop Overview; there is no span-5 element and no "Pro share of all users" ProgressBar anywhere in the console render.

**Evidence:** proto-desk-light.txt: `[949,838,467,326] | div | {"data-dc-tpl":"161","data-card":""} ... p:20/20/20/20 | g:16`, `[970,853,68,51] | span.sc-interp | 40/800/-1.2px/40px ... TXT«164»`, `[1046,874,172,24] ... TXT«active Pro · of»`, `[970,915,126,17] | span | 13/600 ... TXT«Pro share of all users»`, `[970,937,425,8] | div | ... rgb(25, 182, 114) | r:999px`, and tiles `TXT«Active Pro»` / `TXT«Active Basic»` / `TXT«Expired Pro»`. live-desk-light.txt contains none of those strings; `#overviewArea` `[281,69,1117,849]` ends after Recent payments. index.html:6828-6866.

**Fix:** Add a `<div class="ndc nd-s5 ...">` Pro subscribers card after the conversion table in renderOverviewConsole (index.html:6866) plus a `.nd-s5{grid-column:span 5}` rule, reusing M.activePro / M.newProduct and the existing .nd-prog bar toned to the success token.

### Hero chart bars are not selectable — no tap target, no selected/unselected colours
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** Each bar is a <button> with aria-label; tapping selects it (selected bar var(--ink-900), all others var(--action-200), unselected-none state var(--action-500)); tapping again clears. Prototype: DesktopOverview.dc.html:212 `<button onClick="{{ b.onTap }}" aria-label="{{ b.aria }}" ...>` and :1169 `bg: st.bar === i ? 'var(--ink-900)' : st.bar == null ? 'var(--action-500)' : 'var(--action-200)'`. Proto digest confirms: `[297,212,94,219] | button | {"data-dc-tpl":"89","aria-label":"Thu: 182"}`.

**Deployed:** Bars are inert `<span><i></i></span>` with only a native browser `title` attribute. No click handler, no aria-label, no selected/dimmed state anywhere in the CSS — grepping index.html for a selected-bar rule returns only the single base rule at 2863.

**Evidence:** index.html:6806 `const barsHtml = bars.map(b => '<span><i style="height:' + ... + '%" title="' + esc(b.d) + ' · ' + b.v.toLocaleString('en-IN') + ' signups"></i></span>').join('');` — vs live digest `[330,206,87,219] | span |  | ... | r:0px` (plain span, no button/aria in the whole ndc-bars block)

**Fix:** Render each bar as `<button aria-label="{label}: {n}" onclick="ndSelectBar(i)">`, keep a `bar` index in state, and set the fill background to var(--ink-900) when selected, var(--action-200) when another bar is selected, var(--action-500) when none is.

### Emails and Lifecycle are back in the Growth nav group after the spec removed them
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Growth group holds exactly Acquire, Activate, Monetization, Retention, Referrals, Pro Users. README.md §5: "Operations, Reports, Product, Emails and Lifecycle were removed from the nav on request." Prototype Growth group is 255px tall: `[12,415,223,255] | div | {"data-dc-tpl":"33"}` containing only those six rows.

**Deployed:** Live Growth group is 291px tall and contains eight rows, including two that were explicitly removed: `[12,595,223,36] | a.tab | {"id":"tab-lifecycle"} | ... | TXT«Lifecycle»` and `[12,633,223,36] | a.tab | {"id":"tab-emails"} | ... | TXT«Emails»`. The two extra rows plus the extra group heading push the nav past its 669px column so the sidebar nav now scrolls.

**Evidence:** README.md §5: "Operations, Reports, Product, Emails and Lifecycle were removed from the nav on request." | live-desk-light.txt: `[12,595,223,36] | a.tab | {"id":"tab-lifecycle"} | 13.5/500/-0.084px/normal | ... | TXT«Lifecycle»` | index.html:3282 and index.html:3285

**Fix:** Delete the `<a id="tab-lifecycle">` and `<a id="tab-emails">` rows from the Growth group (index.html:3282, index.html:3285); keep the pages reachable from Report/Insights if still needed.

### Appearance switch collapses to a 94px pill and the Light/Dark/Auto labels overlap
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Full-width segmented control spanning the sidebar content box: `[12,1084,223,42] | div | {"data-dc-tpl":"38","data-seg":""}` — 223x42, three 72px cells (`[16,1088,72,34]`, `[88,1088,72,34]`, `[159,1088,72,34]`) each comfortably fitting its label.

**Deployed:** `[76,800,94,40] | div.nd-modes | {"id":"ndModes","aria-label":"Appearance"}` — 94x40, horizontally centred, with three 29px cells (`[79,803,29,34]`, `[109,803,29,34]`, `[138,803,29,34]`). At 12px/600 the words are ~30-34px wide, so they overflow their cells and run together; the cropped screenshot of live-desk-light.png reads "LightDark Auto" with the white thumb covering only part of "Light".

**Evidence:** live-desk-light.txt: `[76,800,94,40] | div.nd-modes | {"id":"ndModes","aria-label":"Appearance"} | ... | r:999px | b:- | sh:- | p:3/3/3/3` vs proto-desk-light.txt: `[12,1084,223,42] | div | {"data-dc-tpl":"38","data-seg":""} | ... | r:999px | b:1 rgba(255, 255, 255, 0.7)` — cause: index.html:2918 `.nd-modes{ ... display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); }` has no width, and index.html:180 `.sidebar-footer { display:flex; align-items:center; }` is never overridden by the column layout at index.html:2777.

**Fix:** Add `align-items:stretch` to the light-theme `.sidebar-footer` rule (index.html:2775-2777) and `width:100%` to `.nd-modes` (index.html:2918) so the control fills the 223px content box and each cell is 72px wide.

### "ANALYTICS" renders twice in the sidebar logo lockup
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** One Analytics label, right-aligned on the brand row: `[171,27,62,16] | span | {"data-dc-tpl":"18"} | 10/700/0.8px/15.5px | rgb(162, 166, 179) | ... | TXT«Analytics»` — a single mark + wordmark + label lockup 62px tall overall (brand row 62px).

**Deployed:** Two labels render: a stacked `[60,43,78,12] | span.logo-sub | 8.5/700/1.87px/normal | rgb(138, 138, 146) | ... | TXT«ANALYTICS»` directly under the wordmark, plus the injected `[160,30,67,14] | span.nd-brandmark | 10/700/0.8px/normal | rgb(162, 166, 179) | ... | TXT«Analytics»` at the right. The stacked copy also grows the brand row from 62px to 66px, shifting the whole nav down 4px (`[12,62,223,44]` team button in proto vs `[12,66,223,44]` live).

**Evidence:** live-desk-light.txt: `[60,43,78,12] | span.logo-sub | 8.5/700/1.87px/normal | rgb(138, 138, 146) | ... | TXT«ANALYTICS»` and `[160,30,67,14] | span.nd-brandmark | 10/700/0.8px/normal | ... | TXT«Analytics»`; the legacy markup is index.html:3239 and the injected duplicate is index.html:6732

**Fix:** Hide the legacy `.logo-sub` in the light-theme console block (it is already hidden for `.brand-sub` at index.html:2721 — add `.logo-sub` to that rule) and keep only the injected `.nd-brandmark`.

### Sidebar team button navigates to Creators instead of opening the team switcher
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** README.md §7: "Team switcher — opened from the header title (phone) or the sidebar team button (desktop). Four teams — Growth (GR, action blue, Overall), Influencer marketing (IM, success, Influencer), Performance marketing (PM, amber, Perf), Founders (FO, ink, Overall). A tinted thumb slides between rows (64px phone / 56px desktop). Picking a team sets the default attribution bucket, shows a check, and closes after 360ms."

**Deployed:** The button's click handler switches the main content to the Creators/influencers page; there is no team popover anywhere in the sidebar markup: `t.onclick = () => switchTab('influencers');`

**Evidence:** index.html:6738 `t.onclick = () => switchTab('influencers');` (team button built at index.html:6736-6740) | README.md §7 "Team switcher — opened from ... the sidebar team button (desktop). Four teams ..."

**Fix:** Bind the `.nd-team` button to a 4-row team popover (56px rows, tinted sliding thumb) that sets the attribution bucket and closes after 360ms, rather than to `switchTab('influencers')`.

### Desktop renders the flat fallback, not Liquid Glass — zero backdrop-filter anywhere
`Liquid Glass theme` · desktop · verdict CONFIRMED

**Designed:** theme="glass" is the default: desktop cards rgba(255,255,255,.58) / radius 24px / box-shadow 0 12px 36px rgba(15,28,61,.08) + inset 0 1px 0 rgba(255,255,255,.9) / backdrop-filter blur(24px) saturate(1.6), on a screen with the two drifting radial tints.

**Deployed:** Desktop cards are fully opaque white, radius 16px, shadow-sm, and NO backdrop-filter on any element in either appearance. A grep for `bf:blur` across live-desk-light.txt and live-desk-dark.txt returns zero rows. This is exactly the README's `theme="flat"` description (opaque --neutral-0 cards, --shadow-sm, 16px radius, no blur, no tints), which is meant to be a prefers-reduced-transparency fallback only.

**Evidence:** live-desk-light.txt:199 `[305,93,708,381] | div.ndc.nd-s8.ndc-hero | ... | rgb(255, 255, 255) | r:16px | b:1 rgb(230, 234, 243) | sh:rgba(15, 20, 25, 0.06) 0px 1px 3px 0px, rgba(15, 20, 25, 0.04) 0px 1px 2px 0px | ... | bf:- |`  — README: "Cards: background rgba(255,255,255,.58) … border-radius 24px … backdrop-filter blur(24px) saturate(1.6)"; the entire glass CSS block is fenced inside `@media (max-width:600px)` at index.html:2999.

**Fix:** Lift the glass card/header/tab-bar/tint rules out of the `@media (max-width:600px)` wrapper (index.html:2999) into an unscoped `[data-theme="glass"]` layer, and gate the flat values behind `@media (prefers-reduced-transparency: reduce)` instead of behind viewport width.

### Dark cards are opaque #131A2B — the correct rgba(255,255,255,.055) token is defined then overridden
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** Dark card `rgba(255,255,255,.055)` over the dark canvas (translucent, so the tints and content behind read through).

**Deployed:** Every card resolves to solid `rgb(19, 26, 43)` (#131A2B = --nd-0). index.html:2935 correctly declares `--nd-card:rgba(255,255,255,.055);` but index.html:2957 then sets `:is(.ndc,.nd-card,.ov-card,…){ background:var(--nd-0) !important; }`, so the glass token is never used in dark. backdrop-filter is still applied, but over an opaque fill it is a no-op.

**Evidence:** live-mob-dark.txt:194 `[29,-795,328,276] | div.nd-card.nd-hero | … | rgb(19, 26, 43) | r:20px | b:1 rgba(255, 255, 255, 0.1) | sh:rgba(0, 0, 0, 0.6) 0px 16px 40px -20px | … | bf:blur(20px) saturate(1.5) |`; index.html:2935 `--nd-card:rgba(255,255,255,.055);` vs index.html:2957 `background:var(--nd-0) !important;`

**Fix:** Change index.html:2957 to `background:var(--nd-card) !important;` so the already-correct .055 token takes effect.

### The drifting radial tints never animate — nrDrift does not exist in the app
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** Both radial tints animate `translate(0,0) → (18px,−22px) → (0,0)` over 14s and 18s respectively (second reversed), `ease-in-out infinite`.

**Deployed:** There is no drift keyframe at all. `grep -c nrDrift index.html` returns 0, and the tint layer (`.app-body::before`) declares no `animation` property, so both tints are static. The 20 @keyframes blocks in the file are cmdkIn, ndRise, ndcRise, ndSheet and similar — none is a drift.

**Evidence:** index.html:3016-3020 `html[data-theme="light"] .app-body::before{ content:""; position:fixed; inset:0; z-index:0; pointer-events:none; background: radial-gradient(...), radial-gradient(...); }` — no `animation` declared; `grep -c "nrDrift" index.html` → 0. README: "both animate translate(0,0) → (18px,−22px) → (0,0) over 14s / 18s (second reversed), ease-in-out infinite".

**Fix:** Add `@keyframes nrDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-22px)}}`, split the two tints into separate layers, and run `nrDrift 14s ease-in-out infinite` / `nrDrift 18s ease-in-out infinite reverse`.

### Desktop Report nav icon is trending-up, not the designed clipboard-list
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** Lucide `clipboard-list` on the Report sidebar tab.

**Deployed:** `#i-trending` — an arrow/line chart glyph (`M23 6l-9.5 9.5-5-5L1 18` + `M17 6h6v6`), i.e. Lucide `trending-up`, which is not in the approved slug list at all.

**Evidence:** proto-desk-light.txt: `[22,171,18,18] | span | {"data-icon":"clipboard-list"}` vs index.html:3248 `<svg class="ic-sm"><use href="#i-trending"/></svg> Report` (symbol defined index.html:3202)

**Fix:** Point the Report tab at a `clipboard-list` symbol (the mobile bottom nav at index.html:11499 already draws a clipboard — reuse that geometry, cut from Lucide).

### Desktop Creators nav icon is megaphone, not the designed users
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** Lucide `users` on the Creators sidebar tab.

**Deployed:** `#i-megaphone` (`m3 11 18-5v12L3 14v-3z` + `M11.6 16.8a3 3 0 1 1-5.8-1.6`) — a slug that does not appear in the approved list. A correct `#i-users` symbol already exists in the sprite but is not used here.

**Evidence:** proto-desk-light.txt: `[22,213,18,18] | span | {"data-icon":"users"}` vs index.html:3251 `<svg class="ic-sm"><use href="#i-megaphone"/></svg> Creators` (symbol defined index.html:3204)

**Fix:** Change index.html:3251 to `<use href="#i-users"/>`; the mobile bottom nav (index.html:11505) already uses the users glyph, so this also fixes a desktop/mobile inconsistency.

### Sidebar logo lockup renders the ANALYTICS wordmark twice
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** One "Analytics" suffix, 10px/700/0.8px letter-spacing, sitting at the right end of the brand row (proto: x=171).

**Deployed:** Two separate wordmarks render simultaneously: a static `span.logo-sub` "ANALYTICS" at 8.5px/700/1.87px stacked under the logotype, plus a JS-injected `span.nd-brandmark` "Analytics" at 10px/700/0.8px at x=160. The redesign layer appends its own mark without removing the original.

**Evidence:** live-desk-light.txt: `[60,43,78,12] | span.logo-sub | … | TXT«ANALYTICS»` AND `[160,30,67,14] | span.nd-brandmark | … | TXT«Analytics»`; same pair in live-desk-dark.txt. proto-desk-light.txt has only `[171,27,62,16] | span | {"data-dc-tpl":"18"} | 10/700/0.8px/15.5px | … | TXT«Analytics»`. Source: index.html:3239 `<span class="logo-sub">ANALYTICS</span>` and index.html:6731-6733 `const m = document.createElement('span'); m.className = 'nd-brandmark'; m.textContent = 'Analytics';`

**Fix:** Delete `<span class="logo-sub">ANALYTICS</span>` at index.html:3239 (or have `ndBuildConsole` remove it before appending `.nd-brandmark`), leaving a single Analytics suffix.

### No toast system exists anywhere in the app
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:160 — "**Toast** — pill, `--ink-900` on light / white on dark, bottom 110px (phone) or 28px (desktop), auto-dismiss 2.2s." Toasts are the designed feedback channel for refresh, export, save, campaign rows and every unimplemented affordance.

**Deployed:** There is no toast component, no toast CSS class and no toast function in the deployed file. `grep -ni "toast\|snack\|notify\|flash" /Users/jayashish/nextraise-dashboard/index.html` returns zero matches across all 12,892 lines. Every place the spec calls for a toast either does nothing, navigates to a legacy tab, or writes inline text.

**Evidence:** index.html — `grep -ni "toast" index.html` → no output (0 matches in 12,892 lines); README.md:160 "**Toast** — pill, `--ink-900` on light / white on dark, bottom 110px (phone) or 28px (desktop), auto-dismiss 2.2s."

**Fix:** Add one `ndToast(msg)` helper: fixed pill, `background var(--ink-900)` on light / `#fff` on dark, `bottom:110px` under 601px and `bottom:28px` above, `border-radius:999px`, auto-remove at 2.2s. Then wire it to refresh, export, save and all inert affordances.

### Chart bars are inert — no select/deselect, no centred pill tooltip, no recolour
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:110 — "Tapping a bar selects it: bar turns `--ink-900`, all others `--action-200`, and a pill tooltip `{n} signups · {label}` appears centred above the chart. Tapping again clears." State shape carries `bar: number|null` (README:188).

**Deployed:** Bars are rendered as plain `<span><i style="height:N%" title="…">` with no click handler, no `cursor:pointer`, no selected class and no tooltip element. The only feedback is the browser's native `title` attribute. There is no `bar` state variable anywhere in the file.

**Evidence:** index.html:6806-6807 `const barsHtml = bars.map(b => '<span><i style="height:' + Math.max(3, Math.round(b.v / bMax * 100)) + '%" title="' + esc(b.d) + ' · ' + b.v.toLocaleString('en-IN') + ' signups"></i></span>').join('');` (mobile twin at index.html:7054-7056). Bar CSS index.html:2863-2864 `.ndc-bars i{ display:block; width:100%; border-radius:6px 6px 2px 2px; background:var(--nd-act-500); transition:height 520ms …}` — no pointer, no selected state.

**Fix:** Make each `<span>` a button carrying `data-i`, keep a `_ndBar` index, toggle it on click, re-render with the selected `<i>` at `var(--ink-900)` and siblings at `var(--action-200)`, and absolutely position a pill `{n} signups · {label}` centred above the chart.

### No drill-downs exist — KPI tiles, See all and the Pro card navigate to legacy tabs
`Interactions & behaviour` · both · verdict ADJUSTED

**Designed:** README:146 — "Phone: full-screen push from the right, header = back chevron + title + meta. Desktop: 460px right-hand drawer over a scrim, header = close `x` + title + meta." (motion: README:88, "Phone drill-down push | 380ms `cubic-bezier(.32,.72,0,1)`, `translateX(100% → 0)`"; width: README:97, "drawer 460px"). Seven drill-downs are specified (sources, signups, payments, pro, alerts, creator, person), with KPI tiles opening the matching one (README:108) and "See all" opening the sources drawer (README:109).

**Deployed:** No drill-down drawer or push view is implemented for any of the seven. The four KPI tiles and three "See all" links are `<button onclick="switchTab(...)">` that swap the entire page for a legacy analytics page instead of opening an in-context drawer: Revenue→`page-revenue` (index.html:6840), Active Pro→`page-pro` (:6844), Signed up & paid→`page-insights` (:6848, off-target), Payers · ARPU→`page-revenue` (:6854), and See-all→acquire/search/revenue (:6858, :6865, :6867). Recent-signup and recent-payment rows are plain `<div class="ndc-row">` / `<div class="nd-row">` with no handler (:6816, :6824, :7083, :7092), so the person and payments drill-downs are unreachable. The designed Pro subscribers card is not rendered on the deployed overview at all, so there is no Pro-card entry point. The file does contain other overlays (settings `modalOverlay` :5057, `creatorModalOverlay` :5101, cmdk :11577) and an alerts sheet, but none is a drill-down; `grep -n "drawer"` matches only the mobile nav sidebar.

**Evidence:** index.html:6840 `'<button class="ndc ndc-kpi" onclick="switchTab(\'revenue\')">…Revenue…'`, :6844 `switchTab('pro')`, :6848 `switchTab('insights')`, :6854 `switchTab('revenue')`; :6858 `'<button class="nd-see" onclick="switchTab(\'acquire\')">See all ›</button>'`, :6865 `switchTab('search')`, :6867 `switchTab('revenue')`; rows at :6816 and :6824 are `<div class="ndc-row">` with no handler. Digest: `grep -i "Pro subscribers" live-desk-light.txt` → no match (proto-desk-light.txt has "Signup → Pro by period").

**Fix:** Build one drill-down host: under 601px a `position:fixed;inset:0` panel animating `translateX(100% → 0)` over 380ms `cubic-bezier(.32,.72,0,1)` with a back chevron header; at 961px+ a 460px right drawer over `var(--surface-scrim)` with a close `x`. Route the KPI tiles, See all links and list rows into it by `sub` id instead of `switchTab`.

### Team switcher is absent — the sidebar team button jumps to the Creators tab
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:157 — "**Team switcher** … Four teams — Growth (GR, action blue, Overall), Influencer marketing (IM, success, Influencer), Performance marketing (PM, amber, Perf), Founders (FO, ink, Overall). A tinted thumb slides between rows (64px phone / 56px desktop). Picking a team sets the default attribution bucket, shows a check, and closes after 360ms."

**Deployed:** The sidebar renders a static, non-switching team card whose click handler navigates to the Creators tab. No list of teams exists: `grep -ni "Founders\|Influencer marketing\|Performance marketing\|nd-teams\|teamSheet" index.html` returns zero matches. There is no sliding thumb, no check, no 360ms close, and no team→default-bucket mapping. On phone the header title is not tappable at all.

**Evidence:** index.html:6737-6740 `const t = document.createElement('button'); t.className = 'nd-team'; t.onclick = () => switchTab('influencers'); t.innerHTML = '<span class="av">GR</span><span class="tx"><b>Growth</b><s id="ndTeamSub">Team · Overall bucket</s></span>';` Live digest live-desk-light.txt:`[58,72,167,18] | b | … TXT«Growth»` / `[58,90,167,15] | s | {"id":"ndTeamSub"} | … TXT«Team · Overall bucket»`. Prototype digest proto-mob-teamsheet.txt:`TXT«Switch team»`, `TXT«Influencer marketing»`, `TXT«Performance marketing»`, `TXT«Founders»`.

**Fix:** Replace the `switchTab('influencers')` handler with a sheet (phone) / popover (desktop) listing the four teams with their avatar tints, a thumb translated to the active row (64px phone / 56px desktop, 320ms `cubic-bezier(.32,.72,0,1)`), a check on the chosen row, `setBucketView()` on the team's default bucket, and a 360ms close timer.

### Card 6 "Signup → Pro by period" table is entirely absent from the deployed mobile screen
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** A 6th card after Recent payments: section title "Signup → Pro by period" (15px/700) plus a 4-column table with header row Period / Signups / Pro / Rate and 6 body rows (Today, Yesterday, Last 7 days, Last 14 days, This month, Last month), Rate coloured ≥1.2% success / ≥0.8% amber / else danger. Prototype renders it as a card at [16,1709,370,326].

**Deployed:** The mobile card stack ends with Recent payments (last card [29,1425,328,320], bottom edge y=1745). No table card, no "Period/Signups/Pro/Rate" header, no rate cells anywhere in the mobile DOM — the live mobile digest contains zero TXT nodes matching Period, Signups, Pro, Rate. The mobile render function builds exactly five cards and stops.

**Evidence:** README.md §1: "6. **Signup → Pro by period** — 4-column table (Period / Signups / Pro / Rate), rate coloured ≥1.2% success, ≥0.8% amber, else danger." | proto-mob-light.txt:303 `[16,1709,370,326] | div | {"data-dc-tpl":"122","data-card":""} | ... p:16/20/8/20` and :304 `TXT«Signup → Pro by period»`, :306 `TXT«Period»` :307 `TXT«Signups»` :308 `TXT«Pro»` :309 `TXT«Rate»` | index.html:7133-7134 — last string concatenated into `area.innerHTML` is the Recent payments card; nothing follows.

**Fix:** Append a 6th card in the mobile `area.innerHTML` (index.html:7134) rendering the same period breakdown the design specifies: header row Period/Signups/Pro/Rate at 11px/700/0.08em uppercase, 6 body rows at 13px, rate cell tinted by the 1.2%/0.8% thresholds. The period list already exists in the file (index.html:5623 "Periods shown in the Overview 'Free → Pro by period' breakdown").

### Header team switcher is static text — no button, no chevron
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Title + team line sit inside one tappable team button with a chevron affordance, per README:104 "logo + team button + refresh + bell + avatar row". Prototype: `[58,62,78,44] | button | {"data-dc-tpl":"19","data-team":""}` wrapping the 17px title, the blue dot + "Growth" label, and `[115,88,12,12] | span | {"data-icon":"chevrons-up-down"}`.

**Deployed:** Live renders a non-interactive `<span class="nd-ttl"><b id="ndPageTitle">…</b><i>Growth</i></span>` — digest shows only `[57,12,85,22] | b | {"id":"ndPageTitle"}` and `[57,35,85,15] | i | … | TXT«Growth»`. No button element, no chevrons-up-down icon anywhere in the mobile header. The only `.nd-team` control in index.html is injected into the DESKTOP sidebar (index.html:6737-6740), so on phone there is no way to switch team.

**Evidence:** index.html:6990 `'<span class="nd-ttl"><b id="ndPageTitle">' + title + '</b><i>Growth</i></span>' +` ; proto-mob-light digest `[58,62,78,44] | button | {"data-dc-tpl":"19","data-team":""}` and `[115,88,12,12] | span | {"data-icon":"chevrons-up-down"}` ; README.md:104

**Fix:** Wrap `.nd-ttl` (title + team line) in a `<button class="nd-team-btn">` with a 12px chevrons-up-down icon appended, min 44px hit height, opening the team sheet (proto-mob-teamsheet).

### Range pill is white-on-white in dark appearance
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** In dark appearance the range pill takes the dark glass treatment — prototype dark: `[20,-1207,139,36] | button | {"data-pill":""} | 13/600 | rgb(242, 245, 251) | rgba(255, 255, 255, 0.07) | b:1 rgba(255, 255, 255, 0.12)` i.e. light text on a translucent dark pill.

**Deployed:** Live dark keeps the light-mode white pill and the light-mode text colour: `[16,60,142,44] | button.gdr-btn | {"id":"gdrTabBtn-overview"} | 14/600/normal/normal | rgb(242, 245, 251) | rgba(255, 255, 255, 0.88) | r:999px | b:1 rgba(255, 255, 255, 0.9)`. Near-white label on a 88%-white background — the "Last 7 days" text is unreadable. The dark override at index.html:2966-2967 is later overridden by the `!important` light-glass rule.

**Evidence:** live-mob-dark digest `[16,60,142,44] | button.gdr-btn | … | rgb(242, 245, 251) | rgba(255, 255, 255, 0.88)` ; index.html:3051-3054 `html[data-theme="light"] .nd-sub .gdr-btn{ … background:rgba(255,255,255,.88) !important; … color:var(--nd-900) !important; }`

**Fix:** Add a `html[data-theme="light"][data-appearance="dark"] .nd-sub .gdr-btn` rule after index.html:3054 setting `background:rgba(255,255,255,.07) !important; border-color:rgba(255,255,255,.12) !important; color:var(--nd-900) !important` (which is light in dark mode).

### Report header card (eyebrow + range-as-title + accent Export) replaced by a plain page heading
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** A glass header card containing eyebrow "CEO Report · {bucket}" at 11/700/0.88px, the range as the title at 22/800/-0.44px, and a right-aligned accent Export button. Proto: `[272,95,1144,187] | div | {"data-dc-tpl":"172","data-card":""} | ... | r:24px` with `[297,116,147,17] | span | ... 11/700/0.88px | TXT«CEO Report ·»` and `[297,133,114,28] | span.sc-interp | 22/800/-0.44px | TXT«Last 7 days»`.

**Deployed:** No header card and no eyebrow at all. A bare page heading: `[339,93,417,41] | div.home-title | 30/700/-0.9px | TXT«Marketing report»` plus `[339,137,417,18] | div.ov-sub | 13.5/500 | TXT«CEO-level marketing performance: signups, revenue, channel spend»`; the range is a separate pill below (`[364,171,63,16] | span.gdr-tab-label | TXT«Last 7 days»`).

**Evidence:** proto-desk-report.txt: `[297,116,147,17] | span | {"data-dc-tpl":"175"} | 11/700/0.88px/17.05px | ... | TXT«CEO Report ·»`; index.html:4658 `<div class="home-title" style="margin:0 0 3px;">Marketing report</div>`

**Fix:** Wrap the report header in a `data-card` glass block; render eyebrow `CEO Report · {BUCKET_VIEW}` at 11/700/0.88px above the range as the 22/800 title, and drop the separate 30px page title/subtitle.

### Designed single revenue-sorted "Creators and campaigns" table replaced by two tables with different columns and no Revenue/ROAS
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** One table titled "By creator" / "By campaign" / "Creators and campaigns" per bucket, desktop columns Creator · Signups · Spend · Sales · ROAS (README:123); proto headers `TXT«Creator»`, `TXT«Signups»`, `TXT«Spend»`, `TXT«Sales»`, `TXT«ROAS»` under `TXT«Creators and campaigns»` with `TXT«sorted by revenue»`.

**Deployed:** Two separate tables: "Per-creator breakdown" with 10 columns (Creator / Code, Budget, Views, Likes, Comments, Shares, Signups, Sales, Conv%, Cost/Signup) and "Per-campaign performance" with Campaign, Network, Spend, Impressions, Clicks, CTR%. Neither carries Revenue or ROAS.

**Evidence:** live-desk-report.txt: `[340,435,230,36] | th | ... | TXT«Creator / Code»` … `[1214,435,119,36] | th | ... | TXT«Cost/Signup»`, and `[339,800,1002,16] | div.rep-section-title | ... | TXT«Per-campaign performance»`; index.html:11856-11866 lists the ten `<th>`s

**Fix:** Merge into one bucket-titled table with the five designed desktop columns and add ROAS/Revenue to the row model.

### Creators screen is an unrelated "Influencers & referrers" card list, not the designed KPI-tiles + 6-column table
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Three KPI tiles (Creators, Signups, ROAS) over a 6-column desktop table Creator / Views / Signups / Budget / Revenue / ROAS, with ROAS coloured by threshold (README:127). Proto: `[293,116,66,14] | TXT«Creators»` / `[680,116,56,14] | TXT«Signups»` / `[1066,116,35,14] | TXT«ROAS»` tiles, then headers `TXT«Creator»`, `TXT«Views»`, `TXT«Signups»`, `TXT«Budget»`, `TXT«Revenue»`, `TXT«ROAS»`.

**Deployed:** The route renders `#page-influencers`: a toolbar (Refresh, name/email/code filter, sort dropdown, range pill), a 6-pill stats bar (Influencers, Total Referrals, Pro Conversions, Avg Conversion, Converting, Revenue) and an expandable referral card list. No Views, Budget or ROAS anywhere.

**Evidence:** index.html:9695 `document.getElementById('inflArea').innerHTML = meta + \`<div class="infl-list">${cards}</div>\`;` and index.html:3921-3941 stats pills (`<span class="stat-label">Total Referrals</span>`, `Pro Conversions`, `Avg Conversion`, `Converting`); live-desk-creators.txt shows only `[712,93,256,72] | div.toolbar` and skeletons — no KPI tiles, no table headers.

**Fix:** Build the designed Creators view (3 KPI tiles + 6-column creator table with threshold-coloured ROAS) rather than reusing the referrals tab.

### Designed mobile Report, Creators and Search screens are not implemented — desktop DOM just reflows
`Report / Creators / Search` · mobile · verdict ADJUSTED

**Designed:** Distinct phone compositions: Report with a 3×2 KPI grid at 18px values (proto-mob-report `[162,-441,71,23] | span.sc-interp | 18/800/-0.36px/19.8px | TXT«₹65,200»`) and phone table columns name/code · Spend · Sales · ROAS; Creators as 40px-avatar rows with `code · platform · n signups` and right-aligned revenue + ROAS (proto-mob-creators `[301,409,64,17] | span | 11/600 | TXT«ROAS»` / `TXT«0.75×»`); Search with a 48px field at radius 14px, a "Quick filters" group and a "Recent lookups" list (proto-mob-search `[16,233,370,48] | div | {"data-dc-tpl":"215","data-pill":""} | ... | r:14px` and `[16,562,370,25] | span | 11/700/0.88px | TXT«Quick filt…»`).

**Deployed:** index.html has a 5-item mobile bottom nav (Overview / Report / Creators / Search / More) that calls `switchTab()` on the same desktop sections (index.html:11494-11515), so the desktop DOM simply reflows: no phone-specific KPI grid, creator row or search layout exists, and no live mobile captures of them exist. Mobile CSS is reflow-only rather than absent — beyond index.html:1142-1144 (`.page` padding, `.search-box` padding, 16px `.search-input`) there is `.infl-card-head { flex-wrap: wrap; }` at index.html:1157, `.search-suggestions { grid-template-columns: 1fr; }` at index.html:1232, `.sno-th, .sno-td { display: none; }` at index.html:1203, `.ov-card,.rev-kpi,.okpi,.ocard,.infl-card{ min-width:0 !important; max-width:100% !important; }` at index.html:2338, and a 12-rule `@media (max-width:900px)` block at index.html:2389-2400 restyling `.infl-metric` / `.infl-ref-*` plus `@media (max-width:520px)` at index.html:2401-2404. None of it reproduces the designed phone compositions.

**Evidence:** index.html:11498-11511 (`<button class="mob-nav-item" id="mbn-report" onclick="switchTab('report')" …>`, `id="mbn-creators" onclick="switchTab('influencers')"`, `id="mbn-search" onclick="switchTab('search')"`); index.html:1142-1144 `.page { padding: 16px 14px 28px; max-width: 100vw; overflow-x: hidden; } .search-box { padding: 16px; } .search-input { font-size: 16px; }` is the entire mobile treatment; AUDIT-BRIEF.md:33 confirms "(no live capture — mobile has no such screens…)"

**Fix:** Author the three phone layouts from the mobile prototypes (3×2 18px KPI grid, 4-column phone report table, 40px-avatar creator rows, 48px/14px search field with quick-filter chips) behind the existing mobile media query.

### index.html renders in General Sans + IBM Plex Mono, not Plus Jakarta Sans (widget.html is compliant)
`Typography` · both · verdict ADJUSTED

**Designed:** README Typography: "Single family: **Plus Jakarta Sans**, weights 300–800". Prototype confirms: every node in proto-desk-light.json / proto-mob-light.json computes fontFamily = "Plus Jakarta Sans", "Plus Jakarta Sans Fallback", -apple-system, "system-ui", "Segoe UI", sans-serif (484 / 402 nodes, 100%).

**Deployed:** Every index.html screen, light and dark: 361/365 desktop and 370/374 mobile nodes compute "General Sans", Inter, -apple-system, system-ui, sans-serif, the rest IBM Plex Mono. Zero nodes resolve to Plus Jakarta Sans in any of the 14 index.html captures, although it is linked at index.html:21. The one compliant surface is widget.html, 53/53 nodes in "Plus Jakarta Sans", system-ui, sans-serif (widget.html:16).

**Evidence:** digest live-desk-light.txt: `[0,0,1440,900] | body |  | 14/400/-0.084px/normal | rgb(10, 10, 10) | rgb(245, 247, 255) …` — raw live-desk-light.json body.s.fontFamily = "\"General Sans\", Inter, -apple-system, system-ui, sans-serif"; index.html:2449-2451 `html[data-theme="light"] :is(body,.app-layout,.app-body,input,select,textarea,button,.tab,.btn,…){ font-family:'General Sans','Inter',-apple-system,system-ui,sans-serif !important; }`

**Fix:** Delete/retarget the General Sans and IBM Plex Mono overrides (index.html:2449-2451, 2454-2455, 1824-1827, 18-20) so the single `html[data-theme="light"] body{font-family:'Plus Jakarta Sans'…}` rule at index.html:3014 is the only family declaration. Note its `:is()` selector at 2449 has higher specificity (0,2,1) than the body rule at 3014 (0,1,2), so removing it is required, not just reordering.

### Desktop hero metric renders 600 weight / -0.02em in IBM Plex Mono instead of 800 / -0.03em
`Typography` · desktop · verdict CONFIRMED

**Designed:** README Typography table, "Hero metric (desktop) | 48px / 800 / -0.03em". Prototype: 48px / 800 / -1.44px (= -0.03em) / lh 48px in Plus Jakarta Sans. index.html:2851 already declares the right values: `.ndc-big{ font-size:48px; font-weight:800; letter-spacing:-.03em; line-height:1; }`.

**Deployed:** 48px / 600 / -0.96px (= -0.02em) / lh 48px, rendered in IBM Plex Mono. The element carries both classes (`ndc-big stat-num`) and the `.stat-num` rule wins.

**Evidence:** digest live-desk-light.txt: `[330,139,139,48] | span.ndc-big.stat-num |  | 48/600/-0.96px/48px | … | TXT«9,063»` vs proto-desk-light.txt: `[297,137,127,61] | span.sc-interp |  | 48/800/-1.44px/48px | … | TXT«1,933»`; index.html:2454-2455 `html[data-theme="light"] :is(.nb-kpi-v,.rev-kpi-num,.stat-num,…){ font-family:'IBM Plex Mono',ui-monospace,monospace !important; font-weight:600 !important; letter-spacing:-.02em !important; … }`

**Fix:** Remove `.stat-num` from the IBM Plex Mono override list at index.html:2454, or drop the `font-weight:600 !important; letter-spacing:-.02em !important` from that rule, so index.html:2851 (800 / -0.03em) applies.

### Phone hero metric renders 600 weight / -0.02em instead of 800 / -0.03em
`Typography` · mobile · verdict CONFIRMED

**Designed:** README Typography table, "Hero metric (phone) | 40px / 800 / -0.03em / line-height 1". Prototype: 40px / 800 / -1.2px (= -0.03em) / lh 40px.

**Deployed:** 40px / 600 / -0.8px (= -0.02em) / lh 40px, in IBM Plex Mono. Two separate defects stack: the base rule index.html:3092 declares `font-weight:700` (already one step light), then index.html:2455 forces 600 and -0.02em via `.stat-num`.

**Evidence:** digest live-mob-light.txt: `[50,263,116,40] | div.nd-big.stat-num |  | 40/600/-0.8px/40px | … | TXT«9,063»` vs proto-mob-light.txt: `[37,279,105,51] | span.sc-interp |  | 40/800/-1.2px/40px | … | TXT«1,933»`; index.html:3092 `html[data-theme="light"] .nd-big{ font-size:40px; font-weight:700; letter-spacing:-.03em; line-height:1; … }`

**Fix:** Set index.html:3092 to `font-weight:800` and remove `.stat-num` from the mono/600 override at index.html:2454-2455. Identical in dark (live-mob-dark.txt shows the same 40/600/-0.8px/40px).

## MAJOR (147)

### Desktop topbar title overflows and is painted over by the attribution control at 1024px
`Completeness critic` · desktop · verdict CRITIC

**Designed:** Title and meta line stay legible across the designed desktop range (README:97 'content max 1040–1200px'); proto-desk-light.txt:`[272,14,385,22] ... TXT«Overview»` sits clear of the segmented control.

**Deployed:** At a 1024px viewport the title renders as 'Overvie' running underneath the opaque segmented track, and the meta line collapses to 'PostHo…'. `.nd-tb-t` is `min-width:0` with `margin-right:auto` and the `b` has no `overflow`/`text-overflow`, so the title box shrinks to zero and the text overflows under `.bucket-seg`, which has `flex:none` and an opaque `background:var(--nd-100)`.

**Evidence:** cap/live-tablet-1024.png (title reads 'Overvie' with 'Influencer | Perf | Overall' painted across it); index.html:2792 `html[data-theme="light"] .nd-tb-t{ display:flex; flex-direction:column; gap:1px; min-width:0; margin-right:auto; }`; index.html:2793 `.nd-tb-t b{ font-size:20px; ... }` (no overflow rule); index.html:2796-2797 `.nd-topbar .bucket-seg{ ... width:clamp(240px,24vw,330px); flex:none; ... background:var(--nd-100) !important; }`.

**Fix:** Add `white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0` to `.nd-tb-t b` (as `s` already has) so the title truncates inside its own box instead of sliding under the segmented control.

### Desktop KPI sub-lines are clipped at 1024px, so the Revenue tile loses its USD and payment count
`Completeness critic` · desktop · verdict CRITIC

**Designed:** README:108 — Revenue tile shows '₹ + $ + payment count'; Active Pro shows 'count + % of users'. Live at 1440 renders them in full (live-desk-light.txt `+ $308 · 103 payments`).

**Deployed:** `.ndc-kpi s` is `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`, and the KPI column is a fixed span-4 of the 12-column grid, so at 1024px all four sub-lines truncate: '+ $308 · 1…', '0.80% of …', '+194% vs…', '₹1,187 per…'. Three of the four designed sub-line facts become unreadable.

**Evidence:** cap/live-tablet-1024.png; index.html:2875-2876 `html[data-theme="light"] .ndc-kpi s{ ... white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }`; README.md:108.

**Fix:** Let the KPI sub-line wrap to two lines (or drop to a single-column KPI stack) below ~1200px instead of ellipsising the payload.

### Nothing re-renders when the viewport crosses the 600px / 961px switchover, leaving an unstyled screen
`Completeness critic` · both · verdict CRITIC

**Designed:** Crossing the phone/desktop switchover re-renders the Overview into the surface that now owns the viewport.

**Deployed:** `renderOverview()` picks its branch once, from `matchMedia` at call time, and there is no `resize` or `matchMedia` change listener anywhere in the file (the only `addEventListener` on a media query is for `prefers-color-scheme`). Resizing a desktop window down to phone width leaves the console DOM (`.ndc`, `.ndc-kpis`, `.ndc-bars`) in place, and every rule for those classes lives inside `@media (min-width:961px)`, so the screen renders with no card, grid or chart styling at all until a tab switch forces a re-render.

**Evidence:** index.html:7144-7145 `if (ndIsMobile()) { ndBuildHeader(); ... } if (ndIsDesk()) { ... renderOverviewConsole(); ... }`; `grep -n "addEventListener('resize'" index.html` → no matches (only index.html:6902 `matchMedia('(prefers-color-scheme: dark)').addEventListener`); the `.ndc*` rules are all inside the block opened at index.html:2682.

**Fix:** Register `matchMedia('(max-width:600px)')` and `matchMedia('(min-width:961px)')` change listeners that call `renderOverview()` (and rebuild the header/controls) when the active surface changes.

### All five ApexCharts surfaces hardcode light axis and grid colours with no dark override
`Completeness critic` · both · verdict CRITIC

**Designed:** README:52-62 — dark appearance remaps every surface via the theme root; axis labels should read against `--neutral-50` #090D18.

**Deployed:** Five chart configs set `foreColor:'rgba(10,10,10,.55)'` and `grid:{borderColor:'#ededea'}` unconditionally, while the same objects branch on `DK` for series colours and `tooltip.theme`. In dark appearance the axis labels and gridlines are near-black ink on the #090D18 canvas. The dark-token dimension's light↔dark field diff explicitly excluded SVG elements, and Apex renders its labels as SVG `<text>`, which is why this was missed.

**Evidence:** index.html:7405 `const AX={chart:{...foreColor:'rgba(10,10,10,.55)'...},grid:{borderColor:'#ededea',...},tooltip:{theme:DK?'dark':'light'}}`; the same pair at index.html:10854/10857, 11968/11979, 12410/12413 and 12757/12760; the dark-tokens dimension's own note: 'a full light↔dark field diff ... found no unchanged non-transparent colour, border or shadow on any non-SVG element'.

**Fix:** Drive `foreColor` and `grid.borderColor` from the appearance flag the configs already compute (`DK`), e.g. `foreColor: DK ? 'rgba(242,245,251,.55)' : 'rgba(15,28,61,.55)'` and `borderColor: DK ? '#242E46' : '#EEF1F8'`.

### Range picker rows are 34px non-focusable divs with no active tint, plus an undesigned eighth option
`Completeness critic` · both · verdict CRITIC

**Designed:** README:156 — '7 presets: Today, Yesterday, Last 7 days, Last 14 days, This month, Last month, All time; 52px rows, active row tinted `--action-50` with a check'; desktop a 240px popover.

**Deployed:** Rows are 34px tall, the active row has `background: rgba(0,0,0,0)` and only a colour/weight change (and its colour resolves to rgb(10,10,10), i.e. indistinguishable), an eighth 'Custom…' row plus three separators are added, and every row is a `<div>` with an `onclick` — not focusable or keyboard-operable. The popover itself is 180px wide with a 6px radius.

**Evidence:** cap/live-desk-rangeopen.json: `[1016,58,180,307] div ... borderRadius 6px`, rows `[1017,64,178,34] div.gdr-opt 'Today'` … `[1017,140,178,34] div.gdr-opt active 'Last 7 days' backgroundColor rgba(0,0,0,0) color rgb(10,10,10)`, plus `[1017,326,178,34] div.gdr-opt 'Custom…'` and three `div.gdr-sep`; index.html:813-816 `.gdr-opt { padding: 8px 14px; ... } .gdr-opt.active { color: var(--accent); font-weight: 600; } .gdr-opt.active::after { content: '✓'; ... }` — no background declaration.

**Fix:** Rebuild the picker as 52px `<button>` rows in a 240px popover (phone: the 32px-radius bottom sheet), tint the active row `--action-50`, and either drop 'Custom…' or get it added to the spec.

### "Add post data" overlay geometry was never audited and misses every spec value
`Completeness critic` · both · verdict CRITIC

**Designed:** README:159 — 'phone bottom sheet / desktop 520px centred modal. Fields: Date, Budget ₹, Views, Likes, Comments, Shares (44px, radius 12px)'; README:97 gives modals a 24px radius.

**Deployed:** One centred modal on both surfaces (no phone bottom sheet — the phone rule is just `.modal { margin: 0 14px; padding: 22px; }`), `max-width:560px` instead of 520px, radius `var(--radius-lg)` = 6px instead of 24px, and fields at `padding:10px 13px` (≈39px tall, under the 44px spec and the 44px phone hit-target minimum) with radius `var(--radius)` = 4px instead of 12px. The form also adds four undesigned fields (Creator, UTM code, Platform, Note) to the designed six.

**Evidence:** index.html:1005 `#creatorModal { max-width: 560px; ... }`; index.html:2516-2517 `html[data-theme="light"] :is(...,.modal,...){ ... border-radius:var(--radius-lg) !important; ... }` with index.html:2437 `--radius:4px; --radius-lg:6px;`; index.html:993-996 `.field-input { width:100%; padding:10px 13px; border:1px solid var(--border-strong); border-radius:8px; font-size:14px; ... }` overridden to `border-radius:var(--radius)` at index.html:2511-2512; index.html:1053 `.modal { margin: 0 14px; padding: 22px; }`; index.html:4721-4768 (ten fields).

**Fix:** Ship the designed overlay: 520px centred modal at 24px radius on desktop, a bottom sheet on phone, and 44px / 12px-radius fields; move Creator/Code/Platform out of the form when it is opened from a creator row.

### Three more phone controls sit under the 44px hit-target minimum, beyond the header icons already reported
`Completeness critic` · mobile · verdict CRITIC

**Designed:** README:46 — 'Hit targets: 44px minimum on phone (tab bar 50px), 40px on desktop.' The designed More rows are 52px (proto-mob-more.txt `[17,265,368,52] | button | ... TXT«Daily»`).

**Deployed:** Measured on the live phone captures: `button.settings-btn` is 31px tall, each `a.tab` row in the More drawer is 42px (against the designed 52px), and each `button.nd-see` ('See all ›') is 32×55px. Only the 42×42 header icon buttons were reported by the audit.

**Evidence:** cap/live-mob-light.json: `button.settings-btn` r=[…,209,31]; `a.tab` rows r=[18,134,237,42] etc.; `button.nd-see` r=[…,55,32] ×3. Designed row height: digest/proto-mob-more.txt `[17,265,368,52] | button | {"data-dc-tpl":"255"} | 15/600/normal/23.25px ... TXT«Daily»`.

**Fix:** Set `min-height:44px` on `.settings-btn`, `.nd-see` and the phone `.tab` rows (52px for the More list, per the prototype).

### Phone text drops below the 10px floor on the tab bar badge and the Creators KPI labels
`Completeness critic` · mobile · verdict CRITIC

**Designed:** README:46 — 'Minimum text size on phone: 10px (eyebrows only); all interactive labels ≥ 12px.'

**Deployed:** The phone tab bar carries a 9px/800 numeric badge inside an interactive tab item, and the phone Creators screen renders ten KPI/stat labels at 9.5px.

**Evidence:** cap/live-mob-search.json `[201,814,19,16] span.mob-nav-badge has-val | fontSize 9px | fontWeight 800 | bg rgb(41,82,255) | '56'` sitting inside `button.mob-nav-item`; index.html:1133 `.mob-nav-badge {` and index.html:11504 `<span class="mob-nav-badge" id="mbn-creators-badge"></span>`; cap/live-mob-creators.json: `span.stat-label` 9.5px ×6 ('Influencers', 'Total Referrals', 'Pro Conversions', 'Converting', 'Revenue', 'Avg Conversion') and `span.m-lbl` 9.5px ×4 ('Conv.', 'On Pro', 'Referrals', 'Revenue').

**Fix:** Raise the eyebrow/label floor to 10px (11px per the type scale) on phone and remove the tab-bar badge, which has no counterpart in the design.

### The phone tab bar gains a counter badge the design does not have
`Completeness critic` · mobile · verdict CRITIC

**Designed:** The designed phone tab bar is five icon+label items with no counters — proto-mob-more.txt ends with `TXT«Overview» TXT«Report» TXT«Creators» TXT«Search» TXT«More»` and no numeric node inside `[data-tabbar]` (digest/proto-mob-light.txt:365).

**Deployed:** A blue pill badge showing the creator count is absolutely positioned over the Creators tab icon. This is the phone twin of the sidebar `nav-badges-not-in-design` finding, which was scoped to the desktop nav rows only.

**Evidence:** cap/live-mob-more.json `[201,814,19,16] span.mob-nav-badge has-val | 9px/800 | rgb(255,255,255) on rgb(41,82,255) | '56'`; index.html:11504 `<span class="mob-nav-badge" id="mbn-creators-badge"></span>`; index.html:1133-1139 `.mob-nav-badge { ... } .mob-nav-badge.has-val { display: block; }`.

**Fix:** Remove `.mob-nav-badge` from the tab bar, as the desktop nav badges are being removed.

### The designed More screen's card anatomy was never compared — the drawer replaces it row for row
`Completeness critic` · mobile · verdict CRITIC

**Designed:** proto-mob-more.txt: a full-width scroll screen titled 'More' with two eyebrow-headed glass cards — `[16,233,370,25] span | 11/700/0.88px ... TXT«Overview»` over `[16,264,370,158] div[data-card] | rgba(255,255,255,.58) | r:24px`, rows `[17,265,368,52] button | 15/600` — listing Daily / Insights / Search, then a Growth card listing Acquire, Activate, Monetization, Retention, Referrals, Influencers, Pro Users.

**Deployed:** Tapping More slides a 274px drawer over whatever screen is showing (the header still reads 'Search'), with 42px `a.tab` rows at 14.5px/500-700, no group cards, no 24px glass surface, and eleven rows including the undesigned Lifecycle and Emails plus a duplicated primary group (Overview / Report / Creators / Search).

**Evidence:** digest/proto-mob-more.txt lines quoted above; cap/live-mob-more.json: `[57,12,63,22] b 'Search'` (header title), drawer rows `[18,89,237,42] a.tab 'Overview'` … `[18,670,237,42] a.tab tab-purple 'Pro Users'` with `[18,536,237,42] a.tab 'Lifecycle'` and `[18,581,237,42] a.tab 'Emails'`; index.html:2071 `.tab{ ... font-size:14.5px !important; ... }`.

**Fix:** Build More as a real fifth screen: its own header ('More' + team button), the two grouped 24px glass cards with 52px rows, and only the ten designed destinations.

### Revenue KPI merges USD into the ₹ figure and then also prints it separately
`Completeness critic` · both · verdict CRITIC

**Designed:** README:192 — 'INR and USD are kept separate everywhere and only combined for ARPU/ROAS at ₹84 per $1'. README:108 — the Revenue tile shows '₹ + $ + payment count'.

**Deployed:** `totalRevInr = Math.round(revInr + revUsd * USD_TO_INR)` is what the Revenue tile prints as its ₹ value, and the sub-line then appends `+ $... · n payments` — so the dollar revenue is folded into the rupee headline and also listed beside it, which is the one combination the spec forbids outside ARPU/ROAS. (Reported as a formula/behaviour deviation, not a data-value difference.)

**Evidence:** index.html:4812-4813 `// Combine native INR + USD revenue into one rupee figure` / `function inrTotal(inr, usd) { return '₹' + Math.round((inr||0) + (usd||0) * USD_TO_INR)...}`; index.html:6841-6843 `'<b>₹' + M.totalRevInr.toLocaleString('en-IN') + '</b><s>' + (M.revUsd > 0 ? '+ $' + ... + ' · ' : '') + ...`; README.md:192.

**Fix:** Print the native INR sum as the tile value and keep USD only in the sub-line; reserve the ₹84 conversion for the ARPU and ROAS derivations.

### --text-link / --text-brand #9DB2FF absent; links render as --action-500
`Dark appearance` · both · verdict CONFIRMED

**Designed:** README dark block: `--text-link:#9DB2FF; --text-brand:#9DB2FF;` — link/see-all affordances render #9DB2FF = rgb(157,178,255), as the prototype does.

**Deployed:** No --text-link or --text-brand token exists anywhere in index.html (grep count 0). `.nd-see` is hardcoded to `color:var(--nd-act-500)`, so every "See all" link renders #5C79FF = rgb(92,121,255) in dark. #9DB2FF appears on zero live elements.

**Evidence:** proto-desk-dark.txt:201 `| button | ... | rgb(157, 178, 255) | ... TXT«See all»` vs live-desk-dark.txt:251 `[575,511,55,32] | button.nd-see | | 13/600/normal/normal | rgb(92, 121, 255) | rgba(0, 0, 0, 0) | ... TXT«See all ›»` (same at lines 290, 334). Source: index.html:2882 `html[data-theme="light"] .nd-see{ ... color:var(--nd-act-500); ` and index.html:3124 (mobile, same).

**Fix:** Add `--nd-link:#9DB2FF` to the dark block (index.html:2937) and light block, and point `.nd-see` / `.nd-alerts` links and `--blue-text` at it.

### --text-success is #4BD69B, spec says #3ED08E
`Dark appearance` · both · verdict CONFIRMED

**Designed:** `--text-success:#3ED08E` = rgb(62,208,142).

**Deployed:** `--nd-ok-700:#4BD69B` / `--green-text:#4BD69B` → all positive-delta text renders rgb(75,214,155) (8 elements on desktop dark).

**Evidence:** index.html:2938 `--nd-ok-50:rgba(25,182,114,.14); --nd-ok-700:#4BD69B;` and index.html:2948 `--green-text:#4BD69B;`. Colour tally: live-desk-dark.txt has 8× `rgb(75, 214, 155)`; proto-desk-dark.txt has 28× `rgb(62, 208, 142)` (header `"--text-success":"#3ED08E"`).

**Fix:** Set `--nd-ok-700:#3ED08E` and `--green-text:#3ED08E` at index.html:2938 / 2948.

### Dark card shadow wrong (extra -20px spread, .6 alpha, no inset highlight); --shadow-* ramp never remapped
`Dark appearance` · both · verdict ADJUSTED

**Designed:** README line 77: dark card shadow `0 16px 40px rgba(0,0,0,.5)` with the glass inset top highlight the prototype renders (`rgba(255,255,255,0.1) 0 1px 0 inset`), plus the dark ramp `--shadow-xs/sm/xl` from README line 61 available as tokens.

**Deployed:** The dark block redefines no --shadow-* token and --shadow-xl does not exist (grep 0), but nothing renders a light-ink shadow in dark — live-desk-dark holds exactly one shadow value, `9 sh:rgba(0, 0, 0, 0.6) 0px 16px 40px -20px`, against the prototype's `10 sh:rgba(0, 0, 0, 0.5) 0px 16px 40px 0px, rgba(255, 255, 255, 0.1) 0px 1px 0px 0px inset`. So the visible deviation is the card shadow value plus the missing inset white top highlight; the unremapped token ramp is latent.

**Evidence:** index.html:2941 `--nd-sh:0 16px 40px -20px rgba(0,0,0,.6);` is the sole shadow line inside the dark block. Light definitions that survive: index.html:85-88 `--shadow-xs: 0 1px 1px rgba(16,24,40,0.05); --shadow-sm: 0 1px 3px rgba(16,24,40,0.07), 0 2px 6px rgba(16,24,40,0.05);`. `grep -c -- "--shadow-xl" index.html` → 0. Live dark shadow tally: only `9 sh:rgba(0, 0, 0, 0.6) 0px 16px 40px -20px`.

**Fix:** Add the three spec shadow values to the dark block at index.html:2941 and have --nd-sh reference --shadow-md/--shadow-lg rather than a one-off.

### Dark chrome painted opaque #131A2B instead of the spec's rgba(9,13,24,.6); --surface-glass token absent
`Dark appearance` · desktop · verdict ADJUSTED

**Designed:** `--surface-glass:rgba(19,26,43,.82)` driving translucent chrome; README dark equivalents put the header at `rgba(9,13,24,.6)` with blur.

**Deployed:** No --surface-glass token exists (grep 0). index.html:2955-2956 paints sidebar and topbar with opaque `var(--nd-0)`, so both render `rgb(19, 26, 43)` — lighter than the canvas — where the prototype's dark header is `rgba(9, 13, 24, 0.6)`. The absent blur is NOT dark-specific: live-desk-light and live-desk-dark both report 365 `bf:-` with no backdrop-filter at all, so that half belongs to the glass-theme dimension. rgba(19,26,43,.82) survives only as a literal on the mobile tab bar (index.html:2961).

**Evidence:** live-desk-dark.txt:173 `[248,0,1192,69] | header.nd-topbar | | ... | rgb(19, 26, 43) | r:0px | b:- | sh:- | p:14/24/14/24 | g:14 | bf:- |` vs proto-desk-dark.txt:90 `| div | {"data-dc-tpl":"48","data-header":""} | ... | rgba(9, 13, 24, 0.6) | ... | bf:blur(24px) saturate(1.6) |`. Source: index.html:2955-2956 `:is(.sidebar,.nd-topbar,.mobile-topbar){ background:var(--nd-0) !important; ...}`; the literal lives at index.html:2961 `.mob-bottom-nav{ background:rgba(19,26,43,.82) !important; ...}`.

**Fix:** Define `--nd-glass:rgba(19,26,43,.82)` (light: rgba(255,255,255,.86)) in the token blocks and drive .sidebar/.nd-topbar/.mob-bottom-nav from it instead of --nd-0 and the literal at 2961.

### --surface-scrim rgba(0,0,0,.55) absent; overlay keeps the light-mode ink scrim
`Dark appearance` · both · verdict CONFIRMED

**Designed:** `--surface-scrim:rgba(0,0,0,.55)` in dark, applied to the alerts/sheet overlay.

**Deployed:** No --surface-scrim token exists (grep count 0). The alerts overlay keeps `rgba(15,28,61,.28)` — the light-mode navy scrim at 28% — in dark, and there is no `[data-appearance="dark"] .nd-alerts-ov` rule anywhere.

**Evidence:** index.html:2970 `html[data-theme="light"] .nd-alerts-ov{ position:fixed; inset:0; z-index:400; background:rgba(15,28,61,.28);`. `grep -n 'data-appearance="dark"] .nd-alert' index.html` returns only index.html:2963 (`.nd-alert p`), so the overlay is never remapped.

**Fix:** Add `--nd-scrim` to both token blocks (light rgba(15,28,61,.28) / dark rgba(0,0,0,.55)) and use `background:var(--nd-scrim)` at index.html:2970.

### Mobile acquisition progress tracks stay light-ink and vanish on the dark canvas
`Dark appearance` · mobile · verdict CONFIRMED

**Designed:** Track should follow the remapped neutral ramp (desktop dark uses `background:var(--nd-100)` = #1A2236), staying visible against --neutral-50 #090D18.

**Deployed:** All five tracks keep `rgba(15, 28, 61, 0.06)` in dark — a 6%-alpha navy over a near-black canvas, so the unfilled portion of the bar is invisible.

**Evidence:** live-mob-dark.txt:251 `[48,-146,290,6] | div.nd-prog | | ... | rgb(242, 245, 251) | rgba(15, 28, 61, 0.06) | r:999px | b:- | sh:-` — bg identical to live-mob-light.txt:251 (same at lines 258, 265, 272, 279). Source: index.html:3146 `html[data-theme="light"] .nd-prog{ height:6px; border-radius:999px; background:rgba(15,28,61,.06); overflow:hidden; }` (the desktop counterpart at index.html:2889 correctly uses `var(--nd-100)`).

**Fix:** Change index.html:3146 to `background:var(--nd-100)` to match index.html:2889.

### Mobile recent-signup initial chips keep the light-ink fill in dark
`Dark appearance` · mobile · verdict CONFIRMED

**Designed:** Chip fill should follow the neutral ramp (desktop dark uses `background:var(--nd-100)` = #1A2236).

**Deployed:** Chips keep `rgba(15, 28, 61, 0.05)` in dark, so the circle behind the initials disappears against #090D18.

**Evidence:** live-mob-dark.txt:286 `[48,157,40,40] | span.nd-ini | | 13/600/-0.084px/normal | rgb(201, 209, 228) | rgba(15, 28, 61, 0.05) | r:50% | ... TXT«M»` — bg identical to live-mob-light.txt:286 (same at 294, 302, 310). Source: index.html:3127 `html[data-theme="light"] .nd-ini{ width:40px; height:40px; border-radius:50%; background:rgba(15,28,61,.05); color:var(--nd-700);` (desktop counterpart at index.html:2894 uses `var(--nd-100)`).

**Fix:** Change index.html:3127 to `background:var(--nd-100)` to match index.html:2894.

### Alerts panel close button, row rules and timestamps are hardcoded light values with no dark override
`Dark appearance` · both · verdict CONFIRMED

**Designed:** Panel chrome should follow the dark remap: close chip on --neutral-100 #1A2236 with --text-body #C9D1E1, row hairline on --border-subtle #242E46, timestamp on --text-subtle #737E98.

**Deployed:** The close button keeps `background:#EEF1F8; color:#3F4A66` (a pale grey chip with dark navy glyph), row separators keep `rgba(15,28,61,.06)` (invisible on dark), and timestamps keep `#A2A6B3` — none of these have a `[data-appearance="dark"]` override. The dark block only remaps `.nd-alerts`, `.nd-alerts-h` and `.nd-alert p`.

**Evidence:** index.html:2982-2983 `html[data-theme="light"] .nd-alerts-x{ ... background:#EEF1F8; color:#3F4A66; ...}`; index.html:2984 `.nd-alert{ ... border-top:1px solid rgba(15,28,61,.06); }`; index.html:2989 `.nd-alert s{ ... color:#A2A6B3; ...}`. Dark overrides present: only index.html:2962 `:is(.nd-alerts,.nd-alerts-h){ background:var(--nd-0) !important; color:var(--nd-900); }` and index.html:2963 `.nd-alert p{ color:var(--nd-700); }`.

**Fix:** Replace the literals at index.html:2982-2989 with var(--nd-100)/var(--nd-700)/var(--nd-hair)/var(--nd-400) so they inherit the dark remap.

### Recent signups rows show the plan badge instead of the acquisition source
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** The right-aligned column of each Recent signups row is the acquisition source (12px/600, var(--text-body)) above the relative time (11px/500, var(--text-subtle)) — e.g. "Google Ads" / "2m ago". README Overview §1 card 4: "36px initials avatar, name + email (both truncate), source + relative time right-aligned".

**Deployed:** The right-aligned column renders the plan label ("Free") at 12.5px/600 above the relative time at 11.5px/500. The source is never shown, so the whole Acquisition dimension is invisible in the list.

**Evidence:** proto-desk-light.txt: `[940,562,68,15] | span.sc-interp | 12/600/normal/18.6px | rgb(63, 74, 102) ... TXT«Google Ads»` / `[969,582,39,14] | 11/500 ... TXT«2m ago»`. live-desk-light.txt: `[966,566,26,17] | b | 12.5/600/-0.084px ... TXT«Free»` / `[970,585,22,16] | s | 11.5/500 ... TXT«now»`. index.html:6818 `'<span class="nd-rend"><b>' + esc(planLabel(r[2] || 'free')) + '</b><s>' + ndAgo(r[3]) + '</s></span></div>'`.

**Fix:** In the signupRows map (index.html:6816-6819) emit the channel/source for the row instead of planLabel(), and set the sizes to 12px/600 and 11px/500 to match the prototype.

### KPI tiles, list rows and "See all" navigate to other tabs instead of opening the 460px drill-down drawer
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** Each KPI tile opens its matching drill-down, each "See all" opens the Acquisition-sources / Recent-signups / Payments drill-down, and each signup row opens the person drill-down — on desktop a 460px right-hand drawer over a scrim with a close `x` + title + meta. README §1 card 2 ("Each tile is a button that opens the matching drill-down"), card 3 ("\"See all\" opens the sources drawer"), §6 ("Desktop: 460px right-hand drawer over a scrim"). Signup rows are buttons with radius 8px (README: "Radii: 8px rows").

**Deployed:** No desktop drill-down drawer exists in the implementation. KPI tiles call switchTab('revenue'|'pro'|'insights'), the three "See all" buttons call switchTab('acquire'|'search'|'revenue'), and Recent signups rows are plain non-interactive `<div class="ndc-row">` with no radius and no click handler.

**Evidence:** proto-desk-light.txt: `[680,553,329,52] | button | {"data-dc-tpl":"129","data-row":""} ... r:8px | b:1 rgb(238, 241, 248)`. live-desk-light.txt: `[688,557,304,52] | div.ndc-row | ... r:0px | b:1 rgb(238, 241, 248)`. index.html:6839-6853 (`onclick="switchTab('revenue')"` etc.), :6857-6858 (`<button class="nd-see" onclick="switchTab('acquire')">See all ›</button>`), :6865, :6867, :6816-6819 (rows emitted as `<div class="ndc-row">`).

**Fix:** Add a desktop right-hand drawer component (460px, scrim, close x + title + meta) and wire the KPI tiles, the three "See all" buttons and the signup rows to it instead of switchTab(); make the signup row a `<button>` with border-radius 8px.

### "Signed up & paid" KPI sub-line shows a percentage delta instead of "+{delta} vs {prior} prior period"
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** Sub-line text `(paid - prev >= 0 ? '+' : '') + (paid - prev) + ' vs ' + prev + ' prior period'` — an absolute count delta followed by the prior-period count, e.g. "+5 vs 19 prior period". README §1 card 2: "Signed up & paid (delta vs prior)".

**Deployed:** Sub-line reads "+194% vs prior period" — a percentage delta with the prior-period count dropped entirely, so the reader can no longer see what it is being compared against.

**Evidence:** DesktopOverview.dc.html:1175 `paidDeltaText: pp == null ? 'signed up and paid in window' : (paid - pp >= 0 ? '+' : '') + (paid - pp) + ' vs ' + pp + ' prior period'`; proto-desk-light.txt `[1066,371,115,15] | span.sc-interp | 12/500 ... TXT«+5 vs 19 prior period»`. live-desk-light.txt `[1050,362,123,16] | s.up | 12/500 ... TXT«+194% vs prior period»`. index.html:6851 `(M.swDelta >= 0 ? '+' : '') + M.swDelta.toFixed(0) + '% vs prior period'`.

**Fix:** Change index.html:6851 to emit `(+/-)(M.swCur - M.swPrev) + ' vs ' + M.swPrev + ' prior period'`, keeping the existing null fallback.

### All eight desktop Overview cards render in the flat fallback; the glass path exists but is mobile-only
`Desktop cards & tables` · desktop · verdict ADJUSTED

**Designed:** Glass is the default theme: cards `background rgba(255,255,255,.58)`, `border 1px solid rgba(255,255,255,.85)`, `border-radius 24px`, `box-shadow 0 12px 36px rgba(15,28,61,.08), inset 0 1px 0 rgba(255,255,255,.9)`, `backdrop-filter blur(24px) saturate(1.6)`. README "Liquid Glass theme": "Applied when theme=\"glass\" (the default)"; flat is only "a fallback for prefers-reduced-transparency or low-end devices".

**Deployed:** Every one of the eight `.ndc` cards on the desktop Overview (hero, 4 KPI tiles, Acquisition, Recent signups, Recent payments) is opaque white, radius 16px, border 1px #E6EAF3, shadow `0 1px 3px rgba(15,20,25,.06), 0 1px 2px rgba(15,20,25,.04)` (= --shadow-sm) with no backdrop-filter (live-desk-light.txt has zero `bf:blur` lines). The glass treatment is implemented only for the mobile `.nd-card` rules inside the `@media (max-width:600px)` block (index.html:3079-3082), which live-mob-light.txt shows rendering with `bf:blur(20px) saturate(1.5)` on 10 elements. Nothing in index.html tests `prefers-reduced-transparency`, so the desktop flat rendering is unconditional rather than a legitimate fallback.

**Evidence:** proto-desk-light.txt hero card: `[272,95,757,387] | div | {"data-card":""} ... rgba(255, 255, 255, 0.58) | r:24px | b:1 rgba(255, 255, 255, 0.85) | sh:rgba(15, 28, 61, 0.08) 0px 12px 36px 0px, rgba(255, 255, 255, 0.9) 0px 1px 0px 0px inset | bf:blur(24px) saturate(1.6)`. live-desk-light.txt: `[305,93,708,381] | div.ndc.nd-s8.ndc-hero | ... rgb(255, 255, 255) | r:16px | b:1 rgb(230, 234, 243) | sh:rgba(15, 20, 25, 0.06) 0px 1px 3px 0px, rgba(15, 20, 25, 0.04) 0px 1px 2px 0px | bf:-`. index.html:2838-2840 `.ndc{ background:var(--nd-0); border:1px solid var(--nd-edge); border-radius:16px; box-shadow:var(--nd-sh); }`.

**Fix:** Add a glass variant to the .ndc rule (index.html:2838) with the 24px radius, .58 white fill, .85 white hairline, 12/36 shadow + inset highlight and blur(24px) saturate(1.6), gated so the current flat values apply under prefers-reduced-transparency.

### Recent signups and Recent payments cards use uniform 20px padding + 14px gap instead of 12/20/8 with a padded header
`Desktop cards & tables` · desktop · verdict ADJUSTED

**Designed:** Both list cards: `padding: 12px 20px 8px`, no flex gap, with the header row carrying its own `padding: 6px 0 4px` so the first row sits tight under the title. (Acquisition, by contrast, is 20px padding with gap 14.)

**Deployed:** Both list cards inherit `.ndc-panel{ padding:20px; gap:14px }`, pushing the title 8px lower and the first row further down; card height grows from 324px to 404px for the same five rows.

**Evidence:** proto-desk-light.txt: `[659,498,371,324] | div | {"data-dc-tpl":"123","data-card":""} ... p:12/20/8/20 | g:normal` and header `[680,511,329,42] ... p:6/0/4/0`. live-desk-light.txt: `[667,490,346,404] | div.ndc.nd-s4.ndc-panel.ndc-list | ... p:20/20/20/20 | g:14`. index.html:2879 `.ndc-panel{ padding:20px; display:flex; flex-direction:column; gap:14px; }`.

**Fix:** Add `.ndc-panel.ndc-list{ padding:12px 20px 8px; gap:0 }` and `.ndc-list .ndc-ph{ padding:6px 0 4px }` after index.html:2879.

### Selected-bar pill tooltip is absent; replaced by a native title tooltip
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** When a bar is selected, a pill reading `{n} signups · {label}` appears — `background:var(--ink-900);color:var(--neutral-0);font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px` (DesktopOverview.dc.html:207, text built at :1167 `fmt(ser.v[st.bar]) + ' signups · ' + (ser.l[st.bar] || '')`). README:107 "a pill tooltip `{n} signups · {label}` appears".

**Deployed:** No pill element exists in the hero markup at all. Hover text is delegated to the browser's native `title` tooltip, which renders as an OS chrome tooltip with the raw date string (e.g. "2026-09-10 · 412 signups"), not the designed pill.

**Evidence:** index.html:6829-6838 (full hero innerHTML) contains only `ndc-hero-top`, `ndc-hnum`, `nd-badge`, `nd-prev`, `ndc-bars`, `ndc-xlbl` — no tooltip node; index.html:6807 `title="' + esc(b.d) + ' · ' + b.v...`

**Fix:** Add a `.ndc-tip` span inside `.ndc-hero-top` (right-aligned, as in the prototype) rendered only when a bar is selected, styled ink-900 / neutral-0 / 12px / 600 / 6px 12px / 999px, and drop the native `title`.

### Hero metric renders at weight 600 in IBM Plex Mono instead of 800 Plus Jakarta Sans
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** 48px / 800 / -0.03em, Plus Jakarta Sans (README:35 "Hero metric (desktop) | 48px / 800 / -0.03em"; README:28 "Single family: Plus Jakarta Sans"). Proto digest: `[297,143,127,48] | span | {"data-dc-tpl":"81"} | 48/800/-1.44px/48px`.

**Deployed:** 48px / 600 / -0.96px (-0.02em) in IBM Plex Mono. The correct rule at index.html:2851 (`font-size:48px; font-weight:800; letter-spacing:-.03em`) is defeated by an earlier `!important` block that matches the element's second class `stat-num`.

**Evidence:** index.html:2454-2455 `html[data-theme="light"] :is(.nb-kpi-v,.rev-kpi-num,.stat-num,...){ font-family:'IBM Plex Mono',ui-monospace,monospace !important; font-weight:600 !important; letter-spacing:-.02em !important; color:var(--text) !important; ... }` — live digest `[330,139,139,48] | span.ndc-big.stat-num |  | 48/600/-0.96px/48px`

**Fix:** Remove the `stat-num` class from the hero number (index.html:6833 `<span class="ndc-big stat-num">`), or add `!important` to the weight/tracking/family in the `.ndc-big` rule at 2851. Keep `font-variant-numeric:tabular-nums`.

### Hero metric colour is near-black #0A0A0A instead of ink #0F1C3D
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** var(--ink-900) / --text-heading = #0F1C3D (README:32 "Key values: ink `#0F1C3D`"). Proto digest: `[297,137,127,61] | span.sc-interp | 48/800/-1.44px/48px | rgb(15, 28, 61)`. The KPI tiles in the same live screen still use it correctly (`rgb(15, 28, 61)`).

**Deployed:** rgb(10, 10, 10) — the hero number is the only headline number on the screen not using the ink token, because `color:var(--text) !important` from the mono-override block wins over `.ndc-big{ color:var(--nd-900) }`.

**Evidence:** live digest `[330,139,139,48] | span.ndc-big.stat-num | 48/600/-0.96px/48px | rgb(10, 10, 10)` vs sibling KPI `[1050,133,123,25] | b | 23.04/800/-0.4608px/25.344px | rgb(15, 28, 61)`; cause at index.html:2455 `color:var(--text) !important`

**Fix:** Same fix as the typography override — drop `stat-num` from the hero span so `color:var(--nd-900)` (index.html:2851) applies.

### Bar border-radius is 6px 6px 2px 2px instead of the specified 8px 8px 4px 4px
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** `border-radius: 8px 8px 4px 4px` (README:107 "bars `border-radius 8px 8px 4px 4px`"; the prototype's glass override DesktopOverview.dc.html:52 `[data-glass="true"] [data-bar]{border-radius:8px 8px 4px 4px !important; ...}`). Proto digest: `[297,328,94,103] | span | {"data-bar":""} | ... | r:8px 8px 4px 4px`.

**Deployed:** `border-radius: 6px 6px 2px 2px` — the implementation copied the prototype's flat-fallback base value and never applied the glass override.

**Evidence:** index.html:2863 `html[data-theme="light"] .ndc-bars i{ display:block; width:100%; border-radius:6px 6px 2px 2px; background:var(--nd-act-500);` — live digest `[330,375,87,50] | i | ... | rgb(41, 82, 255) | r:6px 6px 2px 2px`

**Fix:** Change index.html:2863 to `border-radius:8px 8px 4px 4px`.

### Bar gap is hard-coded at 8px; the ≤8 / ≤16 / >16 step rule is not implemented
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** gap 8px for ≤8 bars, 4px for ≤16, 2px above (README:107 "gap 8px for ≤8 bars / 4px ≤16 / 2px above"). Prototype computes it: DesktopOverview.dc.html:1098 `const barGap = ser.v.length > 16 ? '2px' : ser.v.length > 8 ? '4px' : '8px';`, applied to both the chart (:210) and the x-label row (:217).

**Deployed:** A single literal `gap:8px` on `.ndc-bars`, and the same literal on `.ndc-xlbl`. The hero renders up to 14 bars (`M.growth.slice(-14)`), so every range longer than 8 days draws at 8px where the design calls for 4px. Correct today only because the captured range is 7 days.

**Evidence:** index.html:2858 `html[data-theme="light"] .ndc-bars{ height:220px; display:flex; align-items:flex-end; gap:8px; border-bottom:1px solid var(--nd-100); }` and index.html:2865 `.ndc-xlbl{ display:flex; gap:8px; margin-top:8px; }`; bar count at index.html:6805 `const bars = M.growth.slice(-14);`

**Fix:** Compute the gap from `bars.length` (>16 → 2px, >8 → 4px, else 8px) and set it as an inline style on both `.ndc-bars` and `.ndc-xlbl`, mirroring DesktopOverview.dc.html:1098.

### Hero card is an opaque flat card (16px, hairline shadow) rather than the 24px glass card
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** Glass card: `background rgba(255,255,255,.58)`, `border 1px solid rgba(255,255,255,.85)`, `border-radius 24px`, `box-shadow 0 12px 36px rgba(15,28,61,.08), inset 0 1px 0 rgba(255,255,255,.9)`, `backdrop-filter blur(24px) saturate(1.6)` (README:68). Proto digest: `[272,95,757,387] | div | {"data-card":""} | ... | rgba(255, 255, 255, 0.58) | r:24px | b:1 rgba(255, 255, 255, 0.85) | sh:rgba(15, 28, 61, 0.08) 0px 12px 36px 0px, rgba(255, 255, 255, 0.9) 0px 1px 0px 0px inset | ... | bf:blur(24px) saturate(1.6)`.

**Deployed:** Opaque `rgb(255,255,255)`, `border-radius:16px`, border `rgb(230,234,243)`, shadow `0 1px 3px rgba(15,20,25,.06), 0 1px 2px rgba(15,20,25,.04)`, and `backdrop-filter` absent. This is README's `theme="flat"` fallback, shipped as the default.

**Evidence:** live digest `[305,93,708,381] | div.ndc.nd-s8.ndc-hero |  | ... | rgb(255, 255, 255) | r:16px | b:1 rgb(230, 234, 243) | sh:rgba(15, 20, 25, 0.06) 0px 1px 3px 0px, rgba(15, 20, 25, 0.04) 0px 1px 2px 0px | p:24/24/24/24 | g:18 | bf:-`; source index.html:2838 `background:var(--nd-0); border:1px solid var(--nd-edge); border-radius:16px; box-shadow:var(--nd-sh);`

**Fix:** Give `.ndc` the glass values from README:68 (radius 24px, .58 white, .85 white border, 12/36 shadow + inset hairline, blur(24px) saturate(1.6)), keeping the current values behind `prefers-reduced-transparency` as the flat fallback.

### Three counter badges added to nav rows that the design has none of
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** No badges or counters anywhere in the sidebar nav. Every prototype nav row is icon + label only, e.g. `[12,202,223,40] | button | {"data-dc-tpl":"29","data-nav":"","data-on":"false"}` followed only by the icon span and `TXT«Creators»`; README.md §5 describes the nav purely as two groups of named items.

**Deployed:** Three badges render: Creators `[205,218,20,16] | span.tab-badge | {"id":"inflTabBadge"} | 10.5/600/-0.21px/normal | rgb(112, 119, 139) | rgb(238, 241, 248) | r:4px | ... | TXT«—»`, Monetization `[181,529,44,16] | span.tab-badge | {"id":"revTabBadge"} | ... | TXT«₹1.2L»`, Pro Users `[193,758,32,16] | span.tab-badge | {"id":"proTabBadge"} | ... | TXT«279»`. The Creators badge is also stuck on the unresolved placeholder "—", and all three render as 4px-radius rectangles rather than pills because index.html:2494 sets `border-radius:4px !important` and overrides the 999px at index.html:2771.

**Evidence:** live-desk-light.txt: `[205,218,20,16] | span.tab-badge | {"id":"inflTabBadge"} | 10.5/600/-0.21px/normal | rgb(112, 119, 139) | rgb(238, 241, 248) | r:4px | ... | TXT«—»` — no `tab-badge` equivalent exists anywhere in proto-desk-light.txt | markup at index.html:3252, 3277, 3296

**Fix:** Remove the three `<span class="tab-badge">` elements (index.html:3252, 3277, 3296), or hide them in the light-theme console block, so nav rows are icon + label only as in the prototype.

### Team button is missing its chevrons-up-down affordance
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** A 14x14 chevrons-up-down glyph pinned at the right edge of the 44px team row: `[211,77,14,14] | span | {"data-icon":"chevrons-up-down"} | ... | rgb(162, 166, 179)`, with the text block limited to 143px (`[58,65,143,37]`).

**Deployed:** No chevron element exists; the text block stretches into the space instead: `[58,72,167,32] | span.tx`. The injected markup is `'<span class="av">GR</span><span class="tx"><b>Growth</b><s id="ndTeamSub">Team · Overall bucket</s></span>'` — no icon node.

**Evidence:** proto-desk-light.txt: `[211,77,14,14] | span | {"data-icon":"chevrons-up-down"} | 16/400/normal/24.8px | rgb(162, 166, 179)` | index.html:6739 (team innerHTML has only `.av` and `.tx`)

**Fix:** Append a 14x14 chevrons-up-down icon in `--nd-400` to the `.nd-team` innerHTML at index.html:6739 and let `.tx` keep `flex:1`.

### Third nav group "Users" added; Pro Users pulled out of Growth
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Two groups only. README.md §5: "Two groups: **Overview** (Daily, Insights, Search) and **Growth** (Acquire, Activate, Monetization, Retention, Referrals, Influencers, Pro Users)." In the prototype Pro Users is the last row of the Growth group: `[12,634,223,36] | button | ... TXT«Pro Users»` inside `[12,415,223,255] | div | {"data-dc-tpl":"33"}`.

**Deployed:** A third group with its own heading exists: `[12,721,223,25] | div.nav-label | 11/700/0.88px/normal | rgb(112, 119, 139) | ... | TXT«Users»`, containing only `[12,748,223,36] | a.tab.tab-purple | {"id":"tab-pro"} | ... | TXT«Pro Users»`.

**Evidence:** live-desk-light.txt: `[12,721,223,25] | div.nav-label | ... | TXT«Users»` | README.md §5 "Two groups: **Overview** ... and **Growth** (Acquire, Activate, Monetization, Retention, Referrals, Influencers, Pro Users)." | index.html:3293

**Fix:** Delete the "Users" `nav-label` and its wrapper (index.html:3293) and move the `tab-pro` row to the end of the Growth group.

### Icon-to-label gap in nav rows collapses to 0px
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** 10px between icon and label in every nav row — prototype primary row `[12,118,223,40] | button | ... | g:10` with the icon at `[22,129,18,18]` and the label starting at x=50; the design system sets `--gap-inline:8px; /* icon to label */`.

**Deployed:** Every live nav row computes `g:0` — `[12,122,223,40] | a.tab.active | {"id":"tab-overview"} | ... | p:0/10/0/10 | g:0` — so only the collapsed markup whitespace (~4px) separates the 17px icon from the label. Visible in live-desk-light.png: the star glyph touches "Pro Users" and the grid glyph touches "Overview".

**Evidence:** live-desk-light.txt: `[12,122,223,40] | a.tab.active | {"id":"tab-overview"} | 14/600/-0.084px/normal | ... | r:12px | ... | p:0/10/0/10 | g:0` | cause: index.html:2180 `.tab{ ... gap:0 !important; ... }` is never re-declared with `!important`, so it beats the `gap:10px` at index.html:2760 | design system tokens/spacing.css:18 `--gap-inline:8px;  /* icon to label */`

**Fix:** Add `!important` to `gap:10px` in the light-theme `.tab` rule (index.html:2760), or drop the stale icon-rail `gap:0 !important` at index.html:2180.

### Active nav row is a flat blue-tint fill with a near-black label, not the white glass pill
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** `[12,118,223,40] | button | {"data-dc-tpl":"29","data-nav":"","data-on":"true"} | 14/600/normal/21.7px | rgb(27, 63, 224) | rgba(255, 255, 255, 0.8) | r:12px | b:- | sh:rgba(15, 28, 61, 0.08) 0px 4px 14px 0px, rgb(255, 255, 255) 0px 1px 0px 0px inset` — translucent white pill, soft lift shadow, label and icon in --action-600 #1B3FE0.

**Deployed:** `[12,122,223,40] | a.tab.active | {"id":"tab-overview"} | 14/600/-0.084px/normal | rgb(10, 10, 10) | rgb(238, 243, 255) | r:12px | b:1 rgba(0, 0, 0, 0) | sh:-` — opaque #EEF3FF tint, no shadow, label #0A0A0A, and the icon is #0065F4 (`[23,134,17,17] | svg | ... | rgb(0, 101, 244)`) instead of #1B3FE0. The intended handoff rule (index.html:2766-2768, `--nd-act-50` + `--nd-act-600`) is outranked by an older "reference style" rule.

**Evidence:** live-desk-light.txt: `[12,122,223,40] | a.tab.active | ... | rgb(10, 10, 10) | rgb(238, 243, 255) | r:12px | ... | sh:-` | index.html:2578-2580 `html[data-theme="light"] :is(.tab.active,.tab[class*="tab-"].active){ background:var(--blue-soft) !important; color:var(--text) !important; ... }` (specificity 0,4,1 beats the 0,3,1 handoff rule at index.html:2766)

**Fix:** Delete or re-scope the `:is(.tab.active,...)` override at index.html:2578-2580 so the handoff rule wins, and change it to the glass pill: `background:rgba(255,255,255,.8); box-shadow:0 4px 14px rgba(15,28,61,.08), inset 0 1px 0 #fff; color:#1B3FE0` with the icon inheriting.

### Sidebar has no backdrop blur; glass treatment is fully disabled
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** README.md "Liquid Glass theme": "Desktop sidebar: `rgba(255,255,255,.42)` + `blur(24px)`". The prototype aside keeps the blur: `[0,0,248,1188] | aside | {"data-dc-tpl":"13","data-side":""} | ... | rgb(255, 255, 255) | ... | bf:blur(24px) saturate(1.6)`.

**Deployed:** `[0,0,248,900] | aside.sidebar | ... | rgb(255, 255, 255) | r:0px | b:- | sh:- | p:0/0/0/0 | g:normal | bf:- | an:-` — opaque white with `backdrop-filter` explicitly killed. Same in dark: `[0,0,248,900] | aside.sidebar | ... | rgb(19, 26, 43) | ... | bf:-`.

**Evidence:** live-desk-light.txt: `[0,0,248,900] | aside.sidebar | ... | rgb(255, 255, 255) | ... | bf:- | an:-` | index.html:2703-2708 `html[data-theme="light"] .sidebar{ ... background:var(--nd-0) !important; ... backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }` | README.md: "Desktop sidebar: `rgba(255,255,255,.42)` + `blur(24px)`"

**Fix:** In index.html:2708 replace `background:var(--nd-0) !important; backdrop-filter:none !important` with `background:rgba(255,255,255,.42) !important; backdrop-filter:blur(24px) saturate(1.6) !important` (dark: `rgba(9,13,24,.5)`), keeping `theme="flat"`/reduced-transparency as the opaque fallback.

### Settings row is shrunk and centred instead of filling the footer width
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** `[12,1136,223,40] | button | {"data-dc-tpl":"43","data-nav":""} | 13.5/600/normal/20.925px | ... | r:12px | p:0/10/0/10 | g:10` — full 223px content width, left-aligned at x=12, with "PostHog key set" pushed to the right edge at `[139,1147,86,17]`.

**Deployed:** `[25,848,198,40] | button.settings-btn | 13.5/600/normal/normal | rgb(63, 74, 102) | rgba(0, 0, 0, 0) | r:12px | ... | p:0/10/0/10 | g:10` — 198px wide, centred at x=25, so the row is inset 13px from the nav rows above it and the key-state text sits at `[127,861,85,15]` instead of hard right.

**Evidence:** live-desk-light.txt: `[25,848,198,40] | button.settings-btn | ... | p:0/10/0/10 | g:10` vs proto-desk-light.txt: `[12,1136,223,40] | button | {"data-dc-tpl":"43","data-nav":""}` | cause: index.html:2783 `html[data-theme="light"] .settings-btn{ width:auto !important; ... }` cancels the `width:100%` at index.html:2781, with `align-items:center` inherited from index.html:180

**Fix:** Drop `width:auto !important` at index.html:2783 and add `align-items:stretch` to the light-theme `.sidebar-footer` (index.html:2775-2777).

### Appearance switch has no sun / moon / monitor-smartphone icons
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Each segment is icon + label with a 6px gap: `[16,1088,72,34] | button | {"data-dc-tpl":"41"} | 12/600/normal/18.6px | ... | g:6` with `[27,1098,14,14] | span | {"data-icon":"sun"}`, then `{"data-icon":"moon"}` at `[100,1098,14,14]` and `{"data-icon":"monitor-smartphone"}` at `[171,1098,14,14]`.

**Deployed:** Label-only buttons: `[79,803,29,34] | button.nd-mode.on | {"data-mode":"light"} | 12/600/normal/normal | ... | TXT«Light»` with no child icon node in the digest and none in the markup (`<button class="nd-mode" data-mode="light" onclick="ndSetAppearance('light')">Light</button>`).

**Evidence:** proto-desk-light.txt: `[27,1098,14,14] | span | {"data-icon":"sun"} | 12/600/normal/18.6px` | index.html:3302-3304 (three `.nd-mode` buttons containing text only)

**Fix:** Add the sun / moon / monitor-smartphone 14px glyphs before each label in index.html:3302-3304 and set `gap:6px` on `.nd-mode` (index.html:2924).

### Appearance switch track and thumb drop the glass segmented-control styling
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Track `rgba(15, 28, 61, 0.06)` with `b:1 rgba(255, 255, 255, 0.7)`, `sh:rgba(15, 28, 61, 0.1) 0px 1px 3px 0px inset, rgba(255, 255, 255, 0.8) 0px 1px 0px 0px` and `bf:blur(16px) saturate(1.5)`; thumb a gradient pill with `b:1 rgba(255, 255, 255, 0.95)`, `sh:rgba(15, 28, 61, 0.14) 0px 6px 18px 0px, ...` and `bf:blur(20px) saturate(1.8)` — matching README "Segmented control: track `rgba(15,28,61,.06)` inset well; thumb `linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55))`, `blur(20px) saturate(1.8)`, `0 6px 18px rgba(15,28,61,.14)`".

**Deployed:** `[76,800,94,40] | div.nd-modes | ... | rgb(238, 241, 248) | r:999px | b:- | sh:- | p:3/3/3/3 | g:normal | bf:-` — opaque #EEF1F8 track, no border, no inset well, no blur; the thumb is a `::before` pseudo with flat `background:var(--nd-0)` and `box-shadow:0 1px 3px rgba(15,20,25,.08)`, no gradient, border or blur.

**Evidence:** proto-desk-light.txt: `[12,1084,223,42] | div | {"data-dc-tpl":"38","data-seg":""} | ... | rgba(15, 28, 61, 0.06) | r:999px | b:1 rgba(255, 255, 255, 0.7) | sh:rgba(15, 28, 61, 0.1) 0px 1px 3px 0px inset, rgba(255, 255, 255, 0.8) 0px 1px 0px 0px | p:3/3/3/3 | ... | bf:blur(16px) saturate(1.5)` | index.html:2918-2923

**Fix:** Restyle `.nd-modes` / `.nd-modes::before` (index.html:2918-2923) to the handoff segmented-control spec: track `rgba(15,28,61,.06)` + 1px `rgba(255,255,255,.7)` + inset well + `blur(16px) saturate(1.5)`; thumb gradient + `blur(20px) saturate(1.8)` + `0 6px 18px rgba(15,28,61,.14)`.

### Group nav rows gained icons the design does not have
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Rows inside the Overview and Growth groups are text-only, label flush at the 10px row padding: `[12,327,223,36] | button | {"data-dc-tpl":"36","data-nav":"","data-on":"false"} | 13.5/500/normal/20.925px | ... | r:10px | p:0/10/0/10 | g:normal` immediately followed by `[22,335,32,21] | span.sc-interp | ... | TXT«Daily»` — no icon node, label at x=22.

**Deployed:** Every group row carries a 17px icon: `[12,329,223,36] | a.tab | {"id":"tab-daily"} | ... | TXT«Daily»` followed by `[22,338,17,17] | svg`, so the label is indented behind an icon column. Confirmed against the prototype screenshot, where Daily / Insights / Acquire / Activate / Monetization / Retention / Referrals / Pro Users are plain text.

**Evidence:** proto-desk-light.txt: `[12,327,223,36] | button | {"data-dc-tpl":"36","data-nav":"","data-on":"false"} | 13.5/500/normal/20.925px | rgb(63, 74, 102) | rgba(0, 0, 0, 0) | r:10px | b:- | sh:- | p:0/10/0/10 | g:normal` then `[22,335,32,21] | span.sc-interp | ... | TXT«Daily»` | live-desk-light.txt: `[22,338,17,17] | svg` inside `a.tab#tab-daily`

**Fix:** Hide `.ic-sm` inside `.nav-group:not(.nd-primary) .tab` in the light-theme console block so only the four primary rows keep icons.

### Topbar is an opaque white bar instead of the blurred glass header
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Header background rgba(255,255,255,.55) with backdrop-filter blur(24px) saturate(1.6) (dark: rgba(9,13,24,.6))

**Deployed:** Header background solid #FFFFFF with no backdrop-filter at all (dark: solid rgb(19,26,43))

**Evidence:** README.md:79 "Header: `rgba(255,255,255,.55)` + `blur(24px) saturate(1.6)`, hairline `rgba(255,255,255,.8)`." | proto-desk-light.txt: `[248,0,1192,71] | div | {"data-dc-tpl":"48","data-header":""} | ... | rgba(255, 255, 255, 0.55) | r:0px | b:- | sh:- | p:14/24/14/24 | g:14 | bf:blur(24px) saturate(1.6)` | live-desk-light.txt: `[248,0,1192,69] | header.nd-topbar | ... | rgb(255, 255, 255) | r:0px | b:- | sh:- | p:14/24/14/24 | g:14 | bf:-` | index.html:2790-2791 `background:var(--nd-0); border-bottom:1px solid var(--nd-edge);` — no backdrop-filter

**Fix:** Add `background:rgba(255,255,255,.55); backdrop-filter:blur(24px) saturate(1.6); -webkit-backdrop-filter:blur(24px) saturate(1.6);` to `.nd-topbar` (index.html:2789-2791), with the dark override `rgba(9,13,24,.6)`.

### Topbar hairline is a grey border instead of the white glass hairline
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** border-bottom 1px solid rgba(255,255,255,.8)

**Deployed:** border-bottom 1px solid var(--nd-edge) = #E6EAF3 (an opaque grey; also differs from the flat-base token --border-subtle #E3E7F0)

**Evidence:** README.md:79 "...hairline `rgba(255,255,255,.8)`" | DesktopOverview.dc.html:41 `[data-glass="true"] [data-header]{...border-bottom:1px solid rgba(255,255,255,.8) !important;...}` | index.html:2791 `border-bottom:1px solid var(--nd-edge);` with index.html:2690 `--nd-edge:#E6EAF3;`

**Fix:** Set the topbar's border-bottom to rgba(255,255,255,.8) in light glass mode (rgba(255,255,255,.08) in dark), not --nd-edge.

### Attribution segmented track uses an opaque grey fill, not the rgba(15,28,61,.06) inset well
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Track background rgba(15,28,61,.06), border 1px rgba(255,255,255,.7), box-shadow inset 0 1px 3px rgba(15,28,61,.10) + 0 1px 0 rgba(255,255,255,.8), backdrop-filter blur(16px) saturate(1.5)

**Deployed:** Track background solid #EEF1F8 (--nd-100), border:none, no box-shadow, no backdrop-filter

**Evidence:** README.md:74 "Segmented control: track `rgba(15,28,61,.06)` inset well; ..." | proto-desk-light.txt: `[671,14,330,42] | div | {"data-dc-tpl":"52","data-seg":""} | ... | rgba(15, 28, 61, 0.06) | r:999px | b:1 rgba(255, 255, 255, 0.7) | sh:rgba(15, 28, 61, 0.1) 0px 1px 3px 0px inset, rgba(255, 255, 255, 0.8) 0px 1px 0px 0px | p:3/3/3/3 | g:normal | bf:blur(16px) saturate(1.5)` | live-desk-light.txt: `[674,14,330,40] | div.bucket-seg | {"id":"bucketSeg","aria-label":"Attribution view"} | ... | rgb(238, 241, 248) | r:999px | b:- | sh:- | p:3/3/3/3 | g:2 | bf:-` | index.html:2799 `background:var(--nd-100) !important; border:none !important;`

**Fix:** In index.html:2796-2799 set `background:rgba(15,28,61,.06)!important; border:1px solid rgba(255,255,255,.7)!important; box-shadow:inset 0 1px 3px rgba(15,28,61,.10),0 1px 0 rgba(255,255,255,.8); backdrop-filter:blur(16px) saturate(1.5);`

### Segmented thumb is a plain white pill — no gradient, no blur, wrong shadow, no ::after top-edge highlight
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Thumb background linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55)); border 1px rgba(255,255,255,.95); backdrop-filter blur(20px) saturate(1.8); box-shadow 0 6px 18px rgba(15,28,61,.14), 0 1px 2px rgba(15,28,61,.08), inset 0 1px 0 #fff, inset 0 -1px 0 rgba(15,28,61,.06); plus a ::after top-edge highlight (left/right 10%, top 2px, height 45%, linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,0)))

**Deployed:** `.bucket-seg::before` is background:var(--nd-0) (solid #FFFFFF) with box-shadow:var(--nd-sh) = 0 1px 3px rgba(15,20,25,.06),0 1px 2px rgba(15,20,25,.04); no border, no backdrop-filter, and no ::after highlight rule exists

**Evidence:** README.md:74 "thumb `linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55))`, `blur(20px) saturate(1.8)`, `0 6px 18px rgba(15,28,61,.14)`, top-edge highlight via `::after`." | proto-desk-light.txt: `[889,18,107,34] | span | {"data-dc-tpl":"53","data-thumb":""} | ... | rgba(0, 0, 0, 0)+IMG | r:999px | b:1 rgba(255, 255, 255, 0.95) | sh:rgba(15, 28, 61, 0.14) 0px 6px 18px 0px, rgba(15, 28, 61, 0.08) 0px 1px 2px 0px, rgb(255, 255, 255) 0px 1px 0px 0px inset, rgba(15, 28, 61, 0.06) 0px -1px 0px 0px inset | bf:blur(20px) saturate(1.8)` | index.html:2800-2802 `.nd-topbar .bucket-seg::before{ ... background:var(--nd-0); box-shadow:var(--nd-sh); ... }` | index.html:2691 `--nd-sh:0 1px 3px rgba(15,20,25,.06),0 1px 2px rgba(15,20,25,.04);`

**Fix:** Give `.nd-topbar .bucket-seg::before` the gradient background, 1px rgba(255,255,255,.95) border, blur(20px) saturate(1.8) backdrop-filter and the 4-layer shadow, and add the `::after` top-edge highlight to the thumb.

### Range pill is opaque white with a grey border instead of the glass pill
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** background rgba(255,255,255,.7); border 1px rgba(255,255,255,.9); box-shadow 0 4px 14px rgba(15,28,61,.08), inset 0 1px 0 #fff; backdrop-filter blur(16px)

**Deployed:** background #FFFFFF (--nd-0); border 1px #E3E7F0 (--nd-200); box-shadow 0 1px 3px rgba(15,20,25,.06),0 1px 2px rgba(15,20,25,.04); no backdrop-filter

**Evidence:** DesktopOverview.dc.html:50 `[data-glass="true"] [data-pill]{background:rgba(255,255,255,.7) !important;border:1px solid rgba(255,255,255,.9) !important;backdrop-filter:blur(16px);...box-shadow:0 4px 14px rgba(15,28,61,.08),inset 0 1px 0 #fff !important;}` | proto-desk-light.txt: `[1015,15,144,40] | button | {"data-dc-tpl":"56","data-pill":""} | 13/600/... | rgba(255, 255, 255, 0.7) | r:999px | b:1 rgba(255, 255, 255, 0.9) | sh:rgba(15, 28, 61, 0.08) 0px 4px 14px 0px, rgb(255, 255, 255) 0px 1px 0px 0px inset | p:0/14/0/14 | g:8 | bf:blur(16px)` | live-desk-light.txt: `[1018,14,140,40] | button.gdr-btn | {"id":"gdrTabBtn-overview"} | 13.5/600/... | rgb(255, 255, 255) | r:999px | b:1 rgb(227, 231, 240) | sh:rgba(15, 20, 25, 0.06) 0px 1px 3px 0px, rgba(15, 20, 25, 0.04) 0px 1px 2px 0px | p:0/14/0/14 | g:8 | bf:-` | index.html:2807-2810

**Fix:** In index.html:2807-2810 replace the pill's background/border/shadow with rgba(255,255,255,.7) / 1px rgba(255,255,255,.9) / `0 4px 14px rgba(15,28,61,.08), inset 0 1px 0 #fff` and add backdrop-filter:blur(16px).

### Live badge renders with the dark-mode green tint in light mode, and loses its border
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Light mode: background #FFFFFF, border 1px #E3E7F0, radius 999px, text #12945B. The green tint rgba(25,182,114,.14) with a rgba(25,182,114,.3) border is the DARK-mode treatment only.

**Deployed:** Light mode: background #EDFAF3 (--nd-ok-50) with no border at all; dark mode keeps the tint but still has no border

**Evidence:** proto-desk-light.txt: `[1173,23,85,24] | span | {"data-live":""} | 13/600/normal/16.9px | rgb(18, 148, 91) | rgb(255, 255, 255) | r:999px | b:1 rgb(227, 231, 240) | sh:- | p:0/10/0/10 | g:6` | DesktopOverview.dc.html:83 `[data-mode="dark"] [data-live]{background:rgba(25,182,114,.14) !important;border-color:rgba(25,182,114,.3) !important}` | live-desk-light.txt: `[1171,21,89,26] | span.nd-live | {"id":"ndDeskLive"} | 12.5/600/-0.084px/normal | rgb(18, 148, 91) | rgb(237, 250, 243) | r:999px | b:- | sh:- | p:0/11/0/11 | g:6 | ... TXT«Live · 12m»` | index.html:2811-2812 `background:var(--nd-ok-50); color:var(--nd-ok-700);`

**Fix:** In index.html:2811-2812 (and the duplicate at 3055-3056) set the light-mode badge to `background:var(--nd-0); border:1px solid var(--nd-200);` and move the rgba(25,182,114,.14) fill + rgba(25,182,114,.3) border into the dark-appearance override only.

### Refresh and bell are bordered white circles; the design has borderless 12px-radius ghost buttons
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** 40x40 button, border-radius 12px, transparent background, no border, icon in --text-body #3F4A66

**Deployed:** 40x40 button, border-radius 999px (full circle), background #FFFFFF, border 1px #E3E7F0

**Evidence:** proto-desk-light.txt: `[1272,15,40,40] | button | {"data-dc-tpl":"63","data-nav":"","aria-label":"Refresh data"} | ... | rgba(0, 0, 0, 0) | r:12px | b:- | sh:-` and `[1326,15,40,40] | button | {"data-dc-tpl":"66","data-nav":""} | ... | rgba(0, 0, 0, 0) | r:12px | b:- | sh:-` | live-desk-light.txt: `[1274,14,40,40] | button.nd-tb-ico | {"id":"ndDeskRefresh","aria-label":"Refresh data"} | ... | rgb(255, 255, 255) | r:999px | b:1 rgb(227, 231, 240)` and `[1328,14,40,40] | button.nd-tb-ico.dot | {"id":"ndDeskBell","aria-label":"Alerts"} | ... | rgb(255, 255, 255) | r:999px | b:1 rgb(227, 231, 240)` | index.html:2816-2818 `border-radius:999px; border:1px solid var(--nd-200); background:var(--nd-0);`

**Fix:** In index.html:2816-2818 change `.nd-tb-ico` to `border-radius:12px; border:0; background:transparent;` and move the hover affordance to a tinted background rather than a border colour change.

### Range pill calendar and chevron icons are much smaller than designed
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** calendar icon 15px, chevron-down icon 14px

**Deployed:** calendar svg 12px (`.gdr-btn .ic-sm{width:12px;height:12px}`), chevron 11px (`.gdr-btn .gdr-chevron{width:11px;height:11px}`)

**Evidence:** DesktopOverview.dc.html:171-173 `Icon name="calendar" size="{{ 15 }}"` ... `Icon name="chevron-down" size="{{ 14 }}"` | proto-desk-light.txt: `[1030,28,15,15] | span | {"data-icon":"calendar"}` and `[1130,28,14,14] | span | {"data-icon":"chevron-down"}` | live-desk-light.txt: `[1033,28,12,12] | svg |` and `[1131,29,11,11] | svg |` | index.html:809,811

**Fix:** Add a `.nd-topbar .gdr-btn .ic-sm{width:15px;height:15px}` / `.nd-topbar .gdr-btn .gdr-chevron{width:14px;height:14px}` override alongside index.html:2807-2810.

### Light tints are the wrong size, position and alpha
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Blue tint `rgba(41,82,255,.18)`, 320px, at left −120px / top 120px; green tint `rgba(25,182,114,.14)`, 300px, at right −110px / bottom 60px.

**Deployed:** Blue is `rgba(41,82,255,.10)` at `420px 320px` positioned `-10% 18%`; green is `rgba(25,182,114,.10)` at `380px 300px` positioned `108% 82%`. Both alphas are under-specified (.10 vs .18 and .10 vs .14), both are ellipses rather than the specified circles, and the anchors are percentage-based rather than the specified pixel offsets.

**Evidence:** index.html:3019-3020 `radial-gradient(420px 320px at -10% 18%, rgba(41,82,255,.10), transparent 70%), radial-gradient(380px 300px at 108% 82%, rgba(25,182,114,.10), transparent 70%)` — README: "action blue rgba(41,82,255,.18) 320px at left −120px/top 120px, success green rgba(25,182,114,.14) 300px at right −110px/bottom 60px".

**Fix:** Replace with `radial-gradient(320px 320px at left -120px top 120px, rgba(41,82,255,.18), transparent 70%)` and `radial-gradient(300px 300px at right -110px bottom 60px, rgba(25,182,114,.14), transparent 70%)`.

### Dark tints are dimmed instead of strengthened — effective alpha ~.05 against a spec of .28 / .16
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** In dark the tints step UP to `.28` (blue) and `.16` (green) alpha.

**Deployed:** Dark reuses the light tint layer and multiplies it DOWN with `opacity:.5`, giving effective alphas of .10 × .5 = .05 for both — roughly one fifth of the specified blue and one third of the specified green, so the dark canvas reads as flat #090D18 with no visible tint.

**Evidence:** index.html:2961 `html[data-theme="light"][data-appearance="dark"] .app-body::before{ opacity:.5; }` combined with index.html:3019-3020 (`rgba(41,82,255,.10)` / `rgba(25,182,114,.10)`). README: "tints at .28 / .16 alpha".

**Fix:** Drop the `opacity:.5` and redeclare the dark `.app-body::before` background with `rgba(41,82,255,.28)` and `rgba(25,182,114,.16)`.

### Card ::before specular sheen is absent everywhere
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** Each glass card carries a `::before` specular sheen `linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,0) 45%)` with `isolation:isolate` + `z-index:-1`.

**Deployed:** No `.nd-card::before` / `.ndc::before` rule exists. Grep for the sheen gradient finds only an unrelated `--glass-edge` token; the one `isolation:isolate` in the file (index.html:1679) belongs to a different component. Cards render as flat translucent fills with no highlight.

**Evidence:** `grep -n "nd-card::before\|ndc::before\|rgba(255,255,255,.7),rgba(255,255,255,0)" index.html` → single hit index.html:2029 `--glass-blur:blur(22px) saturate(150%); --glass-edge:rgba(255,255,255,.7);` (a token declaration, not the sheen). README: "plus a ::before specular sheen linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,0) 45%) (needs isolation:isolate + z-index:-1)".

**Fix:** Add `.nd-card,.ndc{position:relative;isolation:isolate}` and `.nd-card::before,.ndc::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,0) 45%);pointer-events:none}`.

### Light card: alpha, radius, shadow and blur all differ from spec, and the inset highlight is missing
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** `background rgba(255,255,255,.58)`, `border-radius 24px`, `box-shadow 0 12px 36px rgba(15,28,61,.08), inset 0 1px 0 rgba(255,255,255,.9)`, `backdrop-filter blur(24px) saturate(1.6)`.

**Deployed:** `background rgba(255,255,255,.72)` (too opaque), `border-radius 20px` (4px short), `box-shadow 0 10px 30px -18px rgba(15,28,61,.20), 0 2px 8px -4px rgba(15,28,61,.08)` — a different two-layer shadow with negative spread and NO `inset 0 1px 0 rgba(255,255,255,.9)` top highlight — and `backdrop-filter blur(20px) saturate(1.5)`. Border `1px solid rgba(255,255,255,.85)` is the one value that matches.

**Evidence:** live-mob-light.txt:194 `[29,211,328,276] | div.nd-card.nd-hero | … | rgba(255, 255, 255, 0.72) | r:20px | b:1 rgba(255, 255, 255, 0.85) | sh:rgba(15, 28, 61, 0.2) 0px 10px 30px -18px, rgba(15, 28, 61, 0.08) 0px 2px 8px -4px | … | bf:blur(20px) saturate(1.5) |`; source at index.html:3007-3009 and index.html:3080-3082.

**Fix:** Set `--nd-card:rgba(255,255,255,.58)`, `--nd-shadow:0 12px 36px rgba(15,28,61,.08), inset 0 1px 0 rgba(255,255,255,.9)`, and change index.html:3081-3082 to `border-radius:24px` and `blur(24px) saturate(1.6)`.

### Light header is too opaque and its hairline too bright
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Header `rgba(255,255,255,.55)` + `blur(24px) saturate(1.6)`, hairline `rgba(255,255,255,.8)`.

**Deployed:** Header is `rgba(255,255,255,.72)` with hairline `rgba(255,255,255,.9)`. The blur/saturate pair is correct.

**Evidence:** live-mob-light.txt:93 `[0,0,394,181] | div.mobile-topbar | {"data-nd":"1"} | … | rgba(255, 255, 255, 0.72) | … | bf:blur(24px) saturate(1.6) |`; index.html:3025 `background:rgba(255,255,255,.72) !important; border-bottom:1px solid rgba(255,255,255,.9) !important;`

**Fix:** index.html:3025 → `background:rgba(255,255,255,.55) !important; border-bottom:1px solid rgba(255,255,255,.8) !important;`

### Dark header is fully opaque #131A2B instead of translucent rgba(9,13,24,.6)
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** Dark header `rgba(9,13,24,.6)` (translucent, so content scrolls visibly under the blur).

**Deployed:** Solid `rgb(19, 26, 43)` — both the wrong base colour (#131A2B rather than #090D18) and fully opaque, so the declared `blur(24px) saturate(1.6)` has nothing to sample.

**Evidence:** live-mob-dark.txt:93 `[0,0,394,181] | div.mobile-topbar | … | rgb(19, 26, 43) | … | bf:blur(24px) saturate(1.6) |`; index.html:2956 `html[data-theme="light"][data-appearance="dark"] :is(.sidebar,.nd-topbar,.mobile-topbar){ background:var(--nd-0) !important; … }`

**Fix:** Give `.mobile-topbar` / `.nd-topbar` their own dark rule: `background:rgba(9,13,24,.6) !important;` instead of inheriting `var(--nd-0)`.

### Phone tab bar: wrong alpha, inset, bottom offset and shadow
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Floating pill inset 16px, bottom 14px, `rgba(255,255,255,.62)`, `blur(28px) saturate(1.7)`, `0 12px 36px rgba(15,28,61,.14)`.

**Deployed:** Inset 14px, bottom 12px, `rgba(255,255,255,.82)` (far too opaque), shadow `0 14px 36px -14px rgba(15,28,61,.22)`. The rendered rect [14,800,366,62] in a 394px-wide body confirms 14px side inset and 874−862 = 12px bottom. Only `blur(28px) saturate(1.7)` matches.

**Evidence:** live-mob-light.txt:345 `[14,800,366,62] | nav.mob-bottom-nav | … | rgba(255, 255, 255, 0.82) | r:999px | b:1 rgba(255, 255, 255, 0.9) | sh:rgba(15, 28, 61, 0.22) 0px 14px 36px -14px | … | bf:blur(28px) saturate(1.7) |`; index.html:3151-3156.

**Fix:** index.html:3152-3156 → `left:16px; right:16px; bottom:calc(14px + env(safe-area-inset-bottom)); background:rgba(255,255,255,.62); box-shadow:0 12px 36px rgba(15,28,61,.14);`

### Segmented-control thumb is a flat white pill — no gradient, no blur, no top-edge highlight, wrong shadow and wrong glass easing
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Thumb `linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55))`, `backdrop-filter blur(20px) saturate(1.8)`, `box-shadow 0 6px 18px rgba(15,28,61,.14)`, top-edge highlight via `::after`; glass thumb slide 460ms `cubic-bezier(.34,1.3,.64,1)`.

**Deployed:** Thumb is solid `background:#fff` with no gradient and no backdrop-filter; shadow is `0 2px 8px -2px rgba(15,28,61,.18)`; there is no `::after` top-edge highlight rule; and the slide runs at the flat-theme timing `320ms cubic-bezier(.32,.72,0,1)` rather than the glass 460ms spring.

**Evidence:** index.html:3065-3068 `…bucket-seg::before{ content:""; position:absolute; top:4px; bottom:4px; left:4px; width:calc((100% - 8px) / 3); border-radius:999px; background:#fff; box-shadow:0 2px 8px -2px rgba(15,28,61,.18); transition:transform 320ms cubic-bezier(.32,.72,0,1); …}` — README: "thumb linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55)), blur(20px) saturate(1.8), 0 6px 18px rgba(15,28,61,.14), top-edge highlight via ::after" and "Segmented thumb slide … glass 460ms cubic-bezier(.34,1.3,.64,1)".

**Fix:** Replace the thumb fill with the 160deg gradient, add `backdrop-filter:blur(20px) saturate(1.8)`, set `box-shadow:0 6px 18px rgba(15,28,61,.14)`, add a `::after` 1px top highlight, and change the transition to `460ms cubic-bezier(.34,1.3,.64,1)`.

### Dark segmented control: track keeps the light ink tint, and the dark thumb override is dead CSS so the thumb stays solid white
`Liquid Glass theme` · mobile · verdict ADJUSTED

**Designed:** Dark segmented track `rgba(255,255,255,.06)` (README:77); thumb `rgba(255,255,255,.22 → .10)` gradient (README:77).

**Deployed:** In dark the track resolves to `rgba(15, 28, 61, 0.055)` — identical to light, a dark-blue tint on a dark-blue canvas — with the light `inset 0 1px 3px rgba(15,28,61,.07)` retained. index.html:2964 tries `rgba(255,255,255,.07)` but index.html:3063 has equal specificity, also `!important`, and comes later in source order, so it wins. The thumb is solid `#fff` (index.html:3066), not the spec gradient and not `.14`: the dark override at index.html:2965 wraps pseudo-elements in `:is()`, which is invalid — verified in Chromium, the rule parses to `:is()` and matches nothing.

**Evidence:** live-mob-dark.txt:122 `[16,118,362,48] | div.bucket-seg | {"id":"bucketSeg","aria-label":"Attribution view"} | … | rgba(15, 28, 61, 0.055) | r:999px | b:- | sh:rgba(15, 28, 61, 0.07) 0px 1px 3px 0px inset | …` — identical to live-mob-light.txt:122. Conflicting sources: index.html:2965 `:is(.bucket-seg,.nd-modes){ background:rgba(255,255,255,.07) !important; }` vs index.html:3063 `background:rgba(15,28,61,.055) !important;`

**Fix:** Scope the mobile track rule under `html[data-theme="light"]:not([data-appearance="dark"])`, set the dark track to `rgba(255,255,255,.06)`, swap the inset shadow for a dark-safe one, and make the dark thumb `linear-gradient(160deg,rgba(255,255,255,.22),rgba(255,255,255,.10))`.

### The only bottom sheet is opaque white with a 20px radius — none of the range-sheet glass values are present
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Range sheet `rgba(255,255,255,.78)`, `blur(32px) saturate(1.7)`, radius 32px on the top corners; dark sheet `rgba(19,26,43,.84)`.

**Deployed:** The app's only sheet surface (`.nd-alerts`) is `background:#fff` with `border-radius:20px 20px 0 0` and no backdrop-filter at all; in dark it is overridden to opaque `var(--nd-0)` = #131A2B. A grep for `blur(32px)` across index.html returns zero hits, and no rule anywhere uses a 32px top radius.

**Evidence:** index.html:2975-2976 `html[data-theme="light"] .nd-alerts{ width:min(420px,100%); max-height:72vh; overflow:auto; background:#fff; border:1px solid var(--nd-edge,#E6EAF3); border-radius:20px 20px 0 0; box-shadow:0 24px 64px rgba(15,20,25,.22); …}`; dark override index.html:2964 `:is(.nd-alerts,.nd-alerts-h){ background:var(--nd-0) !important; …}`; `grep -n "blur(32px)" index.html` → no match. README: "Range sheet: rgba(255,255,255,.78), blur(32px) saturate(1.7), radius 32px top corners".

**Fix:** Give the sheet `background:rgba(255,255,255,.78); backdrop-filter:blur(32px) saturate(1.7); border-radius:32px 32px 0 0;` and a dark override of `rgba(19,26,43,.84)`.

### Desktop sidebar is opaque white/solid navy with backdrop-filter explicitly disabled
`Liquid Glass theme` · desktop · verdict CONFIRMED

**Designed:** Desktop sidebar `rgba(255,255,255,.42)` + `blur(24px)`.

**Deployed:** Sidebar renders as solid `rgb(255, 255, 255)` in light and solid `rgb(19, 26, 43)` in dark, with no backdrop-filter — the rule actively sets `backdrop-filter:none !important`.

**Evidence:** live-desk-light.txt:94 `[0,0,248,900] | aside.sidebar | … | rgb(255, 255, 255) | r:0px | b:- | sh:- | … | bf:- |` and live-desk-dark.txt:94 `… | rgb(19, 26, 43) | … | bf:- |`; index.html:2482 `html[data-theme="light"] .sidebar{ background:#ffffff !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; border-right:1px solid var(--border) !important; box-shadow:none !important; }`

**Fix:** Remove the `backdrop-filter:none` override at index.html:2482 and set `background:rgba(255,255,255,.42); backdrop-filter:blur(24px)`, with a matching dark value.

### Popovers/dropdowns are opaque #ffffff with backdrop-filter forcibly disabled
`Liquid Glass theme` · desktop · verdict CONFIRMED

**Designed:** Popovers `rgba(255,255,255,.82)` + `blur(28px)`.

**Deployed:** The final (winning) rule for `.gdr-drop`, `#gdrSharedDrop`, `.cmdk`, `.modal`, `.modal-card`, `.acq-src-panel` and `.suggestions` sets `background:#ffffff !important` and `backdrop-filter:none !important`, overriding an earlier rule at index.html:2104 that did apply `blur(20px)`. Radius is also forced to `var(--radius-lg)` rather than the glass 24px.

**Evidence:** index.html:2516-2517 `html[data-theme="light"] :is(.gdr-drop,#gdrSharedDrop,.cmdk,.modal,.modal-card,.acq-src-panel,.suggestions){ background:#ffffff !important; border:1px solid var(--border-strong) !important; border-radius:var(--radius-lg) !important; box-shadow:var(--shadow-lg) !important; backdrop-filter:none !important; }` — README: "popovers rgba(255,255,255,.82) + blur(28px)".

**Fix:** Drop the `backdrop-filter:none` and opaque fill at index.html:2516-2517; use `background:rgba(255,255,255,.82); backdrop-filter:blur(28px) saturate(1.6); border-radius:24px`.

### The spec's 460px desktop drill-down drawer does not exist, so its drawer glass is absent
`Liquid Glass theme` · both · verdict ADJUSTED

**Designed:** Drawer `rgba(245,247,255,.78)` + `blur(32px)` (README:75) on the 460px right-hand desktop drill-down drawer (README:146).

**Deployed:** No drawer surface exists anywhere in the app: no element carries a drawer class (`grep 'class="[^"]*drawer'` → 0 hits) and live-desk-light.txt contains no drawer element, so `rgba(245,247,255,.78)` + `blur(32px)` have nothing to apply to (`grep -n "blur(32px)"` and `grep -n "245,247,255"` both → no match). The panels the auditor cited are different components: index.html:2304 / 2606 style the phone "More" nav `.sidebar` inside `@media (max-width:600px)`, and `.acq-src-panel` is a desktop popover folded into the opaque-popover rule at index.html:2516-2517.

**Evidence:** index.html:2304 `html[data-theme="light"] .sidebar{ background:#f5efe6 !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; box-shadow:8px 0 40px rgba(0,0,0,.30) !important; }`; `grep -n "blur(32px)" index.html` → no match. README: "drawer rgba(245,247,255,.78) + blur(32px)".

**Fix:** Apply `background:rgba(245,247,255,.78); backdrop-filter:blur(32px)` to the desktop 460px drawer surface (keeping the mobile nav drawer opaque is a defensible iOS carve-out, but it should be an explicit documented exception rather than silent drift).

### Dark chart bars have no blue glow
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** In dark, chart bars gain `box-shadow 0 0 18px -4px rgba(92,121,255,.55)`.

**Deployed:** No such shadow exists anywhere. The mobile bars carry only an inset white highlight and the desktop bars carry none; neither has a dark-appearance shadow rule. `grep -n "0 0 18px" index.html` returns zero hits.

**Evidence:** index.html:3106-3107 `html[data-theme="light"] .nd-bars i{ display:block; width:100%; border-radius:8px 8px 4px 4px; background:var(--nd-act-500); box-shadow:inset 0 1px 0 rgba(255,255,255,.45); transition:height 720ms cubic-bezier(.34,1.25,.64,1); }` and index.html:2863-2864 (desktop `.ndc-bars i`, no box-shadow). README: "Chart bars gain 0 0 18px -4px rgba(92,121,255,.55)".

**Fix:** Add `html[data-theme="light"][data-appearance="dark"] :is(.nd-bars,.ndc-bars) i{ box-shadow:0 0 18px -4px rgba(92,121,255,.55); }`

### Overview nav icon is layout-grid, not the designed layout-dashboard
`Icons, logo & assets` · both · verdict ADJUSTED

**Designed:** Lucide `layout-dashboard` — an asymmetric 4-block glyph (7×9 at 3,3; 7×5 at 14,3; 7×9 at 14,12; 7×5 at 3,16).

**Deployed:** Four identical 7×7 squares (Lucide `layout-grid` / `grid-2x2`). Desktop: `#i-grid` = `<rect x="3" y="3" width="7" height="7" rx="1"/>` ×4. Mobile bottom nav repeats the same four 7×7 squares inline.

**Evidence:** proto-desk-light.txt: `[22,129,18,18] | span | {"data-icon":"layout-dashboard"}` vs index.html:3201 `<symbol id="i-grid" …><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></symbol>`; used at index.html:3245 and index.html:11495

**Fix:** Swap `#i-grid` for the canonical `layout-dashboard` path in both the desktop sidebar (index.html:3245) and the mobile bottom nav (index.html:11495).

### Refresh icon is a single-arrow rotate-cw, not Lucide refresh-cw
`Icons, logo & assets` · both · verdict CONFIRMED

**Designed:** Lucide `refresh-cw` — two opposing arcs with two arrowheads (4 paths).

**Deployed:** A single 300° arc with one arrowhead (2 paths). Sprite: `#i-refresh` = `M21 12a9 9 0 1 1-2.64-6.36L21 8` + `M21 3v5h-5`. The JS-injected desktop/mobile header buttons draw the same 2-path shape inline. The digest confirms only two path children under each refresh button.

**Evidence:** proto-desk-light.txt: `[1283,26,19,19] | span | {"data-icon":"refresh-cw"}`; live-desk-light.txt: `[1274,14,40,40] | button.nd-tb-ico | {"id":"ndDeskRefresh",…}` followed by only `[1287,27,14,14] | path` and `[1296,27,5,5] | path`; source at index.html:3195 and index.html:6723

**Fix:** Replace both the `#i-refresh` symbol and the inline header markup (index.html:6723) with the 4-path Lucide `refresh-cw`.

### Team switcher has no chevrons-up-down affordance
`Icons, logo & assets` · both · verdict CONFIRMED

**Designed:** A 14px `chevrons-up-down` glyph at the right edge of the Growth team button (12px on mobile), signalling it opens a picker.

**Deployed:** The team button is built as `'<span class="av">GR</span><span class="tx"><b>Growth</b><s id="ndTeamSub">…</s></span>'` with no trailing icon; on mobile the team button is gone entirely and replaced by a plain `span.nd-ttl`. `chevrons-up-down` appears nowhere in index.html.

**Evidence:** proto-desk-light.txt: `[211,77,14,14] | span | {"data-icon":"chevrons-up-down"}`; proto-mob-light.txt: `[115,88,12,12] | span | {"data-icon":"chevrons-up-down"}` vs live-desk-light.txt `[12,66,223,44] | button.nd-team` whose only children are `span.av`, `span.tx`, `b`, `s` — no svg row; source index.html:6739

**Fix:** Append a `chevrons-up-down` icon span to the `.nd-team` markup at index.html:6739 (14px desktop / 12px mobile, `--text-subtle`).

### Appearance control has no sun / moon / monitor-smartphone icons
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** Three 72px segments, each a 14px Lucide icon + label: `sun` Light, `moon` Dark, `monitor-smartphone` Auto.

**Deployed:** Three text-only 29px buttons. `sun`, `moon` and `monitor-smartphone` appear nowhere in index.html (grep for `monitor` returns no icon hit).

**Evidence:** proto-desk-light.txt: `[27,1098,14,14] | span | {"data-icon":"sun"}`, `[100,1098,14,14] | span | {"data-icon":"moon"}`, `[171,1098,14,14] | span | {"data-icon":"monitor-smartphone"}` vs live-desk-light.txt `[79,803,29,34] | button.nd-mode.on | {"data-mode":"light"} | … | TXT«Light»` (and rows for dark/auto); source index.html:3302-3304

**Fix:** Add the three icons to the buttons at index.html:3302-3304 and widen each segment to 72px with an 6px gap, matching the prototype.

### "See all" uses the › text character instead of the chevron-right icon
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** `See all` label followed by a 14×14 Lucide `chevron-right` icon in `--text-link`, in all three overview panels.

**Deployed:** The label string itself ends in the typographic character U+203A: `'See all ›'`. No icon element is emitted, so the arrow inherits the font's glyph metrics rather than the 24/2 icon grid.

**Evidence:** index.html:6858 `'<button class="nd-see" onclick="switchTab(\'acquire\')">See all ›</button>'` (repeated 6865, 6867, 7125, 7132, 7134); live-desk-light.txt `[575,511,55,32] | button.nd-see | … | TXT«See all ›»` vs proto-desk-light.txt `[557,519,64,32] | button | … | TXT«See all»` + `[604,528,14,14] | span | {"data-icon":"chevron-right"}`

**Fix:** Drop the › character from the six string literals and append `<svg class="ic" style="width:14px;height:14px"><use href="#i-chevron-right"/></svg>` (adding the missing symbol).

### Alerts panel close button uses the ✕ text character instead of the x icon
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** A 20×20 Lucide `x` icon in the panel header close button.

**Deployed:** `'<button class="nd-alerts-x" onclick="ndCloseAlerts()" aria-label="Close">✕</button>'` — a U+2715 text glyph, not an icon on the 24px grid.

**Evidence:** index.html:6953 vs proto-desk-search.txt `[1463,26,20,20] | span | {"data-icon":"x"}`

**Fix:** Add an `#i-x` symbol (`M18 6 6 18` + `m6 6 12 12`, stroke-width 2) and use it at 20×20 in place of the ✕ character.

### Report "Export PDF" button has no share-2 icon
`Icons, logo & assets` · desktop · verdict CONFIRMED

**Designed:** Accent button, `share-2` leading icon + "Export PDF".

**Deployed:** Text-only secondary button; the digest shows no svg child between the Export PDF button row and the next button row. The `#i-share` symbol (correct Lucide share-2 geometry) exists in the sprite but is not wired to this button.

**Evidence:** live-desk-report.txt `[989,93,108,38] | button.btn.btn-secondary.no-print | … | TXT«Export PDF»` (next row is `[1109,93,112,38] … TXT«Export PNG»`, no svg between) vs DesktopOverview.dc.html:344 `<x-import … .Button" variant="accent" size="sm" icon="share-2" …>Export PDF</x-import>`

**Fix:** Add `<svg class="ic-sm"><use href="#i-share"/></svg>` to the Export PDF button.

### Search screen's icon-bearing sections don't match the design: `history` and `credit-card` are never rendered, and an off-list `cart` glyph is used
`Icons, logo & assets` · desktop · verdict ADJUSTED

**Designed:** Quick-filter chips carry `star` (Pro users), `users` (Influencer signups) and `credit-card` (Paid this week); the "Recent lookups" rows each carry a 16px `history` icon.

**Deployed:** index.html:3373-3388 builds four `div.sugg-title` sections using `#i-users` (Recent Signups), `#i-cart` (Abandoned Checkout), `#i-alert` (Expiring Soon) and `#i-star` (Pro Users), rendered at 13px (live-desk-search.txt:220 `[520,305,13,13] | svg`). `check-circle` is NOT among them. `star` IS used, and matches the design's `star` chip. The real deviations are: (a) `cart` is not in the README.md:26 slug list; (b) the design's `credit-card` and `history` glyphs are rendered nowhere — `grep -c credit-card index.html` → 0, and the live "Recent" row is bare text chips (live-desk-search.txt:212-214 `span.chip-group-label TXT«Recent»` + two `span.chip` with email text, no icon) against four `history` rows in the prototype; (c) the screens differ structurally, not just by slug — the design has three quick-filter chips plus a Recent-lookups list, the app has four suggestion panels.

**Evidence:** proto-desk-search.txt: `[285,173,13,13] … {"data-icon":"star"}`, `[422,173,13,13] … {"data-icon":"users"}`, `[611,173,13,13] … {"data-icon":"credit-card"}`, four rows of `[293,268,16,16] … {"data-icon":"history"}` vs index.html:3373-3388 (`#i-users`, `#i-cart`, `#i-alert`, `#i-star`) and live-desk-search.txt `[579,200,171,26] | span.chip | … | TXT«nikhil.r162004@gmail.com»` with no icon row

**Fix:** Add `history` and `credit-card` symbols, put `history` on each recent-lookup row and `credit-card` on the Paid-this-week filter, and drop `cart`/`alert` from the quick-filter set.

### Two data-URI icons are painted as `background` images that a later `!important` shorthand erases, so they never render at all
`Icons, logo & assets` · both · verdict ADJUSTED

**Designed:** Every glyph inherits `currentColor` (the whole point of the mask approach), so it re-tints in dark mode and on hover/active states.

**Deployed:** The hardcoded hexes are real — index.html:474 `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239aa1ad' stroke-width='2.2' …")` and index.html:519 `url("data:image/svg+xml,%3Csvg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%235b6271' stroke-width='2.5' …")` — but they are never seen. index.html:2 hardcodes `<html lang="en" data-theme="light">`, and index.html:2511 sets `html[data-theme="light"] :is(.toolbar-input,.search-input,.field-input,.date-input,.sort-select,…){ background:#ffffff !important; … }`. That `background` shorthand carries `!important` and resets `background-image` to none, so the toolbar filter field renders with NO magnifier and the sort dropdown with NO chevron. Two earlier blocks (index.html:1604, 2002, 2096) do the same. No later rule restores an image — `grep -n "toolbar-input\|sort-select" index.html` has its last hit at 2513.

**Evidence:** index.html:474 `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239aa1ad' stroke-width='2.2' …")`; index.html:519 `url("data:image/svg+xml,%3Csvg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%235b6271' stroke-width='2.5' …")` vs README.md:26 "rendered as a CSS mask so glyphs inherit `currentColor`"

**Fix:** Convert both to `mask-image` with `background-color: currentColor` (or move them to `<use>` sprite nodes) so they re-tint with the theme.

### Logotype drops the ".ai" suffix and is one px smaller
`Icons, logo & assets` · both · verdict CONFIRMED

**Designed:** "NextRaise" at 17px/800/-0.34px in `--text-heading` followed by ".ai" at 17px/600 in `--text-muted`.

**Deployed:** "Next" + "Raise" at 16px/800/-0.32px with "Raise" tinted `#0065F4`, and no ".ai" suffix anywhere in the lockup.

**Evidence:** proto-desk-light.txt: `[60,22,101,26] | span | … | 17/800/-0.34px/26.35px | rgb(15, 28, 61) | … | TXT«NextRaise»` and `[142,24,19,22] | span | … | 17/600/-0.34px | rgb(112, 119, 139) | … | TXT«.ai»` vs live-desk-light.txt `[60,20,78,18] | div.logo | … | 16/800/-0.32px/17.6px | … | TXT«Next»` + `[97,19,41,20] | span | … | rgb(0, 101, 244) | … | TXT«Raise»`; source index.html:3238

**Fix:** Restore the ".ai" span and set the logotype to 17px/800/-0.34px, matching the prototype's colour split.

### Range change and bucket change do not dip content to opacity .35
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:168 — "**Range change and bucket change** both trigger a 420ms loading dip (`opacity .35`) and clear any selected chart bar."

**Deployed:** Both paths go straight to a full data refetch with no opacity transition. `setBucketView` nulls every tab cache and re-runs the active tab; `gdrOptClick` closes the dropdown and calls `_gdrRefetch(tab)`. The only shared loading affordance is `setBusy`, which toggles a top progress bar, not a content dip. `grep -n "opacity: *\.35\|opacity: *0\.35"` matches only `.sort-icon` at index.html:602. Because no bar can be selected (see chart-bar-selection-absent), the "clear any selected chart bar" half is vacuous.

**Evidence:** index.html:5993-6005 `function setBucketView(v){ … BUCKET_VIEW = v; … _syncBucketSeg(); _refreshAllLoadedTabs(); }` — no opacity handling; index.html:5744-5752 `function gdrOptClick(key){ … _tabRanges[tab] = key; closeTabGdr(); updateTabGdrBtn(tab); _gdrRefetch(tab); }`; index.html:5154-5157 `function setBusy(on){ _busyCount = …; document.getElementById('topProgress').classList.toggle('on', _busyCount > 0); }`; README.md:168.

**Fix:** In both `setBucketView` and `gdrOptClick`, add a class to the content container that sets `opacity:.35` with a 420ms transition, clear `_ndBar`, and remove the class when the refetch resolves (or after 420ms, whichever is later).

### Refresh spins but does not dim content, reset the Live badge, or toast
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:169 — "**Refresh** (`refresh-cw`, phone header and desktop topbar): spins for 900ms, dims content, resets the Live badge to \"now\", then toasts \"Refreshed · {time}\". No-op while already refreshing."

**Deployed:** `ndRefresh` adds a `.spin` class and disables the button (so the no-op guard works), then awaits the fetch. It spins for as long as the query takes — up to the hard 20s fallback — rather than 900ms; it never dims content; it never forces the Live badge to "now" (the badge only changes once `_ovDataTs` is rewritten and a render happens); and it produces no toast, because no toast system exists.

**Evidence:** index.html:6788-6798 `function ndRefresh(btn){ if (btn) { btn.classList.add('spin'); btn.disabled = true; } const done = () => { if (btn) { btn.classList.remove('spin'); btn.disabled = false; } }; try { const p = … refreshOverview() : … refreshTab(_ndTab()); Promise.resolve(p).then(done, done); setTimeout(done, 20000); } catch (_) { done(); } }`; spin CSS index.html:2828 `.nd-tb-ico.spin svg{ animation:ndSpin .9s linear infinite; }`; README.md:169.

**Fix:** Keep the disabled/no-op guard, add a minimum 900ms spin window, apply the same `opacity:.35` dim used by the range/bucket change, set the Live badge text to "Live · now" for the duration, and call `ndToast('Refreshed · ' + hhmm)` on completion.

### Live badge has no minute counter — it is frozen between renders
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:170 — "**Live badge** counts minutes since the last read (1–5m, \"now\" while refreshing)." State shape README:190 — "`tick: number` // minute counter for the Live badge".

**Deployed:** `ndLiveEl` computes the minute figure once, from `_ovDataTs`, and is only invoked from `renderOverviewConsole` / `renderOverviewMobile`. There is no timer to advance it: `grep -n "setInterval" index.html` returns zero matches across the whole file, and no `tick` state exists. A badge captured at "Live · 12m" stays at 12m indefinitely until the overview re-renders. The text ladder also differs from the design: "now" below 2m, "Nm" below 60m, then "Updated hh:mm", rather than the designed 1–5m counter.

**Evidence:** index.html:6776-6786 `function ndLiveEl(el){ … const m = ts ? Math.max(0, Math.round((Date.now() - ts) / 60000)) : 1e9; el.className = 'nd-live' + (paused || m > 15 ? ' is-stale' : ''); el.textContent = … }` — called only at index.html:6870 and :7137; `grep -n "setInterval" index.html` → no output. Live digest live-desk-light.txt:`[1171,21,89,26] | span.nd-live | {"id":"ndDeskLive"} | … TXT«Live · 12m»`; README.md:170.

**Fix:** Add a 60s interval that increments a `tick` counter and re-runs `ndLiveEl` on `#ndDeskLive` and `#ndLive`, and force the badge to "now" while `refreshing` is true.

### No amber stale banner — the fallback status text is rendered into a display:none element
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:171 — "**Stale state** (`stale` prop): amber banner under the header — \"PostHog hourly read budget exhausted. Showing the snapshot from 14 min ago; retrying at 10:15.\" Mirrors the existing API contract; the app must degrade to the cached snapshot rather than erroring."

**Deployed:** No banner element exists under either header. The app's stale/paused copy is written by `renderOvPill` into `#ovUpdated`, which lives inside `.ov-head` — and `.ov-head` is hidden with `display:none !important` on both the desktop and the mobile redesign layers, so that text never reaches the screen (it is absent from both live digests). The only surviving signal is the `nd-live` pill flipping to `.is-stale` amber past 15 minutes, with the text "Paused · showing …" rather than the designed copy. The underlying degrade-to-cached-snapshot behaviour is correctly implemented.

**Evidence:** index.html:2833 `html[data-theme="light"] #page-overview .ov-head{ display:none !important; }` and the mobile twin at index.html:3076; the hidden target at index.html:3332 `<span class="nb-updated" id="ovUpdated"></span>`; writer at index.html:6619 `const up = document.getElementById('ovUpdated'); if (!up) return;` and :6626-6628 `up.innerHTML = '<i></i> Paused · retries ' + hhmm(ts) + (_ovDataTs ? ' · showing data from ' + _ovAgeText(_ovDataTs) : '');`. Neither `ovUpdated` nor `nb-updated` appears in live-desk-light.txt or live-mob-light.txt (365 and 376 captured nodes). README.md:171.

**Fix:** Render a dedicated amber banner directly under `.nd-topbar` / `.nd-head` when `budgetPauseUntil()` is set, using the designed sentence "PostHog hourly read budget exhausted. Showing the snapshot from {n} min ago; retrying at {hh:mm}.", and either delete the dead `#ovUpdated` writer or point `renderOvPill` at the new banner.

### Range picker is a 180px legacy dropdown on both surfaces, not a 240px popover / phone bottom sheet
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:156 — "**Range picker** — phone bottom sheet (\"Date range · IST\", 7 presets: Today, Yesterday, Last 7 days, Last 14 days, This month, Last month, All time; 52px rows, active row tinted `--action-50` with a check). Desktop: 240px popover anchored under the range pill."

**Deployed:** One shared `position:fixed` dropdown serves both breakpoints. It is `min-width:180px` (designed desktop width 240px); rows are `padding:8px 14px` at `font-size:13px`, i.e. roughly 34px tall against the designed 52px; the active row gets `color: var(--accent); font-weight:600` plus a `::after` '✓' but no `--action-50` tint; and an eighth "Custom…" row is added that the design does not have. On phone there is no bottom sheet and no "Date range · IST" title — `grep -n "Date range" index.html` returns zero matches.

**Evidence:** index.html:4524 `<div id="gdrSharedDrop" style="display:none;position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border-strong);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.15);min-width:180px;padding:5px 0;…">`; rows index.html:4525-4535 (`today`…`all` plus `custom`); index.html:813-816 `.gdr-opt { padding: 8px 14px; font-size: 13px; … } .gdr-opt.active { color: var(--accent); font-weight: 600; } .gdr-opt.active::after { content: '✓'; … }`. Prototype digest proto-mob-rangesheet.txt:`TXT«Date range · IST»`. README.md:156.

**Fix:** Keep the seven presets; widen the desktop popover to 240px; set row height to 52px and tint the active row `background: var(--action-50)` with the check; and under 601px render the same list as a bottom sheet titled "Date range · IST" animating `translateY(100% → 0)` over 420ms.

### Light/Dark/Auto switch exists on desktop only — absent on phone
`Interactions & behaviour` · mobile · verdict CONFIRMED

**Designed:** README:158 — "**Appearance switch** — Light / Dark / Auto segmented control in the same sheet (phone) or pinned above Settings in the sidebar (desktop). Auto reads `prefers-color-scheme`."

**Deployed:** The desktop half is correct: three `.nd-mode` buttons sit directly above the Settings button, Auto resolves through `matchMedia('(prefers-color-scheme: dark)')`, and a `change` listener repaints while Auto is active. On phone the control does not render at all — the 402x874 capture contains zero `.nd-mode` nodes — and since the team sheet that was meant to host it does not exist either, there is no way to change appearance on a phone.

**Evidence:** Desktop present — live-desk-light.txt:`[79,803,29,34] | button.nd-mode.on | {"data-mode":"light"} … TXT«Light»`, `[109,803,…] {"data-mode":"dark"}`, `[138,803,…] {"data-mode":"auto"}`, immediately above `[62,859,55,18] … TXT«Settings»`. Mobile absent — `grep -c "nd-mode" live-mob-light.txt` → `0`. Auto logic index.html:6884-6888 `if (a === 'auto') { try { return matchMedia('(prefers-color-scheme: dark)').matches; } … }` and listener index.html:6902. README.md:158.

**Fix:** Render the same `#ndModes` segmented control inside the phone team/appearance sheet (or the mobile header overflow) so `ndSetAppearance` is reachable under 601px.

### "Add post data" is mislabelled, lives on the wrong screens, and confirms inline instead of toasting
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:127 — "…'Add post data' opens the entry form" (on Creators); README:159 — "**Add post data** — phone bottom sheet / desktop 520px centred modal. Fields: Date, Budget ₹, Views, Likes, Comments, Shares (44px, radius 12px). Save toasts \"Entry saved for {creator}\"."

**Deployed:** The form itself exists with the right fields (date, budget, views, likes, comments, shares), but it is labelled "Influencer data" and is reachable only from the CEO Report toolbar and the Settings modal — not from the Creators screen and not from the creator drill-down (which does not exist). On save it writes inline text "Entry saved." into a `.cf-msg` element instead of toasting "Entry saved for {creator}", so the creator name never appears in the confirmation.

**Evidence:** index.html:4671 `<button class="btn btn-ghost no-print" onclick="openCreatorForm()" title="Log manual influencer campaign metrics">Influencer data</button>` and index.html:4704 (Settings copy of the same button); index.html:5130 `msg.textContent = 'Entry saved.'; msg.className = 'cf-msg ok';`; README.md:127 and README.md:159.

**Fix:** Add an "Add post data" button to the Creators screen (and the creator drill-down once it exists) pointing at `openCreatorForm()`, and replace the inline `.cf-msg ok` confirmation with `ndToast('Entry saved for ' + creator)`.

### Unimplemented affordances are silently inert rather than toasting
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:172 — "Chart bars, KPI tiles, list rows, creator rows, 'See all' links and quick filters are all interactive; anything not implemented toasts rather than navigating to a dead end."

**Deployed:** Chart bars, recent-signup rows and recent-payment rows carry no handler at all on either surface, so tapping them does nothing and gives no feedback. Because there is no toast primitive, the designed graceful fallback cannot fire anywhere; the affordances that do respond bypass their drill-down and jump to a legacy analytics tab instead.

**Evidence:** index.html:6816 `return '<div class="ndc-row"><span class="nd-ini">' + esc(ndIni(name || email)) + '</span>' +` and index.html:6824 (payments row) — plain `<div>`, no `onclick`; mobile twins at index.html:7083 and :7092; bars at index.html:6806-6807. `grep -ni "toast" index.html` → 0 matches. README.md:172.

**Fix:** Give every row and bar a handler: open the real drill-down where it exists, otherwise `ndToast('Coming soon')`-style feedback, and add `cursor:pointer` plus the 140ms `scale(.97)` tap feedback from README's motion table.

### Card stack is inset 29px instead of 16px because .page and #overviewArea padding stack
`Mobile card stack` · mobile · verdict ADJUSTED

**Designed:** Phone screen padding 16px applied once; on the live 386px page column that gives a 354px-wide card at x=16. Prototype: scroll container `p:16/16/96/16`, every card 370px at x=16 on a scrollbar-free 402px viewport.

**Deployed:** `div.page.active` applies `p:16/15/104/15` and the nested `#overviewArea` applies another `p:14/14/104/14`, so cards start at x=29 and are 328px wide — 26px narrower than a single 16px gutter would give on the same column (the further 16px of the 370→328 gap is scrollbar chrome present in the live capture only, not a design defect).

**Evidence:** README.md §Spacing: "Phone: screen padding 16px, card padding 16–20px, card gap 12px, scroll bottom padding 96px" | proto-mob-light.txt:53 `[0,217,402,1976] | div | {"data-dc-tpl":"48","data-scroll":""} | ... p:16/16/96/16 | g:12` and :54 `[16,233,370,272] | div | ... data-card` | live-mob-light.txt `[0,181,386,1772] | div.page.active | ... p:16/15/104/15` and `[15,197,356,1652] | div | {"id":"overviewArea"} | ... p:14/14/104/14 | g:14`, `[29,211,328,276] | div.nd-card.nd-hero` | index.html:3078 `#overviewArea{ padding:14px 14px 104px; ... gap:14px; }`

**Fix:** Zero the horizontal padding on one of the two nested containers so the effective phone gutter is 16px and cards render ~370px wide; set the gap to 12px and the single bottom padding to 96px.

### Hero signups metric renders in IBM Plex Mono at weight 600 instead of Plus Jakarta Sans 800
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** Hero metric (phone): 40px / 800 / -0.03em (= -1.2px) / line-height 1, Plus Jakarta Sans, colour ink #0F1C3D. Prototype: `40px 800 -1.2px rgb(15, 28, 61)` in "Plus Jakarta Sans".

**Deployed:** 40px / 600 / -0.8px / 40px in "IBM Plex Mono", colour rgb(10,10,10). The element's own rule (.nd-big, 700/-.03em) is defeated by a later `.stat-num` block that forces the mono family, weight 600 and -.02em with !important.

**Evidence:** README.md §Typography: "| Hero metric (phone) | 40px / 800 / -0.03em / line-height 1 |" and "Single family: **Plus Jakarta Sans**" | live-mob-light.txt `[50,263,116,40] | div.nd-big.stat-num | 40/600/-0.8px/40px | rgb(10, 10, 10) | ... TXT«9,063»` (cap/live-mob-light.json fontFamily: "IBM Plex Mono", ui-monospace, monospace) vs proto-mob-light.txt:59 `[37,279,105,51] | span.sc-interp | 40/800/-1.2px/40px | rgb(15, 28, 61) | ... TXT«1,933»` | index.html:3092 `.nd-big{ font-size:40px; font-weight:700; letter-spacing:-.03em; ... }` overridden by index.html:2454-2455 `:is(...,.stat-num,...){ font-family:'IBM Plex Mono',ui-monospace,monospace !important; font-weight:600 !important; letter-spacing:-.02em !important; ... }`

**Fix:** Drop `stat-num` from the hero element at index.html:7100, or exclude `.nd-big` from the 2454 override, and set the rule to 40px/800/-0.03em with colour var(--nd-900).

### KPI tile values render at 24px/700 instead of the specified 22px/800
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** KPI value: 22px / 800 / -0.02em. Prototype tiles render `22/800/-0.44px`.

**Deployed:** All four tiles render `24/700/-0.48px` — 2px larger and one weight step lighter than the design system value.

**Evidence:** README.md §Typography: "| KPI value | 22px / 800 / -0.02em (desktop cards `clamp(18px,1.6vw,26px)`) |" | proto-mob-light.txt:108 `[33,557,145,24] | span | {"data-dc-tpl":"71"} | 22/800/-0.44px/24.2px` | live-mob-light.txt `[46,542,123,26] | b | 24/700/-0.48px/26.4px | rgb(15, 28, 61) | ... TXT«₹1,22,213»` | index.html:3116 `.nd-kpi b{ font-size:24px; font-weight:700; letter-spacing:-.02em; ... }`

**Fix:** Set `.nd-kpi b` to `font-size:22px; font-weight:800;` at index.html:3116.

### 'Signed up & paid' sub-line prefixes a ▲/▼ glyph and drops the word 'period'
`Mobile card stack` · mobile · verdict ADJUSTED

**Designed:** Sub-line at 12px/500 in success green with no glyph, reading '{+delta} vs {prior} prior period' — the prototype's absolute-delta form (proto-mob-light.txt:117, rendered with mock values as 'vs … prior period'). No triangle character appears anywhere in the prototype, and README.md:26's Lucide slug list has no up/down triangle.

**Deployed:** '▲ 194% vs prior' (index.html:7118): a ▲/▼ character is prefixed, and the trailing word 'period' is dropped — the desktop path at index.html:6848 keeps 'prior period' and uses a plain '+' sign. (The switch from absolute delta to a rounded percentage is shared with desktop, so it is a product-wide choice rather than a mobile-only defect.)

**Evidence:** README.md §1: "2. **KPI grid 2×2** — ... Signed up & paid (delta vs prior)" and §Design system Icons list (bell, calendar, chevron-*, check, x, search, history, refresh-cw, plus, share-2, copy, link, external-link, settings, alert-triangle, sun, moon, monitor-smartphone, layout-dashboard, clipboard-list, users, menu, star, credit-card — no up/down triangle) | proto-mob-light.txt:118 `[33,706,115,15] | span.sc-interp | 12/500/normal/18.6px | rgb(18, 148, 91) | ... TXT«+5 vs 19 prior period»` | live-mob-light.txt `[46,717,123,17] | s.up | 12.5/500/normal/normal | rgb(18, 148, 91) | ... TXT«▲ 194% vs prior»` | index.html:7118 `: swDelta != null ? (swDelta >= 0 ? '▲ ' : '▼ ') + Math.abs(swDelta).toFixed(0) + '% vs prior'`

**Fix:** Replace index.html:7118 with the absolute-delta form the design uses — `(swCur - swPrev >= 0 ? '+' : '') + (swCur - swPrev) + ' vs ' + swPrev + ' prior period'` — and drop the ▲/▼ characters (the desktop path at index.html:6853 already uses a plain "+N% vs prior period").

### Recent signups card shows 4 rows instead of the designed 5
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** 5 rows. Prototype renders rows AM / PS / RV / NG / SR at y=1124, 1180, 1236, 1292, 1348.

**Deployed:** 4 rows (M, RK, RK, SD) at y=1152, 1214, 1276, 1338; the mobile render slices the signup list to 4. The desktop path in the same file still slices to 5.

**Evidence:** README.md §1: "4. **Recent signups** — 5 rows: 36px initials avatar, name + email (both truncate), source + relative time right-aligned." | proto-mob-light.txt:196,:210,:222,:238,:254 — five `div | {"data-dc-tpl":"103"}` rows, `[37,1124,328,56]` … `[37,1348,328,56]` | live-mob-light.txt four `div.nd-row` at `[48,1152,290,62]`, `[48,1214,290,62]`, `[48,1276,290,62]`, `[48,1338,290,62]` | index.html:7081 `const signupRows = (_ovData.signups || []).slice(0, 4).map(r => {` vs index.html:6814 (desktop) `.slice(0, 5)`

**Fix:** Change `slice(0, 4)` to `slice(0, 5)` at index.html:7081.

### Recent signups rows show the plan tier instead of the acquisition source
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** Right-hand column of each signup row is the acquisition source plus relative time — prototype shows "Google Ads", "Direct", "Chrome Ext", "Meta Ads", "Direct" at 12px/600 rgb(63,74,102) over "2m ago" etc.

**Deployed:** The column renders the plan label ("Free" on every row) at 13.5px/600 over the relative time, so the card no longer tells you where the signup came from — the source dimension the design puts on this card is gone.

**Evidence:** README.md §1: "4. **Recent signups** — 5 rows: 36px initials avatar, name + email (both truncate), **source** + relative time right-aligned." | proto-mob-light.txt:204 `[297,1135,68,15] | span.sc-interp | 12/600/normal/18.6px | rgb(63, 74, 102) | ... TXT«Google Ads»` | live-mob-light.txt `[310,1165,28,18] | b | 13.5/600/-0.084px/normal | ... TXT«Free»` | index.html:7085 `'<span class="nd-rend"><b>' + esc(planLabel(plan)) + '</b><s>' + ago(r[3]) + '</s></span></div>';`

**Fix:** Render the channel for the row (the same `channelOf()` helper used for the Acquisition card at index.html:7066) in place of `planLabel(plan)` at index.html:7085.

### Card section titles render at 17px/-0.015em instead of the specified 15px/-0.01em
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** Section title: 15px / 700 / -0.01em. Prototype "Acquisition", "Recent signups", "Recent payments" all render `15/700/-0.15px`. (17px/700/-0.02em is the spec's *screen title* for the phone header, not a card title.)

**Deployed:** All three live card titles render `17/700/-0.255px`, competing with the header's own screen title.

**Evidence:** README.md §Typography: "| Section title | 15px / 700 / -0.01em |" | proto-mob-light.txt:132 `[37,778,81,23] | span | {"data-dc-tpl":"87"} | 15/700/-0.15px/23.25px | ... TXT«Acquisition»` | live-mob-light.txt `[48,791,92,23] | b | 17/700/-0.255px/normal | rgb(15, 28, 61) | ... TXT«Acquisition»` | index.html:3123 `.nd-list-h b{ font-size:17px; font-weight:700; letter-spacing:-.015em; ... }`

**Fix:** Set `.nd-list-h b` to `font-size:15px; letter-spacing:-.01em;` at index.html:3123.

### Footer note "PostHog project 399417 · Asia/Kolkata · internal and test accounts excluded" never renders on mobile
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** Card-stack item 7: a footer note at 11px/500 muted below the last card. Prototype renders it at [16,2047,370,50].

**Deployed:** Absent from both live-mob-light and live-mob-dark. The only place the string is produced is `ndBuildConsole()`, which returns immediately unless the viewport is desktop, so the provenance/exclusions caption is desktop-only.

**Evidence:** README.md §1: "7. Footer note: \"PostHog project 399417 · Asia/Kolkata · internal and test accounts excluded\"." | proto-mob-light.txt:364 `[16,2047,370,50] | div | {"data-dc-tpl":"135"} | 11/500/normal/17.05px | rgb(162, 166, 179) | ... TXT«PostHog project 399417 · Asia/Kolkata · internal and test accounts excluded»`; grep of live-mob-light.txt and live-mob-dark.txt for "PostHog project" returns nothing | index.html:6712-6713 `function ndBuildConsole() {` / `if (!ndIsDesk()) return;`, index.html:6720 `'<s>PostHog ' + (cfg('projectId') || '399417') + ' · Asia/Kolkata · internal and test accounts excluded</s></div>'`

**Fix:** Append the note as a plain `<div>` after the last card in the mobile `area.innerHTML` (index.html:7134) at 11px/500 var(--nd-400), 8px vertical padding — it should not depend on ndBuildConsole().

### Card gap is 14px (spec 12px) and the stack leaves 208px of dead space below the last card (spec 96px)
`Mobile card stack` · mobile · verdict ADJUSTED

**Designed:** card gap 12px, scroll bottom padding 96px to clear the floating tab bar. Prototype scroll container: `p:16/16/96/16 | g:12`.

**Deployed:** gap 14px, and 104px bottom padding applied on both `#overviewArea` and `div.page.active` — 208px total below the Recent payments card (last card ends y=1745; page ends y=1953).

**Evidence:** README.md §Spacing: "Phone: screen padding 16px, card padding 16–20px, card gap 12px, scroll bottom padding 96px (clears the floating tab bar)." | proto-mob-light.txt:53 `[0,217,402,1976] | div | {"data-dc-tpl":"48","data-scroll":""} | ... p:16/16/96/16 | g:12` | live-mob-light.txt `[15,197,356,1652] | div | {"id":"overviewArea"} | ... p:14/14/104/14 | g:14` and `[0,181,386,1772] | div.page.active | ... p:16/15/104/15` | index.html:3078 `#overviewArea{ padding:14px 14px 104px; ... gap:14px; }`

**Fix:** Set the gap to 12px and keep the 96px bottom padding on only one of the two nested containers.

### Segmented thumb is a flat white pill, not the glass thumb
`Mobile chrome` · mobile · verdict ADJUSTED

**Designed:** README:74 — thumb `linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55))`, `blur(20px) saturate(1.8)`, `0 6px 18px rgba(15,28,61,.14)`, 1px rgba(255,255,255,.95) rim, top-edge highlight via `::after` (design/MobileOverview.dc.html:44-45). Prototype render: `[260,164,118,36] | span | {"data-thumb":""} | … rgba(0, 0, 0, 0)+IMG | r:999px | b:1 rgba(255, 255, 255, 0.95) | sh:rgba(15, 28, 61, 0.14) 0px 6px 18px 0px, … | bf:blur(20px) saturate(1.8)`.

**Deployed:** Live implements the thumb as `.bucket-seg::before` with `background:#fff` (opaque flat white), `box-shadow:0 2px 8px -2px rgba(15,28,61,.18)`, no border, no backdrop-filter and no `::after` top-edge highlight (index.html:3065-3068).

**Evidence:** index.html:3065-3068 `.bucket-seg::before{ … border-radius:999px; background:#fff; box-shadow:0 2px 8px -2px rgba(15,28,61,.18); … }`

**Fix:** Replace the `::before` background with the spec gradient, add `backdrop-filter:blur(20px) saturate(1.8)`, `border:1px solid rgba(255,255,255,.95)`, `box-shadow:0 6px 18px rgba(15,28,61,.14)`, and an `::after` top-edge highlight.

### Segmented track loses its border, inset well depth and blur
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Prototype: `[20,160,362,44] | div | {"data-seg":""} | … rgba(15, 28, 61, 0.06) | r:999px | b:1 rgba(255, 255, 255, 0.7) | sh:rgba(15, 28, 61, 0.1) 0px 1px 3px 0px inset, rgba(255, 255, 255, 0.8) 0px 1px 0px 0px | p:3/3/3/3 | bf:blur(16px) saturate(1.5)` — 44px tall, 3px inset padding, glass rim and outer highlight.

**Deployed:** Live: `[16,118,362,48] | div.bucket-seg | {"id":"bucketSeg","aria-label":"Attribution view"} | … rgba(15, 28, 61, 0.055) | r:999px | b:- | sh:rgba(15, 28, 61, 0.07) 0px 1px 3px 0px inset | p:4/4/4/4 | g:2 | bf:-`. No border (`border:none !important`), no backdrop-filter, inset shadow alpha .07 instead of .10, no outer white highlight, height 48 instead of 44, padding 4 instead of 3.

**Evidence:** index.html:3061-3064 `.bucket-seg{ … padding:4px !important; … background:rgba(15,28,61,.055) !important; border:none !important; box-shadow:inset 0 1px 3px rgba(15,28,61,.07) !important; }`

**Fix:** Restore `border:1px solid rgba(255,255,255,.7)`, `backdrop-filter:blur(16px) saturate(1.5)`, `box-shadow:inset 0 1px 3px rgba(15,28,61,.1), 0 1px 0 rgba(255,255,255,.8)`, `padding:3px`, and set `.bkt{height:36px}` so the track lands at 44px.

### Segmented track keeps the light ink tint in dark appearance
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:77 — dark segmented track `rgba(255,255,255,.06)`. Prototype dark: `[20,-1159,362,44] | div | {"data-seg":""} | … rgba(255, 255, 255, 0.06) | b:1 rgba(255, 255, 255, 0.08) | sh:rgba(0, 0, 0, 0.45) 0px 1px 3px 0px inset`.

**Deployed:** Live dark: `[16,118,362,48] | div.bucket-seg | … | rgba(15, 28, 61, 0.055) | r:999px | b:- | sh:rgba(15, 28, 61, 0.07) 0px 1px 3px 0px inset` — a dark-navy tint laid over a dark surface, so the well is invisible. The intended dark rule at index.html:2964 is defeated by the `!important` light rule at 3063.

**Evidence:** live-mob-dark digest `[16,118,362,48] | div.bucket-seg | … | rgba(15, 28, 61, 0.055)` vs README.md:77 "segmented track `rgba(255,255,255,.06)`"

**Fix:** Move the dark override after index.html:3064 and add `!important`: `html[data-theme="light"][data-appearance="dark"] .nd-head .bucket-seg{ background:rgba(255,255,255,.06) !important; box-shadow:inset 0 1px 3px rgba(0,0,0,.45) !important; }`.

### Mobile header goes fully opaque in dark appearance
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:77 — dark header `rgba(9,13,24,.6)`. Prototype dark: `[0,-1319,402,217] | div | {"data-header":""} | … rgba(9, 13, 24, 0.6) | bf:blur(24px) saturate(1.6)`.

**Deployed:** Live dark: `[0,0,394,181] | div.mobile-topbar | {"data-nd":"1"} | … | rgb(19, 26, 43) | … | bf:blur(24px) saturate(1.6)` — a solid colour, so the blur has nothing to show through and the Liquid Glass header reads as a flat bar. Caused by `background:var(--nd-0) !important` at index.html:2955-2956.

**Evidence:** live-mob-dark digest `[0,0,394,181] | div.mobile-topbar | … | rgb(19, 26, 43)` ; index.html:2955-2956

**Fix:** Change the dark `.mobile-topbar` background to `rgba(9,13,24,.6) !important` and keep `--nd-0` opaque only for cards.

### Header icon buttons are 42x42, under the 44px phone hit target
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:46 "Hit targets: 44px minimum on phone (tab bar 50px)". Prototype: `[254,62,44,44] | button | {"data-dc-tpl":"25","aria-label":"Refresh data"}`, `[300,62,44,44]` (bell), `[346,62,44,44]` (avatar), group `[254,62,136,44]`.

**Deployed:** All three are 42x42: `[254,10,42,42] | button.nd-ico | {"aria-label":"Refresh"}`, `[298,10,42,42] | button.nd-ico.dot | {"aria-label":"Alerts"}`, `[342,10,42,42] | button.nd-ico | {"aria-label":"Account"}`; group `[254,10,130,42] | div.nd-hbtns` vs 136x44.

**Evidence:** index.html:3041-3042 `html[data-theme="light"] .nd-ico{ width:42px; height:42px; … }` vs README.md:46

**Fix:** Set `.nd-ico{ width:44px; height:44px; }` (icon glyph can stay 20-22px).

### Screen title renders 19px instead of the 17px spec
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Brief/README section-title scale: screen title 17px / 700 / -0.02em. Prototype: `[58,67,78,20] | span | {"data-dc-tpl":"20"} | 17/700/-0.34px/20.4px | rgb(15, 28, 61) | … | TXT«Overview»`.

**Deployed:** Live: `[57,12,85,22] | b | {"id":"ndPageTitle"} | 19/700/-0.38px/21.85px | rgb(15, 28, 61) | … | TXT«Overview»` — 2px larger (letter-spacing ratio is still -0.02em, so it scales with the wrong size).

**Evidence:** index.html:3036 `html[data-theme="light"] .nd-ttl b{ font-size:19px; font-weight:700; letter-spacing:-.02em; line-height:1.15; … }`

**Fix:** Change `.nd-ttl b` to `font-size:17px; line-height:1.2`.

### Screen side padding is 29px — .page and #overviewArea both pad
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:97 "Phone: screen padding 16px". Prototype scroll region: `[0,217,402,1976] | div | {"data-dc-tpl":"48","data-scroll":""} | … | p:16/16/96/16 | g:12` — cards start at x=16.

**Deployed:** Live nests two padded containers: `[0,181,386,1772] | div.page.active | {"id":"page-overview"} | … | p:16/15/104/15` and inside it `[15,197,356,1652] | div | {"id":"overviewArea"} | … | p:14/14/104/14 | g:14`. Cards therefore start at x=29 (`[29,211,328,276] | div.nd-card.nd-hero`) — 13px more gutter than designed, and card width 328 instead of 370.

**Evidence:** index.html:2281 `.page{ padding:16px 15px calc(22px + env(safe-area-inset-bottom)); }` and index.html:3077 `html[data-theme="light"] #overviewArea{ padding:14px 14px 104px; … }`

**Fix:** Zero the horizontal padding on one of the two: `html[data-theme="light"] .page{ padding-left:0 !important; padding-right:0 !important; }` and set `#overviewArea{ padding:16px 16px 96px }`.

### Scroll bottom padding is 208px (104 doubled) instead of 96px
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:97 "scroll bottom padding 96px (clears the floating tab bar)". Prototype: `p:16/16/96/16` on the single `data-scroll` container.

**Deployed:** Both nested containers set 104px bottom padding (`p:16/15/104/15` on `.page.active` and `p:14/14/104/14` on `#overviewArea`), so the card stack ends 208px above the viewport bottom — more than twice the designed clearance, leaving a large dead gap above the tab bar.

**Evidence:** index.html:3021 `html[data-theme="light"] .page{ … padding-bottom:104px !important; }` and index.html:3077 `#overviewArea{ padding:14px 14px 104px; }`

**Fix:** Keep 96px on `#overviewArea` only and set `.page{ padding-bottom:0 !important }` in the light-glass block.

### Floating tab bar is 82% white instead of 62%
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:72 — Phone tab bar `rgba(255,255,255,.62)`. Prototype: `[16,2115,370,64] | div | {"data-tabbar":""} | … | rgba(255, 255, 255, 0.62)`. Dark equivalent (README:77) `rgba(19,26,43,.62)`, prototype `[16,796,370,64] … rgba(19, 26, 43, 0.62)`.

**Deployed:** Live light: `[14,800,366,62] | nav.mob-bottom-nav | {"id":"mobBottomNav","aria-label":"Mobile navigation"} | … | rgba(255, 255, 255, 0.82) | … | bf:blur(28px) saturate(1.7)`. Live dark: `rgba(19, 26, 43, 0.82)`. 20 alpha points too opaque, so content barely reads through the pill.

**Evidence:** index.html:3154 `background:rgba(255,255,255,.82) !important;` and index.html:2961 `.mob-bottom-nav{ background:rgba(19,26,43,.82) !important; … }` vs README.md:72 and :77

**Fix:** Set both to `.62`.

### Tab bar shadow uses a -14px spread, collapsing the designed lift
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:72 — `0 12px 36px rgba(15,28,61,.14)` (no negative spread). Prototype: `sh:rgba(15, 28, 61, 0.14) 0px 12px 36px 0px, rgb(255, 255, 255) 0px 1px 0px 0px inset`.

**Deployed:** Live: `sh:rgba(15, 28, 61, 0.22) 0px 14px 36px -14px` — the -14px spread shrinks the shadow to roughly the pill's own footprint, and the inner white top highlight is gone entirely.

**Evidence:** index.html:3156 `box-shadow:0 14px 36px -14px rgba(15,28,61,.22) !important;`

**Fix:** Use `box-shadow:0 12px 36px rgba(15,28,61,.14), inset 0 1px 0 #fff`.

### Range pill is a flat white button — no blur, wrong size and type scale
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Prototype: `[20,112,139,36] | button | {"data-dc-tpl":"34","data-pill":""} | 13/600/normal/20.15px | … | rgba(255, 255, 255, 0.7) | r:999px | b:1 rgba(255, 255, 255, 0.9) | sh:rgba(15, 28, 61, 0.08) 0px 4px 14px 0px, rgb(255, 255, 255) 0px 1px 0px 0px inset | p:0/12/0/12 | g:8 | bf:blur(16px)`, with 14x14 calendar and chevron-down icons.

**Deployed:** Live: `[16,60,142,44] | button.gdr-btn | {"id":"gdrTabBtn-overview"} | 14/600/normal/normal | … | rgba(255, 255, 255, 0.88) | r:999px | b:1 rgba(255, 255, 255, 0.9) | sh:rgba(15, 28, 61, 0.25) 0px 4px 14px -8px | p:0/14/0/14 | g:8 | bf:-`. No backdrop-filter, no inset white highlight, 88% opaque instead of 70%, label 14px instead of 13px, height 44 instead of 36, and the icons shrink to 12x12 (`[31,76,12,12] | svg`) and 11x11 (`[132,77,11,11] | svg`) instead of 14x14.

**Evidence:** index.html:3051-3054 `html[data-theme="light"] .nd-sub .gdr-btn{ height:40px !important; … background:rgba(255,255,255,.88) !important; box-shadow:0 4px 14px -8px rgba(15,28,61,.25) !important; font-size:14px !important; … padding:0 14px !important; }`

**Fix:** Add `backdrop-filter:blur(16px)`, set `background:rgba(255,255,255,.7)`, `box-shadow:0 4px 14px rgba(15,28,61,.08), inset 0 1px 0 #fff`, `font-size:13px`, `padding:0 12px`, and size the inline svgs to 14px.

### Live badge is a green tint chip instead of a white hairline pill
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Prototype: `[297,118,85,24] | span | {"data-live":""} | 13/600/normal/16.9px | rgb(18, 148, 91) | rgb(255, 255, 255) | r:999px | b:1 rgb(227, 231, 240) | p:0/10/0/10 | g:6` — a white pill with a neutral hairline and a 6px green dot; the green tint is reserved for the delta badge (`[294,277,71,24] … rgb(237, 250, 243)`).

**Deployed:** Live: `[294,69,84,26] | span.nd-live | {"id":"ndLive"} | 12.5/600/-0.084px/normal | rgb(18, 148, 91) | rgb(237, 250, 243) | r:999px | b:- | p:0/11/0/11 | g:6` — it borrows the delta badge's green tint, drops the hairline border, and drops to 12.5px/26px.

**Evidence:** index.html:3055-3056 `html[data-theme="light"] .nd-live{ … height:26px; padding:0 11px; border-radius:999px; background:var(--nd-ok-50); … font-size:12.5px; … }`

**Fix:** Set `background:#fff; border:1px solid var(--nd-200); height:24px; padding:0 10px; font-size:13px` and keep the `::before` dot.

### Mobile refresh button has no spinner at all — the spin rule is desktop-scoped
`Mobile chrome` · mobile · verdict ADJUSTED

**Designed:** README:92 (the auditor cited :93, which is the range/bucket dip row): "| Refresh spinner | `rotate(360deg)` 800ms linear infinite |", applying to the phone refresh control.

**Deployed:** No animation applies at phone width. `@keyframes ndSpin` and `.nd-ico.spin svg{ animation:ndSpin .9s linear infinite }` (index.html:2827-2829) are inside `@media (min-width:961px){` (opened index.html:2682, closed index.html:2915), and no ≤600px rule replaces them. `ndRefresh()` (index.html:6788-6790) adds `.spin` and sets `btn.disabled = true` regardless, so on a phone the button simply greys out with no motion until the promise resolves or the 20s timeout fires.

**Evidence:** index.html:2829 `html[data-theme="light"] .nd-ico.spin svg{ animation:ndSpin .9s linear infinite; }`

**Fix:** Change `.9s` to `.8s`.

### "More" tab opens the desktop sidebar drawer, not a More screen
`Mobile chrome` · mobile · verdict ADJUSTED

**Designed:** The prototype ships a dedicated More screen (`proto-mob-more` capture) reached from tab 5.

**Deployed:** `mbn-more` calls `toggleSidebar()` (index.html:11511), sliding in the opaque desktop `aside.sidebar` — live-mob-light:346 `[-274,0,274,874] | aside.sidebar | … | rgb(255, 255, 255) | … | p:26/18/26/18` — with the full desktop nav, instead of rendering the designed phone More screen inside the existing glass header and tab bar.

**Evidence:** index.html:11513 `<button class="mob-nav-item" id="mbn-more" onclick="toggleSidebar()" aria-label="More">`

**Fix:** Either build the More screen from `proto-mob-more` or restyle the drawer to the phone language; flagging because the tab-bar label promises a screen.

### Range/bucket change never dips content to opacity .35
`Motion` · both · verdict ADJUSTED

**Designed:** README Motion table: "Range/bucket change | content dips to `opacity .35` for 420ms while refetching" — switching range or the attribution bucket fades the card stack to .35 opacity over 420ms until the refetch resolves.

**Deployed:** No dip exists. `grep -n "opacity" index.html` returns exactly one `.35` opacity in the whole file — index.html:602 `.sort-icon { margin-left: 4px; font-size: 11px; opacity: 0.35; }` — and `grep -n "style\.opacity\|\.opacity *=" index.html` returns zero hits, so nothing sets opacity at runtime either. `grep -i "dip\|refetch\|is-loading"` finds only `_gdrRefetch()` (index.html:5725) and comments; no dip class. The only refetch feedback is the global busy bar, which is 3px tall, not 2px: index.html:1022-1023 `#topProgress { position: fixed; top: 0; left: 0; right: 0; height: 3px;` toggled by index.html:5154-5156 `function setBusy(on) { … classList.toggle('on', _busyCount > 0); }`.

**Evidence:** index.html:602 `.sort-icon { margin-left: 4px; font-size: 11px; opacity: 0.35; }` — the sole `.35` opacity in the file; grep for `style.opacity` / `opacity:.35` returns no other hits

**Fix:** Add a `.nd-refetching` class toggled around the range/bucket fetch: `#overviewArea{ transition:opacity 420ms cubic-bezier(.2,0,.2,1) } #overviewArea.nd-refetching{ opacity:.35 }`, set it in the range/bucket change handler and clear it on resolve.

### Drifting canvas tint keyframes absent; tints are static and mobile-only
`Motion` · both · verdict CONFIRMED

**Designed:** Prototype defines `@keyframes nrDrift{0%{transform:translate(0,0)}50%{transform:translate(18px,-22px)}100%{transform:translate(0,0)}}` with the blue blob on `nrDrift 14s ease-in-out infinite` and the mint blob on `nrDrift 18s ease-in-out infinite reverse` (MobileOverview.dc.html:32,34,35; identical in DesktopOverview.dc.html).

**Deployed:** index.html has no `nrDrift` keyframes and no drift animation at all (grep for "Drift" returns 0 hits). The only tint layer is a single static `.app-body::before` with two radial gradients, and it lives inside `@media (max-width:600px)` so desktop has no tint layer whatsoever.

**Evidence:** index.html:3016-3021 `html[data-theme="light"] .app-body::before{ content:""; position:fixed; inset:0; z-index:0; pointer-events:none; background: radial-gradient(420px 320px at -10% 18%, rgba(41,82,255,.10), transparent 70%), radial-gradient(380px 300px at 108% 82%, rgba(25,182,114,.10), transparent 70%); }` — no `animation` property

**Fix:** Add the `nrDrift` keyframes and split the tint into `::before` (blue, 320px, `nrDrift 14s ease-in-out infinite`) and `::after` (mint, 300px, `nrDrift 18s ease-in-out infinite reverse`), and move the rule out of the 600px media query so desktop gets it too.

### Desktop card rise-in uses 420ms cubic-bezier(.2,0,.2,1) from translateY(10px), no scale
`Motion` · desktop · verdict CONFIRMED

**Designed:** 560ms `cubic-bezier(.22,.61,.36,1)` from `opacity 0, translateY(14px) scale(.985)` (README Motion table; DesktopOverview.dc.html:27,36 `animation:nrRise 560ms cubic-bezier(.22,.61,.36,1) both`).

**Deployed:** 420ms `cubic-bezier(.2,0,.2,1)` from `opacity 0, translateY(10px)` with no `scale(.985)`.

**Evidence:** digest live-desk-light.txt `an:0.42s cubic-bezier(0.2, 0, 0.2, 1) both ndcRise` vs proto-desk-light.txt `an:0.56s cubic-bezier(0.22, 0.61, 0.36, 1) both nrRise`; index.html:2837 `@keyframes ndcRise{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }` and index.html:2840 `animation:ndcRise 420ms cubic-bezier(.2,0,.2,1) both;`

**Fix:** Change `ndcRise` to `from{opacity:0;transform:translateY(14px) scale(.985)}` and the shorthand to `animation:ndcRise 560ms cubic-bezier(.22,.61,.36,1) both`.

### Mobile card rise-in is 520ms cubic-bezier(.2,0,.2,1) instead of 560ms cubic-bezier(.22,.61,.36,1)
`Motion` · mobile · verdict ADJUSTED

**Designed:** 560ms `cubic-bezier(.22,.61,.36,1)` (README Motion table; MobileOverview.dc.html:36 `animation:nrRise 560ms cubic-bezier(.22,.61,.36,1) both`). The from-state is correct in the implementation.

**Deployed:** 520ms `cubic-bezier(.2,0,.2,1)` (index.html:3083 `animation:ndRise 520ms cubic-bezier(.2,0,.2,1) both;`; live-mob-light.txt `an:0.52s cubic-bezier(0.2, 0, 0.2, 1) both ndRise`). The from-state IS correct — index.html:3079 `@keyframes ndRise{ from{ opacity:0; transform:translateY(14px) scale(.985) } …}`. The auditor's characterisation of the curve is wrong: `cubic-bezier(.2,0,.2,1)` is not a "symmetric snap" and cards do not "land flat" — with p1=(.2,0) and p2=(.2,1) it eases in slowly then decelerates hard. The real difference is the opposite: the spec curve `cubic-bezier(.22,.61,.36,1)` has p1 y=.61, so it launches fast and settles; the implementation's curve creeps at the start. Net deviation: 40ms short (7%) plus a different entry attack.

**Evidence:** digest live-mob-light.txt `an:0.52s cubic-bezier(0.2, 0, 0.2, 1) both ndRise` vs proto-mob-light.txt `an:0.56s cubic-bezier(0.22, 0.61, 0.36, 1) both nrRise`; index.html:3083 `animation:ndRise 520ms cubic-bezier(.2,0,.2,1) both;`

**Fix:** `animation:ndRise 560ms cubic-bezier(.22,.61,.36,1) both;`

### Bottom sheet animates 280ms from translateY(40px) instead of 420ms from translateY(100%)
`Motion` · both · verdict CONFIRMED

**Designed:** 420ms `cubic-bezier(.32,.72,0,1)` from `translateY(100%)` — a full off-screen push-up (README Motion table; MobileOverview.dc.html:28,58 `@keyframes nrSheet{from{transform:translateY(100%)}to{transform:none}}` … `animation:nrSheet 420ms cubic-bezier(.32,.72,0,1) both`).

**Deployed:** The only sheet in the implementation (the alerts panel) rises 40px with an opacity fade over 280ms on `cubic-bezier(.2,0,.2,1)`. It reads as a popover fade, not a sheet presentation.

**Evidence:** index.html:2974 `@keyframes ndSheet{ from{ transform:translateY(40px); opacity:0 } to{ transform:none; opacity:1 } }` and index.html:2977 `animation:ndSheet 280ms cubic-bezier(.2,0,.2,1) both;`

**Fix:** `@keyframes ndSheet{ from{ transform:translateY(100%) } to{ transform:none } }` and `animation:ndSheet 420ms cubic-bezier(.32,.72,0,1) both;` (keep a separate desktop rule if the panel is popover-anchored above 961px).

### Sheet scrim has no 240ms fade — it snaps in
`Motion` · both · verdict CONFIRMED

**Designed:** Scrim fades in over 240ms (README Motion table: "Bottom sheet | … ; scrim fade 240ms"; MobileOverview.dc.html:29,59 `@keyframes nrFade{from{opacity:0}to{opacity:1}}` … `animation:nrFade 240ms ease-out both`).

**Deployed:** `.nd-alerts-ov` toggles `display:none` → `display:flex` with no animation or transition, so the `rgba(15,28,61,.28)` scrim appears instantly while the panel behind it animates for 280ms.

**Evidence:** index.html:2968-2970 `html[data-theme="light"] .nd-alerts-ov{ position:fixed; inset:0; z-index:400; background:rgba(15,28,61,.28); display:none; align-items:flex-end; justify-content:center; }` / `.nd-alerts-ov.open{ display:flex; }` — no `animation` or `transition` declared

**Fix:** Add `@keyframes ndFade{from{opacity:0}to{opacity:1}}` and `.nd-alerts-ov.open{ animation:ndFade 240ms ease-out both }`.

### Phone drill-down has no 380ms translateX push; it is a 260ms vertical page fade
`Motion` · mobile · verdict ADJUSTED

**Designed:** 380ms `cubic-bezier(.32,.72,0,1)`, `translateX(100% → 0)` (README Motion table; MobileOverview.dc.html:57 `[data-sub]{…transition:transform 380ms cubic-bezier(.32,.72,0,1) !important}` over the sub-screen at line 470).

**Deployed:** The mobile KPI cards are not modals. index.html:7106 / 7110 / 7114 / 7120 render them as `<button class="nd-card nd-kpi" onclick="switchTab('revenue')">` etc., so tapping one performs a top-level tab switch, animated by index.html:2283 `.page.active{ animation:nrPageIn .26s cubic-bezier(.32,.72,0,1); }` over index.html:2262 `@keyframes nrPageIn{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }`. The live capture confirms it: live-mob-light.txt `an:0.26s cubic-bezier(0.32, 0.72, 0, 1) nrPageIn`. So the easing matches spec but the motion is a 260ms 8px vertical fade-up, not a 380ms full-width horizontal push, and there is no sub-screen stack. The `.modal` / `modal-in 0.18s` at index.html:987-989 is the generic dialog (settings, confirm), not the drill-down, so the auditor looked at the wrong element.

**Evidence:** index.html:987 `animation: modal-in 0.18s ease;` and index.html:989 `@keyframes modal-in { from { opacity: 0; transform: scale(0.97) translateY(8px); } }`

**Fix:** Give the phone drill-down a positioned sub-screen layer with `transition:transform 380ms cubic-bezier(.32,.72,0,1)` toggling `translateX(100%)` → `translateX(0)`, rather than reusing `.modal`.

### Desktop popover opens with a 120ms downward fade instead of a 220ms rise-in
`Motion` · desktop · verdict CONFIRMED

**Designed:** 220ms rise-in — the same `nrRise` curve family (README Motion table: "Desktop popover | 220ms rise-in"; DesktopOverview.dc.html:91 `[data-desk] [data-pop]{animation:nrRise 220ms cubic-bezier(.22,.61,.36,1) both}`), i.e. from `opacity 0, translateY(14px) scale(.985)`.

**Deployed:** The shared range/date popover animates `gdrFade .12s ease` from `translateY(-4px)` — 120ms, wrong easing, and the element drops *downward* into place instead of rising.

**Evidence:** index.html:4524 `<div id="gdrSharedDrop" style="…animation:gdrFade .12s ease;">` with index.html:812 `@keyframes gdrFade { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`

**Fix:** Point the popover at the rise-in keyframe: `animation:ndRise 220ms cubic-bezier(.22,.61,.36,1) both` (reuse `ndcRise`/`ndRise` once its from-state is corrected).

### Glass segmented thumb uses the 320ms base curve, not the 460ms overshoot
`Motion` · mobile · verdict CONFIRMED

**Designed:** On glass surfaces the thumb slides 460ms `cubic-bezier(.34,1.3,.64,1)` — an overshoot settle (README Motion table: "Segmented thumb slide | 320ms `cubic-bezier(.32,.72,0,1)`; glass 460ms `cubic-bezier(.34,1.3,.64,1)`"; MobileOverview.dc.html:44 `[data-glass="true"] [data-thumb]{…transition:transform 460ms cubic-bezier(.34,1.3,.64,1),width 200ms !important}`).

**Deployed:** The mobile attribution segmented control is a glass surface (translucent card stack, `backdrop-filter:blur(20px) saturate(1.5)`) yet its thumb keeps the 320ms non-glass timing, so the thumb has no overshoot.

**Evidence:** index.html:3068-3069 `box-shadow:0 2px 8px -2px rgba(15,28,61,.18); transition:transform 320ms cubic-bezier(.32,.72,0,1); transform:translateX(var(--seg-x,0));`

**Fix:** In the `@media (max-width:600px)` glass block override to `transition:transform 460ms cubic-bezier(.34,1.3,.64,1)`; leave the desktop flat console thumb at 320ms.

### The four KPI cards get no stagger at all — the delay lands on their wrapper, which has no animation
`Motion` · both · verdict ADJUSTED

**Designed:** The prototype anticipates exactly this nesting and adds a second rule for cards inside a wrapper: DesktopOverview.dc.html:39 and MobileOverview.dc.html:39 `[data-glass="true"] [data-scroll]>div>[data-card]:nth-child(2){animation-delay:60ms}…:nth-child(3){120ms}…:nth-child(4){180ms}`, so the four KPI tiles cascade at 0 / 60 / 120 / 180ms — proto-desk-light.json shows `button:0` at no delay, `button:1` 0.06s, `button:2` 0.12s, `button:3` 0.18s.

**Deployed:** Not a 6th-card problem — the live `#overviewArea` has exactly five direct children. cap/live-desk-light.json paths: `…/div:2/div:0` (hero), `…/div:2/div:1/button:0-3` (four KPI buttons), `…/div:2/div:2`, `/div:3`, `/div:4`. Children 3-5 do receive 0.1s/0.15s/0.2s. The defect is that the four KPI buttons sit inside wrapper `div:1`, which is child 2: the wrapper takes `animation-delay:50ms` but carries no animation (capture shows `animation: 0s 0.05s` on `…/div:2/div:1`), while the four `.ndc` buttons inside it match neither nth-child rule and all animate at delay 0 — they rise in unison. index.html has no `>div>` descendant rule to cover them. Separately, the prototype's stagger runs to nth-child(6) on mobile (MobileOverview.dc.html:38) and nth-child(8) on desktop (DesktopOverview.dc.html:104), while the implementation stops at (5) — latent, not yet visible, since no 6th child exists.

**Evidence:** digest live-desk-light.txt ` 5 an:0.42s cubic-bezier(0.2, 0, 0.2, 1) both ndcRise` (five undelayed) vs proto-desk-light.txt which has single cards at `0.06s`, `0.12s`, `0.18s`, `0.24s`, `0.3s`, `0.36s`; index.html:2841-2845 and index.html:3084-3087 define only four `:nth-child` delays

**Fix:** Replace the four hard-coded rules with a generated set covering the real card count (or `animation-delay:calc(var(--i) * 60ms)` with `--i` set per card in the render loop).

### Screen is named "Marketing Report", not "CEO Report"
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Topbar title and header read "CEO Report" (README §2 heading "### 2. CEO Report (phone tab 2 · desktop page)"; proto topbar `TXT«CEO Report»`).

**Deployed:** Topbar reads "Marketing Report" and the page heading reads "Marketing report".

**Evidence:** live-desk-report.txt: `[272,15,366,22] | b | {"id":"ndDeskTitle"} | 20/800/-0.4px/22px | ... | TXT«Marketing Report»` vs proto-desk-report.txt `[272,12,112,26] | span.sc-interp | 20/800/-0.4px/22px | ... | TXT«CEO Report»`

**Fix:** Rename the report title string to "CEO Report" in the topbar map and the page header.

### Export button is a bordered secondary button, not the accent share-2 pill, and fires no toast
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** One accent Export button: blue fill with blue glow and a `share-2` icon — proto `[1270,121,121,34] | button | 13/700/-0.13px | rgb(255,255,255) | rgb(41,82,255) | r:999px | sh:rgba(41,82,255,0.22) 0px 8px 20px 0px | TXT«Export PDF»` with `[1285,131,14,14] | span | {"data-icon":"share-2"}` — that toasts "Report exported · A4 PDF ready to share" (README:118).

**Deployed:** `Export PDF` is a white bordered secondary button with 4px radius and no icon, sitting in a row of four buttons; it calls `window.print()` and shows no toast.

**Evidence:** live-desk-report.txt: `[989,93,108,38] | button.btn.btn-secondary.no-print | 13/600 | r:4px | b:1 rgb(231, 231, 228) | sh:- | TXT«Export PDF»`; index.html:11998 `if (fmt === 'pdf') { window.print(); return; }   // user picks "Save as PDF"`

**Fix:** Make the primary Export action an accent pill (bg `--action-500`, r:999px, blue glow shadow, `share-2` icon) and fire the toast "Report exported · A4 PDF ready to share" on click.

### Three undesigned buttons added next to Export in the report header
`Report / Creators / Search` · desktop · verdict ADJUSTED

**Designed:** Header card carries one action: Export (README:118).

**Deployed:** Four buttons render: "Influencer data", "Export PDF", "Export PNG", "Refresh".

**Evidence:** live-desk-report.txt: `[845,93,132,38] | button.btn.btn-ghost.no-print | ... | TXT«Influencer data»`, `[1109,93,112,38] | ... | TXT«Export PNG»`, `[1233,93,108,38] | ... | TXT«Refresh»`

**Fix:** Keep Export only in the header (refresh already exists in the topbar); move "Influencer data" to the Creators screen as the designed "Add post data" entry point.

### Seven report KPI tiles wrapping onto two rows instead of a single 6-up row
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Six tiles in one desktop row: Signups, Sales, Conv, Revenue, Spend, ROAS · CAC (README:118). Proto: six tiles in one 1094px-wide track, `[297,175,1094,86] | div | ... | g:12`, CAC folded into the ROAS tile caption `TXT«₹2,717 per sale»`.

**Deployed:** Seven separate tiles on an auto-fill grid; the 7th (CAC) wraps to a second row at y=309.

**Evidence:** live-desk-report.txt: `[339,309,155,78] | div.rep-kpi | ...` with `[358,326,117,26] | div.rep-kpi-num | TXT«₹294»` / `[358,357,117,14] | div.rep-kpi-label | TXT«CAC»`; index.html:11775-11783 renders 7 `kpiCard(...)` calls including `kpiCard('₹'+_nf(Math.round(cac)), 'CAC')`

**Fix:** Merge CAC into the ROAS tile as its caption line ("₹{cac} per sale") and fix the grid to 6 columns on desktop.

### Report KPI tile styling inverted and off-spec (value/label order, radius, fill, colour, accent bar)
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Label above value: 10/700/0.8px muted eyebrow, then the value at 22/800/-0.44px in ink `rgb(15,28,61)`; tile is a 12px-radius flat tile filled `rgb(245,247,255)` with no border and no accent bar. Proto: `[297,175,172,86] | div | ... | rgb(245, 247, 255) | r:12px | b:- | p:14/14/12/14 | g:3`.

**Deployed:** Value first at 24/800/-0.96px in blue `rgb(0,71,194)`, label below at 10.5/700/0.735px; tile is white with a 1px border, 6px radius and a 3px blue top accent bar.

**Evidence:** live-desk-report.txt: `[339,217,155,78] | div.rep-kpi | ... | rgb(255, 255, 255) | r:6px | b:1 rgb(231, 231, 228)` and `[358,234,117,26] | div.rep-kpi-num | 24/800/-0.96px/26.4px | rgb(0, 71, 194)`; index.html:898 `.rep-kpi::before { ... height:3px; ... background:var(--blue); }`

**Fix:** Reorder to label-then-value, set value 22/800/-0.44px in `--ink-900`, tile radius 12px on `--neutral-50` fill with no border and remove the `::before` accent bar.

### KPI tile caption lines dropped
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Each tile carries an 11/500 caption under the value: "+33.7%", "+5 vs prior", "signup → paid", "₹21,440 + $96", "creators + ads", "₹2,717 per sale".

**Deployed:** Tiles render value + label only; no third line.

**Evidence:** proto-desk-report.txt: `[311,235,41,14] | span.sc-interp | 11/500/normal/14.3px | ... | TXT«+33.7%»`, `[680,235,73,14] | ... | TXT«signup → paid»`; index.html:11772-11773 `const kpiCard = (num, label) => \`<div class="rep-kpi"><div class="rep-kpi-num">${num}</div><div class="rep-kpi-label">${label}</div></div>\`;`

**Fix:** Extend `kpiCard` to a third `rep-kpi-cap` slot and pass the designed caption per metric.

### Creator content block is shown only in Influencer, but the design hides it only in Perf
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Views / Likes / Comments / Shares plus engagement rate and cost per view render in Influencer AND Overall — "**Creator content** (hidden in Perf)" (README:121); proto renders it in the Overall capture (`TXT«Creator content»`, `TXT«Views»`, `TXT«Engagement»`, `TXT«Cost per view»`).

**Deployed:** The block is gated to the Influencer bucket only, so it is absent in Overall; the live Overall capture has no such section.

**Evidence:** index.html:11786 `if (BUCKET_VIEW === 'influencer') {` guards the `rep-social` block (index.html:11791 `<div class="rep-social-head">Influencer social metrics</div>`); live-desk-report.txt (bucket Overall, `button.bkt.is-on | {"data-view":"overall"}`) contains no Views/Likes/Comments/Shares section.

**Fix:** Change the guard to `BUCKET_VIEW !== 'perf'` and retitle the block "Creator content".

### Influencer vs Perf column headers use violet/blue instead of --success-600 / --amber-700
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Influencer header in `--success-600` `rgb(18,148,91)` and Perf header in `--amber-700` `rgb(180,116,14)` (README:122).

**Deployed:** Influencer header is violet `rgb(91,87,214)`; Perf header is blue `rgb(0,71,194)`.

**Evidence:** live-desk-report.txt: `[358,1110,456,24] | div.rep-compare-col-head | 11/700/0.77px | rgb(91, 87, 214) | ... | TXT«Influencer»` and `[866,1110,456,24] | div.rep-compare-col-head | ... | rgb(0, 71, 194) | ... | TXT«Performance (paid)»`; proto-desk-report.txt `[1259,352,77,17] | span | ... | rgb(18, 148, 91) | ... | TXT«Influencer»`, `[1364,352,31,17] | span | ... | rgb(180, 116, 14) | ... | TXT«Perf»`; index.html:918-919 `.rep-compare-col.rc-infl .rep-compare-col-head { color:var(--violet); }` / `.rc-perf ... { color:var(--blue-text); }`

**Fix:** Point `.rc-infl` head at `--success-600` and `.rc-perf` head at `--amber-700`.

### Influencer vs Perf rendered as two stacked cards labelled "Performance (paid)" instead of one 6-row two-column comparison
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** One block titled "Influencer vs Perf" at 15/700/-0.15px with a single label column and two value columns headed "Influencer" and "Perf" (README:122); proto `[776,315,619,31] | div | 15/700/-0.15px | TXT«Influencer vs Perf»` with rows `TXT«Spend»` → `₹31,000` / `₹34,200` on one line.

**Deployed:** Section title is an uppercase 12/700/0.84px eyebrow "Influencer vs Performance" over two side-by-side cards, each repeating all six labels; right column is headed "Performance (paid)".

**Evidence:** live-desk-report.txt: `[339,1067,1002,16] | div.rep-section-title | 12/700/0.84px | ... | TXT«Influencer vs Performance»`, plus duplicated `span.rep-compare-lbl | TXT«Spend»` at x=358 and x=866; index.html:11931-11938

**Fix:** Render one comparison table (label column + two value columns) titled "Influencer vs Perf" with column heads "Influencer" and "Perf".

### Report table sorted by signups, not revenue
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Rows sorted by revenue, with the caption "sorted by revenue" (README:123; proto `[1288,649,103,19] | span | 12/500 | TXT«sorted by revenue»`).

**Deployed:** Rows sorted descending by signups and no sort caption is shown.

**Evidence:** index.html:11838 `}).sort((a,b)=>b.signups-a.signups);`; live-desk-report.txt signup column runs 6,654 → 453 → 127 → 69 → 31 → 25 → 13 → 7 …

**Fix:** Sort by revenue descending and render the "sorted by revenue" caption in the table header.

### Creator column prints the raw code/campaign id (and literal "null"), not name + code
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** First column shows the creator/campaign name at 13/600 with the code beneath at 11/500 — proto `[297,713,89,17] | span.sc-interp | 13/600 | TXT«MoonXShruthi»` over `[297,734,48,14] | span.sc-interp | 11/500 | TXT«YUBC4W»`.

**Deployed:** Single-line raw code strings, including an untreated `null` for the missing-code bucket.

**Evidence:** live-desk-report.txt: `[340,470,230,45] | td | 13.5/600/-0.084px | ... | TXT«null»`, `[340,515,230,45] | td | ... | TXT«ugc_instagram_influencer»`; index.html:11841 `<td style="font-weight:600">${h(r.code)}</td>`

**Fix:** Render a two-line cell (display name over code) and map the empty-code bucket to a real label instead of `null`.

### Report content column is 1002px wide vs 1144px in the prototype
`Report / Creators / Search` · desktop · verdict ADJUSTED

**Designed:** Content spans the full 1144px available inside the 248px sidebar + 24px page padding — proto `[272,95,1144,187] | div | {"data-dc-tpl":"172","data-card":""}`.

**Deployed:** Report page is capped so content is 1002px wide starting at x=339.

**Evidence:** live-desk-report.txt: `[315,69,1058,831] | section.page.active | {"id":"page-report"} | ... | p:24/24/24/24` with `[339,93,1002,104] | div.ov-head`

**Fix:** Raise the report page max-width so content measures ~1144px at a 1440px viewport.

### ROAS threshold colouring absent on the Creators screen
`Report / Creators / Search` · both · verdict CONFIRMED

**Designed:** ROAS values coloured by threshold — proto amber `rgb(180, 116, 14)` for 0.75× / 0.67× / 1.00× and danger `rgb(229, 72, 77)` for 0.50×.

**Deployed:** No ROAS value is rendered at all; the only threshold colouring is on a conversion-rate percentage (`cv-good` ≥20%, `cv-mid` ≥5%).

**Evidence:** proto-desk-creators.txt: `[1354,307,37,17] | span.sc-interp | 13/700 | rgb(180, 116, 14) | ... | TXT«0.75×»` and `[1354,531,37,17] | ... | rgb(229, 72, 77) | ... | TXT«0.50×»`; index.html:9668 `const cvCls = r.convRate >= 20 ? 'cv-good' : r.convRate >= 5 ? 'cv-mid' : 'cv-low';`

**Fix:** Compute ROAS per creator and apply the success/amber/danger thresholds used in the prototype.

### "Add post data" entry point is missing from the Creators screen
`Report / Creators / Search` · both · verdict ADJUSTED

**Designed:** An "Add post data" button on the Creators screen opens the entry form — README:127; proto `[1251,220,140,34] | button | 13/700/-0.13px | r:999px | ... | TXT«Add post data»` next to the "Creators · {range}" card title.

**Deployed:** No such control on the Creators screen, and the label "Add post data" appears nowhere in index.html. The equivalent modal is reachable only from two off-screen entry points, both labelled "Influencer data": the Report page header (index.html:4671) and the Settings panel (index.html:4704).

**Evidence:** `grep -ni "add post data" index.html` returns nothing; index.html:4671 `<button class="btn btn-ghost no-print" onclick="openCreatorForm()" title="Log manual influencer campaign metrics">Influencer data</button>`

**Fix:** Add an "Add post data" pill button to the Creators card header wired to `openCreatorForm()`.

### Search field is 44px tall with a 4px radius, not 52px with a 14px radius
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** 52px tall, radius 14px on desktop (README:130); proto `[272,95,760,52] | div | {"data-dc-tpl":"260","data-pill":""} | ... | r:14px` with the input at 15/500.

**Deployed:** 44px tall, radius 4px, wrapped in an extra 683px white "search-box" card.

**Evidence:** live-desk-search.txt: `[527,118,537,44] | input.search-input | {"id":"searchInput"} | 15/400/normal | ... | r:4px | ... | p:11/16/11/42`; index.html:215-218 `.search-input { width:100%; padding: 11px 16px 11px 42px; ... border-radius: var(--radius); font-size:15px; ... }`

**Fix:** Set the desktop field to 52px height and `border-radius:14px`, and drop the enclosing box so the field is the pill itself.

### No clear button when the search field is dirty
`Report / Creators / Search` · both · verdict CONFIRMED

**Designed:** A clear button appears inside the field once it has content (README:130).

**Deployed:** The field markup has only the leading `search-icon`, the input and a suggestions dropdown; the only clear affordance is a "Back" link rendered inside a results card after a search runs.

**Evidence:** index.html:3356-3362 (`<svg class="ic search-icon">…<input class="search-input" id="searchInput" …><div class="suggestions" …>`) — no clear control; index.html:7584 `<button class="link-btn" onclick="clearSearch()" …> Back</button>`

**Fix:** Add a trailing clear (`x`) button inside the field, shown whenever `searchInput.value` is non-empty, wired to `clearSearch()`.

### Quick-filter chips are absent from the search empty state
`Report / Creators / Search` · both · verdict CONFIRMED

**Designed:** Three quick-filter chips: "Pro users 164", "Influencer signups 46", "Paid this week 24" (README:130); proto `[272,163,129,32] | button | ... | r:999px | ... | TXT«Pro users»` + `TXT«164»`, `TXT«Influencer signups»` + `TXT«46»`, `TXT«Paid this week»` + `TXT«24»`.

**Deployed:** No quick-filter chips. The empty state instead shows four "suggestion" panels: Recent Signups, Abandoned Checkout, Expiring Soon, Pro Users.

**Evidence:** live-desk-search.txt: `[504,293,331,37] | div.sugg-title | ... | TXT«Recent Signups»`, `[853,293,331,37] | ... | TXT«Abandoned Checkout»`, `[504,755,331,37] | ... | TXT«Expiring Soon»`, `[853,755,331,37] | ... | TXT«Pro Users»`; index.html:3373-3390

**Fix:** Render the three designed quick-filter chips above the empty state and wire each to its filtered result set.

### "Recent lookups" list replaced by a row of small "Recent" chips
`Report / Creators / Search` · both · verdict CONFIRMED

**Designed:** A card titled "Recent lookups" with 52px rows: `history` icon, email at 14/600 and "name · plan" at 12/500 — proto `[293,212,718,37] | div | 11/700/0.88px | TXT«Recent lookups»` over `[293,249,718,52] | button | {"data-row":""} | r:8px | ... | g:12` rows.

**Deployed:** A label "Recent" with bare 26px email chips, no icon, no name/plan line and no card.

**Evidence:** live-desk-search.txt: `[527,206,45,14] | span.chip-group-label | 10/700/0.6px | ... | TXT«Recent»` and `[579,200,171,26] | span.chip | 12/600 | r:4px | ... | TXT«nikhil.r162004@gmail.com»`

**Fix:** Render recent lookups as a titled card of 52px rows with the `history` icon, email and name · plan subline.

### Search results expand inline instead of compact rows with a chevron opening the person drawer
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Result rows are avatar, name, email, plan badge, chevron → person drawer (README:130; README:153 desktop drawer = 460px right-hand panel over a scrim); proto shows the 460px drawer shell `[1440,0,460,799] | div | {"data-dc-tpl":"315","data-sub":""} | ... | bf:blur(32px) saturate(1.7)`.

**Deployed:** A match renders a large inline result card with field rows, a quick-stats strip (Plan / Subscription / AI Credits), nested résumé blocks and a "Back" link; there is no chevron and no person drawer.

**Evidence:** index.html:7794 `function renderSearchResults(rows, type, meta = {}, searchedEmail = '')` building `result-stats` / `resumes-block` / `rfField(...)` markup, and index.html:7795 `const backLink = … clearSearch() … Back`

**Fix:** Render results as compact rows (avatar, name, email, plan badge, chevron) and move the detail into the 460px person drawer.

### Phone header screen title is 19px instead of 17px
`Typography` · mobile · verdict CONFIRMED

**Designed:** README Typography table, "Screen title (phone header) | 17px / 700 / -0.02em". Prototype: 17px / 700 / -0.34px (= -0.02em).

**Deployed:** 19px / 700 / -0.38px (= -0.02em). Size is 2px over; weight and tracking are correct.

**Evidence:** digest live-mob-light.txt: `[57,12,85,22] | b | {"id":"ndPageTitle"} | 19/700/-0.38px/21.85px | … | TXT«Overview»` vs proto-mob-light.txt: `[58,66,78,22] | span.sc-interp |  | 17/700/-0.34px/20.4px | … | TXT«Overview»`; index.html:3036 `html[data-theme="light"] .nd-ttl b{ font-size:19px; font-weight:700; letter-spacing:-.02em; line-height:1.15; … }`

**Fix:** index.html:3036 — change `font-size:19px` to `17px`. Same value renders in dark (live-mob-dark.txt).

### Phone KPI card value is 24px / 700 instead of 22px / 800
`Typography` · mobile · verdict CONFIRMED

**Designed:** README Typography table, "KPI value | 22px / 800 / -0.02em" (the clamp() variant is explicitly scoped to desktop cards). Prototype phone: 22px / 800 / -0.44px.

**Deployed:** 24px / 700 / -0.48px on all four KPI tiles (Revenue, Active Pro, Signed up & paid, Payers · ARPU). Size +2px and weight one step light.

**Evidence:** digest live-mob-light.txt: `[46,542,123,26] | b |  | 24/700/-0.48px/26.4px | rgb(15, 28, 61) | … | TXT«₹1,22,213»` vs proto-mob-light.txt `22px/800/-0.44px/24.2px` on the same tile; index.html:3116 `html[data-theme="light"] .nd-kpi b{ font-size:24px; font-weight:700; letter-spacing:-.02em; line-height:1.1; … }`

**Fix:** index.html:3116 — `font-size:22px; font-weight:800;`. Confirmed identical in dark (live-mob-dark.txt shows 24/700/-0.48px on all four).

### Phone section title is 17px / -0.015em instead of 15px / -0.01em
`Typography` · mobile · verdict CONFIRMED

**Designed:** README Typography table, "Section title | 15px / 700 / -0.01em". Prototype phone: 15px / 700 / -0.15px (= -0.01em).

**Deployed:** 17px / 700 / -0.255px (= -0.015em) on every card heading (Acquisition, Recent signups, Recent payments). The desktop build of the same role is correct at 15/700/-0.15px, so the phone rule is the outlier.

**Evidence:** digest live-mob-light.txt: `[48,791,92,23] | b |  | 17/700/-0.255px/normal | … | TXT«Acquisition»` vs proto-mob-light.txt: `[37,778,81,23] | span | {"data-dc-tpl":"87"} | 15/700/-0.15px/23.25px | … | TXT«Acquisition»`; index.html:3123 `html[data-theme="light"] .nd-list-h b{ font-size:17px; font-weight:700; letter-spacing:-.015em; … }`

**Fix:** index.html:3123 — `font-size:15px; letter-spacing:-.01em;`.

### Phone eyebrow labels are 11.5px / 600 / 0.07em instead of 11px / 700 / 0.08em
`Typography` · mobile · verdict CONFIRMED

**Designed:** README Typography table, "Eyebrow / table header | 11px / 700 / 0.08em / uppercase". Prototype phone: 11px / 700 / 0.88px (= 0.08em) uppercase. The desktop build gets this right (index.html:2846 → rendered 11/700/0.88px).

**Deployed:** 11.5px / 600 / 0.805px (= 0.07em) uppercase on every phone eyebrow (New signups, Revenue, Active Pro, Signed up & paid, Payers · ARPU). All three axes are off.

**Evidence:** digest live-mob-light.txt: `[50,232,286,16] | div.nd-lbl |  | 11.5/600/0.805px/normal | rgb(112, 119, 139) | … | TXT«New signups · Last 7 days»` vs proto-mob-light.txt `11/700/0.88px` uppercase on the same label; index.html:3088 `html[data-theme="light"] .nd-lbl{ font-size:11.5px; font-weight:600; letter-spacing:.07em; text-transform:uppercase; … }`

**Fix:** index.html:3088 — `font-size:11px; font-weight:700; letter-spacing:.08em;` (matching the desktop rule at index.html:2846).

### Body copy ships line-height:normal (~1.33–1.38) instead of 1.45–1.55
`Typography` · both · verdict CONFIRMED

**Designed:** README Typography table, "Body | 13–14px / 500–600, line-height 1.45–1.55". Prototype resolves every text node to an explicit ratio: 13px→20.15px (1.55), 12px→18.6px (1.55), 11px→17.05px (1.55), 13.5px→20.925px (1.55), 14px→21.7px (1.55).

**Deployed:** 113 of 124 text-bearing nodes on live desktop and 93 of 108 on live mobile compute lineHeight:"normal". Measured line boxes: 13.5px text → 18px box (1.33), 13px → 18px (1.38), 11px → 15px (1.36). Text sits visibly tighter than the approved rhythm on every list, table and card.

**Evidence:** digest live-desk-light.txt: `[734,566,220,18] | b |  | 13.5/600/-0.084px/normal | … | TXT«Machine»` (18px box on 13.5px type) vs proto-desk-light.txt `14px/600/normal/21.7px`; raw JSON lineHeight histogram — live-desk-light: {normal:113, 25.344px:4, 13px:3, 17.6px:2, 22px:1, 48px:1}; proto-desk-light: {20.15px:55, 18.6px:45, 17.05px:28, 20.925px:19, 21.7px:9, 16.9px:5}.

**Fix:** Add an explicit `line-height:1.5` to the body/base rule and to the card, list-row and table-cell rules rather than relying on the font's `normal` metric.

### Body and meta text render at weight 400, which is outside the 500–600 / 500 scale
`Typography` · both · verdict CONFIRMED

**Designed:** README Typography table: "Body | 13–14px / 500–600" and "Meta, captions | 11–12px / 500". Prototype uses 500/600 throughout — e.g. list-row secondary line 12px/500, table body cells 13px/500.

**Deployed:** Live renders large swaths of secondary text at weight 400: phone list-row email 13px/400, phone row meta 12.5px/400, phone chart x-labels 11px/400, desktop report table body 13.5px/400 (172 nodes on live-desk-report), report keyword labels 11px/400 (51 nodes), search suggestion emails 11px/400.

**Evidence:** digest live-mob-light.txt: `[101,1186,196,18] | s |  | 13/400/-0.084px/normal | rgb(112, 119, 139) | … | TXT«saniyabegum317@gmail.com»`; index.html:3132 `html[data-theme="light"] .nd-rmid s{ text-decoration:none; font-size:13px; font-weight:400; … }`; index.html:3137 `html[data-theme="light"] .nd-rend s{ … font-size:12.5px; font-weight:400; … }`; index.html:592 `table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 980px; }` (inherits body weight 400)

**Fix:** Raise these to 500: index.html:3132, 3137, 3145 and the phone x-label rule; add `font-weight:500` to the `table` rule at index.html:592. Also cap the phone row title at index.html:3130 (currently 15px/600) to the 13–14px body range.

### Report KPI value is 24px / -0.04em instead of 22px (or the desktop clamp) / -0.02em
`Typography` · desktop · verdict ADJUSTED

**Designed:** clamp(18px,1.6vw,26px) → 23.04px at the captured 1440px viewport, weight 800, tracking -0.02em (-0.4608px) — exactly what the Overview KPI cards already render (digest/live-desk-light.txt, 4 nodes at 23.04/800/-0.4608px). README: "KPI value | 22px / 800 / -0.02em (desktop cards clamp(18px,1.6vw,26px))".

**Deployed:** 24px / 800 / -0.96px (-0.04em) hard-coded on all 7 report KPI tiles (index.html:899): tracking is double the token, weight is correct, and the size is fixed at 0.96px above the clamp value instead of tracking the viewport.

**Evidence:** digest live-desk-report.txt: `[358,234,117,26] | div.rep-kpi-num |  | 24/800/-0.96px/26.4px | rgb(0, 71, 194) | … | TXT«9,072»` vs proto-desk-report.json KPI signature ('22px','800','-0.44px'); index.html:899 `.rep-kpi-num { font-size:24px; font-weight:800; letter-spacing:-0.04em; font-variant-numeric:tabular-nums; line-height:1.1; … }`

**Fix:** index.html:899 — `font-size:clamp(18px,1.6vw,26px); letter-spacing:-0.02em;`.

### Table headers render at 0.12em tracking instead of 0.08em
`Typography` · desktop · verdict CONFIRMED

**Designed:** README Typography table, "Eyebrow / table header | 11px / 700 / 0.08em / uppercase (10px in dense grids)". Prototype eyebrows/headers are uniformly 11px/700/0.88px (= 0.08em) or 10px/700/0.8px (= 0.08em) in dense contexts — tracking is 0.08em at both sizes.

**Deployed:** 10px / 700 / 1.2px (= 0.12em) uppercase on all 16 `th` cells of the report tables — half again the specified tracking. Three separate `th` rules disagree with each other in the file (index.html:596 says 0.06em, 1440 says 9.5px/800/0.07em, 2459 wins at 10px/0.12em).

**Evidence:** digest live-desk-report.txt: `[340,435,230,36] | th |  | 10/700/1.2px/normal | rgb(138, 138, 146) | … | TXT«Creator / Code»`; index.html:2458-2459 `html[data-theme="light"] :is(.nav-label,.nb-ai-k,.cmdk-sec,.ov-card-note,.ocard-note,thead th,.result-stat-label,.rf-label){ font-size:10px !important; font-weight:700 !important; letter-spacing:.12em !important; text-transform:uppercase !important; … }`

**Fix:** index.html:2459 — `letter-spacing:.08em !important`, and delete the two dead `th` declarations at index.html:596 and 1440 so one rule owns the role.

### Report eyebrows use 0.07em tracking and three off-scale sizes (10.5 / 11 / 12px)
`Typography` · desktop · verdict CONFIRMED

**Designed:** README Typography table, "Eyebrow / table header | 11px / 700 / 0.08em / uppercase (10px in dense grids)" — two permitted sizes (11px, 10px), one tracking (0.08em). Prototype report uses exactly 11px/700/0.88px and 10px/700/0.8px.

**Deployed:** Three additional eyebrow variants on the report screen, all at 0.07em: `.rep-kpi-label` 10.5px/700/0.735px, `.rep-compare-col-head` 11px/700/0.77px, `.rep-section-title` 12px/700/0.84px. None of 10.5px or 12px is in the scale, and none of the three hits 0.08em.

**Evidence:** digest live-desk-report.txt: `[358,264,117,14] | div.rep-kpi-label |  | 10.5/700/0.735px/normal | rgb(138, 138, 146) | … | TXT«Signups»`; index.html:900 `.rep-kpi-label { font-size:10.5px; font-weight:700; … letter-spacing:0.07em; }`; index.html:907 `.rep-section-title { font-size:12px; font-weight:700; … letter-spacing:0.07em; … }`; index.html:917 `.rep-compare-col-head { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; … }`

**Fix:** Set all three to `letter-spacing:.08em`; change index.html:900 to 10px (dense-grid variant) and index.html:907 to 11px.

### Sidebar brand eyebrow is 8.5px / 0.22em, below the 10px floor and nearly 3× the specified tracking
`Typography` · both · verdict CONFIRMED

**Designed:** README Typography table, "Eyebrow / table header | 11px / 700 / 0.08em / uppercase (10px in dense grids)", plus "Minimum text size on phone: 10px (eyebrows only)". The prototype's equivalent brand eyebrow is 10px / 700 / 0.8px (= 0.08em).

**Deployed:** 8.5px / 700 / 1.87px (= 0.22em) — 1.5px under the absolute floor and 0.14em over the specified tracking. Visible on desktop and inside the phone nav drawer. The app also renders a second, correct brandmark (`.nd-brandmark` 10/700/0.8px uppercase) a few pixels away, so both a compliant and a non-compliant version of the same eyebrow ship together.

**Evidence:** digest live-desk-light.txt: `[60,43,78,12] | span.logo-sub |  | 8.5/700/1.87px/normal | rgb(138, 138, 146) | … | TXT«ANALYTICS»` (also present in live-mob-light.txt at `[-193,63,78,12]`); index.html:1398 `.logo-sub{ font-size:8.5px; letter-spacing:.22em; font-weight:700; color:var(--text-3); }` — this overrides the earlier, closer index.html:140-142 `.logo-sub { font-size: 10px; font-weight: 600; … letter-spacing: 0.07em; … }`

**Fix:** index.html:1398 — `font-size:10px; letter-spacing:.08em;` (or drop the duplicate `.logo-sub` entirely and keep only `.nd-brandmark`).

### Report screen carries a 30px / 700 page heading that is not in the type scale
`Typography` · desktop · verdict CONFIRMED

**Designed:** README Typography table tops out at "Page title (desktop topbar) | 20px / 800 / -0.02em" for titles and "Hero metric (desktop) | 48px" for figures; there is no 30px role. The prototype report screen has no heading between 22px and 48px — its largest non-metric text is the 20px/800 topbar title (proto-desk-report signature ('20px','800','-0.4px')).

**Deployed:** `.home-title` renders at 30px / 700 / -0.9px (= -0.03em) directly under the correct 20px/800 topbar title, so the report shows two competing page titles at two off-scale weights.

**Evidence:** digest live-desk-report.txt: `[339,93,417,41] | div.home-title |  | 30/700/-0.9px/normal | rgb(10, 10, 10) | … | TXT«Marketing report»`; index.html:2452 `html[data-theme="light"] .home-title{ font-size:30px !important; font-weight:700 !important; letter-spacing:-.03em !important; color:var(--text) !important; }`

**Fix:** Either bring `.home-title` onto the page-title row (20px / 800 / -0.02em) at index.html:2452, or hide it and let the topbar title stand alone as the prototype does.

### Alerts opens as an ad-hoc overlay sheet/popover instead of the designed drill-down
`Widgets & alerts` · both · verdict CONFIRMED

**Designed:** Alerts is drill-down `sub='alerts'`. Phone: full-screen push from the right — `NextRaise Mobile`/MobileOverview.dc.html:470 `<div data-sub="" style="position:absolute;inset:0;background:var(--neutral-50);…transform: {{ subX }};box-shadow:var(--shadow-xl)">`, sliding on `transition:transform 380ms cubic-bezier(.32,.72,0,1)` (MobileOverview.dc.html:57). Desktop: a full-height 460px right-hand drawer — DesktopOverview.dc.html:539 `top:0;bottom:0;right:0;width:460px;…border-left:1px solid var(--border-subtle)`. README:145 'Phone: full-screen push from the right… Desktop: 460px right-hand drawer over a scrim.'

**Deployed:** A separately invented overlay. Phone: a bottom sheet `html[data-theme="light"] .nd-alerts{ width:min(420px,100%); max-height:72vh; … border-radius:20px 20px 0 0; }` (index.html:2975-2977). Desktop: a floating 420px card pinned 70px from the top and 24px from the right — `@media (min-width:961px){ … .nd-alerts-ov{ align-items:flex-start; justify-content:flex-end; padding:70px 24px 0; } }` (index.html:2973) with `border-radius:16px` (index.html:2978). It is neither a pushed screen nor a full-height 460px edge drawer.

**Evidence:** index.html:2973-2978 `@media (min-width:961px){ html[data-theme="light"] .nd-alerts-ov{ align-items:flex-start; justify-content:flex-end; padding:70px 24px 0; } }` … `.nd-alerts{ width:min(420px,100%); max-height:72vh; … border-radius:20px 20px 0 0; }`

**Fix:** Route the bell through the same drill-down container the other subs use: phone `position:absolute;inset:0` push with the 380ms cubic-bezier(.32,.72,0,1) slide; desktop `top:0;bottom:0;right:0;width:460px` drawer with a `border-left` hairline over the existing scrim.

### Alerts drill-down header has no meta line and uses ✕ instead of the back chevron on phone
`Widgets & alerts` · both · verdict CONFIRMED

**Designed:** Header = back chevron (44×44, `color:var(--text-link)`, `chevron-left` 24px) + a two-line title block: title 17px/700/-0.02em and meta 12px/500 `var(--text-muted)` — MobileOverview.dc.html:471-482. For Alerts the meta string is `'3 unread'` (MobileOverview.dc.html:1061 and DesktopOverview.dc.html:1094: `alerts: ['Alerts', '3 unread']`).

**Deployed:** A single-line header: `<div class="nd-alerts-h"><b>Alerts</b><button class="nd-alerts-x" … >✕</button></div>` — title only, no meta subtitle, and a 34px circular ✕ on the right on phone as well as desktop, where the design uses a left-hand back chevron on phone.

**Evidence:** index.html:6952-6953 `ov.innerHTML = '<div class="nd-alerts"><div class="nd-alerts-h"><b>Alerts</b>' + '<button class="nd-alerts-x" onclick="ndCloseAlerts()" aria-label="Close">✕</button></div>'`

**Fix:** Render the shared drill-down header: chevron-left back button on phone (✕ on desktop), title 17/700/-0.02em plus a 12px muted meta line carrying the unread count.

### iOS medium widget is missing its headline signups figure and 7-day sparkline
`Widgets & alerts` · widget · verdict CONFIRMED

**Designed:** README:164 'iOS medium (7-day signups + sparkline + three stats)'. The mock (NextRaise Mobile.dc.html:142-162) is a 332×158 two-column grid `1.2fr 1fr`: left = logo mark + 'Last 7 days · Overall' caption, a 34px/800/-0.03em signups number, a 'signups · +33.7%' delta line, and a 30px-tall 7-bar sparkline at `rgba(255,255,255,.85)` with 4px gaps; right = a column separated by `border-left:1px solid rgba(255,255,255,.2);padding-left:14px` holding three 11px-label / 17px-800-value stats: Revenue, Active Pro, Paid in window.

**Deployed:** A single-column card: caption row ('Last 7 days' + a freshness string) over a flat 3-up grid. No headline signups number, no delta line, no sparkline, no vertical divider, no logo mark, and no bucket suffix on the caption. The three stats are Active Pro / Signed up & paid / ARPU — Revenue is dropped — with values at 20px (design 17px) and labels at 10.5px/.07em (design 11px/.08em).

**Evidence:** widget.html:53-56 `.med .grid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; } .med .cell b{ display:block; font-size:20px; font-weight:800; letter-spacing:-.02em; } .med .cell s{ … font-size:10.5px; font-weight:700; letter-spacing:.07em; … }` — and widget.html:75-83 markup contains only `.cap` + `.grid`, no `.num`/`.mini` in `.w.med`.

**Fix:** Rebuild the medium as the designed 1.2fr/1fr grid: left column = logo + 'Last 7 days · {bucket}' caption, 34px signups total, 'signups · ±x%' delta, 30px 7-bar sparkline; right column = bordered stat stack (Revenue / Active Pro / Paid in window) at 11px label + 17px/800 value.

### Android 2×2 revenue widget is built with iOS-small geometry and a sparkline instead of the designed progress bar
`Widgets & alerts` · widget · verdict CONFIRMED

**Designed:** NextRaise Mobile.dc.html:129-139 — `width:158px;height:158px;border-radius:28px`, caption 'Revenue · Sep' at `rgba(255,255,255,.7)` with a 6px `var(--success-500)` live dot at the right, value `font-size:30px;font-weight:800`, sub line '+ $212 · 60 payments' at `rgba(255,255,255,.7)`, and a 6px rounded progress track `background:rgba(255,255,255,.14)` with a 56% `var(--success-500)` fill.

**Deployed:** The second tile reuses `.w.small` (radius 24px from `.w`, not 28px), caption is just 'Revenue' with no month scope and no status dot, the value uses `.num.sm` at 26px (not 30px), the sub line is grey `.sub.flat` at `rgba(255,255,255,.6)` (not .7), and the progress bar is replaced by a second `.mini` sparkline of daily payments.

**Evidence:** widget.html:32-40 `.w{ … border-radius:24px; … }` / `.w.small{ width:158px; height:158px; }` and widget.html:47 `.num.sm{ font-size:26px; }`; markup widget.html:70-77 renders `<div class="mini" id="wMiniRev"></div>` where the design has the 6px progress track.

**Fix:** Give the Android tile its own class: radius 28px, caption 'Revenue · {month}' + 6px success dot, 30px value, `rgba(255,255,255,.7)` sub, and a 6px rounded track with a success-500 fill instead of the sparkline.

## MINOR (75)

### Report-screen controls fall well under the 40px desktop hit-target minimum
`Completeness critic` · desktop · verdict CRITIC

**Designed:** README:46 — '40px on desktop'.

**Deployed:** On the CEO Report the in-page range pill is 26px tall, the duplicated in-page attribution buttons are 27px, and the header action buttons are 38px. (The Creators screen's range pill is likewise 26px.) These are downstream of the report-header-card-missing blocker but were never measured.

**Evidence:** cap/live-desk-report.json: `button.gdr-btn.no-print` r=[…,113,26]; `button.bkt` r=[…,89,27] and [...,70,27]; `button.btn.btn-secondary.no-print` r=[…,108,38] ('Export PDF'); cap/live-desk-creators.json `button.gdr-btn` r=[…,94,26].

**Fix:** When the designed report header card lands, size its controls to the 40px desktop floor (the accent Export pill included).

### The light-mode design-system token names are absent too, and the --shadow-* ramp carries off-spec values
`Completeness critic` · both · verdict CRITIC

**Designed:** README:49 — 'Always reference via `var(--*)`: --neutral-0/50/100/200/300, --text-heading/body/muted/subtle/link/brand/success/danger, --action-50/200/500/600, --border-subtle/default, --surface-glass/scrim, --shadow-xs/sm/md/lg/xl', with values from `tokens/elevation.css` (`--shadow-sm:0 1px 3px rgba(15,20,25,.06),0 1px 2px rgba(15,20,25,.04)`).

**Deployed:** `--surface-glass`, `--surface-scrim`, `--border-subtle` and `--border-default` appear zero times in index.html (the audit reported this only for the dark remap). The `--shadow-*` names do exist but with different values — `--shadow-sm: 0 1px 3px rgba(16,24,40,0.07), 0 2px 6px rgba(16,24,40,0.05)` — while the correct token value is duplicated privately as `--nd-sh`, so any component still reading `var(--shadow-*)` gets non-token elevation.

**Evidence:** `grep -c -- "--surface-glass\|--border-subtle\|--border-default\|--surface-scrim" index.html` → 0; index.html:85-88 `--shadow-xs/sm/md/lg` declarations; design/_ds/nextraise-design-system-*/tokens/elevation.css:4-9; index.html:2691 `--nd-sh:0 1px 3px rgba(15,20,25,.06),0 1px 2px rgba(15,20,25,.04);`.

**Fix:** Alias the design-system token names onto the `--nd-*` values in both appearances and correct the `--shadow-*` ramp to `tokens/elevation.css`, so component CSS can use the spec'd names.

### --action-600 is #8FA3FF, spec says #9DB2FF
`Dark appearance` · both · verdict ADJUSTED

**Designed:** `--action-600:#9DB2FF` (rgb(157,178,255)).

**Deployed:** `--nd-act-600:#8FA3FF` (index.html:2937) and `--blue-text:#8FA3FF` (index.html:2947). It renders on a single element per breakpoint — the topbar avatar, live-desk-dark.txt:196 `rgb(143, 163, 255)` — a 14/15/0 per-channel shift from the prototype's rgb(157,178,255).

**Evidence:** index.html:2937 `--nd-act-50:rgba(92,121,255,.16); --nd-act-500:#5C79FF; --nd-act-600:#8FA3FF;` and index.html:2947 `--blue-text:#8FA3FF;`. Live: live-desk-dark.txt:196 `button.nd-tb-av` renders `rgb(143, 163, 255)`; prototype uses rgb(157,178,255) (proto-desk-dark.txt header `"--action-600":"#9DB2FF"`).

**Fix:** Set `--nd-act-600:#9DB2FF` and `--blue-text:#9DB2FF` at index.html:2937 / 2947.

### --action-200 #3A55B8 has no counterpart at all
`Dark appearance` · both · verdict ADJUSTED

**Designed:** `--action-200:#3A55B8` in the dark remap (prototype defines it — proto-desk-dark.txt header `"--action-200":"#3A55B8"`).

**Deployed:** Neither `--action-200` nor `--nd-act-200` exists in index.html (grep 0 for both); the dark block at index.html:2937 defines only act-50/500/600. The step is unrendered in the design too — rgb(58,85,184) appears on 0 elements in every proto-*.txt — so the gap only bites if the spec'd bar-selection state (README:107, non-selected bars → --action-200) is built.

**Evidence:** `grep -c -- "--action-200" index.html` → 0; `grep -c -- "--nd-act-200" index.html` → 0. index.html:2937 `--nd-act-50:rgba(92,121,255,.16); --nd-act-500:#5C79FF; --nd-act-600:#8FA3FF;`

**Fix:** Add `--nd-act-200:#3A55B8;` to the dark block at index.html:2937 (and its light counterpart #BFCBFF) and use it for blue hairlines/outlines.

### --action-50 alpha is .16, spec says .22
`Dark appearance` · both · verdict CONFIRMED

**Designed:** `--action-50:rgba(92,121,255,.22)` — prototype renders rgba(92,121,255,0.22).

**Deployed:** `--nd-act-50:rgba(92,121,255,.16)` and `--blue-soft:rgba(92,121,255,.16)`; live tinted chips render rgba(92,121,255,0.16).

**Evidence:** index.html:2937 `--nd-act-50:rgba(92,121,255,.16)`. Background tally: live-desk-dark.txt has 2× `rgba(92, 121, 255, 0.16)`, proto-desk-dark.txt has 1× `rgba(92, 121, 255, 0.22)`.

**Fix:** Change `.16` to `.22` at index.html:2937 and 2947.

### --amber-700 and --amber-100 both diverge from the dark spec
`Dark appearance` · both · verdict ADJUSTED

**Designed:** `--amber-700:#F5B94A; --amber-100:#3A2C10;` — amber-100 is an opaque dark-brown chip fill in dark mode.

**Deployed:** `--nd-amber-700:#F6C270` and `--nd-amber-100:rgba(245,158,12,.16)` (index.html:2940, mirrored at 2950). No captured dark element renders any amber value in either the live app or the prototype, so the divergence is source-level; composited over --nd-0 the alpha chip fill lands near rgb(55,47,38) against the spec's #3A2C10 rgb(58,44,16).

**Evidence:** index.html:2940 `--nd-amber-100:rgba(245,158,12,.16); --nd-amber-700:#F6C270;` and index.html:2950 `--amber-soft:rgba(245,158,12,.16); --amber-text:#F6C270;`. README "Colour (dark appearance)" block: `--amber-700:#F5B94A; --amber-100:#3A2C10;`

**Fix:** Set `--nd-amber-700:#F5B94A` and `--nd-amber-100:#3A2C10` at index.html:2940 (and the --amber-text/--amber-soft aliases at 2950).

### --red-700 and --red-100 both diverge from the dark spec
`Dark appearance` · both · verdict ADJUSTED

**Designed:** `--red-700:#FF7A7F; --red-100:#3D1A1C;` — red-100 is an opaque dark-maroon chip fill.

**Deployed:** `--nd-red-700:#FF9B9B` and `--nd-red-100:rgba(229,72,77,.16)` (index.html:2939, mirrored at 2949). Neither the implementation's nor the spec's red values appear on any captured dark element in live or prototype, so this is a source-level token mismatch with no observed rendering.

**Evidence:** index.html:2939 `--nd-red-100:rgba(229,72,77,.16); --nd-red-700:#FF9B9B;` and index.html:2949 `--red-soft:rgba(229,72,77,.16); --red-text:#FF9B9B;`. README dark block: `--red-700:#FF7A7F; --red-100:#3D1A1C;`

**Fix:** Set `--nd-red-700:#FF7A7F` and `--nd-red-100:#3D1A1C` at index.html:2939 (and the aliases at 2949).

### Dark border alpha is .10 where the design uses .11; --border-subtle/--border-default names absent
`Dark appearance` · both · verdict ADJUSTED

**Designed:** README line 77 dark equivalents: card border `rgba(255,255,255,.11)`; the prototype renders `10 b:1 rgba(255,255,255,0.11)` plus `16 b:1 rgb(26,34,54)` row hairlines. The named tokens `--border-subtle:#242E46` / `--border-default:#33405E` (README line 58) should exist for reference, though #33405E is rendered by zero elements in the prototype itself.

**Deployed:** Neither token name exists (grep 0 for both); index.html:2935/2944 define `--nd-edge:rgba(255,255,255,.10)` and `--border:rgba(255,255,255,.10)`, so live-desk-dark renders `12 b:1 rgba(255, 255, 255, 0.1)` and `10 b:1 rgb(26, 34, 54)` — a one-point alpha miss on the glass hairline, not a different border system.

**Evidence:** index.html:2935 `--nd-edge:rgba(255,255,255,.10); --nd-card:rgba(255,255,255,.055);` and index.html:2944 `--border:rgba(255,255,255,.10); --border-strong:rgba(255,255,255,.18);`. Border tally live-desk-dark.txt: `12 b:1 rgba(255, 255, 255, 0.1)` / `10 b:1 rgb(26, 34, 54)` — no `rgb(51, 64, 94)`.

**Fix:** Define `--nd-border-subtle:#242E46` and `--nd-border-default:#33405E` in the dark block and point --nd-edge/--border/--border-strong at them (index.html:2935, 2944).

### Token swap transition is 200ms on a short hand-picked selector list, not 320ms on the token surfaces
`Dark appearance` · both · verdict ADJUSTED

**Designed:** README: "Token swaps transition over 320ms (`background`, `color`, `border-color`)." — the surfaces driven by the remapped tokens should cross-fade over 320ms.

**Deployed:** The only background/color/border-color transition is 200ms (index.html:98-102) and covers body, .sidebar, .panel, .table-wrap, .result-card and other legacy surfaces — several of which are dark-remapped at index.html:2955/2957. The glass-redesign surfaces (.ndc, .nd-card, .ov-card, .okpi, .rev-kpi, .infl-card, .nd-topbar, .mob-bottom-nav, .bucket-seg, .nd-modes) are absent from the list and snap instantly. The only 320ms transitions in the file are `transform` on segmented thumbs (2802, 2922, 3067).

**Evidence:** index.html:97-102 `/* smooth theme switch on the surfaces that change */ body, .sidebar, .panel, .table-wrap, .toolbar, .search-box, .stat-pill, .result-card, .modal, .field-input, .search-input, th, td, .chip, .btn-ghost, .settings-btn { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }`. `grep -n "320ms" index.html` → only 2802, 2922, 3067, all `transition:transform 320ms cubic-bezier(.32,.72,0,1)`.

**Fix:** Change index.html:101 to `transition: background-color 320ms, color 320ms, border-color 320ms;` and extend the selector list (or apply it via a shared `.nd-surface` class) to the .nd*/.ov-card/.okpi families.

### --text-subtle is #6C7796, spec says #737E98
`Dark appearance` · both · verdict CONFIRMED

**Designed:** `--text-subtle:#737E98` = rgb(115,126,152); prototype renders that on 47 elements.

**Deployed:** `--nd-400:#6C7796` → the subtle tier renders rgb(108,119,150) on 20 live elements, about 5% darker than spec.

**Evidence:** index.html:2934 `--nd-400:#6C7796; --nd-500:#9AA5C0; --nd-700:#C9D1E4; --nd-900:#F2F5FB;`. Colour tally: live-desk-dark.txt `20 rgb(108, 119, 150)` vs proto-desk-dark.txt `47 rgb(115, 126, 152)`.

**Fix:** Set `--nd-400:#737E98` at index.html:2934.

### --text-muted is #9AA5C0, spec says #9AA4BB
`Dark appearance` · both · verdict CONFIRMED

**Designed:** `--text-muted:#9AA4BB` = rgb(154,164,187).

**Deployed:** `--nd-500:#9AA5C0` and `--text-3:#9AA5C0` → renders rgb(154,165,192) on 31 live elements.

**Evidence:** index.html:2934 `--nd-500:#9AA5C0;` and index.html:2946 `--text-3:#9AA5C0;`. Colour tally: live-desk-dark.txt `31 rgb(154, 165, 192)` vs proto-desk-dark.txt `73 rgb(154, 164, 187)`.

**Fix:** Set `--nd-500:#9AA4BB` and `--text-3:#9AA4BB` at index.html:2934 / 2946.

### --text-body is #C9D1E4, spec says #C9D1E1
`Dark appearance` · both · verdict CONFIRMED

**Designed:** `--text-body:#C9D1E1` = rgb(201,209,225).

**Deployed:** `--nd-700:#C9D1E4` and `--text-2:#C9D1E4` → body text renders rgb(201,209,228) on 67 live elements (3 points more blue).

**Evidence:** index.html:2934 `--nd-700:#C9D1E4;`, index.html:2946 `--text-2:#C9D1E4;`, and the live digest header `"--text-2":"#C9D1E4"` (live-desk-dark.txt:2). Colour tally: live-desk-dark.txt `67 rgb(201, 209, 228)` vs proto-desk-dark.txt `91 rgb(201, 209, 225)`.

**Fix:** Set `--nd-700:#C9D1E1` and `--text-2:#C9D1E1` at index.html:2934 / 2946.

### Two mobile shadows keep light-mode navy ink in dark
`Dark appearance` · mobile · verdict CONFIRMED

**Designed:** Dark shadows should use the spec's black ramp (`rgba(0,0,0,.4)` / `rgba(0,0,0,.5)` / `rgba(0,0,0,.6)`), as the card shadow correctly does.

**Deployed:** The floating tab bar and the range pill keep `rgba(15, 28, 61, 0.22)` and `rgba(15, 28, 61, 0.25)` respectively — byte-identical to light mode — alongside the correct `rgba(0,0,0,.6)` card shadow.

**Evidence:** live-mob-dark.txt:345 `nav.mob-bottom-nav | ... | rgba(19, 26, 43, 0.82) | r:999px | b:1 rgba(255, 255, 255, 0.1) | sh:rgba(15, 28, 61, 0.22) 0px 14px 36px -14px` (bg and border did flip; shadow did not). Source: index.html:3156 `box-shadow:0 14px 36px -14px rgba(15,28,61,.22) !important;` and index.html:3053 `box-shadow:0 4px 14px -8px rgba(15,28,61,.25) !important;`.

**Fix:** Drive both from `var(--nd-sh)` or add dark overrides at index.html:3053 and 3156.

### Dark chart bars do not gain the specified blue glow
`Dark appearance` · both · verdict CONFIRMED

**Designed:** README dark equivalents: "Chart bars gain `0 0 18px -4px rgba(92,121,255,.55)`."

**Deployed:** Desktop dark bars carry no shadow at all (`sh:-`); mobile dark bars keep the light-mode inset white highlight `rgba(255,255,255,.45) 0 1px 0 inset` unchanged. The declaration does not exist in the file.

**Evidence:** live-desk-dark.txt:210 `[330,375,87,50] | i | | ... | rgb(92, 121, 255) | r:6px 6px 2px 2px | b:- | sh:- |`; live-mob-dark.txt:204 `sh:rgba(255, 255, 255, 0.45) 0px 1px 0px 0px inset` identical to live-mob-light.txt:204. `grep -n "18px -4px" index.html` → no match.

**Fix:** Add `html[data-theme="light"][data-appearance="dark"] .ndc-bars i{ box-shadow:0 0 18px -4px rgba(92,121,255,.55); }` near index.html:2957.

### "See all" uses --action-500 and a literal "›" character instead of --text-link and the Lucide chevron-right icon
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** "See all" label 13px/600 in `var(--text-link)` = #1B3FE0 = rgb(27,63,224), followed by a 14px Lucide `chevron-right` icon rendered as a CSS mask inheriting currentColor. README: "Icons: Lucide (24px grid, 2px stroke), rendered as a CSS mask ... Slugs used: ... chevron-right".

**Deployed:** All three "See all" buttons render in rgb(41,82,255) (= --nd-act-500 / #2952FF) and the chevron is the text glyph "›" baked into the label string, so it renders in the body font rather than as the Lucide glyph.

**Evidence:** proto-desk-light.txt: `[557,519,64,32] | button | {"data-dc-tpl":"114"} | 13/600 | rgb(27, 63, 224) ... TXT«See all»` plus `[604,528,14,14] | span | {"data-icon":"chevron-right"} | ... rgb(27, 63, 224)`. live-desk-light.txt: `[575,511,55,32] | button.nd-see | 13/600/normal/normal | rgb(41, 82, 255) ... TXT«See all ›»`. index.html:2882 `.nd-see{ ... color:var(--nd-act-500); }` and index.html:6858 `>See all ›</button>`.

**Fix:** Point .nd-see at the --text-link token (index.html:2882) and replace the "›" text with the masked Lucide chevron-right span used elsewhere in the console.

### Active Pro sub-line abbreviates the user count to "34.8K" instead of full en-IN grouping
`Desktop cards & tables` · desktop · verdict CONFIRMED

**Designed:** "{pct} of {usersFmt} users" with usersFmt in full en-IN grouping, e.g. "1.23% of 13,373 users". README State: "Numbers format with en-IN grouping; large social counts abbreviate to K / L" — the K/L abbreviation is scoped to social counts, not the user base.

**Deployed:** "0.80% of 34.8K users" — any user count >= 1000 is compacted to one decimal + "K".

**Evidence:** DesktopOverview.dc.html:236 `{{ proPct }} of {{ usersFmt }} users`; proto-desk-light.txt `[1314,170,40,15] | span.sc-interp | 12/500 ... TXT«13,373»`. live-desk-light.txt `[1231,164,123,16] | s | 12/500 ... TXT«0.80% of 34.8K users»`. index.html:6846 `(M.newProduct >= 1000 ? (M.newProduct / 1000).toFixed(1) + 'K' : M.newProduct) + ' users'`.

**Fix:** Replace the K-compaction at index.html:6846 with `M.newProduct.toLocaleString('en-IN')`.

### Recent signups initials avatar is 34px, not the 32px drawn in the prototype (36px in the README)
`Desktop cards & tables` · desktop · verdict UNVERIFIED

**Designed:** 32px circular initials avatar on the desktop card (DesktopOverview.dc.html:276 `width:32px;height:32px`); README Overview §1 card 4 specifies "36px initials avatar".

**Deployed:** 34px circular avatar — matching neither the prototype nor the README figure.

**Evidence:** proto-desk-light.txt `[680,563,32,32] | span | {"data-dc-tpl":"130"} | 12/700 | rgb(63, 74, 102) | rgb(238, 241, 248) | r:50%`. live-desk-light.txt `[688,566,34,34] | span.nd-ini | 12/700/-0.084px | rgb(63, 74, 102) | rgb(238, 241, 248) | r:50%`. index.html:2894 `.nd-ini{ width:34px; height:34px; ... }`.

**Fix:** Set .nd-ini to 32px (index.html:2894) to match the desktop prototype, or confirm which of 32/36 is canonical and align the README.

### Bar-fill motion uses the flat 520ms curve instead of the glass 720ms spring
`Desktop hero & chart` · desktop · verdict ADJUSTED

**Designed:** 720ms `cubic-bezier(.34,1.25,.64,1)` **only under the glass theme** (README.md:86 gives 520ms `cubic-bezier(.2,0,.2,1)` as the correct flat value, and the desktop build renders flat). Fixing hero-card-glass-missing must carry this with it; the independently missing piece is the `background` transition (DesktopOverview.dc.html:52 `background 200ms`, and even the flat base at :213 has `background 140ms`), without which a future selection colour change would snap.

**Deployed:** index.html:2864 `transition:height 520ms cubic-bezier(.2,0,.2,1);` — the spec-correct value for the flat theme the desktop build actually renders, with no `background` transition declared.

**Evidence:** index.html:2864 `        transition:height 520ms cubic-bezier(.2,0,.2,1); }`

**Fix:** Set `transition: height 720ms cubic-bezier(.34,1.25,.64,1), background 200ms;` on `.ndc-bars i`.

### Card rise-in is 420ms/wrong easing with no scale, and the stagger is 50ms not 60ms
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** 560ms `cubic-bezier(.22,.61,.36,1)` from `opacity 0, translateY(14px) scale(.985)`, staggered 60ms per card (README:85). Proto digest: `an:0.56s cubic-bezier(0.22, 0.61, 0.36, 1) both nrRise`, stagger `an:0s 0.06s` on the KPI group.

**Deployed:** 420ms `cubic-bezier(.2,0,.2,1)` from `opacity 0, translateY(10px)` with no scale, staggered 50ms.

**Evidence:** index.html:2836 `@keyframes ndcRise{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }` and :2839 `animation:ndcRise 420ms cubic-bezier(.2,0,.2,1) both;`, :2840 `#overviewArea > *:nth-child(2){ animation-delay:50ms }` — live digest `an:0.42s cubic-bezier(0.2, 0, 0.2, 1) both ndcRise` vs proto `an:0.56s cubic-bezier(0.22, 0.61, 0.36, 1) both nrRise`

**Fix:** Change the keyframe to `translateY(14px) scale(.985)`, the animation to `560ms cubic-bezier(.22,.61,.36,1)`, and the nth-child delays to 60/120/180/240ms.

### Delta badge type is 12.5px/700 instead of 13px/600
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** 13px / 600, colour rgb(18,148,91) on rgb(237,250,243), radius 999px, padding 0 10px, height 24px. Proto digest: `[438,170,71,24] | span |  | 13/600/normal/16.9px | rgb(18, 148, 91) | rgb(237, 250, 243) | r:999px | b:1 rgba(0, 0, 0, 0) | ... | p:0/10/0/10`.

**Deployed:** 12.5px / 700 (tones, radius, padding and height all correct). The 1px transparent border the prototype's Badge component carries is also absent, so the badge's outer box is 2px narrower than designed.

**Evidence:** index.html:2852-2853 `html[data-theme="light"] .nd-badge{ display:inline-flex; align-items:center; height:24px; padding:0 10px; border-radius:999px;` / `font-size:12.5px; font-weight:700; white-space:nowrap; }` — live digest `[484,164,74,24] | span.nd-badge.up |  | 12.5/700/-0.084px/normal | rgb(18, 148, 91) | rgb(237, 250, 243) | r:999px | b:- | ... | p:0/10/0/10`

**Fix:** Set `font-size:13px; font-weight:600;` on `.nd-badge` at index.html:2853 and add `border:1px solid transparent`.

### Bars are capped at 92px and centred; the prototype lets them stretch uncapped
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** Bars flex to fill the chart with no maximum. Prototype: DesktopOverview.dc.html:212 `style="flex:1;min-width:0;height:100%;..."` with no max-width and default `justify-content` — proto digest shows 7 bars of 94px filling the 707px chart edge to edge.

**Deployed:** `max-width:92px` on both the bar columns and the x-labels, plus `justify-content:center` on the chart. Today's bars measure 87px so nothing clips, but at any wider content column the chart stops growing at 92px per bar and floats centred with gutters the design never had.

**Evidence:** index.html:2859-2862 `.ndc-bars{ justify-content:center; }` / `.ndc-bars > span{ flex:1 1 0; min-width:0; max-width:92px; ... }` / `.ndc-xlbl{ justify-content:center; }` / `.ndc-xlbl span{ flex:1 1 0; max-width:92px; }`

**Fix:** Drop the `max-width:92px` on both selectors and the two `justify-content:center` declarations, matching the prototype's plain `flex:1`.

### Bars lose the inset top highlight the glass theme gives them
`Desktop hero & chart` · desktop · verdict CONFIRMED

**Designed:** `box-shadow: inset 0 1px 0 rgba(255,255,255,.45)` on every bar (DesktopOverview.dc.html:52). Proto digest: `[297,328,94,103] | span | {"data-bar":""} | ... | sh:rgba(255, 255, 255, 0.45) 0px 1px 0px 0px inset`.

**Deployed:** No box-shadow on the bar fill; the top edge reads as a flat blue block.

**Evidence:** index.html:2863-2864 (the whole `.ndc-bars i` rule declares only display/width/border-radius/background/transition) — live digest `[330,375,87,50] | i | ... | rgb(41, 82, 255) | r:6px 6px 2px 2px | b:- | sh:-`

**Fix:** Add `box-shadow: inset 0 1px 0 rgba(255,255,255,.45);` to `.ndc-bars i`.

### Eyebrow line-height falls back to `normal` (15px) instead of the 1.55 body rhythm (17px)
`Desktop hero & chart` · desktop · verdict UNVERIFIED

**Designed:** 17.05px computed line box (11px × 1.55). Proto digest: `[297,120,342,17] | span | {"data-dc-tpl":"79"} | 11/700/0.88px/17.05px | rgb(112, 119, 139)`.

**Deployed:** `normal`, computing to a 15px line box, which shrinks the hero-top block from 74px to 70px and pulls the whole card 6px shorter than the prototype's.

**Evidence:** live digest `[330,118,352,15] | span.nd-lbl |  | 11/700/0.88px/normal | rgb(112, 119, 139)`; rule at index.html:2846 `html[data-theme="light"] .nd-lbl{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--nd-500); }` declares no line-height

**Fix:** Add `line-height:1.55;` to the `.nd-lbl` rule at index.html:2846.

### Referrals demoted from 5th to 7th in the Growth group
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** Growth order: Acquire, Activate, Monetization, Retention, Referrals, Pro Users — Referrals at `[12,596,223,36]`, fifth row.

**Deployed:** Growth order: Acquire, Activate, Monetization, Retention, Lifecycle, Emails, Referrals — Referrals pushed to `[12,671,223,36]`, seventh row, after the two rows the spec removed.

**Evidence:** proto-desk-light.txt: `[22,604,57,21] | span.sc-interp | ... | TXT«Referrals»` (y=604, directly after Retention at y=566) vs live-desk-light.txt: `[12,671,223,36] | a.tab | {"id":"tab-referrals"} | ... | TXT«Referrals»` (y=671, after Lifecycle y=595 and Emails y=633)

**Fix:** Removing tab-lifecycle and tab-emails (index.html:3282, 3285) restores Referrals to fifth automatically.

### Nav icons render at 17px instead of 18px
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** 18x18 icon glyphs in the primary nav, e.g. `[22,129,18,18] | span | {"data-icon":"layout-dashboard"}` and `[22,171,18,18] | span | {"data-icon":"clipboard-list"}`.

**Deployed:** 17x17 everywhere: `[23,134,17,17] | svg` (Overview), `[22,176,17,17] | svg` (Report), `[35,860,17,17] | svg` (Settings) — set by `html[data-theme="light"] .tab .ic-sm{ width:17px; height:17px; ... }`.

**Evidence:** proto-desk-light.txt: `[22,129,18,18] | span | {"data-icon":"layout-dashboard"}` vs live-desk-light.txt: `[23,134,17,17] | svg` | index.html:2769

**Fix:** Change `.tab .ic-sm` and `.settings-btn .ic-sm` to 18px (index.html:2769, 2785).

### Sidebar footer hairline uses a different grey than the design token
`Desktop sidebar & nav IA` · desktop · verdict CONFIRMED

**Designed:** `b:1 rgb(227, 231, 240)` — --border-subtle #E3E7F0, per the prototype footer and the light token set.

**Deployed:** `b:1 rgb(230, 234, 243)` — #E6EAF3, from `--nd-edge`. Footer gap is also 8px vs the prototype's 10px.

**Evidence:** proto-desk-light.txt: `[0,1071,247,117] | div | {"data-dc-tpl":"37"} | ... | b:1 rgb(227, 231, 240) | ... | p:12/12/12/12 | g:10` vs live-desk-light.txt: `[0,787,247,113] | div.sidebar-footer | ... | b:1 rgb(230, 234, 243) | ... | p:12/12/12/12 | g:8` | index.html:2690 `--nd-edge:#E6EAF3;`

**Fix:** Set `--nd-edge` to #E3E7F0 (index.html:2690) and restore `gap:10px` on the footer by removing the stale `gap:8px !important` at index.html:2238.

### Refresh and bell glyphs are undersized
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** refresh-cw icon 19px, bell icon 20px

**Deployed:** both icons 18px (`.nd-tb-ico svg{ width:18px; height:18px }`)

**Evidence:** DesktopOverview.dc.html:177 `Icon ... name="refresh-cw" size="{{ 19 }}"` and :180 `Icon ... name="bell" size="{{ 20 }}"` | proto-desk-light.txt: `[1283,26,19,19] | span | {"data-icon":"refresh-cw"}` and `[1336,25,20,20] | span | {"data-icon":"bell"}` | live-desk-light.txt: `[1285,25,18,18] | svg |` and `[1339,25,18,18] | svg |` | index.html:2820

**Fix:** Size the two topbar icons individually: 19px for #ndDeskRefresh, 20px for #ndDeskBell, instead of the blanket 18px at index.html:2820.

### Range pill label is 13.5px instead of 13px
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** font-size 13px / weight 600

**Deployed:** font-size 13.5px / weight 600

**Evidence:** proto-desk-light.txt: `[1015,15,144,40] | button | {"data-dc-tpl":"56","data-pill":""} | 13/600/normal/20.15px` | live-desk-light.txt: `[1018,14,140,40] | button.gdr-btn | ... | 13.5/600/normal/normal` | index.html:2810 `font-size:13.5px !important;`

**Fix:** Change `font-size:13.5px !important` to `13px` at index.html:2810.

### Topbar meta line loses its 1.55 line-height and picks up negative tracking, shrinking the topbar by 2px
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** 12px / 500 / letter-spacing normal / line-height 18.6px (1.55), giving a 42px title block and a 71px topbar

**Deployed:** 12px / 500 / letter-spacing -0.084px / line-height normal (16px), giving a 39px title block and a 69px topbar

**Evidence:** README.md:41 "| Body | 13–14px / 500–600, line-height 1.45–1.55 |" | proto-desk-light.txt: `[272,37,385,19] | span | {"data-dc-tpl":"51"} | 12/500/normal/18.6px | rgb(112, 119, 139) | ... TXT«PostHog 399417 · Asia/Kolkata · internal and test accounts excluded»` and header `[248,0,1192,71]` | live-desk-light.txt: `[272,38,366,16] | s | | 12/500/-0.084px/normal | rgb(112, 119, 139) | ... TXT«PostHog 399417 · Asia/Kolkata · internal and test accounts excluded»` and header `[248,0,1192,69]` | index.html:2794-2795 (no line-height, no letter-spacing reset)

**Fix:** Add `line-height:1.55; letter-spacing:normal;` to `html[data-theme="light"] .nd-tb-t s` at index.html:2794.

### Segmented thumb slides with the flat easing, not the glass easing
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Glass theme (the default): 460ms cubic-bezier(.34,1.3,.64,1)

**Deployed:** 320ms cubic-bezier(.32,.72,0,1) — the flat-theme value

**Evidence:** README.md:87 "| Segmented thumb slide | 320ms `cubic-bezier(.32,.72,0,1)`; glass 460ms `cubic-bezier(.34,1.3,.64,1)` |" | DesktopOverview.dc.html:44 `[data-glass="true"] [data-thumb]{...transition:transform 460ms cubic-bezier(.34,1.3,.64,1),width 200ms !important;...}` | index.html:2802 `transition:transform 320ms cubic-bezier(.32,.72,0,1);`

**Fix:** Change the `.nd-topbar .bucket-seg::before` transition to `transform 460ms cubic-bezier(.34,1.3,.64,1)` at index.html:2802.

### Refresh spinner rotates at 900ms instead of 800ms
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** rotate(360deg) 800ms linear infinite

**Deployed:** ndSpin .9s linear infinite

**Evidence:** README.md:92 "| Refresh spinner | `rotate(360deg)` 800ms linear infinite |" | DesktopOverview.dc.html:31 `[data-spin="true"]{animation:nrSpin 800ms linear infinite}` | index.html:2828 `html[data-theme="light"] .nd-tb-ico.spin svg{ animation:ndSpin .9s linear infinite; }`

**Fix:** Change `.9s` to `.8s` at index.html:2828 (and the sibling `.nd-ico.spin` rule at 2829).

### Live badge is taller, smaller-typed, and its dot uses a lighter green
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** height 24px, padding 0 10px, font 13px/600 letter-spacing normal, dot filled #12945B (same as the label)

**Deployed:** height 26px, padding 0 11px, font 12.5px/600 letter-spacing -0.084px, dot filled var(--nd-ok-500) #19B672

**Evidence:** proto-desk-light.txt: `[1173,23,85,24] | span | {"data-live":""} | 13/600/normal/16.9px | rgb(18, 148, 91) | rgb(255, 255, 255) | r:999px | ... | p:0/10/0/10 | g:6` and dot `[1184,32,6,6] | span | | 13/600/normal/16.9px | rgb(18, 148, 91) | rgb(18, 148, 91) | r:50%` | live-desk-light.txt: `[1171,21,89,26] | span.nd-live | ... | 12.5/600/-0.084px/normal | ... | p:0/11/0/11 | g:6` | index.html:2811-2813 `height:26px; padding:0 11px; font-size:12.5px;` and `.nd-live::before{ ... background:var(--nd-ok-500); }` with index.html:2687 `--nd-ok-500:#19B672;`

**Fix:** At index.html:2811-2813 set height:24px, padding:0 10px, font-size:13px, letter-spacing:normal, and make the ::before dot `background:currentColor` (#12945B).

### Avatar chip is 34px with no inset ring instead of 36px with one
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** 36x36 circle, font 12px/700, box-shadow inset 0 0 0 1px var(--border-subtle) (#E3E7F0)

**Deployed:** 34x34 circle, font 12.5px/700, no box-shadow

**Evidence:** DesktopOverview.dc.html:183 `<span style="width:36px;height:36px;...font-size:12px;font-weight:700;...box-shadow:var(--ring-inset)">JS</span>` with _ds/.../tokens/elevation.css:13 `--ring-inset:inset 0 0 0 1px var(--border-subtle);` | proto-desk-light.txt: `[1380,17,36,36] | span | {"data-dc-tpl":"69"} | 12/700/normal/18.6px | rgb(27, 63, 224) | rgb(238, 242, 255) | r:50% | b:- | sh:rgb(227, 231, 240) 0px 0px 0px 1px inset` | live-desk-light.txt: `[1382,17,34,34] | button.nd-tb-av | {"aria-label":"Account"} | 12.5/700/normal/normal | rgb(27, 63, 224) | rgb(238, 242, 255) | r:50% | b:- | sh:-` | index.html:2823-2825

**Fix:** At index.html:2823-2825 set width/height 36px, font-size 12px, and add `box-shadow:inset 0 0 0 1px var(--nd-200);`

### Bell unread dot sits 2px off its designed position
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** dot offset top 9px, right 10px inside the 40x40 button

**Deployed:** top 7px, right 8px (index.html:2821)

**Evidence:** DesktopOverview.dc.html:181 `<span style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--red-500);border:2px solid var(--neutral-0)"></span>` | proto-desk-light.txt: `[1348,24,8,8] | span | {"data-dc-tpl":"68"} | ... | rgb(229, 72, 77) | r:50% | b:2 rgb(255, 255, 255)` (button at `[1326,15,40,40]` → top 9, right 10) | index.html:2821 `.nd-tb-ico.dot::after{ ... top:7px; right:8px; ... }`

**Fix:** Change the `.nd-tb-ico.dot::after` offsets to top:9px; right:10px at index.html:2821.

### Segmented track adds a 2px inter-button gap the thumb geometry does not account for
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** No gap between segment buttons (track g:normal), so each of the 3 columns is exactly (330-6)/3 = 108px and the thumb's 108px step lands on each button

**Deployed:** Track has gap:2px (digest g:2), so buttons land at x=677/785/894 (steps of 108 and 109) while the thumb steps by calc(i * 100%) = 108px — the thumb is ~1-2px left of the third button

**Evidence:** proto-desk-light.txt: `[671,14,330,42] | div | {"data-dc-tpl":"52","data-seg":""} | ... | p:3/3/3/3 | g:normal` | live-desk-light.txt: `[674,14,330,40] | div.bucket-seg | ... | p:3/3/3/3 | g:2` and buttons `[677,17,107,34]`, `[785,17,107,34]`, `[894,17,107,34]` | index.html:1615 `.bucket-seg{ ... padding:3px; gap:2px; }` (never reset by the 2796 override) | index.html:7010 `seg.style.setProperty('--seg-x', 'calc(' + i + ' * 100%)');`

**Fix:** Add `gap:0 !important;` to `html[data-theme="light"] .nd-topbar .bucket-seg` (index.html:2796-2799).

### Dark-mode segmented track alpha is .07 instead of .06
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Dark segmented track rgba(255,255,255,.06)

**Deployed:** rgba(255,255,255,.07)

**Evidence:** README.md:77 "...segmented track `rgba(255,255,255,.06)`, thumb `rgba(255,255,255,.22 → .10)`..." | proto-desk-dark.txt: `[671,-274,330,42] | div | {"data-dc-tpl":"52","data-seg":""} | ... | rgba(255, 255, 255, 0.06) | r:999px | b:1 rgba(255, 255, 255, 0.08) | sh:rgba(0, 0, 0, 0.45) 0px 1px 3px 0px inset` | live-desk-dark.txt: `[672,14,330,40] | div.bucket-seg | ... | rgba(255, 255, 255, 0.07) | r:999px | b:- | sh:-` | index.html:2964 `:is(.bucket-seg,.nd-modes){ background:rgba(255,255,255,.07) !important; }`

**Fix:** Change .07 to .06 at index.html:2964 and add the dark track border rgba(255,255,255,.08) + inset 0 1px 3px rgba(0,0,0,.45).

### Dark card shadow alpha and border alpha are slightly off spec
`Liquid Glass theme` · both · verdict CONFIRMED

**Designed:** Dark card shadow `0 16px 40px rgba(0,0,0,.5)`, border `rgba(255,255,255,.11)`.

**Deployed:** Shadow is `rgba(0,0,0,0.6) 0px 16px 40px -20px` — alpha .6 instead of .5, plus a −20px spread the spec does not call for, which shrinks the shadow footprint. Border is `rgba(255,255,255,.10)` instead of `.11`.

**Evidence:** live-mob-dark.txt:194 `… | b:1 rgba(255, 255, 255, 0.1) | sh:rgba(0, 0, 0, 0.6) 0px 16px 40px -20px | …`; source index.html:2935 `--nd-edge:rgba(255,255,255,.10);` and index.html:2942 `--nd-sh:0 16px 40px -20px rgba(0,0,0,.6);`

**Fix:** Set `--nd-sh:0 16px 40px rgba(0,0,0,.5)` and `--nd-edge:rgba(255,255,255,.11)`.

### Dark tab bar alpha is .82 instead of .62
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Dark tab bar `rgba(19,26,43,.62)`.

**Deployed:** `rgba(19, 26, 43, 0.82)` — right hue, 0.20 too opaque. It also keeps the light shadow `rgba(15,28,61,.22)` rather than a dark-appropriate one.

**Evidence:** live-mob-dark.txt:345 `[14,800,366,62] | nav.mob-bottom-nav | … | rgba(19, 26, 43, 0.82) | r:999px | b:1 rgba(255, 255, 255, 0.1) | sh:rgba(15, 28, 61, 0.22) 0px 14px 36px -14px | … | bf:blur(28px) saturate(1.7) |`; index.html:2963 `html[data-theme="light"][data-appearance="dark"] .mob-bottom-nav{ background:rgba(19,26,43,.82) !important; … }`

**Fix:** index.html:2963 → `background:rgba(19,26,43,.62) !important;`

### Sheet scrim has the right colour but no blur
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Scrim `rgba(15,28,61,.28)` + `blur(6px)`.

**Deployed:** Scrim colour `rgba(15,28,61,.28)` is exactly right, but the rule declares no `backdrop-filter`, so the background behind the sheet stays sharp.

**Evidence:** index.html:2970 `html[data-theme="light"] .nd-alerts-ov{ position:fixed; inset:0; z-index:400; background:rgba(15,28,61,.28); display:none; align-items:flex-end; justify-content:center; }` — no backdrop-filter. README: "Scrim rgba(15,28,61,.28) + blur(6px)".

**Fix:** Add `backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);` to index.html:2970.

### Mobile light screen background is #F6F7FC, not the token page tint #F5F7FF
`Liquid Glass theme` · mobile · verdict CONFIRMED

**Designed:** Screen background `var(--neutral-50)`; the README colour section gives light page tint `#F5F7FF`, which desktop correctly renders.

**Deployed:** The mobile block redefines `--nd-50:#F6F7FC`, so the phone canvas renders `rgb(246, 247, 252)` while desktop renders the correct `rgb(245, 247, 255)` — the two form factors disagree on the base canvas.

**Evidence:** live-mob-light.txt:4 `[0,0,394,1055] | body | … | rgb(246, 247, 252) | …` vs live-desk-light.txt:4 `[0,0,1440,900] | body | … | rgb(245, 247, 255) | …`; index.html:3002 `--nd-0:#FFFFFF; --nd-50:#F6F7FC; …` (inside the `@media (max-width:600px)` block). README: "page tint #F5F7FF".

**Fix:** Remove the `--nd-50:#F6F7FC` redefinition at index.html:3002 so the phone inherits the shared `#F5F7FF` token.

### Icons are a hand-authored inline SVG sprite, not Lucide rendered as a CSS mask
`Icons, logo & assets` · both · verdict ADJUSTED

**Designed:** Lucide 0.544.0 glyphs rendered as a CSS mask (`background-color: currentColor` + `mask-image: url(.../lucide-static@0.544.0/icons/<slug>.svg)`), exactly as the design system's Icon component does — prototype elements carry `data-icon="<slug>"`.

**Deployed:** index.html defines 23 hand-authored `<symbol>` elements in an inline sprite (index.html:3185-3207, `grep -c "<symbol id=" index.html` → 23) referenced via `<svg class="ic-sm"><use href="#i-…"/></svg>`. `grep -n mask-image index.html` returns exactly one hit, index.html:1556 `background-size:46px 46px; mask-image:radial-gradient(130% 120% at 50% 0%,#000,transparent 78%);` — a hero gradient fade, not an icon. `grep -n lucide index.html` returns nothing. However every sprite symbol carries `stroke="currentColor"`, so glyphs DO inherit currentColor; the mechanism swap alone produces no visible rendering difference.

**Evidence:** README.md:26 "Icons: Lucide (24px grid, 2px stroke), rendered as a CSS mask so glyphs inherit `currentColor`"; README.md:202 "Lucide icons via CDN mask (no bundled binaries)." vs index.html:3195 `<symbol id="i-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" …>`

**Fix:** Replace the bespoke sprite with the design system's Icon mask (span with `mask-image: url(https://unpkg.com/lucide-static@0.544.0/icons/<slug>.svg)`, `background-color: currentColor`), or at minimum re-cut every symbol from the canonical Lucide 0.544.0 source so glyph geometry is identical.

### Selected range option uses a CSS ✓ pseudo-element instead of the check icon
`Icons, logo & assets` · both · verdict CONFIRMED

**Designed:** A 16px Lucide `check` icon marking the active range option.

**Deployed:** `.gdr-opt.active::after { content: '✓'; font-size: 11px; margin-left: 8px; }` — a font glyph at 11px, not the designed 16px stroke icon; the `check` slug is never rendered as an icon anywhere.

**Evidence:** index.html:816 `.gdr-opt.active::after { content: '✓'; font-size: 11px; margin-left: 8px; }` vs DesktopOverview.dc.html:753 `<x-import … .Icon" name="check" size="{{ 16 }}">`

**Fix:** Replace the pseudo-element with a 16px `check` icon node inside the active option row.

### Stroke weights deviate from the specified 2px in four rendered places
`Icons, logo & assets` · both · verdict ADJUSTED

**Designed:** 2px stroke on the 24px grid for every icon.

**Deployed:** Verified and rendered: `stroke-width:1.9` on the desktop topbar icons (index.html:2820), the mobile header icons (index.html:3043) and the mobile bottom-nav icons (index.html:3163); `stroke-width="2.2"` on the `#i-chevron-down` sprite symbol (index.html:3200). The two remaining instances the auditor listed — `stroke-width='2.2'` in the toolbar-search data URI (index.html:474) and `stroke-width='2.5'` in the sort-select data URI (index.html:519) — exist in source but never paint, because index.html:2511's `background:#ffffff !important` shorthand erases both background images.

**Evidence:** index.html:2820 `html[data-theme="light"] .nd-tb-ico svg{ width:18px; height:18px; stroke-width:1.9; }`; index.html:3043 `.nd-ico svg{ … stroke-width:1.9; }`; index.html:3163 `.mob-nav-item svg{ stroke-width:1.9; }`; index.html:3200 `<symbol id="i-chevron-down" … stroke-width="2.2" …>`; index.html:474 `stroke-width='2.2'`; index.html:519 `stroke-width='2.5'` vs README.md:26 "Lucide (24px grid, 2px stroke)"

**Fix:** Normalise all six declarations to `stroke-width: 2`.

### Rendered icon sizes differ from the prototype across the chrome
`Icons, logo & assets` · both · verdict CONFIRMED

**Designed:** Desktop: nav 18px, topbar refresh 19px, bell 20px, range-pill calendar 15px, range chevron 14px, settings 18px. Mobile: mark 28px, refresh 20px, bell 22px, calendar 14px, chevron 14px.

**Deployed:** Desktop: nav 17px, refresh 18px, bell 18px, calendar 12px, chevron 11px. Mobile: mark 30px, refresh 21px, bell 21px, calendar 12px, chevron 11px. The range-pill calendar and chevron are the largest misses (-3px and -3px).

**Evidence:** proto-desk-light.txt `[1030,28,15,15] … {"data-icon":"calendar"}`, `[1130,28,14,14] … {"data-icon":"chevron-down"}`, `[1283,26,19,19] … {"data-icon":"refresh-cw"}`, `[1336,25,20,20] … {"data-icon":"bell"}`, `[22,129,18,18] … {"data-icon":"layout-dashboard"}` vs live-desk-light.txt `[1033,28,12,12] | svg`, `[1131,29,11,11] | svg`, `[1285,25,18,18] | svg`, `[1339,25,18,18] | svg`, `[23,134,17,17] | svg`; sizing rules at index.html:811 `.gdr-btn .ic-sm { width: 12px; height: 12px; … }` and index.html:2331 `.tab .ic-sm{ width:17px !important; height:17px !important; }`

**Fix:** Set `.gdr-btn .ic-sm` to 15px (chevron 14px), `.tab .ic-sm` to 18px, and `.nd-tb-ico svg` to 19px (refresh) / 20px (bell).

### Alerts open as a 420px corner panel, not the specified drill-down
`Interactions & behaviour` · both · verdict CONFIRMED

**Designed:** README:146 — drill-downs are a phone full-screen push from the right (back chevron + title + meta) or a desktop 460px right drawer over a scrim (close `x` + title + meta); README:151 — "**Alerts** — 3 notifications with a coloured status dot (action / success / amber)."

**Deployed:** The alerts overlay is implemented and its content is right — live-derived notifications with `action` / `ok` / `warn` coloured dots and a close `x`. The presentation differs: it is a `width:min(420px,100%)`, `max-height:72vh` card pinned to the top-right with `padding:70px 24px 0` on desktop (not a full-height 460px right drawer), and on phone it is a bottom-anchored sheet rising 40px over 280ms rather than a full-screen push from the right over 380ms.

**Evidence:** index.html:2970-2977 `.nd-alerts-ov{ position:fixed; inset:0; z-index:400; background:rgba(15,28,61,.28); display:none; align-items:flex-end; justify-content:center; }` / `@media (min-width:961px){ .nd-alerts-ov{ align-items:flex-start; justify-content:flex-end; padding:70px 24px 0; } }` / `.nd-alerts{ width:min(420px,100%); max-height:72vh; … animation:ndSheet 280ms cubic-bezier(.2,0,.2,1) both; }`; dots at index.html:2985-2986 `.nd-alert i{ … background:#2952FF; } .nd-alert i.ok{ background:#19B672; } .nd-alert i.warn{ background:#F59E0C; }`; README.md:146.

**Fix:** Fold the alerts panel into the shared drill-down host so it inherits the 460px desktop drawer over `--surface-scrim` and the 380px phone push, keeping the existing dot tones and content.

### Revenue sub-line uses 'incl. $' and is unclamped, so the KPI grid loses row parity
`Mobile card stack` · mobile · verdict ADJUSTED

**Designed:** Sub-line reads '+ $' + usd + ' · ' + n + ' payments' on one line, as the prototype (`[33,587,145,19] | span | 12/500/... TXT«+ · payments»` with interps $96 / 31) and the desktop path (index.html:6847 `(M.revUsd > 0 ? '+ $' + Math.round(M.revUsd).toLocaleString('en-US') + ' · ' : '')`) both do; all four tiles the same height (prototype: 179x106 each).

**Deployed:** index.html:7108 emits `'incl. $' + Math.round(revUsd).toLocaleString('en-US') + ' · '`, and `.nd-kpi s` has no line clamp or nowrap, so with live values the sub-line runs to 34px (two lines) in the 123px column and the top tile row renders 128px against the bottom row's 111px.

**Evidence:** proto-mob-light.txt:98 `[16,517,179,106] | button | {"data-dc-tpl":"69","data-card":""}`, :112 `[16,634,179,106]` (all four tiles 106px) and :110 `[33,587,145,19] | span | 12/500/... TXT«+ · payments»` | live-mob-light.txt `[29,501,157,128] | button.nd-card.nd-kpi`, `[46,575,123,34] | s | 12.5/400/normal/normal | ... TXT«incl. $308 · 103 payments»`, `[29,642,157,111] | button.nd-card.nd-kpi` | index.html:7108 `(revUsd > 0 ? 'incl. $' + ... + ' · ' : '')`

**Fix:** Restore the designed "+ $N · M payments" wording (as the desktop path at index.html:6841 still does) and/or shorten to "+$308 · 103 pay" so the line fits one row; alternatively give `.nd-kpi` a fixed min-height so the grid rows stay equal.

### "See all" affordance uses a literal › character instead of the Lucide chevron-right icon, at the wrong size and blue
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** "See all" label at 13px/600 in --action-600 rgb(27,63,224), followed by a 14x14 masked Lucide `chevron-right` icon element. Prototype renders `TXT«See all»` plus `[347,782,14,14] | span | {"data-icon":"chevron-right"}`.

**Deployed:** A single text node "See all ›" at 14px/600 in --action-500 rgb(41,82,255); no icon element, so the arrow inherits the text font's glyph shape and baseline rather than the 24px-grid/2px-stroke Lucide mark.

**Evidence:** README.md §Design system: "Icons: Lucide (24px grid, 2px stroke), rendered as a CSS mask ... Slugs used: ... `chevron-right` ..." | proto-mob-light.txt:133-135 `[301,773,64,32] | button | 13/600/normal/20.15px | rgb(27, 63, 224) | ... TXT«See all»` then `[347,782,14,14] | span | {"data-icon":"chevron-right"}` | live-mob-light.txt `[283,786,55,32] | button.nd-see | 14/600/normal/normal | rgb(41, 82, 255) | ... TXT«See all ›»` | index.html:7125,7132,7134 `>See all ›</button>` and index.html:3124 `.nd-see{ ... font-size:14px; font-weight:600; color:var(--nd-act-500); ...}`

**Fix:** Replace the `›` character with the chevron-right icon span used elsewhere, and set `.nd-see` to 13px with `color:var(--nd-act-600)`.

### Hero comparison caption reads "vs 2,334 prior" instead of "vs {n} prior period"
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** "vs 1,446 prior period" — the word "period" is part of the designed caption (the desktop path in the same file still emits it).

**Deployed:** "vs 2,334 prior"; the mobile template drops "period".

**Evidence:** README.md §1: "1. **Hero signups** — eyebrow \"New signups · {range}\", 40px metric, delta badge (`success`/`danger` tone, `+33.7%`), \"vs 1,446 prior period\"" | proto-mob-light.txt:65 `[258,307,107,14] | span.sc-interp | 11/500/normal/17.05px | rgb(162, 166, 179) | ... TXT«vs 1,446 prior period»` | live-mob-light.txt `[269,285,67,16] | span.nd-prev | 11.5/400/-0.084px/normal | ... TXT«vs 2,334 prior»` | index.html:7102 `'<span class="nd-prev">vs ' + prevN.toLocaleString('en-IN') + ' prior</span>'` vs index.html:6835 (desktop) `' prior period</span>'`

**Fix:** Append " period" at index.html:7102 to match the desktop string.

### Card eyebrows render 11.5px/600/0.07em instead of 11px/700/0.08em
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** Eyebrow: 11px / 700 / 0.08em (= 0.88px) uppercase. Prototype renders `11/700/0.88px` for "New signups ·", "Revenue", "Active Pro", "Signed up & paid", "Payers · ARPU".

**Deployed:** All five render `11.5/600/0.805px` — half a pixel larger, one weight step lighter, slightly tighter tracking.

**Evidence:** README.md §Typography: "| Eyebrow / table header | 11px / 700 / 0.08em / uppercase (10px in dense grids) |" | proto-mob-light.txt:105 `[33,534,145,17] | span | {"data-dc-tpl":"70"} | 11/700/0.88px/17.05px | ... TXT«Revenue»` | live-mob-light.txt `[46,520,123,16] | span.nd-lbl | 11.5/600/0.805px/normal | ... TXT«Revenue»` | index.html:3088 `.nd-lbl{ font-size:11.5px; font-weight:600; letter-spacing:.07em; text-transform:uppercase; ... }`

**Fix:** Set `.nd-lbl` to `font-size:11px; font-weight:700; letter-spacing:.08em;` at index.html:3088.

### Hero chart x-axis labels render at 11px/400 instead of 10px/500
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** "x labels 10px" per the hero-card spec; prototype renders them `10/500/normal/15.5px`.

**Deployed:** `11/400/-0.084px/normal` — 1px larger and lighter than designed.

**Evidence:** README.md §1: "...then a tappable bar chart (height 120px, bars `border-radius 8px 8px 4px 4px`, gap 8px for ≤8 bars / 4px ≤16 / 2px above, x labels 10px)" | proto-mob-light.txt:87 `[49,470,17,13] | span.sc-interp | 10/500/normal/15.5px | rgb(162, 166, 179) | ... TXT«Thu»` | live-mob-light.txt `[50,451,34,15] | span | 11/400/-0.084px/normal | rgb(162, 166, 179) | ... TXT«Thu»` | index.html:3109 `.nd-xlbl span{ ... font-size:11px; font-weight:400;`

**Fix:** Set the `.nd-xlbl span` rule at index.html:3109 to `font-size:10px; font-weight:500;`.

### Recent-signups initials avatar is 40px instead of the designed 36px
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** 36px initials avatar, initials at 13px/700. Prototype `[37,1135,36,36] ... 13/700`.

**Deployed:** 40x40 avatar with initials at 13px/600, which also widens the row and pushes the name/email column in.

**Evidence:** README.md §1: "4. **Recent signups** — 5 rows: 36px initials avatar ..." | proto-mob-light.txt:198 `[37,1135,36,36] | span | {"data-dc-tpl":"104"} | 13/700/normal/20.15px | rgb(63, 74, 102) | rgb(238, 241, 248) | r:50%` | live-mob-light.txt `[48,1164,40,40] | span.nd-ini | 13/600/-0.084px/normal | rgb(63, 74, 102) | rgba(15, 28, 61, 0.05) | r:50% | ... TXT«M»` | index.html:3127 `.nd-ini{ width:40px; height:40px; border-radius:50%; ... }`

**Fix:** Set `.nd-ini` to 36x36 at index.html:3127 and the initials weight to 700.

### Active Pro sub-line abbreviates the user base to "34.8K" where the design prints the grouped full count
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** "{pct}% of {n} users" with the count formatted in full with separators — prototype renders "1.23% of 13,373 users" (13,373 as a discrete tabular-nums token).

**Deployed:** "0.80% of 34.8K users" — the count is collapsed to one decimal and a K suffix, which breaks the tabular-nums treatment the spec applies to every numeric surface.

**Evidence:** README.md §1: "Active Pro (count + % of users)" and §Typography: "`font-variant-numeric: tabular-nums` on every numeric surface" | proto-mob-light.txt:114-115 `[224,588,37,15] | span.sc-interp | ... TXT«1.23%»` / `[278,588,40,15] | span.sc-interp | ... TXT«13,373»` | live-mob-light.txt `[217,575,123,17] | s | 12.5/400/normal/normal | ... TXT«0.80% of 34.8K users»` | index.html:7113 `(newProduct >= 1000 ? (newProduct / 1000).toFixed(1) + 'K' : newProduct) + ' users</s></button>'`

**Fix:** Use `newProduct.toLocaleString('en-IN')` at index.html:7113 instead of the K abbreviation.

### Recent payments plan labels are abbreviated ("Pro-3", "Pro") rather than the designed full plan names
`Mobile card stack` · mobile · verdict CONFIRMED

**Designed:** Plan names spelled out — prototype rows read "Pro monthly", "Pro 3-month", "Pro weekly".

**Deployed:** "Pro-3 · now", "Pro · now" — the tier is shortened to a code, so a reader cannot tell the weekly plan from the monthly one.

**Evidence:** README.md §1: "5. **Recent payments** — 4 rows: email, plan · time, amount in `--text-success`." | proto-mob-light.txt:298 `[37,1511,69,15] | span.sc-interp | 12/500/normal/18.6px | ... TXT«Pro monthly»` (and TXT«Pro 3-month», TXT«Pro weekly») | live-mob-light.txt `[48,1520,218,18] | s | 13/400/-0.084px/normal | ... TXT«Pro-3 · now»` | index.html:7093 `esc(planTxt) + ' · ' + ago(r[3])` with `planTxt = planLabel(r[2] || 'pro')` (index.html:5466)

**Fix:** Extend `planLabel()` (index.html:5466) to return "Pro monthly" / "Pro 3-month" / "Pro weekly" for the mobile overview rows.

### Card gap is 14px instead of 12px
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:97 "card gap 12px". Prototype: `[0,217,402,1976] | div | {"data-scroll":""} | … | g:12`.

**Deployed:** Live: `[15,197,356,1652] | div | {"id":"overviewArea"} | … | g:14`.

**Evidence:** index.html:3077 `html[data-theme="light"] #overviewArea{ padding:14px 14px 104px; display:flex; flex-direction:column; gap:14px; }`

**Fix:** Change `gap:14px` to `gap:12px`.

### Tab bar inset 14px / bottom 12px instead of 16px / 14px
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:72 "floating pill inset 16px, bottom 14px". Prototype: `[16,2115,370,64]` — 16px each side, bottom edge 14px above the frame bottom (2179 in a 2193 doc), height 64.

**Deployed:** Live: `[14,800,366,62]` — 14px each side, bottom 12px (800+62=862 in an 874 viewport), height 62.

**Evidence:** index.html:3152 `left:14px !important; right:14px !important; bottom:calc(12px + env(safe-area-inset-bottom)) !important;`

**Fix:** Change to `left:16px; right:16px; bottom:calc(14px + env(safe-area-inset-bottom))`.

### Header glass is 72% white instead of 55%
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:71 "Header: `rgba(255,255,255,.55)` + `blur(24px) saturate(1.6)`, hairline `rgba(255,255,255,.8)`". Prototype: `[0,0,402,217] | div | {"data-header":""} | … | rgba(255, 255, 255, 0.55) | … | bf:blur(24px) saturate(1.6)`.

**Deployed:** Live: `[0,0,394,181] | div.mobile-topbar | {"data-nd":"1"} | … | rgba(255, 255, 255, 0.72) | … | bf:blur(24px) saturate(1.6)`, and the hairline is `rgba(255,255,255,.9)` rather than `.8`. The blur/saturate pair matches exactly.

**Evidence:** index.html:3025 `background:rgba(255,255,255,.72) !important; border-bottom:1px solid rgba(255,255,255,.9) !important;` vs README.md:71

**Fix:** Change to `rgba(255,255,255,.55)` and `border-bottom:1px solid rgba(255,255,255,.8)`.

### Header avatar is 34px and has lost its inset ring
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Prototype: `[352,68,32,32] | span | {"data-dc-tpl":"32"} | 12/700/normal/18.6px | rgb(27, 63, 224) | rgb(238, 242, 255) | r:50% | … | sh:rgb(227, 231, 240) 0px 0px 0px 1px inset | TXT«JS»` — 32px with a 1px neutral inset ring.

**Deployed:** Live: `[346,14,34,34] | span.nd-av | … | 12.5/700/normal/normal | rgb(27, 63, 224) | rgb(238, 242, 255) | r:50% | b:- | sh:- | TXT«JS»` — 34px, no ring, 12.5px label.

**Evidence:** index.html:3047-3048 `html[data-theme="light"] .nd-av{ width:34px; height:34px; border-radius:50%; background:var(--nd-act-50); color:var(--nd-act-600); font-size:12.5px; font-weight:700; … }`

**Fix:** Set `width:32px; height:32px; font-size:12px; box-shadow:inset 0 0 0 1px var(--nd-200);`.

### Segmented labels are 14px/500 instead of 13px/600
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** Prototype buttons: `[24,164,118,36] | button | {"data-dc-tpl":"43"} | 13/600/normal/20.15px | rgb(112, 119, 139)` for inactive and `13/600 | rgb(15, 28, 61)` for the active "Overall" — weight stays 600, only colour changes.

**Deployed:** Live: `[20,122,117,40] | button.bkt | {"data-view":"influencer"} | 14/500/normal/14px | rgb(112, 119, 139)` and `[257,122,117,40] | button.bkt.is-on | {"data-view":"overall"} | 14/700/normal/14px | rgb(15, 28, 61)` — 14px, and the active tab jumps 500→700, which reflows the label width on every switch.

**Evidence:** index.html:3069-3072 `.bucket-seg .bkt{ … height:40px !important; font-size:14px !important; font-weight:500 !important; … }` / `.bkt.is-on{ … font-weight:700 !important; }`

**Fix:** Set `font-size:13px; font-weight:600` on `.bkt` and drop the weight change on `.is-on`, keeping only the colour swap.

### Segmented thumb uses the flat easing, not the glass easing
`Mobile chrome` · mobile · verdict CONFIRMED

**Designed:** README:87 "Segmented thumb slide | 320ms `cubic-bezier(.32,.72,0,1)`; glass 460ms `cubic-bezier(.34,1.3,.64,1)`" — the mobile header is the glass theme, so 460ms with the overshoot curve.

**Deployed:** The thumb transitions with the flat-theme value `transform 320ms cubic-bezier(.32,.72,0,1)`.

**Evidence:** index.html:3067 `box-shadow:0 2px 8px -2px rgba(15,28,61,.18); transition:transform 320ms cubic-bezier(.32,.72,0,1);`

**Fix:** Change to `transition:transform 460ms cubic-bezier(.34,1.3,.64,1)`.

### Desktop card stagger is 50ms per card, not 60ms
`Motion` · desktop · verdict CONFIRMED

**Designed:** 60ms per card (README Motion table: "Card rise-in (glass), staggered 60ms per card"; proto delays run 0.06s / 0.12s / 0.18s / 0.24s / 0.3s / 0.36s).

**Deployed:** 50ms per card: 50 / 100 / 150 / 200ms.

**Evidence:** index.html:2841-2845 `#overviewArea > *:nth-child(2){ animation-delay:50ms }` … `:nth-child(5){ animation-delay:200ms }`; digest live-desk-light.txt shows `an:0.42s … 0.05s both ndcRise`, `… 0.1s …`, `… 0.15s …`, `… 0.2s …`

**Fix:** Change the four delays to 60/120/180/240ms.

### Refresh spinner rotates at 900ms, not 800ms
`Motion` · both · verdict CONFIRMED

**Designed:** `rotate(360deg)` 800ms linear infinite (README Motion table; MobileOverview.dc.html:31 `[data-spin="true"]{animation:nrSpin 800ms linear infinite}`).

**Deployed:** 900ms (`.9s`) on both the desktop topbar icon and the mobile header icon — 12.5% slower than spec.

**Evidence:** index.html:2828 `html[data-theme="light"] .nd-tb-ico.spin svg{ animation:ndSpin .9s linear infinite; }` and index.html:2829 `html[data-theme="light"] .nd-ico.spin svg{ animation:ndSpin .9s linear infinite; }`

**Fix:** Change both to `animation:ndSpin 800ms linear infinite`. (The legacy `.spinner` at index.html:410 and the pull-to-refresh at index.html:2268 both run 0.7s — align those too if they are meant to be the same spinner.)

### Mobile segmented-button press has no transform transition, so scale(.96) snaps
`Motion` · both · verdict ADJUSTED

**Designed:** `transition:color 220ms cubic-bezier(.2,0,.2,1), transform 140ms` on segmented buttons (MobileOverview.dc.html:43 / DesktopOverview.dc.html:43), matching the README "Tap feedback | scale(.90–.97), 140ms" row.

**Deployed:** Mobile only. index.html:3069-3071 `html[data-theme="light"] .nd-head .bucket-seg .bkt{ … border:none !important; color:var(--nd-500) !important; transition:color 220ms cubic-bezier(.2,0,.2,1); }` names only `color`, while index.html:3073 `html[data-theme="light"] .nd-head .bucket-seg .bkt:active{ transform:scale(.96); }` applies and releases instantly — live-mob-light.json confirms the computed transition on all three `.bkt` buttons is `color 0.22s cubic-bezier(0.2, 0, 0.2, 1)` with no transform. On DESKTOP there is no `:active` scale at all: `grep -n ":active{ transform:scale" index.html` returns 2293, 3044, 3073, 3115, 3162, every one of them inside a max-width:600px block. So nothing snaps on desktop — desktop is missing the tap-feedback state outright (index.html:2803-2805 `transition:color 220ms`), which is a different defect, not this one.

**Evidence:** index.html:3071 `border:none !important; color:var(--nd-500) !important; transition:color 220ms cubic-bezier(.2,0,.2,1); }` with index.html:3073 `html[data-theme="light"] .nd-head .bucket-seg .bkt:active{ transform:scale(.96); }`

**Fix:** Append `, transform 140ms` to the `.bkt` transition on both the mobile (index.html:3071) and desktop (index.html:2805) rules.

### Mobile header icon buttons press to scale(.9) with no transition at all
`Motion` · mobile · verdict CONFIRMED

**Designed:** Tap feedback `scale(.90–.97)` over 140ms (README Motion table).

**Deployed:** `.nd-ico` declares no `transition` property, so the `:active` `scale(.9)` is instantaneous in both directions — a hard snap on the refresh, bell and team buttons.

**Evidence:** index.html:3041-3042 `html[data-theme="light"] .nd-ico{ width:42px; height:42px; … background:none; border:none; cursor:pointer; padding:0; }` (no transition) with index.html:3044 `html[data-theme="light"] .nd-ico:active{ transform:scale(.9); }`

**Fix:** Add `transition:transform 140ms cubic-bezier(.2,0,.2,1);` to the `.nd-ico` rule.

### Desktop segmented-button colour change uses the browser default ease
`Motion` · desktop · verdict CONFIRMED

**Designed:** Control states use `cubic-bezier(.2,0,.2,1)` (README Motion table; DesktopOverview.dc.html:167 `transition:color 220ms cubic-bezier(.2,0,.2,1),transform 140ms`).

**Deployed:** `transition:color 220ms` with no timing function, so it falls back to `ease`. Same omission on the appearance switcher at index.html:2926.

**Evidence:** index.html:2805 `border:none !important; color:var(--nd-500) !important; transition:color 220ms; }`

**Fix:** Write `transition:color 220ms cubic-bezier(.2,0,.2,1), transform 140ms;` at index.html:2805 and add the curve at index.html:2926.

### Sidebar nav and topbar icon hovers use `ease`, not cubic-bezier(.2,0,.2,1)
`Motion` · desktop · verdict ADJUSTED

**Designed:** Control states (hover, colour, press) run 140–220ms on `cubic-bezier(.2,0,.2,1)` (README Motion table; DesktopOverview.dc.html:86 `[data-desk] [data-nav]{transition:background 140ms cubic-bezier(.2,0,.2,1),color 140ms}`).

**Deployed:** The conclusion holds but the cited sidebar rule is not the winning one. index.html:2763 `transition:background .14s ease, color .14s ease !important` is overridden by the more specific index.html:2669 `html[data-theme="light"] .sidebar .tab{ transition:font-size 0s linear .14s, background .15s ease, color .15s ease !important; }` (specificity 0,3,1 vs 0,2,1, both !important). cap/live-desk-light.json confirms the sidebar nav links compute `font-size 0s linear 0.14s, background 0.15s, color 0.15s` — 150ms, and no timing function, i.e. the browser default `ease`. The topbar icon claim is exact: index.html:2816-2818 `html[data-theme="light"] .nd-tb-ico{ … color:var(--nd-700); cursor:pointer; transition:border-color .15s ease, color .15s ease; }`, computing `border-color 0.15s, color 0.15s` on `body/div:4/div:1/header:0/button:4` and `button:5`. So: both effective durations are 150ms (in the 140-220ms band) and both use `ease` (`cubic-bezier(.25,.1,.25,1)`) instead of `cubic-bezier(.2,0,.2,1)`.

**Evidence:** index.html:2763 `white-space:nowrap; transition:background .14s ease, color .14s ease !important; transform:none !important; }` and index.html:2818 `color:var(--nd-700); cursor:pointer; transition:border-color .15s ease, color .15s ease; }`

**Fix:** Swap `ease` for `cubic-bezier(.2,0,.2,1)` in both rules.

### KPI labels reworded from the spec
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** Labels: Signups, Sales, Conv, Revenue, Spend, ROAS · CAC (README:118; proto `TXT«Conv»`, `TXT«Spend»`, `TXT«ROAS · CAC»`).

**Deployed:** Labels: Signups, Sales, Conversion, Revenue, Budget spent, ROAS (+ separate CAC).

**Evidence:** live-desk-report.txt: `[697,264,117,14] | div.rep-kpi-label | ... | TXT«Conversion»` and `[1035,264,117,14] | div.rep-kpi-label | ... | TXT«Budget spent»`

**Fix:** Use the spec strings "Conv", "Spend" and "ROAS · CAC".

### Entry form confirms with an inline message instead of the designed toast
`Report / Creators / Search` · both · verdict CONFIRMED

**Designed:** Save toasts "Entry saved for {creator}" (README:158).

**Deployed:** An inline status line reads "Entry saved." with no creator name and no toast.

**Evidence:** index.html:11? — `msg.textContent = 'Entry saved.'; msg.className = 'cf-msg ok';` in `cfSave()` (index.html:5129)

**Fix:** Replace the inline `cf-msg` confirmation with the toast `Entry saved for ${creator}`.

### Explicit "Search" submit button added beside the field
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** The field alone; no submit button in the design (README:130, proto search row has only the icon and the input).

**Deployed:** An 86×44 primary "Search" button sits to the right of the field.

**Evidence:** live-desk-search.txt: `[1075,118,86,44] | button.btn.btn-primary | {"id":"searchBtn"} | 13/600 | r:4px | ... | TXT«Search»`; index.html:3364

**Fix:** Drop the button and search on input/Enter, or keep it only as a visually secondary affordance.

### Delta badge is 12.5px / 700 instead of the prototype's 13px / 600
`Typography` · both · verdict CONFIRMED

**Designed:** Prototype delta badge: 13px / 600 / normal tracking (proto-desk-light.txt `[449,173,49,17] … 13/600/normal/16.9px … TXT«+33.7%»`); README meta row is "Meta, captions | 11–12px / 500".

**Deployed:** Desktop 12.5px / 700 / -0.084px, mobile 12.5px / 600 / -0.084px — half-pixel size and, on desktop, a weight two steps heavier than the prototype and outside the meta row.

**Evidence:** digest live-desk-light.txt: `[484,164,74,24] | span.nd-badge.up |  | 12.5/700/-0.084px/normal | … | TXT«+370.0%»` vs proto-desk-light.txt `13/600/normal/16.9px`; index.html:3094-3095 `html[data-theme="light"] .nd-badge{ … font-size:12.5px; font-weight:600; white-space:nowrap; }`

**Fix:** Normalise the badge to 12px / 600 (meta row) or 13px / 600 (prototype) and drop the desktop weight-700 override.

### Sidebar tab badges render at 10.5px (10px on phone) in IBM Plex Mono inside interactive links
`Typography` · both · verdict CONFIRMED

**Designed:** README: "all interactive labels ≥ 12px" and single family Plus Jakarta Sans; the 10.5px/600 row is reserved for the phone tab-bar label. The prototype sidebar has no numeric badges at all (no such node in proto-desk-light.json).

**Deployed:** `.tab-badge` renders 10.5px / 600 / -0.21px on desktop and 10px / 600 / -0.2px in the phone drawer, in IBM Plex Mono, inside `<a class="tab">` — i.e. sub-12px text inside an interactive target, in a second font family.

**Evidence:** digest live-desk-light.txt: `[205,218,20,16] | span.tab-badge |  | 10.5/600/-0.21px/normal | … | TXT«—»` (raw live-desk-light.json fontFamily = "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace); index.html:1824-1826 lists `.tab-badge` in the `font-family:'IBM Plex Mono',…!important` group; index.html:1413 `.tab-badge{ margin-left:auto; font-size:10px; font-weight:700; … }`

**Fix:** Raise `.tab-badge` to 12px and remove it from the IBM Plex Mono list at index.html:1824-1826.

### Chart axis labels ship in IBM Plex Mono 11px/400 and axis titles at weight 900
`Typography` · desktop · verdict ADJUSTED

**Designed:** README: single family Plus Jakarta Sans, "weights 300–800"; "Meta, captions | 11–12px / 500". Weight 900 is outside the declared range and the prototype never uses it (max weight in proto-desk-report.json is 800).

**Deployed:** ApexCharts renders 75 axis tick-label nodes (25 text + 25 tspan + 25 title) at 11px / 400 in IBM Plex Mono, a second family the design system does not define. Separately, the two y-axis titles («Signups», «Revenue») render at 11px / 900 in "General Sans" — not IBM Plex Mono — a weight outside the declared 300–800 range, inherited from an ApexCharts default because index.html:11985/11987 set only fontSize on the title style.

**Evidence:** digest/raw live-desk-report.json: `text` node at `[381,1503,14,43]` — 11px / 900 / -0.084px, TXT«Signups» (fontFamily "IBM Plex Mono"); index.html:11983 `labels:{style:{fontSize:'11px',fontFamily:'IBM Plex Mono'}, datetimeUTC:false}` and index.html:11986 `labels:{formatter:v=>_nf(Math.round(v)),style:{fontSize:'11px',fontFamily:'IBM Plex Mono'}}`

**Fix:** Set the Apex `chart.fontFamily` and every `style.fontFamily` to 'Plus Jakarta Sans', and pin axis-title `fontWeight` to 700 (or 500 for tick labels) rather than leaving the library default of 900.

### Alerts list emits four items in steady state, not the three the spec calls for, and adds two categories the design has no counterpart for
`Widgets & alerts` · both · verdict ADJUSTED

**Designed:** README.md:151 — 'Alerts — 3 notifications with a coloured status dot (action / success / amber)'; the design set is a daily digest (action dot), a revenue item (success dot) and a PostHog-budget item (amber dot) (MobileOverview.dc.html:1066-1070).

**Deployed:** ndAlerts() (index.html:6905-6944) renders four rows in steady state — 'Daily digest' (info/blue), 'Top acquisition channel' (info/blue), 'Revenue' (ok/green), 'Same-window conversions up|down' (ok/green or warn/amber) — plus 'PostHog read budget exhausted' (warn/amber) during an outage. 'Top acquisition channel' and 'Same-window conversions' have no counterpart in the designed set, and two blue rows run consecutively where the design alternates action/success/amber.

**Evidence:** index.html:6905-6945 — `if (pausedUntil) out.push({ tone: 'warn', title: 'PostHog read budget exhausted' …})` … `out.push({ tone: 'info', title: 'Daily digest' …})` … `out.push({ tone: 'info', title: 'Top acquisition channel' …})` … `if (M.totalRevInr) out.push({ tone: 'ok', title: 'Revenue' …})` … `out.push({ tone: M.swDelta >= 0 ? 'ok' : 'warn', title: 'Same-window conversions ' + …})`

**Fix:** Cap the feed at the three designed slots — digest (action), a revenue *milestone* condition (success), budget/degradation (amber) — and keep the amber slot occupied by the stale-snapshot state rather than hiding it when the budget is healthy.

### Sparkline inactive-bar alpha and minimum bar height differ from the mock
`Widgets & alerts` · widget · verdict CONFIRMED

**Designed:** Bars are `bgGlass: i === 6 ? '#fff' : 'rgba(255,255,255,.55)'` with height `Math.round(x / max * 100) + '%'` and no floor (NextRaise Mobile.dc.html:194, consumed at :124).

**Deployed:** Inactive bars are `rgba(255,255,255,.35)` — noticeably fainter than .55 — and every bar is floored at 8% by `Math.max(8, Math.round(v / max * 100))`, so a zero day still paints a stub.

**Evidence:** widget.html:51 `.mini i{ flex:1; border-radius:2px; background:rgba(255,255,255,.35); }`

**Fix:** Raise the inactive bar to `rgba(255,255,255,.55)`; drop the 8% floor or lower it so empty days read as empty.

### Widget stack gap and medium-widget width diverge from the mock
`Widgets & alerts` · widget · verdict CONFIRMED

**Designed:** The mock panel stacks its children at `gap:20px` and the medium is a fixed `width:332px` — exactly the width of the two 158px smalls plus their 16px gutter — so it aligns flush with the row above (NextRaise Mobile.dc.html:108 and :142).

**Deployed:** `.wrap{ … gap:16px; }` (4px tighter between the small row and the medium) and `.w.med{ width:100%; … }`, which at the 402px max-width minus the 24px body gutters renders 354px — 22px wider than the two smalls above it, so the right edges no longer line up.

**Evidence:** widget.html:30 `.wrap{ position:relative; width:100%; max-width:402px; display:flex; flex-direction:column; gap:16px; }` and widget.html:41 `.w.med{ width:100%; height:158px; }`

**Fix:** Set the wrap gap to 20px and constrain the medium to `calc(158px * 2 + 16px)` so it matches the small row.

### Alert meta slot carries a range label instead of a clock time, and sits on the title row
`Widgets & alerts` · both · verdict CONFIRMED

**Designed:** Drill-down row stacks title / body / when vertically, with `when` last at `font-size:11px;font-weight:500;color:var(--text-subtle)` (MobileOverview.dc.html:581-587), and the designed values are timestamps: `when: '9:00 AM'`, `'Yesterday · 6:12 PM'`, `'Yesterday · 9:58 AM'` (MobileOverview.dc.html:1067-1069).

**Deployed:** `when` is rendered on the title's baseline row, right-aligned at 11.5px, and its values are range labels — `when: 'today'`, `when: M.rangeLabel.toLowerCase()` (i.e. 'last 7 days', 'this month') — so an alert reads 'Revenue … last 7 days' where the design shows a time of day.

**Evidence:** index.html:2988 `html[data-theme="light"] .nd-alert .tp{ display:flex; justify-content:space-between; gap:10px; align-items:baseline; }` with index.html:6930 `when: M.rangeLabel.toLowerCase() });`

**Fix:** Move `when` below the body at 11px/text-subtle and populate it with the alert's actual timestamp (the digest run time, the payment time, the retry time), keeping the range in the body copy.

## INFO (13)

### The USD→INR rate is a live third-party fetch defaulting to 94, not the configurable ₹84 the spec calls for
`Completeness critic` · both · verdict CRITIC

**Designed:** README:192 — 'only combined for ARPU/ROAS at ₹84 per $1 — make that rate configurable.'

**Deployed:** `USD_TO_INR` defaults to 94 and is overwritten from `https://open.er-api.com/v6/latest/USD` with a 6-hour localStorage cache; there is no setting for it in the Settings modal, so the one value the spec asked to expose is the one the user cannot set, and the dashboard takes an undeclared runtime dependency on a third-party FX endpoint.

**Evidence:** index.html:4794-4800 `let USD_TO_INR = (() => { ... return 94; })();`; index.html:4801-4808 `async function fetchFxRate() { const r = await fetch('https://open.er-api.com/v6/latest/USD'); ... USD_TO_INR = Math.round(rate * 100) / 100; ... }`; README.md:192.

**Fix:** Expose the rate in Settings (seeded at 84), and treat the live fetch as an optional override rather than the only source.

### Several sub-minimum control sizes are inherited from the approved prototype, not introduced by the build
`Completeness critic` · both · verdict CRITIC

**Designed:** README:46 sets 44px phone / 40px desktop minimums and ≥12px interactive labels.

**Deployed:** The prototype itself ships 32px 'See all' buttons (`[557,519,64,32] | button ... TXT«See all»`), 34px segmented buttons and 36px secondary nav rows, and README:44 fixes tab labels at 10.5px. So those live sizes match the design and should not be filed as implementation defects — the rule needs reconciling with the design, or the design needs revising. Recording it so these are not re-litigated as regressions.

**Evidence:** digest/proto-desk-light.txt:201 `[557,519,64,32] | button | {"data-dc-tpl":"114"} | 13/600/normal/20.15px ... TXT«See all»`; digest/proto-mob-light.txt:127 (same 64×32); README.md:44 `| Tab label | 10.5px / 600 |` vs README.md:46 'all interactive labels ≥ 12px'.

**Fix:** Decide one way: either relax README:46 for these roles or grow the prototype's controls, then hold the implementation to whichever wins.

### --neutral-300 #33405E has no counterpart in the implementation
`Dark appearance` · both · verdict ADJUSTED

**Designed:** `--neutral-300:#33405E` as the fifth step of the dark neutral ramp (prototype header: `"--neutral-300":"#33405E"`).

**Deployed:** The dark block (index.html:2933) defines --nd-0/50/100/200 and stops; no --nd-300 exists. The step has no visual consequence: rgb(51,64,94) renders on 0 elements in every prototype capture as well, so nothing in the approved design depends on it.

**Evidence:** index.html:2933 `--nd-0:#131A2B; --nd-50:#090D18; --nd-100:#1A2236; --nd-200:#242E46;` (no --nd-300 on this or any other line); `grep -c -- "--nd-300" index.html` → 0. proto-desk-dark.txt:2 `"--neutral-300":"#33405E"`.

**Fix:** Add `--nd-300:#33405E;` to index.html:2933 (and `--nd-300:#CDD3E0` to the light ramp).

### None of the 30 spec token names exist; the remap is rebuilt under a private --nd-* namespace
`Dark appearance` · both · verdict CONFIRMED

**Designed:** README: "Always reference via `var(--*)`: `--neutral-0/50/100/200/300`, `--text-heading/body/muted/subtle/link/brand/success/danger`, `--action-50/200/500/600`, `--border-subtle/default`, `--surface-glass/scrim`, `--shadow-xs/sm/md/lg/xl`" — the prototype exposes exactly these names.

**Deployed:** Zero of --neutral-*, --text-heading/body/muted/subtle/link/brand/success, --action-*, --ink-900, --border-subtle/default, --surface-glass/scrim, --amber-*, --red-* exist in index.html (all grep counts 0). They are replaced by --nd-0/50/100/200/400/500/700/900, --nd-act-*, --nd-ok-*, --nd-red-*, --nd-amber-*, --nd-edge/--nd-card/--nd-hair/--nd-sh plus a second app-level alias set (--canvas/--surface/--border/--text/--text-2/--blue). Most of these do drive the equivalent surfaces, so this is a naming divergence rather than a visual defect on its own — but it is why the seven genuinely-missing tokens above went unnoticed.

**Evidence:** Live digest header live-desk-dark.txt:2 `# tokens: {"--nd-0":"#131A2B","--nd-50":"#090D18","--nd-900":"#F2F5FB","--nd-act-500":"#5C79FF","--canvas":"#090D18","--surface":"#131A2B","--border":"rgba(255,255,255,.10)","--text":"#F2F5FB","--text-2":"#C9D1E4","--blue":"#5C79FF"}` vs proto-desk-dark.txt:2 `# tokens: {"--neutral-0":"#131A2B","--neutral-50":"#090D18",...,"--surface-glass":"rgba(19,26,43,.82)","--ink-900":"#F2F5FB"}`. Block: index.html:2932-2953.

**Fix:** Alias the spec names onto the --nd-* values (`--neutral-0:var(--nd-0)` etc.) in both token blocks so design-system references resolve and gaps become visible.

### Dark root selector is [data-appearance="dark"], spec says [data-mode="dark"]
`Dark appearance` · both · verdict CONFIRMED

**Designed:** README: "Dark mode remaps tokens on the screen root via `[data-mode="dark"]` — implement as a theme class, not a separate stylesheet." State shape in the spec is `mode: 'light'|'dark'|'auto'`.

**Deployed:** The implementation keys off `html[data-theme="light"][data-appearance="dark"]`. It is a root-level class-style remap as required (not a separate stylesheet), so behaviour matches; only the attribute name differs.

**Evidence:** index.html:2932 `html[data-theme="light"][data-appearance="dark"]{`. README line 52 and README line 184 `mode: 'light'|'dark'|'auto'`.

**Fix:** Either rename the attribute to data-mode or record data-appearance as the agreed name in the spec.

### "Signed up & paid" sub-line is tinted success green instead of the muted sub-line colour
`Desktop cards & tables` · desktop · verdict ADJUSTED

**Designed:** Ambiguous in the design. The rendered prototype shows all four KPI sub-lines at 12px/500 in var(--text-muted) = rgb(112,119,139), because DesktopOverview.dc.html:242 hardcodes `color:var(--text-muted)`. But DesktopOverview.dc.html:1176 defines `paidDeltaColor: pp == null || paid - pp >= 0 ? 'var(--text-success)' : 'var(--text-danger)'` for this same line — an unbound view-model field asking for precisely the tint the live app applies. README.md specifies no tone for KPI sub-lines.

**Deployed:** The "Signed up & paid" sub-line gets class `up`/`down` and renders in rgb(18,148,91) (success) or the red token, so one of the four tiles reads differently from its siblings.

**Evidence:** DesktopOverview.dc.html:242 `<span style="font-size:12px;font-weight:500;color:var(--text-muted)...">{{ paidDeltaText }}</span>`; proto-desk-light.txt `[1066,371,115,15] | span.sc-interp | 12/500 | rgb(112, 119, 139) ... TXT«+5 vs 19 prior period»`. live-desk-light.txt `[1050,362,123,16] | s.up | 12/500 | rgb(18, 148, 91) ... TXT«+194% vs prior period»`. index.html:6850 and index.html:2877 `.ndc-kpi s.up{ color:var(--nd-ok-700); }`.

**Fix:** Drop the up/down class from the "Signed up & paid" sub-line (index.html:6850) so it inherits var(--nd-500).

### Recent payments plan label prints internal codes ("Pro", "Pro-3") instead of the readable plan names
`Desktop cards & tables` · desktop · verdict ADJUSTED

**Designed:** No spec exists. README.md:109 requires only "email, plan · time, amount in --text-success", and no token or component defines plan-label wording. The strings "Pro monthly" / "Pro 3-month" / "Pro weekly" appear solely inside the prototype's mock payment rows (DesktopOverview.dc.html:882-891), alongside the mock emails, amounts and timestamps that the brief classes as legitimate data differences.

**Deployed:** planLabel() collapses everything to "Free" / "Pro-3" / "Pro" / "Basic", so the sub-line reads "Pro-3 · now" and the billing cadence is lost.

**Evidence:** DesktopOverview.dc.html:882-886 `['akul.mehra@gmail.com', 'Pro monthly', ...]`, `['neha.gupta@yahoo.com', 'Pro 3-month', ...]`, `['tanvi.k@gmail.com', 'Pro weekly', ...]`; proto-desk-light.txt `[1066,583,69,15] | span.sc-interp | 12/500 ... TXT«Pro monthly»`. live-desk-light.txt `[1050,585,240,16] | s | 12/500 ... TXT«Pro-3 · now»`. index.html:5466-5472 (planLabel) and index.html:6823.

**Fix:** Use the existing planDuration() helper (index.html:5474) alongside planLabel() in the payment row (index.html:6823) to emit "Pro monthly" / "Pro 3-month" / "Pro weekly".

### README §5 item lists are stale relative to the approved prototype (no action on the app)
`Desktop sidebar & nav IA` · desktop · verdict ADJUSTED

**Designed:** README.md §5: "Two groups: **Overview** (Daily, Insights, Search) and **Growth** (Acquire, Activate, Monetization, Retention, Referrals, Influencers, Pro Users)."

**Deployed:** The approved prototype puts Search and Creators in the primary nav block above the groups — labels at `[50,213,59,18] | span.sc-interp | ... | TXT«Creators»` and `[50,255,47,18] | span.sc-interp | ... | TXT«Search»`, inside the primary block `[12,118,223,166]` and above the first `nav-label` at `[12,298,223,27]` — leaving Overview = Daily, Insights and Growth = Acquire, Activate, Monetization, Retention, Referrals, Pro Users. The live app matches the prototype here, so no app change is implied; the README sentence is the thing that is out of date.

**Evidence:** proto-desk-light.txt: `[12,244,223,40] | button | {"data-dc-tpl":"29","data-nav":"","data-on":"false"}` + `[50,255,47,18] | span.sc-interp | ... | TXT«Search»` sits in the primary block `[12,118,223,166]`, above the first `nav-label` at `[12,298,223,27] ... TXT«Overview»` | README.md §5

**Fix:** Update README §5 to list Search and Creators/Influencers as primary nav items, matching DesktopOverview.dc.html.

### Topbar title/subtitle use <b> and <s> presentational elements
`Desktop topbar & controls` · desktop · verdict CONFIRMED

**Designed:** Non-semantic containers for the page title and meta line (the prototype uses plain <span>s)

**Deployed:** `<b id="ndDeskTitle">` for the page title and `<s>` (strikethrough element, neutralised with text-decoration:none) for the meta line

**Evidence:** live-desk-light.txt: `[272,15,366,22] | b | {"id":"ndDeskTitle"} | 20/800/-0.4px/22px ... TXT«Overview»` and `[272,38,366,16] | s | | 12/500/-0.084px/normal ...` | index.html:6719-6720 `'<div class="nd-tb-t"><b id="ndDeskTitle">Overview</b>' + ...` | index.html:2794 `.nd-tb-t s{ text-decoration:none; ... }` | DesktopOverview.dc.html:161-162 uses `<span>` for both

**Fix:** Swap <b>/<s> for <h1>/<span> (or plain spans) in the topbar template at index.html:6719-6720; screen readers announce <s> content as deleted text.

### Undesigned "Daily trend" ApexCharts section appended to the report
`Report / Creators / Search` · desktop · verdict CONFIRMED

**Designed:** After the table the design ends with a footer note on data provenance (README:124); the prototype has no chart on this screen.

**Deployed:** A full ApexCharts dual-axis "Daily trend" chart (Signups / Revenue ₹) is appended below the comparison block.

**Evidence:** live-desk-report.txt: `[339,1357,1002,16] | div.rep-section-title | ... | TXT«Daily trend»` plus `span.apexcharts-legend-text | TXT«Signups»` / `TXT«Revenue (₹)»`; index.html:11947 `<div class="rep-section-title">Daily trend</div>`

**Fix:** Either remove it or get the section added to the spec; it is not in the approved report composition.

### Report body has no data-provenance footer note (neither does the prototype)
`Report / Creators / Search` · both · verdict CONFIRMED

**Designed:** "Footer note on data provenance" at the end of the report (README:124).

**Deployed:** Neither the prototype nor the deployment renders a footer note inside the report body; both surface provenance once, in the topbar subtitle.

**Evidence:** proto-desk-report.txt: only `[272,37,385,19] | span | 12/500 | ... | TXT«PostHog 399417 · Asia/Kolkata · internal and test accounts excluded»`; live-desk-report.txt: only `[272,38,366,16] | s | 12/500/-0.084px | ... | TXT«PostHog 399417 · Asia/Kolkata · internal and test accounts excluded»`

**Fix:** No deployment change needed unless the footer note is re-confirmed; the spec line and the prototype disagree, so resolve the spec.

### Push payloads were scheduled as shipping work but no push path exists
`Widgets & alerts` · both · verdict CONFIRMED

**Designed:** README:222 lists the final implementation step as '8. Widgets and push payloads last — they only need the cached overview response', and README:163 specifies the three payloads (daily digest, revenue milestone, PostHog budget exhausted). The lock screen itself is explicitly a presentation mock (README:19 'The only intentionally unfinished areas are the widget and lock-screen mocks (presentation only)'), but the payloads are listed as build work.

**Deployed:** There is no notification path of any kind in the repo — `grep -rn "serviceWorker|Notification\(|showNotification|pushManager|web-push|VAPID" index.html api lib widget.html` returns nothing, and manifest.webmanifest declares no notification scope. The in-app alerts drawer is the only surface carrying that copy.

**Evidence:** README.md:222 `8. Widgets and push payloads last — they only need the cached overview response.` (no matching implementation; repo-wide grep for serviceWorker/pushManager/VAPID returns zero hits)

**Fix:** Either ship the three payloads (a service worker plus Web Push driven by the same cached overview the cron already warms), or record the lock screen and its payloads as presentation-only in the handoff so the gap is intentional.

### widget.html is deployed but has no in-app route (not a design deviation — no spec requires one)
`Widgets & alerts` · widget · verdict ADJUSTED

**Designed:** No expectation in the design: README.md:164 describes the widgets as home-screen mocks and README.md:19 marks the widget mocks 'presentation only'; neither README.md nor NextRaise Mobile.dc.html specifies a link from the dashboard to a widget page. This is an observation about the shipped artefact, not a deviation.

**Deployed:** widget.html deploys (it is absent from .vercelignore, which lists only source-live.html, concept-overview.html, concept-orca.html, docs/, nr-*.png, .git/) but nothing references it: grep for 'widget.html' or '/widget' across index.html, manifest.webmanifest and vercel.json returns no matches, and the manifest declares only "start_url": "/" with no shortcuts. The link at widget.html:99 runs one way, widgets → dashboard.

**Evidence:** widget.html:87-89 `<p class="note">Live from the dashboard's cached overview.<br>Add to your home screen: …<a href="/">Open the full dashboard →</a></p>` — the link is one-way, dashboard → widgets does not exist

**Fix:** Link /widget.html from the More screen or the appearance sheet, or add it as a `shortcuts` entry in manifest.webmanifest.

## Verified as matching the design

- Sidebar width is exactly 248px in both — README "sidebar 248px"; proto `[0,0,248,1188] | aside` vs live `[0,0,248,900] | aside.sidebar`.
- Brand row geometry matches: padding 20/20/12/20, gap 10, 30x30 mark with r:9px (proto `[20,20,30,30] | img | r:9px` vs live `[20,22,30,30] | svg | r:9px`).
- Team button box matches: 223x44 at x=12, r:12px, p:0/10/0/10, g:10 (proto `[12,62,223,44]` vs live `[12,66,223,44]`).
- Team avatar chip matches: 26x26, r:8px, background rgb(41, 82, 255), 10/800 white "GR".
- Team name and meta line match: "Growth" 13/700 rgb(15, 28, 61) and "Team · Overall bucket" 11/500 rgb(112, 119, 139).
- Primary nav item list and order match: Overview, Report, Creators, Search.
- Primary nav row metrics match: 223x40, r:12px, p:0/10/0/10, font 14/600, inactive colour rgb(63, 74, 102).
- Secondary nav row metrics match: 223x36, r:10px, p:0/10/0/10, font 13.5/500.
- Group headings match exactly: 11/700/0.88px uppercase, rgb(112, 119, 139), padding 6/10/4/10.
- Overview group contents and order match: Daily, then Insights.
- Growth group's first four rows match in order: Acquire, Activate, Monetization, Retention.
- Nav container padding 4/12/12/12 and 14px inter-group gap match (proto `[0,114,247,957] ... p:4/12/12/12 | g:14` vs live `[0,118,247,669] ... p:4/12/12/12 | g:14`).
- Appearance switch is correctly positioned in the sidebar footer, pinned above Settings, with Light / Dark / Auto in that order and 34px button height — README §7 "pinned above Settings in the sidebar (desktop)".
- Settings row type and metrics match: 40px tall, r:12px, gap 10, 13.5/600 rgb(63, 74, 102), with "PostHog key set" at 11/600 rgb(162, 166, 179).
- Sidebar footer padding is 12px on all sides in both.
- Page title: 20px / 800 / -0.4px (-0.02em) / line-height 22px, colour #0F1C3D — exact match to README.md:36 and to proto (proto `[272,14,385,22] ... 20/800/-0.4px/22px | rgb(15, 28, 61)` vs live `[272,15,366,22] | b#ndDeskTitle | 20/800/-0.4px/22px | rgb(15, 28, 61)`).
- Topbar layout box: display:flex, align-items:center, gap 14px, padding 14px 24px, flex:none, position:relative z-index:3 — identical in proto (p:14/24/14/24 | g:14) and live (index.html:2789-2791).
- Control order left→right matches exactly: title + meta → attribution segmented control → range pill → Live badge → refresh → bell → avatar.
- Attribution control labels and semantics match README.md:167: "Influencer", "Perf", "Overall", with Overall active; aria-label "Attribution view" present on the live track.
- Segmented track geometry matches: width clamp(240px,24vw,330px) → 330px in both, radius 999px, padding 3px.
- Segment button geometry and type match: 34px tall, radius 999px, 13px/600; active label #0F1C3D (rgb(15,28,61)), inactive #70778B (rgb(112,119,139)) — identical in both digests.
- A sliding thumb IS present in the live build (`.bucket-seg::before`, index.html:2800) and is visible in live-desk-light.png; it is not missing, only flat.
- Thumb geometry matches: absolutely positioned top:3px bottom:3px left:3px, width calc((100% - 6px)/3), radius 999px — same declarations in DesktopOverview.dc.html:165 and index.html:2800-2801.
- Range pill geometry matches: height 40px, radius 999px, padding 0 14px, gap 8px, label "Last 7 days", calendar icon left / chevron-down right, colour #0F1C3D.
- Live badge content and colour match: text "Live · {n}m" per README.md:170, label colour #12945B, radius 999px, gap 6px, 6px round dot.
- Refresh and bell hit targets are both 40x40, meeting README.md:47 "40px on desktop"; refresh carries aria-label "Refresh data".
- Bell unread dot matches in size and colour: 8x8, #E5484D (--nd-red-500 / --red-500), 2px solid white ring.
- Avatar chip matches in content and colour: initials "JS" on a tinted circle, background #EEF2FF (--action-50 / --nd-act-50), text #1B3FE0 (--action-600 / --nd-act-600), 700 weight, border-radius 50% — consistent with README.md:203 "Avatars are initials on a tinted circle."
- Meta line copy is byte-identical: "PostHog 399417 · Asia/Kolkata · internal and test accounts excluded", with white-space:nowrap + overflow:hidden + text-overflow:ellipsis truncation in both.
- Dark appearance remaps the topbar to the correct dark token set (title #F2F5FB, meta #9AA5C0, badge tint rgba(25,182,114,.14)) per README.md:53-58.
- Eyebrow copy is byte-identical to the prototype: live `TXT«New signups · Last 7 days · Overall»` vs proto's three spans «New signups · ·» + «Last 7 days» + «Overall».
- Eyebrow style matches the README typography row exactly — 11px / 700 / 0.88px (0.08em) / uppercase / rgb(112,119,139) (--text-muted) in both proto and live digests.
- Hero metric font-size is the correct desktop 48px with line-height 1 (48px box) in both.
- `font-variant-numeric: tabular-nums` is applied to the hero number (index.html:2454), as README:28 requires on every numeric surface.
- The "vs N prior period" line matches the prototype exactly: 12px / 500 / rgb(162,166,179), and the wording "vs {n} prior period" is identical (index.html:6835).
- Delta badge tone colours are correct — up badge rgb(18,148,91) on rgb(237,250,243), radius 999px, padding 0 10px, height 24px — identical to the proto badge.
- Chart height is exactly 220px, matching README:115 "hero spans 8 with a 220px chart" and the proto digest `[297,212,707,220] | div | {"data-chart":""}`.
- Chart baseline hairline is present and matches: index.html:2858 `border-bottom:1px solid var(--nd-100)` vs DesktopOverview.dc.html:210 `border-bottom:1px solid var(--neutral-100)`.
- Bar fill colour is var(--nd-act-500) = rgb(41,82,255) = --action-500 #2952FF, identical to the prototype.
- Bar gap renders at 8px for the captured 7-bar range, matching the proto's `g:8` (the rule behind it is wrong for longer ranges — see findings).
- Bars stretch to fill the chart (`flex:1 1 0`) rather than being fixed-width, as designed.
- x-axis labels match the prototype exactly: 11px / 500 / rgb(162,166,179), centred, row gap 8px, margin-top 8px, same weekday abbreviations (Thu…Wed).
- Hero card padding is 24px on all four sides and inner gap 18px — identical to the proto card `p:24/24/24/24 | g:18`.
- Hero occupies grid-column span 8 of a 12-column / 16px-gap grid (index.html:2844 `.nd-s8{ grid-column:span 8 }`, :2833-2835), matching README:115.
- The KPI block still sits at span 4 beside the hero (`.ndc-kpis{ grid-column:span 4 }`, index.html:2868), matching README:115 "KPI 2×2 spans 4".
- KPI 2x2: all four tiles present, in order, labelled Revenue / Active Pro / Signed up & paid / Payers · ARPU — same as the prototype.
- KPI grid spans 4 columns and renders as a 2x2 with 16px gap (live `[1029,93,346,381] div.ndc-kpis`, proto `[1045,95,371,387]` — both span-4 of a 12-col 16px-gap grid).
- KPI tile padding 18px 20px and 6px internal gap match the prototype exactly (`p:18/20/18/20 | g:6` in both digests).
- KPI value style is identical: 23.04px/800/-0.4608px at 1440px, i.e. clamp(18px,1.6vw,26px) as specified in the README typography table.
- KPI eyebrow style matches: 11px/700/0.88px letter-spacing, uppercase, rgb(112,119,139).
- Revenue sub-line wording "+ {usd} · {n} payments" matches the prototype template exactly.
- Payers · ARPU sub-line wording "{arpu} per payer" matches exactly.
- Hero spans 8 and the whole page uses 24px padding with a 16px grid gap, per README §1 desktop layout.
- Acquisition card present, spans 4, padding 20px, gap 14px — identical to the prototype.
- Acquisition section title 15px/700/-0.15em-equivalent (-0.01em) matches the README "Section title" role.
- Acquisition row anatomy matches: name 13px/600 heading, count 13px/700 heading, "· {n} paid" 13px/500 in --text-subtle rgb(162,166,179).
- Acquisition ProgressBar is 6px tall, radius 999px, --nd-100 track, --action-500 fill, and is scaled to the top source (first row renders full width).
- Five acquisition sources are listed, as specified ("top 5 sources").
- Recent signups and Recent payments cards are both present and both span 4 columns.
- Recent signups name (13.5px/600) and email (12px/500 muted) both truncate with ellipsis, as specified.
- Recent payments row anatomy matches: email 13.5px/600, "plan · time" 12px/500 muted, amount 14px/700 in --text-success rgb(18,148,91).
- Recent payments rows are correctly non-interactive divs, as in the prototype.
- Section titles on all three panels use the 15px/700/-0.01em Section title role.
- Header safe-area handled correctly: `.nd-head{ padding-top:env(safe-area-inset-top) }` (index.html:3031) — renders 0 in the 402x874 desktop capture, matching README:104's "safe area 54px on iOS" behaviour on device.
- Header backdrop-filter matches spec exactly: live `bf:blur(24px) saturate(1.6)` = README:71 and prototype.
- Tab bar backdrop-filter matches spec exactly: live `bf:blur(28px) saturate(1.7)` = README:72 (the prototype itself deviates here with `saturate(1.4) blur(12px)`).
- Tab bar radius 999px and 1px rgba(255,255,255,.9) rim match the prototype.
- All 5 tabs present in the right order with the right labels and icons: Overview (grid), Report (clipboard), Creators (users), Search (magnifier), More (hamburger) — same set as prototype `data-tabbar`.
- Tab label typography matches README:44 exactly: `10.5/600` on live `span.mob-nav-label` and prototype alike.
- Tab bar hit target satisfied: live items are `71x52` (`min-height:52px`), above README:46's 50px tab-bar minimum.
- Header composition order matches README:104 — logo, title + team line, refresh, bell, avatar, then range pill + Live badge row, then the full-width segmented control.
- Bell unread dot matches: 8px red circle with a 2px white ring (index.html:3045-3046) = prototype `[325,72,8,8] … rgb(229, 72, 77) | r:50% | b:2 rgb(255, 255, 255)`.
- Segmented control is full-width at 362px in both prototype and live, radius 999px, with the same three labels: Influencer / Perf / Overall.
- Live badge dot present as a 6px green `::before` (index.html:3057), matching the prototype's `[308,127,6,6]` dot.
- Brand mark uses the real logo-mark SVG, rounded, at the left of the header in both.
- Card rise-in easing on mobile cards matches the flat-to-glass intent: `0.52s cubic-bezier(0.2, 0, 0.2, 1) both ndRise` with the spec keyframe `translateY(14px) scale(.985)` (index.html:3078).
- Card order for the cards that do exist matches the design exactly: Hero signups → KPI grid 2x2 → Acquisition → Recent signups → Recent payments (live y: 211, 501, 767, 1091, 1425).
- KPI grid is a true 2x2 in the designed tile order: Revenue, Active Pro, Signed up & paid, Payers · ARPU — same four labels, same positions as the prototype.
- Hero chart height is exactly 120px as specified: proto `[37,342,328,120] | div | {"data-dc-tpl":"61","data-chart":""} | ... p:22/0/0/0 | g:8` vs live `[50,323,286,120] | div.nd-bars | ... p:22/0/0/0 | g:8`.
- Bar geometry matches: `r:8px 8px 4px 4px` with an inset white highlight and 8px gap on both sides, 7 bars with weekday labels Thu–Wed.
- Card padding is inside the 16–20px band on every card: hero p:20/20/20/20 (identical to proto), KPI tiles p:18/16/18/16, Acquisition p:18 all round.
- Acquisition card shows exactly 5 sources, each as name + "{n} · {paid} paid" over a 6px pill progress bar scaled to the top source — same structure as the prototype.
- "Payers · ARPU" sub-line wording "₹1,187 per payer" matches the designed "₹983 per payer" form exactly.
- Recent payments card has the designed 4 rows with email, "plan · time" sub-line, and the amount right-aligned in success green rgb(18,148,91) — same colour as the prototype's `+₹999`.
- Hero delta badge is a success-tone pill with a signed percentage (`+370.0%` / `+33.7%`) in rgb(18,148,91) on rgb(237,250,243), radius 999px, matching the prototype badge.
- Card rise-in animation is present and staggered per card (live `0.52s cubic-bezier(0.2,0,0.2,1)` with 0.12s / 0.18s / 0.24s delays), close to the designed 560ms + 60ms stagger.
- Light screen background on desktop is rgb(245,247,255) = the spec page tint #F5F7FF (live-desk-light.txt:4)
- Dark screen background is rgb(9,13,24) = --neutral-50 #090D18 on both desktop and mobile (live-desk-dark.txt:4, live-mob-dark.txt:4)
- Light header blur/saturate is exactly blur(24px) saturate(1.6) (live-mob-light.txt:93)
- Phone tab bar blur/saturate is exactly blur(28px) saturate(1.7) (live-mob-light.txt:345)
- Phone tab bar is a floating pill with border-radius 999px (live-mob-light.txt:345)
- Light card border is 1px solid rgba(255,255,255,.85) as specified (live-mob-light.txt:194)
- Sheet scrim colour is exactly rgba(15,28,61,.28) (index.html:2970)
- Dark card shadow geometry 0 16px 40px is correct (only alpha and spread drift) (live-mob-dark.txt:194)
- The dark token --nd-card:rgba(255,255,255,.055) is declared exactly per spec at index.html:2935 (it is simply overridden downstream)
- Phone chart bars use border-radius 8px 8px 4px 4px and the 720ms cubic-bezier(.34,1.25,.64,1) glass fill easing (index.html:3106-3107)
- A prefers-reduced-motion guard disables the glass card animation and thumb transition (index.html:3171-3173)
- Desktop topbar page title: 20px / 800 / -0.4px (-0.02em) — exact match to the README row (live-desk-light.txt `[272,15,366,22] | b | … 20/800/-0.4px/22px | … TXT«Overview»`, identical to proto-desk-light.txt).
- Desktop Overview KPI cards: 23.04px / 800 / -0.4608px — clamp(18px,1.6vw,26px) resolves correctly at 1440 viewport (1.6vw = 23.04px) and tracking is exactly -0.02em; byte-identical to the prototype.
- Desktop section titles: 15px / 700 / -0.15px (-0.01em) — matches the README row and the prototype exactly (TXT«Acquisition», «Recent signups», «Recent payments»).
- Desktop Overview eyebrows (.nd-lbl): 11px / 700 / 0.88px (0.08em) uppercase — exact match (index.html:2846).
- Desktop sidebar section labels (.nav-label): 11px / 700 / 0.88px (0.08em) uppercase — exact match to the prototype.
- Dense-grid eyebrow (.nd-brandmark): 10px / 700 / 0.8px (0.08em) uppercase — correctly uses the permitted 10px dense variant at the right tracking.
- Phone tab-bar labels (.mob-nav-label): 10.5px / 600 — exact match to the README "Tab label" row and to the prototype's 10.5px/600 (index.html:2296).
- Phone hero metric size and line-height: 40px with line-height 40px (ratio 1) — the size and leading are right; only weight and tracking deviate.
- font-variant-numeric: tabular-nums is present on every numeric text node across all seven live captures — zero numeric surfaces render with proportional figures.
- Light and dark captures are typographically identical on both surfaces — no appearance-specific type regressions were found (live-desk-dark.txt / live-mob-dark.txt match their light counterparts signature-for-signature).
- --neutral-0 #131A2B → --nd-0:#131A2B (index.html:2933); live cards/sidebar render rgb(19, 26, 43)
- --neutral-50 #090D18 → --nd-50:#090D18 / --canvas:#090D18 (index.html:2933, 2943); body renders rgb(9, 13, 24)
- --neutral-100 #1A2236 → --nd-100:#1A2236 / --surface-2 (index.html:2933, 2943); 13 live elements render rgb(26, 34, 54)
- --neutral-200 #242E46 → --nd-200:#242E46 (index.html:2933), exact value match
- --text-heading #F2F5FB → --nd-900 / --text / --ink (index.html:2934, 2946); 225 live elements render rgb(242, 245, 251), identical count to the prototype
- --ink-900 #F2F5FB is satisfied by the same --nd-900:#F2F5FB
- --action-500 #5C79FF → --nd-act-500 / --blue (index.html:2937, 2947); 13 live bar/fill elements render rgb(92, 121, 255), identical count to the prototype
- color-scheme:dark is declared on the dark root (index.html:2952) — correct, though not required by the spec
- Desktop dark has zero stranded light backgrounds, light-ink borders or light-ink shadows: a full light↔dark field diff of live-desk-light.txt vs live-desk-dark.txt found no unchanged non-transparent colour, border or shadow on any non-SVG element
- Mobile tab bar correctly flips to rgba(19, 26, 43, 0.82) with border rgba(255,255,255,.1) (live-mob-dark.txt:345), matching the README dark tab-bar value rgba(19,26,43,.62)-family surface
- Dark card shadow rgba(0,0,0,.6) 0 16px 40px -20px is applied consistently to all 9 desktop and 8 mobile cards — a genuine dark-ramp shadow, only the alpha/spread differ from spec
- Reduced motion: index.html:1688 `@media (prefers-reduced-motion:reduce){ *{ transition:none!important; animation:none!important } }` is global and !important, so it disables everything inside the glass root and beyond — meets and exceeds the spec row.
- Mobile chart bars: index.html:3106-3107 `transition:height 720ms cubic-bezier(.34,1.25,.64,1)` — exactly the glass spec.
- Mobile bar radius/geometry driven by the same rule matches the proto's `border-radius:8px 8px 4px 4px` bar treatment (MobileOverview.dc.html:52).
- Desktop chart bars: index.html:2864 `transition:height 520ms cubic-bezier(.2,0,.2,1)` — matches the flat variant in the README Motion table (desktop ships the flat card language).
- Mobile card rise-in from-state: index.html:3079 `@keyframes ndRise{ from{ opacity:0; transform:translateY(14px) scale(.985) } … }` — exactly the spec's opacity 0 / translateY(14px) / scale(.985).
- Mobile stagger step size is the correct 60ms (index.html:3084-3087: 60/120/180/240ms); digest live-mob-light.txt shows `an:0.52s … 0.12s both ndRise` etc.
- Segmented thumb base timing: index.html:2802 and index.html:3069 both use `transform 320ms cubic-bezier(.32,.72,0,1)` — the spec's non-glass value.
- KPI tile tap feedback: index.html:3114 `transition:transform 140ms` + index.html:3115 `:active{ transform:scale(.97) }` — squarely inside the spec's scale(.90–.97) / 140ms.
- KPI tile hover: index.html:2871 `transition:transform 200ms cubic-bezier(.2,0,.2,1), box-shadow 200ms` — matches DesktopOverview.dc.html:36/227 exactly.
- Tab bar items: index.html:3159 `transition:color 200ms, transform 200ms cubic-bezier(.34,1.4,.64,1)` with `:active{ transform:scale(.9) }` at index.html:3162 — matches MobileOverview.dc.html:55 verbatim.
- Progress/acquisition bars: index.html:2891 and index.html:3147 `transition:width 520ms cubic-bezier(.2,0,.2,1)` — consistent with the flat bar-fill timing.
- Spin keyframe geometry is correct: index.html:2827 `@keyframes ndSpin{ to{ transform:rotate(360deg) } }` matches `nrSpin` (only the duration is off).
- Global attribution toggle is pinned in both the phone header and the desktop topbar as Influencer / Perf / Overall, matching README:167 — live-desk-light.txt `button.bkt {"data-view":"influencer"}` / `perf` / `.is-on {"data-view":"overall"}` in the topbar, live-mob-light.txt the same three inside `.nd-head`.
- Toggling the bucket genuinely re-derives every number: index.html:5996-6005 `setBucketView` nulls `_ovData` and every per-tab cache flag via `_refreshAllLoadedTabs()`, then re-runs the active tab.
- The bucket source-routing rule matches the spec exactly (index.html:5891-5906 `bucketExprSQL`): blank-or-`direct` → infl, `chrome_extension`/`extension` → infl, google → `if(campaign = brand campaign,'infl','perf')`, meta/facebook/ig → perf unless medium is social/video, organic social/video → infl, and `email`/`loops`/`referral`/`affiliate` → `'other'` so they surface only in Overall.
- Revenue, Pro and spend scale with the bucket through `bucketPersonFilter` / `bucketEmailFilter` (index.html:5931-5949), not just the source list.
- The bucket selection persists across reloads and is URL-addressable — index.html:5987-5992 writes `nr_bucket_view` to localStorage and `?view=` to the URL, and `initBucketView` reads both back.
- Refresh is a no-op while already refreshing: index.html:6789 `btn.classList.add('spin'); btn.disabled = true;` with re-enable only in `done()`.
- The refresh glyph animation uses the designed shape — index.html:2828 `.nd-tb-ico.spin svg{ animation:ndSpin .9s linear infinite; }` (900ms per rotation, matching README:169's 900ms figure).
- Refresh is present in both designed places — the desktop topbar (index.html:6722 `#ndDeskRefresh`) and the phone header (index.html:6993 `.nd-ico[aria-label="Refresh"]`), confirmed in live-mob-light.txt `[254,10,42,42] | button.nd-ico | {"aria-label":"Refresh"}`.
- The Live badge exists on both surfaces as a pill (`#ndDeskLive`, `#ndLive`) and flips to an amber `.is-stale` variant past 15 minutes or while the read budget is paused — index.html:6781, CSS index.html:2814-2815.
- The app degrades to the cached snapshot rather than erroring, exactly as README:171 requires: index.html:6240-6260 paints the last snapshot for the range first, and index.html:6603-6605 keeps `_ovData` on a failed refresh instead of wiping it to an error.
- A full-page error replaces content only when there is genuinely no snapshot at all — index.html:6606-6607 and the `if (!_ovData)` guard in `_ovBudgetPaused` (index.html:6644).
- KPI tiles are real `<button>` elements as designed (README:112) — index.html:6840/6844/6848/6854 and the mobile twins at :7106-:7120.
- All four designed KPI labels are present and in order: Revenue, Active Pro, Signed up & paid, Payers · ARPU — live-desk-light.txt `TXT«Revenue»`, `TXT«Active Pro»`, `TXT«Signed up & paid»`, `TXT«Payers · ARPU»`.
- "See all ›" links sit on Acquisition, Recent signups and Recent payments as specified (README:114) — live-desk-light.txt three `button.nd-see` nodes with `TXT«See all ›»`.
- The range picker offers exactly the seven designed presets with the designed labels — index.html:4525-4534 Today / Yesterday / Last 7 days / Last 14 days / This month / Last month / All time.
- The active range row is marked with a check — index.html:816 `.gdr-opt.active::after { content: '✓'; font-size: 11px; margin-left: 8px; }`.
- The appearance switch is Light / Dark / Auto and is pinned directly above Settings in the desktop sidebar as README:158 requires — live-desk-light.txt `button.nd-mode.on {"data-mode":"light"}` at y=803 with `TXT«Settings»` at y=859.
- Auto genuinely reads `prefers-color-scheme` and stays live: index.html:6885-6886 `if (a === 'auto') { return matchMedia('(prefers-color-scheme: dark)').matches; }` plus index.html:6902 `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (ndAppearance() === 'auto') ndApplyAppearance(); });`.
- The appearance choice persists per device — index.html:6882 reads and index.html:6896 writes `nr_appearance` in localStorage.
- The creator entry form carries the designed field set (Date, Budget ₹, Views, Likes, Comments, Shares) — index.html:5111-5121 builds the entry from `cfDate`, `cfBudget`, `cfViews`, `cfLikes`, `cfComments`, `cfShares`.
- Alerts use the designed three-tone coloured status dot — index.html:2985-2986 action `#2952FF`, success `#19B672`, amber `#F59E0C`, matching README:151.
- The alerts panel is reachable from the designed place on both surfaces (bell icon in the desktop topbar at index.html:6724 and the phone header at index.html:6994) and closes on scrim click (index.html:6951).
- Report: Influencer / Perf / Overall bucket segmented control present with Overall active, 107×34 pills at 13/600 — matches proto `button.bkt` geometry exactly.
- Report: topbar provenance subtitle text matches the prototype verbatim — "PostHog 399417 · Asia/Kolkata · internal and test accounts excluded" at 12/500.
- Report: the Influencer vs Perf comparison is correctly gated to the Overall bucket only (index.html:11915 `if (BUCKET_VIEW === 'overall' && compare)`) and carries exactly the six designed rows in order — Spend, Signups, Sales, Revenue, CAC, ROAS.
- Report: per-creator table is correctly shown in Influencer and Overall (index.html:11825) and the per-campaign table in Perf and Overall (index.html:11874).
- Report: Live badge pill renders at 999px radius in success green `rgb(18,148,91)`, matching the prototype.
- Creators/Search: sidebar nav order Overview · Report · Creators · Search with Report active matches the prototype, and the Creators tab is correctly routed from the sidebar and the mobile bottom nav.
- Search: the leading `search` icon is present inside the field at 16px, left-inset 42px padding (index.html:216-219).
- Search: recent lookups are persisted and surfaced in the empty state (content, if not the designed list treatment).
- Creators: the manual post-data entry form itself exists with the designed fields — Date, Budget ₹, Views, Likes, Comments, Shares (index.html:5110-5116).
- Widgets read the edge-cached overview and do not add PostHog load: widget.html fetches `/api/overview?range=7d&view=overall`, api/overview.js:29 sets `public, max-age=0, s-maxage=1800, stale-while-revalidate=86400`, and api/cron.js:14-17 pre-warms exactly that `{range:'7d', view:'overall'}` combo — so widget hits land on a warm edge copy.
- Widget glass surface is an exact match: design `background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);box-shadow:0 12px 36px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:blur(28px) saturate(1.7)` (NextRaise Mobile.dc.html:113) === widget.html:32-38.
- Widget canvas matches the mock: `--ink-deep:#060813` (= token --ink-panel-deep), 56px white-1px grid, and two drifting radials — 340px blue at left:-120px/top:-60px and 300px green at right:-120px/bottom:-40px on nrDrift 14s / 18s-reverse (NextRaise Mobile.dc.html:108-110 === widget.html:16-27).
- Card entrance motion matches nrRise exactly: `animation:rise 560ms cubic-bezier(.22,.61,.36,1) both` (widget.html:38) with an 80ms stagger on the second tile; `prefers-reduced-motion` is honoured (widget.html:60).
- iOS small widget is essentially pixel-correct: 158×158, radius 24px, padding 16px, caption 11px/700/.08em uppercase at rgba(255,255,255,.68), value 36px/800/-.03em/line-height 1, delta 12px/600 in #A6E7C6 (= --success-200), 16px logo mark at radius 4, sparkline 28px tall with 3px gaps.
- Alert status-dot palette matches the design tokens: #2952FF / #19B672 / #F59E0C (index.html:2985-2986) === --action-500 / --success-500 / --amber-500, on an 8px circle with margin-top:6px and a 12px gap, as in MobileOverview.dc.html:581-582.
- Alert row typography matches the drill-down: title 14px/700, body 13px/line-height 1.45 in #3F4A66 (= --text-body/--neutral-700), meta in #A2A6B3 (= --text-subtle/--neutral-400).
- Overlay scrim colour matches `[data-scrim]` exactly: rgba(15,28,61,.28) (index.html:2970 === MobileOverview.dc.html:59).
- Both bell entry points exist and are labelled: desktop `button.nd-tb-ico.dot {"id":"ndDeskBell","aria-label":"Alerts"}` at [1328,14,40,40] (live-desk-light.txt:192) and mobile `button.nd-ico.dot {"aria-label":"Alerts"}` at [298,10,42,42] (live-mob-light.txt:108), both carrying the unread `.dot`.
- Alerts drawer degrades gracefully with an empty state rather than dead copy (index.html:6962), consistent with README:158 'anything not implemented toasts rather than navigating to a dead end'.
- Widget colour variables all resolve to design-system tokens: --ink-deep #060813, --act-500 #2952FF, --ok-200 #A6E7C6, --ok-500 #19B672, --amber #F59E0C (widget.html:12).
- Logo mark geometry is byte-identical to design/assets/logo-mark.svg: `<rect width="200" height="200" rx="61" fill="#0065F4"/>` plus the same white N path (index.html:3234-3235).
- Logo mark is never recoloured and never sits on a blue field — in both light and dark captures the sidebar-brand background is transparent (live-desk-dark.txt `[0,0,247,66] | div.sidebar-brand | … | rgba(0, 0, 0, 0)`).
- Desktop mark size and radius match the prototype exactly: live `[20,22,30,30] | svg | … | r:9px` vs proto `[20,20,30,30] | img | … | r:9px`.
- The favicon reuses the official mark (index.html:11, rx=61, fill %230065F4).
- widget.html uses the same official mark (widget.html:70, rx="61" fill="#0065F4").
- Sprite symbols declare `stroke="currentColor"`, so the `<use>`-based glyphs do inherit text colour and re-tint in dark mode.
- All 23 sprite symbols plus the inline header/nav icons use `viewBox="0 0 24 24"` — the 24px grid is respected everywhere except the mobile hamburger.
- 28 of 33 stroke-width declarations are the specified 2.
- Glyph geometry matches canonical Lucide for `settings` (#i-gear), `calendar`, `search`, `users`, `star`, `share-2` (#i-share), `copy`, `alert-triangle` (#i-alert) and `chevron-down`.
- The `bell` glyph in the desktop and mobile headers is canonical Lucide bell (`M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9` + `M13.7 21a2 2 0 0 1-3.4 0`), index.html:6725.
- Mobile bottom nav uses the designed roles for Report (clipboard), Creators (users), Search (search) and More (menu), index.html:11499-11515.
- The bell button carries the unread dot indicator (index.html:2821 `.nd-tb-ico.dot::after`), as in the prototype.
- The refresh button spins while loading (index.html:2828 `.nd-tb-ico.spin svg{ animation:ndSpin .9s linear infinite; }`), matching the prototype's `data-spin` state.