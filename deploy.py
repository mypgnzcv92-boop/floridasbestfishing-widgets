#!/usr/bin/env python3
"""Deploy the solunar widget to ALL 10 floridasbestfishing.com region pages via
the WordPress REST API (Application Password auth, stdlib only).

Idempotent: strips any existing solunar block — whether the current FBF-marked
one OR the older markerless block from an earlier deploy — then re-inserts the
freshly-built block right AFTER the tide widget, so the two conditions tools sit
together. Safe to re-run; never duplicates.

  python3 deploy.py --dry-run            preview every page change, write nothing
  python3 deploy.py                       deploy to all 10 region pages
  python3 deploy.py --only tampa-bay      a single page

Requires .env (gitignored):
  WP_URL=https://floridasbestfishing.com
  WP_USERNAME=<your wp username>
  WP_APP_PASSWORD=<Application Password from wp-admin -> Users -> Profile>
"""
import sys, os, re, json, base64, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
DRY = '--dry-run' in sys.argv
ONLY = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None

def load_env():
    p = os.path.join(ROOT, '.env')
    if not os.path.exists(p):
        sys.exit('Missing .env — copy .env.example to .env and add your WP Application Password.')
    env = {}
    for line in open(p, encoding='utf-8'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip().strip('"\'')
    return env

ENV = load_env()
WP_URL  = ENV.get('WP_URL', 'https://floridasbestfishing.com').rstrip('/')
WP_USER = ENV.get('WP_USERNAME') or ENV.get('WP_USER') or ''
WP_PASS = ENV.get('WP_APP_PASSWORD', '')
if not WP_USER or not WP_PASS:
    sys.exit('Set WP_USERNAME and WP_APP_PASSWORD in .env')
AUTH = 'Basic ' + base64.b64encode(f'{WP_USER}:{WP_PASS.replace(" ", "")}'.encode()).decode()

# region slug -> live WP page ID (all 10 region pages)
TARGETS = {
    'jacksonville-ne-florida':       238,
    'indian-river-lagoon':           234,
    'mosquito-lagoon':               230,
    'southeast-coast':                81,
    'florida-keys':                   79,
    'everglades-flamingo':           242,
    'charlotte-harbor-boca-grande':  236,
    'tampa-bay':                      77,
    'cedar-key-nature-coast':        240,
    'panhandle':                      83,
}

tmpl_path = os.path.join(ROOT, 'dist/solunar-block.template.html')
if not os.path.exists(tmpl_path):
    sys.exit('No build found — run: python3 build.py')
TEMPLATE = open(tmpl_path, encoding='utf-8').read()

HDR = {'Authorization': AUTH, 'Accept': 'application/json',
       'Content-Type': 'application/json', 'User-Agent': 'FBF-Deploy/2.0'}

def wp(method, ep, body=None):
    url = f'{WP_URL}/wp-json/wp/v2/{ep}'
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f'\n{method} {ep} -> HTTP {e.code}: {e.read().decode()[:300]}\n'
                 '(401 = bad WP_USERNAME/WP_APP_PASSWORD; 403 = user lacks edit/unfiltered_html.)')

# strip the current marked block, OR the older markerless solunar block
MARKED = re.compile(r'\n?<!-- FBF:solunar:start -->.*?<!-- FBF:solunar:end -->\n?', re.S)
LEGACY = re.compile(r'\n?<!-- wp:html -->\s*<div data-fbf-solunar.*?</script>\s*<!-- /wp:html -->\n?', re.S)

def upsert(content, block):
    cleaned = LEGACY.sub('', MARKED.sub('', content))
    i = cleaned.find('<!-- /wp:html -->')          # the tide widget block
    if i != -1:
        cut = i + len('<!-- /wp:html -->')
        return cleaned[:cut] + '\n\n' + block + '\n' + cleaned[cut:], 'after tide widget'
    m = re.search(r'<h2', cleaned)
    if m:
        return cleaned[:m.start()] + block + '\n\n' + cleaned[m.start():], 'before first H2'
    return block + '\n\n' + cleaned, 'top of page'

def main():
    n = 1 if ONLY else len(TARGETS)
    print(f"Deploy solunar -> {n} page(s){'  [DRY RUN — no writes]' if DRY else ''}  as {WP_USER}\n")
    for slug, pid in TARGETS.items():
        if ONLY and slug != ONLY:
            continue
        page = wp('GET', f'pages/{pid}?context=edit&_fields=id,content')
        raw = (page.get('content') or {}).get('raw', '')
        verb = 'refresh' if 'data-fbf-solunar' in raw else 'ADD'
        new, where = upsert(raw, TEMPLATE.replace('{{REGION}}', slug))
        delta = len(new) - len(raw)
        if DRY:
            print(f'  {slug:<30} page {pid}: would {verb:<7} ({where})  net {delta:+,}b')
        else:
            wp('PATCH', f'pages/{pid}', {'content': new})
            print(f'  {slug:<30} page {pid}: {verb:<7} ({where})  OK')
    if not DRY:
        print('\nDone. Flush the GoDaddy page cache to see it immediately.')

main()
