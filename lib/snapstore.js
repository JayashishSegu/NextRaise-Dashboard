// lib/snapstore.js - durable snapshot store + single-flight lock for /api/overview.
//
// Speaks the Upstash Redis REST protocol straight over fetch (POST the command
// as a JSON array, bearer token), so there is no new npm dependency and nothing
// to build. Vercel injects KV_REST_API_URL / KV_REST_API_TOKEN when you attach an
// Upstash Redis store from the Marketplace; a database attached directly from
// Upstash uses UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Both names are
// read. NOTE: this speaks Upstash REST specifically. A non-Upstash Redis from the
// Marketplace will not answer these calls, and enabled() will still report true,
// so every call simply returns null and the caller computes inline as it does
// today. Verify with the curl in verifyHow before trusting the gain.
//
// EVERYTHING HERE FAILS OPEN. If the store is missing, unreachable or slow, every
// call returns null/false and the caller behaves exactly as it did before there
// was a store. A cache must never be able to take the dashboard down.
//
// Snapshot layout, per (view, range, window):
//   ov:v1:<view>:<range>:<start>_<end>      full JSON payload (TTL 3 days)
//   ov:v1:<view>:<range>:<start>_<end>:at   computedAt only, as a number, so the
//                                           cron can read 21 ages in one small
//                                           pipeline instead of 21 payloads
//   ov:v1:lock:<same suffix>                single-flight lock (TTL 90s)
//   ov:v1:rl:<YYYY-MM-DDTHH>                computes started this clock hour

const DEFAULT_TIMEOUT_MS = 2500;

function restUrl(env) {
  const u = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '';
  return u ? String(u).replace(/\/+$/, '') : '';
}
function restToken(env) {
  return env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
}
function enabled(env) {
  return !!(restUrl(env) && restToken(env));
}

async function post(env, path, body, timeoutMs) {
  const base = restUrl(env), token = restToken(env);
  if (!base || !token) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const r = await fetch(base + path, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) {
    return null;                       // aborted, DNS, 5xx - treat as "no store"
  } finally {
    clearTimeout(timer);
  }
}

// One command. Returns the raw `result`, or null on any failure.
async function cmd(env, args, timeoutMs) {
  const j = await post(env, '', args, timeoutMs);
  if (!j || j.error) return null;
  return ('result' in j) ? j.result : null;
}

// Several commands in one round trip. Returns an array of results (null per
// failed entry), or null if the whole call failed.
async function pipeline(env, cmds, timeoutMs) {
  if (!cmds.length) return [];
  const j = await post(env, '/pipeline', cmds, timeoutMs);
  if (!Array.isArray(j)) return null;
  return j.map(x => (x && !x.error && 'result' in x) ? x.result : null);
}

// The window (start/end IST dates) is part of the key on purpose: when IST
// midnight rolls over, "today" and "7d" become different windows and get
// different keys, so a snapshot can never be served under a window it does not
// belong to. Yesterday's numbers are never labelled Today.
function snapKey(view, range, bounds) {
  return `ov:v1:${view}:${range}:${bounds.startDate}_${bounds.endDate}`;
}
const atKey   = k => k + ':at';
const lockKey = k => k.replace(/^ov:v1:/, 'ov:v1:lock:');

async function getSnapshot(env, key, timeoutMs) {
  const raw = await cmd(env, ['GET', key], timeoutMs || 2500);
  if (!raw) return null;
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return (v && v.data && Array.isArray(v.data.counts) && v.computedAt) ? v : null;
  } catch (_) { return null; }
}

async function putSnapshot(env, key, payload, ttlSec) {
  const ttl = String(Math.max(60, ttlSec | 0) || 259200);
  const res = await pipeline(env, [
    ['SET', key, JSON.stringify(payload), 'EX', ttl],
    ['SET', atKey(key), String(payload.computedAt || Date.now()), 'EX', ttl],
  ], 6000);
  return !!(res && res[0] === 'OK');
}

// computedAt for many keys in one round trip - what the cron uses to decide what
// is stale without ever downloading a payload.
async function getComputedAts(env, keys) {
  if (!keys.length) return [];
  const res = await pipeline(env, keys.map(k => ['GET', atKey(k)]), 4000);
  if (!res) return keys.map(() => null);
  return res.map(v => (v === null || v === undefined || v === '') ? null : (+v || null));
}

// SET NX EX. The winner computes; everyone else waits for the winner's snapshot.
// Returns { ok, token }. ok:false means the store itself did not answer (not
// configured, timed out, 5xx) - the caller must then just compute, NOT wait for a
// winner that does not exist. ok:true with token:null means somebody really does
// hold the lock.
async function acquireLock(env, key, ttlSec) {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const j = await post(env, '', ['SET', lockKey(key), token, 'NX', 'EX', String(ttlSec | 0 || 90)], 2500);
  if (!j || j.error) return { ok: false, token: null };
  return { ok: true, token: j.result === 'OK' ? token : null };
}
async function releaseLock(env, key, token) {
  if (!token) return;
  const held = await cmd(env, ['GET', lockKey(key)], 2000);
  if (held === token) await cmd(env, ['DEL', lockKey(key)], 2000);
}

// Wait for whoever holds the lock to publish something newer than `afterMs`.
// Polls the tiny :at key, and only pulls the payload once it has actually moved.
async function waitForNewer(env, key, afterMs, budgetMs, pollMs) {
  const deadline = Date.now() + Math.max(0, budgetMs | 0);
  const step = Math.max(250, pollMs | 0 || 700);
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, step));
    const ats = await getComputedAts(env, [key]);
    const at = ats[0];
    if (at && at > (afterMs || 0)) {
      const snap = await getSnapshot(env, key, 3000);
      if (snap) return snap;
    }
  }
  return null;
}

// The hard stop on PostHog reads. Every compute attempt increments the counter
// for the current clock hour before it runs; over the limit, nobody computes and
// the caller serves the last snapshot instead. Returns the count AFTER
// incrementing, or null when there is no store (in which case the caller falls
// back to the old uncapped behaviour, which is what it does today anyway).
function hourKey() {
  return 'ov:v1:rl:' + new Date().toISOString().slice(0, 13);   // YYYY-MM-DDTHH, UTC
}
async function reserveCompute(env) {
  const key = hourKey();
  const res = await pipeline(env, [['INCR', key], ['EXPIRE', key, '7200']], 2500);
  if (!res || res[0] === null) return null;
  return +res[0] || null;
}
// Read the counter without spending one (used by the cron to decide how many
// combos it may warm this tick). Returns null only when the store did not answer;
// a missing key is 0, not null.
async function computesThisHour(env) {
  const res = await pipeline(env, [['GET', hourKey()]], 2000);
  if (!res) return null;
  return +res[0] || 0;
}

module.exports = {
  enabled, snapKey, getSnapshot, putSnapshot, getComputedAts,
  acquireLock, releaseLock, waitForNewer, reserveCompute, computesThisHour,
};
