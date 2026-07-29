# FishingBooker Affiliate — Placement Plan (staged, wire on approval)

Status: application submitted 2026-07-09, **pending approval**. Nothing wired until William
supplies his affiliate ID (`a_aid`). This doc is the execution spec.

## 1. Link template
```
https://fishingbooker.com/<DESTINATION_PATH>?a_aid=<AAID>
```
- If the target URL already has a query string, append `&a_aid=<AAID>` instead of `?a_aid=`.
- `a_bid` (banner id) optional — only tells you which creative drove the click; `a_aid` alone gets paid.
- Optional sub-id for per-page attribution: `&data1=tampa-review` (confirm param is enabled in dashboard).

**Confirm-once caveat:** whether a bare `?a_aid=` append attributes on its own is a dashboard-only
campaign setting (fishingbooker.com is behind Cloudflare, not externally verifiable). So:
1. Log into `fishingbooker.postaffiliatepro.com` → grab `a_aid` from Profile/Overview.
2. Promotion → Banners & Links (or Advanced tools → Deeplink generator). Enable "Support dynamic links"
   if off (email affiliate team).
3. Generate ONE deeplink to the Tampa page; open in incognito; DevTools → confirm an `a_aid` cookie is
   set + a `track.php`/`click.php` call fires.
4. Then test a hand-built `https://fishingbooker.com/<path>?a_aid=<AAID>` link the same way.
   - Cookie sets → use the clean template for all 13 pages.
   - Cookie does NOT set → use the generator's redirect output (fallback below) per link.

**Fallback (only if clean append fails):**
```
https://fishingbooker.postaffiliatepro.com/scripts/click.php?a_aid=<AAID>&a_bid=<BID>&<DESTPARAM>=<URL-ENCODED_TARGET>
```
`<BID>` and `<DESTPARAM>` are read off a link you generate in step 3 (not publicly documented).

## 2. Placement (per page)
- **Disclosure sentence** at top of page (above everything). **`(paid link)`** inline tag on every CTA.
- **Slot B (primary, strongest):** right after the review verdict / after the region's "best for…" pick.
- Secondary: end-of-post "Compare & book" callout box; optional sticky sidebar box.

### Charter reviews → deep-link to the charter's own FishingBooker listing (search name → copy `/charters/view/...`; fallback = city page)
| Page | Fallback destination | CTA (slot B) |
|---|---|---|
| Baytime Charters (Tampa inshore) | `/tampa` | "Fished with Baytime and loved it? Check their live dates & prices on FishingBooker (paid link)" |
| Far Out Fishing (Key West offshore) | `/key-west` | "Ready to run offshore out of Key West? See Far Out's open dates & prices (paid link)" |
| Islamorada on the Fly (Keys flats) | `/islamorada` | "Book your flats day in Islamorada — check this guide's availability (paid link)" |

### Region pages → deep-link to the destination results page (confirm each slug on FishingBooker)
| Page | Destination (confirm) | CTA |
|---|---|---|
| Tampa Bay | `/tampa` | "Compare Tampa Bay's top-rated inshore charters and see today's open dates (paid link)" |
| Florida Keys | `/florida-keys` | "See the best-reviewed Keys charters — reef to flats — with real-time availability (paid link)" |
| Southeast Coast | `/fort-lauderdale` or `/miami` | "Check live prices on Southeast Florida's top offshore & reef charters (paid link)" |
| Panhandle | `/destin` | "Compare Destin & the Emerald Coast's best charters and check open dates (paid link)" |
| Mosquito Lagoon | `/mosquito-lagoon` or `/new-smyrna-beach` | "Book a Mosquito Lagoon redfish & trout guide — see today's availability (paid link)" |
| Indian River Lagoon | `/indian-river` or `/titusville` | "Find a top Indian River Lagoon inshore guide and check open dates (paid link)" |
| Charlotte Harbor / Boca Grande | `/boca-grande` | "Chasing tarpon in Boca Grande? Compare the top guides and check live dates (paid link)" |
| Everglades / Flamingo | `/everglades-city` or `/flamingo` | "See the best Everglades & Flamingo backcountry charters with real-time prices (paid link)" |
| Cedar Key / Nature Coast | `/cedar-key` | "Compare Nature Coast scalloping & inshore trips and check availability (paid link)" |
| Jacksonville / NE Florida | `/jacksonville` | "Find Jacksonville's top-rated inshore & offshore charters — see open dates (paid link)" |

Optional: deep-link species-filtered URLs (tarpon for Boca Grande, redfish for Mosquito Lagoon, fly for
Islamorada) — grab the filtered URL from FishingBooker and append `?a_aid=<AAID>`.

## 3. FTC disclosure (top of each page)
> **Disclosure:** Some links below are paid affiliate links. If you book a charter through them, we earn
> a commission at no extra cost to you — and it never affects our ratings or which captains we recommend.

## 4. What I need from William (once approved)
Just the **`a_aid`** (affiliate ID) + a 60-second confirm of step 1.3 (does a hand-built `?a_aid=` link
set the cookie). Then I wire all 13 pages headlessly via WP REST in one pass.
