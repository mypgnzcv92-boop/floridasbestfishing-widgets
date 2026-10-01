"""2026-09-30/10-01 run: the October 1 season-flip sweep.

Gulf gag grouper closed 12:01 a.m. Oct 1; snook opened in Charlotte Harbor + Southwest the same
moment. Seven live posts were framed on the state that expired. Every edit asserts exactly one
match so a partial/duplicate application fails loudly instead of silently mangling content.

Re-runnable: assertions fail if an edit is already applied, so run --dry-run first.
All figures FWC-verified 2026-09-30 (see CONTENT-ROUTINE.md §7).
"""
import json, sys, time, base64, urllib.request, urllib.error, os

D = os.path.dirname(os.path.abspath(__file__))
env = dict(l.strip().split('=', 1) for l in open(os.path.join(D, '..', '.env')) if '=' in l and not l.startswith('#'))
WP = env['WP_URL'].rstrip('/')
AUTH = 'Basic ' + base64.b64encode(f"{env['WP_USERNAME']}:{env['WP_APP_PASSWORD'].replace(' ','')}".encode()).decode()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
HDR = {'Authorization': AUTH, 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA}
DRY = '--dry-run' in sys.argv


def api(method, path, body=None):
    req = urllib.request.Request(WP + '/wp-json/' + path,
                                 data=(json.dumps(body).encode() if body is not None else None),
                                 headers=HDR, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, path, e.read()[:400]); raise


def get_raw(pid):
    p = api('GET', f'wp/v2/posts/{pid}?context=edit&_fields=id,content,title,excerpt')
    return p['content']['raw']


def apply_edits(pid, edits):
    """edits: list of (old, new). Each must match exactly once."""
    s = get_raw(pid)
    for i, (old, new) in enumerate(edits):
        n = s.count(old)
        if n != 1:
            raise SystemExit(f'  !! post {pid} edit #{i+1}: expected 1 match, got {n}\n     {old[:120]!r}')
        s = s.replace(old, new)
    return s


def push(pid, body, label):
    if DRY:
        print(f'  [dry] POST posts/{pid} ({label}) keys={list(body)}'); return
    r = api('POST', f'wp/v2/posts/{pid}', body)
    print(f'  POST {pid} ok -> modified {r["modified"]}'); time.sleep(3)


def rankmath(pid, meta):
    if DRY:
        print(f'  [dry] updateMeta {pid} {json.dumps(meta)[:160]}'); return
    r = api('POST', 'rankmath/v1/updateMeta', {'objectID': pid, 'objectType': 'post', 'meta': meta})
    print('  rankmath', pid, str(r)[:90]); time.sleep(3)


SCHEMA_CLEAR = {'rank_math_rich_snippet': '', 'rank_math_snippet_article_type': ''}

# ---------------------------------------------------------------- 345 gag grouper (full reframe)
print('\n[345] gag grouper -> post-season reframe')
body345 = open(os.path.join(D, 'gag-grouper-345-postseason.html')).read()
cur345 = get_raw(345)
for marker in ('<!-- FBF:regs:start -->', '<!-- FBF:setup:start -->', '<!-- FBF:fbooker:start -->'):
    assert marker in body345 and marker in cur345, f'345 lost marker {marker}'
assert '<h1' not in body345.lower(), '345 draft contains an h1'
push(345, {
    'content': body345,
    'title': "Florida Gag Grouper Season 2026: Closed — What's Still Biting",
    'excerpt': "Gulf gag closed October 1 and won't reopen until 2027. The confirmed 2026 dates, the limits that applied, and the Gulf bottom fish you can still keep.",
}, 'content+title+excerpt')
rankmath(345, {**SCHEMA_CLEAR,
    'rank_math_title': 'Florida Gag Grouper Season 2026: Closed Oct 1',
    'rank_math_description': "Gulf gag grouper closed Oct 1, 2026 and won't reopen this year. The season dates, the 24-inch rule, and the Gulf bottom fish still open right now.",
    'rank_math_focus_keyword': 'florida gag grouper season',
})

# ---------------------------------------------------------------- 331 snook season (opener flip)
print('\n[331] snook season -> all nine regions open')
e331 = [
 ("<p><strong>Snook harvest reopened Tuesday, September 1</strong> in seven of Florida's nine management regions &mdash; the first legal snook since spring. But it is not a statewide date, and the two regions that stay shut are the ones a lot of anglers assume are open. Florida runs snook on a <strong>region-by-region seasonal system</strong> with different windows on each coast, a tight slot limit, and a mandatory permit. Here is exactly who opens when, and how to stay legal.</p>",
  "<p><strong>As of October 1, snook harvest is open in all nine of Florida's management regions.</strong> Charlotte Harbor and the Southwest were the last two to come in, a month behind their neighbours. This is the only stretch of 2026 when the entire state is open at once, and it ends on <strong>December 1</strong>. Florida runs snook on a <strong>region-by-region seasonal system</strong> with different windows on each coast, a tight slot limit, and a mandatory permit. Here is who closes when, and how to stay legal.</p>"),

 ("<h2>Snook Season Opens Sept 1 &mdash; Except in Two Regions</h2>",
  "<h2>Every Snook Region Is Open &mdash; Until December</h2>"),

 ("<li><strong>&#9989; Opens Sept 1 &mdash; northern &amp; central Gulf</strong> (Panhandle, Big Bend, Tampa Bay, Sarasota Bay). Closed May 1 &ndash; Aug 31.</li>\n<li><strong>&#9989; Opens Sept 1 &mdash; the entire Atlantic coast</strong> (Northeast, Indian River Lagoon, Southeast). Closed June 1 &ndash; Aug 31.</li>\n<li><strong>&#10060; Still closed until Oct 1 &mdash; southwest Gulf</strong> (Charlotte Harbor and Southwest). Closed May 1 &ndash; Sept 30, a full month longer than its neighbours.</li>",
  "<li><strong>&#9989; Open &mdash; northern &amp; central Gulf</strong> (Panhandle, Big Bend, Tampa Bay, Sarasota Bay). Opened Sept 1; <strong>closes Dec 1</strong>.</li>\n<li><strong>&#9989; Open &mdash; southwest Gulf</strong> (Charlotte Harbor and Southwest, including all waters of Everglades National Park). Opened <strong>Oct 1</strong> after a closure a full month longer than its neighbours; <strong>closes Dec 1</strong>.</li>\n<li><strong>&#9989; Open &mdash; the entire Atlantic coast</strong> (Northeast, Indian River Lagoon, Southeast). Opened Sept 1; <strong>closes Dec 15</strong>.</li>"),

 ("<p><strong>&#9888;&#65039; The trap that costs people a citation:</strong> &ldquo;the Gulf reopens Sept 1&rdquo; is only true north of Charlotte Harbor. If you fish <strong>Boca Grande, Pine Island Sound, Matlacha, Fort Myers, Naples or Marco</strong>, your season is still <strong>closed</strong> on September 1 and does not open until <strong>October 1</strong>. Same coast, same species, one month apart.</p>",
  "<p><strong>&#9888;&#65039; The next trap on the calendar:</strong> the two coasts do not close together. The Gulf &mdash; including Charlotte Harbor and the Southwest &mdash; shuts on <strong>December 1</strong>, while the Atlantic runs a fortnight longer, to <strong>December 15</strong>. Through September the costly assumption was that the Gulf opened everywhere on Sept 1. From here it is assuming the whole state closes on the same day.</p>"),

 ("<p>So the next time you can legally keep a snook: <strong>Sept 1</strong> on the Atlantic and on the Gulf from Sarasota north &mdash; but <strong>Oct 1</strong> if you fish Charlotte Harbor or southwest Florida.</p>",
  "<p>So the dates that matter now are the closing ones: <strong>Dec 1</strong> everywhere on the Gulf, <strong>Dec 15</strong> on the Atlantic. After that it is release-only until spring.</p>\n\n<!-- FBF:fbooker:start -->\n<p><a href=\"https://fishingbooker.com/destinations/location/us/FL/boca-grande#d7lo40i9d878d\" rel=\"sponsored nofollow noopener\" target=\"_blank\"><strong>Charlotte Harbor just opened &mdash; compare Boca Grande snook charters &rarr;</strong></a></p>\n<!-- FBF:fbooker:end -->"),

 ("Rough guide to the boundaries that matter most in September:",
  "Rough guide to the boundaries that matter most:"),

 ("Tampa Bay, St. Pete, Anna Maria, Sarasota. Opens <strong>Sept 1</strong>.",
  "Tampa Bay, St. Pete, Anna Maria, Sarasota. <strong>Open</strong> since Sept 1."),

 ("Boca Grande, Pine Island Sound, Cape Coral, the Caloosahatchee. Opens <strong>Oct 1</strong>.",
  "Boca Grande, Pine Island Sound, Cape Coral, the Caloosahatchee. <strong>Open</strong> since Oct 1."),

 ("Estero Bay, Naples, Marco, into the <a href=\"/everglades-flamingo/\">Everglades</a>. Opens <strong>Oct 1</strong>.",
  "Estero Bay, Naples, Marco, into the <a href=\"/everglades-flamingo/\">Everglades</a>. <strong>Open</strong> since Oct 1."),

 ("Sebastian, Vero, Fort Pierce. Opens <strong>Sept 1</strong>.",
  "Sebastian, Vero, Fort Pierce. <strong>Open</strong> since Sept 1."),

 ("<h2>Opening Week: How to Not Waste Your One Fish</h2>",
  "<h2>How to Not Waste Your One Fish</h2>"),

 ("so opening week is still mostly a release fishery",
  "so snook is still mostly a release fishery"),

 ("Heavy-enough tackle is the whole game in August",
  "Heavy-enough tackle is the whole game in warm water"),

 ("Night snook on dock and bridge lights stays strong into September &mdash;",
  "Night snook on dock and bridge lights stays strong right through the fall &mdash;"),

 ("<p>Snook reopened Sept 1 alongside gag grouper and Gulf red snapper — see the <a href=\"/florida-fishing-report-august-2026/\">mid-August 2026 fishing report</a> for the full opening-day picture.</p>",
  "<p>Snook reopened alongside gag grouper and Gulf red snapper — <a href=\"/florida-gag-grouper-season-2026/\">gag has since closed for the year</a>, while red snapper runs on into January. The current picture is in our latest <a href=\"/reports/\">Florida fishing report</a>.</p>"),

 ("<p>The best snook fishing of the year and an open season land in the same week &mdash; but only if you are in the right region. <strong>Sept 1</strong> for the Atlantic and the Gulf from Sarasota north; <strong>Oct 1</strong> for Charlotte Harbor and southwest Florida. Know your slot, carry the snook permit, take your one fish if you want it, and handle every other one like it is the fish you will want to catch again next season.</p>",
  "<p>For the first time this year every snook region in Florida is open at once, and the fall bite is the best of the season. That window shuts <strong>December 1</strong> on the Gulf and <strong>December 15</strong> on the Atlantic. Know your slot &mdash; 28&ndash;33&Prime; on the Gulf, 28&ndash;32&Prime; on the Atlantic &mdash; carry the snook permit, take your one fish if you want it, and handle every other one like it is the fish you will want to catch again next season.</p>"),

 ("<p><em>Seasons and rules change — always verify current dates and limits at <a href=\"https://myfwc.com/fishing/saltwater/recreational/snook/\" rel=\"nofollow\" target=\"_blank\">MyFWC.com/Snook</a> before harvesting.</em></p>",
  "<p><em>Region dates and slot limits verified against <a href=\"https://myfwc.com/fishing/saltwater/recreational/snook/\" rel=\"nofollow\" target=\"_blank\">FWC's snook page</a> on September 30, 2026. Seasons and rules change — always check before harvesting.</em></p>"),

 ("<p><em>Heads up: some links below are affiliate links. Buy through them and we may earn a small commission — no extra cost to you. Thanks for keeping the lights on.</em></p>",
  "<p><em>Disclosure: some links here are paid. Buy or book through one and we earn a commission at no extra cost to you — it never affects which gear or captains we recommend. As an Amazon Associate we earn from qualifying purchases.</em></p>"),
]
push(331, {
    'content': apply_edits(331, e331),
    'title': 'Florida Snook Season 2026: Every Region Is Open — Until December',
    'excerpt': 'Charlotte Harbor and the Southwest opened October 1, so every snook region in Florida is finally open at once. The dates, the slots, and when the window shuts.',
}, 'content+title+excerpt')
rankmath(331, {**SCHEMA_CLEAR,
    'rank_math_title': 'Florida Snook Season 2026: Open Statewide (By Region)',
    'rank_math_description': 'Charlotte Harbor and Southwest opened Oct 1, so all nine snook regions are open. FWC-verified 2026 dates, slot limits, the permit rule and the closing dates.',
    'rank_math_focus_keyword': 'florida snook season',
})

# ---------------------------------------------------------------- 313 night snook
print('\n[313] night snook -> opener flip')
e313 = [
 ("<thead><tr><th>Region</th><th>Status from Sept 1</th><th>Slot</th></tr></thead>",
  "<thead><tr><th>Region</th><th>Status</th><th>Slot</th></tr></thead>"),
 ("<tr><td>Charlotte Harbor &amp; Southwest <em>(includes all waters of Everglades National Park)</em></td><td><strong>Still closed</strong> — reopens <strong>Oct 1</strong></td><td>28–33&Prime;</td></tr>",
  "<tr><td>Charlotte Harbor &amp; Southwest <em>(includes all waters of Everglades National Park)</em></td><td><strong>Open</strong> — since <strong>Oct 1</strong></td><td>28–33&Prime;</td></tr>"),
 ("We verified all of it against <a href=\"https://myfwc.com/fishing/saltwater/recreational/snook/\" target=\"_blank\" rel=\"noopener\">FWC's snook page</a> on <strong>August 31, 2026</strong>.",
  "We verified all of it against <a href=\"https://myfwc.com/fishing/saltwater/recreational/snook/\" target=\"_blank\" rel=\"noopener\">FWC's snook page</a> on <strong>September 30, 2026</strong>."),
 ("If you are fishing Boca Grande, Pine Island Sound, Naples, Marco or the Ten Thousand Islands, you are in the Southwest region and it is still catch-and-release for another month.",
  "Charlotte Harbor and the Southwest — Boca Grande, Pine Island Sound, Naples, Marco and the Ten Thousand Islands — came in on October 1, so the whole state is now open. The Gulf regions close again on <strong>December 1</strong>, the Atlantic on <strong>December 15</strong>."),
 ("<strong>Bottom line:</strong> September 1 flips snook from look-but-don't-touch to one-in-the-box across most of the state, and the best of it happens after dark.",
  "<strong>Bottom line:</strong> snook is open for harvest in every region of Florida right now, and the best of it happens after dark."),
 ("Bring the permit, bring a tape measure, and if you're fishing Charlotte Harbor or the Southwest, keep releasing until October 1.",
  "Bring the permit and bring a tape measure — the slot is tight, and the season shuts again on December 1 (Gulf) and December 15 (Atlantic)."),
]
push(313, {
    'content': apply_edits(313, e313),
    'excerpt': "Snook harvest is open statewide this fall — and the best snook fishing of the season happens after dark. Dock lights, bridges, piers, and what you can legally keep.",
}, 'content+excerpt')
rankmath(313, {**SCHEMA_CLEAR,
    'rank_math_description': "Snook harvest is open statewide this fall. How to fish dock lights, bridges and piers after dark, plus the slot limits by coast and the one-fish bag rule.",
})

# ---------------------------------------------------------------- 829 grouper tackle
print('\n[829] grouper tackle -> de-date the gag framing')
e829 = [
 ("<p class=\"fbf-lede\">Gulf gag grouper is open for exactly thirty days, through September 30, and the fish that ruins your morning is almost never the one you couldn't find.",
  "<p class=\"fbf-lede\">Gulf gag closed on October 1, but red grouper, black grouper and amberjack are all still fair game over the same structure — and the fish that ruins your morning is almost never the one you couldn't find."),
 ("<p>Gulf gag is open <strong>September 1&ndash;30, 2026 only</strong> &mdash; 24&Prime; total length minimum, 2 per person inside the 4-grouper aggregate, and the <strong>State Reef Fish Angler designation is mandatory</strong>. It closes at 12:01 a.m. on October 1. Check any species before you keep it:</p>",
  "<p>Gulf gag ran <strong>September 1&ndash;30, 2026</strong> and closed at 12:01 a.m. on October 1 &mdash; it is catch-and-release now. <strong>Red grouper (20&Prime; TL) and black grouper (24&Prime; TL) are open year-round</strong> in Gulf state waters, 2 and 4 per person respectively inside the same 4-grouper aggregate, and the <strong>State Reef Fish Angler designation is mandatory</strong> for all of them. <em>FWC-verified September 30, 2026.</em> Check any species before you keep it:</p>"),
 ("<p>If you're outfitting for the September window and can't buy everything at once, the return per dollar is not evenly spread:</p>",
  "<p>If you're outfitting for bottom season and can't buy everything at once, the return per dollar is not evenly spread:</p>"),
 ("That covers gag in September, and it covers red grouper, mangrove snapper and amberjack the rest of the year",
  "That covered gag in September, and it covers red grouper, black grouper, mangrove snapper and amberjack the rest of the year"),
]
push(829, {'content': apply_edits(829, e829)}, 'content')
rankmath(829, {**SCHEMA_CLEAR,
    'rank_math_description': 'Gulf gag closed Oct 1. The rod, reel, line, leader and rigs that land grouper over structure year-round, plus the red and black grouper size and bag limits.',
})

# ---------------------------------------------------------------- 501 mullet run
print('\n[501] mullet run -> snook now open statewide')
e501 = [
 ("<strong>Charlotte Harbor and Southwest stay closed until October 1</strong>, so if you fish Boca Grande, Pine Island Sound, Matlacha, Fort Myers, Naples or Marco it is still catch-and-release.",
  "<strong>Charlotte Harbor and Southwest came in on October 1</strong>, so Boca Grande, Pine Island Sound, Matlacha, Fort Myers, Naples and Marco are open too — the whole state, until the Gulf closes again on December 1."),
 ("Remember that snook are catch-and-release only in Charlotte Harbor and Southwest until October 1.",
  "Snook harvest is open in every region of Florida now, through December 1 on the Gulf and December 15 on the Atlantic."),
 ("<strong>Snook harvest is open right now</strong> in the Panhandle, Big Bend, Tampa Bay, Sarasota Bay and all three Atlantic regions &mdash; it reopened September 1, almost exactly as the run hits its stride.",
  "<strong>Snook harvest is open right now</strong> in all nine management regions &mdash; the Gulf from Sarasota north and the whole Atlantic coast reopened September 1, right as the run hit its stride."),
]
push(501, {'content': apply_edits(501, e501)}, 'content')

# ---------------------------------------------------------------- 1629 jetty
print('\n[1629] jetty guide -> snook now open statewide')
e1629 = [
 ("<strong>Snook harvest reopened Tuesday, Sept 1</strong> in the Panhandle, Big Bend, Tampa Bay, Sarasota Bay and all three Atlantic regions &mdash; but <strong>Charlotte Harbor and Southwest stay closed until Oct 1</strong>. The slot is 28&ndash;33&Prime; total length on the Gulf and 28&ndash;32&Prime; on the Atlantic; one fish per person per day; a snook permit is required on top of your saltwater licence. (FWC, verified 2026-08-29.)",
  "<strong>Snook harvest is open in all nine management regions</strong> — the Gulf from Sarasota north and the whole Atlantic opened Sept 1, and <strong>Charlotte Harbor and Southwest came in on Oct 1</strong>. The slot is 28&ndash;33&Prime; total length on the Gulf and 28&ndash;32&Prime; on the Atlantic; one fish per person per day; a snook permit is required on top of your saltwater licence. The Gulf closes again Dec 1, the Atlantic Dec 15. (FWC, verified 2026-09-30.)"),
]
push(1629, {'content': apply_edits(1629, e1629)}, 'content')

# ---------------------------------------------------------------- 311 grouper species guide
print('\n[311] grouper species guide -> fix stale anchor text')
e311 = [
 ("<li><a href=\"https://floridasbestfishing.com/florida-gag-grouper-season-2026/\">Florida Gag Grouper Season 2026: Gulf Reopens Sept 1 — Dates, Limits &#038; Rules</a></li>",
  "<li><a href=\"https://floridasbestfishing.com/florida-gag-grouper-season-2026/\">Florida Gag Grouper Season 2026: Closed — What's Still Biting</a></li>"),
]
push(311, {'content': apply_edits(311, e311)}, 'content')

# ---------------------------------------------------------------- cache
print('\n[cache] flushing GoDaddy + Cloudflare')
if DRY:
    print('  [dry] POST fbf/v1/flush-cache')
else:
    try:
        print(' ', api('POST', 'fbf/v1/flush-cache', {}))
    except Exception as e:
        print('  flush failed (non-fatal):', e)

print('\nDone.' + (' (dry run — nothing written)' if DRY else ''))
