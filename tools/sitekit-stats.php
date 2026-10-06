<?php
$ns = '\\Google\\Site_Kit\\';
$ctx = new ($ns.'Context')(WP_PLUGIN_DIR.'/google-site-kit/google-site-kit.php');
$opt = new ($ns.'Core\\Storage\\Options')($ctx);
$uo  = new ($ns.'Core\\Storage\\User_Options')($ctx, 1);
$tr  = new ($ns.'Core\\Storage\\Transients')($ctx);
$auth = new ($ns.'Core\\Authentication\\Authentication')($ctx, $opt, $uo, $tr);
try { $modules = new ($ns.'Core\\Modules\\Modules')($ctx, $opt, $uo, $auth); }
catch (\Throwable $e) { echo "Modules ctor failed: ".$e->getMessage()."\n"; return; }

$end   = gmdate('Y-m-d', strtotime('-1 day'));
$start = gmdate('Y-m-d', strtotime('-28 days'));
$pend  = gmdate('Y-m-d', strtotime('-29 days'));
$pstart= gmdate('Y-m-d', strtotime('-56 days'));
echo "WINDOW: $start .. $end   (prior: $pstart .. $pend)\n\n";

function dp($modules, $slug, $datapoint, $args) {
  try {
    $m = $modules->get_module($slug);
    $r = $m->get_data($datapoint, $args);
    if (is_wp_error($r)) return ['__err'=>$r->get_error_code().': '.$r->get_error_message()];
    return $r;
  } catch (\Throwable $e) { return ['__err'=>get_class($e).': '.$e->getMessage()]; }
}

// ---------- SEARCH CONSOLE ----------
echo "=== SEARCH CONSOLE (28d) ===\n";
foreach ([[ $start,$end,'current'], [$pstart,$pend,'prior']] as [$s,$e,$lbl]) {
  $r = dp($modules,'search-console','searchanalytics',['startDate'=>$s,'endDate'=>$e,'dimensions'=>'date']);
  if (isset($r['__err'])) { echo "$lbl ERROR: {$r['__err']}\n"; continue; }
  $imp=0;$clk=0;
  foreach ((array)$r as $row) {
    $imp += is_object($row)? (int)$row->getImpressions() : (int)($row['impressions']??0);
    $clk += is_object($row)? (int)$row->getClicks()      : (int)($row['clicks']??0);
  }
  printf("%-8s impressions=%-7d clicks=%-5d CTR=%.2f%%\n", $lbl, $imp, $clk, $imp? $clk*100/$imp : 0);
}

echo "\n--- TOP QUERIES (28d, by clicks) ---\n";
$q = dp($modules,'search-console','searchanalytics',['startDate'=>$start,'endDate'=>$end,'dimensions'=>'query','limit'=>15]);
if (isset($q['__err'])) echo "ERROR: {$q['__err']}\n";
else foreach ((array)$q as $row) {
  $k = is_object($row)? $row->getKeys()[0] : ($row['keys'][0]??'?');
  $c = is_object($row)? $row->getClicks() : ($row['clicks']??0);
  $i = is_object($row)? $row->getImpressions() : ($row['impressions']??0);
  $p = is_object($row)? $row->getPosition() : ($row['position']??0);
  printf("  %-44s clicks=%-4d imp=%-6d pos=%.1f\n", substr($k,0,44), $c, $i, $p);
}

// ---------- GA4 ----------
echo "\n=== GA4 (28d) ===\n";
$g = dp($modules,'analytics-4','report',[
  'startDate'=>$start,'endDate'=>$end,
  'compareStartDate'=>$pstart,'compareEndDate'=>$pend,
  'metrics'=>[['name'=>'sessions'],['name'=>'totalUsers'],['name'=>'screenPageViews'],['name'=>'engagementRate']],
]);
if (isset($g['__err'])) echo "ERROR: {$g['__err']}\n";
else {
  $hdr = []; foreach (($g->getMetricHeaders() ?? []) as $h) $hdr[] = $h->getName();
  $tot = $g->getTotals() ?? [];
  foreach ($tot as $idx => $t) {
    $lbl = $idx === 0 ? 'current' : 'prior  ';
    $out = [];
    foreach ($t->getMetricValues() as $i => $mv) $out[] = ($hdr[$i] ?? "m$i").'='.$mv->getValue();
    echo "  $lbl  ".implode('  ', $out)."\n";
  }
}

echo "\n--- TOP PAGES (28d by pageviews) ---\n";
$p = dp($modules,'analytics-4','report',[
  'startDate'=>$start,'endDate'=>$end,
  'metrics'=>[['name'=>'screenPageViews']],
  'dimensions'=>[['name'=>'pagePath']],
  'orderby'=>[['metric'=>['metricName'=>'screenPageViews'],'desc'=>true]],
  'limit'=>15,
]);
if (isset($p['__err'])) echo "ERROR: {$p['__err']}\n";
else foreach (($p->getRows() ?? []) as $row) {
  printf("  %-52s %s\n", substr($row->getDimensionValues()[0]->getValue(),0,52), $row->getMetricValues()[0]->getValue());
}
