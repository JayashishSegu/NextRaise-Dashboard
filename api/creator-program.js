// GET /api/creator-program?range=30d|90d|all   (unlock code required, never open mode)
// -> { ts, range, rows: [{ name, code, signups, payers, revenue, fees, commission, cost, roi, costPerPayer, conversionPct,
//        paidOut, owed, action, access: { status, ver, grantedAt, issuedAt, lastSeenAt, opens } }], totals }
//
// Every creator in one list, with what they brought in, what they cost and who is owed money (lib/creatorProgram.js),
// next to their access state (lib/creatorAccess.js) so the team can give, replace or revoke access from the same row.
// Creator links are never in this response; they come only from POST /api/creator-access.
const { requireGate } = require('../lib/gate');
const { makeRunner, PostHogBudgetError } = require('../lib/overview');
const { resolveFx, FX_FALLBACK } = require('../lib/fx');
const { loadFromPostHog, buildProgram } = require('../lib/creatorProgram');
const { addDays } = require('../lib/creatorEarnings');
const A = require('../lib/creatorAccess');

const SHEETS_KEY = 'influencer:sheets:v1';
const TTL_MS = 5 * 60 * 1000;
const memo = new Map(); // range -> { at, program }

function store() {
  try { return require('@vercel/kv').kv; } catch (_) { return null; }
}

const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (!requireGate(req, res)) return;
  if (!process.env.PH_API_KEY) return res.status(503).json({ error: 'PH_API_KEY not configured on the server yet' });

  const key = ['30d', '90d', 'all'].includes(String(req.query.range)) ? String(req.query.range) : '30d';
  const today = todayIST();
  const range = key === 'all' ? null : { from: addDays(today, key === '30d' ? -29 : -89), to: today };
  const kv = store();

  try {
    let program = memo.get(key);
    if (!program || Date.now() - program.at > TTL_MS) {
      const run = makeRunner(process.env, { timings: [] });
      const [fx, sheetsMap] = await Promise.all([
        resolveFx().catch(() => ({ rate: FX_FALLBACK })),
        kv ? kv.hgetall(SHEETS_KEY).catch(() => null) : Promise.resolve(null),
      ]);
      const ph = await loadFromPostHog(run, { range, fx: fx.rate, pct: Number(process.env.CREATOR_COMMISSION_PCT) || 30 });
      program = { at: Date.now(), ...buildProgram(ph, Object.values(sheetsMap || {}), { range }) };
      memo.set(key, program);
    }
    const access = kv ? await A.loadAll(kv).catch(() => new Map()) : new Map();
    const rows = program.rows.map((r) => ({ ...r, access: r.code ? A.publicView(access.get(r.code)) : { ...A.publicView(null), status: 'nocode' } }));
    return res.status(200).json({ ts: program.at, range: key, from: range && range.from, to: range && range.to, rows, totals: program.totals, registry: !!kv });
  } catch (e) {
    if (e && e.status === 400) return res.status(400).json({ error: 'bad range' });
    if (e instanceof PostHogBudgetError) {
      res.setHeader('Retry-After', '60');
      return res.status(503).json({ error: 'The numbers are busy right now. Try again in a minute.' });
    }
    console.error('creator-program failed', e && e.message);
    return res.status(502).json({ error: 'Could not load the program. Try again in a minute.' });
  }
};
