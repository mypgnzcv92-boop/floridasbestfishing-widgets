# FBF Content Routine

The operating routine for publishing on floridasbestfishing.com. Updated 2026-07-10 to
reflect the shift from high-volume bursts to complete, monetized clusters.

## The shift (why this changed)
The site launched fast — ~43 posts in the first 20 days (~15/week), but publishing outran
monetization and internal linking (gear ~13% of posts, no conversion tracking, inconsistent
affiliate links). Verified findings:
- **Publishing *frequency* is not penalized** — it's neither a spam signal nor a ranking factor.
- **But the helpful-content signal is sitewide** — a batch of thin, orphaned, unmonetized posts
  drags down the *whole* low-authority domain, and a new site can't get 15/week indexed quickly
  anyway (much sits in "Discovered – currently not indexed").
- So the goal isn't "publish less" for its own sake — it's **stop shipping incomplete posts.**
  Once every post must clear the gate below, a solo operator naturally lands well under 15/week.
- Best asset right now: **nothing ranks yet.** Fix everything before traffic/revenue is at stake.

## Cadence
- **Phase 0 — Retrofit sprint (now, ~2 weeks):** near-freeze net-new (0–2/wk). Pay down completeness
  debt on the existing ~46 (monetize + interlink). *Done: lobster (310), scallop (309). Next:
  red snapper, gag grouper, snook, the 3 charter reviews, region-page charter CTAs.*
- **Phase 1 — Weekly complete-cluster cycle (~5-day rhythm):** each cycle ships ONE finished cluster:
  - Day 1: pillar (a species guide or region hub — publish/upgrade first so spokes link up to it)
  - Days 2–4: ~3 spokes (a how-to + a gear post + a seasonal/charter piece), each interlinked *at publish*
  - Day 5: wire & QA (add downward links from pillar + 2–3 older posts; orphan check; run the gate)
  - **Actual cadence (William, 2026-07-10): 1–2 complete posts every ~4 days (≈2–3/week).** The scheduled
    "FBF Content Strategist" agent runs **every 4 days** (was every 2). A full cluster therefore builds over
    ~2 cycles — that's fine. Provisional — re-review against GSC indexing/impressions in ~6–8 weeks and tune.
- **New vs refresh split:** sprint ~10/90 → months 1–3 ~75/25 → months 4–6 ~65/35 → mature 50/50.

## Publish gate — a post ships ONLY when all are true
**Intent & depth**
- [ ] Primary keyword in title, H1, first ~100 words; intent matches (info vs commercial)
- [ ] Meta description set (Rank Math); covers the topic deeper than the current ranking pages
**Internal links (the #1 historical gap)**
- [ ] 3–5 contextual in-body links; spoke links UP to its pillar; pillar + 2–3 older posts link DOWN (no orphans day one)
- [ ] Links to the relevant region page / offshore hub where applicable
- [ ] ≥1 link to a **money page** (gear or charter) from every informational post
**Monetization & compliance** (see standards below)
- [ ] Amazon links = direct product, **uncloaked**, disclosed; FishingBooker = cloaked `/go/`
- [ ] Gear box where intent supports it; FishingBooker CTA on species/region/charter posts
- [ ] Disclosure present (auto, sitewide, bottom); relevant widget embedded via deploy.py if it fits
**Schema & E-E-A-T**
- [ ] Article/Product schema; author byline; **first-hand signals** (named spots, dates, conditions) — our real edge
**Media/technical**
- [ ] Original compressed (WebP) images w/ alt text; indexable; mobile-OK

## Link & monetization standards (updated per Amazon ToS verification 2026-07-10)
- **Amazon = UNCLOAKED, direct product links.** Amazon's Linking Requirements forbid presenting a
  link so it's unclear it goes to Amazon; a `/go/` cloak hides the destination on hover → non-compliant
  (material breach → possible commission forfeiture). The visible link must resolve to `amazon.com`.
  Implement via **ThirstyAffiliates Uncloak module** (preferred — keeps link management + click
  analytics while showing the raw URL) or plain `amazon.com/dp/<ASIN>?tag=floridasbestf-20` links.
  Hybrid: direct ASIN on money pages (gear reviews + seasonal); search URLs OK only for casual mentions.
- **FishingBooker (and any program that permits it) = cloaked `/go/` + tracked.** Highest-value CTA on
  charter/region/species posts. (Plan: FISHINGBOOKER-PLAN.md.)
- **Disclosure:** auto-appended to the **bottom** of every monetized post/page, incl. the required
  "As an Amazon Associate we earn from qualifying purchases" + FTC line. Class `fbf-disclosure`.
- **Tracking (LIVE 2026-07-10):** a site-wide GeneratePress hook (element **341**, `wp_footer`, Entire
  Site) fires GA4 **`affiliate_click`** on every `/go/` click (covers Amazon-while-cloaked + FishingBooker)
  and **`newsletter_signup`** on `form.fbf-signup-form` submit — confirmed live in GA4 Realtime. No
  per-post tracking work needed. ⚠️ **Site Kit excludes logged-in WP users** (`trackingDisabled:
  ['loggedinUsers']`) — always **test in an Incognito window**, or your own visits won't record. GA4
  property `526263364` / measurement `G-KZFFMC05TL`. When Amazon links are uncloaked, GA4
  Enhanced-Measurement outbound-click tracking also catches them.

## Cluster build order (topical authority)
Finish one cluster (pillar + spokes + full interlink + orphan check) before starting the next.
Priority clusters map to the strongest existing assets + seasonal demand:
1. **Snook** (guide → best snook rod/reel, leader, night-snook how-to → Tampa Bay/IRL regions)
2. **Redfish** (guide → best redfish lures/spoons, gold-spoon how-to → Mosquito Lagoon/IRL)
3. **Seatrout** (guide → trout lures + popping corks)
4. **Tarpon** (guide → complete the existing rods/reels post with a leader post; mullet-run tie-in)
5. **Snapper/Grouper bottom** (mangrove/yellowtail/mutton + grouper → bottom rod/reel, rigs, descending device → offshore hub)
Seasonal overlay (publish/refresh on lead time): mullet run (early-Aug), pompano/surf (mid-Sep),
stone crab (~Oct 1), sheepshead (~Nov 1). See the FWC seasonal calendar in memory.

## 4-week example
| Week | Cluster | Ships (all gated) | Backfill/refresh |
|---|---|---|---|
| 1 | Retrofit sprint | 0–2 new | red snapper season-pivot + bottom gear; gag grouper; snook season |
| 2 | Retrofit sprint | 0–2 new | 3 charter reviews (+FishingBooker); region-page charter CTAs; uncloak Amazon links |
| 3 | **Snook** | snook rod/reel · snook leader · night-snook refresh (pillar=snook guide) | wire 2–3 older posts → snook cluster |
| 4 | **Redfish** + mullet-run | redfish lures · gold-spoon how-to · **mullet-run evergreen** (seasonal) | wire redfish guide + regions |

## Open/uncertain
- Exact posts/week is a guardrail, not a law — the gate wins; never push back toward 15 unless every
  post clears the bar.
- Amazon uncloak: enable the ThirstyAffiliates module (may need the wp-admin Modules screen) — **parked** (William deferred 2026-07-10). Until then, Amazon links stay cloaked `/go/` and are tracked by the `affiliate_click` listener.
- Conversion tracking is **LIVE** (see Tracking above). Only remaining GA4 step: **star** `affiliate_click` + `newsletter_signup` as Key events once they clear GA4's processing lag into Admin → Data display → Events → Recent events.
