// Gate for endpoints that return personal data (emails, phone numbers, per-user
// payment history). A request passes with EITHER:
//   - the unlock cookie issued by /api/unlock after the owner enters
//     NR_ACCESS_CODE (an HMAC of the code under NR_GATE_KEY, HttpOnly), or
//   - the shared key in the x-nr-gate header (server-to-server callers).
//
// Fail closed: with NR_GATE_KEY or NR_ACCESS_CODE unset every gated call is
// refused, so shipping this file exposes nothing until both are configured.
const crypto = require('crypto');

const COOKIE = 'nr_unlock';

function unlockToken() {
  const key = process.env.NR_GATE_KEY;
  const code = process.env.NR_ACCESS_CODE;
  if (!key || !code) return null;
  return crypto.createHmac('sha256', key).update(`unlock:${code}`).digest('hex');
}

function same(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function cookieValue(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function isUnlocked(req) {
  const token = unlockToken();
  if (!token) return false;
  if (same(cookieValue(req, COOKIE), token)) return true;
  const header = req.headers['x-nr-gate'];
  return !!header && same(header, process.env.NR_GATE_KEY);
}

function requireGate(req, res) {
  if (!unlockToken()) {
    res.status(503).json({ error: 'NR_GATE_KEY and NR_ACCESS_CODE are not configured on this deployment', code: 'gate-unset' });
    return false;
  }
  if (!isUnlocked(req)) {
    res.status(401).json({ error: 'Unlock required', code: 'locked' });
    return false;
  }
  return true;
}

// Open mode: NR_GATE_OPEN=1 lets every READ through without the unlock code. Writes that
// change records (adding or deleting a payment) still use requireGate. Remove the variable
// and redeploy to lock the personal-data screens again.
function isOpen() {
  return process.env.NR_GATE_OPEN === '1';
}

function requireRead(req, res) {
  return isOpen() ? true : requireGate(req, res);
}

module.exports = { requireGate, requireRead, isOpen, isUnlocked, unlockToken, same, COOKIE };
