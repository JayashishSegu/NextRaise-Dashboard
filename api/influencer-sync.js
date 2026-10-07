// /api/influencer-sync - receives the Google Sheets snapshots that the Apps Script
// pushes from the owner's Google account.
//
//   POST  header x-nr-sync-key: <NR_SYNC_KEY>
//         { months: [{ month:'2026-10', sheetId, pipeline:[[..]], videos:[[..]] }] }
//   GET   (unlock cookie)  -> which months are stored and when they last synced
//
// The raw tabs are stored as-is in Redis and parsed on read (lib/influencer.js), so
// a parsing fix never needs the script to be re-pasted. The key only authorises
// writing sheet snapshots; nothing is readable with it.
const { requireRead, same } = require('../lib/gate');
const { summarise } = require('../lib/influencer');

const KEY = 'influencer:sheets:v1';
const MAX_ROWS = 2000;
const MAX_COLS = 80;
const MAX_CELL = 600;

function store() {
  try { return require('@vercel/kv').kv; } catch (_) { return null; }
}

/** Only an array of rows of short strings gets through. */
function grid(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX_ROWS).map((row) =>
    (Array.isArray(row) ? row : []).slice(0, MAX_COLS).map((c) => String(c == null ? '' : c).slice(0, MAX_CELL)));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'GET') {
    if (!requireRead(req, res)) return;
    const kv = store();
    try {
      const all = (kv && (await kv.hgetall(KEY))) || {};
      const months = Object.values(all).sort((a, b) => (a.month < b.month ? -1 : 1));
      const view = summarise(months, { start: '2000-01-01', end: '2100-01-01' });
      return res.status(200).json({ ts: Date.now(), months: view.status, unread: view.unread });
    } catch (e) {
      return res.status(200).json({ ts: Date.now(), months: [], unread: [], kv: false });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const secret = process.env.NR_SYNC_KEY;
  if (!secret) return res.status(503).json({ error: 'NR_SYNC_KEY is not configured on this deployment' });
  if (!same(req.headers['x-nr-sync-key'], secret)) return res.status(401).json({ error: 'bad sync key' });

  const kv = store();
  if (!kv) return res.status(503).json({ error: 'Redis store is not connected' });

  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (_) { body = null; }
  const months = body && Array.isArray(body.months) ? body.months.slice(0, 36) : null;
  if (!months) return res.status(400).json({ error: 'body must be { months: [...] }' });

  const stored = [];
  try {
    for (const m of months) {
      if (!m || !/^\d{4}-\d{2}$/.test(String(m.month || ''))) continue;
      const entry = {
        month: String(m.month),
        sheetId: String(m.sheetId || '').slice(0, 80),
        pipeline: grid(m.pipeline),
        videos: grid(m.videos),
        syncedAt: Date.now(),
      };
      await kv.hset(KEY, { [entry.month]: entry });
      stored.push({ month: entry.month, pipelineRows: entry.pipeline.length, videoRows: entry.videos.length });
    }
  } catch (e) {
    return res.status(503).json({ error: 'Could not write to the Redis store' });
  }
  return res.status(200).json({ ok: true, stored });
};
