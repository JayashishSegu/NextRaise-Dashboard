// Operational lookups that return personal data. Reached only through
// api/ops.js, behind lib/gate.js. Postgres-backed (postgres.* tables through
// HogQL), so none of this touches the events table and the PostHog read budget
// is not at risk.
const { makeRunner } = require('./overview');

const NOT_INTERNAL_USER = `u.email NOT LIKE '%@nextraise.ai' AND u.email NOT LIKE '%@creditdharma.in' AND lower(u.email) NOT LIKE '%test%'`;

// Active Pro = a live Pro subscription row. Same definition as the Overview tile
// (lib/overview.js PG_PRO_EMAILS), so the Pro Users count reconciles with it.
const PRO_USER_IDS = `SELECT user_id FROM postgres.subscriptions WHERE status='active' AND positionCaseInsensitive(plan,'pro') > 0`;

// Free text from the browser goes into HogQL by string interpolation, so the
// allowed alphabet is cut down to what names and emails need. Quotes,
// backslashes, percent signs and semicolons cannot survive this.
function cleanQuery(raw) {
  return String(raw || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}@._+\- ]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .toLowerCase();
}

const lit = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const inList = arr => arr.map(lit).join(',');
const s = v => (v == null || v === '' ? null : String(v));

async function computeSearch(env, rawQ) {
  const q = cleanQuery(rawQ);
  if (q.length < 2) return { q, accounts: [] };
  const state = { budgetHit: null, usedStale: false };
  const run = makeRunner(env, state);

  const usersR = await run(`
      SELECT toString(u.id), u.email, u.name, u.plan_cache, u.sub_status,
             toString(u.sub_end_date), toString(u.created_at), u.referral_code, toString(u.referred_by_id)
      FROM postgres.users u
      WHERE lower(u.email) LIKE ${lit('%' + q + '%')}
         OR lower(coalesce(u.name,'')) LIKE ${lit('%' + q + '%')}
         OR u.id IN (
              SELECT user_id FROM postgres.resumes
              WHERE lower(concat(coalesce(first_name,''),' ',coalesce(last_name,''))) LIKE ${lit('%' + q + '%')})
      ORDER BY lower(u.email) = ${lit(q)} DESC, u.created_at DESC
      LIMIT 15`, 'nr-ops:search:users');
  const users = usersR.results || [];
  if (!users.length) return { q, accounts: [] };

  const ids = users.map(r => r[0]);
  const emails = users.map(r => String(r[1] || '').toLowerCase());
  const refIds = [...new Set(users.map(r => r[8]).filter(Boolean))];

  const [payR, resR, refR] = await Promise.all([
    run(`
      SELECT lower(user_email), plan_key, amount, currency, status, toString(created_at), provider
      FROM postgres.payments
      WHERE lower(user_email) IN (${inList(emails)})
      ORDER BY created_at DESC LIMIT 400`, 'nr-ops:search:pay'),
    run(`
      SELECT toString(user_id), coalesce(first_name,''), coalesce(last_name,''),
             JSONExtractString(resume_data,'personalInfo','phone'), coalesce(personal_email,'')
      FROM postgres.resumes
      WHERE user_id IN (${inList(ids)}) LIMIT 400`, 'nr-ops:search:resumes'),
    refIds.length
      ? run(`SELECT toString(id), name, email, referral_code FROM postgres.users WHERE toString(id) IN (${inList(refIds)}) LIMIT 50`, 'nr-ops:search:referrer')
      : Promise.resolve({ results: [] }),
  ]);

  const payBy = new Map(), resBy = new Map(), refBy = new Map();
  for (const r of payR.results || []) {
    const k = r[0];
    if (!payBy.has(k)) payBy.set(k, []);
    payBy.get(k).push({ plan: s(r[1]), amount: +r[2] || 0, currency: s(r[3]), status: s(r[4]), at: s(r[5]), provider: s(r[6]) });
  }
  for (const r of resR.results || []) {
    if (!resBy.has(r[0])) resBy.set(r[0], []);
    resBy.get(r[0]).push({ name: `${r[1]} ${r[2]}`.trim() || null, phone: s(r[3]), email: s(r[4]) });
  }
  for (const r of refR.results || []) refBy.set(r[0], { name: s(r[1]), email: s(r[2]), code: s(r[3]) });

  const accounts = users.map(r => {
    const email = String(r[1] || '');
    const pays = payBy.get(email.toLowerCase()) || [];
    const done = pays.filter(p => p.status === 'completed');
    return {
      id: r[0], email, name: s(r[2]), plan: s(r[3]), status: s(r[4]), subEnd: s(r[5]), createdAt: s(r[6]),
      referralCode: s(r[7]),
      referredBy: r[8] ? refBy.get(r[8]) || { name: null, email: null, code: null } : null,
      paid: {
        inr: done.filter(p => p.currency === 'INR').reduce((a, p) => a + p.amount, 0),
        usd: done.filter(p => p.currency === 'USD').reduce((a, p) => a + p.amount, 0),
        count: done.length,
        last: done[0] ? done[0].at : null,
      },
      payments: pays.slice(0, 20),
      resumes: resBy.get(r[0]) || [],
    };
  });
  return { q, accounts };
}


module.exports = { computeSearch, cleanQuery };
