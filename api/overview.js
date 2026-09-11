// GET /api/overview?range=today|yest|7d|14d|thisMonth|lastMonth|all|custom
// Computes the overview server-side (PostHog key stays in env, never in the
// browser) and returns it with stale-while-revalidate CDN caching so repeat
// reads are served instantly from Vercel's edge. The dashboard reads this and
// keeps its last snapshot if it errors (budget) or falls back to direct queries
// only when the server key is not configured.
const { computeOverview, PostHogBudgetError } = require('../lib/overview');

module.exports = async function handler(req, res) {
  const range = (req.query.range || '7d').toString();
  // Attribution view — cached separately per bucket (the edge key is the full URL).
  const view = ['overall', 'influencer', 'perf'].includes((req.query.view || '').toString())
    ? req.query.view.toString() : 'overall';
  const cust = (req.query.from && req.query.to)
    ? { from: req.query.from.toString(), to: req.query.to.toString() } : null;

  if (!process.env.PH_API_KEY) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'PH_API_KEY not configured on the server yet' });
  }
  try {
    const data = await computeOverview(range, process.env, cust, view);
    // Edge-cache: fresh for 15 min, then serve stale instantly for up to a day
    // while one request revalidates in the background. Nobody waits on ClickHouse,
    // and passive visitors never trigger a recompute more than 4x/hour per combo.
    // Data partially served from PostHog's own result cache during a budget
    // outage (stale:true) gets a short TTL so it retries once the bucket refills.
    const sMax = data.stale ? 300 : 1800;
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${sMax}, stale-while-revalidate=86400`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ range, view, ts: Date.now(), stale: !!data.stale, data });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    if (e instanceof PostHogBudgetError || e.code === 'budget') {
      // PostHog's hourly read budget is exhausted. Tell the client exactly that
      // (it keeps its snapshot and pauses) instead of a generic 500.
      res.setHeader('Retry-After', String(e.retryAfter || 900));
      return res.status(429).json({
        error: 'PostHog hourly API read budget exhausted',
        code: 'budget',
        retryAfter: e.retryAfter || 900,
        range, view,
      });
    }
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
