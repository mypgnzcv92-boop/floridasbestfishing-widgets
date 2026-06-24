# Widget Roadmap — floridasbestfishing.com

Turn the 10 region pages from static articles into **interactive tools** that
*manufacture* organic search traffic, differentiate from competitors, and
monetize (Amazon affiliate gear, $50–200 charter leads, MailerLite list).

## The trajectory lens (why the order is what it is)

The site is ~3 weeks old with **~0 real organic clicks** (Search Console: 47
impressions, 0 clicks). So we score each widget for **trajectory** — what
accelerates growth *from near-zero* — weighting:

1. **SEO surface** — creates indexable content / wins long-tail (~40%)
2. **Differentiation / backlink-bait** (~25%)
3. **Daily-return habit** that builds a base (~20%)
4. **Monetization-readiness** for when traffic arrives (~15%)

Pure-conversion widgets score low for now (no traffic to convert yet). **Low
maintenance is a strong plus** (solo operator).

## Top 9 to build (ranked by trajectory)

| # | Widget | Lever | Build | Upkeep |
|---|--------|-------|-------|--------|
| 1 | **Solunar bite-time calendar** | SEO | 1–2d | none |
| 2 | **Florida Access Map** (ramps/piers/reefs) | Differentiation | 3–4d | none |
| 3 | **What should I throw?** | Monetization | 2–3d | low |
| 4 | **Go / No-Go bite score** | Differentiation | 3–4d | low |
| 5 | **Rod/reel/line setup matcher** | SEO | 1–2d | low |
| 6 | **Match me to a guide** | SEO | 1–2d | low |
| 7 | **What's biting now** (region × month) | SEO | 2–3d | low |
| 8 | **FWC regulation / season checker** | SEO | 3–4d | **high** |
| 9 | **Charter Match quote quiz** | Monetization | 2–3d | low |

## Rollout cadence

- **P1 (now):** solunar bite-times · what should I throw · setup matcher — *stands up the solunar engine + gear catalog primitives*
- **P2 (wks 2–4):** go/no-go bite score · match me to a guide · what's biting now (+ access map) — *stands up Open-Meteo + MailerLite plumbing*
- **P3 (month 2):** FWC reg checker · charter match quiz · where to fish this weekend
- **P4 (wks 6–10):** cheap add-ons riding built plumbing — is-it-legal · sun/moon card · barometric · wave/swell · nearest-ramp · reef GPS
- **P5 (traffic-gated):** catch log · name-that-fish quiz · email-gated forecast · captain directory

## The one principle

**Build the shared engines first; ration maintenance.** Four primitives (solunar
engine, gear catalog, Open-Meteo plumbing, MailerLite lead plumbing) + two
datasets (seasonality matrix, map GeoJSON) each power 4–12 widgets — so after the
first few, each new widget is mostly styling. Of the whole catalog, only **one**
widget carries real perishable upkeep (the regs JSON) — that's the only
maintenance bet we take. *One person can keep one dataset current; two will rot.*

## Full catalog (63 widgets) — ★ = trajectory score

**Conditions & Forecast:** solunar bite-times ★5 · go/no-go bite score ★5 · sun&moon card ★4 · barometric trend ★4 · wave&swell ★4 · live conditions dashboard ★4 · water-temp + cold-snap alert ★4 · red tide status ★4 · pre-front feed window ★4 · bite-window countdown ★3 · water-clarity indicator ★3 · marine-warnings banner ★3

**Trip Planning & Maps:** access map (ramps/piers/reefs) ★5 · where to fish this weekend ★5 · region+date trip-planner sheet ★4 · nearest-ramp finder ★4 · brand SVG region map ★4 · reef GPS table ★4 · pier/shore-access map ★4 · golden-hour planner ★4 · printable trip sheet ★3 · tide-aware launch planner ★3

**Species, Regs & Reference:** FWC reg/season checker ★5 · is-it-legal-to-keep ★4 · what's biting now ★4 · fish ID visual key ★4 · length-to-weight ★4 · knot library ★4 · rig builder ★4 · species encyclopedia ★4 · FL/IGFA records ★4 · license/permit checker ★4 · protected-species alert ★3

**Gear & Affiliate:** what should I throw ★5 · setup matcher ★5 · tackle-box builder ★4 · beginner setup picker ★4 · live-bait rigging guide ★4 · braid-to-leader calc ★4 · seasonal gear checklist ★4 · kayak/cooler finder ★3 · charter-day packing list ★3 · sunglasses picker ★3 · drag-setting calc ★3

**Charter & Lead-Gen:** match me to a guide ★5 · charter match quote quiz ★4 · cost & split estimator ★4 · inshore-vs-offshore helper ★4 · best-window booking planner ★4 · what-will-we-catch preview ★4 · captain directory ★3 (defer) · trip-request form ★3

**Community & Engagement:** my catch log ★4 · name-that-fish quiz ★4 · guess-the-weight game ★4 · email-gated forecast ★4 · seasonal auto-refresh block ★4 · catch-of-month gallery ★3 · trivia challenge ★3 · badges/streaks ★3 · slam checklist ★3 · catch wall (UGC) ★3 (defer) · anglers' poll ★2 (defer)

## Guardrails (hard rules)

- **No Amazon prices/ratings** (TOS) — tagged Amazon SEARCH URLs (tag `floridasbestf-20`), not single ASINs.
- **Leads** via MailerLite keyless JSONP form-action, never the REST key.
- **Solunar computed locally** (solunar.org is down). `api.weather.gov` has no CORS (needs a proxy — defer).
- Format times in **America/New_York** via `Intl`.
- Keep every widget the self-contained Custom-HTML-block pattern (no backend to babysit).

_Source: 2nd multi-agent catalog workflow, 2026-06-23._
