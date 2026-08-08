// api/creator-data.js — manual influencer creator data (budget + social metrics).
// GET (list) / POST (upsert) / DELETE (?id=) over Vercel KV.
// Entries are dated so the CEO Report can sum within a date range.
// If KV env is not configured, GET returns an empty list (kv:false) so the UI still works.
const { kv } = require('@vercel/kv');
const KEY = 'creator-data:v1';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const all = (await kv.hgetall(KEY)) || {};
      return res.status(200).json({ entries: Object.values(all) });
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!b.creator || !b.date) return res.status(400).json({ error: 'creator and date required' });
      const id = b.id || `${b.code || b.creator}|${b.date}|${Date.now()}`;
      const entry = { id, code: b.code || '', creator: b.creator, platform: b.platform || '',
        date: b.date, budget: +b.budget || 0, views: +b.views || 0, likes: +b.likes || 0,
        comments: +b.comments || 0, shares: +b.shares || 0, note: b.note || '', updatedAt: Date.now() };
      await kv.hset(KEY, { [id]: entry });
      return res.status(200).json({ entry });
    }
    if (req.method === 'DELETE') {
      const id = (req.query.id || '').toString();
      if (!id) return res.status(400).json({ error: 'id required' });
      await kv.hdel(KEY, id);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    // KV not provisioned yet → behave as an empty store so the dashboard still loads.
    if (req.method === 'GET') return res.status(200).json({ entries: [], kv: false });
    return res.status(503).json({ error: 'KV unavailable: ' + e.message });
  }
};
