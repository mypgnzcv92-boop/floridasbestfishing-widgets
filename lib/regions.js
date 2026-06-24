/*!
 * FBF Regions — the 10 live region pages on floridasbestfishing.com.
 * Shared lat/lng (for solunar/sun-moon math) + NOAA CO-OPS station (for tides)
 * + page slug (for internal links/CTAs). Reused by every region-aware widget.
 */
(function (global) {
  'use strict';
  global.FBF_REGIONS = [
    { slug: 'jacksonville-ne-florida',     name: 'Jacksonville / NE Florida', lat: 30.39, lng: -81.43, station: '8720218' },
    { slug: 'indian-river-lagoon',         name: 'Indian River Lagoon',       lat: 27.45, lng: -80.32, station: '8722212' },
    { slug: 'mosquito-lagoon',             name: 'Mosquito Lagoon',           lat: 28.93, lng: -80.81, station: '8721138' },
    { slug: 'southeast-coast',             name: 'Southeast Coast',           lat: 25.73, lng: -80.16, station: '8723214' },
    { slug: 'florida-keys',                name: 'Florida Keys',              lat: 24.55, lng: -81.81, station: '8724580' },
    { slug: 'everglades-flamingo',         name: 'Everglades / Flamingo',     lat: 25.86, lng: -81.39, station: '8725114' },
    { slug: 'charlotte-harbor-boca-grande',name: 'Charlotte Harbor',          lat: 26.72, lng: -82.26, station: '8725520' },
    { slug: 'tampa-bay',                   name: 'Tampa Bay',                 lat: 27.76, lng: -82.63, station: '8726520' },
    { slug: 'cedar-key-nature-coast',      name: 'Cedar Key / Nature Coast',  lat: 29.13, lng: -83.03, station: '8727520' },
    { slug: 'panhandle',                   name: 'Panhandle',                 lat: 30.40, lng: -87.21, station: '8729840' }
  ];
})(typeof window !== 'undefined' ? window : this);
