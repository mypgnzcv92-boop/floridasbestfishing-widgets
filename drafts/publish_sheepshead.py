#!/usr/bin/env python3
"""Publish the sheepshead species guide + retrofit post 172's stale Gulf red snapper
"OPEN NOW" framing (Oct 5-8 is a closed gap).

  python3 drafts/publish_sheepshead.py            # dry run, writes nothing
  python3 drafts/publish_sheepshead.py --publish  # apply

Re-runnable. Every content edit asserts EXACTLY ONE match before writing, so a second
pass aborts instead of double-applying. Media upload and the post create are idempotent.
"""
import os, re, sys, json, base64, mimetypes, urllib.request, urllib.error, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLISH = '--publish' in sys.argv
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36')

ENV = {}
for line in open(os.path.join(ROOT, '.env'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, _, v = line.partition('=')
        ENV[k.strip()] = v.strip().strip('"\'')
BASE = ENV['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(
    f"{ENV['WP_USERNAME']}:{ENV['WP_APP_PASSWORD'].replace(' ', '')}".encode()).decode()

def api(path, method='GET', data=None, raw_body=None, ctype=None, extra=None):
    url = path if path.startswith('http') else BASE + path
    body = raw_body if raw_body is not None else (json.dumps(data).encode() if data is not None else None)
    r = urllib.request.Request(url, data=body, method=method)
    r.add_header('User-Agent', UA); r.add_header('Authorization', AUTH)
    if ctype: r.add_header('Content-Type', ctype)
    elif data is not None: r.add_header('Content-Type', 'application/json')
    for k, v in (extra or {}).items(): r.add_header(k, v)
    try:
        with urllib.request.urlopen(r, timeout=180) as resp:
            t = resp.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        sys.exit(f'HTTP {e.code} on {method} {url}\n{e.read().decode("utf-8","replace")[:900]}')
    return json.loads(t) if t.strip().startswith(('{', '[')) else t

def get_raw(kind, pid):
    return api(f'/wp-json/wp/v2/{kind}/{pid}?context=edit&_fields=content')['content']['raw']

EDITS = []          # (label, kind, id, old, new)
def edit(label, kind, pid, old, new):
    EDITS.append((label, kind, pid, old, new))

# ---------------------------------------------------------------- the new post
TITLE   = 'How to Catch Sheepshead in Florida: Bait, Rigs and the Winter Bite'
SLUG    = 'how-to-catch-sheepshead-florida'
SEOTTL  = 'How to Catch Sheepshead in Florida (2026 Guide)'                       # 47
FOCUSKW = 'how to catch sheepshead in florida'
METADSC = ('Sheepshead stack on Florida bridge pilings from October through March. '
           'Here is the bait, the two rigs that hook them, and the current FWC limits.')   # 145
EXCERPT = ('They will strip a shrimp off your hook without ever moving the rod tip, and '
           'they are among the best-eating fish in Florida. Here is how to actually hook them.')  # 158
CATEGORY = 5   # Species Guides
BODY = open(os.path.join(ROOT, 'drafts', 'how-to-catch-sheepshead-florida.html'), encoding='utf-8').read()

IMG_URL = ('https://images.unsplash.com/photo-1612226692243-b9e651f36505'
           '?w=1280&q=58&fm=jpg&auto=format&fit=crop')
IMG_NAME = 'florida-dock-pilings-panama-city-sheepshead.jpg'
IMG_ALT  = ('Weathered wooden dock pilings over calm blue water at Panama City, Florida, '
            'with the Hathaway Bridge on the horizon')

# ------------------------------------------------- hub 596 card (Inshore group)
HUB_ANCHOR = ('<p class="fbf-card__meta">Species guide</p></div></article></div>\n'
              '<div class="fbf-sectionhead"><h2>The Flats')
HUB_CARD = ('<article class="fbf-card fbf-species"><div class="fbf-card__body">'
            '<h3 class="fbf-card__title"><a href="/how-to-catch-sheepshead-florida/">Sheepshead</a></h3>'
            '<p class="fbf-species__sub">The most reliable inshore fish in Florida from October through '
            'March &mdash; and the hardest to hook. Bait, rigs and the&hellip;</p>'
            '<p class="fbf-card__meta">Species guide</p></div></article>')

# -------------------------------------------- post 172: the Oct 5-8 closed gap
edit('172 table row: drop "OPEN NOW"', 'posts', 172,
     '<strong>September 1 \u2013 October 4 \u2190 OPEN NOW</strong>',
     '<strong>September 1 \u2013 October 4 (closed now \u2014 reopens Oct 9)</strong>')
edit('172 prose: reframe the gap', 'posts', 172,
     '<p>The fall season is open right now: <strong>daily through October 4</strong>, then '
     '<strong>daily again Oct 9&ndash;22</strong>,',
     '<p><strong>Right now the Gulf is in a short closed gap.</strong> The daily block ran '
     'September 1 through October 4 and the next legal day is <strong>October 9</strong>, when the '
     'Gulf reopens <strong>daily through October 22</strong>,')

# ------------------------------------------------------- down-links (5 posts)
edit('1387 down-link', 'posts', 1387,
     'flounder</a>, sheepshead, mangrove snapper',
     'flounder</a>, <a href="/how-to-catch-sheepshead-florida/">sheepshead</a>, mangrove snapper')
edit('1389 down-link', 'posts', 1389,
     'king and Spanish mackerel, sheepshead, pompano',
     'king and Spanish mackerel, <a href="/how-to-catch-sheepshead-florida/">sheepshead</a>, pompano')
edit('1629 down-link', 'posts', 1629,
     'Snook, redfish, tarpon, flounder, sheepshead and Spanish mackerel all use it',
     'Snook, redfish, tarpon, flounder, <a href="/how-to-catch-sheepshead-florida/">sheepshead</a> '
     'and Spanish mackerel all use it')
edit('40 down-link', 'posts', 40,
     '<p>Sheepshead A black-and-white striped fish',
     '<p><a href="/how-to-catch-sheepshead-florida/">Sheepshead</a> A black-and-white striped fish')
edit('1459 down-link', 'posts', 1459,
     '<tr><td>Sheepshead</td><td>Heavily armoured',
     '<tr><td><a href="/how-to-catch-sheepshead-florida/">Sheepshead</a></td><td>Heavily armoured')

# =============================================================== execution
def main():
    mode = 'PUBLISH' if PUBLISH else 'DRY RUN'
    print(f'=== {mode} — sheepshead guide + 172 red-snapper gap fix ===\n')

    # 1. slug must be free (or already ours, for a re-run)
    existing = api(f'/wp-json/wp/v2/posts?slug={SLUG}&status=publish,draft&_fields=id')
    post_id = existing[0]['id'] if existing else None
    print(f'[1] slug /{SLUG}/ -> ' + (f'EXISTS as {post_id} (re-run: will update)' if post_id else 'free'))

    # 2. verify every edit is an exactly-once match BEFORE writing anything
    print('\n[2] pre-flight: assert exactly one match per edit')
    cache, fail = {}, 0
    for label, kind, pid, old, new in EDITS:
        key = (kind, pid)
        if key not in cache: cache[key] = get_raw(kind, pid)
        n = cache[key].count(old)
        already = cache[key].count(new)
        ok = (n == 1)
        if not ok and already >= 1:
            print(f'    ~  {label}: 0 matches but replacement already present (already applied)')
        else:
            print(f'    {"OK" if ok else "FAIL"} {label}: {n} match(es)')
            if not ok: fail += 1
    hub = api('/wp-json/wp/v2/pages/596?context=edit&_fields=content')['content']['raw']
    hn = hub.count(HUB_ANCHOR)
    if hn != 1 and HUB_CARD in hub:
        print('    ~  hub 596 card: already present')
    else:
        print(f'    {"OK" if hn == 1 else "FAIL"} hub 596 anchor: {hn} match(es)')
        if hn != 1: fail += 1
    if fail:
        sys.exit(f'\nABORT: {fail} edit(s) did not match exactly once. Nothing written.')

    if not PUBLISH:
        print('\n[3] dry run — would create the post, upload the image, wire the hub,')
        print('    apply the 7 edits above, then run: python3 deploy.py regs throw')
        print('\nDRY RUN CLEAN. Re-run with --publish to apply.')
        return

    # 3. create / update the post
    payload = dict(title=TITLE, slug=SLUG, status='publish', categories=[CATEGORY],
                   content=BODY, excerpt=EXCERPT)
    if post_id:
        api(f'/wp-json/wp/v2/posts/{post_id}', 'POST', payload)
    else:
        post_id = api('/wp-json/wp/v2/posts', 'POST', payload)['id']
    print(f'\n[3] post {post_id} published -> {BASE}/{SLUG}/')

    # 4. Rank Math: schema clear + SEO fields (empty strings inherit BlogPosting)
    api('/wp-json/rankmath/v1/updateMeta', 'POST', {
        'objectID': post_id, 'objectType': 'post',
        'meta': {'rank_math_rich_snippet': '', 'rank_math_snippet_article_type': '',
                 'rank_math_title': SEOTTL, 'rank_math_description': METADSC,
                 'rank_math_focus_keyword': FOCUSKW}})
    print(f'[4] Rank Math set — title {len(SEOTTL)} chars, meta {len(METADSC)} chars')

    # 5. featured image (idempotent: reuse if the filename is already in the library)
    found = [m for m in api('/wp-json/wp/v2/media?per_page=100&_fields=id,source_url')
             if IMG_NAME.rsplit('.', 1)[0] in m['source_url']]
    if found:
        mid = found[0]['id']; print(f'[5] image already uploaded as media {mid}')
    else:
        rq = urllib.request.Request(IMG_URL); rq.add_header('User-Agent', UA)
        blob = urllib.request.urlopen(rq, timeout=180).read()
        m = api('/wp-json/wp/v2/media', 'POST', raw_body=blob,
                ctype=mimetypes.guess_type(IMG_NAME)[0] or 'image/jpeg',
                extra={'Content-Disposition': f'attachment; filename="{IMG_NAME}"'})
        mid = m['id']
        print(f'[5] uploaded media {mid} ({len(blob)//1024} KB)')
    api(f'/wp-json/wp/v2/media/{mid}', 'POST',
        {'alt_text': IMG_ALT, 'title': 'Florida dock pilings, Panama City'})
    api(f'/wp-json/wp/v2/posts/{post_id}', 'POST', {'featured_media': mid})
    print(f'[5] media {mid} assigned with alt text')

    # 6. hub card
    if HUB_CARD in hub:
        print('[6] hub 596 card already present')
    else:
        api('/wp-json/wp/v2/pages/596', 'POST',
            {'content': hub.replace(HUB_ANCHOR, HUB_CARD + HUB_ANCHOR, 1)})
        print('[6] hub 596: Sheepshead card added to Inshore & Flats')

    # 7. the edits
    print('[7] applying edits')
    per = {}
    for label, kind, pid, old, new in EDITS:
        per.setdefault((kind, pid), []).append((label, old, new))
    for (kind, pid), items in per.items():
        body = get_raw(kind, pid)
        touched = 0
        for label, old, new in items:
            if body.count(old) == 1:
                body = body.replace(old, new, 1); touched += 1; print(f'    + {label}')
            elif new in body:
                print(f'    = {label} (already applied)')
            else:
                sys.exit(f'    ABORT {label}: expected 1 match, got {body.count(old)}')
        if touched:
            api(f'/wp-json/wp/v2/{kind}/{pid}', 'POST', {'content': body})

    # 8. widgets — patch deploy.py with the real post id, then deploy
    dp = os.path.join(ROOT, 'deploy.py')
    src = open(dp, encoding='utf-8').read()
    adds = [
        ("('posts', 1784, 'sailfish@atlantic', 'keep'),  # sailfish guide (2026-09-23)",
         f"\n            ('posts', {post_id}, 'sheepshead', 'keep'),  # sheepshead guide ({SLUG}) — authors its own markers above the first H2"),
        ("('posts', 1323, 'spanish-mackerel', 'keep'),",
         f"\n            ('posts', {post_id}, 'sheepshead', 'keep'),  # sheepshead guide — widget sits after the bait section"),
    ]
    changed = False
    for anchor_prefix, addition in adds:
        if f"('posts', {post_id}, 'sheepshead', 'keep')" in src and src.count(
                f"('posts', {post_id}, 'sheepshead', 'keep')") >= len(adds):
            break
        hits = [m.start() for m in re.finditer(re.escape(anchor_prefix), src)]
        if len(hits) != 1:
            sys.exit(f'    ABORT deploy.py anchor {anchor_prefix[:40]!r}: {len(hits)} match(es)')
        end = src.index('\n', hits[0] + len(anchor_prefix))
        src = src[:end] + addition + src[end:]
        changed = True
    if changed:
        open(dp, 'w', encoding='utf-8').write(src)
        print(f'[8] deploy.py: added regs + throw targets for post {post_id}')
    else:
        print('[8] deploy.py targets already present')
    r = subprocess.run([sys.executable, 'deploy.py', 'regs', 'throw'], cwd=ROOT,
                       capture_output=True, text=True)
    print((r.stdout or '')[-1800:]); print((r.stderr or '')[-600:])
    print(f'[8] deploy.py exit {r.returncode}')

    # 9. cache
    api('/wp-json/fbf/v1/flush-cache', 'POST', {})
    print('[9] cache flush requested (GoDaddy + Cloudflare)')
    print(f'\nDONE. Verify: {BASE}/{SLUG}/?v=check')

main()
