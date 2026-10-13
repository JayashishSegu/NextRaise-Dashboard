'use strict';
// node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const A = require('../lib/creatorAccess');
const E = require('../lib/creatorEarnings');
const P = require('../lib/creatorProgram');
const { months, raw, septemberMonth, julyMonth, HEAD } = require('./fixtures/creator');

const person = { code: 'ABC123', name: 'Sample Creator', email: 'sample@creator.test' };

test('access lifecycle: grant, revoke, re-grant, rotate', () => {
  const t0 = 1000;
  let e = A.grant(undefined, person, t0);
  assert.equal(A.status(e), 'active');
  assert.equal(e.ver, 1);
  assert.equal(A.canOpen(e, 1), true);
  assert.equal(A.canOpen(e, 2), false, 'a version the registry never issued');
  assert.equal(A.grant(e, person, t0 + 1).ver, 1, 'granting twice changes nothing');

  e = A.revoke(e, t0 + 2);
  assert.equal(A.status(e), 'revoked');
  assert.equal(A.canOpen(e, 1), false, 'a revoked creator is locked out');

  e = A.grant(e, person, t0 + 3);
  assert.equal(e.ver, 2, 're-granting raises the version, so the old link stays dead');
  assert.equal(A.canOpen(e, 1), false);
  assert.equal(A.canOpen(e, 2), true);

  e = A.rotate(e, t0 + 4);
  assert.equal(e.ver, 3);
  assert.equal(A.canOpen(e, 2), false);
  assert.equal(A.rotate(A.revoke(e, 1), 2), null, 'a revoked creator cannot be rotated');
  assert.equal(A.revoke(undefined, 1), null);
  assert.equal(A.canOpen(undefined, 1), false);
  assert.equal(A.touch(e, 9).opens, 1);
  assert.deepEqual(Object.keys(A.publicView(e)).sort(), ['grantedAt', 'issuedAt', 'lastSeenAt', 'opens', 'status', 'ver']);
});

// ---------- the program numbers ----------

const LOOSE_HEAD = HEAD;
const looseMonth = {
  month: '2026-10',
  pipeline: [
    ['', 'PROFILE'],
    LOOSE_HEAD,
    HEAD.map((h, i) => ({ 1: 'Loose Creator', 3: 'loose@x.test', 4: '3,000', 8: '10/20/2026', 13: 'Pending' }[i] ?? '')),
  ],
  videos: [],
};
const ph = {
  signups: [{ code: 'ABC123', email: 'sample@creator.test', name: 'Sample Creator', signups: 20 }],
  pay: [{ code: 'ABC123', email: 'sample@creator.test', name: 'Sample Creator', payments: 3, payers: 2, revenue: 6901, commission: 2070 }],
  payAll: [{ code: 'ABC123', email: 'sample@creator.test', name: 'Sample Creator', commission: 2070 }],
};

test('program: cost, return, owed; sheet-only creators are shown as pure cost', () => {
  const all = [julyMonth, septemberMonth, ...months, looseMonth];
  const { rows, totals } = P.buildProgram(ph, all, { range: null });
  const s = rows.find((r) => r.code === 'ABC123');
  assert.equal(s.fees, 1000 + 4000 + 2500);
  assert.equal(s.commission, 2070);
  assert.equal(s.cost, 7500 + 2070);
  assert.equal(s.revenue, 6901);
  assert.ok(Math.abs(s.roi - 6901 / 9570) < 1e-9);
  assert.equal(s.paidOut, 400 + 2500 + 4000 + 1000);
  assert.equal(s.owed, 2070 + 7500 - 7900);
  assert.equal(Math.round(s.conversionPct * 10) / 10, 10);
  const loose = rows.find((r) => r.name === 'Loose Creator');
  assert.ok(loose, 'paid by the sheet but never seen referring anyone');
  assert.equal(loose.cost, 3000);
  assert.equal(loose.revenue, 0);
  assert.match(loose.action, /nothing came in/);
  assert.equal(totals.cost, rows.reduce((n, r) => n + r.cost, 0));
  assert.equal(totals.creators, rows.length);
});

test('program: commission-only creators are not called "strong" just because commission is a fixed share', () => {
  assert.match(P.actionFor({ cost: 300, fees: 0, commission: 300, revenue: 1000, signups: 5, roi: 3.3 }), /Commission only/);
  assert.match(P.actionFor({ cost: 5000, fees: 4000, commission: 1000, revenue: 20000, signups: 5, roi: 4 }), /Strong/);
  assert.match(P.actionFor({ cost: 8000, fees: 8000, commission: 0, revenue: 1000, signups: 9, roi: 0.1 }), /Under water/);
});

test('program: a date range counts only fees earned inside it', () => {
  const all = [julyMonth, septemberMonth, ...months];
  const { rows } = P.buildProgram(ph, all, { range: { from: '2026-10-01', to: '2026-10-31' } });
  const s = rows.find((r) => r.code === 'ABC123');
  assert.equal(s.fees, 2500);
  assert.equal(s.owed, 2070 + 7500 - 7900, 'owed is lifetime, whatever the range');
});

test('program: PostHog loader refuses a bad range, fx or share', async () => {
  const run = async () => ({ results: [] });
  await assert.rejects(() => P.loadFromPostHog(run, { range: { from: "2026-01-01'; DROP", to: '2026-02-01' }, fx: 95, pct: 30 }), (e) => e.status === 400);
  await assert.rejects(() => P.loadFromPostHog(run, { range: null, fx: 5, pct: 30 }), (e) => e.status === 400);
  await assert.rejects(() => P.loadFromPostHog(run, { range: null, fx: 95, pct: 300 }), (e) => e.status === 400);
  const ok = await P.loadFromPostHog(run, { range: null, fx: 95, pct: 30 });
  assert.deepEqual(ok, { signups: [], pay: [], payAll: [] });
});

// ---------- the real handlers, with Redis and PostHog faked ----------

const counters = new Map();
function fakeKv(seed) {
  const h = new Map(Object.entries(seed || {}).map(([k, v]) => [k, new Map(Object.entries(v))]));
  const hash = (k) => h.get(k) || h.set(k, new Map()).get(k);
  return {
    hget: async (k, f) => hash(k).get(f) ?? null,
    hset: async (k, obj) => { for (const [f, v] of Object.entries(obj)) hash(k).set(f, JSON.parse(JSON.stringify(v))); },
    hgetall: async (k) => (hash(k).size ? Object.fromEntries(hash(k)) : null),
    hdel: async (k, f) => hash(k).delete(f),
    incr: async (k) => { counters.set(k, (counters.get(k) || 0) + 1); return counters.get(k); },
    expire: async () => 1,
  };
}

function fakeRun(sql, name) {
  if (name === 'nr-access:people') {
    return Promise.resolve({ results: /'ABC123'/.test(sql) ? [['ABC123', 'Sample Creator', 'sample@creator.test']] : [] });
  }
  if (name === 'nr-creator:who') return Promise.resolve({ results: [['u1', 'Sample Creator', 'sample@creator.test']] });
  if (name === 'nr-creator:users') return Promise.resolve({ results: raw.users.map((u) => [u.email, u.day]) });
  if (name === 'nr-creator:payments') return Promise.resolve({ results: raw.payments.map((p) => [p.email, p.plan, String(p.amount), p.currency, p.at]) });
  if (name === 'nr-creator:campaign') return Promise.resolve({ results: [] });
  if (name === 'nr-program:signups') return Promise.resolve({ results: [['ABC123', 'sample@creator.test', 'Sample Creator', 20]] });
  if (name.startsWith('nr-program:pay')) return Promise.resolve({ results: [['ABC123', 'sample@creator.test', 'Sample Creator', 3, 2, 6901, 2070]] });
  return Promise.resolve({ results: [] });
}

const kv = fakeKv({ 'influencer:sheets:v1': { '2026-10': months[0], '2026-09': septemberMonth, '2026-07': julyMonth } });
const orig = Module._load;
Module._load = function (request, ...rest) {
  if (request === '@vercel/kv') return { kv };
  if (request === '../lib/overview') return { makeRunner: () => fakeRun, PostHogBudgetError: class extends Error {} };
  if (request === '../lib/fx') return { resolveFx: async () => ({ rate: 95 }), FX_FALLBACK: 84 };
  return orig.call(this, request, ...rest);
};
Object.assign(process.env, { CREATOR_APP_ORIGINS: 'https://app.example', NR_GATE_KEY: 'gate-key', NR_ACCESS_CODE: 'open-sesame', CREATOR_LINK_SECRET: 'link-secret', PH_API_KEY: 'x', CREATOR_APP_URL: 'https://app.example/' });
const accessApi = require('../api/creator-access');
const earningsApi = require('../api/creator-earnings');
const signinApi = earningsApi; // sign-in is a POST on the creator-earnings function (Hobby plan: 12 functions)
const programApi = require('../api/creator-program');
// The fake stays in place: the handlers load Redis lazily, per request. (This file runs in its own process.)

const call = async (handler, { method = 'GET', query = {}, body, gate = false, origin, ip } = {}) => {
  const headers = {};
  if (ip) headers['x-forwarded-for'] = ip;
  if (gate) headers['x-nr-gate'] = 'gate-key';
  if (origin) headers.origin = origin;
  let status = 200; let json;
  const res = { setHeader() {}, status(c) { status = c; return this; }, json(j) { json = j; return this; }, end() { return this; } };
  await handler({ method, query, body, headers }, res);
  return { status, json };
};
const tokenOf = (link) => new URL(link).searchParams.get('t');

test('handlers: locked without the unlock code, and nothing is granted for unknown or malicious codes', async () => {
  assert.equal((await call(accessApi, { method: 'POST', body: { action: 'grant', code: 'ABC123' } })).status, 401);
  assert.equal((await call(programApi, { query: { range: '30d' } })).status, 401);
  assert.equal((await call(accessApi, { method: 'GET', gate: true })).status, 405);
  assert.equal((await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant', code: "x'); DROP" } })).status, 400);
  assert.equal((await call(accessApi, { method: 'POST', gate: true, body: { action: 'nope', code: 'ABC123' } })).status, 400);
  const unknown = await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant', code: 'NOBODY' } });
  assert.equal(unknown.json.results[0].error, 'No creator has this referral code');
  assert.equal(await kv.hget('creator:access:v1', 'NOBODY'), null);
});

test('handlers: grant, open, revoke, re-grant, rotate end to end', async () => {
  // Before access, even a perfectly signed link is refused.
  const early = E.mintToken('link-secret', 'ABC123', { ver: 1 });
  assert.equal((await call(earningsApi, { query: { t: early } })).status, 401);

  const g = await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant', code: 'abc123' } });
  assert.equal(g.status, 200);
  assert.equal(g.json.results[0].status, 'active');
  assert.ok(g.json.results[0].link.startsWith('https://app.example/?t=ABC123.1.'), 'link points at the app, version 1');
  const link1 = g.json.results[0].link;

  const open = await call(earningsApi, { query: { t: tokenOf(link1) }, origin: 'https://app.example' });
  assert.equal(open.status, 200);
  assert.equal(open.json.terms.commissionPct, 30);
  assert.equal((await kv.hget('creator:access:v1', 'ABC123')).opens, 1, 'opens are counted');

  // Somebody else's code in the same signed link is refused.
  const [, ver, exp, sig] = tokenOf(link1).split('.');
  assert.equal((await call(earningsApi, { query: { t: `OTHER1.${ver}.${exp}.${sig}` } })).status, 401);

  const listed = await call(programApi, { gate: true, query: { range: '30d' } });
  assert.equal(listed.status, 200);
  const row = listed.json.rows.find((r) => r.code === 'ABC123');
  assert.equal(row.access.status, 'active');
  assert.equal(row.access.opens, 1);
  assert.ok(!JSON.stringify(listed.json).includes('?t='), 'the listing never carries a link');

  const rv = await call(accessApi, { method: 'POST', gate: true, body: { action: 'revoke', code: 'ABC123' } });
  assert.equal(rv.json.results[0].status, 'revoked');
  assert.equal(rv.json.results[0].link, undefined);
  assert.equal((await call(earningsApi, { query: { t: tokenOf(link1) } })).status, 401, 'revoked means locked out at once');

  const g2 = await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant', code: 'ABC123' } });
  const link2 = g2.json.results[0].link;
  assert.ok(link2.includes('?t=ABC123.2.'));
  assert.equal((await call(earningsApi, { query: { t: tokenOf(link1) } })).status, 401, 'the first link stays dead');
  assert.equal((await call(earningsApi, { query: { t: tokenOf(link2) } })).status, 200);

  const rot = await call(accessApi, { method: 'POST', gate: true, body: { action: 'rotate', code: 'ABC123' } });
  assert.ok(rot.json.results[0].link.includes('?t=ABC123.3.'));
  assert.equal((await call(earningsApi, { query: { t: tokenOf(link2) } })).status, 401, 'rotating replaces the old link');

  const again = await call(accessApi, { method: 'POST', gate: true, body: { action: 'link', code: 'ABC123' } });
  assert.equal((await call(earningsApi, { query: { t: tokenOf(again.json.results[0].link) } })).status, 200, 'link re-issues the current version');
});

test('handlers: grant-all gives every listed creator access and reports the ones that do not exist', async () => {
  const r = await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant-all', codes: ['ABC123', 'NOBODY1'] } });
  assert.equal(r.status, 200);
  assert.equal(r.json.results.length, 2);
  assert.equal(r.json.results.find((x) => x.code === 'ABC123').status, 'active');
  assert.ok(r.json.results.find((x) => x.code === 'NOBODY1').error);
  assert.equal((await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant-all', codes: [] } })).status, 400);
  assert.equal((await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant-all', codes: Array.from({ length: 101 }, (_, i) => 'C' + String(i).padStart(4, '0')) } })).status, 400);
});

test('sign-in by referral code: only creators who are switched on, and it ends when they are switched off', async () => {
  await call(accessApi, { method: 'POST', gate: true, body: { action: 'revoke', code: 'ABC123' } }); // start clean

  // A referral code is public, so a creator who has not been switched on cannot get in with it.
  const no = await call(signinApi, { method: 'POST', body: { code: 'ABC123' }, ip: '1.1.1.1' });
  assert.equal(no.status, 401);
  assert.equal((await call(signinApi, { method: 'POST', body: { code: 'NOBODY1' }, ip: '1.1.1.1' })).status, 401, 'unknown codes get the same answer');
  assert.equal(no.json.error, (await call(signinApi, { method: 'POST', body: { code: 'NOBODY1' }, ip: '1.1.1.1' })).json.error, 'and the same message, so nothing reveals who is a creator');
  assert.equal((await call(signinApi, { method: 'POST', body: { code: "x'; DROP" }, ip: '1.1.1.1' })).status, 400);
  assert.equal((await call(signinApi, { method: 'POST', body: {}, ip: '1.1.1.1' })).status, 400);

  await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant', code: 'ABC123' } });
  const ok = await call(signinApi, { method: 'POST', body: { code: ' abc123 ' }, ip: '2.2.2.2', origin: 'https://app.example' });
  assert.equal(ok.status, 200, 'forgiving about case and spaces');
  assert.equal(E.verifyToken('link-secret', ok.json.token).code, 'ABC123');
  assert.equal((await call(earningsApi, { query: { t: ok.json.token } })).status, 200, 'the session opens the earnings page');
  assert.equal(JSON.stringify(ok.json).includes('pin'), false);

  // Revoke ends sign-in AND every session already open.
  await call(accessApi, { method: 'POST', gate: true, body: { action: 'revoke', code: 'ABC123' } });
  assert.equal((await call(signinApi, { method: 'POST', body: { code: 'ABC123' }, ip: '3.3.3.3' })).status, 401);
  assert.equal((await call(earningsApi, { query: { t: ok.json.token } })).status, 401);

  // Switched back on: signs in again; the old session stays dead (new version), the new one works.
  await call(accessApi, { method: 'POST', gate: true, body: { action: 'grant', code: 'ABC123' } });
  assert.equal((await call(earningsApi, { query: { t: ok.json.token } })).status, 401);
  const again = await call(signinApi, { method: 'POST', body: { code: 'ABC123' }, ip: '4.4.4.4' });
  assert.equal(again.status, 200);
  assert.equal((await call(earningsApi, { query: { t: again.json.token } })).status, 200);

  // "Sign out everywhere": sessions die, the code still signs in.
  await call(accessApi, { method: 'POST', gate: true, body: { action: 'rotate', code: 'ABC123' } });
  assert.equal((await call(earningsApi, { query: { t: again.json.token } })).status, 401);
  assert.equal((await call(signinApi, { method: 'POST', body: { code: 'ABC123' }, ip: '5.5.5.5' })).status, 200);
});

test('sign-in by referral code: guessing is limited, and only the app origin gets CORS', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await call(signinApi, { method: 'POST', body: { code: 'NOBODY' + i }, ip: '9.9.9.9' })).status, 401);
  assert.equal((await call(signinApi, { method: 'POST', body: { code: 'NOBODY9' }, ip: '9.9.9.9' })).status, 429);
  assert.equal((await call(signinApi, { method: 'POST', body: { code: 'ABC123' }, ip: '9.9.9.9' })).status, 429, 'even a real code is refused while limited');
  assert.equal((await call(signinApi, { method: 'DELETE', ip: '8.8.8.8' })).status, 405);
  assert.equal((await call(signinApi, { method: 'GET', ip: '8.8.8.8' })).status, 401, 'a plain GET is the earnings page and needs a session');
});
