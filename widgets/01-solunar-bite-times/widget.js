/*!
 * FBF Solunar Bite-Time widget — render layer.
 * Depends on: FBFSolunar (lib/solunar.js) and FBF_REGIONS (lib/regions.js).
 * Self-contained: injects its own scoped <style>, no external CSS.
 *
 * Usage in a page:
 *   <div data-fbf-solunar data-region="tampa-bay"></div>
 * Auto-inits on load; or call FBFSolunarWidget.render(el, 'tampa-bay').
 */
(function (global) {
  'use strict';

  var NAVY = '#0B2A3C', TEAL = '#0D9488', CORAL = '#E8634A', SAND = '#F5F0E8';
  var SITE = 'https://floridasbestfishing.com/';
  var STYLE_ID = 'fbf-solunar-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = ''
      + '.fbf-sol{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
      +   'border:1px solid #e2e8e4;border-top:4px solid ' + TEAL + ';border-radius:10px;'
      +   'background:' + SAND + ';color:' + NAVY + ';padding:18px 20px;margin:22px 0;'
      +   'box-shadow:0 2px 10px rgba(11,42,60,.06);max-width:560px}'
      + '.fbf-sol *{box-sizing:border-box}'
      + '.fbf-sol-title{font-size:1.18em;font-weight:800;margin:0}'
      + '.fbf-sol-sub{font-size:.9em;color:#4a6168;margin:2px 0 0}'
      + '.fbf-sol-rating{display:flex;align-items:center;justify-content:space-between;'
      +   'gap:10px;flex-wrap:wrap;margin:12px 0 4px;padding:10px 12px;background:#fff;border-radius:8px}'
      + '.fbf-sol-stars{font-size:1.25em;letter-spacing:2px;line-height:1}'
      + '.fbf-sol-stars .on{color:' + CORAL + '}.fbf-sol-stars .off{color:#d6cfc2}'
      + '.fbf-sol-rlabel{font-size:.78em;color:#4a6168;display:block;margin-top:2px}'
      + '.fbf-sol-moon{font-size:.9em;color:' + NAVY + ';text-align:right}'
      + '.fbf-sol-moon b{display:block;font-weight:700}'
      + '.fbf-sol-list{list-style:none;margin:10px 0 0;padding:0}'
      + '.fbf-sol-win{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:6px 0;'
      +   'background:#fff;border-radius:8px;border-left:4px solid #ccc}'
      + '.fbf-sol-win.major{border-left-color:' + TEAL + '}'
      + '.fbf-sol-win.minor{border-left-color:' + CORAL + '}'
      + '.fbf-sol-win.active{box-shadow:0 0 0 2px ' + TEAL + ';background:#effaf6}'
      + '.fbf-sol-win .wl{flex:1;min-width:0}'
      + '.fbf-sol-win .wt{font-weight:800;font-size:1.02em;white-space:nowrap}'
      + '.fbf-sol-win .wk{font-size:.8em;color:#4a6168}'
      + '.fbf-sol-badge{font-size:.68em;font-weight:800;letter-spacing:.04em;text-transform:uppercase;'
      +   'padding:3px 8px;border-radius:20px;white-space:nowrap}'
      + '.fbf-sol-badge.now{background:' + TEAL + ';color:#fff}'
      + '.fbf-sol-badge.next{background:' + SAND + ';color:' + NAVY + ';border:1px solid #d6cfc2}'
      + '.fbf-sol-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;'
      +   'flex-wrap:wrap;margin-top:12px;font-size:.82em;color:#4a6168}'
      + '.fbf-sol-foot a{color:' + TEAL + ';font-weight:700;text-decoration:none}'
      + '.fbf-sol-foot a:hover{text-decoration:underline}';
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  var TZ = 'America/New_York';
  var fmtTime = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  var fmtDate = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' });

  function range(a, b) {
    // "6:42 – 8:42 AM" (collapse the meridiem if both share it)
    var pa = fmtTime.formatToParts(a), pb = fmtTime.formatToParts(b);
    function mer(p) { for (var i = 0; i < p.length; i++) if (p[i].type === 'dayPeriod') return p[i].value; return ''; }
    var sa = fmtTime.format(a), sb = fmtTime.format(b);
    if (mer(pa) === mer(pb)) sa = sa.replace(' ' + mer(pa), '');
    return sa + '–' + sb;
  }
  function stars(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) out += '<span class="' + (i <= n ? 'on' : 'off') + '">★</span>';
    return out;
  }
  function ratingWord(n) {
    return ['', 'Slow', 'Fair', 'Good', 'Very good', 'Prime'][n] || '';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function regionBySlug(slug) {
    var r = (global.FBF_REGIONS || []);
    for (var i = 0; i < r.length; i++) if (r[i].slug === slug) return r[i];
    return r[0];
  }

  function render(el, slug) {
    if (!global.FBFSolunar) { el.textContent = 'Solunar engine not loaded.'; return; }
    injectStyles();
    var region = regionBySlug(slug || el.getAttribute('data-region'));
    var now = Date.now();
    var data = global.FBFSolunar.getDayWindows(new Date(now), region.lat, region.lng, TZ);

    // tag active / next
    var nextIdx = -1;
    data.windows.forEach(function (w, i) {
      w._active = now >= w.start.getTime() && now <= w.end.getTime();
      if (nextIdx === -1 && w.start.getTime() > now) nextIdx = i;
    });

    var rows = data.windows.map(function (w, i) {
      var isMajor = w.type === 'major';
      var kind = isMajor ? 'Major' : 'Minor';
      var note = w.label.replace(/^.*\(/, '').replace(/\)$/, '');
      var badge = w._active
        ? '<span class="fbf-sol-badge now">Biting now</span>'
        : (i === nextIdx ? '<span class="fbf-sol-badge next">Next up</span>' : '');
      return '<li class="fbf-sol-win ' + w.type + (w._active ? ' active' : '') + '">'
        + '<div class="wl"><div class="wt">' + range(w.start, w.end) + '</div>'
        + '<div class="wk">' + kind + ' · ' + esc(note) + '</div></div>'
        + badge + '</li>';
    }).join('');

    var html = '<div class="fbf-sol">'
      + '<div class="fbf-sol-title">🎣 Today’s Bite Times</div>'
      + '<div class="fbf-sol-sub">' + esc(region.name) + ' · ' + fmtDate.format(new Date(now)) + '</div>'
      + '<div class="fbf-sol-rating">'
      +   '<div><div class="fbf-sol-stars">' + stars(data.moon.dayRating) + '</div>'
      +     '<span class="fbf-sol-rlabel">' + ratingWord(data.moon.dayRating) + ' fishing day</span></div>'
      +   '<div class="fbf-sol-moon"><b>' + esc(data.moon.phaseName) + '</b>'
      +     Math.round(data.moon.illumination * 100) + '% lit</div>'
      + '</div>'
      + '<ul class="fbf-sol-list">' + rows + '</ul>'
      + '<div class="fbf-sol-foot">'
      +   '<span>☀ ' + fmtTime.format(data.sun.sunrise) + '–' + fmtTime.format(data.sun.sunset)
      +     ' · all times ET · solunar model</span>'
      +   '<a href="' + SITE + region.slug + '/">Plan a trip →</a>'
      + '</div></div>';

    el.innerHTML = html;
  }

  function autoInit() {
    var els = document.querySelectorAll('[data-fbf-solunar]');
    for (var i = 0; i < els.length; i++) render(els[i]);
  }

  // refresh every minute so "Biting now / Next up" stays accurate
  function startTicker() {
    setInterval(function () {
      var els = document.querySelectorAll('[data-fbf-solunar]');
      for (var i = 0; i < els.length; i++) render(els[i]);
    }, 60000);
  }

  global.FBFSolunarWidget = { render: render, autoInit: autoInit };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { autoInit(); startTicker(); });
  } else { autoInit(); startTicker(); }

})(typeof window !== 'undefined' ? window : this);
