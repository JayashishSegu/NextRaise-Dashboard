// /api/influencer-payments - what the team pays creators, for the CEO Report.
//
//   GET    ?range=7d[&from=&to=]  -> { ts, data: { kv, window, entries, total } }
//   POST   { creator, date, amount, code?, note? }
//   DELETE ?id=
//
// Entries live in the same Redis hash the classic dashboard's creator form uses
// ('creator-data:v1', amount stored in the `budget` field), so a payment logged
// here also counts in the classic CEO report. Money data, so every method is
// behind lib/gate.js and nothing is cached.
//
// Until a Redis store is attached GET answers kv:false and writes answer 503, so
// the Report can say plainly that payments cannot be saved yet.
const { requireGate, requireRead } = require('../lib/gate');
const { gdrBounds } = require('../lib/overview');
const { summarise } = require('../lib/influencer');

const KEY = 'creator-data:v1';
const SHEETS_KEY = 'influencer:sheets:v1'; // raw tabs pushed by the Apps Script (api/influencer-sync.js)
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function store() {
  try { return require('@vercel/kv').kv; } catch (_) { return null; }
}

function bounds(query) {
  const range = (query.range || '7d').toString();
  const cust = query.from && query.to ? { from: query.from.toString(), to: query.to.toString() } : null;
  try { return gdrBounds(range, cust); } catch (_) { return gdrBounds('7d', null); }
}

function clean(s, max) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  // Reads follow the open/locked switch; adding or deleting a payment always needs the unlock code.
  if (!(req.method === 'GET' ? requireRead(req, res) : requireGate(req, res))) return;
  const kv = store();

  if (req.method === 'GET') {
    const b = bounds(req.query || {});
    const window = { start: b.startDate, end: b.endDate };
    try {
      const all = (kv && (await kv.hgetall(KEY))) || {};
      const manual = Object.values(all)
        .filter((e) => e && Number(e.budget) > 0 && e.date >= window.start && e.date < window.end)
        .map((e) => ({
          id: String(e.id), creator: String(e.creator || ''), code: String(e.code || ''),
          date: String(e.date), amount: Number(e.budget) || 0, note: String(e.note || ''), source: 'manual',
        }));
      // Payments, owed amounts and videos read from the synced Google Sheets.
      const sheetRaw = (kv && (await kv.hgetall(SHEETS_KEY))) || {};
      const sheet = summarise(Object.values(sheetRaw), window);
      const entries = [...manual, ...sheet.payments.map((p) => ({
        id: p.id, creator: p.creator, code: p.code, date: p.date, amount: p.amount, note: p.note, source: 'sheet',
      }))].sort((a, z) => (a.date < z.date ? 1 : a.date > z.date ? -1 : 0));
      const total = entries.reduce((n, e) => n + e.amount, 0);
      const owedTotal = sheet.owed.reduce((n, o) => n + o.amount, 0);
      return res.status(200).json({
        ts: Date.now(),
        data: {
          kv: true, window, entries, total,
          owed: { total: owedTotal, rows: sheet.owed },
          videos: sheet.videos,
          unread: sheet.unread,
          sync: { months: sheet.status, latest: sheet.status.reduce((n, m) => Math.max(n, m.syncedAt || 0), 0) || null },
        },
      });
    } catch (_) {
      // No store attached yet: report that instead of failing the page.
      return res.status(200).json({ ts: Date.now(), data: { kv: false, window, entries: [], total: 0 } });
    }
  }

  if (req.method === 'POST') {
    if (!kv) return res.status(503).json({ error: 'Payment storage is not connected yet', code: 'kv' });
    let body = req.body;
    try { if (typeof body === 'string') body = JSON.parse(body); } catch (_) { body = {}; }
    body = body || {};
    const creator = clean(body.creator, 80);
    const date = clean(body.date, 10);
    const amount = Number(body.amount);
    if (!creator) return res.status(400).json({ error: 'Creator is required' });
    if (!DATE.test(date)) return res.status(400).json({ error: 'Date must look like 2026-10-06' });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e8) return res.status(400).json({ error: 'Amount must be a positive number' });
    const id = `pay|${Date.now()}|${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      id, code: clean(body.code, 60), creator, platform: '', date, budget: Math.round(amount * 100) / 100,
      views: 0, likes: 0, comments: 0, shares: 0, note: clean(body.note, 200), updatedAt: Date.now(),
    };
    try {
      await kv.hset(KEY, { [id]: entry });
      return res.status(200).json({ entry: { id, creator, code: entry.code, date, amount: entry.budget, note: entry.note } });
    } catch (e) {
      return res.status(503).json({ error: 'Payment storage is not connected yet', code: 'kv' });
    }
  }

  if (req.method === 'DELETE') {
    if (!kv) return res.status(503).json({ error: 'Payment storage is not connected yet', code: 'kv' });
    const id = (req.query.id || '').toString();
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      await kv.hdel(KEY, id);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(503).json({ error: 'Payment storage is not connected yet', code: 'kv' });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
};
