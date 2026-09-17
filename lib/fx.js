// USD to INR, resolved ONCE server-side and served by GET /api/fx, so every
// surface (dashboard, widget, report) converts with the same number and can
// show which number it was.
//
// Why this file exists: index.html used to fetch its own live rate (falling
// back to 94), widget.html hard-coded 95.51 and the report fell back to 84, so
// the same revenue rendered three different totals and ARPU and ROAS inherited
// the error. One resolution point removes that by construction.
//
// BUDGET: this is a plain HTTPS call to open.er-api.com, NOT a PostHog query,
// so it reads 0 bytes against the 20 GB/hour API read budget. It is also not on
// the /api/overview path at all, so it cannot lengthen the cold overview.

// The single documented fallback for the whole product. design/README.md:
// "only combined for ARPU/ROAS at 84 rupees per $1". Set FX_USD_INR in the
// environment to pin a fixed rate (no network call at all); anything else falls
// back to this and is LABELLED as a fallback in the UI, never presented as
// today's rate.
const FX_FALLBACK = 84;
const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const FX_TTL_MS = 6 * 3600 * 1000;    // one live lookup per instance per 6h
const FX_TIMEOUT_MS = 2500;           // never hold a function open on a dead provider

let _memo = null;   // { fx, ts } - successes only

const _plausible = r => typeof r === 'number' && isFinite(r) && r > 50 && r < 200;
const _day = ms => new Date(ms).toISOString().slice(0, 10);

function fallbackFx(reason) {
  return { rate: FX_FALLBACK, asOf: null, source: 'fallback', note: reason };
}

// Returns { rate, asOf: 'YYYY-MM-DD' | null, source: 'env'|'live'|'fallback', note }.
// asOf is null exactly when the rate is the fallback, which is how every client
// decides whether to print "rate as of <date>" or "fallback rate".
// Never rejects: a failure is a fallback, not an exception.
async function resolveFx() {
  const env = Number(process.env.FX_USD_INR);
  if (_plausible(env)) {
    return {
      rate: Math.round(env * 100) / 100,
      asOf: _day(Date.now()),
      source: 'env',
      note: 'fixed by FX_USD_INR',
    };
  }
  if (_memo && Date.now() - _memo.ts < FX_TTL_MS) return _memo.fx;

  let fx;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FX_TIMEOUT_MS);
  try {
    const r = await fetch(FX_URL, { signal: ctl.signal });
    const j = r.ok ? await r.json() : null;
    const rate = j && j.rates && Number(j.rates.INR);
    if (_plausible(rate)) {
      fx = {
        rate: Math.round(rate * 100) / 100,
        asOf: _day(j.time_last_update_unix ? j.time_last_update_unix * 1000 : Date.now()),
        source: 'live',
        note: 'open.er-api.com',
      };
    } else {
      fx = fallbackFx('rate provider returned no usable INR rate');
    }
  } catch (e) {
    fx = fallbackFx((e && e.name === 'AbortError') ? 'rate lookup timed out' : 'rate lookup failed');
  } finally {
    clearTimeout(timer);
  }
  // Memoise successes for the full TTL. A fallback is deliberately NOT memoised,
  // so one bad minute does not pin the whole instance to 84 for 6 hours.
  if (fx.source === 'live') _memo = { fx, ts: Date.now() };
  return fx;
}

module.exports = { resolveFx, FX_FALLBACK };
