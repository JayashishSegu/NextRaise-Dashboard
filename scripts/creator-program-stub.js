#!/usr/bin/env node
// Local try-out of the admin page (web/public/creator-program.html) with the REAL api handlers and fake data:
// no PostHog, Redis or keys. Unlock code is "open-sesame".   node scripts/creator-program-stub.js  ->  http://localhost:3493/creator-program
const http = require('http');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { months, septemberMonth, julyMonth, HEAD } = require('../test/fixtures/creator');

Object.assign(process.env, { NR_GATE_KEY: 'gate-key', NR_ACCESS_CODE: 'open-sesame', CREATOR_LINK_SECRET: 'dev-secret', PH_API_KEY: 'x', CREATOR_APP_URL: 'http://localhost:3491' });

const CREATORS = [
  ['ABC123', 'Sample Creator', 'sample@creator.test', 120, 14, 38200, 11460],
  ['QCE9GS', 'Ankit Rai', 'techfitrai@gmail.com', 90, 3, 2744, 824],
  ['MAMO01', 'Mamoni Maji', 'mamoni@x.test', 374, 10, 13814, 4144],
  ['LAVA02', 'Lavanya', 'lavanya@x.test', 52, 9, 12511, 3753],
  ['MANI03', 'Manikandaprabu', 'mani@x.test', 296, 2, 1218, 365],
  ['NEWB04', 'New Creator', 'new@x.test', 8, 0, 0, 0],
];
const kvData = new Map([['influencer:sheets:v1', new Map(Object.entries({ '2026-07': julyMonth, '2026-09': septemberMonth, '2026-10': months[0] }))]]);
const hash = (k) => kvData.get(k) || kvData.set(k, new Map()).get(k);
const kv = {
  hget: async (k, f) => hash(k).get(f) ?? null,
  hset: async (k, o) => { for (const [f, v] of Object.entries(o)) hash(k).set(f, JSON.parse(JSON.stringify(v))); },
  hgetall: async (k) => (hash(k).size ? Object.fromEntries(hash(k)) : null),
};
const run = async (sql, name) => {
  if (name === 'nr-access:people') return { results: CREATORS.filter((c) => sql.includes(`'${c[0]}'`)).map((c) => [c[0], c[1], c[2]]) };
  if (name === 'nr-program:signups') return { results: CREATORS.map((c) => [c[0], c[2], c[1], c[3]]) };
  if (name.startsWith('nr-program:pay')) return { results: CREATORS.filter((c) => c[5] > 0).map((c) => [c[0], c[2], c[1], c[4] + 2, c[4], c[5], c[6]]) };
  return { results: [] };
};
const orig = Module._load;
Module._load = function (req, ...rest) {
  if (req === '@vercel/kv') return { kv };
  if (req === '../lib/overview') return { makeRunner: () => run, PostHogBudgetError: class extends Error {} };
  if (req === '../lib/fx') return { resolveFx: async () => ({ rate: 95 }), FX_FALLBACK: 84 };
  return orig.call(this, req, ...rest);
};
const api = { 'creator-program': require('../api/creator-program'), 'creator-access': require('../api/creator-access'), unlock: require('../api/unlock') };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/creator-program') { res.setHeader('Content-Type', 'text/html'); return res.end(fs.readFileSync(path.join(__dirname, '../web/public/creator-program.html'))); }
  const m = /^\/api\/([a-z-]+)$/.exec(url.pathname);
  if (!m || !api[m[1]]) return res.writeHead(404).end('not found');
  let body = '';
  for await (const c of req) body += c;
  const r2 = { method: req.method, headers: req.headers, query: Object.fromEntries(url.searchParams), body };
  const out = { setHeader: (k, v) => res.setHeader(k, v), status(c) { res.statusCode = c; return this; }, json(j) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(j)); return this; }, end(x) { res.end(x); return this; } };
  await api[m[1]](r2, out);
}).listen(3493, () => console.log('creator program stub on http://localhost:3493/creator-program  (code: open-sesame)'));
