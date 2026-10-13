'use strict';
// node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../lib/creatorEarnings');
const { months, raw } = require('./fixtures/creator');

const SECRET = 'test-secret';
const NOW = Date.parse('2026-10-13T12:00:00Z');

test('tokens: valid, forged, expired, malformed', () => {
  const t = E.mintToken(SECRET, 'JAVM8S', 30, NOW);
  assert.equal(E.verifyToken(SECRET, t, NOW), 'JAVM8S');
  assert.equal(E.verifyToken('other-secret', t, NOW), null);
  assert.equal(E.verifyToken(SECRET, t, NOW + 31 * 86400e3), null);
  const [code, exp, sig] = t.split('.');
  assert.equal(E.verifyToken(SECRET, `OTHER1.${exp}.${sig}`, NOW), null, 'a signature cannot be moved to another code');
  assert.equal(E.verifyToken(SECRET, `${code}.${Number(exp) + 99999}.${sig}`, NOW), null, 'expiry cannot be extended');
  for (const bad of ['', 'a.b', 'a.b.c.d', null, undefined]) assert.equal(E.verifyToken(SECRET, bad, NOW), null);
  assert.equal(E.verifyToken('', t, NOW), null);
  assert.throws(() => E.mintToken(SECRET, "x'; DROP", 1, NOW));
  assert.throws(() => E.mintToken('', 'ABC123', 1, NOW));
});

test('masking, plan labels and reel sources', () => {
  assert.equal(E.maskEmail('ayush@gmail.com'), 'ay••••@gmail.com');
  assert.equal(E.maskEmail('nonsense'), '••••');
  assert.equal(E.planLabel('resume-builder-pro-3'), '3 months');
  assert.equal(E.planLabel('resume-builder-pro-1'), '1 month');
  assert.equal(E.planLabel('week-pass'), '1 week');
  assert.equal(E.planLabel('resume-builder-pro-1w'), '1 week');
  assert.equal(E.planLabel(''), 'Pro');
  assert.equal(E.sourceOf('raghu_instagram_influencer_reel_2026_10_11'), 'reel-2026-10-11');
  assert.equal(E.sourceOf('raghu_instagram_influencer'), 'bio');
  assert.equal(E.sourceOf(undefined), 'bio');
});

test('sheet deal: only this creator, by referral code', () => {
  const d = E.sheetDeal(months, 'ABC123');
  assert.equal(d.found, true);
  assert.equal(d.commissionPct, 25);
  assert.deepEqual(d.fees, [{ month: '2026-10', name: 'Sample Creator', amount: 2500, date: '2026-10-11' }]);
  assert.equal(d.reels.length, 1);
  assert.equal(d.reels[0].views, 22028);
  assert.equal(d.reels[0].link, 'https://www.instagram.com/reel/AAA');
  assert.deepEqual(d.payouts, [{ date: '2026-10-01', reference: 'Paid by NextRaise', amount: 2500 }]);
  const none = E.sheetDeal(months, 'NOPE00');
  assert.equal(none.found, false);
  assert.equal(none.fees.length + none.payouts.length + none.reels.length, 0);
});

test('payload: money, kinds, sources, fees, terms', () => {
  const sheet = E.sheetDeal(months, 'ABC123');
  const p = E.buildPayload(raw, sheet, { fxUsdInr: 95, now: '2026-10-13T12:00:00Z' });
  assert.equal(p.creator.name, 'Sample');
  assert.deepEqual(p.terms, { commissionPct: 25, refundWindowDays: 7, minPayout: 500, payoutDay: 15 });
  assert.equal(p.paidUpTo, '2026-10-01');
  // USD converted at the given rate and rounded.
  assert.equal(p.payments.find((x) => x.plan === '5 months').amount, Math.round(47.19 * 95));
  // First payment is new, the same person's second is a renewal.
  assert.deepEqual(p.payments.filter((x) => x.email === 'ku••••@gmail.com').map((x) => x.kind), ['new', 'renewal']);
  // IST wall clock, so the first ten characters are the IST day.
  assert.equal(p.payments[1].paidAt, '2026-10-11T14:51:00+05:30');
  assert.ok(p.payments.every((x) => !x.email.includes('@gmail.com') || x.email.includes('••••')), 'no full emails');
  // Sources: bio plus the reel, the reel carries its Instagram views and link.
  const reel = p.sources.find((s) => s.id === 'reel-2026-10-11');
  assert.equal(reel.views, 22028);
  assert.equal(reel.label, 'Reel · 11 Oct');
  assert.ok(p.sources.find((s) => s.id === 'bio'));
  // Sign-ups by day and by source.
  assert.deepEqual(p.days.find((d) => d.date === '2026-10-11'), { date: '2026-10-11', signups: 2, bySource: { 'reel-2026-10-11': 2 } });
  // The fee lands on the reel's live day and releases after the 48 hour check.
  assert.deepEqual(p.fees, [{ id: 'fee-2026-10-11', title: 'Reel · 11 Oct', date: '2026-10-11', amount: 2500, releasesOn: '2026-10-13', source: 'reel-2026-10-11' }]);
  assert.deepEqual(p.payouts, [{ date: '2026-10-01', reference: 'Paid by NextRaise', amount: 2500 }]);
});

test('payload: no sheet row falls back to env defaults and still works', () => {
  const p = E.buildPayload(raw, E.sheetDeal([], 'ABC123'), { fxUsdInr: 84, commissionPct: 30, holdDays: 5 });
  assert.equal(p.terms.commissionPct, 30);
  assert.equal(p.terms.refundWindowDays, 5);
  assert.equal(p.fees.length, 0);
  assert.equal(p.paidUpTo, undefined);
  assert.equal(p.creator.name, 'Sample');
});

test('payload: no referrals yet is an empty, valid payload', () => {
  const p = E.buildPayload({ creator: { id: 'u', name: '' }, users: [], payments: [], campaigns: new Map() }, E.sheetDeal([], 'ABC123'), {});
  assert.equal(p.days.length + p.payments.length + p.fees.length, 0);
  assert.equal(p.creator.name, 'Creator');
  assert.deepEqual(p.sources.map((s) => s.id), ['bio']);
});

test('PostHog loader: validates the code, scopes every query to the creator, survives a failed campaign lookup', async () => {
  const seen = [];
  const run = async (sql, name) => {
    seen.push({ sql, name });
    if (name === 'nr-creator:who') return { results: [['id-123', 'Sample Creator']] };
    if (name === 'nr-creator:users') return { results: [['ku@gmail.com', '2026-10-11']] };
    if (name === 'nr-creator:payments') return { results: [['ku@gmail.com', 'resume-builder-pro-3', '1539', 'inr', '2026-10-11 14:51:00']] };
    throw new Error('persons scan timed out');
  };
  const r = await E.loadFromPostHog(run, 'abc123');
  assert.equal(r.creator.id, 'id-123');
  assert.equal(r.users.length, 1);
  assert.equal(r.payments[0].currency, 'INR');
  assert.equal(r.campaigns.size, 0);
  assert.ok(seen.find((s) => s.name === 'nr-creator:who').sql.includes("'ABC123'"));
  for (const s of seen.filter((x) => x.name !== 'nr-creator:who')) assert.ok(s.sql.includes("'id-123'"), s.name + ' is scoped to the creator');
  await assert.rejects(() => E.loadFromPostHog(run, "x' OR '1'='1"), (e) => e.status === 400);
  await assert.rejects(() => E.loadFromPostHog(async () => ({ results: [] }), 'NOPE00'), (e) => e.status === 404);
});
