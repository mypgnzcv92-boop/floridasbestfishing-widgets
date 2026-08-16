/* FBF Widget #04 — "Is it in season?" FWC size & bag limit checker.
 *
 * Pick a species and a coast; get open/closed status computed against today's
 * date, the slot or minimum size, the bag limit, and the regional caveats that
 * actually catch people out (redfish vessel limits, seatrout by region, the
 * snapper aggregate).
 *
 * Deliberately NOT presented as authoritative: every answer shows the date the
 * rule was verified and links straight to the FWC page for that species.
 * Regulations change mid-season and a wrong answer here costs someone a ticket.
 */
(function () {
  'use strict';

  var NAVY = '#0B2A3C', DEEP = '#0F3A50', BRASS = '#C9A24B', BONE = '#F4EFE6';
  var RULE = '#E0D6C4', INK = '#16232C', STEEL = '#7E909A';
  var OPEN = '#2F6B4F', SHUT = '#9B3A2E';

  var FONT = "'Source Serif 4',Georgia,serif";
  var LABEL = "'Cinzel',Georgia,serif";

  function el(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.setAttribute('style', css);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render(mount) {
    var R = window.FBF_REGS;
    if (!R) return;

    var preset = (mount.getAttribute('data-species') || '').toLowerCase();

    // Optional data-zone preselects the coast. Without it the widget always
    // opened on Gulf, which is actively misleading on Atlantic/Keys content —
    // snook alone runs a 28-32" slot on the Atlantic vs 28-33" in the Gulf.
    // Absent or unrecognised falls back to 'gulf' so existing mounts are
    // unchanged.
    var ZONES = ['gulf', 'atlantic', 'keys'];
    var zonePreset = (mount.getAttribute('data-zone') || '').toLowerCase();
    if (ZONES.indexOf(zonePreset) === -1) { zonePreset = 'gulf'; }

    mount.setAttribute('style',
      'border:1px solid ' + RULE + ';border-top:3px solid ' + BRASS + ';background:' + BONE +
      ';border-radius:2px;padding:18px 18px 14px;margin:26px 0;font-family:' + FONT +
      ';color:' + INK + ';font-size:16px;line-height:1.55');

    mount.appendChild(el('div',
      'font-family:' + LABEL + ';font-weight:600;font-size:12px;letter-spacing:.16em;' +
      'text-transform:uppercase;color:' + STEEL + ';margin-bottom:4px', 'Before you keep it'));

    mount.appendChild(el('div',
      'font-family:' + FONT + ';font-weight:700;font-size:21px;color:' + NAVY + ';margin-bottom:12px',
      'Season &amp; Limit Checker'));

    // ---- controls
    var row = el('div', 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px');
    var selCss = 'flex:1;min-width:150px;padding:9px 10px;border:1px solid ' + RULE +
      ';border-radius:2px;background:#fff;font-family:' + FONT + ';font-size:15px;color:' + INK;

    var sp = el('select', selCss);
    var groups = {}, order = [];
    R.species.forEach(function (s) {
      if (!groups[s.group]) { groups[s.group] = []; order.push(s.group); }
      groups[s.group].push(s);
    });
    order.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g;
      groups[g].forEach(function (s) {
        var o = document.createElement('option');
        o.value = s.key; o.textContent = s.name;
        if (s.key === preset) o.selected = true;
        og.appendChild(o);
      });
      sp.appendChild(og);
    });

    var zn = el('select', selCss);
    ZONES.forEach(function (z) {
      var o = document.createElement('option');
      o.value = z; o.textContent = R.zones[z];
      if (z === zonePreset) { o.selected = true; }
      zn.appendChild(o);
    });

    row.appendChild(sp); row.appendChild(zn);
    mount.appendChild(row);

    var out = el('div', '');
    mount.appendChild(out);

    // ---- footer
    var foot = el('div',
      'margin-top:14px;padding-top:10px;border-top:1px solid ' + RULE +
      ';font-size:12.5px;color:' + STEEL + ';line-height:1.5');
    foot.innerHTML = 'Rules checked <b style="color:' + DEEP + '">' + esc(R.verified) +
      '</b>. Regulations change, sometimes mid-season &mdash; always confirm on ' +
      '<a href="https://myfwc.com/fishing/saltwater/recreational/" target="_blank" rel="noopener" ' +
      'style="color:' + DEEP + ';font-weight:600">MyFWC.com</a> before you keep a fish. ' +
      'This tool is a fast reference, not a legal authority.';
    mount.appendChild(foot);

    function draw() {
      var s = null, i;
      for (i = 0; i < R.species.length; i++) { if (R.species[i].key === sp.value) { s = R.species[i]; break; } }
      if (!s) return;

      // some species have no distinct Keys rule — fall back to Atlantic
      var zoneKey = zn.value;
      var z = s.zones[zoneKey] || (zoneKey === 'keys' ? s.zones.atlantic : null);
      var fellBack = !s.zones[zoneKey] && !!z;

      out.innerHTML = '';
      if (!z) {
        out.appendChild(el('div', 'padding:12px 0;color:' + STEEL,
          'No separate rule listed for that coast &mdash; check FWC.'));
        return;
      }

      var st = R.evaluate(z.season, R.mmdd(new Date()));
      var col = st.open === true ? OPEN : (st.open === false ? SHUT : STEEL);

      var head = el('div',
        'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px');
      head.appendChild(el('span',
        'font-family:' + LABEL + ';font-weight:600;font-size:12px;letter-spacing:.12em;' +
        'text-transform:uppercase;color:#fff;background:' + col +
        ';padding:4px 10px;border-radius:2px', esc(st.label)));
      head.appendChild(el('span',
        'font-family:' + FONT + ';font-weight:700;font-size:17px;color:' + NAVY,
        esc(s.name)));
      out.appendChild(head);

      function line(k, v) {
        var d = el('div', 'display:flex;gap:10px;padding:7px 0;border-bottom:1px solid ' + RULE);
        d.appendChild(el('div',
          'flex:0 0 96px;font-family:' + LABEL + ';font-weight:600;font-size:11px;' +
          'letter-spacing:.1em;text-transform:uppercase;color:' + STEEL + ';padding-top:3px', k));
        d.appendChild(el('div', 'flex:1;font-size:15.5px', v));
        return d;
      }

      out.appendChild(line('Size', esc(z.size)));
      out.appendChild(line('Bag', esc(z.bag)));
      out.appendChild(line('Season', esc(z.seasonText)));

      if (z.regionNote) {
        out.appendChild(el('div',
          'margin-top:10px;padding:9px 11px;background:#fff;border-left:3px solid ' + BRASS +
          ';font-size:14px;line-height:1.5',
          '<b style="color:' + NAVY + '">Watch out:</b> ' + esc(z.regionNote)));
      }
      if (s.note) {
        out.appendChild(el('div',
          'margin-top:8px;font-size:13.5px;color:' + DEEP + ';line-height:1.5', esc(s.note)));
      }
      if (fellBack) {
        out.appendChild(el('div',
          'margin-top:8px;font-size:13px;color:' + STEEL + ';font-style:italic',
          'The Keys follow the Atlantic rule for this species.'));
      }

      var links = el('div', 'margin-top:12px;display:flex;gap:14px;flex-wrap:wrap;font-size:13.5px');
      if (s.guide) {
        links.appendChild(el('a', 'color:' + DEEP + ';font-weight:600', 'Full guide &rarr;'))
          .setAttribute('href', s.guide);
      }
      var a = el('a', 'color:' + DEEP + ';font-weight:600', 'FWC rule page &rarr;');
      a.setAttribute('href', s.fwc); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
      links.appendChild(a);
      out.appendChild(links);
    }

    sp.addEventListener('change', draw);
    zn.addEventListener('change', draw);
    draw();
  }

  function init() {
    var nodes = document.querySelectorAll('[data-fbf-regs]');
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].getAttribute('data-fbf-done')) {
        nodes[i].setAttribute('data-fbf-done', '1');
        render(nodes[i]);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
