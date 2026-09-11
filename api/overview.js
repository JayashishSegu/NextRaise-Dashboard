// GET /api/overview?range=today|yest|7d|14d|thisMonth|lastMonth|all|custom
// Computes the overview server-side (PostHog key stays in env, never in the
// browser) and returns it with stale-while-revalidate CDN caching so repeat
// reads are served instantly from Vercel's edge. The dashboard reads this and
// falls back to its own direct queries if it errors (e.g. key not set yet).
const { computeOverview } = require('../lib/overview');

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
    // Edge-cache: fresh for 5 min, then serve stale instantly for up to a day
    // while one request revalidates in the background. Nobody waits on ClickHouse.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ range, view, ts: Date.now(), data });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
