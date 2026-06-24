# floridasbestfishing.com — Interactive Widgets

Self-contained, dependency-light interactive tools (same pattern as the live tide
widget) that embed as WordPress **Custom-HTML (`wp:html`) blocks** across the 10
region pages. Built and tested here in VS Code, then deployed to WordPress.

## Structure

```
lib/                       shared engines, reused across many widgets
  solunar.js               sun/moon astronomy + solunar feeding windows (NO network)
  regions.js               the 10 region pages: lat/lng + NOAA station + slug
widgets/NN-name/           one folder per widget
  widget.js                self-contained render (injects its own scoped CSS)
  preview.html             open in a browser to see it live
dist/                      built self-contained blocks, ready to paste into WordPress
```

## Develop

Open a widget's `preview.html` in a browser (VS Code Live Preview / Live Server, or
just double-click it — the solunar widget needs no server since it's pure math).
Edit `widget.js` or the `lib/` engine and refresh.

## Deploy to WordPress

Each widget ships as **one** self-contained Custom-HTML block = inline engine(s) +
regions data + `widget.js` + the mount element, e.g.:

```html
<div data-fbf-solunar data-region="tampa-bay"></div>
```

`unfiltered_html` is enabled on the site, so inline `<script>` survives the REST
save (same as the tide widget). A small inliner (`dist/` build step) will assemble
`lib/*.js` + `widget.js` into one block per widget — TBD; for now hand-assemble.

## Build cadence (order matters — widgets compound)

- **P1** solunar bite-times · what should I throw · setup matcher  ← *builds the solunar engine + gear catalog*
- **P2** go/no-go bite score · match me to a guide · what's biting now (+ access map)  ← *stands up Open-Meteo + MailerLite plumbing*
- **P3** FWC reg checker · charter match quiz · where to fish this weekend
- **P4** cheap add-ons riding the now-built plumbing
- **P5** traffic-gated engagement / list-building

## Guardrails (hard rules)

- **No Amazon prices/ratings** (TOS) — use tagged Amazon **SEARCH** URLs (tag
  `floridasbestf-20`), not fragile single ASINs.
- **Leads** via the MailerLite **keyless JSONP** form-action endpoint, never the REST key.
- **Solunar computed locally** (solunar.org is down). `api.weather.gov` has **no CORS**
  (needs a tiny proxy) — defer anything depending on it.
- Format times in **America/New_York** via `Intl`, never the browser's locale.
