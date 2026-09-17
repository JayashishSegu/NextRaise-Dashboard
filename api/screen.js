// GET /api/screen?name=report|daily|insights&range=<preset>&view=<bucket>[&from=&to=]
//
// The same deal api/overview.js gives the Overview, for the three heaviest
// remaining screens: compute server-side (the PostHog key stays in env, never in
// the browser) and return it with stale-while-revalidate CDN caching, so repeat
// reads come off Vercel's edge and nobody waits on ClickHouse.
//
// The client reads this and falls back to its own client-side HogQL only when
// the server key is not configured (503), exactly as the Overview client does.
//
// `name=daily` is a rolling 30-day window and ignores `range`; it is pinned to
// one canonical range key below so every visitor shares one cache entry per view.
const { computeScreen, SCREENS } = require('../lib/screens');
const { PostHogBudgetError } = require('../lib/overview');

module.exports = async function handler(req, res) {
  const name = (req.query.name || '').toString();
  if (!SCREENS.includes(name)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: `name must be one of: ${SCREENS.join(', ')}` });
  }
  // Daily ignores the range selector entirely — canonicalise so the echoed range
  // never suggests the window followed it.
  const range = name === 'daily' ? 'fixed30' : (req.query.range || '7d').toString();
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
    const data = await computeScreen(name, range, process.env, cust, view);
    // Fresh for 15 min, then served stale instantly for up to a day while one
    // request revalidates behind it. That is what caps the PostHog read cost:
    // a combo recomputes at most a couple of times an hour no matter how many
    // people open the tab. Anything partially served from PostHog's own result
    // cache during a budget outage gets a short TTL so it retries sooner.
    const sMax = data.stale ? 300 : 1800;
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${sMax}, stale-while-revalidate=86400`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ name, range, view, ts: Date.now(), stale: !!data.stale, data });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    if (e instanceof PostHogBudgetError || (e && e.code === 'budget')) {
      res.setHeader('Retry-After', String(e.retryAfter || 900));
      return res.status(429).json({
        error: 'PostHog hourly API read budget exhausted',
        code: 'budget',
        retryAfter: e.retryAfter || 900,
        name, range, view,
      });
    }
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
