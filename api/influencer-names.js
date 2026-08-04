// GET /api/influencer-names → { ts, map: { "<REFERRAL_CODE>": "<Cohort/handle name>" } }
// Lets the dashboard label influencers by their PostHog cohort name (IG handle)
// instead of the signup account name. Cached hard at the edge — cohorts change
// rarely. Falls back to 503/500 (dashboard keeps account names) on any error.
const { computeCohortNameMap } = require('../lib/cohortNames');

module.exports = async function handler(req, res) {
  if (!process.env.PH_API_KEY) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'PH_API_KEY not configured' });
  }
  try {
    const map = await computeCohortNameMap(process.env);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ ts: Date.now(), count: Object.keys(map).length, map });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
