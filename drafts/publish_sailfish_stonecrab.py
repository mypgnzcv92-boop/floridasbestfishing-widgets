"""Publish the 2026-09-23 run: the sailfish species guide and the held stone crab guide.

Re-runnable and idempotent:
  * a post whose slug already exists is UPDATED, not duplicated
  * images are downloaded from the Unsplash CDN and uploaded once (matched by filename)
  * the /species/ hub card is only inserted if the slug isn't already on the page

    python3 drafts/publish_sailfish_stonecrab.py --dry-run
    python3 drafts/publish_sailfish_stonecrab.py                 # both
    python3 drafts/publish_sailfish_stonecrab.py --only sailfish # or --only stonecrab

Still manual afterwards (they need judgement, not automation):
  * deploy.py targets for the sailfish post id:
        regs  -> ('posts', <id>, 'sailfish@atlantic', 'keep')
        setup -> ('posts', <id>, 'offshore-troll',   'keep')
    then `python3 deploy.py regs setup`
  * lib/regs.js: sailfish guide -> '/how-to-catch-sailfish-florida/', bump verified,
    drop the unverified "not one of each" aggregate gloss -> build.py, commit, push,
    purge jsDelivr, deploy.py
  * down-links: /offshore/ (273), /southeast-coast/ (81), king mackerel guide (303)
  * stone crab: create /go/stone-crab-trap/, /go/stone-crab-claw-gauge/,
    /go/stone-crab-mallet/ over SSH + WP-CLI, then point the gear section at them
"""
import json, sys, time, base64, urllib.request, urllib.error, os

D = os.path.dirname(os.path.abspath(__file__))
env = dict(l.strip().split('=', 1) for l in open(os.path.join(D, '..', '.env')) if '=' in l and not l.startswith('#'))
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD'].replace(' ', '')}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv
ONLY = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
TMP = '/tmp'
SPECIES_HUB = 596

def api(method, path, body=None):
    req = urllib.request.Request(WP + '/wp-json/' + path, data=(json.dumps(body).encode() if body is not None else None), headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:400]); raise

def find_by_slug(slug):
    hit = api('GET', f'wp/v2/posts?slug={slug}&status=publish,draft,pending&_fields=id,slug')
    return hit[0]['id'] if hit else None

def upsert_post(slug, fields, label):
    pid = find_by_slug(slug)
    if DRY:
        print(f"[dry] would {'UPDATE ' + str(pid) if pid else 'CREATE'} {slug} ({label})"); return pid
    if pid:
        r = api('POST', f'wp/v2/posts/{pid}', fields); print(f'  updated {pid} ({slug}) -> {r["modified"]}')
    else:
        r = api('POST', 'wp/v2/posts', dict(fields, slug=slug)); pid = r['id']
        print(f'  created {pid} ({slug}) -> {r["link"]}')
    time.sleep(3); return pid

def rankmath(pid, meta):
    if DRY:
        print(f'[dry] updateMeta {pid} {list(meta)}'); return
    print('  rankmath', pid, api('POST', 'rankmath/v1/updateMeta', {'objectID': pid, 'objectType': 'post', 'meta': meta})); time.sleep(3)

def upload_featured(pid, url, filename, alt):
    hit = api('GET', f'wp/v2/media?search={filename.rsplit(".", 1)[0]}&per_page=5&_fields=id,source_url')
    if hit:
        mid = hit[0]['id']; print(f'  media exists -> {mid}')
    else:
        if DRY:
            print(f'[dry] download + upload {filename}, set featured on {pid}'); return None
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        assert len(data) > 40000, f'{filename}: suspiciously small download ({len(data)} bytes)'
        open(os.path.join(TMP, filename), 'wb').write(data)
        h = {'Authorization': AUTH, 'User-Agent': UA, 'Content-Type': 'image/jpeg',
             'Content-Disposition': f'attachment; filename="{filename}"'}
        req = urllib.request.Request(WP + '/wp-json/wp/v2/media', data=data, headers=h, method='POST')
        with urllib.request.urlopen(req, timeout=180) as r:
            m = json.loads(r.read())
        mid = m['id']; print(f'  uploaded media {mid} {m["source_url"]}'); time.sleep(3)
    if not DRY and pid:
        api('POST', f'wp/v2/media/{mid}', {'alt_text': alt}); time.sleep(2)
        api('POST', f'wp/v2/posts/{pid}', {'featured_media': mid}); time.sleep(2)
        print(f'  featured image set on {pid}')
    return mid

def add_species_card(slug, title, sub):
    """Insert a card at the head of the 'Offshore, Reef & Bluewater' grid on /species/."""
    page = api('GET', f'wp/v2/pages/{SPECIES_HUB}?context=edit&_fields=content'); time.sleep(2)
    raw = page['content']['raw']
    if f'href="/{slug}/"' in raw:
        print('  species hub already has the card — skipping'); return
    head = raw.find('Offshore, Reef')
    assert head > 0, 'species hub: Offshore group heading not found'
    grid = raw.find('<div class="fbf-grid', head)
    assert grid > 0, 'species hub: Offshore grid not found'
    ins = raw.index('>', grid) + 1
    card = (f'\n<article class="fbf-card fbf-species">\n<div class="fbf-card__body">\n'
            f'<h3 class="fbf-card__title"><a href="/{slug}/">{title}</a></h3>\n'
            f'<p class="fbf-species__sub">{sub}</p>\n'
            f'<p class="fbf-card__meta">Species guide</p>\n</div>\n</article>')
    new = raw[:ins] + card + raw[ins:]
    if DRY:
        print(f'[dry] would insert "{title}" card into the species hub ({len(new) - len(raw)} chars)'); return
    api('POST', f'wp/v2/pages/{SPECIES_HUB}', {'content': new}); print('  species hub card added'); time.sleep(3)

SCHEMA = {'rank_math_rich_snippet': '', 'rank_math_snippet_article_type': ''}

# ------------------------------------------------------------------ sailfish
SAIL = dict(
    slug='how-to-catch-sailfish-florida',
    file='how-to-catch-sailfish-florida.html',
    wp_title='How to Catch Sailfish in Florida: Kites, Fronts & the Drop-Back',
    seo_title='How to Catch Sailfish in Florida (2026 Guide)',
    meta=("Florida sailfish run the reef edge from Fort Pierce to Miami every winter. When they show up, "
          "how kite fishing works, and the drop-back that lands them."),
    excerpt=("Cold fronts, kites, and a drop-back most anglers get wrong — how Florida's winter sailfish fishery "
             "actually works, from Sailfish Alley to the boatside release."),
    kw='how to catch sailfish in florida',
    cat=5,
    img='https://images.unsplash.com/photo-1674606844137-40e5b1239df1?w=1280&q=58',
    img_name='florida-sailfish-underwater-miami.jpg',
    alt='An Atlantic sailfish swimming underwater with its dorsal fin raised, photographed off Miami, Florida',
    card_sub=('Florida&#x27;s winter showpiece. Cold fronts stack sails on the reef edge from Fort Pierce to Miami — '
              'here&#x27;s the kite spread and the drop-back…'),
    must=['FBF:regs:start', 'FBF:setup:start', 'data-species="sailfish"', 'data-scenario="offshore-troll"',
          'fishingbooker.com/destinations/location/us/FL/stuart#d7lo40i9d878d', 'September 23, 2026',
          '/offshore/', '/how-to-catch-live-bait-florida/', '/fishing-knots-florida-saltwater/'],
    forbid=['<h1', 'not one of each', 'class="fbf-disclosure"', 'color:#666'],
    min_h2=8,
)

# ------------------------------------------------------------------ stone crab
CRAB = dict(
    slug='florida-stone-crab-season-2026',
    file='florida-stone-crab-season-2026.html',
    wp_title='Florida Stone Crab Season 2026: Claw Limits, Traps & Where to Set Them',
    seo_title='Florida Stone Crab Season 2026: Limits & How-To',
    meta=("Florida stone crab season runs Oct 15 to May 1. The 2 7/8-inch claw rule, the one-gallon limit, "
          "trap registration and how to set five traps right."),
    excerpt=("The only Florida harvest where the animal swims away and grows the catch back. Season dates, claw "
             "limits, trap rules and where to set them — before the October 15 opener."),
    kw='florida stone crab season',
    cat=4,
    img='https://images.unsplash.com/photo-1765994848581-21af812e21b9?w=1280&q=58',
    img_name='florida-stone-crab-claws-on-ice.jpg',
    alt='Fresh Florida stone crab claws served on ice with lemon wedges',
    card_sub=None,   # category 4, not a species guide — no /species/ card
    must=['September 23, 2026', 'GoOutdoorsFlorida.com', '2 3/16-inch escape ring',
          'fishingbooker.com/destinations/location/us/FL/naples#d7lo40i9d878d',
          '1 gallon of claws per person', 'October 5', 'fbf-lede'],
    forbid=['<h1', 'fishingbooker.com/fish/'],
    min_h2=6,
)

def run(spec):
    body = open(os.path.join(D, spec['file'])).read()
    for must in spec['must']:
        assert must in body, f"{spec['slug']} missing: {must}"
    for bad in spec['forbid']:
        assert bad not in body, f"{spec['slug']} still contains: {bad}"
    h2s = body.count('<h2')
    assert h2s >= spec['min_h2'], f"{spec['slug']}: only {h2s} h2s"
    assert len(spec['seo_title']) <= 60, ('seo title', len(spec['seo_title']))
    assert 120 <= len(spec['meta']) <= 160, ('meta', len(spec['meta']))
    assert spec['excerpt'].strip(), 'excerpt must not be empty'
    print(f"\n== {spec['slug']} == body {len(body)} chars, {h2s} h2s, seo {len(spec['seo_title'])}, meta {len(spec['meta'])}")

    pid = upsert_post(spec['slug'], {'title': spec['wp_title'], 'content': body, 'excerpt': spec['excerpt'],
                                     'status': 'publish', 'categories': [spec['cat']], 'author': 1}, spec['slug'])
    if pid:
        rankmath(pid, {'rank_math_focus_keyword': spec['kw'], 'rank_math_title': spec['seo_title'],
                       'rank_math_description': spec['meta'], **SCHEMA})
        upload_featured(pid, spec['img'], spec['img_name'], spec['alt'])
        if spec['card_sub']:
            add_species_card(spec['slug'], spec['wp_title'].split(':')[0].replace('How to Catch ', '').replace(' in Florida', ''), spec['card_sub'])
    return pid

ids = {}
for key, spec in (('sailfish', SAIL), ('stonecrab', CRAB)):
    if ONLY in (None, key):
        ids[key] = run(spec)

if not DRY:
    print('\n== flush ==')
    req = urllib.request.Request(WP + '/wp-json/fbf/v1/flush-cache', data=b'{}', headers=HDR, method='POST')
    with urllib.request.urlopen(req, timeout=90) as r:
        print('  flush', r.status, r.read()[:200])
print('\npost ids:', ids)
print('NEXT: add the sailfish id to deploy.py (regs sailfish@atlantic keep, setup offshore-troll keep), then run deploy.py')
