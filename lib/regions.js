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
