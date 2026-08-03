// Cron warmer — invoked on a schedule by Vercel (see vercel.json `crons`).
// Keeps the popular ranges warm in the edge cache by fetching the SAME URLs the
// dashboard reads. Runs when no one is looking, so the heavy queries never block
// a human. With s-maxage(300) < cron interval, each run finds the entry stale and
// triggers a background revalidate, refreshing the edge copy.
//
// Ranges are warmed SEQUENTIALLY on purpose: PostHog's /query concurrency limit
// is 3 team-wide, so parallel warms would 429 and fight real users.
const WARM_RANGES = ['today', '7d'];

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
  for (const range of WARM_RANGES) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${base}/api/overview?range=${range}`, { headers: { 'x-warm': '1' } });
      results.push({ range, status: r.status, ms: Date.now() - t0 });
    } catch (e) {
      results.push({ range, error: String((e && e.message) || e), ms: Date.now() - t0 });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ warmed: results, at: new Date().toISOString() });
};
