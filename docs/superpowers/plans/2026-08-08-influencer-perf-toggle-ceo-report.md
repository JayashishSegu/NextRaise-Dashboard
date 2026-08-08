# Influencer / Perf / Overall Toggle + CEO Report — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global Influencer/Perf/Overall attribution toggle that re-scopes the dashboard, plus a CEO Report screen combining auto metrics (signups, sales, conversion, revenue, perf ad-spend) with manually-entered influencer budget + social metrics, with PDF/PNG export.

**Architecture:** A shared JS helper builds a person-level "bucket" subquery (SQL mirror of `channelOf` + keyword-campaign `23951249428` carve-out) that is injected into each screen's HogQL as a `person_id IN (…)` / `user_email IN (…)` filter. A header segmented control holds the view (persisted to `localStorage` + URL). Manual creator data lives in Vercel KV behind `api/creator-data`. The CEO Report is a new tab that merges manual + auto data and exports via print/canvas.

**Tech Stack:** Single-file vanilla JS (`index.html`), PostHog HogQL over fetch, Vercel serverless (`api/`), Vercel KV, Playwright (verification), `nextraise-analytics` MCP (HogQL ground-truth).

**Spec:** `docs/superpowers/specs/2026-08-08-influencer-perf-toggle-ceo-report-design.md`

**Verification harness (used by every task):**
- Serve: `python3 -m http.server 8795 --directory /Users/jayashish/nextraise-dashboard`
- Drive with Playwright MCP; assert on DOM via `browser_evaluate`. `renderX()` functions read closure-scoped `let` vars, so inject fixtures with **bare assignments** (`_revData = {...}`), not `window._revData =`.
- Validate HogQL against ground truth with `mcp__nextraise-analytics__run_hogql`.
- `index.html` is not committed during this work (uncommitted local edits exist); commit only the files each task creates/edits, on branch `spec/influencer-perf-toggle` (already checked out).

---

## File Structure

- **Modify `index.html`:**
  - New helpers near `channelOf` (~line 4925): `BUCKET_VIEW` state, `bucketExprSQL()`, `bucketPersonFilter(alias)`, `bucketEmailFilter(col)`.
  - Header: segmented control markup + `setBucketView()` (near the date-filter header controls).
  - New tab registration `report` in the nav + router (`switchTab`), plus `fetchReport()`/`renderReport()` in the net-new `<script>` block before `</body>`.
  - Creator-data client: `fetchCreatorData()`, `saveCreatorEntry()`, `renderCreatorForm()`.
  - Overview queries: inject `bucketPersonFilter`/`bucketEmailFilter`.
  - CSS: segmented control, report cards, print stylesheet — appended in the light-theme override block and a `@media print` block.
- **Create `api/creator-data.js`:** Vercel serverless GET/POST/DELETE over Vercel KV.
- **Create `lib/bucket.js`:** CommonJS copy of the bucket SQL builder (only if/when `api/overview.js` needs bucket-awareness; Phase 2). Not required for Phase 1.

---

## Task 1: Bucket SQL helper (the engine)

**Files:**
- Modify: `index.html` (add helpers after `channelOf`, ~line 4942)

**Context:** `channelOf(source, medium)` (JS) buckets a person's first-touch into a channel. We need the SQL equivalent that maps a person to `'infl'` / `'perf'` / `'other'`, matching `channelOf`'s precedence order exactly, plus the keyword carve-out: Google campaign `23951249428` → `'infl'`.

- [ ] **Step 1: Add the bucket state + SQL builders**

Insert after the `channelOf` function:

```javascript
  // ===== Attribution bucket engine (Influencer / Perf / Overall) =====
  // Mirrors channelOf() precedence in SQL, mapping each person to infl|perf|other.
  // Influencer = Direct + Organic Social + Influencer + Extension + Google kw campaign.
  // Perf = Google Ads (non-kw) + Meta Ads. Overall = everyone (no filter).
  const BUCKET_KW_CAMPAIGN = '23951249428';
  let BUCKET_VIEW = 'overall';   // 'influencer' | 'perf' | 'overall'

  // SQL expression classifying (s, m, c) into 'infl' | 'perf' | 'other'.
  // s and m must already be lowercased; c is the raw $initial_utm_campaign.
  function bucketExprSQL(s, m, c) {
    const blank = v => `(${v}='' OR ${v} IN ('none','null','undefined','(none)','(direct)','false'))`;
    const has = (v, sub) => `positionCaseInsensitive(${v},'${sub}')>0`;
    return `multiIf(
      (${blank(s)} AND ${blank(m)}) OR ${s}='direct', 'infl',
      ${s}='chrome_extension' OR ${m}='extension', 'infl',
      ${has(m,'influ')} OR ${has(s,'influ')}, 'infl',
      ${has(s,'google')}, if(${c}='${BUCKET_KW_CAMPAIGN}','infl','perf'),
      (${has(s,'meta')} OR ${has(s,'facebook')} OR ${s}='fb' OR ${s}='ig' OR ${has(s,'instagram')} OR ${has(s,'instagran')}),
        if(${m}='social' OR ${m}='video','infl','perf'),
      ${m}='email' OR ${s}='loops', 'other',
      ${m}='referral' OR ${s}='affiliate' OR ${has(s,'auto_dm')}, 'other',
      ${m}='social' OR ${m}='video' OR ${m}='paid_social', 'infl',
      ${has(s,'twitter')} OR ${has(s,'chatgpt')} OR ${has(s,'youtube')}, 'infl',
      'other')`;
  }

  // Person-level bucket set for the current view, scanning `scanDays` of events.
  // Returns the inner SELECT (person_id) with the internal-user exclusions.
  function bucketPersonSet(view, scanDays) {
    const s = `lower(argMaxIf(toString(person.properties.source), timestamp, person.properties.source!=''))`;
    const m = `lower(argMaxIf(toString(person.properties.medium), timestamp, person.properties.medium!=''))`;
    const c = `argMaxIf(toString(person.properties.$initial_utm_campaign), timestamp, person.properties.$initial_utm_campaign!='')`;
    // NOTE: `$initial_utm_campaign` is safe in a template literal ($ only interpolates before `{`).
    const want = view === 'perf' ? 'perf' : 'infl';
    return `SELECT person_id FROM (
      SELECT person_id, ${s} AS bs, ${m} AS bm, ${c} AS bc
      FROM events
      WHERE timestamp > now() - INTERVAL ${scanDays|0} DAY
        AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
        AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
        AND person_id NOT IN COHORT 278743
      GROUP BY person_id
    ) WHERE ${bucketExprSQL('bs','bm','bc')}='${want}'`;
  }

  // WHERE fragment for events-based queries. '' when Overall (no filter).
  function bucketPersonFilter(scanDays) {
    if (BUCKET_VIEW === 'overall') return '';
    return ` AND person_id IN (${bucketPersonSet(BUCKET_VIEW, scanDays)}) `;
  }

  // WHERE fragment for postgres.payments (email-keyed) queries.
  function bucketEmailFilter(emailCol, scanDays) {
    if (BUCKET_VIEW === 'overall') return '';
    return ` AND ${emailCol} IN (
      SELECT argMaxIf(toString(person.properties.email), timestamp, person.properties.email!='')
      FROM events WHERE person_id IN (${bucketPersonSet(BUCKET_VIEW, scanDays)}) GROUP BY person_id) `;
  }
```

- [ ] **Step 2: Verify the SQL matches channelOf via ground truth**

Use the MCP to confirm bucket counts reconcile with the Acquire channel numbers. Run (14d):

```
mcp__nextraise-analytics__run_hogql with a query wrapping bucketPersonSet('influencer',14) as
  SELECT count() FROM (<bucketPersonSet influencer>)   -- expect ≈ Direct+Organic+Influencer+Extension+kw persons
and bucketPersonSet('perf',14) similarly (Google non-kw + Meta).
```
Expected: `infl + perf + other == total signups (14d)`; `perf` excludes campaign 23951249428; `infl` includes it. Record the three counts in the task notes.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(bucket): SQL bucket engine for Influencer/Perf/Overall"
```

---

## Task 2: Global toggle (header segmented control + persistence)

**Files:**
- Modify: `index.html` (header controls near the date-filter button; add `setBucketView`; CSS)

- [ ] **Step 1: Add the segmented control markup** next to the shared date-filter control in the header (search for the element that renders the `gdr` date button; place the toggle immediately before it):

```html
<div class="bucket-seg" id="bucketSeg" role="tablist" aria-label="Attribution view">
  <button class="bkt" data-view="influencer" onclick="setBucketView('influencer')">Influencer</button>
  <button class="bkt" data-view="perf" onclick="setBucketView('perf')">Perf</button>
  <button class="bkt is-on" data-view="overall" onclick="setBucketView('overall')">Overall</button>
</div>
```

- [ ] **Step 2: Add state wiring** (near `bucketPersonFilter`):

```javascript
  function _syncBucketSeg() {
    document.querySelectorAll('#bucketSeg .bkt').forEach(b =>
      b.classList.toggle('is-on', b.dataset.view === BUCKET_VIEW));
  }
  function initBucketView() {
    const u = new URLSearchParams(location.search).get('view');
    const saved = u || localStorage.getItem('nr_bucket_view') || 'overall';
    BUCKET_VIEW = ['influencer','perf','overall'].includes(saved) ? saved : 'overall';
    _syncBucketSeg();
  }
  function setBucketView(v) {
    if (BUCKET_VIEW === v) return;
    BUCKET_VIEW = v;
    localStorage.setItem('nr_bucket_view', v);
    const url = new URL(location.href); url.searchParams.set('view', v);
    history.replaceState(null, '', url);
    _syncBucketSeg();
    // Invalidate cached per-view data and reload the current + warmed tabs.
    if (typeof _bypassQueryCache !== 'undefined') _bypassQueryCache = true;
    _refreshAllLoadedTabs();   // defined in Step 3
  }
```

- [ ] **Step 3: Add `_refreshAllLoadedTabs`** — resets the `_xLoaded` flags for data tabs and re-fetches the active one (model on the existing `refreshTab`/`_gdrRefetch` logic). Reset at minimum: `_ovLoaded`(overview), `_acqLoaded`, `_revLoaded`, `_reportLoaded`, and re-run the fetch for whichever tab is visible.

```javascript
  function _refreshAllLoadedTabs() {
    _ovLoaded = false; _acqLoaded = false; _revLoaded = false; _reportLoaded = false;
    const active = document.querySelector('.tab.active')?.id?.replace('tab-','') || 'overview';
    switchTab(active);           // re-runs the active tab's fetch
    setTimeout(()=>{ _bypassQueryCache = false; }, 9000);
  }
```

- [ ] **Step 4: Call `initBucketView()` on load** — add to the existing DOMContentLoaded/boot sequence (where `updateTabGdrBtn`/theme init runs).

- [ ] **Step 5: CSS** (append in the light-theme override block; keep dark tokens working):

```css
.bucket-seg{ display:inline-flex; background:var(--surface-2); border:1px solid var(--sep); border-radius:999px; padding:3px; gap:2px; }
.bucket-seg .bkt{ border:0; background:transparent; color:var(--text-2); font:600 12.5px/1 'Plus Jakarta Sans',sans-serif; padding:7px 14px; border-radius:999px; cursor:pointer; transition:all .3s cubic-bezier(.32,.72,0,1); }
.bucket-seg .bkt.is-on{ background:var(--surface); color:var(--text); box-shadow:0 2px 8px rgba(31,35,48,.08); }
@media(max-width:600px){ .bucket-seg .bkt{ padding:6px 10px; font-size:11.5px; } }
```

- [ ] **Step 6: Verify (Playwright)** — load local, assert three buttons exist, clicking toggles `is-on`, `localStorage.nr_bucket_view` updates, and `?view=` appears in URL. Reload with `?view=perf` → Perf button is `is-on`.

- [ ] **Step 7: Commit** `git add index.html && git commit -m "feat(bucket): global header toggle with URL+localStorage persistence"`

---

## Task 3: Make Overview bucket-aware

**Files:**
- Modify: `index.html` `loadOverview()` (client query path, ~line 9500s) — inject the filter into each events query and each `postgres.payments` query.

**Context:** `loadOverview` runs ~9 queries. Events queries get `bucketPersonFilter(scanDays)`; payment queries get `bucketEmailFilter('user_email', scanDays)`. `scanDays` = the range's scan window (reuse `gdrBounds`/`_gdr.scanDays`; default 400 for all-time, but cap the bucket scan at the same window the query uses).

- [ ] **Step 1:** For each events-based query string in `loadOverview`, append `${bucketPersonFilter(scanDays)}` inside the WHERE (after the existing internal-exclusion clause). For the `counts` person-scan derived table, add the filter to its innermost `events` WHERE.
- [ ] **Step 2:** For the revenue/payments query(ies) in `loadOverview`, append `${bucketEmailFilter('user_email', scanDays)}`.
- [ ] **Step 3:** Cache-key isolation — the query cache key is a hash of SQL, and SQL now varies by `BUCKET_VIEW`, so per-view results cache separately automatically. Confirm the Overview snapshot cache key (`nr_ov_cache3`) includes the view: change key to `nr_ov_cache3_${BUCKET_VIEW}` where the snapshot is saved/read.
- [ ] **Step 4: Verify** — with the MCP, compute Overview signups for `influencer` and `perf` (14d) directly; then in Playwright set `BUCKET_VIEW='influencer'`, run `loadOverview()`, and assert the rendered Signups KPI equals the MCP number (±cache). Repeat `perf`. Assert `influencer + perf ≤ overall` and `overall` unchanged from today.
- [ ] **Step 5: Commit** `git add index.html && git commit -m "feat(bucket): Overview respects Influencer/Perf/Overall"`

---

## Task 4: Vercel KV endpoint for manual creator data

**Files:**
- Create: `api/creator-data.js`
- Modify: `package.json` (add `@vercel/kv` dep) — if absent, create minimal one.

**Data model (one KV hash, key `creator-data:v1`):** map of `entryId -> entry`, where
```
entry = { id, code, creator, platform, date:'YYYY-MM-DD', budget:Number, views:Number, likes:Number, comments:Number, shares:Number, note:String, updatedAt }
```
`code` = referral/UTM campaign that links to auto signup/revenue rows (via existing cohort-name mapping). Entries are dated so the report can sum within a range.

- [ ] **Step 1: Write the endpoint**

```javascript
// api/creator-data.js  — GET (list), POST (upsert), DELETE (?id=)
import { kv } from '@vercel/kv';
const KEY = 'creator-data:v1';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const all = (await kv.hgetall(KEY)) || {};
      return res.status(200).json({ entries: Object.values(all) });
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!b.creator || !b.date) return res.status(400).json({ error: 'creator and date required' });
      const id = b.id || `${b.code||b.creator}|${b.date}|${Date.now()}`;
      const entry = { id, code: b.code||'', creator: b.creator, platform: b.platform||'',
        date: b.date, budget: +b.budget||0, views: +b.views||0, likes: +b.likes||0,
        comments: +b.comments||0, shares: +b.shares||0, note: b.note||'', updatedAt: Date.now() };
      await kv.hset(KEY, { [id]: entry });
      return res.status(200).json({ entry });
    }
    if (req.method === 'DELETE') {
      const id = (req.query.id||'').toString();
      if (!id) return res.status(400).json({ error: 'id required' });
      await kv.hdel(KEY, id);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    // KV not configured yet → behave as empty store so the UI still works.
    if (req.method === 'GET') return res.status(200).json({ entries: [], kv: false });
    return res.status(503).json({ error: 'KV unavailable: ' + e.message });
  }
}
```

- [ ] **Step 2:** Add `@vercel/kv` to `package.json` dependencies.
- [ ] **Step 3: Verify** locally with `vercel dev` (or after a preview deploy): `curl -s localhost:3000/api/creator-data` → `{entries:[],kv:false}` before KV is provisioned; after `POST` a sample entry (once KV env set) it round-trips in the next GET. Document the required env: create a Vercel KV store and link it (provides `KV_REST_API_URL`, `KV_REST_API_TOKEN`).
- [ ] **Step 4: Commit** `git add api/creator-data.js package.json && git commit -m "feat(creator-data): Vercel KV endpoint for manual influencer data"`

---

## Task 5: Creator-data client + entry form

**Files:**
- Modify: `index.html` (client fns + a form UI, gated like Settings)

- [ ] **Step 1: Client fns**

```javascript
  var _creatorData = null, _creatorLoaded = false;
  async function fetchCreatorData(force) {
    if (_creatorLoaded && !force) return _creatorData;
    try {
      const r = await fetch('/api/creator-data', { cache:'no-store' });
      const j = await r.json();
      _creatorData = j.entries || [];
    } catch(_) { _creatorData = []; }
    _creatorLoaded = true; return _creatorData;
  }
  async function saveCreatorEntry(entry) {
    const r = await fetch('/api/creator-data', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry) });
    if (!r.ok) throw new Error('save failed'); await fetchCreatorData(true); return r.json();
  }
  async function deleteCreatorEntry(id) {
    await fetch('/api/creator-data?id='+encodeURIComponent(id), { method:'DELETE' });
    await fetchCreatorData(true);
  }
  // Sum manual metrics for a code within [startISO, endISO).
  function manualForCode(code, startISO, endISO) {
    return (_creatorData||[]).filter(e => e.code===code && e.date>=startISO && e.date<endISO)
      .reduce((a,e)=>({budget:a.budget+e.budget, views:a.views+e.views, likes:a.likes+e.likes,
        comments:a.comments+e.comments, shares:a.shares+e.shares}),
        {budget:0,views:0,likes:0,comments:0,shares:0});
  }
```

- [ ] **Step 2: Form UI** — a modal/section (reuse the Settings modal styles) with fields: creator, code (datalist of known influencer codes from the Influencers tab), platform, date, budget, views, likes, comments, shares, note; a Save button calling `saveCreatorEntry`; and a list of existing entries with delete. Render via `renderCreatorForm()`; open from a button on the CEO Report and from Settings.
- [ ] **Step 3: Verify (Playwright)** — stub `fetch` for `/api/creator-data` to return fixtures; open form, submit, assert POST body shape; assert the entries list renders and delete calls DELETE with the id.
- [ ] **Step 4: Commit** `git add index.html && git commit -m "feat(creator-data): in-app entry form + client"`

---

## Task 6: CEO Report screen — data + render

**Files:**
- Modify: `index.html` — nav (`tab-report`), router (`switchTab` case `report`), `fetchReport()`/`renderReport()` in the net-new `<script>` block; CSS for report cards + `@media print`.

**Behavior:** toggle- and date-aware. `fetchReport()` runs auto queries (bucket-filtered) and reads `_creatorData`; `renderReport()` draws sections per the spec.

- [ ] **Step 1: Nav + router** — add a `report` tab button in the Overview group and a `#tab-report`/`#page-report` pair; in `switchTab`, `if (name==='report' && !_reportLoaded) fetchReport();`.

- [ ] **Step 2: `fetchReport()` auto queries** (all get `bucketPersonFilter`/`bucketEmailFilter`, range via `tabGdrStart/End('report')`):
  - **Signups:** `SELECT count(DISTINCT person_id) FROM events WHERE event='signup_complete' AND <excl> AND <range> ${bucketPersonFilter(scanDays)}`
  - **Sales + revenue:** `SELECT count() AS sales, count(DISTINCT user_email) AS payers, ifNull(sumIf(amount,currency='INR'),0) AS inr, ifNull(sumIf(amount,currency='USD'),0) AS usd FROM postgres.payments WHERE status='completed' AND <PW> AND <range> ${bucketEmailFilter('user_email',scanDays)}`
  - **Perf spend (only shown for perf/overall):** Google — `SELECT campaign_id, round(sum(metrics_cost_micros)/1e6) AS spend, sum(metrics_impressions) AS impr, sum(metrics_clicks) AS clicks FROM googleads_campaign_stats WHERE segments_date >= '<start>' AND segments_date < '<end>' GROUP BY campaign_id`; Meta — `SELECT round(sum(toFloat64OrNull(spend))) AS spend, round(sum(toFloat64OrNull(impressions))) AS impr, round(sum(toFloat64OrNull(clicks))) AS clicks FROM metaads_ad_stats WHERE date_start >= '<start>' AND date_start < '<end>'`. For **Perf** view exclude `campaign_id='23951249428'` from Google spend; for **Influencer** view Perf spend is not shown.
  - **Per-creator auto rows:** signups + sales + revenue grouped by influencer code (reuse the Influencers tab query shape and `inflHandle`), so each creator's auto metrics can merge with `manualForCode`.
  - Store into `_reportData`; set `_reportLoaded=true`; call `renderReport()`.

- [ ] **Step 3: `renderReport()` DOM contract** (exact classes so verification and the print sheet are stable):
  - `.rep-hero` containing `.rep-kpi` cards, each `.rep-kpi-num` + `.rep-kpi-label`: Signups, Sales, Conversion % (`sales/signups`), Revenue (`inr + usd*USD_TO_INR`), Budget spent (Influencer: Σ manual budget in range; Perf: Google(non-kw)+Meta spend; Overall: both), ROAS (`revenue/budget`), CAC (`budget/sales`).
  - Influencer view adds `.rep-social` KPIs: Views, Likes, Comments, Shares, Engagement % (`(likes+comments+shares)/views`), Cost/view (`budget/views`).
  - `.rep-creators` table (Influencer/Overall): creator | budget | views | likes | comments | shares | signups | sales | conv% | revenue | ROAS — merge `manualForCode(code,…)` with auto rows; sortable via existing table sort pattern.
  - `.rep-campaigns` table (Perf/Overall): campaign | spend | impr | clicks | CTR | signups | sales | conv% | revenue | ROAS | CAC (map Google `campaign_id`→name where known; Meta as one row).
  - `.rep-compare` (Overall only): Influencer vs Perf side-by-side (spend, signups, sales, revenue, CAC, ROAS) — reuse bucket totals by running the signups/sales/revenue queries once per bucket, or derive from per-creator/per-campaign sums.
  - `.rep-trend`: ApexCharts area of signups + revenue over the range for the current bucket (reuse the Overview chart pattern; `window._reportCharts` destroy-on-rerender).
  - Empty/loading via existing `stateBox`.

- [ ] **Step 4: Verify (Playwright + MCP)** — inject `_reportData` + `_creatorData` fixtures with bare assignment; assert: hero KPIs compute correctly (conv%, ROAS, CAC), Influencer view shows social KPIs and hides `.rep-campaigns`, Perf view shows `.rep-campaigns` and hides social, Overall shows `.rep-compare`. Then with real data + `BUCKET_VIEW='influencer'`, cross-check Signups/Revenue against the MCP numbers from Task 3.
- [ ] **Step 5: Commit** `git add index.html && git commit -m "feat(report): CEO Report screen (bucket + date aware)"`

---

## Task 7: PDF / PNG export

**Files:**
- Modify: `index.html` — an Export button on the CEO Report + `exportReport()`; a `@media print` stylesheet.

- [ ] **Step 1: Print stylesheet** — `@media print { body *{visibility:hidden} #page-report, #page-report *{visibility:visible} #page-report{position:absolute;inset:0} .no-print{display:none!important} }` sized to A4; hide sidebar/header/toggle (`.no-print`).
- [ ] **Step 2: `exportReport()`** — primary path `window.print()` (user picks Save as PDF); plus a PNG path using an injected `html2canvas` CDN script capturing `#page-report` → download `nextraise-report-<view>-<range>.png`. Button has two options (PDF / PNG).
- [ ] **Step 3: Verify (Playwright)** — `page.emulateMedia({media:'print'})`, assert only `#page-report` is visible (sidebar `visibility:hidden`); trigger PNG path with html2canvas stubbed and assert a download is initiated.
- [ ] **Step 4: Commit** `git add index.html && git commit -m "feat(report): PDF/PNG export"`

---

## Task 8: Deploy Phase 1 + set up KV

- [ ] **Step 1:** In Vercel dashboard, create a KV store and connect it to the project (adds `KV_REST_API_URL`, `KV_REST_API_TOKEN`). Document in the spec.
- [ ] **Step 2:** Deploy: `npx vercel deploy --prod --yes`. Verify live: toggle switches Overview numbers; `/api/creator-data` GET returns `{entries:[...]}`; add one creator entry via the form and confirm it appears on the Report; export produces a PDF/PNG.
- [ ] **Step 3:** Pull-to-refresh / reopen APK to bust WebView cache (per project notes).

---

## Task 9 (Phase 2): Extend bucket filter to remaining screens

**Files:** `index.html` — each `fetchX` query.

Apply `bucketPersonFilter(scanDays)` (events) / `bucketEmailFilter('user_email',scanDays)` (payments) to every remaining data screen, one commit per screen, verifying each against the MCP for `influencer`/`perf`:
Acquire, Insights (funnel), Revenue (Monetization), Daily, Retention, Lifecycle, Emails, Referrals, Features, Quality, Weekly, Monthly, Pro Users, Search, Activate, Influencers, Uninstalled, Credits/Power/Expiring/Abandoned/Salahkart tables.

Screens with no attribution dimension still filter their underlying person population by bucket (so "Influencer" shows only influencer-bucket users). Where a screen is inherently all-population (e.g. system Quality/exceptions), note in the UI that the bucket filter does/does not apply.

- [ ] Per screen: inject filter → verify vs MCP → commit `feat(bucket): <screen> respects view`.

---

## Notes / gotchas (from prior work in this file)
- `renderX` reads closure `let` vars; test injection uses bare assignment.
- Query cache `_qcache` keys on SQL; `nrForce()`/`_bypassQueryCache` bust it — `setBucketView` sets bypass for 9s.
- PostHog `/query` concurrency is **3 team-wide**; retry only 429, never "max execution time". Bucket subquery adds cost — keep `scanDays` to the range window, watch Today/Yesterday.
- `metaads_ad_stats.spend`/`impressions`/`clicks` are STRING → `toFloat64OrNull`. Confirm spend currency is INR before mixing with Google.
- Deploys don't commit; commit `index.html` per task on branch `spec/influencer-perf-toggle`.
