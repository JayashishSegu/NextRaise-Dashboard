# Handoff: NextRaise Analytics — mobile + desktop console (Liquid Glass)

## Overview
A redesign of the internal NextRaise analytics dashboard (repo `JayashishSegu/NextRaise-Dashboard`) for three form factors: iOS, Android, and desktop/laptop web. Same data contract as the existing PostHog HogQL console; new information architecture, a Liquid Glass visual theme, a light/dark appearance switch, and a team switcher.

Scope covered: Overview, CEO Report, Creators, Search, and eight generic "More" screens (Daily, Insights, Acquire, Activate, Monetization, Retention, Referrals, Pro Users). Plus a push-alert lock screen and home-screen widgets (mobile only, presentation mocks).

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behaviour, not production code to copy. The task is to **recreate these designs inside the existing NextRaise-Dashboard codebase** (currently a static HTML + vanilla JS Vercel app with `/api` edge functions) using its established patterns. If a framework migration is planned, implement the designs in that framework instead; do not ship these HTML files.

Two prototypes are self-contained "screens":
- `MobileOverview.dc.html` — the phone app. Props: `platform` (`ios` | `android`), `theme` (`glass` | `flat`), `initialView` (`overall` | `influencer` | `perf`), `stale` (boolean).
- `DesktopOverview.dc.html` — the desktop/laptop console. Props: `theme`, `initialView`, `stale`.
- `NextRaise Mobile.dc.html` — presentation canvas that mounts both inside device/browser frames. Not part of the product.

Both screens share the same logic class (state shape, data derivation, formatters) so numbers agree across devices. Treat that class as the specification for the view-model layer.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, radii, shadows, motion curves and interaction states. Recreate pixel-accurately using the design system tokens listed below. The only intentionally unfinished areas are the widget and lock-screen mocks (presentation only) and any screen not listed under "Screens".

## Design system
All visual values come from the **NextRaise Design System** (bundled under `_ds/`). Use its tokens and components rather than the literals where your codebase already exposes them.

- Tokens: `_ds/.../tokens/{colors,typography,spacing,radius,elevation,motion,base,fonts}.css`
- Components used: `Icon`, `Badge`, `Button`, `Chip`, `ProgressBar`
- Icons: Lucide (24px grid, 2px stroke), rendered as a CSS mask so glyphs inherit `currentColor`. Slugs used: `bell`, `calendar`, `chevron-down`, `chevron-left`, `chevron-right`, `chevrons-up-down`, `check`, `x`, `search`, `history`, `refresh-cw`, `plus`, `share-2`, `copy`, `link`, `external-link`, `settings`, `alert-triangle`, `sun`, `moon`, `monitor-smartphone`, `layout-dashboard`, `clipboard-list`, `users`, `menu`, `star`, `credit-card`.
- Logo: `assets/logo-mark.svg` (official mark, `#0065F4` rounded square with white N). Never recolour or place on a blue field.

### Typography
Single family: **Plus Jakarta Sans**, weights 300–800, `font-variant-numeric: tabular-nums` on every numeric surface.

| Role | Size / weight / tracking |
|---|---|
| Hero metric (phone) | 40px / 800 / -0.03em / line-height 1 |
| Hero metric (desktop) | 48px / 800 / -0.03em |
| Page title (desktop topbar) | 20px / 800 / -0.02em |
| Screen title (phone header) | 17px / 700 / -0.02em |
| Section title | 15px / 700 / -0.01em |
| KPI value | 22px / 800 / -0.02em (desktop cards `clamp(18px,1.6vw,26px)`) |
| Drawer / sheet title | 17–18px / 700–800 / -0.02em |
| Body | 13–14px / 500–600, line-height 1.45–1.55 |
| Eyebrow / table header | 11px / 700 / 0.08em / uppercase (10px in dense grids) |
| Meta, captions | 11–12px / 500 |
| Tab label | 10.5px / 600 |

Minimum text size on phone: 10px (eyebrows only); all interactive labels ≥ 12px. Hit targets: 44px minimum on phone (tab bar 50px), 40px on desktop.

### Colour (light)
From `tokens/colors.css`. Key values: ink `#0F1C3D`, action blue `#2952FF`, body slate `#3F4A66`, muted `#70778B`, page tint `#F5F7FF`, panel dark `#0F1729`, success `#19B672`, amber `#F59E0C`, red `#E5484D`. Always reference via `var(--*)`: `--neutral-0/50/100/200/300`, `--text-heading/body/muted/subtle/link/brand/success/danger`, `--action-50/200/500/600`, `--border-subtle/default`, `--surface-glass/scrim`, `--shadow-xs/sm/md/lg/xl`.

### Colour (dark appearance)
Dark mode remaps tokens on the screen root via `[data-mode="dark"]` — implement as a theme class, not a separate stylesheet:

```
--neutral-0:#131A2B; --neutral-50:#090D18; --neutral-100:#1A2236; --neutral-200:#242E46; --neutral-300:#33405E;
--text-heading:#F2F5FB; --text-body:#C9D1E1; --text-muted:#9AA4BB; --text-subtle:#737E98;
--text-link:#9DB2FF; --text-brand:#9DB2FF; --action-500:#5C79FF; --action-600:#9DB2FF; --action-200:#3A55B8; --action-50:rgba(92,121,255,.22);
--ink-900:#F2F5FB; --border-subtle:#242E46; --border-default:#33405E;
--surface-glass:rgba(19,26,43,.82); --surface-scrim:rgba(0,0,0,.55);
--text-success:#3ED08E; --amber-700:#F5B94A; --amber-100:#3A2C10; --red-700:#FF7A7F; --red-100:#3D1A1C;
--shadow-sm:0 1px 3px rgba(0,0,0,.4); --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-xl:0 24px 64px rgba(0,0,0,.6);
```
Token swaps transition over 320ms (`background`, `color`, `border-color`).

### Liquid Glass theme
Applied when `theme="glass"` (the default). Note: the design system permits blur in one place only; this is a deliberate, user-approved departure.

Light:
- Screen background `var(--neutral-50)` plus two drifting radial tints behind content: action blue `rgba(41,82,255,.18)` 320px at left −120px/top 120px, success green `rgba(25,182,114,.14)` 300px at right −110px/bottom 60px; both animate `translate(0,0) → (18px,−22px) → (0,0)` over 14s / 18s (second reversed), `ease-in-out infinite`.
- Cards: `background rgba(255,255,255,.58)`, `border 1px solid rgba(255,255,255,.85)`, `border-radius 24px`, `box-shadow 0 12px 36px rgba(15,28,61,.08), inset 0 1px 0 rgba(255,255,255,.9)`, `backdrop-filter blur(24px) saturate(1.6)`, plus a `::before` specular sheen `linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,0) 45%)` (needs `isolation:isolate` + `z-index:-1`).
- Header: `rgba(255,255,255,.55)` + `blur(24px) saturate(1.6)`, hairline `rgba(255,255,255,.8)`.
- Phone tab bar: floating pill inset 16px, bottom 14px, `rgba(255,255,255,.62)`, `blur(28px) saturate(1.7)`, `0 12px 36px rgba(15,28,61,.14)`.
- Range sheet: `rgba(255,255,255,.78)`, `blur(32px) saturate(1.7)`, radius 32px top corners. Scrim `rgba(15,28,61,.28)` + `blur(6px)`.
- Segmented control: track `rgba(15,28,61,.06)` inset well; thumb `linear-gradient(160deg,rgba(255,255,255,.95),rgba(255,255,255,.55))`, `blur(20px) saturate(1.8)`, `0 6px 18px rgba(15,28,61,.14)`, top-edge highlight via `::after`.
- Desktop sidebar: `rgba(255,255,255,.42)` + `blur(24px)`; popovers `rgba(255,255,255,.82)` + `blur(28px)`; drawer `rgba(245,247,255,.78)` + `blur(32px)`.

Dark equivalents: card `rgba(255,255,255,.055)` / border `rgba(255,255,255,.11)` / shadow `0 16px 40px rgba(0,0,0,.5)`; header `rgba(9,13,24,.6)`; tab bar `rgba(19,26,43,.62)`; sheet `rgba(19,26,43,.84)`; segmented track `rgba(255,255,255,.06)`, thumb `rgba(255,255,255,.22 → .10)`; tints at `.28` / `.16` alpha. Chart bars gain `0 0 18px -4px rgba(92,121,255,.55)`.

`theme="flat"` renders the same layout with opaque `--neutral-0` cards, `--shadow-sm`, 16px radius, no blur and no tints — keep it as a fallback for `prefers-reduced-transparency` or low-end devices.

### Motion
| Moment | Duration / easing |
|---|---|
| Control states (hover, colour, press) | 140–220ms `cubic-bezier(.2,0,.2,1)` |
| Card rise-in (glass), staggered 60ms per card | 560ms `cubic-bezier(.22,.61,.36,1)`, from `opacity 0, translateY(14px) scale(.985)` |
| Chart bars filling | 720ms `cubic-bezier(.34,1.25,.64,1)` (glass) / 520ms `cubic-bezier(.2,0,.2,1)` (flat) |
| Segmented thumb slide | 320ms `cubic-bezier(.32,.72,0,1)`; glass 460ms `cubic-bezier(.34,1.3,.64,1)` |
| Phone drill-down push | 380ms `cubic-bezier(.32,.72,0,1)`, `translateX(100% → 0)` |
| Bottom sheet | 420ms `cubic-bezier(.32,.72,0,1)` from `translateY(100%)`; scrim fade 240ms |
| Desktop popover | 220ms rise-in |
| Tap feedback | `scale(.90–.97)`, 140ms |
| Refresh spinner | `rotate(360deg)` 800ms linear infinite |
| Range/bucket change | content dips to `opacity .35` for 420ms while refetching |
| Reduced motion | `@media (prefers-reduced-motion:reduce)` disables all animation and transition inside the glass root |

### Spacing, radii, shadows
4px scale (2, 4, 8, 12, 16, 20, 24, 32, 40, 56). Phone: screen padding 16px, card padding 16–20px, card gap 12px, scroll bottom padding 96px (clears the floating tab bar). Desktop: 24px page padding, 16px grid gap, sidebar 248px, drawer 460px, content max 1040–1200px. Radii: 8px rows, 12px inputs/nested tiles, 14px search field, 16px cards (flat), 24px cards (glass) and modals, 28–32px sheets, 999px pills. Shadows from `tokens/elevation.css`; the only coloured shadow is the blue glow under a primary button.

## Screens

### 1. Overview (phone tab 1 · desktop home)
**Purpose:** the morning check — signups, revenue, Pro, channels.

**Phone layout** (402×874 safe area): header block (safe area 54px on iOS → logo + team button + refresh + bell + avatar row, then range pill + Live badge row, then the full-width attribution segmented control), optional stale banner, scrolling card stack, floating tab bar.

Cards in order:
1. **Hero signups** — eyebrow "New signups · {range}", 40px metric, delta badge (`success`/`danger` tone, `+33.7%`), "vs 1,446 prior period", then a tappable bar chart (height 120px, bars `border-radius 8px 8px 4px 4px`, gap 8px for ≤8 bars / 4px ≤16 / 2px above, x labels 10px). Tapping a bar selects it: bar turns `--ink-900`, all others `--action-200`, and a pill tooltip `{n} signups · {label}` appears centred above the chart. Tapping again clears.
2. **KPI grid 2×2** — Revenue (₹ + $ + payment count), Active Pro (count + % of users), Signed up & paid (delta vs prior), Payers · ARPU. Each tile is a button that opens the matching drill-down.
3. **Acquisition** — top 5 sources, each a label row (`name` / `{n} · {paid} paid`) plus a 6px ProgressBar scaled to the top source. "See all" opens the sources drawer.
4. **Recent signups** — 5 rows: 36px initials avatar, name + email (both truncate), source + relative time right-aligned.
5. **Recent payments** — 4 rows: email, plan · time, amount in `--text-success`.
6. **Signup → Pro by period** — 4-column table (Period / Signups / Pro / Rate), rate coloured ≥1.2% success, ≥0.8% amber, else danger.
7. Footer note: "PostHog project 399417 · Asia/Kolkata · internal and test accounts excluded".

**Desktop layout** (12-column grid, 16px gap): hero spans 8 with a 220px chart; KPI 2×2 spans 4; Acquisition, Recent signups, Recent payments span 4 each; conversion table spans 7; Pro subscribers card spans 5.

### 2. CEO Report (phone tab 2 · desktop page)
Header card: eyebrow "CEO Report · {bucket}", range as title, **Export** button (accent, `share-2`) that toasts "Report exported · A4 PDF ready to share". Six KPI tiles — Signups, Sales, Conv, Revenue, Spend, ROAS · CAC (phone 3×2 at 18px values; desktop a single 6-up row at 22px).

Then, conditionally:
- **Creator content** (hidden in Perf): views / likes / comments / shares, plus engagement rate and cost per view.
- **Influencer vs Perf** (Overall only): 6 rows — Spend, Signups, Sales, Revenue, CAC, ROAS — with Influencer in `--success-600` and Perf in `--amber-700` column headers.
- **Table**: "By creator" (Influencer), "By campaign" (Perf) or "Creators and campaigns" (Overall), sorted by revenue. Phone columns: name/code · Spend · Sales · ROAS. Desktop adds Signups. Creator rows open the creator drawer; campaign rows toast.
- Footer note on data provenance.

### 3. Creators (phone tab 3 · desktop page)
Three KPI tiles (Creators, Signups, ROAS), then the creator list. Phone rows: 40px avatar, name, `code · platform · n signups`, revenue + ROAS right-aligned (ROAS coloured by threshold). Desktop is a 6-column table (Creator / Views / Signups / Budget / Revenue / ROAS). "Add post data" opens the entry form.

### 4. Search (phone tab 4 · desktop page)
Search field (48px phone / 52px desktop, radius 14px, `search` icon, clear button when dirty) matching name, email, plan or referral code. Empty state: quick-filter chips (Pro users 164, Influencer signups 46, Paid this week 24) and a "Recent lookups" list. Results: avatar, name, email, plan badge, chevron → person drawer.

### 5. More (phone tab 5) / sidebar (desktop)
Two groups: **Overview** (Daily, Insights, Search) and **Growth** (Acquire, Activate, Monetization, Retention, Referrals, Influencers, Pro Users). Operations, Reports, Product, Emails and Lifecycle were removed from the nav on request.

Each of the eight generic pages renders from one shared view-model: blurb line, 3 KPI tiles, then one or more table sections (label column flexes, value columns fixed 76px, right-aligned). Content per page:
- **Daily** — today / yesterday / 7-day average; 14-day table (Signups, Paid, Rate).
- **Insights** — best day, best channel, conversion; 5 notable facts.
- **Acquire** — signups, source count, top source; full source × medium table.
- **Activate** — resume uploads, ATS checks, activated; 7-step funnel with % of signups.
- **Monetization** — INR, USD, ARPU; plan mix and recent payments.
- **Retention** — D1/D7/D30 return; 5 weekly cohorts.
- **Referrals** — referred signups, active codes, revenue; per-code table.
- **Pro Users** — active Pro / active Basic / expired; recent Pro list.

### 6. Drill-downs
Phone: full-screen push from the right, header = back chevron + title + meta. Desktop: 460px right-hand drawer over a scrim, header = close `x` + title + meta.
- **Acquisition sources** — source × medium, bucket label, signups, conversion %, 4px bar; footnote explaining the bucket rule.
- **Recent signups** — full list with plan badge and source · time.
- **Payments** — INR and USD summary tiles, then the payment list.
- **Pro subscribers** — 40px count, Pro-share ProgressBar, 3 stat tiles, conversion-by-period table.
- **Alerts** — 3 notifications with a coloured status dot (action / success / amber).
- **Creator detail** — avatar, name, `platform · code · cohort`, 6 stat tiles, signup→paid bar, "Add post data" + "Copy link", then a post list (date · type, views/likes/comments, budget).
- **Person detail** — avatar, name, email, plan badge, 6 facts (signed up, source · medium, bucket, status, resumes, last active), "Copy email" + "PostHog", then payments (or a free-credits empty state).

### 7. Overlays
- **Range picker** — phone bottom sheet ("Date range · IST", 7 presets: Today, Yesterday, Last 7 days, Last 14 days, This month, Last month, All time; 52px rows, active row tinted `--action-50` with a check). Desktop: 240px popover anchored under the range pill.
- **Team switcher** — opened from the header title (phone) or the sidebar team button (desktop). Four teams — Growth (GR, action blue, Overall), Influencer marketing (IM, success, Influencer), Performance marketing (PM, amber, Perf), Founders (FO, ink, Overall). A tinted thumb slides between rows (64px phone / 56px desktop). Picking a team sets the default attribution bucket, shows a check, and closes after 360ms.
- **Appearance switch** — Light / Dark / Auto segmented control in the same sheet (phone) or pinned above Settings in the sidebar (desktop). Auto reads `prefers-color-scheme`.
- **Add post data** — phone bottom sheet / desktop 520px centred modal. Fields: Date, Budget ₹, Views, Likes, Comments, Shares (44px, radius 12px). Save toasts "Entry saved for {creator}".
- **Toast** — pill, `--ink-900` on light / white on dark, bottom 110px (phone) or 28px (desktop), auto-dismiss 2.2s.

### 8. Mobile-only presentation mocks
- **Lock screen push** — three notifications: daily digest, revenue milestone, PostHog budget exhausted.
- **Home-screen widgets** — iOS small (signups today + sparkline), Android 2×2 (revenue, dark panel), iOS medium (7-day signups + sparkline + three stats). They read the cached `/api/overview` edge response so they never consume PostHog read budget.

## Interactions & behaviour
- **Global attribution toggle** (Influencer · Perf · Overall) is pinned in the phone header and the desktop topbar. It re-derives every number on screen: sources are filtered by bucket (Direct, Chrome Extension, organic social and the Google brand-search campaign → Influencer; Google non-brand and Meta → Perf; email and referral appear only in Overall), and revenue/Pro/spend scale with the bucket.
- **Range change and bucket change** both trigger a 420ms loading dip (`opacity .35`) and clear any selected chart bar.
- **Refresh** (`refresh-cw`, phone header and desktop topbar): spins for 900ms, dims content, resets the Live badge to "now", then toasts "Refreshed · {time}". No-op while already refreshing.
- **Live badge** counts minutes since the last read (1–5m, "now" while refreshing).
- **Stale state** (`stale` prop): amber banner under the header — "PostHog hourly read budget exhausted. Showing the snapshot from 14 min ago; retrying at 10:15." Mirrors the existing API contract; the app must degrade to the cached snapshot rather than erroring.
- Chart bars, KPI tiles, list rows, creator rows, "See all" links and quick filters are all interactive; anything not implemented toasts rather than navigating to a dead end.

## State
```
range: 'today'|'yest'|'7d'|'14d'|'thisMonth'|'lastMonth'|'all'   // default '7d'
view: 'overall'|'influencer'|'perf'                               // default from team
tab: 'overview'|'report'|'creators'|'search'|'more'|'page'
page: string|null          // which More screen
sub: string|null           // drill-down id: sources|signups|payments|pro|alerts|creator|person|<page name>
creator: string|null       // referral code
person: string|null        // email
sheet / teams / add: boolean
mode: 'light'|'dark'|'auto'
team: 'growth'|'influencer'|'perf'|'founders'
bar: number|null           // selected chart index
query: string
loading / refreshing: boolean
toast: string|null
tick: number               // minute counter for the Live badge
```
Derivation notes: all figures come from one `/api/overview`-shaped payload per (range, bucket); the prototype scales a 7-day baseline, the real app should query. Currency: INR and USD are kept separate everywhere and only combined for ARPU/ROAS at one rate, resolved server-side in `lib/fx.js` and served by `/api/fx` as `{ rate, asOf, source }`. Every surface reads that endpoint and no surface carries its own number. Configure with the `FX_USD_INR` env var. Documented fallback ₹84 per $1, and any figure converted at the fallback says so in the UI. Numbers format with `en-IN` grouping; large social counts abbreviate to K / L.

## Data sources (from the repo)
- PostHog project 399417, Asia/Kolkata, internal and test accounts excluded (`lib/overview.js`).
- Baseline used in the mock: 7-day signups 1,933 vs 1,446 prior; daily 179/158/246/359/383/335/246; active Pro 164 of 13,373; sources Google 826 · Direct 550 · Chrome 277 · Meta 217 · Influencer 46; last month ₹74,058 + \$393.74 over 108 payments.
- Perf spend: `googleads_campaign_stats` + `metaads_ad_stats`, brand-search campaign excluded from Perf.
- Creator budgets and social metrics: manual dated entries in Vercel KV, keyed to the same date ranges.

## Assets
- `assets/logo-mark.svg` — official mark, copied from the design system.
- Lucide icons via CDN mask (no bundled binaries).
- No photography. Avatars are initials on a tinted circle.

## Files in this bundle
- `MobileOverview.dc.html` — phone app prototype (iOS + Android).
- `DesktopOverview.dc.html` — desktop/laptop console prototype.
- `NextRaise Mobile.dc.html` — presentation canvas (device frames, push mock, widgets). Reference only.
- `ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx` — device/browser chrome used by the canvas. Not product code.
- `support.js` — prototype runtime. Not product code.
- `github.md` — repo/branch/screen map for syncing back to source.
- `_ds/` — the NextRaise Design System bundle (tokens, styles, component bundle) the designs are built on.

## Implementation order suggested
1. Tokens + dark-mode remap + the glass/flat theme switch.
2. The shared view-model (state shape, bucket filtering, formatters) — one module, both surfaces.
3. Overview on desktop, then the phone layout of the same data.
4. Drill-downs (drawer on desktop, push on phone).
5. Report / Creators / Search.
6. The eight generic More pages from the shared page view-model.
7. Refresh, stale state, toasts, team + appearance switchers.
8. Widgets and push payloads last — they only need the cached overview response.
