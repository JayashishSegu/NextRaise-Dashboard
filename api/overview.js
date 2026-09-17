// GET /api/overview?range=today|yest|7d|14d|thisMonth|lastMonth|all|custom
//                  &view=overall|influencer|perf
//
// REWRITTEN: nobody waits on a cold compute.
//
// Before: every combo the cron did not warm paid the full ClickHouse compute
// (~9.1s measured) on its first hit, per edge region, and there are 7 ranges x 3
// views = 21 combos. Changing range or bucket therefore cost ~9s over and over.
//
// Now: each computed combo is persisted to a durable store (lib/snapstore.js)
// keyed by (view, range, IST window). A request reads that snapshot and answers
// without touching ClickHouse; if the snapshot is older than FRESH_MS the
// recompute happens in a SEPARATE background invocation behind a single-flight
// lock, so ten simultaneous readers cause exactly one compute. The response
// always carries computedAt / ageSec.
//
// PostHog read budget: computes are the only thing that reads bytes, and they are
// hard-capped per clock hour by snapstore.reserveCompute(). Request volume no
// longer drives PostHog reads at all - a million reads of a warm combo cost zero
// PostHog bytes. See api/cron.js for the warm-list arithmetic.
//
// If the store is not configured, every snapstore call returns null and this
// handler degrades to exactly the old behaviour: compute inline, edge-cache it.
const { computeOverview, gdrBounds, PostHogBudgetError } = require('../lib/overview');
const snapstore = require('../lib/snapstore');

// Serve a snapshot without recomputing while it is younger than this.
const FRESH_MS = 10 * 60 * 1000;
// Never serve a snapshot older than this: past a day and a half the numbers are
// not slightly stale, they are wrong. Compute instead.
const MAX_SERVE_MS = 36 * 60 * 60 * 1000;
const SNAP_TTL_SEC = 3 * 24 * 60 * 60;
const LOCK_TTL_SEC = 90;
// A reader that finds the lock held waits this long for the winner's snapshot
// rather than starting a second compute. Kept at 20s, not 38s: a compute takes
// ~9.1s, so 20s covers the normal case twice over, and if the lock holder dies
// the reader is not made to wait longer than the compute it replaced.
const WAIT_FOR_WINNER_MS = 20 * 1000;
// Even an explicit Refresh will not recompute something this young, so mashing
// the button cannot turn into repeat ClickHouse work.
const FORCE_MIN_AGE_MS = 60 * 1000;

// Hard ceiling on computes (= PostHog reads) per clock hour, across every combo
// and every caller. See the arithmetic in api/cron.js.
const MAX_COMPUTES_PER_HOUR = Math.max(1, +(process.env.OV_MAX_COMPUTES_PER_HOUR || 8));
// The cron stops this far below the ceiling so a human pressing Refresh always
// has room left.
const CRON_RESERVE = Math.max(1, +(process.env.OV_CRON_RESERVE || 2));

// Must be the PUBLIC alias - the per-deploy *.vercel.app host has Deployment
// Protection (302), so a background fetch to VERCEL_URL would never arrive.
const DEFAULT_BASE = 'https://nextraise-dashboard-blue.vercel.app';

function selfBase(req) {
  if (process.env.PUBLIC_BASE) return process.env.PUBLIC_BASE.replace(/\/+$/, '');
  const h = req.headers['x-forwarded-host'] || req.headers.host;
  return h ? 'https://' + h : DEFAULT_BASE;
}

// Fire the recompute in its own invocation and do NOT wait for it. We give the
// request ~150ms to leave the box, which is plenty for it to be sent; if it is
// ever lost, the cron picks the same combo up on its next tick, so the worst case
// is a slightly older snapshot, never a slow page.
function kickRefresh(req, qs) {
  try {
    const url = selfBase(req) + '/api/overview?' + qs + '&refresh=1';
    const p = fetch(url, { headers: { 'x-nr-bg': '1' }, cache: 'no-store' }).then(() => {}, () => {});
    return Promise.race([p, new Promise(r => setTimeout(r, 150))]);
  } catch (_) {
    return Promise.resolve();
  }
}

module.exports = async function handler(req, res) {
  const range = (req.query.range || '7d').toString();
  // Attribution view - stored and cached separately per bucket.
  const view = ['overall', 'influencer', 'perf'].includes((req.query.view || '').toString())
    ? req.query.view.toString() : 'overall';
  const cust = (req.query.from && req.query.to)
    ? { from: req.query.from.toString(), to: req.query.to.toString() } : null;

  // refresh=1 (cron / background) and the dashboard's Refresh button (fresh=)
  // both mean: skip the snapshot, compute now.
  const force  = !!(req.query.refresh || req.query.fresh);
  const isBg   = req.headers['x-nr-bg'] === '1';
  const isCron = req.headers['x-nr-warm'] === '1' || req.headers['x-warm'] === '1';

  if (!process.env.PH_API_KEY) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'PH_API_KEY not configured on the server yet' });
  }

  const env = process.env;
  const bounds = gdrBounds(range, cust);
  const key = snapstore.snapKey(view, range, bounds);
  const qs = 'range=' + encodeURIComponent(range) + '&view=' + view
    + (cust ? '&from=' + encodeURIComponent(cust.from) + '&to=' + encodeURIComponent(cust.to) : '');

  // Shape every 200 the same way. `ts` stays the field the dashboard already
  // reads, and it is the moment the numbers were COMPUTED.
  const send = (payload, extra) => {
    const age = Math.max(0, Date.now() - (payload.computedAt || Date.now()));
    // Snapshot reads are cheap (one small Redis GET), so the edge only needs to
    // absorb bursts, not hide a slow origin. 120s keeps the edge from pinning a
    // body the store has already replaced.
    res.setHeader('Cache-Control', (extra && extra.noStore)
      ? 'no-store'
      : 'public, max-age=0, s-maxage=120, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('x-nr-source', (extra && extra.source) || 'snapshot');
    res.setHeader('x-nr-age', String(Math.round(age / 1000)));
    return res.status(200).json(Object.assign({
      range, view,
      window: { start: bounds.startDate, end: bounds.endDate },
      ts: payload.computedAt,          // legacy field name, honest value
      computedAt: payload.computedAt,
      ageSec: Math.round(age / 1000),
      fresh: age < FRESH_MS,
      stale: !!payload.stale,          // PostHog served this from its own cache
      source: (extra && extra.source) || 'snapshot',
      data: payload.data,
    }, (extra && extra.flags) || {}));
  };

  // 200, not 429: the dashboard only recognises 429 with code 'budget', and any
  // other 429 would push it into its ~40-query client-side fallback path, which
  // is exactly what caused the api_queries_budget_exceeded outage.
  const sendComputing = (retryIn, why) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('x-nr-source', why);
    return res.status(200).json({ range, view, computing: true, retryIn, reason: why, data: null });
  };

  let snap = await snapstore.getSnapshot(env, key);
  if (snap && (Date.now() - snap.computedAt) > MAX_SERVE_MS) snap = null;
  const snapAge = snap ? (Date.now() - snap.computedAt) : Infinity;

  if (snap && !force) {
    // Answer first, refresh behind it. A background invocation does the work,
    // guarded by the same single-flight lock, so concurrent readers do not stack
    // up computes.
    if (snapAge > FRESH_MS && !isBg) await kickRefresh(req, qs);
    return send(snap, { source: 'snapshot' });
  }
  if (snap && force && snapAge <= FORCE_MIN_AGE_MS) {
    return send(snap, { source: 'snapshot-recent', noStore: true });
  }

  // Single-flight first, budget second. ok:false means the store did not answer
  // at all - then there is no winner to wait for and we just compute, exactly as
  // this endpoint did before the store existed.
  const lock = await snapstore.acquireLock(env, key, LOCK_TTL_SEC);
  const lockToken = lock.token;
  if (lock.ok && !lockToken) {
    // Somebody else is already computing this exact combo. Background and cron
    // callers return immediately - a cron tick must never spend its 60s budget
    // waiting on a lock it does not need.
    if (isBg || isCron) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ skipped: 'locked', range, view });
    }
    const since = snap ? snap.computedAt : 0;
    const winner = await snapstore.waitForNewer(env, key, since, WAIT_FOR_WINNER_MS, 700);
    if (winner) return send(winner, { source: 'snapshot-waited', noStore: force });
    if (snap) return send(snap, { source: 'snapshot-stale', noStore: force });
    return sendComputing(8, 'locked');
  }

  try {
    const used = await snapstore.reserveCompute(env);   // null = no store, uncapped
    const cap = isCron ? (MAX_COMPUTES_PER_HOUR - CRON_RESERVE) : MAX_COMPUTES_PER_HOUR;
    if (used !== null && used > cap) {
      // The hourly PostHog read allowance for this dashboard is spent. Serving a
      // slightly older snapshot is always better than risking a 429 that takes
      // every screen down.
      if (snap) return send(snap, { source: 'snapshot-capped', noStore: force, flags: { capped: true } });
      const older = await snapstore.getSnapshot(env, key);
      if (older) return send(older, { source: 'snapshot-capped', noStore: force, flags: { capped: true } });
      return sendComputing(600, 'compute-capped');
    }

    const data = await computeOverview(range, env, cust, view);
    const payload = {
      v: 1, computedAt: Date.now(), range, view,
      window: { start: bounds.startDate, end: bounds.endDate },
      stale: !!data.stale, data,
    };
    await snapstore.putSnapshot(env, key, payload, SNAP_TTL_SEC);
    if (isBg || isCron) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ refreshed: true, range, view, computedAt: payload.computedAt });
    }
    return send(payload, { source: 'compute', noStore: force });
  } catch (e) {
    const budget = (e instanceof PostHogBudgetError) || e.code === 'budget';
    // A failed recompute must never blank a screen that has good numbers.
    const fallback = snap || await snapstore.getSnapshot(env, key);
    if (fallback && (Date.now() - fallback.computedAt) <= MAX_SERVE_MS) {
      return send(fallback, {
        source: budget ? 'snapshot-budget' : 'snapshot-error',
        noStore: true,
        flags: { refreshFailed: String((e && e.message) || e).slice(0, 300), budget: budget || undefined },
      });
    }
    res.setHeader('Cache-Control', 'no-store');
    if (budget) {
      res.setHeader('Retry-After', String(e.retryAfter || 900));
      return res.status(429).json({
        error: 'PostHog hourly API read budget exhausted',
        code: 'budget', retryAfter: e.retryAfter || 900, range, view,
      });
    }
    return res.status(500).json({ error: String((e && e.message) || e) });
  } finally {
    if (lockToken) await snapstore.releaseLock(env, key, lockToken);
  }
};
