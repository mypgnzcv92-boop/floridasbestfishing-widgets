/*!
 * FBF Affiliate helper — shared by every gear/recommender widget.
 * Builds TOS-safe Amazon SEARCH URLs (never fragile single ASINs) with the
 * site's associate tag, plus the required disclosure line.
 */
(function (global) {
  'use strict';
  var TAG = 'floridasbestf-20';
  global.FBFAffiliate = {
    tag: TAG,
    // Amazon search URL for a keyword phrase (resilient to product link-rot)
    search: function (keywords) {
      return 'https://www.amazon.com/s?k=' + encodeURIComponent(keywords) + '&tag=' + TAG;
    },
    disclosure: 'As an Amazon Associate, Florida’s Best Fishing earns from qualifying purchases — at no extra cost to you.'
  };
})(typeof window !== 'undefined' ? window : this);
