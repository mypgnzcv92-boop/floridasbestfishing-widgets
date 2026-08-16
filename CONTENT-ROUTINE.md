# FBF Content Routine

The operating routine for publishing on floridasbestfishing.com.

- 2026-07-10 — shifted from high-volume bursts to complete, monetized clusters.
- **2026-08-15 — full site rebuild (design + IA + trust layer). Sections 1 and 2 below are new
  and change what "complete" means. Read them before publishing anything.**

---

# 1. SITE MAP — what the site looks like now

The rebuild added hub pages and a real information architecture. **New content is not finished
until it is wired into these hubs** — that is the single biggest change to the routine.

## Navigation (menu id 7)

`Species ▾ · Regions ▾ · Reports · Gear · Tools · Charters · About · Contact`

"Home" was removed (the logo links home). "Blog" was retired and became "Reports".

## Pages that must be kept current

| Page | ID | Slug | What it is | When you must touch it |
|---|---|---|---|---|
| Home | 12 | `/` | Hero → Today's Bite (live solunar) → Latest Guides → Tools → Regions → signup | **Never manually** — Latest Guides auto-populates via `[fbf_latest]` |
| Species hub | 596 | `/species/` | All species guides, grouped Inshore / Flats / Surf / Nearshore / Offshore | **Every time a species guide publishes** |
| Regions hub | 597 | `/regions/` | 11 regions grouped Atlantic / Keys / Gulf / Offshore | When a region page is added |
| Reports hub | 659 | `/reports/` | Live conditions + latest written reports + season openers | Auto-populates; edit only for season-opener links |
| Tools hub | 298 | `/tools/` | Reg checker, What Should I Throw, Setup Matcher | When a widget is added |
| About | 16 | `/about/` | Who writes it, what the site is and is not | Rarely |
| How We Research | 658 | `/how-we-research/` | Sourcing methodology per content type | When sourcing practice changes |

**Region pages (11):** Jacksonville 238 · Indian River Lagoon 234 · Mosquito Lagoon 230 ·
Southeast 81 · Keys 79 · Everglades 242 · Charlotte Harbor 236 · Tampa Bay 77 ·
Cedar Key 240 · Panhandle 83 · Offshore hub 273.

**Categories:** Fishing Reports(1) · Gear Reviews(2) · Charter Reviews(3) · How-To Guides(4) ·
Species Guides(5).

## Theme — `fbf-2026` (GeneratePress child)

The old "Additional CSS" pile is gone. The theme now owns the design system, and several things
the routine used to do by hand are automatic:

- **Byline** — every post shows "By Captain" automatically. Do not write a byline into content.
- **Table of contents** — auto-generated from the post's own `<h2>`s when there are **3 or more**.
  IDs are added automatically. A guide with 2 H2s gets no TOC, which is usually a sign it is thin.
- **Disclosure** — the theme tags the first paragraph starting "Disclosure"/"Affiliate disclosure"
  with class `fbf-disclosure`. Write the line as a normal `<p>`; do not add the class by hand.
- **Article layout** — posts are full-width with a sticky TOC rail. No sidebar on posts.
- **Archives** — category pages render as a card grid automatically.
- **Footer** — links About / How We Research / Species / Regions / Tools / Contact / Privacy.

**Design tokens** (use these if you ever inline a colour): navy `#0B2A3C`, deep `#0F3A50`,
bone `#F4EFE6`, rule `#E0D6C4`, brass `#C9A24B`, brass-for-text `#8A6D24`, steel `#7E909A`,
ink `#16232C`. **Never** use the retired teal `#0D9488`, coral `#E8634A` or pastel sand `#F5F0E8` —
a site-wide migration removed all of them and reintroducing one is a visible regression.
⚠️ Plain brass on bone is ~2:1 contrast — never put body text in `#C9A24B`.

Fonts: **Bevan** (display/H1), **Sanchez** (H2/H3), **Source Serif 4** (body), **Cinzel** (labels,
nav, eyebrows). All self-hosted in the theme; no Google Fonts request.

## Widgets (4 live)

| Key | Marker | Mount | Presets |
|---|---|---|---|
| `regs` | `FBF:regs` | `data-fbf-regs data-species` | 22 species keys in `lib/regs.js` |
| `throw` | `FBF:throw` | `data-fbf-throw data-species` | snook, redfish, seatrout, tarpon, flounder, sheepshead, black-drum, jack-crevalle, spanish-mackerel, mangrove-snapper |
| `setup` | `FBF:setup` | `data-fbf-setup data-scenario` | beginner, inshore-allround, big-snook, nearshore, offshore-bottom, offshore-troll, pier, surf, tarpon |
| `solunar` | `FBF:solunar` | `data-fbf-solunar data-region` | region keys from `lib/regions.js` |

⚠️ **If the post body authors its own widget placement, use the `keep` anchor in `deploy.py`.**
Every other anchor strips the marker and re-inserts at the anchor — i.e. it RELOCATES the widget on
every run, which will hoist a hand-placed widget out of the section it was written into.

⚠️ **Loader URLs carry a content hash** (`?v=<sha1[:8]>`). jsDelivr caches bundles for **7 days in
the visitor's browser**, so a content change alone never reaches returning visitors. Always
`build.py` → commit → push → purge jsDelivr → `deploy.py`. Never hand-write a loader without `?v=`.

---

# 2. HONESTY STANDARD (new, non-negotiable)

The pre-rebuild About page claimed a team of anglers who booked every charter and tested every rod.
None of it was true. Beyond credibility, **claiming hands-on testing you have not done is an FTC
endorsement-guidelines problem on affiliate content.**

- **Never invent first-hand experience.** Not a trip, not a test, not a charter, not a catch.
- First-hand detail is still the site's edge — but only where it is real. Where a recommendation is
  research-led, write it as research-led. `/how-we-research/` promises exactly this; contradicting
  it on a post is worse than never having written it.
- **Never fabricate a charter review of a real business.**
- Regulations carry a **verified date**. If you cannot verify a limit against FWC this run, do not
  publish the number.
- The old gate line "first-hand E-E-A-T signals (named spots, dates, conditions)" is **retired** —
  it invited exactly this failure. Replaced by the gate item below.

---

# 3. Cadence

**1–2 COMPLETE posts per run, every ~4 days (≈2–3/week).** Quality over volume. Weight toward
(a) retrofitting thin existing posts and (b) completing clusters, over new isolated posts. If no
cluster-completing idea is worth a full draft, propose fewer — never filler.

Frequency is not penalized, but on a low-authority domain a batch of thin, orphaned, unmonetized
posts drags the whole site down (helpful-content is sitewide).

**New vs refresh split:** months 1–3 ~75/25 → months 4–6 ~65/35 → mature 50/50.

---

# 4. PUBLISH GATE — a post ships only when all are true

**Intent & depth**
- [ ] Focus keyword in title, H1, first ~100 words; intent matches (info vs commercial)
- [ ] Rank Math meta description set; goes deeper than the pages currently ranking
- [ ] **3+ H2s** (also what earns the auto-TOC — fewer usually means it is thin)

**Internal links — the #1 historical gap**
- [ ] 3–5 contextual in-body links; spoke links UP to its pillar; pillar + 2–3 older posts link DOWN
- [ ] Link to the relevant region page / offshore hub
- [ ] ≥1 link to a money page (gear or charter) from every informational post

**⭐ Hub wiring — NEW, and the easiest thing to forget**
- [ ] **Species guide → add a card to the `/species/` hub (596)** in the right group, or the hub
      silently goes stale and the guide is orphaned from the main nav path
- [ ] Region page → add to `/regions/` hub (597) **and** the Regions nav dropdown
- [ ] Season/opener post → consider linking it from the `/reports/` hub opener list

**⭐ Regulations — NEW**
- [ ] Any post stating a size/bag/season → the number is verified against myfwc.com **this run**
- [ ] Species is present in `lib/regs.js`; if not, add it (with `verified` date) and rebuild
- [ ] Deploy the `regs` widget to the post preset to that species

**Monetization & compliance**
- [ ] Amazon = direct product link, disclosed (see standards below); FishingBooker = cloaked `/go/`
- [ ] Gear box or charter CTA where intent supports it
- [ ] Disclosure line present as a plain `<p>` (theme classes it)
- [ ] Relevant widget deployed via `deploy.py` where it genuinely fits

**Honesty & schema**
- [ ] **No invented first-hand claims** (§2). Real experience welcome; manufactured experience never
- [ ] BlogPosting schema clean (empty-string schema-clear via `rankmath/v1/updateMeta`)

**Media/technical**
- [ ] Credibly-Florida image or none (photo rule below); alt text; mobile-OK
- [ ] Non-empty marketing excerpt (a blank excerpt makes WP show the disclosure line in previews)

---

# 5. Link & monetization standards

- **Amazon = UNCLOAKED, direct product links.** Amazon's Linking Requirements forbid obscuring the
  destination; a `/go/` cloak hides it on hover → non-compliant. Use ThirstyAffiliates' Uncloak
  module or plain `amazon.com/dp/<ASIN>?tag=floridasbestf-20`. Direct ASIN on money pages; search
  URLs only for casual mentions. ⚠️ The uncloak switch is **parked** (William deferred 2026-07-10) —
  until then Amazon stays `/go/` and is tracked.
- **FishingBooker = cloaked `/go/` permanently.** Highest-value CTA on charter/region/species posts.
- **Disclosure:** bottom of every monetized post, including the Amazon Associate statement + FTC line.
- **Tracking is LIVE:** a site-wide GP hook (element 341) fires GA4 `affiliate_click` on `/go/`
  clicks and `newsletter_signup` on the signup form. ⚠️ Site Kit excludes logged-in users — test in
  Incognito. GA4 property `526263364` / `G-KZFFMC05TL`.

# 6. Photo credibility rule (unchanged, still binding)

Never use an image with non-Florida tells — mountains or hills on the horizon, rocky or cold
coastlines, snow, pine forest, non-FL landmarks. Florida is flat and subtropical and anglers spot a
fake instantly. Prefer ambiguous-but-plausibly-Florida shots. **If you cannot find a credible one,
publish with no photo.** Anything borderline: show William with the specific reason and let him call
it — never decide unilaterally.

# 7. Cluster build order

Finish one cluster (pillar + spokes + full interlink + orphan check) before starting the next.
Snook → Redfish → Seatrout → Tarpon → Snapper/Grouper-bottom.
Seasonal overlay on lead time: mullet run (early-Aug), pompano/surf (mid-Sep),
**stone crab (season Oct 15 – May 1, FWC-verified 2026-08-16 — publish by ~Oct 1)**,
sheepshead (~Nov 1), **Gulf gag grouper opener (Sep 1 — short window, high value)**.

## 7.1 NEXT UP — the queue (set 2026-08-16)

Take these in order. Dated ones are seasonal and lose most of their value if they slip past the
trigger; the undated ones are evergreen Tier-1 gaps and can fill any spare slot. Coverage below was
verified against all 60 published posts on 2026-08-16 — **none of these exists yet.**

| # | Post | Trigger | Notes |
|---|---|---|---|
| 1 | **Bluefish & Spanish Mackerel in the Florida Surf** | **before mid-Sept** — fall run | ⚠️ Post **315** is already a general Spanish mackerel guide. Angle this as the *beach/fall-blitz* piece (wire leader vs bite-offs, fast retrieves, spoons) and link to 315 rather than restating it. **`bluefish` is NOT in `lib/regs.js` — add + rebuild.** Links: 550 surf pillar, 537 pompano, 501 mullet run, 1290 cast net |
| 2 | **Florida Stone Crab: Season, Claw Limits & How to Trap** | **publish ~Oct 1** (season opens **Oct 15**) | Completes the shellfish set with the existing scallop and lobster posts. FWC-verified 2026-08-16: **Oct 15 – May 1** (closed May 2), claw min **2 7/8″**, **1 gal/person or 2 gal/vessel, whichever is less**, claws only. Re-verify at publish. Not in `regs.js` (crustacean — decide whether the checker should carry it) |
| 3 | **How to Catch Sheepshead in Florida** | **~Nov 1** — winter species | The biggest single species hole on the site. **Already in `lib/regs.js`** → deploy the regs widget preset to `sheepshead`. Pairs with existing bridge/dock content. Species guide → **must add a card to the `/species/` hub (596)** |
| 4 | **Pier fishing cluster** (pillar + spokes) | evergreen | *Zero* coverage today and the most accessible way to fish Florida (no boat). Skyway, Sebastian, Juno, Navarre, Anna Maria. The `setup` widget **already has a `pier` preset with nothing pointing at it.** Monetizes on rods, carts, nets, lights |
| 5 | **Cleaning, Filleting & Cooking Your Catch** | evergreen | Strong evergreen traffic and unusually good gear attachment (knives, boards, vacuum sealers, coolers) |
| 6 | **Fishing Knots That Actually Matter** | evergreen | Enormous volume, weak direct monetization, but the best internal-link glue available — every gear and species post can point at it |

**Blocked on affiliate approvals, not on writing:** the high-AOV gear posts (optics, technical
apparel, coolers, electronics). Writing a Costa post monetized at Amazon's 3% wastes the asset —
sequence those after AvantLink/CJ approval.

# 8. Publishing mechanics

1. `POST wp/v2/posts` — title, slug, status, categories, HTML, **non-empty excerpt**.
   Send a browser User-Agent on every REST call or Cloudflare 403s ("error code 1010").
2. Schema clear: `POST rankmath/v1/updateMeta {rank_math_rich_snippet:"", rank_math_snippet_article_type:""}`
   (empty strings → inherits BlogPosting; setting "article"/"off" breaks the graph).
3. SEO meta via the same route (focus keyword + description).
4. Featured image upload + assign (or skip per the photo rule).
5. **Wire the hubs** (§4).
6. **Widgets:** add the post id to the `DEPLOY` dict in `deploy.py`, then `python3 deploy.py <widget>`.
   If a bundle changed: `build.py` → commit → push → purge jsDelivr → `deploy.py`.
7. **Cache flush:** `POST /wp-json/fbf/v1/flush-cache` with the App Password — purges GoDaddy *and*
   the Cloudflare edge. `deploy.py` already calls it at the end of every run.
   ⚠️ HTML is served with a 31-day browser `max-age` set by GoDaddy's gateway (not changeable from
   PHP), so *your own browser* may hold a stale copy — hard-refresh before reporting a problem.
   To check whether something is genuinely broken or just cached, request it with `?v=<random>`.
8. **Sitemap: nothing to do.** Rank Math's sitemap cache is disabled in the mu-plugin.
9. Verify live: meta description, ~3–4KB BlogPosting JSON-LD, excerpt on the homepage grid.

# 9. Open / uncertain

- Posts-per-week is a guardrail, not a law — the gate wins.
- Amazon uncloak: parked pending William.
- GA4: star `affiliate_click` + `newsletter_signup` as Key events once they clear processing lag.
- `lib/regs.js` covers 22 species. Pompano's FWC page 404s under the obvious slug (it lives on the
  permit page). Adding species is cheap — do it when a guide needs one.
- A species checked more recently than the dataset carries its own `verified` date and the widget
  footer prefers it, so adding one species never backdates — or forward-dates — the other 21.
- ⚠️ The widget falls back `keys → atlantic` when a species has no `keys` zone. That is right when
  the rule is statewide and **wrong** whenever Monroe follows the Gulf rule (bluefish: 10, not 3).
  Always ask which way Monroe goes before leaving `keys` out.
