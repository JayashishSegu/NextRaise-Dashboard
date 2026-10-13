// POST /api/creator-access   (unlock code required, never open mode)
//   { action: 'grant' | 'link' | 'rotate' | 'revoke', code }
//   { action: 'grant-all', codes: [...] }                      give access to every code listed (max 100)
// -> { results: [{ code, name, status, link?, error? }] }
//
// This is how the NextRaise team gives influencers access to their earnings page. A link only works while the registry
// (lib/creatorAccess.js) says the creator is active at the link's version, so revoke and rotate take effect at once.
// Links are returned only here, to a person who has unlocked the dashboard, and never listed anywhere else.
// Only referral codes that exist in the users table can be given access, and names and emails come from there, not from
// the request.
//
// Env: CREATOR_LINK_SECRET, CREATOR_APP_URL (default https://nextraise-creator-earnings.vercel.app), CREATOR_LINK_DAYS (365),
//      PH_API_KEY, KV_*.
const { requireGate } = require('../lib/gate');
const { makeRunner } = require('../lib/overview');
const { CODE_RE, mintToken } = require('../lib/creatorEarnings');
const A = require('../lib/creatorAccess');

function store() {
  try { return require('@vercel/kv').kv; } catch (_) { return null; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!requireGate(req, res)) return;

  const secret = process.env.CREATOR_LINK_SECRET;
  if (!secret) return res.status(503).json({ error: 'CREATOR_LINK_SECRET is not configured on this deployment' });
  if (!process.env.PH_API_KEY) return res.status(503).json({ error: 'PH_API_KEY not configured on the server yet' });
  const kv = store();
  if (!kv) return res.status(503).json({ error: 'The access registry (Redis) is not connected' });

  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (_) { body = null; }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad request' });
  const action = String(body.action || '');
  const wanted = action === 'grant-all' ? body.codes : [body.code];
  if (!['grant', 'link', 'rotate', 'revoke', 'grant-all'].includes(action)) return res.status(400).json({ error: 'unknown action' });
  if (!Array.isArray(wanted) || !wanted.length || wanted.length > 100) return res.status(400).json({ error: 'give between 1 and 100 codes' });
  const codes = [...new Set(wanted.map((c) => String(c || '').toUpperCase()))];
  if (codes.some((c) => !CODE_RE.test(c))) return res.status(400).json({ error: 'bad referral code' });

  const appUrl = (process.env.CREATOR_APP_URL || 'https://nextraise-creator-earnings.vercel.app').replace(/\/+$/, '');
  const days = Number(process.env.CREATOR_LINK_DAYS) > 0 ? Number(process.env.CREATOR_LINK_DAYS) : 365;
  const linkFor = (entry) => `${appUrl}/?t=${mintToken(secret, entry.code, { ver: entry.ver, ttlDays: days })}`;

  try {
    // Who these codes really belong to.
    const run = makeRunner(process.env, { timings: [] });
    const r = await run(
      `SELECT upper(referral_code), coalesce(name,''), lower(coalesce(email,'')) FROM postgres.users
       WHERE upper(referral_code) IN (${codes.map((c) => `'${c}'`).join(',')}) LIMIT 200`,
      'nr-access:people',
    );
    const people = new Map((r.results || []).map((x) => [String(x[0]), { code: String(x[0]), name: String(x[1]), email: String(x[2]) }]));

    const now = Date.now();
    const results = [];
    for (const code of codes) {
      const person = people.get(code);
      if (!person) { results.push({ code, error: 'No creator has this referral code' }); continue; }
      let entry = await A.load(kv, code);
      if (action === 'grant' || action === 'grant-all') entry = A.grant(entry, person, now);
      else if (action === 'revoke') entry = A.revoke(entry, now);
      else if (action === 'rotate') entry = A.rotate(entry, now);
      else if (action === 'link' && !(entry && entry.enabled)) entry = null;
      if (!entry) { results.push({ code, name: person.name, status: A.status(await A.load(kv, code)), error: action === 'revoke' ? 'Had no access' : 'Give access first' }); continue; }
      if (action !== 'link') await A.save(kv, entry);
      results.push({ code, name: person.name, status: A.status(entry), ...(entry.enabled ? { link: linkFor(entry) } : {}) });
    }
    return res.status(200).json({ results });
  } catch (e) {
    console.error('creator-access failed', e && e.message);
    return res.status(502).json({ error: 'Could not update access. Try again in a minute.' });
  }
};
