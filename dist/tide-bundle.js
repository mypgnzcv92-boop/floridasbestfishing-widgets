/*!
 * FBF Regions — the 10 live region pages on floridasbestfishing.com.
 * Shared lat/lng (for solunar/sun-moon math) + NOAA CO-OPS station (for tides)
 * + page slug (for internal links/CTAs) + the region's OWN time zone. Every
 * time a widget shows for a region is rendered in that zone, never the
 * visitor's — and the western Panhandle really is Central time.
 * Reused by every region-aware widget.
 */
(function (global) {
  'use strict';
  var ET = 'America/New_York', CT = 'America/Chicago';
  // NOAA only has gauges at the inlets. Inside the lagoons the water moves with the wind
  // far more than the moon, and saying so beats pretending the inlet number applies.
  var LAGOON = 'The lagoon itself is wind-driven more than tidal — this inlet station shows the swing at the pass, and it fades fast inside.';
  global.FBF_REGIONS = [
    { slug: 'jacksonville-ne-florida',     name: 'Jacksonville / NE Florida', lat: 30.39, lng: -81.43, station: '8720218', stationName: 'Mayport (St. Johns River entrance)', tz: ET, tzLabel: 'ET' },
    { slug: 'indian-river-lagoon',         name: 'Indian River Lagoon',       lat: 27.45, lng: -80.32, station: '8722212', stationName: 'Fort Pierce Inlet (South Jetty)', tz: ET, tzLabel: 'ET', tideNote: LAGOON },
    { slug: 'mosquito-lagoon',             name: 'Mosquito Lagoon',           lat: 28.93, lng: -80.81, station: '8721138', stationName: 'Ponce de Leon Inlet', tz: ET, tzLabel: 'ET', tideNote: LAGOON },
    { slug: 'southeast-coast',             name: 'Southeast Coast',           lat: 25.73, lng: -80.16, station: '8723214', stationName: 'Virginia Key, Miami', tz: ET, tzLabel: 'ET' },
    { slug: 'florida-keys',                name: 'Florida Keys',              lat: 24.55, lng: -81.81, station: '8724580', stationName: 'Key West', tz: ET, tzLabel: 'ET' },
    { slug: 'everglades-flamingo',         name: 'Everglades / Flamingo',     lat: 25.86, lng: -81.39, station: '8725114', stationName: 'Naples Bay (nearest NOAA station)', tz: ET, tzLabel: 'ET',
      tideNote: 'Naples Bay is the nearest gauge. Florida Bay and Flamingo see smaller, later tides than this card shows — treat these as Gulf-side timing.' },
    { slug: 'charlotte-harbor-boca-grande',name: 'Charlotte Harbor',          lat: 26.72, lng: -82.26, station: '8725520', stationName: 'Fort Myers (nearest NOAA station)', tz: ET, tzLabel: 'ET',
      tideNote: 'Fort Myers is the nearest gauge and sits up the Caloosahatchee, so the Gulf passes turn earlier than this card shows.' },
    { slug: 'tampa-bay',                   name: 'Tampa Bay',                 lat: 27.76, lng: -82.63, station: '8726520', stationName: 'St. Petersburg', tz: ET, tzLabel: 'ET' },
    { slug: 'cedar-key-nature-coast',      name: 'Cedar Key / Nature Coast',  lat: 29.13, lng: -83.03, station: '8727520', stationName: 'Cedar Key', tz: ET, tzLabel: 'ET' },
    { slug: 'panhandle',                   name: 'Panhandle',                 lat: 30.40, lng: -87.21, station: '8729840', stationName: 'Pensacola', tz: CT, tzLabel: 'CT' }
  ];
})(typeof window !== 'undefined' ? window : this);


/*!
 * FBF Tides — NOAA CO-OPS high/low predictions for a station, plus the time
 * formatting every tide display on the site shares.
 *
 * Requests GMT and formats in the region's IANA zone with Intl, so the card is
 * identical whether the reader sits in Miami or Denver, and "upcoming" is
 * judged against real now. No key; CORS is open (access-control-allow-origin: *).
 */
(function (global) {
  'use strict';
  var API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  var TTL = 6 * 3600000;   // a tab left open overnight refetches
  var cache = {};          // station:hours -> { at, p }
  var fmts = {};

  function fmt(tz, key, opts) {
    var k = tz + '|' + key;
    if (!fmts[k]) { opts.timeZone = tz; fmts[k] = new Intl.DateTimeFormat('en-US', opts); }
    return fmts[k];
  }
  // YYYYMMDD in UTC — what begin_date means when time_zone=gmt
  function ymdUTC(date) { return date.toISOString().slice(0, 10).replace(/-/g, ''); }

  function fetchHiLo(station, hours) {
    hours = hours || 72;   // diurnal stations (St. Petersburg, Pensacola) only give ~2 events a day
    var key = station + ':' + hours, hit = cache[key];
    if (hit && Date.now() - hit.at < TTL) return hit.p;
    // start six hours back so the first upcoming event is never cut off by the day boundary
    var url = API + '?begin_date=' + ymdUTC(new Date(Date.now() - 6 * 3600000)) + '&range=' + hours
      + '&product=predictions&datum=MLLW&units=english&time_zone=gmt&interval=hilo&format=json'
      + '&station=' + encodeURIComponent(station) + '&application=floridasbestfishing';
    var p = global.fetch(url).then(function (r) {
      if (!r.ok) throw new Error('NOAA HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      var list = (j && j.predictions) || [];
      if (!list.length) throw new Error((j && j.error && j.error.message) || 'no predictions');
      return list.map(function (x) {
        return { at: new Date(x.t.replace(' ', 'T') + 'Z'), type: x.type === 'H' ? 'H' : 'L', ft: parseFloat(x.v) };
      });
    });
    cache[key] = { at: Date.now(), p: p };
    p.then(null, function () { delete cache[key]; });   // a failure is not worth remembering
    return p;
  }

  function upcoming(list, nowMs, n) {
    var out = [];
    for (var i = 0; i < list.length; i++) if (list[i].at.getTime() >= nowMs) out.push(list[i]);
    return out.slice(0, n || 4);
  }

  function ymd(d, tz) { return fmt(tz, 'y', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }

  global.FBFTides = {
    fetchHiLo: fetchHiLo,
    upcoming: upcoming,
    fmtTime: function (d, tz) { return fmt(tz, 't', { hour: 'numeric', minute: '2-digit' }).format(d); },
    fmtDay: function (d, tz) { return fmt(tz, 'd', { weekday: 'long', month: 'short', day: 'numeric' }).format(d); },
    fmtWeekday: function (d, tz) { return fmt(tz, 'w', { weekday: 'short' }).format(d); },
    ymd: ymd,
    sameDay: function (a, b, tz) { return ymd(a, tz) === ymd(b, tz); },
    tzAbbr: function (d, tz) {
      var parts = fmt(tz, 'z', { timeZoneName: 'short' }).formatToParts(d);
      for (var i = 0; i < parts.length; i++) if (parts[i].type === 'timeZoneName') return parts[i].value;
      return '';
    },
    stationUrl: function (station) { return 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=' + station; }
  };
})(typeof window !== 'undefined' ? window : this);


/*!
 * FBF Widget #05 — Live NOAA tides for a region.
 *
 * Replaces the inline tide script the region pages carried since June 2026.
 * Why a bundle and not inline: the 2026-08-15 rebuild re-saved page content
 * unslashed and stripped every backslash out of that script — a SyntaxError
 * on ten pages. Nothing inside a page can break a loader.
 *
 * Depends on: FBF_REGIONS (lib/regions.js) and FBFTides (lib/tides.js).
 *
 * Usage:
 *   <div data-fbf-tide data-region="tampa-bay"></div>                   fixed region (region pages)
 *   <div data-fbf-tide data-region="tampa-bay" data-picker="1"></div>   region select, remembered
 *
 * Every time is rendered in the REGION's zone (the Panhandle is Central) and
 * "upcoming" is judged against real now — a reader in Denver sees the same
 * card as a reader in Tampa.
 */
(function (global) {
  'use strict';

  var NAVY = '#0B2A3C', DEEP = '#0F3A50', BONE = '#F4EFE6', RULE = '#E0D6C4';
  var BRASS = '#C9A24B', BRASS_INK = '#8A6D24', INK = '#16232C', MUTED = '#5a6b73';
  var FONT = "'Source Serif 4',Georgia,serif", LABEL = "'Cinzel',Georgia,serif";
  var STYLE_ID = 'fbf-tide-style', STORE = 'fbf-region', SHOW = 4;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = ''
      + '.fbf-tide{font-family:' + FONT + ';border:1px solid ' + RULE + ';border-top:4px solid ' + NAVY + ';'
      +   'border-radius:2px;background:' + BONE + ';padding:18px 20px;margin:22px 0;'
      +   'box-shadow:0 2px 10px rgba(11,42,60,.06);line-height:1.5;font-size:16px}'
      + '.fbf-tide *{box-sizing:border-box}'
      // Host sections (the homepage / tools "bite" band) set light text on dark. Re-assert ink on
      // every descendant so nothing inherits sand-on-white; the specific rules below override it.
      + '.fbf-tide,.fbf-tide *{color:' + INK + '}'
      + '.fbf-tide .fbf-tide-head{font-size:1.15em;font-weight:700;color:' + NAVY + ';margin:0 0 4px}'
      + '.fbf-tide .fbf-tide-sub{font-size:.85em;color:' + MUTED + ';margin:0 0 12px}'
      + '.fbf-tide .fbf-tide-pick{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px}'
      + '.fbf-tide .fbf-tide-pick label{font-family:' + LABEL + ';font-size:11px;font-weight:600;'
      +   'letter-spacing:.12em;text-transform:uppercase;color:' + MUTED + '}'
      + '.fbf-tide .fbf-tide-pick select{flex:1;min-width:180px;max-width:320px;padding:8px 10px;'
      +   'border:1px solid ' + RULE + ';border-radius:2px;background:#fff;font-family:' + FONT + ';'
      +   'font-size:15px;color:' + INK + '}'
      + '.fbf-tide .fbf-tide-rows{display:flex;flex-wrap:wrap;gap:10px}'
      + '.fbf-tide .fbf-tide-row{flex:1 1 110px;background:#fff;border-radius:2px;padding:10px 12px;'
      +   'text-align:center;border:1px solid #eee}'
      + '.fbf-tide .fbf-tide-type{font-family:' + LABEL + ';font-weight:600;font-size:.72em;'
      +   'text-transform:uppercase;letter-spacing:.08em;color:' + NAVY + '}'
      + '.fbf-tide .fbf-tide-row.low .fbf-tide-type{color:' + BRASS_INK + '}'
      + '.fbf-tide .fbf-tide-time{font-size:1.25em;font-weight:700;color:' + NAVY + ';margin:2px 0}'
      + '.fbf-tide .fbf-tide-h{font-size:.8em;color:' + MUTED + '}'
      + '.fbf-tide .fbf-tide-msg{flex:1 1 100%;color:' + MUTED + ';padding:6px 0}'
      + '.fbf-tide .fbf-tide-note{margin:12px 0 0;padding:9px 11px;background:#fff;'
      +   'border-left:3px solid ' + BRASS + ';font-size:.88em;color:' + INK + '}'
      + '.fbf-tide .fbf-tide-foot{margin:12px 0 0;font-size:.82em;color:' + MUTED + ';font-style:italic}'
      + '.fbf-tide .fbf-tide-foot b{color:' + NAVY + ';font-style:normal}'
      + '.fbf-tide .fbf-tide-src{display:block;margin-top:4px;font-style:normal;color:' + MUTED + '}'
      // !important is required, not cosmetic: the bite band sets `.fbf-bite a{color:brass!important}`,
      // which is ~2:1 on this bone card.
      + '.fbf-tide .fbf-tide-src a,.fbf-tide .fbf-tide-msg a{color:' + DEEP + '!important;'
      +   'font-weight:600;text-decoration:underline}';
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function regions() { return global.FBF_REGIONS || []; }
  function bySlug(slug) {
    var r = regions();
    for (var i = 0; i < r.length; i++) if (r[i].slug === slug) return r[i];
    return null;
  }
  function remembered() { try { return global.localStorage.getItem(STORE); } catch (e) { return null; } }
  function remember(slug) { try { global.localStorage.setItem(STORE, slug); } catch (e) { /* private mode */ } }
  function fromQuery() {
    var m = /[?&]region=([a-z0-9-]+)/i.exec(global.location.search || '');
    return m ? m[1].toLowerCase() : null;
  }
  function pickInitial(mount, picker) {
    var attr = mount.getAttribute('data-region');
    if (!picker) return bySlug(attr) || regions()[0];          // a region page always shows its own water
    return bySlug(fromQuery()) || bySlug(remembered()) || bySlug(attr) || regions()[0];
  }

  function draw(card, region) {
    var T = global.FBFTides;
    var tz = region.tz || 'America/New_York';
    var now = new Date();
    card.innerHTML = '';

    card.appendChild(el('p', 'fbf-tide-head', '🌊 ' + region.name + ' Tides — ' + T.fmtDay(now, tz)));
    card.appendChild(el('p', 'fbf-tide-sub', 'Station: ' + (region.stationName || ('NOAA ' + region.station))
      + ' · live from NOAA · times in ' + (region.tzLabel || T.tzAbbr(now, tz))));

    var rows = el('div', 'fbf-tide-rows');
    rows.appendChild(el('div', 'fbf-tide-msg', 'Loading today’s tide times…'));
    card.appendChild(rows);

    if (region.tideNote) card.appendChild(el('div', 'fbf-tide-note', region.tideNote));

    var foot = el('p', 'fbf-tide-foot');
    foot.appendChild(el('b', null, 'Pro tip:'));
    foot.appendChild(document.createTextNode(' Fish the moving water — the bite fires up as the tide swings; slack tide usually slows it down.'));
    var src = el('span', 'fbf-tide-src', 'Tide data: NOAA Tides & Currents · ');
    var a = el('a', null, 'station ' + region.station);
    a.href = T.stationUrl(region.station); a.target = '_blank'; a.rel = 'noopener';
    src.appendChild(a);
    foot.appendChild(src);
    card.appendChild(foot);

    T.fetchHiLo(region.station).then(function (list) {
      var next = T.upcoming(list, now.getTime(), SHOW);
      if (!next.length) throw new Error('no upcoming');
      rows.innerHTML = '';
      next.forEach(function (x) {
        var row = el('div', 'fbf-tide-row ' + (x.type === 'H' ? 'high' : 'low'));
        row.appendChild(el('div', 'fbf-tide-type', x.type === 'H' ? '▲ High' : '▼ Low'));
        row.appendChild(el('div', 'fbf-tide-time', T.fmtTime(x.at, tz)));
        var when = x.ft.toFixed(1) + ' ft';
        if (!T.sameDay(x.at, now, tz)) when += ' · ' + T.fmtWeekday(x.at, tz);
        row.appendChild(el('div', 'fbf-tide-h', when));
        rows.appendChild(row);
      });
    }).catch(function () {
      rows.innerHTML = '';
      var msg = el('div', 'fbf-tide-msg', 'Tide data unavailable right now (NOAA station ' + region.station + '). ');
      var a2 = el('a', null, 'Open the NOAA station page →');
      a2.href = T.stationUrl(region.station); a2.target = '_blank'; a2.rel = 'noopener';
      msg.appendChild(a2);
      rows.appendChild(msg);
    });
  }

  function render(mount) {
    if (!global.FBFTides || !regions().length) { mount.textContent = 'Tide engine not loaded.'; return; }
    injectStyles();
    var picker = mount.hasAttribute('data-picker');
    var region = pickInitial(mount, picker);
    mount.innerHTML = '';
    if (!/(^|\s)fbf-tide(\s|$)/.test(mount.className)) mount.className = (mount.className ? mount.className + ' ' : '') + 'fbf-tide';

    var card = el('div', 'fbf-tide-card');
    if (picker) {
      var wrap = el('div', 'fbf-tide-pick');
      var lab = el('label', null, 'Region');
      var sel = document.createElement('select');
      sel.id = 'fbf-tide-sel-' + Math.floor(Math.random() * 1e6);
      lab.htmlFor = sel.id;
      regions().forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.slug; o.textContent = r.name;
        if (r.slug === region.slug) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        var r = bySlug(sel.value); if (!r) return;
        remember(r.slug);
        mount.setAttribute('data-region', r.slug);
        draw(card, r);
      });
      wrap.appendChild(lab); wrap.appendChild(sel);
      mount.appendChild(wrap);
    }
    mount.appendChild(card);
    mount.setAttribute('data-region', region.slug);
    draw(card, region);
    mount._fbfTideDraw = function () { draw(card, bySlug(mount.getAttribute('data-region')) || region); };
  }

  function autoInit() {
    var nodes = document.querySelectorAll('[data-fbf-tide]');
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].getAttribute('data-fbf-done')) {
        nodes[i].setAttribute('data-fbf-done', '1');
        render(nodes[i]);
      }
    }
  }
  // "upcoming" drifts through the day; redraw every 10 minutes from the cached fetch
  function startTicker() {
    setInterval(function () {
      var nodes = document.querySelectorAll('[data-fbf-tide][data-fbf-done]');
      for (var i = 0; i < nodes.length; i++) if (nodes[i]._fbfTideDraw) nodes[i]._fbfTideDraw();
    }, 600000);
  }

  global.FBFTideWidget = { render: render, autoInit: autoInit };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { autoInit(); startTicker(); });
  } else { autoInit(); startTicker(); }
})(typeof window !== 'undefined' ? window : this);
