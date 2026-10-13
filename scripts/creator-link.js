#!/usr/bin/env node
// Mint a creator's personal earnings link.
//
//   CREATOR_LINK_SECRET=... node scripts/creator-link.js ABC123 [--days 365] [--base https://earnings.example.com]
//
// Prints the link. The token only proves "this person may read the earnings of ABC123"; it carries no email, no name.
// To revoke every link at once, change CREATOR_LINK_SECRET. To revoke one creator, let it expire (--days 30 for trials).
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
  const token = mintToken(process.env.CREATOR_LINK_SECRET, code, Number(flag('--days', 365)));
  console.log(`${flag('--base', 'http://localhost:3491')}/?t=${token}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
