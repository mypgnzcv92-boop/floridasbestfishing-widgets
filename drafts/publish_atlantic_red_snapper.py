import json, re, sys, time, base64, urllib.request, urllib.error, random
env = dict(l.strip().split('=',1) for l in open('/Users/williamnelson/floridasbestfishing-widgets/.env') if '=' in l)
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD']}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv

def api(method, path, body=None):
    req = urllib.request.Request(WP + '/wp-json/' + path, data=(json.dumps(body).encode() if body is not None else None), headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:300]); raise

def get_raw(pid):
    d = api('GET', f'wp/v2/posts/{pid}?context=edit&_fields=id,content,excerpt,modified')
    time.sleep(3); return d['content']['raw']

def replace_once(s, old, new, label):
    n = s.count(old)
    assert n == 1, f'{label}: expected 1 match, got {n}'
    return s.replace(old, new)

def post(pid, body, label):
    if DRY: print(f'[dry] would POST {pid} ({label})'); return
    r = api('POST', f'wp/v2/posts/{pid}', body); print(f'POST {pid} ok, modified {r["modified"]}'); time.sleep(3)

def rankmath(pid, meta):
    if DRY: print(f'[dry] would updateMeta {pid} {list(meta)}'); return
    r = api('POST', 'rankmath/v1/updateMeta', {'objectID': pid, 'objectType': 'post', 'meta': meta}); print('rankmath', pid, r); time.sleep(3)

# ---------- 302 ----------
raw302 = get_raw(302)
def block(s, key):
    m = re.search(rf'<!-- FBF:{key}:start -->.*?<!-- FBF:{key}:end -->', s, re.S); assert m, key; return m.group(0)
setup_blk, regs_blk = block(raw302,'setup'), block(raw302,'regs')
assert 'offshore-bottom' in setup_blk and 'red-snapper' in regs_blk and 'data-zone="atlantic"' in regs_blk
FB = 'https://fishingbooker.com/destinations/location/us/FL/jacksonville#d7lo40i9d878d'
body302 = open(__file__.rsplit("/",1)[0] + "/atlantic-red-snapper-302-retrofit.html").read().replace('{{SETUP}}', setup_blk).replace('{{REGS}}', regs_blk).replace('FISHINGBOOKER_URL#d7lo40i9d878d', FB)
for must in ['/go/penn-carnage-iii-rod/','/go/penn-spinfisher-vii-5500/','/go/shimano-saragosa-8000sw/','/go/owner-mutu-light-circle-hooks/', FB, '/jacksonville-ne-florida/','/southeast-coast/','/offshore/','/florida-red-snapper-season-2026/','/florida-snapper-fishing-guide/']:
    assert must in body302, must
assert '<h1' not in body302 and body302.count('<h2>') == 7 and 'July 31' not in body302
meta302 = 'Atlantic red snapper in Florida, September 2026: state waters open at 20" and 2 a day, federal waters closed, and an October 1–31 season is waiting on NOAA.'
assert 120 <= len(meta302) <= 160, len(meta302)
exc302 = "Florida's 39-day Atlantic red snapper season never opened. Here's what you can legally keep today — and the October 1–31 plan that's sitting on NOAA's desk."
print('302 body', len(body302), 'chars; meta', len(meta302))

# ---------- 172 ----------
raw172 = get_raw(172)
old_atl = re.search(r'<h3>Atlantic Red Snapper</h3>\s*<p>.*?</p>', raw172, re.S); assert old_atl
new_atl = ('<h3>Atlantic Red Snapper</h3>\n<p>The Atlantic is a different world. The 39-day 2026 season Florida announced (May 22 – June 20 plus October weekends) was halted by a federal court the night before it opened and never ran. Right now <strong>Atlantic state waters are open</strong> under the standard rule — 20-inch minimum, 2 per person — and <strong>federal Atlantic waters are closed</strong>. Florida has asked NOAA for an October 1–31 season; it\'s still under review. Full story in our <a href="/atlantic-red-snapper-season-2026-florida/">Atlantic red snapper update</a>.</p>')
new172 = raw172.replace(old_atl.group(0), new_atl, 1)
row_re = re.compile(r'<tr><td>Fall Weekend Sessions</td><td>[^<]*</td></tr>')
assert len(row_re.findall(new172)) == 1
new172 = row_re.sub('<tr><td>Fall Weekend Sessions</td><td>Oct 9–11, 16–18, 23–25, Oct 30–Nov 1 (Fri–Sun); Nov 7–8, 14–15, 21–22; Dec 5–6, 12–13, 19–20 (Sat–Sun)</td></tr>\n<tr><td>Holiday Windows</td><td>Nov 26–29 (Thanksgiving); Dec 25–27 (Christmas); Jan 1–4, 2027 (daily)</td></tr>', new172, 1)
sent_re = re.compile(r'and 21(?:&ndash;|–)22\. Verified against myfwc\.com on 1 September 2026\.')
assert len(sent_re.findall(new172)) == 1
new172 = sent_re.sub('and 21–22, then Thanksgiving (Nov 26–29), December weekends (Dec 5–6, 12–13, 19–20), Christmas (Dec 25–27) and Jan 1–4, 2027. Verified against myfwc.com on 3 September 2026.', new172, 1)
assert 'FBF:regs:start' in new172 and 'fall weekend sessions beginning in October' not in new172
print('172 edits ok')

# ---------- 530 ----------
raw530 = get_raw(530)
new530 = replace_once(raw530,
  'The Gulf private-recreational season runs a long 2026 schedule (summer through July 31, then fall weekends into the winter), while the Atlantic recreational season is currently closed.',
  'The Gulf private-recreational season reopened September 1 (daily through October 4, then fall weekends into January), while on the Atlantic only state waters are open — 20-inch minimum, 2 per person — and federal waters are closed.', '530 sentence')
print('530 edit ok')

# ---------- write ----------
post(302, {'content': body302, 'excerpt': exc302}, 'Atlantic retrofit')
rankmath(302, {'rank_math_focus_keyword': 'atlantic red snapper season 2026', 'rank_math_description': meta302})
post(172, {'content': new172}, 'Atlantic section + fall table')
post(530, {'content': new530}, 'one sentence')
if not DRY:
    req = urllib.request.Request(WP + '/wp-json/fbf/v1/flush-cache', data=b'{}', headers=HDR, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r: print('flush', r.status, r.read()[:200])
    time.sleep(3)
    d = api('GET', 'wp/v2/posts/302?context=edit&_fields=meta,excerpt')
    print('excerpt now:', d['excerpt']['raw'][:80])
