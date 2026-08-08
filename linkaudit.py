#!/usr/bin/env python3
"""Full link audit for floridasbestfishing.com — crawls every post/page's raw content,
extracts every href/iframe src, and resolves each one."""
import json, base64, re, sys, urllib.request, urllib.error, random
from concurrent.futures import ThreadPoolExecutor

BASE = "https://floridasbestfishing.com/wp-json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
env = open('/Users/williamnelson/floridasbestfishing-widgets/.env').read()
U = re.search(r'WP_USERNAME=(.*)', env).group(1).strip()
P = re.search(r'WP_APP_PASSWORD=(.*)', env).group(1).strip()
AUTH = "Basic " + base64.b64encode(f"{U}:{P}".encode()).decode()


def api(path):
    req = urllib.request.Request(f"{BASE}/{path}", headers={"User-Agent": UA, "Authorization": AUTH})
    return json.load(urllib.request.urlopen(req, timeout=60))


def fetch_all(kind):
    out, page = [], 1
    while True:
        batch = api(f"wp/v2/{kind}?per_page=50&page={page}&context=edit&_fields=id,slug,link,title,content")
        out += batch
        if len(batch) < 50:
            break
        page += 1
    return out


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe(url, follow=False):
    """Return (status, location). Uses GET (HEAD is unreliable behind this CDN)."""
    u = url
    if "/go/" in u:  # bust the 31-day edge cache on affiliate redirects
        u += ("&" if "?" in u else "?") + f"cb={random.randint(1,10**9)}"
    op = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    req = urllib.request.Request(u, headers={"User-Agent": UA})
    try:
        r = op.open(req, timeout=45)
        return r.status, r.headers.get("Location", "")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", "") if e.headers else ""
    except Exception as e:
        return 0, f"{type(e).__name__}: {e}"


print("Fetching content…")
items = [("post", p) for p in fetch_all("posts")] + [("page", p) for p in fetch_all("pages")]
print(f"  {len(items)} posts+pages")

# ---- extract every link ----
refs = {}   # url -> [(kind, id, slug), ...]
for kind, it in items:
    body = it["content"]["raw"]
    urls = re.findall(r'href="([^"]+)"', body) + re.findall(r'<iframe[^>]+src="([^"]+)"', body)
    for u in urls:
        u = u.strip()
        if u.startswith(("#", "mailto:", "tel:")):
            continue
        if u.startswith("/"):                       # relative -> absolute
            u = "https://floridasbestfishing.com" + u
        refs.setdefault(u, []).append((kind, it["id"], it["slug"]))

# ---- nav menu items too ----
try:
    for m in api("wp/v2/menu-items?per_page=100&_fields=id,title,url,type"):
        if m.get("url", "").startswith("http"):
            refs.setdefault(m["url"], []).append(("menu", m["id"], m["title"]["rendered"]))
except Exception as e:
    print("  (menu items unavailable:", e, ")")

print(f"  {len(refs)} unique URLs\nProbing…")

INTERNAL = "floridasbestfishing.com"
results = {}
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(probe, u, INTERNAL not in u and "/go/" not in u): u for u in refs}
    for f in futs:
        pass
    for f, u in futs.items():
        try:
            results[u] = f.result()
        except Exception as e:
            results[u] = (0, str(e))

# ---- classify ----
def bucket(u):
    if "/go/" in u and INTERNAL in u:
        return "affiliate"
    if INTERNAL in u:
        return "internal"
    if "youtube.com" in u or "youtu.be" in u:
        return "video"
    return "external"

problems, summary = [], {}
for u, (code, loc) in sorted(results.items()):
    b = bucket(u)
    summary[b] = summary.get(b, [0, 0])
    summary[b][0] += 1
    ok = code in (200, 301, 302, 307, 308)
    # an internal 301 is a redirect we should clean up (link to the canonical URL)
    flag = None
    if code in (0, 404, 403, 410, 500, 503):
        flag = f"HTTP {code}"
    elif b == "internal" and code in (301, 302):
        flag = f"redirect -> {loc}"
    elif b == "affiliate" and code not in (301, 302):
        flag = f"affiliate not redirecting (HTTP {code})"
    if flag:
        problems.append((b, u, flag, refs[u]))
    else:
        summary[b][1] += 1

print("\n===== SUMMARY =====")
for b, (tot, ok) in sorted(summary.items()):
    print(f"  {b:10} {ok}/{tot} clean")

print(f"\n===== {len(problems)} PROBLEMS =====")
for b, u, flag, where in sorted(problems):
    src = ", ".join(f"{k}{i}" for k, i, s in where)
    print(f"[{b}] {u}\n    {flag}\n    on: {src}")

json.dump({"problems": [[b, u, f, w] for b, u, f, w in problems],
           "results": {k: list(v) for k, v in results.items()},
           "refs": {k: v for k, v in refs.items()}},
          open(sys.argv[1] if len(sys.argv) > 1 else "linkaudit.json", "w"), indent=1)
