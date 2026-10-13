# Creator earnings dashboard: competitor research

Date: 2026-10-13. Purpose: inform a dashboard for NextRaise.ai UGC/influencer creators (INR; 30% of payments plus a fixed fee per reel in some deals; daily signups, Pro conversions, revenue, commission, date range picker).

Method and limits: web search of vendor help centers and third-party program docs. No logged-in screenshots were possible, so first-screen layouts are inferred from help text. Mobile layout is mostly undocumented; treat the mobile column as "not verified" unless stated. Skillshare, Kit, Canva and Zerodha/smallcase had no usable dashboard documentation and are marked as such. Verify live before copying any label.

## 1. Products studied (11)

1. Rewardful (Stripe-native affiliate SaaS)
2. FirstPromoter (SaaS affiliate; portals customised per company)
3. PartnerStack (powers Notion, Brevo and many B2B SaaS programs)
4. Dub Partners (powers beehiiv partner program payouts)
5. impact.com (enterprise partnerships)
6. Refersion (ecommerce affiliate)
7. Amazon Associates (benchmark for daily reporting)
8. beehiiv Partner Program (creator-facing, on Dub)
9. Whop affiliates (creator marketplace)
10. Cuelinks (India affiliate network)
11. Admitad (global network, India publishers)
Also checked, little found: Groww refer and earn (in-app, eligibility-gated, program ended a campaign Mar 2024), Zerodha/smallcase refer (Console page, no dashboard docs), Notion (PartnerStack, 180-day upgrade window, last-click), Canva, Kit, Skillshare (nothing usable).

## 2. Comparison table

| Product | First-screen KPIs | Daily breakdown | Status model | Payout info | Per-link / campaign | Notable UX |
|---|---|---|---|---|---|---|
| Rewardful | Referrals, commissions, "due" balance (inferred) | Not documented | Pending (default 30 days, adjustable to match refund window) then Due then Paid (paid outside the tool, PayPal/Wise) | Min threshold per campaign, monthly cadence, CSV export | Per campaign | Auto-adjusts commission on refund; indicator badge on Payouts when money is due |
| FirstPromoter | Clicks, signups (referrals), customers, current/paid/unpaid earnings | Not documented | Mostly "unpaid" vs paid; recurring commissions can skip manual approval | Payment method required (PayPal standard) | Per link | Portal customisable (50+ attributes), so labels vary |
| PartnerStack | Home: programs, performance overview, referral activity; pending vs paid | Filter by created date, program, status, est. available date | Pending approval (with estimated payment date), Available to withdraw, Declined (with reason), Paid in Withdrawals | Connect provider (Stripe, PayPal, direct deposit), withdraw when available, min threshold varies | Multiple links (Notion) | "View breakdown" drawer on upcoming commissions; estimated payment date per row; decline reason shown |
| Dub Partners | Overview: earnings and payouts over time, recent payouts, clicks/leads/sales | Time series with date range on overview | Pending (holding period under 1 day up to 90 days), Processed, Paid, Refunded | Payouts page: Pending total, Total paid, Confirm payouts action (program side) | Group earnings by Link or by Reward type | Toggle between money ($) and raw counts (123) on the same chart |
| impact.com | Balance: Pending and Locked; reports by action | Action-level reports | Pending until Lock Date, then Locked (payable on contract schedule), Reversed (separate tab), Outside of Terms (caps, needs manual approval) | Paid on contract schedule if above minimum | Per program/contract | "Lock date" is an explicit, visible concept; reversed shown in own tab, not hidden |
| Refersion | Financials card: Next Estimated Payment (approved, unpaid) and Commissions in Approval (pending) | Conversions page list | Pending, Approved, Denied, Unqualified (outside attribution window, renewal limit, self-referral); auto-approve after 90 days default (min 30) | Payment History list | Per offer | Two plain-language money buckets with clear names; "Unqualified" explains why |
| Amazon Associates | Clicks, ordered items, shipped items, conversion %, earnings | Daily earnings graph; ordered/bounty reports near real time, Earnings report as of prior day | Ordered vs Shipped; commission only counts on shipment | Separate payments section | Per tracking ID, by program, bounties separate | Fixed-fee "bounty" shown separately from % referral fee, maps to our per-reel fee; clear freshness note per report |
| beehiiv Partners | Visitors, leads, conversions, commission by status | Dashboard stats | Pending (30-day provisioning window), Due (eligible for next cycle on the 15th), Paid | Monthly on the 15th via Dub | Single custom link | Simple three-state vocabulary; tier ladder (50 to 60%) shown as progress |
| Whop | Stats: revenue earned from referrals | Not documented | 30-day wait between purchase and payout | Min payout (third-party review says $50), monthly | Per product | Recurring 30% default, similar to our offer |
| Cuelinks (India) | Revenue by merchant, monthly/annual reports, payments made | Reports by date | Pending, Validated, Rejected, Payable, Claimed; merchants take around 60 days to validate; invoice raised once payable above threshold | Raise invoice from panel, paid the next Friday (older terms, verify) | Per merchant, per campaign | Longest, most opaque cycle. Good example of what frustrates creators |
| Admitad | Balance (on hold plus confirmed plus awaiting advertiser payment) | Reports on actions filterable by status and date | On hold, Confirmed, Confirmed awaiting advertiser payment, Declined (rewards simply vanish from balance) | Withdrawable "in a couple of days" after confirmation; Balance history section | Per offer/ad space | Declined rewards disappear without a ledger entry (anti-pattern) |

Mobile: no vendor documents a mobile-specific layout. Most are responsive web portals; Groww/Zerodha referral lives in-app. Assume cards stack, tables scroll horizontally, which we should do better (see section 5).

## 3. Patterns to copy

1. Two named money buckets on the first screen, not one total. Refersion's "Commissions in Approval" vs "Next Estimated Payment" and PartnerStack's pending vs available are the clearest. For us: "Pending (in refund window)" and "Payable".
2. Visible lock/release date. impact.com Lock Date and PartnerStack "estimated payment date" answer the creator's main question: when do I get paid. Show a per-row "payable on" date and a next-payout date in the header.
3. Three-state vocabulary for the common path: Pending, Payable (or Due), Paid. beehiiv and Rewardful keep it this simple. Add Reversed/Refunded as a fourth, shown not hidden (impact.com separate tab, Dub "Refunded").
4. Reasons on negative states. PartnerStack declined reason, Refersion Unqualified reasons. Never let money silently vanish (Admitad).
5. Money vs count toggle on the chart (Dub). Lets one chart serve both "how many signups" and "how much earned".
6. Fixed-fee and percentage shown as separate reward types (Amazon bounty vs referral fee; Dub group by reward type). Our reel fee and 30% recurring should be two lines, not blended.
7. Funnel row with conversion % (Amazon clicks to ordered to shipped; FirstPromoter clicks to signups to customers): signups to Pro conversions to conversion %.
8. Freshness stamp per metric. Amazon states which reports are near real time vs prior day. We should show "Updated 14:05 IST" and flag that payments data may lag signups.
9. Payout method and threshold surfaced on the dashboard, with a "connect payout method" nudge when empty (PartnerStack, FirstPromoter).
10. A payouts badge/indicator when money is due (Rewardful).
11. Date range with presets and comparison to previous period (Dub overview supports range changes; add compare).
12. Group by link (campaign/reel) for attribution (Dub, Amazon tracking IDs). Maps to per-reel breakdown.

## 4. Patterns to avoid

1. Net-60 style validation delays with no explanation (Cuelinks). Our window is the refund period only; state it in plain words.
2. Vanishing rewards (Admitad declined). Always keep a ledger row with a reason.
3. One blended "earnings" number that mixes pending, approved and paid (several FirstPromoter-based portals). Creators cannot plan with it.
4. Jargon states: "Outside of Terms", "Locked", "Claimed", "Processed". Use creator language: Pending, Payable, Paid, Reversed.
5. Heavy enterprise report builders (impact.com, Admitad) for a creator who wants a daily glance. No column pickers on v1.
6. Earnings counted before a customer actually pays. Amazon counts only shipped; we count commission only on captured payments, not trial starts.
7. Inconsistent definitions across screens (signup counted at click vs account created). Fix one definition per metric and show it in a tooltip.
8. USD-first or ambiguous currency. Show INR with Indian digit grouping (1,23,456), and say whether amounts are before or after TDS.
9. Wide tables that break on phones. Replace with a stacked day list on mobile.

## 5. Recommended first screen

Audience: Indian creators, mostly on a phone via Instagram. Light theme to match the creators page. Single scroll, no tabs needed on v1.

Top bar: creator name, date range picker (Today, Yesterday, Last 7, Last 30, This month, Custom; default Last 30), "Updated at" stamp, compare toggle.

Row 1, hero money (two cards, large):
- Pending: amount in the refund window, with "next release: <date>" subline.
- Payable now: amount ready to pay out, with "next payout <date>" and payout method chip. If under threshold: "Rs X more to reach the minimum".

Row 2, funnel strip (four small stat tiles, each with delta vs previous period):
- Signups
- Pro conversions
- Conversion % (Pro conversions / signups, cohort basis stated in tooltip)
- Revenue from your Pro users (gross payments, ex-GST, say which)

Row 3, earnings strip:
- Commission earned in range (30% of payments), Fixed fees earned (per-reel deals), Total earned, Lifetime paid.

Row 4, chart: daily bars, toggle between Signups / Pro / Revenue / Commission (Dub-style money vs count). Stacked commission bars by reward type (percentage vs fixed fee).

Row 5, daily table (cards on mobile):
Date | Signups | Pro | Conv % | Revenue | Commission | Fixed fee | Status
Totals row pinned at the bottom. CSV export. Row tap opens the day drawer listing each conversion (anonymised user id, plan, amount, commission, status, payable-on date), PartnerStack "View breakdown" style.

Row 6, by reel/link table: reel title or link, signups, Pro, revenue, commission, with fixed fee shown as its own line.

Row 7, payouts: history list (date, amount, UTR/reference, status), payout method and threshold, next payout date.

Mobile: sticky date picker, money cards full width, funnel tiles in a 2x2 grid, chart limited to 7-14 bars with scroll, daily table becomes a card list (date, commission, signups and Pro as one line), payouts below the fold.

## 6. Metric list and definitions

Required, with a proposed definition:
- Signups: accounts created attributed to the creator's link/code within the range (by signup date).
- Pro conversions: attributed users whose first successful Pro payment fell in the range (by payment date).
- Conversion %: Pro conversions / signups in the same range. Note cohort lag: recent signups have not had time to convert; offer a "cohort view" later.
- Revenue from Pro users: sum of captured payments from attributed users in range, net of refunds, state tax treatment.
- Commission earned: 30% of that revenue (rate read from the creator's deal, not hardcoded), recurring renewals included.
- Fixed fee earned: per-reel fee, recorded when the deal's condition is met (e.g. verified views or 48h base fee rule, per the creator program terms).
- Pending: commission on payments still inside the refund window plus fixed fees awaiting verification.
- Payable: released, unpaid.
- Paid: settled out, with reference.
- Reversed/refunded: commission clawed back, with reason and date.
- Nice to have: clicks (only if tracked), active Pro users from this creator, MRR contribution, top reel, estimated next payout.

## 7. Status model (proposal)

Pending, then Payable, then Paid. Side branch: Reversed (refund or chargeback inside window), shown as a negative row with a reason. Payable date = payment date + refund window days. Payout is on a fixed date (monthly is the market norm: beehiiv 15th, Rewardful month start, Cuelinks weekly invoice) with a minimum threshold. Pick the threshold low in INR terms; Whop's $50 style minimums frustrate small creators.

## 8. Open product questions

1. Refund window length. Is there a refund policy? This sets the pending period (market range 30 days for Rewardful/beehiiv/Whop, up to 90 for Dub). Pro is monthly at Rs 999, Sprint is a 3-month pack: is commission on the full Sprint paid upfront or released per month?
2. Does 30% apply to the amount including GST or excluding? Show which.
3. Recurring: does 30% continue on every renewal, for how long (beehiiv caps at 12 months, Notion 180-day attribution window)? Needs a stated cap or "lifetime".
4. Fixed fee mechanics: when does it become Pending vs Payable (verified views, 48h base fee rule)? Is it part of the same ledger and payout? Who approves it (manual in admin or automatic)?
5. Attribution: link, promo code, or both? Last-click vs first-touch, window length, self-referral rule, and what happens when a user signs up through two creators.
6. Is conversion % measured by cohort (signup date) or by event date? Cohort is more honest but looks lower in recent days.
7. Payout rail: UPI, bank transfer (NEFT/IMPS), or Razorpay Route? Minimum threshold, schedule, TDS under section 194H/194R at deduction, PAN collection, GST invoice requirement for creators registered for GST. Show net after TDS.
8. Data freshness: PostHog derived metrics versus payments source of truth (Razorpay). Commission must come from payments, signups from analytics. Update cadence (hourly vs daily)?
9. Refund/chargeback after payout: negative balance carried to the next payout or clawed back?
10. Privacy: can creators see user emails, names, or only anonymised ids and plan?
11. Do creators with fixed-fee-only deals see the same dashboard (no commission rows) or a simplified one?
12. Tiers or bonuses (up to Rs 2,500 at 1M views, 5 tiers per the creators page): shown as a progress bar toward the next tier, like beehiiv's ladder. Confirm these live in the same dashboard.
13. Do creators get notifications (WhatsApp/email) on first conversion, payable release and payout?
14. Which currency display for creators abroad? Assume INR only for v1.

## 9. Sources

- Rewardful: help.rewardful.com (how do I pay commissions), rewardful.com/automated-refund-handling
- FirstPromoter: firstpromoter.com/features, program help pages (Claid, Let's Enhance, Boost)
- PartnerStack: support.partnerstack.com (partner dashboard overview, how do I get paid), Brevo and Notion program pages
- Dub: dub.co/help (navigating a partner program, partner payouts, partner commissions)
- beehiiv: beehiiv.com/support Partner Program FAQ
- impact.com: help.impact.com (pending actions for partners, action status descriptions, reversed actions)
- Refersion: support.refersion.com (conversion statuses, tracking your payments)
- Amazon Associates: affiliate-program.amazon.com help (use reports, earnings report)
- Whop: docs.whop.com/affiliates
- Cuelinks: Cuelinks Zoho Desk support center (validation parameters, payment terms)
- Admitad: admitad.useresponse.com knowledge base (publisher dashboard, reports, balance history)
- Groww and Zerodha: groww.in help/terms, Zerodha z-connect (limited)
