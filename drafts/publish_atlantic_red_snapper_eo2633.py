"""Retrofit 302 / 172 / 530 for FWC Executive Order 26-33 (signed 2026-09-22).

The Atlantic red snapper season is now October 9-22, 2026, state AND federal waters,
1 fish/person, no minimum size, declared trips only. FWC also closed Atlantic state
waters to red snapper on Sept 22 ahead of the opener, and the Gulf fall schedule now
reads "Sep 1 - Oct 4 (daily)" AND "Oct 9 - 22 (daily)" instead of the old Oct 9-11 /
16-18 weekends.

Re-runnable: it re-reads the live widget blocks out of 302 rather than hardcoding them.
Every edit asserts exactly one match, so a drifted post fails loudly instead of silently
half-applying.

    python3 drafts/publish_atlantic_red_snapper_eo2633.py --dry-run
    python3 drafts/publish_atlantic_red_snapper_eo2633.py
"""
import json, re, sys, time, base64, urllib.request, urllib.error

env = dict(l.strip().split('=', 1) for l in open('/Users/williamnelson/floridasbestfishing-widgets/.env') if '=' in l)
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD']}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv
HERE = __file__.rsplit('/', 1)[0]

def api(method, path, body=None):
    req = urllib.request.Request(WP + '/wp-json/' + path, data=(json.dumps(body).encode() if body is not None else None), headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:300]); raise

def get_raw(pid):
    d = api('GET', f'wp/v2/posts/{pid}?context=edit&_fields=id,content,modified')
    time.sleep(3); return d['content']['raw']

def sub_once(s, pattern, repl, label, flags=re.S):
    hits = re.findall(pattern, s, flags)
    assert len(hits) == 1, f'{label}: expected 1 match, got {len(hits)}'
    return re.sub(pattern, lambda _m: repl, s, count=1, flags=flags)

def post(pid, body, label):
    if DRY:
        print(f'[dry] would POST {pid} ({label})'); return
    r = api('POST', f'wp/v2/posts/{pid}', body); print(f'POST {pid} ok, modified {r["modified"]}'); time.sleep(3)

def rankmath(pid, meta):
    if DRY:
        print(f'[dry] would updateMeta {pid} {list(meta)}'); return
    print('rankmath', pid, api('POST', 'rankmath/v1/updateMeta', {'objectID': pid, 'objectType': 'post', 'meta': meta})); time.sleep(3)

DASH = r'[–—-]|&ndash;|&mdash;'   # en dash, em dash, hyphen, or entity

# ---------------------------------------------------------------- 302 (full rewrite)
raw302 = get_raw(302)

def block(s, key):
    m = re.search(rf'<!-- FBF:{key}:start -->.*?<!-- FBF:{key}:end -->', s, re.S)
    assert m, f'missing FBF:{key} block on 302'
    return m.group(0)

setup_blk, regs_blk = block(raw302, 'setup'), block(raw302, 'regs')
assert 'offshore-bottom' in setup_blk, 'setup preset changed'
assert 'red-snapper' in regs_blk and 'data-zone="atlantic"' in regs_blk, 'regs preset changed'

FB = 'https://fishingbooker.com/destinations/location/us/FL/jacksonville#d7lo40i9d878d'
body302 = (open(f'{HERE}/atlantic-red-snapper-302-eo2633.html').read()
           .replace('{{SETUP}}', setup_blk)
           .replace('{{REGS}}', regs_blk)
           .replace('FISHINGBOOKER_URL#d7lo40i9d878d', FB))

for must in ['October 9', 'no minimum size', 'Declare the trip', 'EFP 26-SERO-07', 'Executive Order 26-33',
             '/go/penn-carnage-iii-rod/', '/go/penn-spinfisher-vii-5500/', '/go/shimano-saragosa-8000sw/',
             '/go/owner-mutu-light-circle-hooks/', FB, '/jacksonville-ne-florida/', '/southeast-coast/',
             '/offshore/', '/florida-red-snapper-season-2026/', '/florida-snapper-fishing-guide/',
             '23 September 2026']:
    assert must in body302, f'302 body missing {must}'
assert '<h1' not in body302, '302: no h1 in body'
assert body302.count('<h2>') >= 8, f'302 h2 count {body302.count("<h2>")}'
for stale in ['PENDING', 'still under review', 'October 1–31', 'October 1&ndash;31', "sitting on NOAA's desk"]:
    assert stale not in body302, f'302 still carries stale text: {stale}'

TITLE302 = 'Atlantic Red Snapper Season 2026: Oct 9–22 Is Set'
SEO302 = 'Atlantic Red Snapper Season 2026: Oct 9-22 Dates'
META302 = ('Florida\'s 2026 Atlantic red snapper season is October 9-22 in state and federal waters: '
           'one fish, no minimum size, and every trip must be declared first.')
EXC302 = ('Fourteen days, one fish, no size limit — and no keeping a red snapper unless you declare the trip '
          'first. Everything Florida anglers need for the October 9–22 Atlantic season.')
assert len(SEO302) <= 60, len(SEO302)
assert 120 <= len(META302) <= 160, len(META302)
assert EXC302.strip(), 'excerpt must not be empty'
print(f'302: body {len(body302)} chars, h2s {body302.count("<h2>")}, seo {len(SEO302)}, meta {len(META302)}')

# ---------------------------------------------------------------- 172 (Gulf guide)
raw172 = get_raw(172)

new_atl = ('<h3>Atlantic Red Snapper</h3>\n<p>The Atlantic is a different world. The 39-day 2026 season Florida '
           'announced was halted by a federal court the night before it opened and never ran &mdash; but NOAA issued '
           'Florida a revised permit on September 21 and the FWC set the season the next day. <strong>Atlantic red '
           'snapper is open October 9&ndash;22, 2026</strong> in state and federal waters: <strong>one fish per '
           'person, no minimum size</strong>, and you must declare the trip before you leave the dock. Outside that '
           'window, harvest is closed &mdash; FWC closed Atlantic state waters on September 22 ahead of the opener. '
           'Full details in our <a href="/atlantic-red-snapper-season-2026-florida/">Atlantic red snapper update</a>.</p>')
raw172 = sub_once(raw172, r'<h3>Atlantic Red Snapper</h3>\s*<p>.*?</p>', new_atl, '172 Atlantic h3')

new_row = ('<tr><td>Fall Continued</td><td>Oct 9&ndash;22 (daily); Oct 23&ndash;25 and Oct 30&ndash;Nov 1 (Fri&ndash;Sun); '
           'Nov 7&ndash;8, 14&ndash;15, 21&ndash;22; Dec 5&ndash;6, 12&ndash;13, 19&ndash;20 (Sat&ndash;Sun)</td></tr>')
raw172 = sub_once(raw172, r'<tr><td>Fall Weekend Sessions</td><td>.*?</td></tr>', new_row, '172 fall row')

new_prose = ('then <strong>daily again Oct 9&ndash;22</strong>, then weekends Oct 23&ndash;25 and Oct 30&ndash;Nov 1, '
             'two-day weekends Nov 7&ndash;8, 14&ndash;15 and 21&ndash;22, Thanksgiving (Nov 26&ndash;29), December '
             'weekends (Dec 5&ndash;6, 12&ndash;13, 19&ndash;20), Christmas (Dec 25&ndash;27) and Jan 1&ndash;4, 2027. '
             'Verified against myfwc.com on 23 September 2026.')
raw172 = sub_once(raw172, r'then three-day weekends Oct 9.*?on 3 September 2026\.', new_prose, '172 fall prose')

assert 'FBF:regs:start' in raw172, '172 lost its regs widget'
assert '20-inch minimum, 2 per person' not in raw172, '172 still states the suspended Atlantic state rule'
print('172: edits staged')

# ---------------------------------------------------------------- 530 (snapper pillar)
raw530 = get_raw(530)
new530_sentence = ('The Gulf private-recreational season reopened September 1 (daily through October 4, daily again '
                   'Oct 9&ndash;22, then weekends and holiday windows into January), while the Atlantic has a single '
                   '14-day season, <strong>October 9&ndash;22</strong>, on declared trips only.')
raw530 = sub_once(raw530, r'The Gulf private-recreational season reopened September 1.*?federal waters are closed\.',
                  new530_sentence, '530 sentence')
print('530: edit staged')

# ---------------------------------------------------------------- write
post(302, {'title': TITLE302, 'content': body302, 'excerpt': EXC302}, 'EO 26-33 rewrite')
rankmath(302, {'rank_math_focus_keyword': 'atlantic red snapper season 2026',
               'rank_math_title': SEO302,
               'rank_math_description': META302,
               'rank_math_rich_snippet': '',
               'rank_math_snippet_article_type': ''})
post(172, {'content': raw172}, 'Atlantic section + Gulf fall dates')
post(530, {'content': raw530}, 'one sentence')

if not DRY:
    req = urllib.request.Request(WP + '/wp-json/fbf/v1/flush-cache', data=b'{}', headers=HDR, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r:
        print('flush', r.status, r.read()[:200])
    time.sleep(4)
    d = api('GET', 'wp/v2/posts/302?context=edit&_fields=excerpt,title')
    print('title now:', d['title']['raw'])
    print('excerpt now:', d['excerpt']['raw'][:90])
