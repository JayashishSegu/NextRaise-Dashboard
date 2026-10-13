'use strict';
// The team's view of the creator program: every creator on one screen, what they brought in, what they cost, and who
// is owed money. Internal only (api/creator-program.js sits behind the unlock code).
//
//   PostHog warehouse  sign-ups and payments per referrer, in the chosen range and all time
//   Google Sheets      each creator's reel fees and what was already paid out (same reading as the creator's own page)
//
// Cost = reel fees earned in the range + commission on what their people paid in the range. Return = revenue / cost.
// "Owed" = everything ever earned (commission + fees) minus everything the sheet says was paid out.
// buildProgram is pure; loadFromPostHog is the only part that touches the network.

const { dealWhere, allPipelineRows, CODE_RE } = require('./creatorEarnings');
const { low } = require('./influencer');

const INTERNAL_U = `u.email NOT LIKE '%@nextraise.ai' AND u.email NOT LIKE '%@creditdharma.in' AND lower(u.email) NOT LIKE '%test%'`;
const INTERNAL_P = `p.user_email NOT LIKE '%@nextraise.ai' AND p.user_email NOT LIKE '%@creditdharma.in' AND lower(p.user_email) NOT LIKE '%test%'`;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const istDay = (col) => `toDate(toTimeZone(${col},'Asia/Kolkata'))`;

/** Sign-ups and payments per referrer. `range` is {from,to} (IST days, inclusive) or null for all time. */
async function loadFromPostHog(run, { range, fx, pct }) {
  if (range && !(DATE.test(range.from) && DATE.test(range.to))) throw Object.assign(new Error('bad range'), { status: 400 });
  const rate = Number(fx);
  const share = Number(pct);
  if (!(rate > 50 && rate < 200) || !(share >= 0 && share <= 100)) throw Object.assign(new Error('bad fx or pct'), { status: 400 });
  const inUsers = range ? ` AND ${istDay('u.created_at')} >= toDate('${range.from}') AND ${istDay('u.created_at')} <= toDate('${range.to}')` : '';
  const inPays = (r) => (r ? ` AND ${istDay('p.created_at')} >= toDate('${r.from}') AND ${istDay('p.created_at')} <= toDate('${r.to}')` : '');
  const inr = `round(multiIf(p.currency='USD', p.amount*${rate}, p.amount))`;
  const payQuery = (r, name) => run(
    `SELECT upper(r.referral_code) AS code, lower(coalesce(r.email,'')) AS em, coalesce(r.name,'') AS nm,
            count() AS pays, uniqExact(lower(p.user_email)) AS payers,
            sum(${inr}) AS rev, sum(round(${inr}*${share}/100)) AS com
     FROM postgres.payments p
     JOIN postgres.users u ON lower(u.email) = lower(p.user_email)
     JOIN postgres.users r ON toString(r.id) = toString(u.referred_by_id)
     WHERE p.status = 'completed' AND u.referred_by_id IS NOT NULL AND r.referral_code != '' AND ${INTERNAL_P}${inPays(r)}
     GROUP BY code, em, nm LIMIT 500`,
    name,
  );
  const [usersR, payR, allR] = await Promise.all([
    run(
      `SELECT upper(r.referral_code) AS code, lower(coalesce(r.email,'')) AS em, coalesce(r.name,'') AS nm, count() AS signups
       FROM postgres.users u JOIN postgres.users r ON toString(r.id) = toString(u.referred_by_id)
       WHERE u.referred_by_id IS NOT NULL AND u.email != '' AND r.referral_code != '' AND ${INTERNAL_U}${inUsers}
       GROUP BY code, em, nm LIMIT 500`,
      'nr-program:signups',
    ),
    payQuery(range, 'nr-program:pay-range'),
    range ? payQuery(null, 'nr-program:pay-all') : null,
  ]);
  const rows = (r) => (r && r.results) || [];
  return {
    signups: rows(usersR).map((r) => ({ code: String(r[0]), email: String(r[1]), name: String(r[2]), signups: Number(r[3]) })),
    pay: rows(payR).map((r) => ({ code: String(r[0]), email: String(r[1]), name: String(r[2]), payments: Number(r[3]), payers: Number(r[4]), revenue: Number(r[5]), commission: Number(r[6]) })),
    // With no range the range query already is all time.
    payAll: rows(allR || payR).map((r) => ({ code: String(r[0]), email: String(r[1]), name: String(r[2]), commission: Number(r[6]) })),
  };
}

const sumBy = (list, f) => list.reduce((n, x) => n + f(x), 0);
const inRange = (d, range) => !range || (d >= range.from && d <= range.to);

function actionFor(row) {
  if (row.cost > 0 && row.revenue === 0 && row.signups === 0) return 'Paid but nothing came in. Check the reel went live.';
  if (row.cost === 0) return row.revenue > 0 ? 'Commission only so far.' : 'No cost, no result yet.';
  if (row.fees === 0) return 'Commission only: it costs nothing unless people buy.';
  if (row.roi < 1) return 'Under water. Renegotiate the fee or pause.';
  if (row.roi > 2.5) return 'Strong. Offer a repeat reel.';
  return 'Healthy. Keep going.';
}

/** One row per creator, plus totals. `months` are the synced sheet months. */
function buildProgram(ph, months, { range = null } = {}) {
  const sheetRows = allPipelineRows(months);
  // Everyone PostHog knows, merged by referral code.
  const byCode = new Map();
  const touch = (x) => {
    const c = byCode.get(x.code) || { code: x.code, email: '', name: '', signups: 0, payments: 0, payers: 0, revenue: 0, commission: 0, commissionAll: 0 };
    if (x.email && !c.email) c.email = x.email;
    if (x.name && !c.name) c.name = x.name;
    byCode.set(x.code, c);
    return c;
  };
  for (const x of ph.signups) touch(x).signups = x.signups;
  for (const x of ph.pay) Object.assign(touch(x), { payments: x.payments, payers: x.payers, revenue: x.revenue, commission: x.commission });
  for (const x of ph.payAll) touch(x).commissionAll = x.commission;

  const creators = [];
  const claimed = new Set(); // sheet rows already attached to a PostHog referrer
  for (const c of byCode.values()) {
    const pick = (r) => r.code === c.code || (!r.code && !!c.email && r.email === c.email);
    sheetRows.forEach((r, i) => { if (pick(r)) claimed.add(i); });
    creators.push({ ...c, deal: dealWhere(months, pick) });
  }
  // Creators the sheet pays but PostHog has never seen refer anyone: pure cost, and the most important rows to show.
  const loose = new Map();
  sheetRows.forEach((r, i) => {
    if (claimed.has(i) || !(r.fixedFee > 0 || r.payouts.length)) return;
    const key = r.email || r.code || `n:${low(r.name)}`;
    if (!loose.has(key)) loose.set(key, { r, pick: (x) => (r.email ? x.email === r.email : r.code ? x.code === r.code : !x.email && !x.code && low(x.name) === low(r.name)) });
  });
  for (const { r, pick } of loose.values()) {
    creators.push({ code: r.code, email: r.email, name: r.name, signups: 0, payments: 0, payers: 0, revenue: 0, commission: 0, commissionAll: 0, deal: dealWhere(months, pick) });
  }

  const rows = creators.map((c) => {
    const fees = sumBy(c.deal.fees.filter((f) => inRange(f.date, range)), (f) => f.amount);
    const feesAll = sumBy(c.deal.fees, (f) => f.amount);
    const paidOut = sumBy(c.deal.payouts, (p) => p.amount);
    const cost = fees + c.commission;
    const row = {
      name: c.name || c.deal.name || c.code || 'Unknown',
      code: c.code,
      signups: c.signups,
      payers: c.payers,
      revenue: c.revenue,
      fees,
      commission: c.commission,
      cost,
      roi: cost ? c.revenue / cost : 0,
      costPerPayer: cost / Math.max(c.payers, 1),
      conversionPct: c.signups ? (c.payers / c.signups) * 100 : 0,
      paidOut,
      owed: Math.max(0, c.commissionAll + feesAll - paidOut),
    };
    return { ...row, action: actionFor(row) };
  }).filter((r) => r.signups || r.payers || r.fees || r.cost || r.owed > 0);

  rows.sort((a, b) => (b.cost > 0) - (a.cost > 0) || b.roi - a.roi || b.revenue - a.revenue);
  const t = { signups: 0, payers: 0, revenue: 0, fees: 0, commission: 0, cost: 0, owed: 0 };
  for (const r of rows) for (const k of Object.keys(t)) t[k] += r[k];
  return { rows, totals: { ...t, roi: t.cost ? t.revenue / t.cost : 0, costPerPayer: t.cost / Math.max(t.payers, 1), creators: rows.length } };
}

module.exports = { loadFromPostHog, buildProgram, actionFor, CODE_RE };
