#!/usr/bin/env node
// Dev stub for the Earnings tab: serves the REAL payload builder's output for the fake creator in
// test/fixtures/creator.js, behind the REAL token check. No PostHog key, Redis or network needed.
//
//   node scripts/creator-earnings-stub.js            # http://localhost:3492/api/creator-earnings?t=<token>
//   CREATOR_LINK_SECRET=dev-secret node scripts/creator-link.js ABC123   # a link that works with it
const http = require('http');
const E = require('../lib/creatorEarnings');
const { months, raw } = require('../test/fixtures/creator');

const SECRET = process.env.CREATOR_LINK_SECRET || 'dev-secret';
const PORT = Number(process.env.PORT || 3492);
const ORIGINS = (process.env.CREATOR_APP_ORIGINS || 'http://localhost:3491').split(',');

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  if (url.pathname !== '/api/creator-earnings') return res.writeHead(404).end('{"error":"not found"}');
  const code = E.verifyToken(SECRET, url.searchParams.get('t'));
  if (!code) return res.writeHead(401).end(JSON.stringify({ error: 'This link is invalid or has expired. Ask the NextRaise team for a new one.' }));
  if (code !== 'ABC123') return res.writeHead(404).end(JSON.stringify({ error: 'No creator found for this link.' }));
  const payload = E.buildPayload(raw, E.sheetDeal(months, code), { fxUsdInr: 95 });
  res.writeHead(200).end(JSON.stringify(payload));
}).listen(PORT, () => console.log(`creator-earnings stub on http://localhost:${PORT}`));
