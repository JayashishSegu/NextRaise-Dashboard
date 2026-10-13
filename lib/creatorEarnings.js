'use strict';
// What one creator sees on the Earnings tab, built from three real sources:
//
//   PostHog warehouse  postgres.users (who signed up with the creator's referral code, by IST day),
//                      postgres.payments (what those people paid), persons (which reel link they came from)
//   Google Sheets      the influencer pipeline the Apps Script pushes into Redis (api/influencer-sync.js):
//                      the deal (fixed reel fee, commission %), the reel links with their Instagram views,
//                      and what the team has already paid the creator
//   Env                CREATOR_COMMISSION_PCT, CREATOR_HOLD_DAYS, CREATOR_MIN_PAYOUT, CREATOR_PAYOUT_DAY
//
// The output is the EarningsPayload the React app reads (creator-earnings app, src/lib/types.ts). Everything that
// touches the network is in loadFromPostHog and sheetDeal's caller; buildPayload is pure so it is tested without
// any service. Emails leave this file masked, and no other creator's data is ever read.

const crypto = require('crypto');
const { parsePipeline, parseVideos, isoDate, isPaid, num, findHeader, columns, norm, low } = require('./influencer');

const CODE_RE = /^[A-Za-z0-9_-]{3,24}$/;
const INTERNAL = `email NOT LIKE '%@nextraise.ai' AND email NOT LIKE '%@creditdharma.in' AND lower(email) NOT LIKE '%test%'`;

// ---------- signed links: one per creator, minted by scripts/creator-link.js ----------

function same(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const sign = (secret, code, exp) => crypto.createHmac('sha256', secret).update(`creator:${code}:${exp}`).digest('base64url');

/** token = CODE.expiry.signature. The code is the creator's referral code; nothing else is trusted from the link. */
function mintToken(secret, code, ttlDays = 365, now = Date.now()) {
  if (!secret) throw new Error('CREATOR_LINK_SECRET is not set');
  if (!CODE_RE.test(code)) throw new Error('bad referral code');
  const exp = Math.floor(now / 1000) + Math.round(ttlDays * 86400);
  return `${code}.${exp}.${sign(secret, code, exp)}`;
}

/** The referral code the token was minted for, or null when it is malformed, forged or expired. */
function verifyToken(secret, token, now = Date.now()) {
  if (!secret) return null;
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [code, exp, sig] = parts;
  if (!CODE_RE.test(code) || !/^\d{1,12}$/.test(exp)) return null;
  if (Number(exp) * 1000 < now) return null;
  return same(sig, sign(secret, code, exp)) ? code : null;
}

// ---------- small helpers ----------

const pad = (n) => String(n).padStart(2, '0');
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (iso) => `${+iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]}`;

function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return '••••';
  return `${user.slice(0, 2)}••••@${domain}`;
}

/** "resume-builder-pro-3" -> "3 months". Anything unrecognised is just "Pro". */
function planLabel(planKey) {
  const k = String(planKey || '');
  const w = /pro[-_]?(\d+)w\b/i.exec(k); // "resume-builder-pro-1w" is a weekly pack
  if (w) return +w[1] === 1 ? '1 week' : `${+w[1]} weeks`;
  if (/week/i.test(k)) return '1 week';
  const m = /pro[-_]?(\d+)/i.exec(k);
  if (m) return +m[1] === 1 ? '1 month' : `${+m[1]} months`;
  return 'Pro';
}

/** utm_campaign "..._reel_2026_10_11" -> source id "reel-2026-10-11"; everything else is the bio link or code. */
function sourceOf(campaign) {
  const m = /reel[_-](\d{4})[_-](\d{2})[_-](\d{2})/i.exec(String(campaign || ''));
  return m ? `reel-${m[1]}-${m[2]}-${m[3]}` : 'bio';
}

// ---------- the Sheets side ----------

/**
 * A fee cell is free text: "3000", "4000 flat", "700 fixed (Aug deal)", "350/video", "only commission", "TBC".
 * A leading amount counts (a per-video fee is the fee for the reel that went live); words without one count as none.
 */
function feeAmount(v) {
  const plain = num(v);
  if (plain != null) return plain > 0 ? plain : 0;
  const m = /^\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:\/\s*(?:video|reel)|per\s+(?:video|reel)|flat|fixed|\+|\()/i.exec(String(v == null ? '' : v));
  return m ? Number(m[1].replace(/,/g, '')) : 0;
}

/** "30%", "30" or 0.3 (a percent cell read as a fraction) -> 30. Anything else is null. */
function pctValue(v) {
  const n = num(norm(v).replace(/%/g, ''));
  if (n == null) return null;
  const p = n > 0 && n < 1 ? n * 100 : n;
  return p >= 0 && p <= 100 ? Math.round(p * 100) / 100 : null;
}

const cleanLink = (l) => norm(l).replace(/[?#].*$/, '').replace(/\/+$/, '');
const whole = (v) => Math.round(num(v) || 0);

/**
 * Pipeline rows (one per creator per month). Written against the real monthly sheets (Aug, Sep, Oct 2026 share one
 * layout; September and October add `Commission %`, `Fixed Fee (Rs)`, `Bonus Earned (Rs)`, `Total Payout (Rs)`; July has no
 * `Referral Code` column): the deal is `Fee (Rs)` plus commission, the reel link and Instagram numbers sit in the same row, and money
 * paid out comes in three blocks:
 *   fee         Payment Status, Payment Date                    (amount = Fee (Rs))
 *   commission  Payment status,  Date                           (amount = Commission Earned (Rs))
 *   commission  Payment Status (2), Date (second)               (amount = Commission Earned (Rs) (2))
 * There is no Commission % column; the rate is written in the notes ("30% commission"), so it is read from there.
 */
function pipelineRows(month, rows) {
  const h = findHeader(rows, ['name', 'payment status']);
  if (h < 0) return [];
  const col = columns(rows[h]);
  const year = Number(month.slice(0, 4));
  const at = (r, name, nth) => {
    const i = col(name, nth);
    return i < 0 ? '' : r[i];
  };
  const out = [];
  for (const r of rows.slice(h + 1)) {
    const name = norm(at(r, 'name'));
    if (!name) continue;
    const fixed = num(at(r, 'fixed fee (rs)'));
    const bonus = num(at(r, 'bonus earned (rs)'));
    const fee = (fixed && fixed > 0 ? fixed : feeAmount(at(r, 'fee (rs)'))) + (bonus && bonus > 0 ? bonus : 0);
    const liveDate = isoDate(at(r, 'video live date'), year);
    const notes = `${at(r, 'deal type')} ${at(r, 'internal notes')}`;
    const noted = /(\d{1,2}(?:\.\d+)?)\s*%\s*commission/i.exec(notes);
    const pct = pctValue(at(r, 'commission %')) ?? pctValue(at(r, 'commission (%)')) ?? (noted ? Number(noted[1]) : null);
    const blocks = [
      [at(r, 'payment status', 0), at(r, 'payment date', 0), num(at(r, 'fee (rs)'))],
      [at(r, 'payment status', 1), at(r, 'date', 0), num(at(r, 'commission earned (rs)'))],
      [at(r, 'payment status (2)', 0), at(r, 'date', 1), num(at(r, 'commission earned (rs) (2)'))],
    ];
    const payouts = [];
    for (const [status, date, amount] of blocks) {
      if (isPaid(status) && amount && amount > 0) {
        payouts.push({ date: isoDate(date, year) || liveDate || `${month}-01`, amount: Math.round(amount) });
      }
    }
    const link = cleanLink(at(r, 'video link'));
    out.push({
      month,
      name,
      handle: norm(at(r, 'ig handle')),
      code: norm(at(r, 'referral code')).toUpperCase(),
      email: low(at(r, 'email')),
      fixedFee: fee,
      lump: col('total payout (rs)') >= 0, // September and October rows carry one lump payout; July and August use payment blocks
      commissionPct: pct != null && pct >= 0 && pct <= 100 ? pct : null,
      liveDate,
      video: /^https?:\/\//i.test(link) ? { link, date: liveDate, views: whole(at(r, 'views')), likes: whole(at(r, 'likes')), comments: whole(at(r, 'comments')) } : null,
      payouts,
    });
  }
  return out;
}

/**
 * Everything the sheets say about one creator, found by referral code:
 *   deal     commission % and fixed fees (a fee is earned on the day its reel went live)
 *   reels    the reel links with views, likes and comments (the Instagram numbers the team records)
 *   payouts  what the team has already paid, newest first
 */
function sheetDeal(months, code, ids = {}) {
  const want = String(code).toUpperCase();
  const email = low(ids.email || '');
  // A row belongs to the creator by referral code, or, when the sheet row has no code, by the account email.
  const mine = (r) => r.code === want || (!r.code && !!email && r.email === email);
  const rows = [];
  const payouts = [];
  const videos = new Map();
  for (const m of months || []) {
    if (!m || !/^\d{4}-\d{2}$/.test(m.month || '')) continue;
    const found = pipelineRows(m.month, m.pipeline || []).filter(mine);
    rows.push(...found);
    // Lump-payout months reuse the CEO report's reading of the sheet, so the two never disagree.
    const lumps = found.some((r) => r.lump) ? parsePipeline(m.month, m.pipeline || []).payments : [];
    for (const r of found) {
      if (r.video && r.video.date) videos.set(r.video.link, r.video);
      const list = r.lump ? lumps.filter((p) => low(p.creator) === low(r.name)).map((p) => ({ date: p.date, amount: Math.round(p.amount) })) : r.payouts;
      for (const p of list) payouts.push({ date: p.date, reference: 'Paid by NextRaise', amount: p.amount });
    }
    // Older layouts kept reel stats on a separate tab; use it only for links the pipeline row did not carry.
    const names = new Set(found.map((r) => low(r.name)));
    for (const v of parseVideos(m.month, m.videos || [])) {
      if (names.has(low(v.creator)) && v.date && !videos.has(v.link)) videos.set(v.link, v);
    }
  }
  const pcts = rows.map((r) => r.commissionPct).filter((p) => p != null);
  return {
    found: rows.length > 0,
    name: rows.length ? rows[0].name : null,
    commissionPct: pcts.length ? pcts[pcts.length - 1] : null,
    fees: rows.filter((r) => r.fixedFee > 0).map((r) => ({ month: r.month, name: r.name, amount: Math.round(r.fixedFee), date: r.liveDate || `${r.month}-01` })),
    reels: [...videos.values()].filter((v) => v.date),
    payouts: payouts.sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
}

// ---------- the PostHog side ----------

/** Read the creator, the people they referred, those people's payments and the reel each came from. */
async function loadFromPostHog(run, code) {
  const c = String(code).toUpperCase();
  if (!CODE_RE.test(c)) throw Object.assign(new Error('bad code'), { status: 400 });
  const creatorRes = await run(
    `SELECT toString(id), coalesce(name,''), lower(coalesce(email,'')) FROM postgres.users WHERE upper(referral_code) = '${c}' LIMIT 1`,
    'nr-creator:who',
  );
  const who = (creatorRes.results || [])[0];
  if (!who) throw Object.assign(new Error('unknown referral code'), { status: 404 });
  const id = String(who[0]).replace(/[^A-Za-z0-9-]/g, '');
  const referred = `SELECT lower(email) FROM postgres.users WHERE toString(referred_by_id) = '${id}'`;

  const [usersR, payR, campR] = await Promise.all([
    run(
      `SELECT lower(email), toString(toDate(toTimeZone(created_at,'Asia/Kolkata'))) FROM postgres.users
       WHERE toString(referred_by_id) = '${id}' AND email != '' AND ${INTERNAL} LIMIT 5000`,
      'nr-creator:users',
    ),
    run(
      `SELECT lower(user_email), coalesce(plan_key,''), amount, currency, toString(toTimeZone(created_at,'Asia/Kolkata'))
       FROM postgres.payments
       WHERE status = 'completed' AND lower(user_email) IN (${referred})
         AND user_email NOT LIKE '%@nextraise.ai' AND user_email NOT LIKE '%@creditdharma.in' AND lower(user_email) NOT LIKE '%test%'
       ORDER BY created_at LIMIT 5000`,
      'nr-creator:payments',
    ),
    // Which reel link each person came from. Best effort: the persons scan is the slow part, so a failure here
    // only loses the per-reel split, never the money.
    run(
      `SELECT lower(toString(properties.email)), coalesce(toString(properties.$initial_utm_campaign),'')
       FROM persons WHERE lower(toString(properties.email)) IN (${referred}) LIMIT 5000`,
      'nr-creator:campaign',
    ).catch(() => ({ results: [] })),
  ]);
  return {
    creator: { id, name: String(who[1] || ''), email: String(who[2] || '') },
    users: (usersR.results || []).map((r) => ({ email: String(r[0]), day: String(r[1]) })),
    payments: (payR.results || []).map((r) => ({ email: String(r[0]), plan: String(r[1]), amount: Number(r[2]), currency: String(r[3]).toUpperCase(), at: String(r[4]) })),
    campaigns: new Map((campR.results || []).map((r) => [String(r[0]), String(r[1])])),
  };
}

// ---------- the payload (pure) ----------

function buildPayload(raw, sheet, opts) {
  const o = {
    fxUsdInr: 84, commissionPct: 30, holdDays: 7, minPayout: 500, payoutDay: 15, feeReleaseDays: 2,
    now: new Date().toISOString(), ...opts,
  };
  const src = (email) => sourceOf(raw.campaigns.get(email));

  // Sign-ups per IST day, with the reel each came from.
  const days = new Map();
  for (const u of raw.users) {
    const d = days.get(u.day) || { date: u.day, signups: 0, bySource: {} };
    const s = src(u.email);
    d.signups += 1;
    d.bySource[s] = (d.bySource[s] || 0) + 1;
    days.set(u.day, d);
  }

  // Payments in INR. A person's first completed payment is "new"; later ones are renewals.
  const seen = new Set();
  const payments = raw.payments.map((p) => {
    const kind = seen.has(p.email) ? 'renewal' : 'new';
    seen.add(p.email);
    const amount = p.currency === 'USD' ? p.amount * o.fxUsdInr : p.amount;
    return {
      paidAt: p.at.replace(' ', 'T') + '+05:30', // IST wall-clock, so its first ten characters are the IST day
      email: maskEmail(p.email),
      plan: planLabel(p.plan),
      amount: Math.round(amount),
      kind,
      source: src(p.email),
    };
  });

  // Reel fees, and the sources table (bio plus every reel seen anywhere).
  const reelByDate = new Map(sheet.reels.map((v) => [v.date, v]));
  const sources = new Map([['bio', { id: 'bio', label: 'Bio link and code' }]]);
  const addReel = (date) => {
    const id = `reel-${date}`;
    if (sources.has(id)) return id;
    const v = reelByDate.get(date);
    const s = { id, label: `Reel · ${dayLabel(date)}` };
    if (v) Object.assign(s, { url: v.link, views: v.views });
    sources.set(id, s);
    return id;
  };
  for (const v of sheet.reels) addReel(v.date);
  for (const s of new Set([...payments.map((p) => p.source), ...[...days.values()].flatMap((d) => Object.keys(d.bySource))])) {
    if (s.startsWith('reel-')) addReel(s.slice(5));
  }
  const feeCount = new Map();
  const fees = sheet.fees.map((f) => ({
    id: `fee-${f.date}${feeCount.set(f.date, (feeCount.get(f.date) || 0) + 1).get(f.date) > 1 ? '-' + feeCount.get(f.date) : ''}`,
    title: `Reel · ${dayLabel(f.date)}`,
    date: f.date,
    amount: f.amount,
    releasesOn: addDays(f.date, o.feeReleaseDays),
    source: reelByDate.has(f.date) || sources.has(`reel-${f.date}`) ? `reel-${f.date}` : 'bio',
  }));

  const payouts = sheet.payouts.map((p) => ({ date: p.date, reference: p.reference, amount: p.amount }));
  return {
    creator: { name: (raw.creator.name || sheet.name || 'Creator').split(' ')[0] },
    terms: {
      // One rate for every creator (30%, confirmed 14 Oct 2026). The sheet's Commission % / notes are still parsed into
      // sheetDeal().commissionPct but deliberately not used, so a stray note can never show a creator a different rate.
      commissionPct: o.commissionPct,
      refundWindowDays: o.holdDays,
      minPayout: o.minPayout,
      payoutDay: o.payoutDay,
    },
    updatedAt: o.now,
    ...(payouts.length ? { paidUpTo: payouts[0].date } : {}),
    sources: [...sources.values()],
    days: [...days.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
    payments,
    fees,
    payouts,
  };
}

module.exports = { CODE_RE, mintToken, verifyToken, maskEmail, planLabel, sourceOf, feeAmount, pctValue, pipelineRows, sheetDeal, loadFromPostHog, buildPayload, addDays };
