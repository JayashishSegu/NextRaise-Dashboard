# Creator earnings endpoint

`GET /api/creator-earnings?t=<signed link token>` returns one creator's `EarningsPayload` for the Earnings tab (app: `~/nextraise-creator-earnings/app`, contract: `app/src/lib/types.ts`). Code: `api/creator-earnings.js`, `lib/creatorEarnings.js`, `scripts/creator-link.js`. Tests: `node --test test/`. Staff can look up any creator with `?code=<REFERRAL CODE>` behind the existing unlock code.

## Where each number comes from
| Shown | Source |
|---|---|
| Sign-ups per IST day | PostHog warehouse `postgres.users` where `referred_by_id` = the creator's id (internal and test emails excluded, same filters as the Overview) |
| Payments, plans | `postgres.payments`, `status='completed'`, for those people. USD converted with `lib/fx.js` (the rate the whole dashboard uses). First payment per person is "new", later ones "renewal" |
| Which reel a sign-up came from | PostHog `persons` first-touch `$initial_utm_campaign`, read as `..._reel_YYYY_MM_DD`. Best effort: if the lookup fails the money is unaffected |
| Deal: reel fee, commission % | Google Sheets pipeline tab (via the Apps Script into Redis `influencer:sheets:v1`), matched on **Referral Code**. Optional column `Commission %`; else `CREATOR_COMMISSION_PCT` (30) |
| Reels and Instagram views | Sheets "Video Stats" tab (creator, video link, live date, views). No live Instagram call: creators' reels are not on NextRaise's connected Instagram account |
| Payouts, "Lifetime paid" | Sheets payments already marked Paid for that code. Everything on or before the latest payout day shows as Paid |

## Access
Each creator gets a link: `CREATOR_LINK_SECRET=... node scripts/creator-link.js ABC123 --days 365 --base https://<app>`. The token is `CODE.expiry.signature`, so a creator can only read the code it was minted for. Changing `CREATOR_LINK_SECRET` revokes every link. Emails are masked before they leave the server. Responses are `private, no-store`; a warm instance keeps one for 3 minutes.

## To go live (not done yet)
1. Vercel env on the dashboard project: `CREATOR_LINK_SECRET` (long random), `CREATOR_APP_ORIGINS` (the app's origin), and check `PH_API_KEY` and `KV_*` are already set. Optional: `CREATOR_HOLD_DAYS` (7), `CREATOR_MIN_PAYOUT` (500), `CREATOR_PAYOUT_DAY` (15).
2. Deploy the dashboard repo, host `app/` (set `VITE_EARNINGS_API=https://<dashboard>/api/creator-earnings` at build).
3. Mint a link per creator and test with one before sending.
4. Reading the tab from inside the NextRaise app later only needs the app to pass the same token (or a session check in place of it).

## Known limits
- Refunds are not recorded anywhere in the database (no refunded status, and Pro is sold as non-refundable), so a payment is never shown as Reversed from real data. The 7 days are a holding period.
- Per-reel sign-up split only works for people whose first touch was the reel's own tagged link; others land under "Bio link and code".
- "Paid" is inferred from payout dates in the sheet, not matched payment by payment.
- Verified on live PostHog with aggregate queries (counts, sums) for one creator; the full endpoint has run only against fixtures and the stub (`node scripts/creator-earnings-stub.js`), because the production keys live in Vercel.
