# NextRaise Design System

**NextRaise** (domain and social handle: **nextraise.ai**, operated by ThreeDots Inc.) is an AI job-hunting platform for job seekers. It positions itself as a copilot for the whole hunt rather than another job board: it scores every job against the user's real resume, audits the resume against ATS checks, rewrites it per job description, autofills applications across 100+ boards and ATS portals, and surfaces insider referral contacts behind a posting. Headline claims from the live site: 500K+ job seekers, 2M+ jobs tracked, 100+ job boards covered, 5.0 Chrome Web Store rating, "Featured by Google". Free to start; Pro is a **one-time** payment from ₹399 with no auto-renewal. Built for the Indian job hunt first, then 20+ countries.

## Products represented here

| Surface | Where it lives | Notes |
|---|---|---|
| Marketing website (nextraise.ai) | `ui_kits/website/` | Home, job browse, pricing |
| Chrome extension | `ui_kits/extension/` | Score overlay on a job posting, autofill flow, resume panel |

Adjacent surfaces that exist but are **not** recreated here (no source material was available): the signed-in web app dashboard, job tracker, affiliate portal, blog, help centre, free-tool landing pages.

## Sources used

No codebase, Figma file or design export was attached to this project. Everything here was derived from:

1. **https://nextraise.ai** — live marketing page (copy, product-panel content, stats, FAQ, footer inventory, testimonials). Fetched as text; no CSS, image or font binaries could be pulled in.
2. **A full-page screenshot of the logged-out homepage supplied by the user (31 Aug 2026)** — every colour in this system was pixel-sampled from it: ink `#0F1C3D`, action blue `#2952FF`, body slate `#3F4A66`, muted `#70778B`, app panel `#0F1729`, success `#19B672`, amber `#F59E0C`, page tint `#F5F7FF`.
3. **Chrome Web Store listing** — `chromewebstore.google.com/detail/nextraise-…/engahjgacaeffaajnakmamkcnoidlffl`
4. **The official logo files, supplied by the team**: `assets/logo-mark.svg` and `assets/app-icon-128.png` — a rounded square filled **`#0065F4`** with a white "N". This hex is the brand colour and the source of the ramp.
5. **This workspace's Nextraise skills** (`instagram-carousel`, `nextraise-product-video`) for type and text colours: Plus Jakarta Sans 300–700, text `#0f1419`, body `#333333`, meta `#536471`, background `#FFFFFF`, handle `@nextraise.ai`. **Note: those skills still specify `#2FAD64` green as the accent — that is stale and should be updated to `#0065F4`.**
6. Social: linkedin.com/company/nextraiseai · instagram.com/nextraise.ai · x.com/NextRaiseAI

### What is confirmed vs inferred

**Confirmed** (sampled from the screenshot or taken from the supplied logo): every colour in `tokens/colors.css`, the floating capsule nav, the ink navy uppercase CTA, the two-line hero with "agents" in action blue, the faint 56px hero grid, the job card + dark match panel pairing, the type family, all product copy, the component inventory, the stats, the pricing model.

**Inferred** — please correct these: the tints/shades either side of each sampled hex (the 50–900 steps); spacing scale; corner radii (12px inputs, 16px cards, pill buttons); shadow values; motion durations and easings; the extension panel chrome and the signed-in app sidebar (only partly visible in the screenshot). No font binary, company logo or testimonial photo was supplied, so none are bundled.

---

## CONTENT FUNDAMENTALS

**Voice.** Peer-to-peer and plainly useful. NextRaise talks like a friend who has read the recruiter's screen: it names the problem, then states what happens next. No hype adjectives, no "revolutionary", no exclamation marks except in one CTA headline ("Find your perfect job in a click!").

**Person.** Second person throughout — "your resume", "the jobs you are truly qualified for", "see every line that gets you filtered out". First person is only used in button labels, where the user is speaking: **"Find My Matches"**, **"Check My ATS Score"**, **"Tailor My Resume"**. Never "we" in feature copy; "we" appears only in the FAQ, where the company answers directly ("We track openings across 100+ job portals").

**Casing.** Sentence case for headlines and body. Buttons and nav actions are **UPPERCASE with ~0.04em tracking** where they are the primary move — "TRY FOR FREE", "SIGN IN" — while in-product buttons stay sentence case ("Apply with Autofill", "Match score"). First-person feature CTAs are Title Case ("Find My Matches", "Check My ATS Score"). Small eyebrows are uppercase with wide tracking (MATCH, PRIMARY RESUME, JOB ALERTS). Acronyms stay caps: ATS, JD, CTC, CXO.

**Sentence shape.** The headline is split over two lines and the second line is set larger and heavier, with its last word in action blue: "No more solo job hunting" (52px/700) then "Do it with **agents**" (88px/800). Body copy is one long sentence that lists the outcomes and closes on a time claim: "…autofilled applications and insider referrals, all in less than a minute."

**Numbers carry the argument.** Every claim is quantified and abbreviated the same way: `500K+`, `2M+`, `10 Lakh+`, `100+`, `20+ countries`, `5.0`, `96% Strong match`, `72 of 100`, `+18 pts available`, `22 of 31`. Indian units (Lakh, ₹35L – ₹55L/yr) sit next to USD without apology. Scores are always paired with what to do about them.

**Honesty guardrails.** Claims stop at "better match, fewer blind applications, faster tailoring". Never "guaranteed job" or "100% interviews". Autonomy is stated explicitly and repeatedly: "the submit button stays yours", "Nothing is ever sent without your review", "your data is never sold".

**Testimonials** are outcome-specific, first person, one or two sentences, attributed as *Name · Job title · City* with no star rating: "The match score told me to skip 8 of 10 jobs I was about to apply to. The two I tailored for both called back."

**Emoji: no.** Not on the site, not in product UI. Meaning is carried by the score colour and a Lucide-style glyph. The middot `·` is the workhorse separator ("Google · 2 hours ago", "Senior Recruiter · Payments"). En dashes are used in ranges (₹35L – ₹55L/yr, 1–3 years).

**Naming.** Product is **NextRaise** in prose; **nextraise.ai** as the domain, handle and how social copy writes it. Features are named plainly: AI Job Match, ATS Check, AI Autofill, JD Tailor, Insider Referrals, Job Tracker. In spoken/video scripts URLs are spelled phonetically ("Nextraise dot A-I").

---

## VISUAL FOUNDATIONS

**The core idea.** A white page on a faint graph-paper grid, ink navy type, and two blues doing different jobs. Every screen is organised around a **score**: a ring plus sub-score bars, shown on a dark navy panel that sits beside the white job card. Green means the score earned it; the CTA is never green and never blue.

**Colour.** Three brand values, each with one job:
- **Ink `#0F1C3D`** (`--ink-900`) — headings *and* the marketing CTA fill. The most prominent button on the site is navy, not blue.
- **Action blue `#2952FF`** (`--action-500`) — in-product primary buttons ("Apply with Autofill"), links, selected chips, focus rings, and the one highlighted word in the hero headline ("agents").
- **Logo blue `#0066F5`** (`--brand-logo`) — the mark only. Never used as a UI fill; it reads as a slightly warmer blue next to the action blue and the two should not be mixed in one element.

Text: headings `#0F1C3D`, body `#3F4A66` (a slate blue, not neutral grey), secondary `#70778B`. Surfaces: white page, `#F5F7FF` tint for sunken areas, `#0F1729` (`--surface-panel-dark`) for the app sidebar and every match panel.

Green `#19B672` (`--success-*`) is **not** a brand colour — it marks a match score that earned it (the "Job match 91" chip, a strong ring, "Upgrade to Pro"). Amber `#F59E0C` carries mid scores, the ATS warning pill and the Chrome-Web-Store star; red `#E5484D` weak scores; sky `#1D9BF0` a verified work email. Max two background colours per composition. No decorative gradients — the only gradients are mask fades on marquee edges. No purple, no blue-to-violet blends; both blues are used flat.

**Type.** Plus Jakarta Sans for everything, 300–700 (800 where available, for display and score numerals). Display headlines: 800 weight, `-0.03em` tracking, 1.05 line-height, up to 64px. Product headings: 700, `-0.02em`. Body 16px/1.55; UI labels 15px/500; meta 13px/500; eyebrows 11px/700 uppercase with `0.08em` tracking. Score numerals are 800 weight, bare (no "%" inside a ring), with "of 100" set small and muted beside them. No serif, no mono in UI (mono only for code in docs).

**Spacing & layout.** 4px-based scale (2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96). Marketing sections are separated by 96px; cards use 20px padding (24px for feature cards) with 16px internal gaps; chips sit 8px apart. Content max width 1200px, prose and FAQ 720px. The extension panel is a fixed 360px column. Fixed elements: the announcement bar (static, top of document), the site header (sticky, 68px, translucent white with `saturate(1.4) blur(12px)` and a hairline bottom border), and the app's filter rail and action panel (sticky at 92px).

**Cards.** Hairline first, shadow second: 1px `#E7E9EB` border, 16px radius, `0 1px 3px rgba(15,20,25,.06)`. Nested surfaces drop to 12px radius on `#F7F8F9` with no border. Hover on a clickable card lifts it 2px and deepens the shadow one step. Popovers and the extension panel use the 12px/32px shadow; modals the 24px/64px one. The only coloured shadow in the system is the blue glow under a primary button (`0 8px 24px rgba(0,101,244,.22)`).

**Borders & radii.** 4 / 8 / 12 / 16 / 24 / pill. Buttons and chips are **always** pills; inputs and selects are 12px; cards 16px; large panels 24px. Borders are 1px and never coloured except to indicate selection (green) or error (red).

**Backgrounds & imagery.** The hero sits on a **56px graph-paper grid** in `--grid-line #EDF0F7` on white — the one texture in the system, and it stops after the hero. No hand-drawn illustration, no photographic hero. The hero "image" is the product itself — a browser-chrome card containing a real job-match card. Proof is delivered by scrolling marquees of plain company/university names, mask-faded at the edges rather than covered with a solid overlay. Where photography exists on the live site it is warm, natural, UGC-flavoured creator video and small round testimonial avatars — never stock-corporate, never cool/blue-graded, never black and white.

**Transparency & blur.** Exactly one place: the floating header capsule (`rgba(255,255,255,.86)` + `saturate(1.4) blur(12px)`). Scrims are `rgba(15,28,61,.48)`. No frosted cards.

**Animation.** Restrained and functional. 140ms for control states (hover, press, chip toggle) on `cubic-bezier(.2,0,.2,1)`; 200ms for surfaces (card lift, panel open) on ease-out; 520ms for the one expressive moment — score rings and progress bars filling from zero on mount. Marquees loop linearly, 30–40s per pass. No bounce, no spring on entrances (a spring curve exists for rare emphasis), no parallax, no scroll-jacking, no fade-in-on-scroll cascades.

**States.** Hover darkens: ink `#0F1C3D` → `#16264F`, action blue `#2952FF` → `#1B3FE0`; secondary/ghost fill with `#EEF1F8`. Nothing ever lightens on hover. Press scales to 0.97 with no colour change. Focus is a 3px `rgba(41,82,255,.22)` ring plus a blue 1px border on fields — never a browser outline. Disabled is 45% opacity with `not-allowed`. Selected chips take a blue border and a blue tint, not a solid fill.

---

## ICONOGRAPHY

The brand's own icon assets could not be obtained (no repository, no SVG export, and the live site's binaries are not reachable from this project). **Flagged substitution: this system ships Lucide** (24px grid, 2px stroke, rounded caps) as the closest match to the light-stroke line icons the product uses, loaded from CDN — `https://unpkg.com/lucide-static@0.544.0/icons/<name>.svg` — and rendered through the `Icon` component as a CSS mask so glyphs inherit `currentColor`. Replace with the real set when available.

Rules in use: icons are line-only, never filled, never in a coloured circle, and sit at 14–16px in dense UI, 18px in buttons, 20–24px in feature blocks. They accompany a label almost always; icon-only affordances are limited to chevrons and close. **No emoji** anywhere. Unicode is used typographically, not as iconography: `·` as separator, `→` in mini-lists (social copy), `“ ”` curly quotes, `–` en dash for ranges. Score meaning is carried by colour and number, not by an icon.

Common slugs: `sparkles` (AI actions), `zap` (autofill), `check` / `check-circle-2` (done, verified), `gauge` (ATS score), `file-text` (resume), `briefcase`, `search`, `users` (referrals), `alert-triangle` (fix needed), `chevron-right` / `chevron-down`, `external-link`, `bookmark`, `shield-check` (privacy).

**Logo.** The official mark is bundled: `assets/logo-mark.svg` (200×200, corner radius 61 ≈ 30.5% of the side, filled `#0065F4`, with a white "N" formed from a square, a rising curve and a bar) plus `assets/app-icon-128.png`. The `Wordmark` component renders it beside the name when given `logoSrc`; without one it falls back to "NextRaise" in 800 weight with a muted ".ai". Never recolour, outline or redraw the mark, and never place it on a blue field.

---

## Index

| Path | What it is |
|---|---|
| `styles.css` | The one file consumers link — imports only |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css` |
| `guidelines/` | 18 specimen cards: action blue, ink & logo blue, neutrals, success green, support hues, semantic aliases, score ramp, type scales, numerals, spacing, radii, elevation, states, motion, hero grid, iconography, logo |
| `components/core/` | Icon, Button, Badge, Chip, Card, Input, Select, Avatar, ProgressBar, ScoreRing, StatBlock, Accordion, Wordmark |
| `components/patterns/` | AnnouncementBar, SiteNav, SiteFooter, JobMatchCard, AtsScoreCard, TailoredResumeCard, AutofillPanel, ReferralRow, TestimonialCard, JobFilterBar, LogoMarquee |
| `ui_kits/website/` | Marketing site recreation — Home, JobsPage, PricingPage |
| `ui_kits/extension/` | Chrome extension recreation — ScoreOverlay, AutofillFlow, ResumePanel |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent Skills wrapper for use outside this workspace |
| `assets/` | `logo-mark.svg`, `app-icon-128.png`. No photography, product screenshots or font binaries yet |

### Intentional additions

- **`Icon`** — a thin wrapper so every glyph inherits `currentColor` from one place; needed because the real icon set is substituted and should be swappable in a single file.
- **`Wordmark`** — the logo-plus-name lockup, so the mark is placed identically everywhere and can fall back to type when a page can't reach the asset.
- **`ProgressBar` / `ScoreRing` / `StatBlock`** — extracted from the product panels the site shows, because the score is the system's primary object and appears in five different surfaces.

Everything else maps 1:1 to something visible in the product.
