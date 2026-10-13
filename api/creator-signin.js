// POST /api/creator-signin   { pin }      public (this is the creator's sign-in)
// -> { token }                            the same signed link token a personal link carries
//
// A creator types the short access code they were given (NR-XXXX-XXXX) and gets back what their link would have given
// them. Only a hash of each access code is stored (lib/creatorAccess.js), the code is looked up by that hash, and the
// answer is the same for "no such code", "revoked" and "replaced", so nothing here reveals who has access.
// Guessing is limited: 10 tries per address per 15 minutes, 300 per hour across everyone, and failures are slowed.
//
// Env: CREATOR_LINK_SECRET, CREATOR_APP_ORIGINS, CREATOR_LINK_DAYS (365), KV_*.
const { mintToken } = require('../lib/creatorEarnings');
const A = require('../lib/creatorAccess');

function store() {
  try { return require('@vercel/kv').kv; } catch (_) { return null; }
}

function cors(req, res) {
  const allowed = String(process.env.CREATOR_APP_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WRONG = 'That access code is not right. Check it and try again, or ask the NextRaise team.';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const secret = process.env.CREATOR_LINK_SECRET;
  const kv = store();
  if (!secret || !kv) return res.status(503).json({ error: 'Sign-in is not available right now. Try again in a minute.' });

  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (_) { body = null; }
  const pin = A.normalizePin(body && body.pin);
  if (!pin) return res.status(400).json({ error: 'That does not look like an access code. It looks like NR-7F3K-9QX2.' });

  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const mine = `rl:signin:${ip}`;
    const [n, all] = [await kv.incr(mine), await kv.incr('rl:signin:all')];
    if (n === 1) await kv.expire(mine, 900);
    if (all === 1) await kv.expire('rl:signin:all', 3600);
    if (n > 10 || all > 300) {
      res.setHeader('Retry-After', '900');
      return res.status(429).json({ error: 'Too many tries. Wait a few minutes and try again.' });
    }

    const h = A.pinHash(secret, pin);
    const code = await kv.hget(A.PINS_KEY, h);
    const entry = code ? await A.load(kv, code) : null;
    if (!entry || !entry.enabled || entry.pinHash !== h) {
      await wait(400);
      return res.status(401).json({ error: WRONG });
    }
    const days = Number(process.env.CREATOR_LINK_DAYS) > 0 ? Number(process.env.CREATOR_LINK_DAYS) : 365;
    return res.status(200).json({ token: mintToken(secret, entry.code, { ver: entry.ver, ttlDays: days }) });
  } catch (e) {
    console.error('creator-signin failed', e && e.message);
    return res.status(502).json({ error: 'Sign-in is not available right now. Try again in a minute.' });
  }
};
