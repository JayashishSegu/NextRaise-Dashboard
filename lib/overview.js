// Server-side overview compute — same output contract as loadOverview() in index.html.
//
// REWRITTEN 2026-09-11 for PostHog's hourly API read budget (HTTP 429
// api_queries_budget_exceeded: a token bucket of bytes read per hour, refilled
// continuously; the query that crosses the line still runs and is debited after).
// The old queries scanned up to 400 days of the events table reading
// person.properties.* per event (the huge person_properties column) — 20-25 GB
// read PER QUERY. The rewrite reads person-level attributes from the `persons`
// table (current properties, ~35 MB for the whole table) joined against small
// event-name-filtered scans (signup_complete / payment_completed only,
// ~150-200 MB for 400 days). Verified equivalent shape via probe queries
// (nr-probe:counts-v2): ~99% less data read per combo.
//
// Semantic note: plan / subscription_status / source / medium / email / name are
// now the person's CURRENT properties (persons table) instead of argMax over the
// event history — for these fields "latest event value" and "current value" are
// the same thing in practice. $initial_utm_* are immutable first-touch values on
// both paths. Signup date still comes from real signup_complete events.
//
// Bucket-aware: view = 'overall' | 'influencer' | 'perf'. The bucket
// classification (bucketExprSQL) is unchanged, but it now evaluates over persons
// columns instead of a second full events scan per query.
//
// SYNC: bucketExprSQL / the bucket keyword-campaign id mirror index.html.

const IST_MS = 5.5 * 3600000;
const DAY = 86400000;

const GDR_PRESETS = [
  { key: 'today',     label: 'Today'       },
  { key: 'yest',      label: 'Yesterday'   },
  { key: '7d',        label: 'Last 7 days' },
  { key: '14d',       label: 'Last 14 days'},
  { key: 'thisMonth', label: 'This month'  },
  { key: 'lastMonth', label: 'Last month'  },
  { key: 'all',       label: 'All time'    },
];
const CONV_PRESETS = GDR_PRESETS; // index.html filters out 'custom'; we already omit it

const _istMidUtc = (y, m, d) => Date.UTC(y, m, d) - IST_MS;
const _dstr = ms => new Date(ms + IST_MS).toISOString().slice(0, 10);

function gdrBounds(key, cust) {
  const now = Date.now();
  const t = new Date(now + IST_MS);
  const Y = t.getUTCFullYear(), M = t.getUTCMonth(), D = t.getUTCDate();
  const tm = _istMidUtc(Y, M, D); // today 00:00 IST
  let s, e;
  switch (key) {
    case 'today':     s = tm;                    e = tm + DAY;                break;
    case 'yest':      s = tm - DAY;              e = tm;                      break;
    case '7d':        s = tm - 6 * DAY;          e = tm + DAY;                break;
    case '14d':       s = tm - 13 * DAY;         e = tm + DAY;                break;
    case 'thisMonth': s = _istMidUtc(Y, M, 1);   e = _istMidUtc(Y, M + 1, 1); break;
    case 'lastMonth': s = _istMidUtc(Y, M - 1, 1); e = _istMidUtc(Y, M, 1);   break;
    case 'all':       s = _istMidUtc(2026, 4, 1); e = tm + DAY;               break;
    case 'custom': {
      const f = (cust && cust.from) ? cust.from : _dstr(tm);
      const to = (cust && cust.to) ? cust.to : _dstr(tm);
      const fp = f.split('-').map(Number), tp = to.split('-').map(Number);
      s = _istMidUtc(fp[0], fp[1] - 1, fp[2]);
      e = _istMidUtc(tp[0], tp[1] - 1, tp[2]) + DAY;
      break;
    }
    default:          s = tm - 6 * DAY;          e = tm + DAY;
  }
  return {
    startDate: _dstr(s), endDate: _dstr(e),
    days: Math.max(1, Math.round((e - s) / DAY)),
    scanDays: Math.max(2, Math.ceil((now - s) / DAY) + 2),
  };
}

// ── Typed errors ──────────────────────────────────────────────────────────────
class PostHogBudgetError extends Error {
  constructor(message, retryAfter) {
    super(message || 'PostHog hourly API read budget exhausted');
    this.name = 'PostHogBudgetError';
    this.code = 'budget';
    this.status = 429;
    this.retryAfter = Math.max(1, retryAfter | 0) || 900;
  }
}
class PostHogQueryError extends Error {
  constructor(message, status, retriable) {
    super(message);
    this.name = 'PostHogQueryError';
    this.status = status || 0;
    this.retriable = !!retriable;
  }
}

// ── Attribution bucket engine (classification unchanged; source = persons) ────
// SYNC: mirror bucketExprSQL() in index.html.
const BUCKET_KW_CAMPAIGN = '23951249428';
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

// Persons-table columns: first-touch $initial_utm_* preferred, mutable
// source/medium as fallback (matches the old event-side BKT_SRC/BKT_MED intent).
const P_SRC = `lower(if(coalesce(toString(properties.$initial_utm_source),'')!='', toString(properties.$initial_utm_source), coalesce(toString(properties.source),'')))`;
const P_MED = `lower(if(coalesce(toString(properties.$initial_utm_medium),'')!='', toString(properties.$initial_utm_medium), coalesce(toString(properties.medium),'')))`;
const P_CMP = `coalesce(toString(properties.$initial_utm_campaign),'')`;

// One shared persons projection (cheap: whole persons table ≈ 35 MB).
const PERSONS_SUB = `
      SELECT id,
        coalesce(toString(properties.email),'')  AS email,
        coalesce(toString(properties.name),'')   AS name,
        coalesce(toString(properties.plan),'')   AS plan,
        coalesce(toString(properties.subscription_status),'') AS status,
        coalesce(toString(properties.source),'') AS source,
        coalesce(toString(properties.medium),'') AS medium,
        ${P_CMP} AS campaign,
        ${bucketExprSQL(P_SRC, P_MED, P_CMP)} AS bkt
      FROM persons`;

const INTERNAL_EMAIL = `endsWith(email,'@nextraise.ai') OR endsWith(email,'@creditdharma.in')`;

// person_id set for a bucket view — a single persons scan, no events read.
function bucketPersonSet(view) {
  const want = view === 'perf' ? 'perf' : 'infl';
  return `SELECT id FROM (${PERSONS_SUB}) WHERE bkt='${want}' AND NOT (${INTERNAL_EMAIL})`;
}
// email set for a bucket view (postgres.* queries are keyed by email).
function bucketEmailFilter(view, emailCol) {
  if (view === 'overall') return '';
  const want = view === 'perf' ? 'perf' : 'infl';
  return ` AND ${emailCol} IN (SELECT email FROM (${PERSONS_SUB}) WHERE bkt='${want}' AND email!='') `;
}
function bucketPersonFilter(view) {
  if (view === 'overall') return '';
  return ` AND person_id IN (${bucketPersonSet(view)}) `;
}

// ── PostHog HogQL fetch: concurrency gate, typed budget handling ──────────────
function makeRunner(env, state) {
  const host = env.PH_HOST || 'https://us.posthog.com';
  const projectId = env.PH_PROJECT_ID || '399417';
  const apiKey = env.PH_API_KEY;
  if (!apiKey) throw new Error('PH_API_KEY env var is not set');

  const gate = { active: 0, queue: [], MAX: 2 };
  const acquire = () => gate.active < gate.MAX
    ? (gate.active++, Promise.resolve())
    : new Promise(res => gate.queue.push(res)).then(() => { gate.active++; });
  const release = () => { gate.active--; const n = gate.queue.shift(); if (n) n(); };

  async function fetchOnce(sql, name, refresh) {
    const body = { query: { kind: 'HogQLQuery', query: sql } };
    if (name) body.query.name = name;
    if (refresh) body.refresh = refresh;
    const resp = await fetch(`${host}/api/projects/${projectId}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let json = {};
    try { json = await resp.json(); } catch (_) {}
    if (!resp.ok) {
      const detail = String(json.detail || json.error || '');
      if (resp.status === 429 &&
          (json.code === 'api_queries_budget_exceeded' || /hourly budget of data read/i.test(detail))) {
        const m = detail.match(/available in (\d+)\s*seconds?/i);
        const retryAfter = (m && +m[1]) || +resp.headers.get('retry-after') || 900;
        throw new PostHogBudgetError(detail, retryAfter);
      }
      if (/max execution time/i.test(detail)) {
        // Deterministic — never retry (re-running trips the 3-strikes 2-min lockout).
        throw new PostHogQueryError(detail, resp.status, false);
      }
      const retriable = resp.status === 429 || /too many|concurren|rate limit/i.test(detail)
        || [502, 503, 504].includes(resp.status);
      throw new PostHogQueryError(detail || `HTTP ${resp.status}`, resp.status, retriable);
    }
    return json;
  }

  // Retry ONLY transient failures. On a budget error: try force_cache (reads no
  // bytes, returns whatever PostHog has cached for this exact SQL) and, if a
  // cached copy exists, use it (marking the run stale). Once the budget trips,
  // every later query in this run goes straight to force_cache.
  return async function runHogQL(sql, name) {
    await acquire();
    try {
      if (state.budgetHit) {
        const cached = await fetchOnce(sql, name, 'force_cache').catch(() => null);
        if (cached && Array.isArray(cached.results)) { state.usedStale = true; return cached; }
        throw state.budgetHit;
      }
      let lastErr;
      for (let attempt = 0; attempt < 4; attempt++) {
        try { return await fetchOnce(sql, name); }
        catch (e) {
          lastErr = e;
          if (e instanceof PostHogBudgetError) {
            state.budgetHit = e;
            const cached = await fetchOnce(sql, name, 'force_cache').catch(() => null);
            if (cached && Array.isArray(cached.results)) { state.usedStale = true; return cached; }
            throw e;
          }
          if (attempt < 3 && e.retriable) {
            const base = e.status === 429 ? 500 : 1200;
            await new Promise(r => setTimeout(r, base * (attempt + 1) + Math.floor(Math.random() * 250)));
            continue;
          }
          throw e;
        }
      }
      throw lastErr;
    } finally { release(); }
  };
}

async function computeOverview(range, env, cust, view) {
  view = ['overall', 'influencer', 'perf'].includes(view) ? view : 'overall';
  const state = { budgetHit: null, usedStale: false };
  const runHogQL = makeRunner(env, state);
  const _ovGdr = gdrBounds(range, cust);
  const rangeStart = _ovGdr.startDate;
  const rangeEnd   = _ovGdr.endDate;
  const scanDays   = _ovGdr.scanDays;
  const pgRangeFilter = `created_at >= toDateTime('${rangeStart} 00:00:00') AND created_at < toDateTime('${rangeEnd} 00:00:00')`;

  const wantB = view === 'perf' ? 'perf' : 'infl';
  const bktWhere = view === 'overall' ? '' : ` AND p.bkt='${wantB}'`;

  // Signup set: event-name-filtered (sort-key-pruned) — light columns only.
  const signupSet = (days) => `
      SELECT person_id, min(toDate(toTimeZone(timestamp,'Asia/Kolkata'))) AS su
      FROM events
      WHERE event = 'signup_complete'
        AND timestamp > now() - INTERVAL ${days | 0} DAY
        AND person_id NOT IN COHORT 278743
      GROUP BY person_id`;

  // ONE consolidated person-level scan (the persons-properties read is the cost;
  // pay it once). Grouped by (source, medium, instagram-campaign); the counts
  // totals, the sources ranking and the influencer campaign list all derive from
  // these rows in JS. Column layout:
  //   0 source · 1 medium · 2 campaign_i · 3 c_range · 4 conv_range ·
  //   5..17 the 13 fixed counts columns · 18..31 the 7 cs/cp preset pairs.
  // ONE definition of "Pro" for the whole Overview: the person's email has a
  // live Pro row in postgres.subscriptions. The persons-table `plan` property is
  // written at checkout and never cleared, so it reports far more active Pro than
  // billing does (verified 2026-09-17: 290 persons match a live Pro subscription).
  // That gap is what made the conversion card, the Acquisition "paid" column and
  // the Active Pro tile disagree on the same screen.
  // Cost: postgres.users is ~37k rows and postgres.subscriptions ~8.7k; both are
  // read once per query and neither touches person_properties.
  const PG_PRO_EMAILS = `
        SELECT lower(u.email) FROM postgres.users u
        WHERE u.email != '' AND u.id IN (
          SELECT user_id FROM postgres.subscriptions
          WHERE status='active' AND positionCaseInsensitive(plan,'pro') > 0)`;
  const acquire = await runHogQL(`
          SELECT source, medium, campaign_i,
            countIf(su >= toDate('${rangeStart}') AND su < toDate('${rangeEnd}')) AS c_range,
            countIf(su >= toDate('${rangeStart}') AND su < toDate('${rangeEnd}') AND is_pro=1) AS conv_range,
            countIf(su >= toDate('2026-05-01')) AS new_product,
            countIf(su > toDate('2000-01-01') AND su < toDate('2026-05-01')) AS legacy,
            countIf(su = toDate(toTimeZone(now(),'Asia/Kolkata'))) AS new_today,
            countIf(su >= toDate(toTimeZone(now(),'Asia/Kolkata')) - 6) AS new_week,
            countIf(su >= toStartOfMonth(toDate(toTimeZone(now(),'Asia/Kolkata')))) AS new_month,
            countIf(is_pro=1 AND su >= toDate('2026-05-01')) AS pro,
            countIf(is_pro=1) AS paid,
            countIf(is_pro=1) AS active_pro,
            0 AS active_basic,
            countIf(su = toDate(toTimeZone(now(),'Asia/Kolkata')) - 1) AS new_yesterday,
            countIf(su >= toDate(toTimeZone(now(),'Asia/Kolkata')) - 13 AND su < toDate(toTimeZone(now(),'Asia/Kolkata')) - 6) AS new_week_prev,
            0 AS expired_pro,
            0 AS lapsed_30d,
            ${CONV_PRESETS.map((p, i) => { const b = gdrBounds(p.key);
              return `countIf(su>=toDate('${b.startDate}') AND su<toDate('${b.endDate}')) AS cs${i}, `
                   + `countIf(su>=toDate('${b.startDate}') AND su<toDate('${b.endDate}') AND is_pro=1) AS cp${i}`;
            }).join(', ')}
          FROM (
            SELECT s.person_id AS person_id, s.su AS su,
              p.source AS source, p.medium AS medium,
              if(lower(p.email) IN (${PG_PRO_EMAILS}), 1, 0) AS is_pro,
              if(positionCaseInsensitive(p.campaign,'instagram') > 0, p.campaign, '') AS campaign_i
            FROM (${signupSet(400)}) s
            JOIN (${PERSONS_SUB}) p ON p.id = s.person_id
            WHERE NOT (${INTERNAL_EMAIL})
              AND lower(email) NOT LIKE '%test%'${bktWhere}
          )
          GROUP BY source, medium, campaign_i
          LIMIT 3000`, 'nr-overview:acquire');

  // Same-window conversion cohort: previous window = same length, immediately before.
  // Comparison window = the same number of ELAPSED days, immediately before the
  // selected range. The old form subtracted _ovGdr.days, the FULL span of the
  // preset: on 17 Sep 'This month' held 17 days of data and was compared with
  // [2 Aug, 1 Sep), a settled 30-day month. 'All time' has no comparable prior
  // window, so it gets none, which also shortens that combo's sameWin scan from
  // about 280 days to about 141.
  const _istStartMs  = Date.parse(rangeStart + 'T00:00:00Z') - IST_MS;
  const _elapsedDays = Math.max(1, Math.min(_ovGdr.days, Math.ceil((Date.now() - _istStartMs) / DAY)));
  const _swPrevStart = range === 'all' ? rangeStart : _dstr(_istStartMs - _elapsedDays * DAY);
  const _hasPrev     = _swPrevStart !== rangeStart;
  const [signups, payments, revenue, growth, dailyPay, pgSubscribers, todayPay, sameWin] = await Promise.all([
    runHogQL(`
          SELECT p.email AS email, p.name AS name, p.plan AS plan, toString(s.last_su) AS created_at
          FROM (
            SELECT person_id, max(timestamp) AS last_su
            FROM events
            WHERE event='signup_complete' AND timestamp > now() - INTERVAL 21 DAY
              AND person_id NOT IN COHORT 278743
            GROUP BY person_id
          ) s
          JOIN (${PERSONS_SUB}) p ON p.id = s.person_id
          WHERE p.email != '' AND NOT (${INTERNAL_EMAIL})${bktWhere}
          ORDER BY created_at DESC LIMIT 7`, 'nr-overview:signups'),
    runHogQL(`
          SELECT p.email AS email, p.name AS name, e.plan AS plan,
                 e.pay_created AS pay_created, e.amount AS amount, e.currency AS currency
          FROM (
            SELECT person_id, timestamp AS ts, toString(timestamp) AS pay_created,
              toString(properties.plan) AS plan,
              toFloatOrZero(toString(properties.amount)) AS amount,
              toString(properties.currency) AS currency
            FROM events
            WHERE event='payment_completed'
              AND timestamp >= toDateTime('2026-05-01 00:00:00')
              AND person_id NOT IN COHORT 278743
          ) e
          JOIN (${PERSONS_SUB}) p ON p.id = e.person_id
          WHERE NOT (${INTERNAL_EMAIL}) AND lower(p.email) NOT LIKE '%test%'${bktWhere}
          ORDER BY pay_created DESC LIMIT 7`, 'nr-overview:payments'),
    runHogQL(`
          SELECT
            sumIf(amount, currency='INR') AS inr,
            sumIf(amount, currency='USD') AS usd,
            uniqExact(user_email) AS payers,
            uniqExactIf(user_email, currency='INR') AS inr_payers,
            uniqExactIf(user_email, currency='USD') AS usd_payers
          FROM postgres.payments
          WHERE status='completed'
            AND ${pgRangeFilter}
            AND user_email NOT LIKE '%@nextraise.ai'
            AND user_email NOT LIKE '%@creditdharma.in'
            AND lower(user_email) NOT LIKE '%test%'${bucketEmailFilter(view, 'user_email')}`, 'nr-overview:revenue'),
    runHogQL(`
          SELECT toString(toDate(toTimeZone(timestamp,'Asia/Kolkata'))) AS day, uniq(person_id) AS c
          FROM events
          WHERE event = 'signup_complete'
            AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) >= toDate('${rangeStart}')
            AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) < toDate('${rangeEnd}')
            AND person_id NOT IN COHORT 278743
            AND person_id NOT IN (SELECT id FROM (${PERSONS_SUB}) WHERE (${INTERNAL_EMAIL}) OR lower(email) LIKE '%test%')${bucketPersonFilter(view)}
          GROUP BY day ORDER BY day LIMIT 200`, 'nr-overview:growth'),
    runHogQL(`
          SELECT toString(toDate(toTimeZone(created_at,'Asia/Kolkata'))) AS day,
            count() AS cnt,
            sumIf(amount, currency='INR') AS inr,
            sumIf(amount, currency='USD') AS usd
          FROM postgres.payments
          WHERE status='completed'
            AND ${pgRangeFilter}
            AND user_email NOT LIKE '%@nextraise.ai'
            AND user_email NOT LIKE '%@creditdharma.in'
            AND lower(user_email) NOT LIKE '%test%'${bucketEmailFilter(view, 'user_email')}
          GROUP BY day ORDER BY day LIMIT 200`, 'nr-overview:dailyPay'),
    // ── Pro subscriber state · ONE authoritative definition ──────────────────
    // Source: postgres.subscriptions, the only table that carries a status and
    // an end_date per subscription (columns: id, plan, status, user_id,
    // end_date, provider, created_at, start_date, ...). postgres.users.plan_cache
    // mirrors the ACTIVE row only, so an expired Pro user reverts to plan_cache
    // 'free' and a cancelled one disappears — which is why the old plan_cache
    // active_basic and expired_pro tiles were permanently 0. There is also no
    // 'basic' plan in this product: postgres holds free, resume-builder-pro and
    // full-pro.
    // Definitions — all DISTINCT USERS, never rows (a user can hold several Pro
    // rows, so counting rows overstates):
    //   Pro         = subscriptions.plan LIKE '%pro%' (resume-builder-pro, full-pro)
    //   Active Pro  = has at least one status='active' Pro row
    //   Expired Pro = has an expired or cancelled Pro row and NO active one
    //   Lapsed 30d  = an Expired Pro user whose latest Pro end_date is in the
    //                 last 30 days — this is what the 30-day churn KPI divides by
    //   Cancelled   = the subset of Expired Pro whose row is status='cancelled'
    // Measured on the live tables 2026-09-17, overall view, exclusions applied:
    // active_pro 296 · lapsed_30d 126 · expired_pro 481 · cancelled_pro 1
    // (777 distinct Pro users, 0 of the ended ones with a NULL end_date, so the
    // 30-day window never silently drops a row). 296 is the same figure the old
    // users.plan_cache query returned, so nothing is lost by the move.
    // SYNC: mirrored in index.html loadOverview() (client fallback).
    runHogQL(`
          SELECT
            uniqExactIf(uid, is_active = 1) AS active_pro,
            uniqExactIf(uid, is_active = 0 AND is_ended = 1
              AND last_end >= now() - INTERVAL 30 DAY) AS lapsed_30d,
            uniqExactIf(uid, is_active = 0 AND is_ended = 1) AS expired_pro,
            uniqExactIf(uid, is_active = 0 AND is_cancelled = 1) AS cancelled_pro
          FROM (
            SELECT toString(s.user_id) AS uid,
              max(if(s.status = 'active', 1, 0)) AS is_active,
              max(if(s.status IN ('expired','cancelled'), 1, 0)) AS is_ended,
              max(if(s.status = 'cancelled', 1, 0)) AS is_cancelled,
              max(s.end_date) AS last_end
            FROM postgres.subscriptions s
            JOIN postgres.users u ON toString(u.id) = toString(s.user_id)
            WHERE s.plan LIKE '%pro%'
              AND u.email NOT LIKE '%@nextraise.ai'
              AND u.email NOT LIKE '%@creditdharma.in'
              AND lower(u.email) NOT LIKE '%test%'${bucketEmailFilter(view, 'u.email')}
            GROUP BY uid
          )`, 'nr-overview:pgSubscribers')
      .catch((e) => { if (e instanceof PostHogBudgetError) throw e; return { results: [] }; }),
    // Today snapshot: payments / distinct payers / revenue for today + yesterday
    // (IST), independent of the selected range. Tiny postgres read.
    runHogQL(`
          SELECT toString(toDate(toTimeZone(created_at,'Asia/Kolkata'))) AS day,
            count() AS cnt,
            uniqExact(user_email) AS payers,
            sumIf(amount, currency='INR') AS inr,
            sumIf(amount, currency='USD') AS usd
          FROM postgres.payments
          WHERE status='completed'
            AND created_at >= toDateTime('${gdrBounds('yest').startDate} 00:00:00')
            AND created_at <  toDateTime('${gdrBounds('today').endDate} 00:00:00')
            AND user_email NOT LIKE '%@nextraise.ai'
            AND user_email NOT LIKE '%@creditdharma.in'
            AND lower(user_email) NOT LIKE '%test%'${bucketEmailFilter(view, 'user_email')}
          GROUP BY day ORDER BY day LIMIT 3`, 'nr-overview:todayPay')
      .catch((e) => { if (e instanceof PostHogBudgetError) throw e; return { results: [] }; }),
    // Signed up + paid within the SAME selected window (plus the previous
    // equal-length window for the delta). Event-filtered scan — cheap.
    runHogQL(`
          SELECT
            uniqIf(person_id, su_cur=1 AND pay_cur=1) AS cur,
            uniqIf(person_id, su_prev=1 AND pay_prev=1) AS prev,
            uniqIf(person_id, su_prev=1) AS su_prev_uniq,
            uniqIf(person_id, pay_prev=1) AS payers_prev
          FROM (
            SELECT person_id,
              maxIf(1, event='signup_complete'    AND d >= toDate('${rangeStart}') AND d < toDate('${rangeEnd}')) AS su_cur,
              maxIf(1, event='payment_completed'  AND d >= toDate('${rangeStart}') AND d < toDate('${rangeEnd}')) AS pay_cur,
              maxIf(1, event='signup_complete'    AND d >= toDate('${_swPrevStart}') AND d < toDate('${rangeStart}')) AS su_prev,
              maxIf(1, event='payment_completed'  AND d >= toDate('${_swPrevStart}') AND d < toDate('${rangeStart}')) AS pay_prev
            FROM (
              SELECT person_id, event, toDate(toTimeZone(timestamp,'Asia/Kolkata')) AS d
              FROM events
              WHERE event IN ('signup_complete','payment_completed')
                AND timestamp >= toDateTime('${_swPrevStart} 00:00:00') - INTERVAL 1 DAY
                AND person_id NOT IN COHORT 278743
                AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
                AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
                AND lower(coalesce(person.properties.email,'')) NOT LIKE '%test%'${bucketPersonFilter(view)}
            ) GROUP BY person_id
          )`, 'nr-overview:sameWin')
      .catch((e) => { if (e instanceof PostHogBudgetError) throw e; return { results: [] }; }),
  ]);

  const revRow = (revenue.results || [])[0] || [0, 0];
  const pgSubRow = (pgSubscribers.results || [])[0] || [];

  // Derive counts / sources / influencers from the consolidated acquire rows.
  const acqRows = acquire.results || [];
  const NUMS = 27;                       // 13 fixed + 14 preset columns, from index 5
  const rawCounts = new Array(NUMS).fill(0);
  const srcMap = new Map();              // 'source|medium' -> [source, medium, c, conv]
  const infMap = new Map();              // campaign -> [campaign, c, conv]
  for (const r of acqRows) {
    const [source, medium, campaignI, cRange, convRange] = r;
    for (let i = 0; i < NUMS; i++) rawCounts[i] += +r[5 + i] || 0;
    if (+cRange > 0) {
      const sk = source + '|' + medium;
      const sRow = srcMap.get(sk) || [source, medium, 0, 0];
      sRow[2] += +cRange; sRow[3] += +convRange || 0;
      srcMap.set(sk, sRow);
      if (campaignI) {
        const iRow = infMap.get(campaignI) || [campaignI, 0, 0];
        iRow[1] += +cRange; iRow[2] += +convRange || 0;
        infMap.set(campaignI, iRow);
      }
    }
  }
  const sourcesRows = [...srcMap.values()].sort((a, b) => b[2] - a[2]).slice(0, 100);
  const influencerRows = [...infMap.values()].sort((a, b) => b[1] - a[1]).slice(0, 40);

  // Pro tiles come from postgres.subscriptions and nowhere else. If that query
  // could not run we do NOT fall back to the persons-property counts — that is a
  // different, lagging definition, and it is where a second "active Pro" figure
  // came from. Zero the slots and ship subsOk:false so the UI renders a dash.
  const mergedCounts = [...rawCounts];
  if (pgSubRow.length) {
    mergedCounts[7]  = +pgSubRow[0] || 0;   // active Pro, distinct users
    mergedCounts[8]  = +pgSubRow[1] || 0;   // lapsed in the last 30 days (slot was the dead active_basic)
    mergedCounts[11] = +pgSubRow[2] || 0;   // expired or cancelled Pro, no active sub
    mergedCounts[12] = +pgSubRow[1] || 0;   // lapsed_30d — feeds the 30-day churn KPI
  } else {
    mergedCounts[7] = 0; mergedCounts[8] = 0; mergedCounts[11] = 0; mergedCounts[12] = 0;
  }
  return {
    counts:      mergedCounts,
    subsOk:      pgSubRow.length > 0,                             // false → Pro figures render a dash
    proCancelled: pgSubRow.length ? (+pgSubRow[3] || 0) : null,   // subset of counts[11]
    signups:     signups.results  || [],
    payments:    payments.results || [],
    revInr:      Number(revRow[0] || 0),
    revUsd:      Number(revRow[1] || 0),
    revPayers:    Number(revRow[2] || 0),   // distinct paying users in range (ARPU denominator)
    revInrPayers: Number(revRow[3] || 0),
    revUsdPayers: Number(revRow[4] || 0),
    sources:     sourcesRows,
    growth:      growth.results || [],
    // Prior-window signup total, prior window = same length immediately before
    // the selected range, IST. Piggy-backed on the sameWin scan (which already
    // aggregates signups across both windows) so this costs zero extra reads.
    prevSignups: _hasPrev ? (Number(((sameWin.results || [])[0] || [])[2]) || 0) : null,
    dailyPay:    dailyPay.results    || [],
    todayPay:    todayPay.results   || [],   // [day, cnt, payers, inr, usd] for yest+today (IST)
    sameWin:     (sameWin.results || [])[0] || null,   // [cur, prev, prevSignupsUniq, payers_prev]
    influencers: influencerRows,
    convByPeriod: CONV_PRESETS.map((p, i) => {
      const s = +mergedCounts[13 + i * 2] || 0, pr = +mergedCounts[13 + i * 2 + 1] || 0;
      return { key: p.key, label: p.label, signups: s, pro: pr, rate: s ? pr / s * 100 : 0 };
    }),
    stale: state.usedStale || undefined,
  };
}

module.exports = {
  computeOverview, gdrBounds, GDR_PRESETS, PostHogBudgetError, PostHogQueryError,
  // Shared internals for lib/screens.js. Exported so every server-computed screen
  // reuses the SAME runner (concurrency gate, retry policy, budget circuit breaker)
  // and the SAME bucket engine. Never copy these into another file: the attribution
  // buckets have to stay byte-identical across screens or Overview and Report will
  // quietly disagree about who is an influencer signup.
  makeRunner, bucketExprSQL, bucketPersonSet, bucketPersonFilter, bucketEmailFilter,
  PERSONS_SUB, INTERNAL_EMAIL, BUCKET_KW_CAMPAIGN,
};
