'use strict';
// One fake creator, in the shapes the sheet sync and PostHog return. Used by the tests and the dev stub.
// The pipeline tab copies the real monthly sheets (Aug, Sep, Oct 2026): a group-header row, then the column row.

const HEAD = ['Status Tag', 'Name', 'IG Handle', 'Email', 'Fee (Rs)', 'Deal Type', 'Referral Code', 'Pipeline Stage', 'Video Live Date', 'Video Link', 'Views', 'Likes', 'Comments', 'Payment Status', 'Payment Date', 'Commission Earned (Rs)', 'Payment status', 'Date', 'Commission Earned (Rs) (2)', 'Payment Status (2)', 'Date', 'Internal Notes'];
const row = (o) => HEAD.map((h, i) => (o[i] === undefined ? '' : o[i]));

const months = [
  {
    month: '2026-10',
    pipeline: [
      ['', 'PROFILE', '', '', 'FEE', '', 'ATTRIBUTION'],
      HEAD,
      // Sample Creator: 2,500 fee paid 10/01, first commission block paid 10/05 (Rs 400), 25% commission in the notes.
      row({ 0: 'LIVE', 1: 'Sample Creator', 2: '@sample', 4: '2,500', 5: '2500 + commission', 6: 'abc123', 7: 'Live - Paid', 8: '10/11/2026', 9: 'https://www.instagram.com/reel/AAA/?igsh=x', 10: '22,028', 11: '369', 12: '106', 13: 'Paid', 14: '10/01/2026', 15: '400', 16: 'Paid', 17: '10/05/2026', 21: '1R. 25% commission, no bonus. 10% audience discount.' }),
      row({ 1: 'Someone Else', 2: '@else', 4: '9,999', 6: 'ZZZ999', 8: '10/12/2026', 9: 'https://www.instagram.com/reel/BBB/', 10: '1', 13: 'Paid', 14: '10/02/2026' }),
    ],
    videos: [],
  },
];

const raw = {
  creator: { id: 'u1', name: 'Sample Creator', email: 'sample@creator.test' },
  users: [
    { email: 'ku@gmail.com', day: '2026-10-11' },
    { email: 'ay@gmail.com', day: '2026-10-11' },
    { email: 'old@gmail.com', day: '2026-09-22' },
  ],
  payments: [
    { email: 'old@gmail.com', plan: 'resume-builder-pro-3', amount: 1399, currency: 'INR', at: '2026-09-22 22:29:00' },
    { email: 'ku@gmail.com', plan: 'resume-builder-pro-3', amount: 1539, currency: 'INR', at: '2026-10-11 14:51:00' },
    { email: 'ay@gmail.com', plan: 'resume-builder-pro-5', amount: 47.19, currency: 'USD', at: '2026-10-11 23:50:00' },
    { email: 'ku@gmail.com', plan: 'resume-builder-pro-1', amount: 879, currency: 'INR', at: '2026-10-12 09:00:00' },
  ],
  campaigns: new Map([
    ['ku@gmail.com', 'x_reel_2026_10_11'],
    ['ay@gmail.com', 'x_reel_2026_10_11'],
    ['old@gmail.com', 'x_instagram_influencer'],
  ]),
};

// September and October share a layout with Commission %, Fixed Fee, Bonus Earned and a lump Total Payout.
// Many rows there have no Referral Code, only an Email. July has no Referral Code column at all.
const SEP_HEAD = ['Status Tag', 'Name', 'IG Handle', 'Email', 'Fee (Rs)', 'Deal Type', 'Commission %', 'Performance Bonus', 'Referral Code', 'Pipeline Stage', 'Video Live Date', 'Video Link', 'Views', 'Likes', 'Comments', 'Payment Status', 'Payment Date', 'Fixed Fee (Rs)', 'Bonus Earned (Rs)', 'Commission Earned (Rs)', 'Total Payout (Rs)'];
const sepRow = (o) => SEP_HEAD.map((h, i) => (o[i] === undefined ? '' : o[i]));
const septemberMonth = {
  month: '2026-09',
  pipeline: [
    ['', 'PROFILE'],
    SEP_HEAD,
    sepRow({ 1: 'Sample Creator', 3: 'Sample@Creator.test', 4: '4000 flat', 6: '30%', 10: '09/01/2026', 11: 'https://www.instagram.com/reel/SEP1/', 12: '5,000', 15: 'Paid', 16: '09/10/2026', 20: '4,000' }),
    sepRow({ 1: 'Not Them', 3: 'other@creator.test', 4: '9999', 8: '', 10: '09/02/2026', 15: 'Paid', 16: '09/11/2026', 20: '9,999' }),
  ],
  videos: [],
};
const JUL_HEAD = ['Status Tag', 'Name', 'Email', 'Fee (Rs)', 'Video Live Date', 'Payment Status', 'Payment Date'];
const julyMonth = {
  month: '2026-07',
  pipeline: [['', 'PROFILE'], JUL_HEAD, ['LIVE', 'Sample Creator', 'sample@creator.test', '1,000', '07/05/2026', 'Paid', '07/06/2026']],
  videos: [],
};

module.exports = { months, raw, HEAD, septemberMonth, julyMonth };
