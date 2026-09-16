"""Publish the 2026-09-16 run: post 314 flounder Oct-15-closure retrofit, post 345 gag deadline + charter CTA.
Re-runnable. --dry-run to preview. Widget marker blocks are carried through from the drafts verbatim."""
import json, sys, time, base64, urllib.request, urllib.error, os, re, mimetypes
D = os.path.dirname(os.path.abspath(__file__))
env = dict(l.strip().split('=',1) for l in open(os.path.join(D,'..','.env')) if '=' in l and not l.startswith('#'))
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD'].replace(' ','')}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv
IMG = '/private/tmp/claude-501/-Users-williamnelson/4bd2d732-c347-40b5-a8a6-361b59fd8301/scratchpad/florida-ponce-inlet-sandbar-flounder.jpg'

def api(method, path, body=None):
    req = urllib.request.Request(WP+'/wp-json/'+path, data=(json.dumps(body).encode() if body is not None else None), headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:400]); raise

def post(pid, body, label):
    if DRY: print(f'[dry] POST posts/{pid} ({label}) keys={list(body)}'); return
    r = api('POST', f'wp/v2/posts/{pid}', body); print(f'  POST {pid} ok -> modified {r["modified"]}'); time.sleep(3)

def rankmath(pid, meta):
    if DRY: print(f'[dry] updateMeta {pid} {list(meta)}'); return
    print('  rankmath', pid, api('POST','rankmath/v1/updateMeta',{'objectID':pid,'objectType':'post','meta':meta})); time.sleep(3)

def upload_featured(pid, path, alt):
    """Upload once; reuse if a media item with this filename already exists (idempotent re-run)."""
    name = os.path.basename(path)
    hit = api('GET', f'wp/v2/media?search={name.rsplit(".",1)[0]}&per_page=5&_fields=id,source_url')
    if hit:
        mid = hit[0]['id']; print(f'  media exists -> {mid}')
    else:
        if DRY: print(f'[dry] upload {name} + set featured on {pid}'); return None
        data = open(path,'rb').read()
        h = {'Authorization':AUTH,'User-Agent':UA,'Content-Type':'image/jpeg',
             'Content-Disposition':f'attachment; filename="{name}"'}
        req = urllib.request.Request(WP+'/wp-json/wp/v2/media', data=data, headers=h, method='POST')
        with urllib.request.urlopen(req, timeout=180) as r: m = json.loads(r.read())
        mid = m['id']; print(f'  uploaded media {mid} {m["source_url"]}'); time.sleep(3)
    if not DRY:
        api('POST', f'wp/v2/media/{mid}', {'alt_text': alt}); time.sleep(2)
        post(pid, {'featured_media': mid}, 'featured image')
    return mid

# ---------------- post 314 ----------------
b314 = open(os.path.join(D,'flounder-314-closure-retrofit.html')).read()
for must in ['FBF:throw:start','FBF:regs:start','FBF:fbooker:start','id="fall-run"',
             '/florida-jetty-fishing/','/florida-pier-fishing-guide/','/florida-bull-redfish-fall-run/',
             'fishingbooker.com/destinations/location/us/FL/jacksonville#d7lo40i9d878d',
             'September 16, 2026','Loxahatchee','entire</em> Florida coast']:
    assert must in b314, f'314 missing: {must}'
assert '<h1' not in b314, '314 has a body h1'
assert b314.count('<h2') == 6, b314.count('<h2')
exc314 = 'Flounder harvest closes statewide October 15 — and the weeks before it are when fish start sliding toward the inlets. Where to find them, what to throw, and the 2026 rules.'
meta314 = 'Where to find Florida flounder, the baits and rigs that catch them, the 14-inch and 5-fish limits, and how to fish the fall run before the Oct 15 closure.'
title314 = 'How to Catch Flounder in Florida + the Oct 15 Closure'
alt314 = 'Aerial view of Ponce Inlet, Florida — a shallow sandbar edge beside a mangrove island, the kind of inlet drop-off flounder use in fall'

# ---------------- post 345 ----------------
b345 = open(os.path.join(D,'gag-grouper-345-deadline-retrofit.html')).read()
for must in ['FBF:regs:start','FBF:setup:start','FBF:fbooker:start',
             'fishingbooker.com/destinations/location/us/FL/destin#d7lo40i9d878d',
             'September 16, 2026','State Reef Fish Survey designation',
             '/florida-fishing-report-september-2026/','12:01 a.m. October 1']:
    assert must in b345, f'345 missing: {must}'
assert '<h1' not in b345 and 'State Reef Fish Angler' not in b345
assert b345.count('<h2') == 6, b345.count('<h2')
wptitle345 = 'Florida Gag Grouper Season 2026: Gulf Closes Oct 1 — Dates, Limits & Rules'
exc345 = 'Gulf gag grouper closes 12:01 a.m. October 1 — the last weeks of the 2026 season. Confirmed dates, the 24-inch limit, the free permit you need, and where the fish are now.'
meta345 = 'Gulf gag grouper closes Oct 1, 2026 in state and federal waters. The final-weeks plan, the 24-inch size limit, bag limit and the free permit you need.'
title345 = 'Florida Gag Grouper Season 2026'

for lbl, t, m in (('314',title314,meta314), ('345',title345,meta345)):
    assert len(t) <= 60, (lbl,'seo title',len(t)); assert 120 <= len(m) <= 160, (lbl,'meta',len(m))
print(f'pre-flight OK | 314 body {len(b314)} chars | 345 body {len(b345)} chars')

SCHEMA = {'rank_math_rich_snippet':'', 'rank_math_snippet_article_type':''}
print('\n== post 314 ==')
post(314, {'content': b314, 'excerpt': exc314}, 'flounder closure retrofit')
rankmath(314, {'rank_math_focus_keyword':'how to catch flounder in florida','rank_math_title':title314,'rank_math_description':meta314, **SCHEMA})
upload_featured(314, IMG, alt314)
print('\n== post 345 ==')
post(345, {'title': wptitle345, 'content': b345, 'excerpt': exc345}, 'gag deadline + charter CTA')
rankmath(345, {'rank_math_focus_keyword':'florida gag grouper season','rank_math_title':title345,'rank_math_description':meta345, **SCHEMA})

if not DRY:
    print('\n== flush ==')
    req = urllib.request.Request(WP+'/wp-json/fbf/v1/flush-cache', data=b'{}', headers=HDR, method='POST')
    with urllib.request.urlopen(req, timeout=90) as r: print('  flush', r.status, r.read()[:200])
