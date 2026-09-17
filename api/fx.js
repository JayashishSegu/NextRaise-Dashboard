// GET /api/fx - the one place USD to INR is decided for every surface.
// Returns { rate, asOf, source, note }. index.html and widget.html both read
// this, so the dashboard, the widget and the marketing report can no longer
// print three different totals for the same money.
//
// BUDGET: this endpoint issues ZERO PostHog queries. It reads no bytes against
// the 20 GB/hour API read budget, and it is not on the /api/overview path, so
// it cannot slow the cold overview or the warm edge hit.
const { resolveFx, FX_FALLBACK } = require('../lib/fx');

module.exports = async function handler(req, res) {
  let fx;
  try {
    fx = await resolveFx();
  } catch (e) {
    fx = { rate: FX_FALLBACK, asOf: null, source: 'fallback', note: 'rate lookup failed' };
  }
  // A real rate is edge-cached for 6h, then served stale for a day while one
  // request revalidates, so every browser in a region reads a byte-identical
  // number and the origin runs a handful of times a day. A fallback gets a
  // 60s TTL instead, so a bad minute is not pinned to the edge for 6 hours.
  const sMax = fx.source === 'fallback' ? 60 : 21600;
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${sMax}, stale-while-revalidate=86400`);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(fx);
};
