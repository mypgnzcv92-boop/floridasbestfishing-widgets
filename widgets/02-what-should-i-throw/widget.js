/*!
 * FBF "What Should I Throw?" — Florida inshore lure & bait recommender.
 * Depends on: FBFAffiliate (lib/affiliate.js).
 * Self-contained render (injects its own scoped CSS). Loaded as a hosted file
 * via jsDelivr — NEVER inline in WordPress content (WP garbles inline HTML-in-JS).
 *
 * Usage:  <div data-fbf-throw data-species="snook"></div>
 */
(function (global) {
  'use strict';

  var NAVY = '#0B2A3C', TEAL = '#0D9488', CORAL = '#E8634A', SAND = '#F5F0E8';
  var STYLE_ID = 'fbf-throw-style';

  // species -> water clarity -> recommended lures/baits.
  // kw = the Amazon search phrase (TOS-safe search URL, not a fragile ASIN).
  var L = {
    snook: { label: 'Snook', data: {
      clear: [
        { n: 'D.O.A. Shrimp (3")', c: 'natural / glow', w: 'Dead-stick or twitch it past mangroves and dock lights — wary clear-water snook can\'t resist a natural shrimp.', kw: 'DOA shrimp lure' },
        { n: 'Soft jerkbait (fluke-style)', c: 'white / pearl', w: 'Weightless, twitch-pause; mimics a fleeing glass minnow.', kw: 'soft plastic jerkbait white inshore' },
        { n: 'Walking topwater (Spook Jr.)', c: 'bone / white', w: 'First light over potholes and along the mangrove edge.', kw: 'Heddon Super Spook Jr bone' }
      ],
      stained: [
        { n: 'Paddletail on a jighead', c: 'pearl / chartreuse', w: 'More thump helps snook find it; swim it past structure.', kw: 'Z-Man DieZel MinnowZ paddletail' },
        { n: 'Suspending twitchbait (MirrOdine)', c: 'silver / chartreuse', w: 'Erratic flash draws reaction strikes in moving water.', kw: 'MirrOlure MirrOdine' },
        { n: 'Gold weedless spoon', c: 'gold', w: 'Flash + vibration around creek mouths and docks.', kw: 'gold weedless spoon inshore' }
      ],
      muddy: [
        { n: 'Dark paddletail + rattle jighead', c: 'black-red / rootbeer', w: 'A dark silhouette and a rattle are easiest to track in dirty water.', kw: 'rattle jighead paddletail dark' },
        { n: 'One-Knocker topwater', c: 'chartreuse', w: 'A single loud knock calls them up when they can\'t see far.', kw: 'Heddon One Knocker Spook' },
        { n: 'Live/cut bait under a popping cork', c: '—', w: 'When it\'s tough, scent + a clacking cork beats lures.', kw: 'popping cork rig inshore' }
      ]
    }},
    redfish: { label: 'Redfish', data: {
      clear: [
        { n: 'Weedless gold spoon (Silver Minnow)', c: 'gold', w: 'The classic — flash it to a tailing red without fouling in the grass.', kw: 'Johnson Silver Minnow gold weedless spoon' },
        { n: 'Soft plastic shrimp', c: 'natural / new penny', w: 'Sight-cast and let it sink in front of a crawler.', kw: 'Berkley Gulp shrimp new penny' },
        { n: 'Paddletail (TRD MinnowZ)', c: 'pearl', w: 'Slow-roll near bottom for reds nosing the flat.', kw: 'Z-Man TRD MinnowZ' }
      ],
      stained: [
        { n: 'Gold spoon', c: 'gold', w: 'Flash carries in stained water; cover ground to find schools.', kw: 'gold weedless spoon redfish' },
        { n: 'Paddletail', c: 'chartreuse / rootbeer', w: 'Bump it along oyster bars for added visibility.', kw: 'paddletail swimbait chartreuse inshore' },
        { n: 'Popping cork + soft shrimp', c: 'natural', w: 'The pop calls reds in — deadly over grass and bars.', kw: 'popping cork soft shrimp rig' }
      ],
      muddy: [
        { n: 'Scented soft bait (Gulp)', c: 'new penny / chartreuse', w: 'Scent helps reds find it when they can\'t sight-feed.', kw: 'Berkley Gulp shrimp' },
        { n: 'Inshore spinnerbait', c: 'gold blade', w: 'Vibration + flash for near-zero visibility.', kw: 'inshore spinnerbait redfish' },
        { n: 'Fresh cut bait on a circle hook', c: '—', w: 'Hard to beat cut mullet on the bottom in muddy water.', kw: 'circle hook cut bait rig inshore' }
      ]
    }},
    seatrout: { label: 'Spotted Seatrout', data: {
      clear: [
        { n: 'Soft plastic on a jighead', c: 'pearl / silver', w: 'Bounce it over deep grass; trout track the fall.', kw: 'paddletail jighead seatrout' },
        { n: 'Suspending twitchbait (MirrOdine)', c: 'silver', w: 'Gator-trout favorite over potholes, especially cool water.', kw: 'MirrOlure MirrOdine' },
        { n: 'Topwater (Skitter Walk)', c: 'bone', w: 'Dawn blow-ups over the grass flats.', kw: 'Rapala Skitter Walk' }
      ],
      stained: [
        { n: 'Popping cork + shrimp/paddletail', c: 'natural / chartreuse', w: 'The #1 trout search tool — pop, pause, repeat.', kw: 'popping cork rig seatrout' },
        { n: 'Paddletail', c: 'chartreuse', w: 'Steady mid-depth retrieve for extra visibility.', kw: 'paddletail swimbait chartreuse' },
        { n: 'Casting spoon', c: 'silver', w: 'Cover water to locate scattered fish.', kw: 'casting spoon inshore' }
      ],
      muddy: [
        { n: 'Shrimp under a rattling cork', c: 'natural', w: 'Sound + scent for low-visibility trout.', kw: 'rattling popping cork shrimp' },
        { n: 'Dark paddletail', c: 'rootbeer / motor oil', w: 'A dark profile is easier to see from below.', kw: 'paddletail rootbeer inshore' },
        { n: 'Live shrimp, free-lined', c: '—', w: 'When it\'s really dirty, live bait wins.', kw: 'live bait hooks inshore' }
      ]
    }},
    tarpon: { label: 'Tarpon', data: {
      clear: [
        { n: 'D.O.A. Bait Buster', c: 'silver / white', w: 'A proven tarpon plug — slow-roll it through rolling fish.', kw: 'DOA Bait Buster tarpon' },
        { n: 'Big soft-plastic swimbait (Hogy)', c: 'black / amber', w: 'Match the local bait; big profile for migratory fish.', kw: 'Hogy soft plastic tarpon' },
        { n: 'Live crab / mullet on a circle hook', c: '—', w: 'On the beaches and passes, live bait rules.', kw: 'circle hook tarpon rig' }
      ],
      stained: [
        { n: 'Bright swimbait / paddletail', c: 'chartreuse', w: 'Add color so they pick it out of the murk.', kw: 'large paddletail swimbait chartreuse' },
        { n: 'D.O.A. Bait Buster', c: 'glow / white', w: 'Steady, slow presentation through the school.', kw: 'DOA Bait Buster' },
        { n: 'Live bait on a circle hook', c: '—', w: 'Hard to beat a frisky bait in stained passes.', kw: 'circle hook live bait tarpon' }
      ],
      muddy: [
        { n: 'Dark, loud swimbait', c: 'black', w: 'Silhouette + vibration when visibility is gone.', kw: 'dark paddletail swimbait big' },
        { n: 'Live / cut bait on the bottom', c: '—', w: 'Scent does the work in dirty backcountry water.', kw: 'circle hook cut bait tarpon' }
      ]
    }},
    flounder: { label: 'Flounder', data: {
      clear: [
        { n: 'Curl-tail grub on a jighead', c: 'white / chartreuse', w: 'Drag and hop slowly along the bottom near inlets and drop-offs.', kw: 'curl tail grub jighead flounder' },
        { n: 'Gulp on a jighead', c: 'new penny / white', w: 'Scent on the bottom is deadly for flatfish.', kw: 'Berkley Gulp swimming mullet' },
        { n: 'Bucktail tipped with Gulp', c: 'white', w: 'The classic flounder combo in current.', kw: 'bucktail jig flounder' }
      ],
      stained: [
        { n: 'Bright curl-tail grub', c: 'chartreuse', w: 'Slow bottom-hop with extra visibility.', kw: 'chartreuse grub jighead flounder' },
        { n: 'Gulp swimming mullet', c: 'chartreuse / new penny', w: 'Scent + a thumping tail near structure.', kw: 'Berkley Gulp swimming mullet chartreuse' },
        { n: 'Live finger mullet / mud minnow', c: '—', w: 'A live bait dragged slow is hard to beat.', kw: 'flounder rig live bait hook' }
      ],
      muddy: [
        { n: 'Gulp on a jighead', c: 'new penny', w: 'Let the scent find them when visibility is low.', kw: 'Berkley Gulp shrimp jighead' },
        { n: 'Live mud minnow on a Carolina rig', c: '—', w: 'Natural bait crawled along the bottom.', kw: 'Carolina rig flounder hook' }
      ]
    }},
    'spanish-mackerel': { label: 'Spanish Mackerel', data: {
      clear: [
        { n: 'Casting spoon (silver)', c: 'chrome / silver', w: 'Fast retrieve — macks crush a flashy spoon.', kw: 'casting spoon spanish mackerel' },
        { n: 'Long-casting plug (Mag Darter)', c: 'chrome', w: 'Reach nearshore schools and burn it back.', kw: 'Yo-Zuri Mag Darter' },
        { n: 'Gotcha plug', c: 'red / white', w: 'Pier and nearshore staple — rip it fast.', kw: 'Gotcha plug mackerel' }
      ],
      stained: [
        { n: 'Gold/chrome spoon', c: 'gold', w: 'Flash to cut through stained nearshore water.', kw: 'gold casting spoon mackerel' },
        { n: 'Bright jig, fast retrieve', c: 'chartreuse', w: 'Speed triggers the chase.', kw: 'speck rig mackerel jig' }
      ],
      muddy: [
        { n: 'Loud chrome plug', c: 'chrome', w: 'Macks key on flash + speed even in off-color water.', kw: 'chrome lipped plug mackerel' }
      ]
    }},
    'jack-crevalle': { label: 'Jack Crevalle', data: {
      clear: [
        { n: 'Big walking topwater', c: 'bone / chartreuse', w: 'Jacks demolish topwater — bring a rod you trust.', kw: 'large topwater walking lure' },
        { n: 'Loud paddletail / swimbait', c: 'chartreuse', w: 'Fast, erratic retrieve triggers the chase.', kw: 'large paddletail swimbait chartreuse' },
        { n: 'Flashy spoon', c: 'gold / silver', w: 'Burn it through a feeding pod.', kw: 'casting spoon inshore' }
      ],
      stained: [
        { n: 'Bright topwater', c: 'chartreuse', w: 'Noise and color call them up.', kw: 'loud topwater chartreuse' },
        { n: 'Chartreuse swimbait', c: 'chartreuse', w: 'Crank it fast through the school.', kw: 'paddletail swimbait chartreuse large' }
      ],
      muddy: [
        { n: 'Loud, dark swimbait', c: 'black / chartreuse', w: 'Vibration + a visible profile in dirty water.', kw: 'large dark paddletail swimbait' }
      ]
    }},
    'black-drum': { label: 'Black Drum', data: {
      clear: [
        { n: 'Fresh dead shrimp on a knocker rig', c: '—', w: 'Drum feed by smell — natural bait on the bottom wins.', kw: 'knocker rig circle hook inshore' },
        { n: 'Scented soft shrimp (Gulp)', c: 'natural', w: 'A slow-dragged scented bait can fool them.', kw: 'Berkley Gulp shrimp' },
        { n: 'Small jig near structure', c: 'dark', w: 'Around bridges and docks, a slow jig gets bites.', kw: 'inshore jig head bucktail' }
      ],
      stained: [
        { n: 'Fresh shrimp / crab on the bottom', c: '—', w: 'Scent is everything for drum in stained water.', kw: 'circle hook bottom rig shrimp' }
      ],
      muddy: [
        { n: 'Fresh cut/dead bait, knocker rig', c: '—', w: 'Let smell do the work when visibility is gone.', kw: 'knocker rig circle hook' }
      ]
    }},
    sheepshead: { label: 'Sheepshead', data: {
      clear: [
        { n: 'Fiddler crab / shrimp on a small hook', c: '—', w: 'Sheepshead want crustaceans tight to structure.', kw: 'sheepshead hook rig fiddler crab' },
        { n: 'Jig tipped with shrimp', c: 'natural', w: 'Vertical-drop right next to the pilings.', kw: 'sheepshead jig' }
      ],
      stained: [
        { n: 'Fiddler crab on a knocker rig', c: '—', w: 'Get it tight to barnacle-covered structure.', kw: 'sheepshead rig hook' }
      ],
      muddy: [
        { n: 'Shrimp/crab tight to pilings', c: '—', w: 'Feel for the soft "tick" and swing.', kw: 'sheepshead hook fiddler crab' }
      ]
    }},
    'mangrove-snapper': { label: 'Mangrove Snapper', data: {
      clear: [
        { n: 'Live shrimp / small bait, light leader', c: '—', w: 'Snapper are leader-shy in clear water — go light and natural.', kw: 'fluorocarbon leader circle hook snapper' },
        { n: 'Small jig / shrimp tipped jig', c: 'natural', w: 'Work it around structure and bridge shadows.', kw: 'inshore jig head shrimp' }
      ],
      stained: [
        { n: 'Live/cut bait on a knocker rig', c: '—', w: 'Get bait tight to the rocks and mangroves.', kw: 'knocker rig snapper circle hook' }
      ],
      muddy: [
        { n: 'Cut bait, scent-heavy, on bottom', c: '—', w: 'Let them smell it out around structure.', kw: 'cut bait circle hook bottom rig' }
      ]
    }}
  };

  var SPECIES_ORDER = ['snook', 'redfish', 'seatrout', 'tarpon', 'flounder', 'spanish-mackerel', 'jack-crevalle', 'black-drum', 'sheepshead', 'mangrove-snapper'];
  var CLARITY = [['clear', 'Clear water'], ['stained', 'Stained / green'], ['muddy', 'Muddy / dirty']];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = ''
      + '.fbf-wst{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
      +   'border:1px solid #e2e8e4;border-top:4px solid ' + CORAL + ';border-radius:10px;'
      +   'background:' + SAND + ';color:' + NAVY + ';padding:18px 20px;margin:22px 0;'
      +   'box-shadow:0 2px 10px rgba(11,42,60,.06);max-width:600px}'
      + '.fbf-wst *{box-sizing:border-box}'
      + '.fbf-wst-title{font-size:1.18em;font-weight:800;margin:0}'
      + '.fbf-wst-sub{font-size:.9em;color:#4a6168;margin:2px 0 12px}'
      + '.fbf-wst-controls{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px}'
      + '.fbf-wst-field{flex:1;min-width:150px}'
      + '.fbf-wst-field label{display:block;font-size:.72em;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#4a6168;margin-bottom:3px}'
      + '.fbf-wst-field select{width:100%;font-size:.95em;padding:8px 10px;border:1px solid #cfd8d4;border-radius:8px;background:#fff;color:' + NAVY + '}'
      + '.fbf-wst-list{list-style:none;margin:12px 0 0;padding:0}'
      + '.fbf-wst-rec{background:#fff;border-radius:8px;border-left:4px solid ' + TEAL + ';padding:10px 12px;margin:8px 0}'
      + '.fbf-wst-rec .rn{font-weight:800;font-size:1.02em}'
      + '.fbf-wst-rec .rc{display:inline-block;font-size:.7em;font-weight:700;text-transform:uppercase;letter-spacing:.03em;'
      +   'background:' + SAND + ';border:1px solid #d6cfc2;color:' + NAVY + ';border-radius:20px;padding:2px 8px;margin-left:6px;vertical-align:middle}'
      + '.fbf-wst-rec .rw{font-size:.9em;color:#3c5158;margin:4px 0 6px}'
      + '.fbf-wst-rec a{font-size:.85em;font-weight:700;color:' + CORAL + ';text-decoration:none}'
      + '.fbf-wst-rec a:hover{text-decoration:underline}'
      + '.fbf-wst-foot{margin-top:12px;font-size:.74em;color:#6b7d82;font-style:italic}';
    var s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function recsHtml(species, clarity) {
    var sp = L[species]; if (!sp) return '';
    var recs = (sp.data[clarity] || sp.data.clear || []);
    var aff = global.FBFAffiliate;
    return recs.map(function (r) {
      var link = aff ? aff.search(r.kw) : 'https://www.amazon.com/s?k=' + encodeURIComponent(r.kw);
      var colour = r.c && r.c !== '—' ? '<span class="rc">' + esc(r.c) + '</span>' : '';
      return '<li class="fbf-wst-rec">'
        + '<div class="rn">' + esc(r.n) + colour + '</div>'
        + '<div class="rw">' + esc(r.w) + '</div>'
        + '<a href="' + link + '" rel="sponsored nofollow" target="_blank">Find it on Amazon →</a>'
        + '</li>';
    }).join('');
  }

  function buildControls(species, clarity) {
    var spOpts = SPECIES_ORDER.map(function (k) {
      return '<option value="' + k + '"' + (k === species ? ' selected' : '') + '>' + esc(L[k].label) + '</option>';
    }).join('');
    var clOpts = CLARITY.map(function (c) {
      return '<option value="' + c[0] + '"' + (c[0] === clarity ? ' selected' : '') + '>' + esc(c[1]) + '</option>';
    }).join('');
    return '<div class="fbf-wst-controls">'
      + '<div class="fbf-wst-field"><label>Target species</label><select data-fbf-wst-species>' + spOpts + '</select></div>'
      + '<div class="fbf-wst-field"><label>Water clarity</label><select data-fbf-wst-clarity>' + clOpts + '</select></div>'
      + '</div>';
  }

  function render(el) {
    injectStyles();
    var species = el.getAttribute('data-species'); if (!L[species]) species = 'snook';
    var clarity = el.getAttribute('data-clarity'); if (!L[species].data[clarity]) clarity = 'clear';

    var aff = global.FBFAffiliate;
    el.innerHTML = '<div class="fbf-wst">'
      + '<div class="fbf-wst-title">🎣 What Should I Throw?</div>'
      + '<div class="fbf-wst-sub">Pick your target and the water — get a Florida lure plan.</div>'
      + buildControls(species, clarity)
      + '<ul class="fbf-wst-list" data-fbf-wst-results>' + recsHtml(species, clarity) + '</ul>'
      + '<div class="fbf-wst-foot">' + (aff ? esc(aff.disclosure) : '') + '</div>'
      + '</div>';

    var spSel = el.querySelector('[data-fbf-wst-species]');
    var clSel = el.querySelector('[data-fbf-wst-clarity]');
    var out = el.querySelector('[data-fbf-wst-results]');
    function update() { out.innerHTML = recsHtml(spSel.value, clSel.value); }
    spSel.addEventListener('change', update);
    clSel.addEventListener('change', update);
  }

  function autoInit() {
    var els = document.querySelectorAll('[data-fbf-throw]');
    for (var i = 0; i < els.length; i++) render(els[i]);
  }

  global.FBFThrowWidget = { render: render, autoInit: autoInit };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else { autoInit(); }

})(typeof window !== 'undefined' ? window : this);
