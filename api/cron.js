// Cron warmer — invoked on a schedule by Vercel (see vercel.json `crons`) and by
// the GitHub Action in Jayashish01/nextraise-cron (~every 10 min).
// Keeps the popular combos warm in the edge cache by fetching the SAME URLs the
// dashboard reads. Runs when no one is looking, so the heavy queries never block
// a human. With s-maxage(900) the edge copy is refreshed at most 4x/hour per
// combo regardless of how often the warmer pings.
//
// BUDGET NOTE (2026-09-11): PostHog enforces an hourly read budget for API
// queries. Warm ONLY the two most-opened combos — every extra combo is real
// bytes read each hour. Other range/view combos warm on their first real visit
// and are then served from the edge (stale-while-revalidate) for 24h.
// Vercel edge caches are also per-region, so warming from a US runner does not
// warm the Mumbai edge — more combos here is cost without guaranteed benefit.
const WARM_COMBOS = [
  { range: '7d',    view: 'overall' },
  { range: 'today', view: 'overall' },
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
      if (r.status === 429) break;   // budget exhausted — more warms only deepen the deficit
    } catch (e) {
      results.push({ range, view, error: String((e && e.message) || e), ms: Date.now() - t0 });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ warmed: results, at: new Date().toISOString() });
};
