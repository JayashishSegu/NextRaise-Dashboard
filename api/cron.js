// Cron warmer — invoked on a schedule by Vercel (see vercel.json `crons`).
// Keeps the popular ranges warm in the edge cache by fetching the SAME URLs the
// dashboard reads. Runs when no one is looking, so the heavy queries never block
// a human. With s-maxage(300) < cron interval, each run finds the entry stale and
// triggers a background revalidate, refreshing the edge copy.
//
// Ranges are warmed SEQUENTIALLY on purpose: PostHog's /query concurrency limit
// is 3 team-wide, so parallel warms would 429 and fight real users.
// Warm the hot (range × attribution view) combos so no common open is a cold,
// slow first hit. Ordered by likelihood; cron is best-effort within its budget —
// whatever it doesn't reach warms on the first real visit and is then served
// instantly (stale-while-revalidate) for 24h. Every view is warmed because the
// dashboard remembers the last-used bucket, so a returning Perf/Influencer user
// must find their view warm too — not just Overall.
const WARM_COMBOS = [
  { range: '7d',    view: 'overall'    },
  { range: 'today', view: 'overall'    },
  { range: '7d',    view: 'perf'       },
  { range: '7d',    view: 'influencer' },
  { range: 'today', view: 'perf'       },
  { range: 'today', view: 'influencer' },
  { range: '14d',       view: 'overall' },
  { range: 'thisMonth', view: 'overall' },
  { range: 'lastMonth', view: 'overall' },
  { range: 'all',       view: 'overall' },
];

// Must be the PUBLIC alias — the per-deploy *.vercel.app host has Deployment
// Protection (302), so fetching VERCEL_URL would never reach the function.
const DEFAULT_BASE = 'https://nextraise-dashboard-blue.vercel.app';

module.exports = async function handler(req, res) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.PH_API_KEY) {
    return res.status(503).json({ error: 'PH_API_KEY not configured' });
  }

  const base = process.env.PUBLIC_BASE || DEFAULT_BASE;
  const results = [];
  for (const { range, view } of WARM_COMBOS) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${base}/api/overview?range=${range}&view=${view}`, { headers: { 'x-warm': '1' } });
      results.push({ range, view, status: r.status, ms: Date.now() - t0 });
    } catch (e) {
      results.push({ range, view, error: String((e && e.message) || e), ms: Date.now() - t0 });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ warmed: results, at: new Date().toISOString() });
};
