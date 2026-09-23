"""Down-links for the 2026-09-23 publishes: sailfish (1784) and stone crab (1788).

Idempotent — each edit is skipped if the target link is already on the page, and every
insertion asserts exactly one anchor match so a drifted page fails loudly.

    python3 drafts/downlinks_2026_09_23.py --dry-run
    python3 drafts/downlinks_2026_09_23.py
"""
import json, sys, time, base64, urllib.request, urllib.error, os, re

D = os.path.dirname(os.path.abspath(__file__))
env = dict(l.strip().split('=', 1) for l in open(os.path.join(D, '..', '.env')) if '=' in l and not l.startswith('#'))
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD'].replace(' ', '')}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv

SAIL = '/how-to-catch-sailfish-florida/'
CRAB = '/florida-stone-crab-season-2026/'

def api(method, path, body=None):
    req = urllib.request.Request(WP + '/wp-json/' + path, data=(json.dumps(body).encode() if body is not None else None), headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:300]); raise

def edit(kind, pid, target_link, pattern, repl, label):
    d = api('GET', f'wp/v2/{kind}/{pid}?context=edit&_fields=content'); time.sleep(2)
    raw = d['content']['raw']
    if target_link in raw:
        print(f'  {kind}/{pid}: already links {target_link} — skipping'); return
    hits = re.findall(pattern, raw, re.S)
    assert len(hits) == 1, f'{kind}/{pid} ({label}): expected 1 anchor match, got {len(hits)}'
    new = re.sub(pattern, lambda _m: repl, raw, count=1, flags=re.S)
    assert target_link in new, f'{kind}/{pid}: replacement did not add the link'
    if DRY:
        print(f'  [dry] {kind}/{pid}: would add {target_link} ({label})'); return
    api('POST', f'wp/v2/{kind}/{pid}', {'content': new}); print(f'  {kind}/{pid}: {label} OK'); time.sleep(3)

# --- sailfish down-links -----------------------------------------------------
edit('pages', 273, SAIL,
     r'<li><strong>Sailfish Alley \(Stuart → Palm Beach\)</strong> — the winter sailfish run \(Nov–Mar\) is world-famous; cold fronts push bait and sails south along the edge\.</li>',
     ('<li><strong>Sailfish Alley (Stuart → Palm Beach)</strong> — the winter sailfish run (Nov–Mar) is world-famous; '
      f'cold fronts push bait and sails south along the edge. Our <a href="{SAIL}">Florida sailfish guide</a> covers the '
      'kite spread and the drop-back that lands them.</li>'),
     'offshore hub: Sailfish Alley bullet')

edit('pages', 81, SAIL,
     r'<p>Sailfish — The Southeast Coast is the sailfish capital of the United States\.',
     f'<p><a href="{SAIL}">Sailfish</a> — The Southeast Coast is the sailfish capital of the United States.',
     'southeast coast: Top Species entry')

edit('posts', 303, SAIL,
     r'<!-- FBF:fbooker:start -->',
     (f'<p>One more reason to keep a kite in the boat: the same live-bait spread that produces kings off South Florida '
      f'is how the fleet catches <a href="{SAIL}">sailfish</a> from November through March — and the two often eat on '
      'the same day.</p>\n\n<!-- FBF:fbooker:start -->'),
     'king mackerel: kite/sailfish sentence')

# --- stone crab down-links ---------------------------------------------------
edit('posts', 309, CRAB,
     r'For more of what’s biting right now, check our <a href="https://floridasbestfishing\.com/florida-summer-fishing-guide/">summer fishing guide</a>\.',
     ('For more of what’s biting right now, check our <a href="https://floridasbestfishing.com/florida-summer-fishing-guide/">'
      f'summer fishing guide</a> — and when the water cools, <a href="{CRAB}">stone crab season</a> opens October 15 on the '
      'same Gulf coast.'),
     'scallop: stone crab link')

edit('posts', 310, CRAB,
     r'<h2>Gear Up for Mini-Season</h2>\s*<ul>\s*<li><a href="https://floridasbestfishing\.com/best-lobster-mini-season-gear-2026/">Florida Lobster Mini-Season Gear Checklist 2026: Everything You Need</a></li>\s*</ul>',
     ('<h2>Gear Up for Mini-Season</h2>\n<ul>\n'
      '<li><a href="https://floridasbestfishing.com/best-lobster-mini-season-gear-2026/">Florida Lobster Mini-Season Gear Checklist 2026: Everything You Need</a></li>\n'
      f'<li><a href="{CRAB}">Florida Stone Crab Season 2026</a> — the other clawed harvest, open October 15 to May 1</li>\n</ul>'),
     'lobster: stone crab link')

print('done' + (' (dry run)' if DRY else ''))
if not DRY:
    req = urllib.request.Request(WP + '/wp-json/fbf/v1/flush-cache', data=b'{}', headers=HDR, method='POST')
    with urllib.request.urlopen(req, timeout=90) as r:
        print('flush', r.status, r.read()[:120])
