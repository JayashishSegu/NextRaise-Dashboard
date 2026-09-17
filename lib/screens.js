// Server-side compute for the heavy screens: report / daily / insights.
//
// Same deal as lib/overview.js: the browser stops firing HogQL and reads one
// edge-cached JSON instead. Everything shared (the HTTP runner with its
// concurrency gate, retry policy and budget circuit breaker, the persons
// projection, the attribution bucket engine) is IMPORTED from lib/overview.js
// rather than copied, so the buckets cannot drift between screens.
//
// BUDGET (PostHog 20 GB/hour API read budget, HTTP 429
// api_queries_budget_exceeded). Three things make this a net reduction, not an
// addition:
//   1. Every query that read person.properties.* per event is gone. Those
//      columns are the huge person_properties blob; reading them across a wide
//      events scan is the pattern that took this project down. Person-level
//      attributes now come from one `persons` scan joined to a small,
//      event-name-filtered events scan, exactly as lib/overview.js does.
//   2. Every remaining events scan is event-name filtered (sort-key pruned) and
//      time-bounded. The insights funnel in particular dropped from an
//      unfiltered 400-day scan to "events at or after the cohort's start date,
//      five event names only".
//   3. The result is edge-cached (s-maxage 1800 + stale-while-revalidate
//      86400). Today each of these screens re-queries per browser, per tab
//      visit. After this, one combo recomputes at most ~2x/hour no matter how
//      many people are looking.
// Do NOT add these screens to WARM_COMBOS in api/cron.js. Warming is a fixed
// hourly cost per combo; these warm on first real visit and then ride the edge.

const {
  gdrBounds,
  makeRunner,
  PERSONS_SUB,
  INTERNAL_EMAIL,
  bucketPersonFilter,
  bucketEmailFilter,
} = require('./overview');

const SCREENS = ['report', 'daily', 'insights'];

// SYNC: these two exclusions mirror `_EXCL` / `PW` in index.html and the inline
// exclusions in lib/overview.js. If one moves, move all three. The persons-side
// form coalesces a missing email to '' (so a person with no email is KEPT),
// where index.html's person.properties.email NOT ILIKE form drops it. Verified
// equal on the last 7 days: 9511 signups either way, because every
// signup_complete person carries an email. Recheck if that ever stops holding.
const NOT_INTERNAL = `NOT (${INTERNAL_EMAIL}) AND lower(email) NOT LIKE '%test%'`;
// postgres.payments is email-keyed and has no persons join; same exclusion,
// verbatim from the client so the numbers do not move.
const PAY_EXCL = `user_email NOT LIKE '%@nextraise.ai' AND user_email NOT LIKE '%@creditdharma.in' AND lower(user_email) NOT LIKE '%test%'`;

const wantBucket = view => (view === 'perf' ? 'perf' : 'infl');

// Optional queries swallow non-budget failures the same way lib/overview.js and
// the old client code did, so one missing warehouse table or one slow scan
// never blanks the whole screen.
function passBudget(e) {
  if (e && (e.name === 'PostHogBudgetError' || e.code === 'budget')) throw e;
  return { results: [] };
}

// Payments in [start,end) tagged with the attribution bucket of the paying
// email. Two persons scans replace what used to be TWO UNFILTERED, UNBOUNDED
// `FROM events` scans reading person.properties.email (the compare panel's
// email set): that query had no event filter and no time filter at all.
//
// The multiIf branches MUST stay mutually exclusive. Report's Overall totals are
// the sum of the per-bucket rows, and uniqExact(payers) only sums exactly
// because each email lands in exactly one branch. Do not add an overlapping
// branch here without changing computeReport's summation.
function paymentsTagged(startD, endD) {
  const emails = b => `SELECT email FROM (${PERSONS_SUB}) WHERE bkt='${b}' AND email!=''`;
  return `
      SELECT user_email, amount, currency, created_at,
        multiIf(
          user_email IN (${emails('infl')}), 'infl',
          user_email IN (${emails('perf')}), 'perf',
          'other') AS bkt
      FROM postgres.payments
      WHERE status='completed'
        AND created_at >= toDateTime('${startD} 00:00:00')
        AND created_at <  toDateTime('${endD} 00:00:00')
        AND ${PAY_EXCL}`;
}

// -- report -------------------------------------------------------------------
async function computeReport(runHogQL, bounds, view) {
  const startD = bounds.startDate, endD = bounds.endDate;
  const tsStart = `toDateTime('${startD} 00:00:00')`;
  const tsEnd = `toDateTime('${endD} 00:00:00')`;
  const want = wantBucket(view);
  const tagged = paymentsTagged(startD, endD);

  const [suR, creatorsR, payR, dayPayR, googleR, metaR] = await Promise.all([
    // Signups per (IST day, bucket). ONE query now answers four things the
    // client used to ask for separately: the hero signups number, the daily
    // signups trend, and the influencer/perf signup totals for the compare
    // panel. Narrowed: the client read person.properties.email per event to
    // exclude internals and ran a second events scan per compare bucket.
    runHogQL(`
      SELECT toString(su) AS d, bkt, count() AS n
      FROM (
        SELECT s.person_id AS person_id, s.su AS su, p.bkt AS bkt
        FROM (
          SELECT person_id, min(toDate(toTimeZone(timestamp,'Asia/Kolkata'))) AS su
          FROM events
          WHERE event='signup_complete'
            AND timestamp >= ${tsStart} AND timestamp < ${tsEnd}
            AND person_id NOT IN COHORT 278743
          GROUP BY person_id
        ) s
        JOIN (${PERSONS_SUB}) p ON p.id = s.person_id
        WHERE ${NOT_INTERNAL}
      )
      GROUP BY d, bkt ORDER BY d LIMIT 2000`, 'nr-screen:report:signups')
      .catch(e => passBudget(e)),
    // Per-creator signups + sales, influencer bucket only (unchanged scope).
    // Narrowed hard: the client's version had NO event-name filter (it scanned
    // every event in the range) and took the creator code from an argMaxIf over
    // person.properties.$initial_utm_campaign. Only two event names are actually
    // used, and $initial_utm_campaign is an immutable first-touch person
    // property, so it comes from the persons scan for the same value.
    runHogQL(`
      SELECT code, count() AS signups, countIf(paid=1) AS sales
      FROM (
        SELECT f.person_id AS person_id, f.signed AS signed, f.paid AS paid, p.campaign AS code
        FROM (
          SELECT person_id,
            max(event='signup_complete')   AS signed,
            max(event='payment_completed') AS paid
          FROM events
          WHERE event IN ('signup_complete','payment_completed')
            AND timestamp >= ${tsStart} AND timestamp < ${tsEnd}
            AND person_id NOT IN COHORT 278743
          GROUP BY person_id
        ) f
        JOIN (${PERSONS_SUB}) p ON p.id = f.person_id
        WHERE ${NOT_INTERNAL} AND p.bkt='infl'
      )
      WHERE code != '' AND signed = 1
      GROUP BY code ORDER BY signups DESC LIMIT 100`, 'nr-screen:report:creators')
      .catch(e => passBudget(e)),
    // Range totals per bucket. Each email maps to exactly one bucket, so the
    // Overall totals are the sum across rows and uniqExact(payers) sums exactly.
    runHogQL(`
      SELECT bkt, count() AS sales, uniqExact(user_email) AS payers,
        ifNull(sumIf(amount, currency='INR'),0) AS inr,
        ifNull(sumIf(amount, currency='USD'),0) AS usd
      FROM (${tagged})
      GROUP BY bkt LIMIT 10`, 'nr-screen:report:sales')
      .catch(e => passBudget(e)),
    // Daily revenue trend, split by bucket. Returns INR and USD SEPARATELY:
    // the USD to INR rate is a client concern (index.html fetches a live rate)
    // and the server must not bake a fourth rate into the data.
    runHogQL(`
      SELECT toString(toDate(toTimeZone(created_at,'Asia/Kolkata'))) AS d, bkt,
        ifNull(sumIf(amount, currency='INR'),0) AS inr,
        ifNull(sumIf(amount, currency='USD'),0) AS usd
      FROM (${tagged})
      GROUP BY d, bkt ORDER BY d LIMIT 2000`, 'nr-screen:report:dailyRev')
      .catch(e => passBudget(e)),
    // Ad-platform tables: already cheap warehouse reads, ported verbatim.
    runHogQL(`
      SELECT toString(campaign_id) AS cid, round(sum(metrics_cost_micros)/1e6) AS spend,
        sum(metrics_impressions) AS impr, sum(metrics_clicks) AS clicks
      FROM googleads_campaign_stats
      WHERE segments_date >= '${startD}' AND segments_date < '${endD}'
      GROUP BY cid LIMIT 500`, 'nr-screen:report:google')
      .catch(e => passBudget(e)),
    runHogQL(`
      SELECT round(sum(toFloat64OrNull(spend))) AS spend,
        round(sum(toFloat64OrNull(impressions))) AS impr,
        round(sum(toFloat64OrNull(clicks))) AS clicks
      FROM metaads_ad_stats
      WHERE date_start >= '${startD}' AND date_start < '${endD}'`, 'nr-screen:report:meta')
      .catch(e => passBudget(e)),
  ]);

  const inView = bkt => view === 'overall' || bkt === want;

  // Signups: total for the active view + daily trend + per-bucket totals.
  let signups = 0;
  const trendMap = new Map();
  const suByBkt = { infl: 0, perf: 0 };
  for (const [d, bkt, n] of (suR.results || [])) {
    const v = +n || 0;
    if (bkt === 'infl' || bkt === 'perf') suByBkt[bkt] += v;
    if (!inView(bkt)) continue;
    signups += v;
    trendMap.set(d, (trendMap.get(d) || 0) + v);
  }

  // Payments: totals for the active view + per-bucket totals.
  let sales = 0, payers = 0, inr = 0, usd = 0;
  const payByBkt = { infl: [0, 0, 0], perf: [0, 0, 0] };   // sales, inr, usd
  for (const [bkt, c, pyr, i, u] of (payR.results || [])) {
    if (payByBkt[bkt]) { payByBkt[bkt][0] += +c || 0; payByBkt[bkt][1] += +i || 0; payByBkt[bkt][2] += +u || 0; }
    if (!inView(bkt)) continue;
    sales += +c || 0; payers += +pyr || 0; inr += +i || 0; usd += +u || 0;
  }

  const revMap = new Map();
  for (const [d, bkt, i, u] of (dayPayR.results || [])) {
    if (!inView(bkt)) continue;
    const row = revMap.get(d) || [0, 0];
    row[0] += +i || 0; row[1] += +u || 0;
    revMap.set(d, row);
  }

  const metaRow = (metaR.results || [])[0] || [0, 0, 0];
  return {
    startD, endD,
    signups, sales, payers, inr, usd,
    google: (googleR.results || []).map(r => ({ cid: r[0], spend: +r[1] || 0, impr: +r[2] || 0, clicks: +r[3] || 0 })),
    meta: { spend: +metaRow[0] || 0, impr: +metaRow[1] || 0, clicks: +metaRow[2] || 0 },
    creators: (creatorsR.results || []).map(r => ({ code: r[0], signups: +r[1] || 0, sales: +r[2] || 0 })),
    trend: {
      signups: [...trendMap.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1),
      // [day, inr, usd] -- the client applies its own USD_TO_INR.
      revenueParts: [...revMap.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([d, v]) => [d, v[0], v[1]]),
    },
    // Compare panel is Overall-only on the client; skip the payload otherwise.
    bucket: view !== 'overall' ? null : {
      influencer: { signups: suByBkt.infl, sales: payByBkt.infl[0], inr: payByBkt.infl[1], usd: payByBkt.infl[2] },
      perf:       { signups: suByBkt.perf, sales: payByBkt.perf[0], inr: payByBkt.perf[1], usd: payByBkt.perf[2] },
    },
  };
}

// -- daily (rolling 30 days, range selector is ignored) -----------------------
async function computeDaily(runHogQL, view) {
  const [evR, payR] = await Promise.all([
    // Narrowed two ways vs the client query: the internal-email exclusion moved
    // off person.properties onto one persons scan, and a raw `timestamp` bound
    // was added so ClickHouse can prune on the sort key (the existing
    // toDate(toTimeZone(...)) predicate cannot). 32 days covers the 30-day
    // window plus the IST offset, so the numbers are unchanged.
    runHogQL(`
      SELECT toString(toDate(toTimeZone(timestamp,'Asia/Kolkata'))) AS d,
        uniqIf(person_id, event='signup_complete')     AS signups,
        uniqIf(person_id, event='onboarding_complete') AS activations
      FROM events
      WHERE event IN ('signup_complete','onboarding_complete')
        AND timestamp > now() - INTERVAL 32 DAY
        AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) >= toDate(toTimeZone(now(),'Asia/Kolkata')) - 30
        AND person_id NOT IN (SELECT id FROM (${PERSONS_SUB}) WHERE (${INTERNAL_EMAIL}) OR lower(email) LIKE '%test%')
        ${bucketPersonFilter(view)}
      GROUP BY d ORDER BY d LIMIT 40`, 'nr-screen:daily:events'),
    // Ported verbatim except that INR and USD come back separately instead of
    // being combined in SQL with the browser's USD_TO_INR.
    runHogQL(`
      SELECT toString(toDate(toTimeZone(created_at,'Asia/Kolkata'))) AS d,
        ifNull(sumIf(amount, currency='INR'),0) AS inr,
        ifNull(sumIf(amount, currency='USD'),0) AS usd,
        count() AS pays
      FROM postgres.payments
      WHERE status='completed' AND created_at > now() - INTERVAL 31 DAY
        AND ${PAY_EXCL}${bucketEmailFilter(view, 'user_email')}
      GROUP BY d ORDER BY d LIMIT 40`, 'nr-screen:daily:pay')
      .catch(e => passBudget(e)),
  ]);
  return { ev: evR.results || [], pay: payR.results || [] };
}

// -- insights (ordered signup funnel) -----------------------------------------
async function computeInsights(runHogQL, bounds, view) {
  const startD = bounds.startDate, endD = bounds.endDate;
  const bktWhere = view === 'overall' ? '' : ` AND p.bkt='${wantBucket(view)}'`;
  // This was the single most expensive query in the app: an UNFILTERED 400-day
  // `FROM events` scan that read person.properties.email three times per event
  // AND ran three argMaxIf aggregations over person.properties for the bucket.
  // Narrowed to (a) the five event names windowFunnel actually consumes, (b)
  // events from one day before the cohort's own start date (steps must FOLLOW
  // the signup; the one-day pad is there so a project timezone that is not IST
  // cannot clip the first hours of the window), and (c) one persons join for
  // email + bucket instead of any person.properties read.
  const res = await runHogQL(`
      SELECT
        countIf(level>=1) AS signed,
        countIf(level>=2) AS onb_start,
        countIf(level>=3) AS onb_done,
        countIf(level>=4) AS resume_up,
        sum(paid_flag)    AS paid
      FROM (
        SELECT f.person_id AS person_id, f.level AS level, f.paid_flag AS paid_flag
        FROM (
          SELECT person_id,
            windowFunnel(1209600)(toDateTime(timestamp),
              event='signup_complete',
              event='onboarding_start',
              event='onboarding_complete',
              event='resume_upload') AS level,
            max(event='payment_completed') AS paid_flag
          FROM events
          WHERE event IN ('signup_complete','onboarding_start','onboarding_complete','resume_upload','payment_completed')
            AND timestamp >= toDateTime('${startD} 00:00:00') - INTERVAL 1 DAY
            AND person_id IN (
              SELECT person_id FROM events
              WHERE event='signup_complete'
                AND timestamp >= toDateTime('${startD} 00:00:00') - INTERVAL 1 DAY
                AND timestamp <  toDateTime('${endD} 00:00:00') + INTERVAL 1 DAY
                AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) >= toDate('${startD}')
                AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) <  toDate('${endD}')
            )
          GROUP BY person_id
        ) f
        JOIN (${PERSONS_SUB}) p ON p.id = f.person_id
        WHERE ${NOT_INTERNAL}${bktWhere}
      )`, 'nr-screen:insights:funnel');
  const row = (res.results || [])[0] || [0, 0, 0, 0, 0];
  return { funnel: row.map(v => +v || 0) };
}

async function computeScreen(name, range, env, cust, view) {
  if (!SCREENS.includes(name)) throw new Error(`unknown screen: ${name}`);
  view = ['overall', 'influencer', 'perf'].includes(view) ? view : 'overall';
  const state = { budgetHit: null, usedStale: false };
  const runHogQL = makeRunner(env, state);

  let data;
  if (name === 'report')        data = await computeReport(runHogQL, gdrBounds(range, cust), view);
  else if (name === 'daily')    data = await computeDaily(runHogQL, view);
  else                          data = await computeInsights(runHogQL, gdrBounds(range, cust), view);

  if (state.usedStale) data.stale = true;
  return data;
}

module.exports = { computeScreen, SCREENS };
