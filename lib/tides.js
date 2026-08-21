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
