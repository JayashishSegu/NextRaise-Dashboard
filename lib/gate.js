// Shared-secret gate for endpoints that return personal data (emails, phone
// numbers, per-user payment history). The secret lives in NR_GATE_KEY on this
// deployment and on the one trusted caller (the v2 app's server, which attaches
// it as the x-nr-gate header). It never reaches a browser.
//
// Fail closed: with no NR_GATE_KEY configured every gated call is refused, so
// deploying this file cannot expose anything until the key is set.
const crypto = require('crypto');

function requireGate(req, res) {
  const key = process.env.NR_GATE_KEY;
  if (!key) {
    res.status(503).json({ error: 'NR_GATE_KEY is not configured on this deployment', code: 'gate-unset' });
    return false;
  }
  const got = Buffer.from(String(req.headers['x-nr-gate'] || ''));
  const want = Buffer.from(key);
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) {
    res.status(401).json({ error: 'unauthorized', code: 'gate' });
    return false;
  }
  return true;
}

module.exports = { requireGate };
