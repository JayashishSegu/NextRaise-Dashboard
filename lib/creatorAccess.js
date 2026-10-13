'use strict';
// Who has been given access to their earnings page, kept in Redis (hash `creator:access:v1`, one field per referral
// code). A creator's link carries the access version it was minted at (lib/creatorEarnings.js mintToken), and the
// earnings endpoint only answers when the registry says that creator is enabled at that same version. So:
//   grant   creates the entry (version 1), or turns a revoked creator back on with a higher version
//   revoke  switches the creator off; every link they hold stops working at once
//   rotate  raises the version: the old link dies, a new one is minted (use when a link was shared by mistake)
// A creator signs in with their referral code (lib/creatorSignin.js), which is public, so the registry is what decides who
// may: only creators switched on here can sign in, and revoke ends their sessions at once.
// The functions below are pure (they return the new entry); the KV helpers at the bottom read and write it.

const KEY = 'creator:access:v1';

const status = (e) => (!e ? 'none' : e.enabled ? 'active' : 'revoked');

function grant(entry, person, now) {
  if (!entry) {
    return { code: person.code, name: person.name || '', email: person.email || '', enabled: true, ver: 1, grantedAt: now, issuedAt: now, lastSeenAt: null, opens: 0 };
  }
  if (entry.enabled) return { ...entry, name: person.name || entry.name, email: person.email || entry.email };
  return { ...entry, enabled: true, ver: entry.ver + 1, grantedAt: now, issuedAt: now, revokedAt: null };
}

function revoke(entry, now) {
  if (!entry) return null;
  return { ...entry, enabled: false, revokedAt: now };
}

function rotate(entry, now) {
  if (!entry || !entry.enabled) return null;
  return { ...entry, ver: entry.ver + 1, issuedAt: now };
}

/** Does this entry let a link minted at `ver` through? */
const canOpen = (entry, ver) => !!entry && entry.enabled === true && entry.ver === ver;

const touch = (entry, now) => ({ ...entry, lastSeenAt: now, opens: (entry.opens || 0) + 1 });

/** The registry fields the admin page may see (never anything about the creator's earnings). */
const publicView = (entry) => (entry ? { status: status(entry), ver: entry.ver, grantedAt: entry.grantedAt || null, issuedAt: entry.issuedAt || null, lastSeenAt: entry.lastSeenAt || null, opens: entry.opens || 0 } : { status: 'none', ver: 0, grantedAt: null, issuedAt: null, lastSeenAt: null, opens: 0 });

async function loadAll(kv) {
  const all = (kv && (await kv.hgetall(KEY))) || {};
  return new Map(Object.values(all).filter((e) => e && e.code).map((e) => [String(e.code).toUpperCase(), e]));
}
const load = async (kv, code) => (kv ? kv.hget(KEY, String(code).toUpperCase()) : null);
const save = (kv, entry) => kv.hset(KEY, { [entry.code]: entry });

module.exports = { KEY, status, grant, revoke, rotate, canOpen, touch, publicView, loadAll, load, save };
