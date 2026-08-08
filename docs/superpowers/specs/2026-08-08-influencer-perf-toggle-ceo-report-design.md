# NextRaise Dashboard — Influencer / Perf / Overall toggle + CEO Report

**Date:** 2026-08-08
**Status:** Approved (design)
**Scope:** Sub-project 1 of 2. This is "the brain" (attribution engine + toggle + CEO report + manual data + export). The full visual redesign is sub-project 2 and gets its own spec.

## Problem / context

NextRaise runs two marketing motions:
- **Influencer marketing** (creator videos on Instagram / YouTube).
- **Performance marketing** ("Perf") = Google Ads + Meta Ads.

Reality of attribution: influencer videos drive most signups, but people often do not click the creator link. They watch the video, then either search NextRaise on Google (landing on the **keyword** Google campaign `23951249428`), or arrive as **Direct** / **Organic** / via the **Chrome Extension**. So those signups are really influencer-driven and must be credited to influencer marketing.

Pure organic search demand is under 0.1%, so the keyword campaign is treated as influencer, not paid perf.

The team needs a CEO-facing report (daily / every 2 days / weekly / monthly) covering influencer + revenue performance: budget, views, comments, shares, likes, sales, signups, conversion rate, revenue.

## Bucket definitions (attribution engine)

Every person is classified once, by first-touch attribution + the keyword carve-out. `channelOf(source, medium)` is the existing JS classifier in `index.html`; the SQL bucket filter must stay in lockstep with it.

- **Influencer** = `channel ∈ {Direct, Organic Social, Influencer, Extension}` **OR** (`channel = Google Ads` AND `$initial_utm_campaign = '23951249428'`)
- **Perf** = (`channel = Google Ads` AND `$initial_utm_campaign != '23951249428'`) OR `channel = Meta Ads`
- **Overall** = all persons (no bucket filter)

**Decision #1 (approved):** Email, Referral, and Other belong to neither Influencer nor Perf; they appear only in **Overall**. They are negligible in volume.

`23951249428` is confirmed to exist as a `$initial_utm_campaign` value (288 signups / 14d) and is the *only* Google keyword campaign.

### Implementation

- A shared person-level bucket filter injected into each screen's query as `person_id IN (<bucket subquery>)`.
- The bucket subquery derives each person's `source`, `medium`, `$initial_utm_campaign` via the same person-level attribution the Acquire tab uses (`argMaxIf(... , timestamp, prop != '')`), then applies the bucket condition using a SQL translation of `channelOf`.
- Reuse the existing query cache (`_qcache`, 5-min TTL) and stale-while-revalidate to absorb the extra per-query cost. Bucket subquery scans the same narrow window (`scanDays`) the screen already uses.
- Keyword carve-out (`23951249428`) is a literal constant, easy to special-case in SQL.

## Global toggle

- A 3-way segmented control: **Influencer · Perf · Overall**, pinned in the header next to the date filter.
- State persists in `localStorage` and the URL (`?view=influencer&range=7d`) so a shared link opens to exactly the sent view.
- Composes with the existing date-range filter; changing either re-fetches the affected screens.
- Default view = **Overall**.

## CEO Report (new showcase screen)

Toggle- and date-aware. Sections:

- **Hero KPIs:** Signups · Sales (paid conversions) · Conversion % · Revenue · Budget spent · ROAS + CAC (cost per signup, cost per sale).
- **Influencer view adds:** Views · Likes · Comments · Shares · Engagement rate · cost per view (from manual data).
- **Per-creator table:** creator | budget | views | likes | comments | shares | signups | sales | conv% | revenue | ROAS. Manual + auto merged. Sortable.
- **Perf view:** per-campaign (Google campaigns + Meta) spend | impressions | clicks | CTR | signups | sales | conv% | revenue | ROAS | CAC.
- **Overall view:** blended totals + an Influencer-vs-Perf side-by-side (spend, signups, sales, revenue, CAC, ROAS).
- **Trend chart:** signups + revenue over time for the selected bucket.

### Data sources per metric

- **Signups / sales / conversion / revenue:** PostHog events + `postgres.payments` (auto), filtered by bucket + date range.
- **Perf spend / impressions / clicks (auto):** `googleads_campaign_stats` (per `campaign_id`; `metrics_cost_micros / 1e6`, `metrics_impressions`, `metrics_clicks`) and `metaads_ad_stats` (`toFloat64OrNull(spend)`, impressions, clicks). The keyword campaign `23951249428` is excluded from Perf spend. Perf spend is NOT entered manually.
- **Influencer "Budget spent" (manual):** exactly the budget/spend the team types into the creator form. The Google keyword campaign `23951249428` ad-spend is NOT auto-added (so that campaign's spend is uncounted in "budget spent"; its signups/revenue are still credited to Influencer via attribution).
- **Views / likes / comments / shares / creator budget:** manual (see below). Not in any connected data source.

## Manual creator data (Vercel KV)

- New serverless endpoint `api/creator-data` (GET list, POST upsert, DELETE), backed by **Vercel KV**. Requires KV env keys (same pattern as `PH_API_KEY`); until set, the endpoint returns empty and the report shows auto metrics only.
- In-app form to add / edit entries (behind the existing Settings-style gate).

**Decision #2 (approved):** entries are **dated** per creator, e.g. `{ creator, code, platform, date, budget, views, likes, comments, shares, note }`. The report sums manual entries whose `date` falls in the selected range, so manual numbers line up with the date-ranged auto numbers.

- **Join key:** creator referral code / UTM campaign (maps to the influencer handle via the existing cohort-name logic), so manual rows line up with auto signup/revenue rows.

## Export

- One-tap export of the current CEO Report (respecting toggle + range) to a clean A4 **PDF / PNG** for WhatsApp / email. Implemented via a print stylesheet or `html2canvas`-style capture of the report container.

## Rollout phases

1. **Phase 1:** bucket engine + SQL filter helper + global toggle + Overview made bucket-aware + CEO Report screen + manual-entry form + KV endpoint + export.
2. **Phase 2:** extend the bucket filter to the remaining ~22 screens.
3. **Phase 3 (separate spec):** full Apple/Google-grade visual redesign of dashboard + APK.

## Non-goals (this spec)

- The visual redesign (Phase 3 / sub-project 2).
- Auto-scraping IG/YouTube social metrics.
- Automated scheduled sending of the report (live view + manual export only).

## Risks / watch-items

- **Query performance:** extra person-subquery per screen. Mitigated by existing cache + narrow scan windows; validate on Today/Yesterday ranges (known to hit ClickHouse limits historically).
- **SQL vs JS `channelOf` drift:** the two classifiers must stay in sync; document the mapping in one place.
- **Manual/auto date alignment:** relies on the team entering dated manual rows; if they skip dates, manual metrics will not date-filter correctly.
- **Meta spend currency:** confirm `metaads_ad_stats.spend` is INR (weekly-tracker note suggests it is) before mixing with Google INR spend.
