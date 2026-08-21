/*!
 * FBF Solunar Engine — floridasbestfishing.com
 * Self-contained, zero dependencies, ZERO network. Pure astronomy math.
 *
 * Sun/moon position, phase and times are ported from SunCalc
 * (Vladimir Agafonkin, BSD-2-Clause: https://github.com/mourner/suncalc),
 * extended here with solunar major/minor feeding-window computation.
 *
 * Exposes a single global: window.FBFSolunar
 *
 * NOTE (pre-launch validation): spot-check getDayWindows() major/minor times
 * against tides4fishing / a printed solunar table for one known FL date before
 * shipping live — these are model windows, label them as such in the UI.
 */
(function (global) {
  'use strict';

  var PI = Math.PI, rad = PI / 180,
      sin = Math.sin, cos = Math.cos, tan = Math.tan,
      asin = Math.asin, atan2 = Math.atan2, acos = Math.acos;

  var dayMs = 864e5, J1970 = 2440588, J2000 = 2451545;
  function toJulian(d) { return d.valueOf() / dayMs - 0.5 + J1970; }
  function fromJulian(j) { return new Date((j + 0.5 - J1970) * dayMs); }
  function toDays(d) { return toJulian(d) - J2000; }

  var e = rad * 23.4397; // obliquity of the ecliptic

  function rightAscension(l, b) { return atan2(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
  function declination(l, b) { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }
  function azimuth(H, phi, dec) { return atan2(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)); }
  function altitude(H, phi, dec) { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }
  function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }
  function astroRefraction(h) {
    if (h < 0) h = 0;
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
  }

  function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }
  function eclipticLongitude(M) {
    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)),
        P = rad * 102.9372;
    return M + C + P + PI;
  }
  function sunCoords(d) {
    var M = solarMeanAnomaly(d), L = eclipticLongitude(M);
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
  }

  function getSunPosition(date, lat, lng) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = sunCoords(d),
        H = siderealTime(d, lw) - c.ra;
    return { azimuth: azimuth(H, phi, c.dec), altitude: altitude(H, phi, c.dec) };
  }

  function moonCoords(d) {
    var L = rad * (218.316 + 13.176396 * d),
        M = rad * (134.963 + 13.064993 * d),
        F = rad * (93.272 + 13.229350 * d),
        l = L + rad * 6.289 * sin(M),
        b = rad * 5.128 * sin(F),
        dt = 385001 - 20905 * cos(M);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
  }

  function getMoonPosition(date, lat, lng) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d),
        H = siderealTime(d, lw) - c.ra,
        h = altitude(H, phi, c.dec);
    h = h + astroRefraction(h);
    return { azimuth: azimuth(H, phi, c.dec), altitude: h, distance: c.dist };
  }

  function getMoonIllumination(date) {
    var d = toDays(date || new Date()), s = sunCoords(d), m = moonCoords(d),
        sdist = 149598000,
        phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
        inc = atan2(sdist * sin(phi), m.dist - sdist * cos(phi)),
        angle = atan2(cos(s.dec) * sin(s.ra - m.ra),
                      sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
    return {
      fraction: (1 + cos(inc)) / 2,
      phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI,
      angle: angle
    };
  }

  // --- sun rise/set/noon (minimal SunCalc port) ---
  var J0 = 0.0009;
  function julianCycle(d, lw) { return Math.round(d - J0 - lw / (2 * PI)); }
  function approxTransit(Ht, lw, n) { return J0 + (Ht + lw) / (2 * PI) + n; }
  function solarTransitJ(ds, M, L) { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }
  function hourAngle(h, phi, d) { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
  function getSunTimes(date, lat, lng) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date),
        n = julianCycle(d, lw), ds = approxTransit(0, lw, n),
        M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0),
        Jnoon = solarTransitJ(ds, M, L),
        h0 = -0.833 * rad,
        w = hourAngle(h0, phi, dec),
        a = approxTransit(w, lw, n),
        Jset = solarTransitJ(a, M, L),
        Jrise = Jnoon - (Jset - Jnoon);
    return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset), solarNoon: fromJulian(Jnoon) };
  }

  // --- timezone helpers (so windows align to the FL local day, not the browser's) ---
  function tzOffsetMs(date, tz) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    var p = {};
    dtf.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return asUTC - date.getTime();
  }
  function startOfDayTZ(date, tz) {
    var off = tzOffsetMs(date, tz);
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date).split('-');
    return new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 0, 0, 0) - off);
  }

  function phaseName(p) {
    if (p < 0.03 || p > 0.97) return 'New Moon';
    if (p < 0.22) return 'Waxing Crescent';
    if (p < 0.28) return 'First Quarter';
    if (p < 0.47) return 'Waxing Gibbous';
    if (p < 0.53) return 'Full Moon';
    if (p < 0.72) return 'Waning Gibbous';
    if (p < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }

  /*
   * getDayWindows(date, lat, lng, tz)
   * Returns the solunar feeding windows for the LOCAL (tz) calendar day of `date`.
   *  - MAJOR windows: moon overhead (upper transit) + moon underfoot (lower transit), ±60 min
   *  - MINOR windows: moonrise + moonset, ±45 min
   *  - moon: { phase, illumination, phaseName, dayRating (1-5) }
   *  - sun:  { sunrise, sunset, solarNoon }
   * Method: sample apparent moon altitude every 2 min across the day; take the
   * global max (overhead) and min (underfoot) for majors, and horizon crossings
   * for rise/set minors. Accurate to ~couple minutes — fine for feeding windows.
   */
  function getDayWindows(date, lat, lng, tz) {
    tz = tz || 'America/New_York';
    date = date || new Date();

    var start = startOfDayTZ(date, tz).getTime();
    var stepMs = 2 * 60 * 1000;
    var samples = (24 * 60) / 2; // 720 samples across 24h
    var alts = [];
    for (var i = 0; i <= samples; i++) {
      var t = start + i * stepMs;
      alts.push({ t: t, h: getMoonPosition(new Date(t), lat, lng).altitude });
    }

    var maxI = 0, minI = 0;
    for (var j = 1; j < alts.length; j++) {
      if (alts[j].h > alts[maxI].h) maxI = j;
      if (alts[j].h < alts[minI].h) minI = j;
    }

    function interpCross(a, b) {
      var f = (0 - a.h) / (b.h - a.h);
      return a.t + f * (b.t - a.t);
    }
    var rises = [], sets = [];
    for (var k = 1; k < alts.length; k++) {
      var a = alts[k - 1], b = alts[k];
      if (a.h < 0 && b.h >= 0) rises.push(interpCross(a, b));
      if (a.h >= 0 && b.h < 0) sets.push(interpCross(a, b));
    }

    var majHalf = 60 * 60000, minHalf = 45 * 60000;
    function win(center, half, type, label) {
      return {
        type: type, label: label,
        peak: new Date(center),
        start: new Date(center - half),
        end: new Date(center + half)
      };
    }

    var majors = [
      win(alts[maxI].t, majHalf, 'major', 'Major (moon overhead)'),
      win(alts[minI].t, majHalf, 'major', 'Major (moon underfoot)')
    ];
    var minors = [];
    rises.forEach(function (t) { minors.push(win(t, minHalf, 'minor', 'Minor (moonrise)')); });
    sets.forEach(function (t) { minors.push(win(t, minHalf, 'minor', 'Minor (moonset)')); });

    var noon = new Date(start + 12 * 3600000);
    var ill = getMoonIllumination(noon);
    var sun = getSunTimes(noon, lat, lng);

    // day rating 1-5: best near new (phase ~0/1) and full (phase ~0.5)
    var ph = ill.phase;
    var dist = Math.min(Math.min(ph, 1 - ph), Math.abs(ph - 0.5)); // 0 at new/full, 0.25 at quarters
    var dayRating = Math.max(1, Math.min(5, Math.round(5 - (dist / 0.25) * 3.2)));

    var windows = majors.concat(minors).sort(function (x, y) { return x.peak - y.peak; });

    return {
      dayStart: new Date(start),
      majors: majors,
      minors: minors,
      windows: windows,
      moon: {
        phase: ph,
        illumination: ill.fraction,
        phaseName: phaseName(ph),
        dayRating: dayRating
      },
      sun: sun
    };
  }

  global.FBFSolunar = {
    getDayWindows: getDayWindows,
    getMoonIllumination: getMoonIllumination,
    getMoonPosition: getMoonPosition,
    getSunPosition: getSunPosition,
    getSunTimes: getSunTimes,
    phaseName: phaseName
  };

})(typeof window !== 'undefined' ? window : this);


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
 * FBF Solunar Bite-Time widget — render layer.
 * Depends on: FBFSolunar (lib/solunar.js) and FBF_REGIONS (lib/regions.js).
 * Self-contained: injects its own scoped <style>, no external CSS.
 *
 * Usage in a page:
 *   <div data-fbf-solunar data-region="tampa-bay"></div>                   fixed region
 *   <div data-fbf-solunar data-region="tampa-bay" data-picker="1"></div>   region select, remembered
 * Auto-inits on load; or call FBFSolunarWidget.render(el, 'tampa-bay').
 *
 * Every region renders in ITS OWN zone (lib/regions.js `tz`) — the western
 * Panhandle is Central. Never the visitor's zone.
 */
(function (global) {
  'use strict';

  var NAVY = '#0B2A3C', TEAL = '#0F3A50', CORAL = '#C9A24B', SAND = '#F4EFE6';
  // Palette retuned to the 2026 rebuild: TEAL is now the deep navy-blue used
  // for primary marks, CORAL is brass (the single accent), SAND is bone paper.
  var SITE = 'https://floridasbestfishing.com/';
  var STYLE_ID = 'fbf-solunar-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = ''
      + '.fbf-sol{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
      +   'border:1px solid #e2e8e4;border-top:4px solid ' + TEAL + ';border-radius:2px;'
      +   'background:' + SAND + ';color:' + NAVY + ';padding:18px 20px;margin:22px 0;'
      +   'box-shadow:0 2px 10px rgba(11,42,60,.06);max-width:560px}'
      + '.fbf-sol *{box-sizing:border-box}'
      // Host pages can set a light text colour on a surrounding dark section (the homepage
      // .fbf-bite wrapper sets sand). Anything here that does NOT declare its own colour would
      // inherit that and render near-invisible on the widget's white rows, so re-assert the
      // base colour on every descendant and let the specific rules below override it.
      + '.fbf-sol,.fbf-sol *{color:' + NAVY + '}'
      + '.fbf-sol-title{font-size:1.18em;font-weight:800;margin:0;color:' + NAVY + '}'
      + '.fbf-sol-sub{font-size:.9em;color:#4a6168;margin:2px 0 0}'
      + '.fbf-sol-rating{display:flex;align-items:center;justify-content:space-between;'
      +   'gap:10px;flex-wrap:wrap;margin:12px 0 4px;padding:10px 12px;background:#fff;border-radius:2px}'
      + '.fbf-sol-stars{font-size:1.25em;letter-spacing:2px;line-height:1}'
      + '.fbf-sol-stars .on{color:' + CORAL + '}.fbf-sol-stars .off{color:#d6cfc2}'
      + '.fbf-sol-rlabel{font-size:.78em;color:#4a6168;display:block;margin-top:2px}'
      + '.fbf-sol-moon{font-size:.9em;color:' + NAVY + ';text-align:right}'
      // extra .fbf-sol prefix: host rules like `.fbf-bite b` / `.fbf-bite a` are (0,1,1) and
      // would otherwise out-rank the blanket `.fbf-sol *` guard on these two elements
      + '.fbf-sol .fbf-sol-moon b{display:block;font-weight:700;color:' + NAVY + '}'
      + '.fbf-sol-list{list-style:none;margin:10px 0 0;padding:0}'
      + '.fbf-sol-win{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:6px 0;'
      +   'background:#fff;border-radius:2px;border-left:4px solid #ccc}'
      + '.fbf-sol-win.major{border-left-color:' + TEAL + '}'
      + '.fbf-sol-win.minor{border-left-color:' + CORAL + '}'
      + '.fbf-sol-win.active{box-shadow:0 0 0 2px ' + TEAL + ';background:#effaf6}'
      + '.fbf-sol-win .wl{flex:1;min-width:0}'
      + '.fbf-sol-win .wt{font-weight:800;font-size:1.02em;white-space:nowrap;color:' + NAVY + '}'
      + '.fbf-sol-win .wk{font-size:.8em;color:#4a6168}'
      + '.fbf-sol-badge{font-size:.68em;font-weight:800;letter-spacing:.04em;text-transform:uppercase;'
      +   'padding:3px 8px;border-radius:999px;white-space:nowrap}'
      + '.fbf-sol-badge.now{background:' + TEAL + ';color:#fff}'
      + '.fbf-sol-badge.next{background:' + SAND + ';color:' + NAVY + ';border:1px solid #d6cfc2}'
      + '.fbf-sol-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;'
      +   'flex-wrap:wrap;margin-top:12px;font-size:.82em;color:#4a6168}'
      // !important is required, not cosmetic: the homepage wrapper sets
      // `.fbf-bite a{color:var(--fbf-brass)!important}` for its dark section, which renders
      // brass-on-white (2.1:1) inside this widget's light card. Ours is (0,2,1) so it wins.
      + '.fbf-sol .fbf-sol-foot a{color:' + TEAL + '!important;font-weight:700;text-decoration:underline}'
      + '.fbf-sol .fbf-sol-foot a:hover{text-decoration:none}'
      // picker variant: a bone strip butted onto the top of the card
      + '.fbf-sol-pick{display:flex;align-items:center;gap:10px;flex-wrap:wrap;max-width:560px;'
      +   'margin:22px 0 0;padding:10px 12px;background:' + SAND + ';border:1px solid #e2e8e4;'
      +   'border-bottom:0;border-radius:2px 2px 0 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'
      + '.fbf-sol-pick label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4a6168}'
      + '.fbf-sol-pick select{flex:1;min-width:180px;max-width:320px;padding:8px 10px;border:1px solid #d6cfc2;'
      +   'border-radius:2px;background:#fff;font-size:15px;color:' + NAVY + '}'
      + '.fbf-sol-haspick .fbf-sol{margin-top:0;border-radius:0 0 2px 2px}';
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  var DEFAULT_TZ = 'America/New_York';
  var fmts = {};
  function fmtTimeFor(tz) {
    return fmts['t' + tz] || (fmts['t' + tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }));
  }
  function fmtDateFor(tz) {
    return fmts['d' + tz] || (fmts['d' + tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }));
  }

  function range(a, b, tz) {
    // "6:42 – 8:42 AM" (collapse the meridiem if both share it)
    var fmtTime = fmtTimeFor(tz);
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

  var STORE = 'fbf-region';
  function remembered() { try { return global.localStorage.getItem(STORE); } catch (e) { return null; } }
  function remember(slug) { try { global.localStorage.setItem(STORE, slug); } catch (e) { /* private mode */ } }
  function fromQuery() {
    var m = /[?&]region=([a-z0-9-]+)/i.exec(global.location.search || '');
    return m ? m[1].toLowerCase() : null;
  }
  function hasRegion(slug) {
    var r = (global.FBF_REGIONS || []);
    for (var i = 0; i < r.length; i++) if (r[i].slug === slug) return true;
    return false;
  }

  function draw(el, region) {
    var tz = region.tz || DEFAULT_TZ;
    var fmtTime = fmtTimeFor(tz), fmtDate = fmtDateFor(tz);
    var now = Date.now();
    var data = global.FBFSolunar.getDayWindows(new Date(now), region.lat, region.lng, tz);

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
        + '<div class="wl"><div class="wt">' + range(w.start, w.end, tz) + '</div>'
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
      +     ' · all times ' + esc(region.tzLabel || 'ET') + ' · solunar model</span>'
      +   '<a href="' + SITE + region.slug + '/">Plan a trip →</a>'
      + '</div></div>';

    el.innerHTML = html;
  }

  function render(el, slug) {
    if (!global.FBFSolunar) { el.textContent = 'Solunar engine not loaded.'; return; }
    injectStyles();
    if (!el.hasAttribute('data-picker')) {
      draw(el, regionBySlug(slug || el.getAttribute('data-region')));
      return;
    }
    // picker variant: the select is built once and survives the minute ticker; only the card redraws
    var card = el.querySelector('.fbf-sol-card');
    if (!card) {
      var q = fromQuery(), mem = remembered();
      var initial = hasRegion(q) ? q : (hasRegion(mem) ? mem : (slug || el.getAttribute('data-region')));
      el.className += (el.className ? ' ' : '') + 'fbf-sol-haspick';
      var wrap = document.createElement('div'); wrap.className = 'fbf-sol-pick';
      var lab = document.createElement('label'); lab.textContent = 'Region';
      var sel = document.createElement('select');
      sel.id = 'fbf-sol-sel-' + Math.floor(Math.random() * 1e6); lab.htmlFor = sel.id;
      (global.FBF_REGIONS || []).forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.slug; o.textContent = r.name;
        if (r.slug === initial) o.selected = true;
        sel.appendChild(o);
      });
      card = document.createElement('div'); card.className = 'fbf-sol-card';
      sel.addEventListener('change', function () {
        remember(sel.value);
        el.setAttribute('data-region', sel.value);
        draw(card, regionBySlug(sel.value));
      });
      wrap.appendChild(lab); wrap.appendChild(sel);
      el.innerHTML = '';
      el.appendChild(wrap); el.appendChild(card);
      el.setAttribute('data-region', regionBySlug(initial).slug);
    }
    draw(card, regionBySlug(el.getAttribute('data-region')));
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
