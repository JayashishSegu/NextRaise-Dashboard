// GET /api/creator-earnings?t=<signed link token>      the creator's own earnings (what the Earnings tab reads)
// GET /api/creator-earnings?code=<REFERRAL CODE>       staff look-up of any creator, behind the unlock code
//
// Builds one EarningsPayload (lib/creatorEarnings.js) from PostHog (sign-ups, payments, which reel they came from) and
// the synced Google Sheets (deal, reels with their Instagram views, what was already paid out).
//
// A creator can only ever read the code their link was minted for (scripts/creator-link.js signs it with
// CREATOR_LINK_SECRET). Emails are masked here, before anything leaves the server. The response is never cached by a
// shared cache, and a warm instance remembers it for 3 minutes so a creator refreshing the page does not spend the
// PostHog read budget.
//
// Env: PH_API_KEY, CREATOR_LINK_SECRET, KV_* (the sheet snapshots), CREATOR_APP_ORIGINS (comma list, for CORS),
//      optional CREATOR_COMMISSION_PCT (30), CREATOR_HOLD_DAYS (7), CREATOR_MIN_PAYOUT (500), CREATOR_PAYOUT_DAY (15).
const { requireGate } = require('../lib/gate');
const { makeRunner, PostHogBudgetError } = require('../lib/overview');
const { resolveFx, FX_FALLBACK } = require('../lib/fx');
const { CODE_RE, verifyToken, sheetDeal, loadFromPostHog, buildPayload } = require('../lib/creatorEarnings');

const SHEETS_KEY = 'influencer:sheets:v1';
const TTL_MS = 3 * 60 * 1000;
const memo = new Map(); // code -> { at, payload }

function store() {
  try { return require('@vercel/kv').kv; } catch (_) { return null; }
}

function cors(req, res) {
  const allowed = String(process.env.CREATOR_APP_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-nr-gate');
  }
}

const int = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  // Who is asking, and for which code.
  let code = null;
  const token = (req.query.t || '').toString();
  if (token) {
    const secret = process.env.CREATOR_LINK_SECRET;
    if (!secret) return res.status(503).json({ error: 'CREATOR_LINK_SECRET is not configured on this deployment' });
    code = verifyToken(secret, token);
    if (!code) return res.status(401).json({ error: 'This link is invalid or has expired. Ask the NextRaise team for a new one.' });
  } else if (req.query.code) {
    if (!requireGate(req, res)) return;
    code = req.query.code.toString().toUpperCase();
    if (!CODE_RE.test(code)) return res.status(400).json({ error: 'bad referral code' });
  } else {
    return res.status(401).json({ error: 'Open your personal earnings link.' });
  }

  if (!process.env.PH_API_KEY) return res.status(503).json({ error: 'PH_API_KEY not configured on the server yet' });

  const hit = memo.get(code);
  if (hit && Date.now() - hit.at < TTL_MS) return res.status(200).json(hit.payload);

  try {
    const run = makeRunner(process.env, { timings: [] });
    const kv = store();
    const [raw, fx, sheetsMap] = await Promise.all([
      loadFromPostHog(run, code),
      resolveFx().catch(() => ({ rate: FX_FALLBACK })),
      kv ? kv.hgetall(SHEETS_KEY).catch(() => null) : Promise.resolve(null),
    ]);
    const sheet = sheetDeal(Object.values(sheetsMap || {}), code, { email: raw.creator.email });
    const payload = buildPayload(raw, sheet, {
      fxUsdInr: fx.rate,
      commissionPct: int(process.env.CREATOR_COMMISSION_PCT, 30),
      holdDays: int(process.env.CREATOR_HOLD_DAYS, 7),
      minPayout: int(process.env.CREATOR_MIN_PAYOUT, 500),
      payoutDay: int(process.env.CREATOR_PAYOUT_DAY, 15),
    });
    memo.set(code, { at: Date.now(), payload });
    return res.status(200).json(payload);
  } catch (e) {
    if (e && e.status === 404) return res.status(404).json({ error: 'No creator found for this link.' });
    if (e && e.status === 400) return res.status(400).json({ error: 'bad referral code' });
    if (e instanceof PostHogBudgetError) {
      res.setHeader('Retry-After', '60');
      return res.status(503).json({ error: 'Earnings are busy right now. Try again in a minute.' });
    }
    console.error('creator-earnings failed', e && e.message);
    return res.status(502).json({ error: 'Could not load earnings. Try again in a minute.' });
  }
};
