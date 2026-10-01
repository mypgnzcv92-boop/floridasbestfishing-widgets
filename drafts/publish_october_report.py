"""Publish 'Florida Fishing Report - October 2026' (category 1).

Idempotent: finds the post by slug and updates it, or creates it. Creates as DRAFT by default;
pass --publish to set status=publish (red line 3: nothing goes live without William's go).
All regulation figures FWC-verified 2026-09-30. --dry-run to preview.

Featured image: none assigned. The site-wide Rank Math OG default (fbf-og-v2.png) covers the social
card, per CONTENT-ROUTINE.md §4. Add one later with a single media upload + featured_media POST if a
credibly-Florida shot turns up (§6 / red line 4 - borderline shots go to William first).
"""
import json, sys, time, base64, urllib.request, urllib.error, os

D = os.path.dirname(os.path.abspath(__file__))
env = dict(l.strip().split('=', 1) for l in open(os.path.join(D, '..', '.env')) if '=' in l and not l.startswith('#'))
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD'].replace(' ','')}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv
LIVE = '--publish' in sys.argv

SLUG = 'florida-fishing-report-october-2026'
TITLE = 'Florida Fishing Report — October 2026: Gag Closes, Snook Opens Statewide'
EXCERPT = ('Gag grouper shut on the 1st, snook opened in the last two regions the same morning, and '
           'Atlantic red snapper returns Oct 9–22. Every date that moves this month.')
SEO_TITLE = 'Florida Fishing Report October 2026: Every Date'          # 46
SEO_DESC = ('Gag closed, snook opened statewide, Atlantic red snapper returns Oct 9-22 and stone crab '
            'opens the 15th. Every Florida season change this month, FWC-verified.')  # 157
FOCUS_KW = 'florida fishing report october 2026'


def api(method, path, body=None):
    req = urllib.request.Request(WP + '/wp-json/' + path,
                                 data=(json.dumps(body).encode() if body is not None else None),
                                 headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:400]); raise


body = open(os.path.join(D, 'florida-fishing-report-october-2026.html')).read()
assert '<h1' not in body.lower(), 'draft contains an h1 - the theme supplies it'
assert body.count('<h2>') >= 3, 'needs 3+ H2s for the auto-TOC'
assert 'fbf-disclosure' in body, 'missing disclosure paragraph'
assert '#d7lo40i9d878d' in body, 'FishingBooker link missing its tracking anchor'
print(f'draft ok: {len(body)}b, {body.count("<h2>")} H2s')

existing = api('GET', f'wp/v2/posts?slug={SLUG}&status=publish,draft,pending&_fields=id,status')
pid = existing[0]['id'] if existing else None
status = 'publish' if LIVE else 'draft'

payload = {'title': TITLE, 'slug': SLUG, 'status': status, 'categories': [1],
           'content': body, 'excerpt': EXCERPT}

if DRY:
    print(f'[dry] {"UPDATE "+str(pid) if pid else "CREATE"} status={status} cat=1 slug={SLUG}')
    print(f'[dry] seo_title({len(SEO_TITLE)}) seo_desc({len(SEO_DESC)})')
    sys.exit(0)

if pid:
    r = api('POST', f'wp/v2/posts/{pid}', payload); print(f'updated {pid} -> {r["status"]} {r["link"]}')
else:
    r = api('POST', 'wp/v2/posts', payload); pid = r['id']; print(f'created {pid} -> {r["status"]} {r["link"]}')
time.sleep(3)

print('rankmath:', api('POST', 'rankmath/v1/updateMeta', {'objectID': pid, 'objectType': 'post', 'meta': {
    'rank_math_rich_snippet': '', 'rank_math_snippet_article_type': '',
    'rank_math_title': SEO_TITLE, 'rank_math_description': SEO_DESC, 'rank_math_focus_keyword': FOCUS_KW,
}}))
time.sleep(3)

if LIVE:
    # Down-link from the September report so the series chains forward.
    sep = api('GET', 'wp/v2/posts/1770?context=edit&_fields=id,content')['content']['raw']
    needle = '<p class="fbf-disclosure">'
    link = ('<p><strong>Newer:</strong> the <a href="/florida-fishing-report-october-2026/">October 2026 '
            'report</a> covers the Oct 1 flip — gag closed, snook open statewide.</p>\n\n')
    if '/florida-fishing-report-october-2026/' not in sep and sep.count(needle) == 1:
        api('POST', 'wp/v2/posts/1770', {'content': sep.replace(needle, link + needle)})
        print('down-link added to 1770'); time.sleep(3)
    else:
        print('1770 down-link skipped (already present or anchor not unique)')
    try:
        print('cache:', api('POST', 'fbf/v1/flush-cache', {}))
    except Exception as e:
        print('flush failed (non-fatal):', e)

print(f'\nDone. post {pid} status={status}' + ('' if LIVE else '  (draft - pass --publish to go live)'))
