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
