#!/usr/bin/env python3
"""Deploy FBF widget loaders to their target pages/posts via the WordPress REST
API (Application Password auth, stdlib only).

Each widget is a tiny loader (placeholder <div> + jsDelivr <script src>) — the JS
is hosted on jsDelivr, so nothing inline gets garbled by WordPress. Idempotent:
upserts the loader between <!-- FBF:<marker>:start --> ... :end --> markers.

  python3 deploy.py                      # all widgets
  python3 deploy.py throw setup          # only these
  python3 deploy.py solunar --dry-run    # preview, write nothing

A target is (rest_type, id, preset[, anchor]). Anchor (per-target, else widget
default): 'after-tide' | 'before-h2' | 'after-p' | 'append' | ('before-text', T).

Requires .env: WP_USERNAME, WP_APP_PASSWORD, WP_URL
"""
import sys, os, re, json, base64, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
DRY = '--dry-run' in sys.argv
KEYS = [a for a in sys.argv[1:] if not a.startswith('--')]

def load_env():
    p = os.path.join(ROOT, '.env')
    if not os.path.exists(p):
        sys.exit('Missing .env — copy .env.example to .env.')
    env = {}
    for line in open(p, encoding='utf-8'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip().strip('"\'')
    return env

ENV = load_env()
WP_URL = ENV.get('WP_URL', 'https://floridasbestfishing.com').rstrip('/')
WP_USER = ENV.get('WP_USERNAME') or ENV.get('WP_USER') or ''
WP_PASS = ENV.get('WP_APP_PASSWORD', '')
if not WP_USER or not WP_PASS:
    sys.exit('Set WP_USERNAME and WP_APP_PASSWORD in .env')
AUTH = 'Basic ' + base64.b64encode(f'{WP_USER}:{WP_PASS.replace(" ", "")}'.encode()).decode()

GEAR = 'gear-section'  # region-page: before the gear-section heading (any era), else after solunar

DEPLOY = {
    'solunar': {
        'marker': 'solunar', 'template': 'dist/solunar-block.template.html',
        'placeholder': '{{REGION}}', 'anchor': 'after-tide',
        'targets': [
            ('pages', 238, 'jacksonville-ne-florida'), ('pages', 234, 'indian-river-lagoon'),
            ('pages', 230, 'mosquito-lagoon'), ('pages', 81, 'southeast-coast'),
            ('pages', 79, 'florida-keys'), ('pages', 242, 'everglades-flamingo'),
            ('pages', 236, 'charlotte-harbor-boca-grande'), ('pages', 77, 'tampa-bay'),
            ('pages', 240, 'cedar-key-nature-coast'), ('pages', 83, 'panhandle'),
        ],
    },
    'throw': {  # "What should I throw?" -> species guides + topwater post + ALL 10 region pages
        'marker': 'throw', 'template': 'dist/whatsthrow-block.template.html',
        'placeholder': '{{SPECIES}}', 'anchor': 'before-h2',
        'targets': [
            ('posts', 138, 'snook'), ('posts', 206, 'redfish'), ('posts', 170, 'seatrout'),
            ('posts', 139, 'tarpon'), ('posts', 171, 'snook'), ('posts', 301, 'mangrove-snapper'),
            ('posts', 314, 'flounder'), ('posts', 315, 'spanish-mackerel'),  # added 2026-06-28
            ('posts', 321, 'jack-crevalle'),  # added 2026-07-04
            ('posts', 344, 'black-drum'),  # added 2026-07-08 (black drum guide)
            # region pages — preset to each region's signature inshore species, placed by the gear section
            ('pages', 238, 'redfish', GEAR), ('pages', 234, 'snook', GEAR),
            ('pages', 230, 'redfish', GEAR), ('pages', 81, 'snook', GEAR),
            ('pages', 79, 'tarpon', GEAR), ('pages', 242, 'snook', GEAR),
            ('pages', 236, 'snook', GEAR), ('pages', 77, 'snook', GEAR),
            ('pages', 240, 'redfish', GEAR), ('pages', 83, 'redfish', GEAR),
        ],
    },
    'setup': {  # "Pick the right setup" -> gear hub + combos/beginner/reels + offshore
        'marker': 'setup', 'template': 'dist/setup-block.template.html',
        'placeholder': '{{SCENARIO}}', 'anchor': 'before-h2',
        'targets': [
            ('pages', 24, 'inshore-allround', 'after-p'), ('pages', 273, 'offshore-bottom'),
            ('posts', 141, 'inshore-allround'), ('posts', 40, 'beginner', 'after-p'),
            ('posts', 38, 'inshore-allround', 'after-p'),
            ('posts', 302, 'offshore-bottom'), ('posts', 303, 'nearshore'),
            ('posts', 311, 'offshore-bottom'),  # grouper species guide (2026-06-26)
            ('posts', 313, 'big-snook'),  # night snook tactics how-to (2026-06-28)
            ('posts', 319, 'offshore-bottom'), ('posts', 320, 'surf'),  # added 2026-07-04 (yellowtail, shark surf)
            ('posts', 330, 'nearshore'), ('posts', 331, 'big-snook'),  # added 2026-07-07 (tripletail, snook season)
            ('posts', 332, 'offshore-bottom'), ('posts', 333, 'offshore-bottom'),  # added 2026-07-07 (mutton, goliath)
            ('posts', 345, 'offshore-bottom'), ('posts', 346, 'offshore-bottom'),  # added 2026-07-08 (gag season, amberjack)
            ('posts', 383, 'inshore-allround'), ('posts', 384, 'inshore-allround'),  # added 2026-07-10 (braid, inshore rods gear reviews)
            ('posts', 385, 'offshore-bottom'),  # added 2026-07-10 (hogfish species guide)
            ('posts', 501, 'big-snook'),  # added 2026-07-16 (mullet run fall blitz how-to)
            ('posts', 530, 'offshore-bottom'),  # added 2026-07-20 (Florida snapper fishing PILLAR)
            ('posts', 537, 'surf'),  # added 2026-07-26 (pompano surf-fishing pillar)
            ('posts', 550, 'surf'), ('posts', 551, 'surf'),  # added 2026-07-29 (surf beginners PILLAR, whiting spoke)
        ],
    },
}

HDR = {'Authorization': AUTH, 'Accept': 'application/json',
       'Content-Type': 'application/json', 'User-Agent': 'FBF-Deploy/3.1'}

def wp(method, ep, body=None):
    url = f'{WP_URL}/wp-json/wp/v2/{ep}'
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f'\n{method} {ep} -> HTTP {e.code}: {e.read().decode()[:300]}')

def insert_at(cleaned, block, anchor):
    if anchor == 'gear-section':
        m = re.search(r'<h[23][^>]*>[^<]{0,30}[Gg]ear', cleaned)
        if m:
            return cleaned[:m.start()] + block + '\n\n' + cleaned[m.start():], 'before gear section'
        i = cleaned.find('<!-- FBF:solunar:end -->')
        if i != -1:
            cut = i + len('<!-- FBF:solunar:end -->')
            return cleaned[:cut] + '\n\n' + block + '\n' + cleaned[cut:], 'after solunar widget'
        anchor = 'before-h2'  # fall through
    if isinstance(anchor, tuple) and anchor[0] == 'before-text':
        i = cleaned.find(anchor[1])
        if i != -1:
            h2 = cleaned.rfind('<h2', 0, i)
            pos = h2 if h2 != -1 else i
            return cleaned[:pos] + block + '\n\n' + cleaned[pos:], f'before "{anchor[1]}"'
        anchor = 'before-h2'  # fall through
    if anchor == 'after-tide':
        i = cleaned.find('<!-- /wp:html -->')
        if i != -1:
            cut = i + len('<!-- /wp:html -->')
            return cleaned[:cut] + '\n\n' + block + '\n' + cleaned[cut:], 'after tide widget'
    if anchor == 'after-p':
        m = re.search(r'</p>', cleaned)
        if m:
            return cleaned[:m.end()] + '\n\n' + block + '\n' + cleaned[m.end():], 'after first paragraph'
    if anchor in ('before-h2', 'after-tide', 'after-p'):
        m = re.search(r'<h2', cleaned)
        if m:
            return cleaned[:m.start()] + block + '\n\n' + cleaned[m.start():], 'before first H2'
    return cleaned.rstrip() + '\n\n' + block + '\n', 'appended at end'

def upsert(content, block, marker, anchor):
    pat = re.compile(r'\n?<!-- FBF:' + re.escape(marker) + r':start -->.*?<!-- FBF:'
                     + re.escape(marker) + r':end -->\n?', re.S)
    return insert_at(pat.sub('', content), block, anchor)

def deploy_widget(key):
    w = DEPLOY[key]
    tpl_path = os.path.join(ROOT, w['template'])
    if not os.path.exists(tpl_path):
        sys.exit('No build for ' + key + ' — run: python3 build.py')
    tpl = open(tpl_path, encoding='utf-8').read()
    print(f"\n[{key}] -> {len(w['targets'])} page(s){'  [DRY RUN]' if DRY else ''}")
    for t in w['targets']:
        ptype, pid, preset = t[0], t[1], t[2]
        anchor = t[3] if len(t) > 3 else w['anchor']
        page = wp('GET', f'{ptype}/{pid}?context=edit&_fields=id,content')
        raw = (page.get('content') or {}).get('raw', '')
        verb = 'refresh' if ('FBF:' + w['marker'] + ':start') in raw else 'ADD'
        new, where = upsert(raw, tpl.replace(w['placeholder'], preset), w['marker'], anchor)
        if DRY:
            print(f"  {ptype}/{pid:<4} [{preset:<16}] would {verb:<7} ({where})  net {len(new)-len(raw):+,}b")
        else:
            wp('POST', f'{ptype}/{pid}', {'content': new})
            print(f"  {ptype}/{pid:<4} [{preset:<16}] {verb:<7} ({where})  OK")

def main():
    keys = KEYS or list(DEPLOY)
    for k in keys:
        if k not in DEPLOY:
            sys.exit('unknown widget: ' + k + ' (known: ' + ', '.join(DEPLOY) + ')')
        deploy_widget(k)
    if not DRY:
        print('\nDone. Flush the GoDaddy page cache to see changes immediately.')

main()
