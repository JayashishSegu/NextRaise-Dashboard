// GET /api/ops?name=search&q=<text> | name=pro
//
// Personal-data lookups for the v2 app (account search, Pro Users with phone
// numbers). Gated by lib/gate.js and never cached: the response carries
// emails, phone numbers and payment history.
const { requireRead } = require('../lib/gate');
const { computeSearch, computeProUsers } = require('../lib/ops');
const { PostHogBudgetError } = require('../lib/overview');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!requireRead(req, res)) return;
  if (!process.env.PH_API_KEY) return res.status(503).json({ error: 'PH_API_KEY not configured on the server yet' });

  const name = (req.query.name || '').toString();
  try {
    let data;
    if (name === 'search') data = await computeSearch(process.env, (req.query.q || '').toString());
    else if (name === 'pro') data = await computeProUsers(process.env);
    else return res.status(400).json({ error: 'name must be one of: search, pro' });
    return res.status(200).json({ name, ts: Date.now(), data });
  } catch (e) {
    if (e instanceof PostHogBudgetError || (e && e.code === 'budget')) {
      res.setHeader('Retry-After', String(e.retryAfter || 900));
      return res.status(429).json({ error: 'PostHog hourly API read budget exhausted', code: 'budget', retryAfter: e.retryAfter || 900 });
    }
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
