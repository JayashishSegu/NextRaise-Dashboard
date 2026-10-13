'use strict';
// Sign-in by referral code: POST /api/creator-earnings { code } -> { token }   (public: this is how a creator signs in)
//
// The referral code is the access code. It is PUBLIC (it is in every link a creator shares), so the team's access
// registry (lib/creatorAccess.js) decides who may use it: only a creator switched on from /creator-program gets a session.
// The answer is the same for "no such creator", "not switched on" and "revoked", so nothing here reveals who has access.
// Guessing and scraping are limited: 10 failed tries per address per 15 minutes, 600 tries per hour across everyone, failures slowed.
// (It lives behind the creator-earnings function because the Hobby plan caps a project at 12 functions.)
const { CODE_RE, mintToken } = require('./creatorEarnings');
const A = require('./creatorAccess');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WRONG = 'We could not find a creator with that code. Check it, or ask the NextRaise team to switch on your page.';

async function signin(req, res, kv) {
  const secret = process.env.CREATOR_LINK_SECRET;
  if (!secret || !kv) return res.status(503).json({ error: 'Sign-in is not available right now. Try again in a minute.' });

  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (_) { body = null; }
  const code = String((body && body.code) || '').trim().toUpperCase();
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'That does not look like a referral code. It is letters and numbers, like TAEKK5.' });

  try {
    // Only FAILED tries count against an address, so people who sign in correctly (many creators share a mobile network
    // address) are never locked out by others. A cap on all tries across everyone still holds.
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const mine = `rl:signin:${ip}`;
    const failures = Number(await kv.get(mine)) || 0;
    const all = await kv.incr('rl:signin:all');
    if (all === 1) await kv.expire('rl:signin:all', 3600);
    if (failures >= 10 || all > 600) {
      res.setHeader('Retry-After', '900');
      return res.status(429).json({ error: 'Too many tries. Wait a few minutes and try again.' });
    }
    const fail = async () => {
      if ((await kv.incr(mine)) === 1) await kv.expire(mine, 900);
      await wait(400);
    };

    const entry = await A.load(kv, code);
    if (!entry || !entry.enabled) {
      await fail();
      return res.status(401).json({ error: WRONG });
    }
    const days = Number(process.env.CREATOR_LINK_DAYS) > 0 ? Number(process.env.CREATOR_LINK_DAYS) : 365;
    return res.status(200).json({ token: mintToken(secret, entry.code, { ver: entry.ver, ttlDays: days }) });
  } catch (e) {
    console.error('creator-signin failed', e && e.message);
    return res.status(502).json({ error: 'Sign-in is not available right now. Try again in a minute.' });
  }
}

module.exports = { signin };
