// Cron warmer - invoked on a schedule by Vercel (see vercel.json `crons`) and by
// the GitHub Action in Jayashish01/nextraise-cron (~every 10 min).
//
// REWRITTEN alongside the snapshot store.
//
// The old warmer pushed exactly two combos into the edge cache and every other
// combo paid the full ~9.1s compute on its first human visit. Now that
// /api/overview always answers from the last snapshot, warming is no longer about
// first-hit latency for everything - it is about (a) filling the brand-new window
// that every rolling range gets at IST midnight and (b) keeping the combos a
// human actually watches reasonably fresh.
//
// This tick is DECLARATIVE and idempotent: each combo carries a maxAgeMin, the
// cron asks the store which snapshots are older than that, and warms the worst
// offenders in priority order, up to PER_TICK and only while the hourly compute
// counter has room. That makes it safe at any tick rate - every 10 min, every 15
// min or once a day - because the table, not the schedule, sets the load.
//
// -- PostHog read budget arithmetic --------------------------------------------
// Computes are the only thing that reads PostHog bytes; serving snapshots reads
// none. Steady-state computes per hour = sum(60 / maxAgeMin) over this table:
//   today/overall       60m -> 1.000     7d/overall          60m -> 1.000
//   today/influencer   360m -> 0.167     7d/influencer      360m -> 0.167
//   today/perf         360m -> 0.167     7d/perf            360m -> 0.167
//   yest/overall       360m -> 0.167     14d/overall        360m -> 0.167
//   thisMonth/overall  720m -> 0.083     all + lastMonth /overall 1440m -> 0.083
//   remaining 10 combos      1440m -> 0.417
//   ---------------------------------------------------------------------------
//   TOTAL = 3.58 computes/hour across ALL 21 combos.
//
// Compare with today: the old warmer keeps 2 combos alive at up to 2 edge
// revalidations/hour each (s-maxage 1800) = 4.0 computes/hour, PLUS one uncapped
// compute for every cold combo a human opens, across 19 combos, per edge region,
// with no ceiling at all. So this table is a REDUCTION in steady-state PostHog
// reads (3.58 vs 4.0) while covering 21 combos instead of 2, and
// snapstore.reserveCompute() adds a hard ceiling where today there is none.
//
// To size the cap against the real 20 GB/hour allowance: read the bytes one combo
// costs from PostHog's project query log (the per-query "read" figure) and set
// OV_MAX_COMPUTES_PER_HOUR = floor(0.5 * 20GB / bytes_per_combo). Half the
// budget, because the Report / Creators / Daily / Insights / Acquire / Activate /
// Retention / Referrals / Monetization / Pro Users / Search screens still query
// PostHog directly from the browser and need the other half. Do not guess that
// number - measure it.
const { gdrBounds } = require('../lib/overview');
const snapstore = require('../lib/snapstore');

// prio: lower runs first when several are stale at once (IST midnight, when
// every rolling window is brand new).
const WARM_TABLE = [
  { range: 'today',     view: 'overall',    maxAgeMin:   60, prio: 0 },
  { range: '7d',        view: 'overall',    maxAgeMin:   60, prio: 0 },
  { range: 'today',     view: 'influencer', maxAgeMin:  360, prio: 1 },
  { range: '7d',        view: 'influencer', maxAgeMin:  360, prio: 1 },
  { range: 'today',     view: 'perf',       maxAgeMin:  360, prio: 1 },
  { range: '7d',        view: 'perf',       maxAgeMin:  360, prio: 1 },
  { range: 'yest',      view: 'overall',    maxAgeMin:  360, prio: 2 },
  { range: '14d',       view: 'overall',    maxAgeMin:  360, prio: 2 },
  { range: 'thisMonth', view: 'overall',    maxAgeMin:  720, prio: 2 },
  { range: 'all',       view: 'overall',    maxAgeMin: 1440, prio: 3 },
  { range: 'lastMonth', view: 'overall',    maxAgeMin: 1440, prio: 3 },
  { range: 'yest',      view: 'influencer', maxAgeMin: 1440, prio: 4 },
  { range: 'yest',      view: 'perf',       maxAgeMin: 1440, prio: 4 },
  { range: '14d',       view: 'influencer', maxAgeMin: 1440, prio: 4 },
  { range: '14d',       view: 'perf',       maxAgeMin: 1440, prio: 4 },
  { range: 'thisMonth', view: 'influencer', maxAgeMin: 1440, prio: 5 },
  { range: 'thisMonth', view: 'perf',       maxAgeMin: 1440, prio: 5 },
  { range: 'all',       view: 'influencer', maxAgeMin: 1440, prio: 5 },
  { range: 'all',       view: 'perf',       maxAgeMin: 1440, prio: 5 },
  { range: 'lastMonth', view: 'influencer', maxAgeMin: 1440, prio: 6 },
  { range: 'lastMonth', view: 'perf',       maxAgeMin: 1440, prio: 6 },
];

const PER_TICK = Math.max(1, +(process.env.OV_WARM_PER_TICK || 3));
const MAX_COMPUTES_PER_HOUR = Math.max(1, +(process.env.OV_MAX_COMPUTES_PER_HOUR || 8));
const CRON_RESERVE = Math.max(1, +(process.env.OV_CRON_RESERVE || 2));
// maxDuration for this function is 60s and one compute measured ~9.1s, with
// ClickHouse's own ceiling nearer 60s. Stop STARTING new ones past 25s so even a
// pathological last compute still lets the tick return a clean report.
const TICK_DEADLINE_MS = 25 * 1000;

// Must be the PUBLIC alias - the per-deploy *.vercel.app host has Deployment
// Protection (302), so fetching VERCEL_URL would never reach the function.
const DEFAULT_BASE = 'https://nextraise-dashboard-blue.vercel.app';
// x-nr-warm marks this as the cron (held below the ceiling by CRON_RESERVE);
// x-nr-bg makes /api/overview return immediately instead of waiting on a lock;
// x-warm is kept for anything still sending the old header name.
const WARM_HEADERS = { 'x-nr-warm': '1', 'x-warm': '1', 'x-nr-bg': '1' };

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  // Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.PH_API_KEY) {
    return res.status(503).json({ error: 'PH_API_KEY not configured' });
  }

  const env = process.env;
  const base = (process.env.PUBLIC_BASE || DEFAULT_BASE).replace(/\/+$/, '');
  res.setHeader('Cache-Control', 'no-store');

  // No store configured -> there is nothing to keep warm and no counter to obey.
  // Fall back to the old behaviour: refresh the two most-opened combos through
  // the edge cache, exactly as this file did before.
  if (!snapstore.enabled(env)) {
    const results = [];
    for (const c of [{ range: '7d', view: 'overall' }, { range: 'today', view: 'overall' }]) {
      const s = Date.now();
      try {
        const r = await fetch(`${base}/api/overview?range=${c.range}&view=${c.view}`, { headers: WARM_HEADERS });
        results.push({ range: c.range, view: c.view, status: r.status, ms: Date.now() - s });
        if (r.status === 429) break;
      } catch (e) {
        results.push({ range: c.range, view: c.view, error: String((e && e.message) || e), ms: Date.now() - s });
      }
    }
    return res.status(200).json({ store: false, warmed: results, at: new Date().toISOString() });
  }

  // Which snapshots are past their maxAge (or have never been computed for the
  // current IST window)? One small pipeline, no payloads pulled.
  const keys = WARM_TABLE.map(c => snapstore.snapKey(c.view, c.range, gdrBounds(c.range)));
  const ats = await snapstore.getComputedAts(env, keys);
  const now = Date.now();
  const stale = WARM_TABLE
    .map((c, i) => ({
      range: c.range, view: c.view, maxAgeMin: c.maxAgeMin, prio: c.prio,
      key: keys[i], at: ats[i], ageMin: ats[i] ? (now - ats[i]) / 60000 : Infinity,
    }))
    .filter(c => c.ageMin > c.maxAgeMin)
    // Priority first, then whatever is furthest past its own deadline.
    .sort((a, b) => a.prio - b.prio || (b.ageMin / b.maxAgeMin) - (a.ageMin / a.maxAgeMin));

  const usedThisHour = await snapstore.computesThisHour(env);
  const cronCeiling = MAX_COMPUTES_PER_HOUR - CRON_RESERVE;
  const room = (usedThisHour === null) ? PER_TICK : Math.max(0, cronCeiling - usedThisHour);
  const todo = stale.slice(0, Math.min(PER_TICK, room));

  const warmed = [];
  for (const c of todo) {
    if (Date.now() - t0 > TICK_DEADLINE_MS) {
      warmed.push({ range: c.range, view: c.view, skipped: 'tick deadline' });
      break;
    }
    const s = Date.now();
    try {
      const r = await fetch(`${base}/api/overview?range=${c.range}&view=${c.view}&refresh=1`, { headers: WARM_HEADERS });
      warmed.push({
        range: c.range, view: c.view, status: r.status,
        // null, not a made-up number, when this window has never been computed.
        ageMin: (c.ageMin === Infinity ? null : Math.round(c.ageMin)),
        ms: Date.now() - s,
      });
      // 429 = PostHog budget exhausted. More warms only deepen the deficit.
      if (r.status === 429) break;
    } catch (e) {
      warmed.push({ range: c.range, view: c.view, error: String((e && e.message) || e), ms: Date.now() - s });
    }
  }

  return res.status(200).json({
    store: true,
    computesThisHour: usedThisHour,
    cronCeiling,
    staleCombos: stale.length,
    warmed,
    ms: Date.now() - t0,
    at: new Date().toISOString(),
  });
};
