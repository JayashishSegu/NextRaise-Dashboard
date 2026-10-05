// POST /api/unlock { code }  -> sets the unlock cookie when the code is right
// GET  /api/unlock           -> { unlocked: boolean }
// The cookie is what api/ops.js checks (lib/gate.js). Never cached.
const { COOKIE, isUnlocked, unlockToken, same } = require('../lib/gate');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const token = unlockToken();
  if (!token) {
    return res.status(503).json({ error: 'Access is not configured on this deployment', code: 'gate-unset' });
  }
  if (req.method === 'GET') return res.status(200).json({ unlocked: isUnlocked(req) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const code = String((body && body.code) || '');
  if (!code || !same(code, process.env.NR_ACCESS_CODE)) {
    await new Promise(r => setTimeout(r, 700));   // slow down guessing
    return res.status(401).json({ error: 'That code is not right' });
  }
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
  return res.status(200).json({ ok: true });
};

function safeParse(s) {
  try { return JSON.parse(s); } catch (_) { return {}; }
}
