#!/usr/bin/env node
// Guards against the "Refresh shows the same old data and says nothing" failure.
//
// For each combo it presses Refresh the way the dashboard does (fresh=<timestamp>) and
// requires ONE of these outcomes, otherwise it exits 1:
//   - the numbers are new (source "compute", age under 2 minutes), or
//   - the response says why nothing was recomputed (capped / timedOut / busy / refreshFailed / budget)
// AND the press must come back within 34 seconds (the promise made to the person pressing it).
// An old snapshot returned with no explanation is the bug this exists to catch.
//
//   node scripts/check-refresh.js [baseUrl]
const BASE = (process.argv[2] || 'https://nextraise-dashboard-blue.vercel.app').replace(/\/+$/, '');
const LIMIT_MS = 34000;
const COMBOS = [['today', 'overall'], ['7d', 'overall'], ['today', 'influencer'], ['today', 'perf']];

async function press(range, view) {
  const url = `${BASE}/api/overview?range=${range}&view=${view}&fresh=${Date.now()}`;
  const t0 = Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  const ms = Date.now() - t0;
  const j = await res.json().catch(() => ({}));
  const age = typeof j.ageSec === 'number' ? j.ageSec : null;
  const explained = j.capped || j.timedOut || j.busy || j.refreshFailed || j.budget || j.source === 'snapshot-recent';
  const isNew = j.source === 'compute' && age !== null && age < 120;
  let verdict = 'FAIL';
  let why = `source=${j.source} age=${age}s with no explanation`;
  if (res.status !== 200) why = `HTTP ${res.status} ${j.error || ''}`.trim();
  else if (isNew) { verdict = 'ok'; why = `recomputed (${age}s old)`; }
  else if (explained) { verdict = 'ok'; why = `not recomputed, and says why: ${j.source}${j.capped ? ` (capped, resets in ${Math.ceil((j.retryAfterSec || 0) / 60)} min)` : ''}${j.refreshFailed ? ' (failed)' : ''}`; }
  if (verdict === 'ok' && ms > LIMIT_MS) { verdict = 'FAIL'; why = `took ${Math.round(ms / 1000)}s, over the ${LIMIT_MS / 1000}s limit (${why})`; }
  console.log(`${verdict.padEnd(4)} ${range}/${view}  ${ms}ms  ${why}`);
  return verdict === 'ok';
}

(async () => {
  let allOk = true;
  for (const [r, v] of COMBOS) allOk = (await press(r, v)) && allOk;
  console.log(allOk ? '\nRefresh behaves: every press produced new data or an honest explanation.' : '\nREFRESH PROBLEM: a press returned old data without saying why.');
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error('check failed to run:', e.message); process.exit(2); });
