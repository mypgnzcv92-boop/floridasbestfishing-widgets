# Reading REAL GA4 + Search Console numbers headlessly

`tools/sitekit-stats.php` runs on the FBF server via wp-cli and prints live
GA4 + Search Console figures. **No browser, no logged-in session, no William action.**

## Run it

    HOST=1095099.us31.ssh.myftpupload.com   # SSH hostname, changed 2026-10-05
    B64=$(base64 < tools/sitekit-stats.php | tr -d '\n')
    ./fbfssh.sh "cd ~/html && echo $B64 | base64 -d > /tmp/s.php && wp eval-file /tmp/s.php; rm -f /tmp/s.php"

(`fbfssh.sh` = command-mode expect wrapper; password auth, key auth does NOT work.)

## Why it bypasses the REST API

Site Kit's REST routes (`/google-site-kit/v1/modules/*/data/*`) return
`403 missing_required_scopes` from BOTH App-Password Basic auth AND `wp eval-file`
— even with `wp --user=1`. The scopes are genuinely granted (8 of 8); the plugin
binds its `User_Options` at `plugins_loaded`, before wp-cli applies `--user`, so the
REST handler evaluates user 0.

**The fix:** construct Site Kit's objects yourself with an explicit user id and call
the module's `get_data()` directly, skipping REST entirely:

    $ctx  = new \Google\Site_Kit\Context(WP_PLUGIN_DIR.'/google-site-kit/google-site-kit.php');
    $uo   = new \Google\Site_Kit\Core\Storage\User_Options($ctx, 1);   // <-- explicit user
    $auth = new \Google\Site_Kit\Core\Authentication\Authentication($ctx, $opt, $uo, $tr);
    $modules = new \Google\Site_Kit\Core\Modules\Modules($ctx, $opt, $uo, $auth);
    $modules->get_module('search-console')->get_data('searchanalytics', [...]);
    $modules->get_module('analytics-4')->get_data('report', [...]);

GA4 returns typed objects (`getTotals()`, `getMetricHeaders()`, `getRows()`), not arrays.

## Do NOT conclude "not authenticated"

`core/user/data/authentication` reporting `authenticated:false, grantedScopes:[]` is an
artifact of non-cookie auth. The real check is
`$auth->is_authenticated()` + `$oc->has_sufficient_scopes()` under an explicit User_Options
— both `true`. Never send William to re-authorize Google off the REST reading.

---

## ⚠️ TRAP: fragment sitelink rows inflate every per-page metric

A `dimensions=page` GSC query returns **Google fragment sitelink URLs as separate "pages"** —
e.g. `/florida-mullet-run-2026/#best-baits-for-the-run`. These come from the article template's
auto-TOC anchors. Google awards them when it rates the content well structured, so they are a
**good sign, not a duplicate-content bug — do not "fix" them.**

But they wreck naive analysis:
- They carry impressions with ~0 clicks (clicks land on the canonical URL).
- Summing per-page impressions then **exceeds** the real site total
  (measured 2026-10-05: 30,490 summed vs 14,306 actual; 16,105 of that was fragments across 14 rows).
- `/florida-mullet-run-2026/` alone returned **7 rows** — 1 canonical + 6 fragments.

**Always drop rows where `parse_url($u, PHP_URL_FRAGMENT) !== null` before aggregating.**
`tools/ctr-gap-audit.php` does this and prints the excluded count so the filter stays visible.
Cross-check: canonical-only impressions must ≈ the `dimensions=date` total.

Printing only `parse_url($u, PHP_URL_PATH)` hides the fragment and makes these look like
duplicate rows of the same page. Print the full URL when anything looks duplicated.
