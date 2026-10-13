#!/usr/bin/env node
// Mint a creator's personal earnings link.
//
//   CREATOR_LINK_SECRET=... node scripts/creator-link.js ABC123 [--days 365] [--base https://earnings.example.com]
//
// A link only works while the creator has access in the registry at the same --ver (default 1). Normally links are given
// from the admin page (/creator-program); this script is for testing.
// Prints the link. The token only proves "this person may read the earnings of ABC123"; it carries no email, no name.
// To revoke: use the admin page (Revoke), or change CREATOR_LINK_SECRET to end every link at once.
const { mintToken } = require('../lib/creatorEarnings');

const args = process.argv.slice(2);
const code = (args.find((a) => !a.startsWith('--')) || '').toUpperCase();
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (!code) {
  console.error('usage: CREATOR_LINK_SECRET=... node scripts/creator-link.js <REFERRAL_CODE> [--days 365] [--base https://...]');
  process.exit(1);
}
try {
  const token = mintToken(process.env.CREATOR_LINK_SECRET, code, { ver: Number(flag('--ver', 1)), ttlDays: Number(flag('--days', 365)) });
  console.log(`${flag('--base', 'http://localhost:3491')}/?t=${token}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
