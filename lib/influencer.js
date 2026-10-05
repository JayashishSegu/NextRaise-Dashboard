'use strict';
// Turns the raw sheet snapshots pushed by the Apps Script (api/influencer-sync.js)
// into creator payments, amounts still owed, and video stats.
//
// Rules from the influencer operations brief:
//   - match rows by creator name (Pipeline) or video link (Video Stats), never by
//     position, because the sheets get re-sorted;
//   - each video counts only in the month it went live, so videos are de-duplicated
//     by link across the monthly sheets.
//
// Nothing here guesses silently: a row that looks paid but whose amount cannot be
// read lands in `unread` so the dashboard can say so instead of dropping it.

const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const low = (s) => norm(s).toLowerCase();

/** "₹4,500", "Rs 4500", "4,500.50" -> number. Text like "450/video" is not an amount. */
function num(v) {
  const s = norm(v).replace(/[₹,]/g, '').replace(/^rs\.?\s*/i, '');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

const pad = (n) => String(n).padStart(2, '0');
function iso(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Sheet dates are MM/DD/YYYY; also accepts ISO and MM/DD (year taken from the sheet's month). */
function isoDate(v, fallbackYear) {
  const s = norm(v);
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const a = +m[1], b = +m[2];
    return a > 12 ? iso(+m[3], b, a) : iso(+m[3], a, b);
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m && fallbackYear) return iso(fallbackYear, +m[1], +m[2]);
  return null;
}

/** A status cell counts as paid only when it says paid and does not negate it. */
function isPaid(status) {
  const s = low(status);
  return /\bpaid\b/.test(s) && !/\b(not|part|partly|partially|pending|due)\b/.test(s); // "unpaid" has no word boundary before "paid"
}

/** Finds the header row: the first row (of the top few) that contains every needle. */
function findHeader(rows, needles) {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const cells = (rows[i] || []).map(low);
    if (needles.every((n) => cells.some((c) => c === n || c.startsWith(n)))) return i;
  }
  return -1;
}

function columns(headerRow) {
  const seen = new Map();
  (headerRow || []).forEach((h, idx) => {
    const k = low(h);
    if (!k) return;
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k).push(idx);
  });
  return (name, nth = 0) => {
    const list = seen.get(low(name));
    return list && list[nth] != null ? list[nth] : -1;
  };
}

function parsePipeline(month, rows) {
  const h = findHeader(rows, ['name', 'payment status']);
  if (h < 0) return { payments: [], owed: [], unread: [], found: false };
  const col = columns(rows[h]);
  const year = Number(month.slice(0, 4));
  const at = (r, name, nth) => {
    const i = col(name, nth);
    return i < 0 ? '' : r[i];
  };
  const payments = [];
  const owed = [];
  const unread = [];

  for (const r of rows.slice(h + 1)) {
    const name = norm(at(r, 'name'));
    if (!name) continue;
    const handle = norm(at(r, 'ig handle'));
    const code = norm(at(r, 'referral code'));

    // Up to three status/date pairs sit across the PAYMENT block (fee and bonus, then commission).
    const statuses = [
      [at(r, 'payment status', 0), at(r, 'payment date', 0)],
      [at(r, 'payment status', 1), at(r, 'date', 0)],
      [at(r, 'payment status (2)', 0), at(r, 'date', 1)],
    ];
    const paidPair = statuses.find(([s]) => isPaid(s));
    const anyStatusText = statuses.some(([s]) => norm(s));

    const total = num(at(r, 'total payout (rs)'));
    const parts = ['fixed fee (rs)', 'bonus earned (rs)', 'commission earned (rs)'].map((c) => num(at(r, c)) || 0);
    const summed = parts[0] + parts[1] + parts[2];
    const planFee = num(at(r, 'fee (rs)')); // only a plain number counts, "450/video" does not
    const amount = total && total > 0 ? total : summed > 0 ? summed : paidPair && planFee && planFee > 0 ? planFee : 0;

    if (paidPair) {
      if (amount > 0) {
        const date = isoDate(paidPair[1], year) || isoDate(at(r, 'video live date'), year) || `${month}-01`;
        const exact = !!isoDate(paidPair[1], year);
        payments.push({
          id: `sheet|${month}|${low(name)}`, creator: name, code, date, amount, handle,
          note: exact ? 'from sheet' : 'from sheet (payment date not filled in)', source: 'sheet',
        });
      } else if (!/commission[- ]only|only commission|no fee|barter|free/i.test(norm(at(r, 'fee (rs)')))) {
        // Commission-only deals have no fixed amount by design, so they are not warnings.
        unread.push({ month, creator: name, reason: 'marked paid but no amount found' });
      }
    } else if (anyStatusText && amount > 0 && !/^\s*(rejected|declined|dropped)/i.test(norm(at(r, 'pipeline stage')))) {
      owed.push({ month, creator: name, amount });
    }
  }
  return { payments, owed, unread, found: true };
}

function toInt(v) {
  const n = num(v);
  return n == null ? 0 : Math.round(n);
}

function parseVideos(month, rows) {
  const h = findHeader(rows, ['creator', 'video link']);
  if (h < 0) return [];
  const col = columns(rows[h]);
  const year = Number(month.slice(0, 4));
  const out = [];
  for (const r of rows.slice(h + 1)) {
    const link = norm(r[col('video link')]);
    if (!/^https?:\/\//i.test(link)) continue;
    out.push({
      link: link.replace(/[?#].*$/, '').replace(/\/+$/, ''),
      creator: norm(r[col('creator')]),
      campaign: norm(r[col('campaign')]),
      date: isoDate(r[col('video live date')], year),
      views: toInt(r[col('views')]),
      likes: toInt(r[col('likes')]),
      comments: toInt(r[col('comments')]),
      sheetMonth: month,
    });
  }
  return out;
}

/**
 * months: [{ month:'2026-10', syncedAt, pipeline:[[..]], videos:[[..]] }]
 * window: { start:'YYYY-MM-DD', end:'YYYY-MM-DD' } (end exclusive)
 */
function summarise(months, window) {
  const inWin = (d) => !!d && d >= window.start && d < window.end;
  const payments = [];
  const owed = [];
  const unread = [];
  const byLink = new Map();
  const status = [];

  for (const m of months || []) {
    if (!m || !/^\d{4}-\d{2}$/.test(m.month || '')) continue;
    const p = parsePipeline(m.month, m.pipeline || []);
    payments.push(...p.payments);
    owed.push(...p.owed);
    unread.push(...p.unread);
    const vids = parseVideos(m.month, m.videos || []);
    for (const v of vids) {
      // A video belongs to the month it went live: prefer the sheet of that month.
      const liveMonth = v.date ? v.date.slice(0, 7) : v.sheetMonth;
      const prev = byLink.get(v.link);
      if (!prev || (liveMonth === v.sheetMonth && prev.sheetMonth !== liveMonth)) byLink.set(v.link, v);
    }
    status.push({
      month: m.month, syncedAt: m.syncedAt || null, payments: p.payments.length,
      videos: vids.length, pipelineFound: p.found,
    });
  }

  const videos = [...byLink.values()].filter((v) => inWin(v.date));
  const sum = (k) => videos.reduce((n, v) => n + v[k], 0);
  const winMonths = new Set();
  for (let d = new Date(window.start + 'T00:00:00Z'); d < new Date(window.end + 'T00:00:00Z'); d = new Date(d.getTime() + 86400000)) {
    winMonths.add(d.toISOString().slice(0, 7));
  }
  return {
    payments: payments.filter((p) => inWin(p.date)),
    owed: owed.filter((o) => winMonths.has(o.month)),
    unread: unread.filter((u) => winMonths.has(u.month)),
    videos: {
      count: videos.length, views: sum('views'), likes: sum('likes'), comments: sum('comments'),
      top: videos.slice().sort((a, b) => b.views - a.views).slice(0, 5)
        .map((v) => ({ creator: v.creator, date: v.date, views: v.views, link: v.link })),
    },
    status,
  };
}

module.exports = { summarise, parsePipeline, parseVideos, isPaid, num, isoDate };
