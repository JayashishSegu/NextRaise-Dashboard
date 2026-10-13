# Creator earnings endpoint

`GET /api/creator-earnings?t=<signed link token>` returns one creator's `EarningsPayload` for the Earnings tab (app: `~/nextraise-creator-earnings/app`, contract: `app/src/lib/types.ts`). Code: `api/creator-earnings.js`, `lib/creatorEarnings.js`, `scripts/creator-link.js`. Tests: `node --test test/`. Staff can look up any creator with `?code=<REFERRAL CODE>` behind the existing unlock code.

## Where each number comes from
| Shown | Source |
|---|---|
| Sign-ups per IST day | PostHog warehouse `postgres.users` where `referred_by_id` = the creator's id (internal and test emails excluded, same filters as the Overview) |
| Payments, plans | `postgres.payments`, `status='completed'`, for those people. USD converted with `lib/fx.js` (the rate the whole dashboard uses). First payment per person is "new", later ones "renewal" |
| Which reel a sign-up came from | PostHog `persons` first-touch `$initial_utm_campaign`, read as `..._reel_YYYY_MM_DD`. Best effort: if the lookup fails the money is unaffected |
| Deal: reel fee | Google Sheets pipeline tab (via the Apps Script into Redis `influencer:sheets:v1`), matched on **Referral Code**, or on the account email when the row has no code. Fees can be free text ("4000 flat", "350/video") plus Bonus Earned |
| Commission rate | One rate for every creator: `CREATOR_COMMISSION_PCT`, default 30 (confirmed 14 Oct 2026). Sheet notes and the Commission % column are ignored on purpose |
| Reels and Instagram views | Sheets "Video Stats" tab (creator, video link, live date, views). No live Instagram call: creators' reels are not on NextRaise's connected Instagram account |
| Payouts, "Lifetime paid" | Sheets payments already marked Paid for that code. Everything on or before the latest payout day shows as Paid |

## Access (managed from the admin page)
The team gives influencers access at **`/creator-program`** on the dashboard (unlock code, same as the other private screens). It lists every creator with sign-ups, Pro revenue, fees, commission, return and what is owed, and per row: **Give access** (creates the link and copies it), **Copy link**, **Copy message** (a ready WhatsApp text), **New link** (replaces a link shared by mistake), **Revoke**. **Give access to everyone** creates links for every creator with a referral code and downloads a CSV (name, code, link); nothing is sent to anyone.

How it holds together: the registry (`lib/creatorAccess.js`, Redis hash `creator:access:v1`) records who has access and at which version. A link is `CODE.version.expiry.signature` (signed with `CREATOR_LINK_SECRET`) and `/api/creator-earnings` answers only while the registry says that creator is active at that version, so Revoke and New link work immediately, and a link for one code can never read another. Opens and last-opened are recorded. Links are returned only by `POST /api/creator-access` to someone who has unlocked the dashboard; the listing (`GET /api/creator-program`) never contains one. Emails are masked before they leave the server. Responses are `private, no-store`; a warm instance keeps one creator's page for 3 minutes and the program table for 5.

`scripts/creator-link.js` still mints a link for testing, but it only works if the creator has been given access on the admin page at that version.

## To go live (not done yet)
(Steps 1 to 3 below are done as of 14 Oct 2026.)
1. Vercel env on the dashboard project: `CREATOR_LINK_SECRET` (long random), `CREATOR_APP_ORIGINS` (the app's origin), and check `PH_API_KEY` and `KV_*` are already set. Optional: `CREATOR_HOLD_DAYS` (7), `CREATOR_MIN_PAYOUT` (500), `CREATOR_PAYOUT_DAY` (15).
2. Deploy the dashboard repo, host `app/` (set `VITE_EARNINGS_API=https://<dashboard>/api/creator-earnings` at build).
3. Mint a link per creator and test with one before sending.
4. Reading the tab from inside the NextRaise app later only needs the app to pass the same token (or a session check in place of it).

## Known limits
- Refunds are not recorded anywhere in the database (no refunded status, and Pro is sold as non-refundable), so a payment is never shown as Reversed from real data. The 7 days are a holding period.
- Per-reel sign-up split only works for people whose first touch was the reel's own tagged link; others land under "Bio link and code".
- "Paid" is inferred from payout dates in the sheet, not matched payment by payment.
- Verified on live PostHog with aggregate queries (counts, sums) for one creator; the full endpoint has run only against fixtures and the stub (`node scripts/creator-earnings-stub.js`), because the production keys live in Vercel.
