'use strict';
// One fake creator, in the shapes the sheet sync and PostHog return. Used by the tests and the dev stub.

const months = [
  {
    month: '2026-10',
    pipeline: [
      ['Name', 'IG Handle', 'Referral Code', 'Fee (Rs)', 'Fixed Fee (Rs)', 'Bonus Earned (Rs)', 'Commission Earned (Rs)', 'Total Payout (Rs)', 'Payment Status', 'Payment Date', 'Video Live Date', 'Commission %'],
      ['Sample Creator', '@sample', 'abc123', '450/video', '2,500', '0', '0', '2,500', 'Paid', '10/01/2026', '10/11/2026', '25'],
      ['Someone Else', '@else', 'ZZZ999', '', '9,999', '', '', '9,999', 'Paid', '10/02/2026', '10/12/2026', ''],
    ],
    videos: [
      ['Creator', 'Video Link', 'Campaign', 'Video Live Date', 'Views', 'Likes', 'Comments'],
      ['Sample Creator', 'https://www.instagram.com/reel/AAA/?igsh=x', 'c', '10/11/2026', '22,028', '369', '106'],
      ['Someone Else', 'https://www.instagram.com/reel/BBB/', 'c', '10/12/2026', '1', '1', '1'],
    ],
  },
];

const raw = {
  creator: { id: 'u1', name: 'Sample Creator' },
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

module.exports = { months, raw };
