/*!
 * FBF "Pick the Right Setup" — Florida rod/reel/line matcher.
 * Depends on: FBFAffiliate (lib/affiliate.js).
 * Self-contained render (injects scoped CSS). Loaded as a hosted file via
 * jsDelivr — NEVER inline in WordPress content (WP garbles inline HTML-in-JS).
 *
 * Usage:  <div data-fbf-setup data-scenario="inshore-allround"></div>
 */
(function (global) {
  'use strict';

  var NAVY = '#0B2A3C', TEAL = '#0D9488', CORAL = '#E8634A', SAND = '#F5F0E8';
  var STYLE_ID = 'fbf-setup-style';

  // scenario -> matched rod/reel/braid/leader spec. kw = Amazon search phrase.
  var S = {
    'inshore-allround': { label: 'Inshore all-around (reds & trout)',
      why: 'The do-everything flats rig — light enough to cast all day, with enough backbone for a slot red.',
      rod: { spec: '7–7′6" medium, fast spinning', kw: '7′6 medium fast inshore spinning rod' },
      reel: { spec: '2500–3000 size', kw: '3000 saltwater spinning reel' },
      braid: { spec: '10–15 lb braid', kw: '15 lb braided fishing line' },
      leader: { spec: '20–25 lb fluorocarbon', kw: '25 lb fluorocarbon leader' } },
    'big-snook': { label: 'Big snook (docks & mangroves)',
      why: 'Snook bury into structure and have sandpaper gill plates — you need to turn their head fast and abrasion-proof leader.',
      rod: { spec: '7–7′6" medium-heavy, fast', kw: '7′6 medium heavy inshore spinning rod' },
      reel: { spec: '3000–4000 size', kw: '4000 saltwater spinning reel' },
      braid: { spec: '20–30 lb braid', kw: '30 lb braided fishing line' },
      leader: { spec: '30–40 lb fluorocarbon', kw: '40 lb fluorocarbon leader' } },
    'seatrout': { label: 'Spotted seatrout (finesse)',
      why: 'Trout have soft mouths — a lighter tip protects the hook-hold and casts light jigs and corks.',
      rod: { spec: '7′ medium-light, fast', kw: '7ft medium light spinning rod inshore' },
      reel: { spec: '2500 size', kw: '2500 spinning reel saltwater' },
      braid: { spec: '10 lb braid', kw: '10 lb braided fishing line' },
      leader: { spec: '15–20 lb fluorocarbon', kw: '20 lb fluorocarbon leader' } },
    'tarpon': { label: 'Tarpon (beach & pass)',
      why: '150-lb silver kings demand a sealed big-game reel, heavy braid, and a shock leader that survives a jumping, head-shaking fight.',
      rod: { spec: '7–7′6" heavy spinning', kw: 'heavy saltwater spinning rod tarpon' },
      reel: { spec: '6000–8000 sealed', kw: '8000 sealed saltwater spinning reel' },
      braid: { spec: '50–65 lb braid', kw: '65 lb braided fishing line' },
      leader: { spec: '60–80 lb fluorocarbon', kw: '80 lb fluorocarbon leader' } },
    'flounder': { label: 'Flounder & inshore bottom',
      why: 'A sensitive tip telegraphs the soft flounder "thump" as you drag a jig along the bottom.',
      rod: { spec: '7′ medium, fast', kw: '7ft medium fast spinning rod' },
      reel: { spec: '2500–3000 size', kw: '3000 spinning reel saltwater' },
      braid: { spec: '10–15 lb braid', kw: '15 lb braided fishing line' },
      leader: { spec: '20 lb fluorocarbon', kw: '20 lb fluorocarbon leader' } },
    'beginner': { label: 'Beginner all-around (just starting)',
      why: 'Skip the choice paralysis — a quality matched combo gets you fishing today and handles 90% of Florida inshore.',
      rod: { spec: '7′ medium spinning combo (rod + reel)', kw: 'inshore spinning rod and reel combo saltwater' },
      reel: { spec: 'Comes with the combo', kw: 'saltwater spinning combo inshore' },
      braid: { spec: '10–15 lb braid (or 12 lb mono to start)', kw: '15 lb braided fishing line' },
      leader: { spec: '20 lb fluorocarbon', kw: '20 lb fluorocarbon leader' } },
    'pier': { label: 'Pier & jetty',
      why: 'Versatile reach and lifting power for everything from sheepshead at the pilings to kings off the end.',
      rod: { spec: '7–8′ medium-heavy', kw: '8ft medium heavy spinning rod' },
      reel: { spec: '4000–6000 size', kw: '5000 spinning reel saltwater' },
      braid: { spec: '20–30 lb braid', kw: '30 lb braided fishing line' },
      leader: { spec: '30–40 lb fluorocarbon', kw: '40 lb fluorocarbon leader' } },
    'surf': { label: 'Surf & beach',
      why: 'Length gets your bait past the breakers; a bigger reel holds line for pompano, snook and the occasional shark.',
      rod: { spec: '9–10′ medium-heavy surf', kw: '10ft surf fishing rod' },
      reel: { spec: '5000–6000 size', kw: '6000 surf spinning reel' },
      braid: { spec: '20–30 lb braid', kw: '30 lb braided fishing line' },
      leader: { spec: '30–40 lb (shock / abrasion)', kw: '40 lb monofilament leader fishing' } },
    'nearshore': { label: 'Nearshore (kings, cobia, Spanish)',
      why: 'Fast, toothy fish near the beach — you want a fast retrieve, abrasion-proof leader, and wire for sharp-toothed kingfish.',
      rod: { spec: '7′ medium-heavy, fast', kw: '7ft medium heavy spinning rod nearshore' },
      reel: { spec: '4000–6000 sealed', kw: '6000 sealed saltwater spinning reel' },
      braid: { spec: '20–30 lb braid', kw: '30 lb braided fishing line' },
      leader: { spec: '40 lb fluoro (+ wire for kings)', kw: '40 lb fluorocarbon leader' } },
    'offshore-bottom': { label: 'Offshore bottom (snapper, grouper, AJ)',
      why: 'Big bottom fish pull hard toward the rocks — you need lifting power and heavy line to crank them up before they break you off.',
      rod: { spec: '6′6"–7′ heavy (conventional or heavy spin)', kw: 'heavy offshore jigging rod conventional' },
      reel: { spec: 'Conventional, or 8000–10000 sealed spin', kw: 'saltwater conventional reel offshore' },
      braid: { spec: '50–80 lb braid', kw: '65 lb braided fishing line' },
      leader: { spec: '60–100 lb fluoro or mono', kw: '80 lb fluorocarbon leader' } },
    'offshore-troll': { label: 'Offshore trolling (mahi, wahoo, sails)',
      why: 'Trolling a spread is about matched outfits and drag — lever-drag conventional reels and trolling rods for sustained pulls on pelagics.',
      rod: { spec: '30–50 lb class trolling rods', kw: 'offshore trolling rod 30 50 lb class' },
      reel: { spec: 'Lever-drag conventional', kw: 'lever drag trolling reel saltwater' },
      braid: { spec: '50–80 lb mono or braid', kw: 'offshore trolling line 80 lb' },
      leader: { spec: '60–130 lb (wind-on; wire for wahoo)', kw: 'wind on leader offshore' } }
  };

  var ORDER = ['inshore-allround', 'big-snook', 'seatrout', 'tarpon', 'flounder', 'beginner', 'pier', 'surf', 'nearshore', 'offshore-bottom', 'offshore-troll'];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = ''
      + '.fbf-set{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
      +   'border:1px solid #e2e8e4;border-top:4px solid ' + NAVY + ';border-radius:10px;'
      +   'background:' + SAND + ';color:' + NAVY + ';padding:18px 20px;margin:22px 0;'
      +   'box-shadow:0 2px 10px rgba(11,42,60,.06);max-width:580px}'
      + '.fbf-set *{box-sizing:border-box}'
      + '.fbf-set-title{font-size:1.18em;font-weight:800;margin:0}'
      + '.fbf-set-sub{font-size:.9em;color:#4a6168;margin:2px 0 12px}'
      + '.fbf-set-field label{display:block;font-size:.72em;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#4a6168;margin-bottom:3px}'
      + '.fbf-set-field select{width:100%;font-size:.95em;padding:8px 10px;border:1px solid #cfd8d4;border-radius:8px;background:#fff;color:' + NAVY + '}'
      + '.fbf-set-list{list-style:none;margin:12px 0 0;padding:0}'
      + '.fbf-set-row{display:flex;align-items:center;gap:10px;background:#fff;border-radius:8px;border-left:4px solid ' + TEAL + ';padding:9px 12px;margin:6px 0}'
      + '.fbf-set-row .rl{flex:0 0 64px;font-size:.7em;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:' + TEAL + '}'
      + '.fbf-set-row .rs{flex:1;font-weight:600;font-size:.95em}'
      + '.fbf-set-row a{font-size:.82em;font-weight:700;color:' + CORAL + ';text-decoration:none;white-space:nowrap}'
      + '.fbf-set-row a:hover{text-decoration:underline}'
      + '.fbf-set-why{font-size:.9em;color:#3c5158;background:#fff;border-radius:8px;padding:9px 12px;margin:8px 0 0}'
      + '.fbf-set-why b{color:' + NAVY + '}'
      + '.fbf-set-foot{margin-top:12px;font-size:.74em;color:#6b7d82;font-style:italic}';
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function specHtml(key) {
    var sc = S[key]; if (!sc) return '';
    var aff = global.FBFAffiliate;
    function row(lab, comp) {
      var link = aff ? aff.search(comp.kw) : 'https://www.amazon.com/s?k=' + encodeURIComponent(comp.kw);
      return '<li class="fbf-set-row"><span class="rl">' + lab + '</span>'
        + '<span class="rs">' + esc(comp.spec) + '</span>'
        + '<a href="' + link + '" rel="sponsored nofollow" target="_blank">Shop →</a></li>';
    }
    return '<ul class="fbf-set-list">'
      + row('Rod', sc.rod) + row('Reel', sc.reel) + row('Braid', sc.braid) + row('Leader', sc.leader)
      + '</ul><div class="fbf-set-why"><b>Why:</b> ' + esc(sc.why) + '</div>';
  }

  function render(el) {
    injectStyles();
    var key = el.getAttribute('data-scenario'); if (!S[key]) key = 'inshore-allround';
    var aff = global.FBFAffiliate;
    var opts = ORDER.map(function (k) {
      return '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + esc(S[k].label) + '</option>';
    }).join('');
    el.innerHTML = '<div class="fbf-set">'
      + '<div class="fbf-set-title">🎣 Pick the Right Setup</div>'
      + '<div class="fbf-set-sub">Tell us your target — get a dialed-in rod, reel and line spec.</div>'
      + '<div class="fbf-set-field"><label>What are you fishing for?</label><select data-fbf-set-sel>' + opts + '</select></div>'
      + '<div data-fbf-set-out>' + specHtml(key) + '</div>'
      + '<div class="fbf-set-foot">' + (aff ? esc(aff.disclosure) : '') + '</div>'
      + '</div>';
    var sel = el.querySelector('[data-fbf-set-sel]');
    var out = el.querySelector('[data-fbf-set-out]');
    sel.addEventListener('change', function () { out.innerHTML = specHtml(sel.value); });
  }

  function autoInit() {
    var els = document.querySelectorAll('[data-fbf-setup]');
    for (var i = 0; i < els.length; i++) render(els[i]);
  }

  global.FBFSetupWidget = { render: render, autoInit: autoInit };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else { autoInit(); }

})(typeof window !== 'undefined' ? window : this);
