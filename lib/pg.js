// Direct-to-postgres client for the operational database that holds the
// payments and users tables. Every read in this file bypasses PostHog's
// HogQL layer (which round-trips through ClickHouse and adds ~200-400ms
// per query), talking to the source of truth instead.
//
// Enabled when POSTGRES_URL or DATABASE_URL is set in Vercel env vars. If
// neither is set, hasDirectDb() returns false and the caller falls back to
// the existing PostHog query path — no regression, just no speedup.
//
// Uses the pg Pool with size 1 per serverless invocation, cached at module
// scope so a warm function reuses the connection across requests. This
// matches Vercel's own guidance for pg in Node functions.

const { Pool } = require('pg');

let _pool = null;
let _tried = false;

function connectionString() {
  return process.env.POSTGRES_URL
      || process.env.DATABASE_URL
      || process.env.POSTGRES_URL_NON_POOLING
      || null;
}

function hasDirectDb() {
  return !!connectionString();
}

function getPool() {
  if (_pool) return _pool;
  if (_tried) return null;
  _tried = true;
  const url = connectionString();
  if (!url) return null;
  try {
    _pool = new Pool({
      connectionString: url,
      max: 1,
      // Vercel serverless functions get killed within seconds — keep the
      // idle timeout low so a stray pool doesn't linger.
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      // Managed postgres (Neon, Supabase, Vercel Postgres) all require SSL.
      // rejectUnauthorized:false covers self-signed certs; explicit
      // sslmode=require in the URL takes precedence over this fallback.
      ssl: /sslmode=/.test(url) ? undefined : { rejectUnauthorized: false },
    });
  } catch (e) {
    _pool = null;
  }
  return _pool;
}

/** Run a parameterised query. Returns `rows` array, or null on failure. */
async function query(sql, params) {
  const pool = getPool();
  if (!pool) return null;
  try {
    const res = await pool.query(sql, params);
    return res.rows;
  } catch (e) {
    // Silent on failure so the caller can fall back to PostHog. The error
    // is logged for post-hoc debugging without breaking the request.
    console.warn('lib/pg query failed', String(e && e.message || e).slice(0, 300));
    return null;
  }
}

// ── Shared filters ─────────────────────────────────────────────────
// Same exclusion rules the PostHog path uses: no internal emails, no test
// accounts. Bucket filter is left off here; direct-postgres path is only
// used for the "overall" view, where bucket == everyone.
const EXCLUDE_SQL = `
  user_email NOT ILIKE '%@nextraise.ai'
  AND user_email NOT ILIKE '%@creditdharma.in'
  AND user_email NOT ILIKE '%test%'
`;

/**
 * Revenue aggregates for a window. Returns the same shape the PostHog
 * revenue query returned so lib/overview.js consumers don't change:
 *   { inr, usd, payers, inr_payers, usd_payers }
 * Null if the query failed or the direct DB isn't configured.
 */
async function getRevenue({ startDate, endDate, view }) {
  if (view && view !== 'overall') return null; // bucket views stay on PostHog
  const rows = await query(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE currency = 'INR'), 0)::float AS inr,
      COALESCE(SUM(amount) FILTER (WHERE currency = 'USD'), 0)::float AS usd,
      COUNT(DISTINCT user_email)                                         AS payers,
      COUNT(DISTINCT user_email) FILTER (WHERE currency = 'INR')         AS inr_payers,
      COUNT(DISTINCT user_email) FILTER (WHERE currency = 'USD')         AS usd_payers
    FROM payments
    WHERE status = 'completed'
      AND created_at >= $1::timestamptz
      AND created_at <  $2::timestamptz
      AND ${EXCLUDE_SQL}
  `, [startDate + ' 00:00:00', endDate + ' 00:00:00']);
  if (!rows || !rows.length) return null;
  const r = rows[0];
  return [+r.inr || 0, +r.usd || 0, +r.payers || 0, +r.inr_payers || 0, +r.usd_payers || 0];
}

/**
 * Current + prior window revenue aggregates in one round-trip. Matches the
 * pgRevenueTotals PostHog query shape: [inr_cur, usd_cur, inr_prev, usd_prev, pay_prev].
 */
async function getRevenueTotals({ startDate, endDate, prevStartDate, view }) {
  if (view && view !== 'overall') return null;
  const rows = await query(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE currency='INR' AND created_at >= $1::timestamptz AND created_at < $2::timestamptz), 0)::float AS inr_cur,
      COALESCE(SUM(amount) FILTER (WHERE currency='USD' AND created_at >= $1::timestamptz AND created_at < $2::timestamptz), 0)::float AS usd_cur,
      COALESCE(SUM(amount) FILTER (WHERE currency='INR' AND created_at >= $3::timestamptz AND created_at < $1::timestamptz), 0)::float AS inr_prev,
      COALESCE(SUM(amount) FILTER (WHERE currency='USD' AND created_at >= $3::timestamptz AND created_at < $1::timestamptz), 0)::float AS usd_prev,
      COUNT(*) FILTER (WHERE created_at >= $3::timestamptz AND created_at < $1::timestamptz) AS pay_prev
    FROM payments
    WHERE status = 'completed'
      AND created_at >= $3::timestamptz
      AND created_at <  $2::timestamptz
      AND ${EXCLUDE_SQL}
  `, [startDate + ' 00:00:00', endDate + ' 00:00:00', prevStartDate + ' 00:00:00']);
  if (!rows || !rows.length) return null;
  const r = rows[0];
  return [+r.inr_cur || 0, +r.usd_cur || 0, +r.inr_prev || 0, +r.usd_prev || 0, +r.pay_prev || 0];
}

/**
 * Daily payment rollup for the window. Returns [[day, cnt, inr, usd], ...]
 * — same shape as the PostHog dailyPay query, ordered by day ascending.
 */
async function getDailyPay({ startDate, endDate, view }) {
  if (view && view !== 'overall') return null;
  const rows = await query(`
    SELECT
      to_char((created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day,
      COUNT(*)::int                                               AS cnt,
      COALESCE(SUM(amount) FILTER (WHERE currency = 'INR'), 0)::float AS inr,
      COALESCE(SUM(amount) FILTER (WHERE currency = 'USD'), 0)::float AS usd
    FROM payments
    WHERE status = 'completed'
      AND created_at >= $1::timestamptz
      AND created_at <  $2::timestamptz
      AND ${EXCLUDE_SQL}
    GROUP BY 1
    ORDER BY 1
    LIMIT 200
  `, [startDate + ' 00:00:00', endDate + ' 00:00:00']);
  if (!rows) return null;
  return rows.map(r => [r.day, +r.cnt || 0, +r.inr || 0, +r.usd || 0]);
}

module.exports = {
  hasDirectDb,
  getRevenue,
  getRevenueTotals,
  getDailyPay,
};
