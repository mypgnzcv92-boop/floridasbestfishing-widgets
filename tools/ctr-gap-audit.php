<?php
$ns='\\Google\\Site_Kit\\';
$ctx=new ($ns.'Context')(WP_PLUGIN_DIR.'/google-site-kit/google-site-kit.php');
$opt=new ($ns.'Core\\Storage\\Options')($ctx);
$uo=new ($ns.'Core\\Storage\\User_Options')($ctx,1);
$tr=new ($ns.'Core\\Storage\\Transients')($ctx);
$auth=new ($ns.'Core\\Authentication\\Authentication')($ctx,$opt,$uo,$tr);
$mods=new ($ns.'Core\\Modules\\Modules')($ctx,$opt,$uo,$auth);
$sc=$mods->get_module('search-console');
$end=gmdate('Y-m-d',strtotime('-1 day')); $start=gmdate('Y-m-d',strtotime('-28 days'));

function exp_ctr($p){
  $t=[1=>.280,2=>.155,3=>.110,4=>.080,5=>.063,6=>.050,7=>.041,8=>.033,9=>.028,10=>.025];
  $p=max(1.0,$p);
  if($p>=20) return .004;
  if($p>=10) return .025-(($p-10)/10)*.016;
  $lo=(int)floor($p);$hi=min(10,$lo+1);$f=$p-$lo;
  return ($t[$lo]??.004)*(1-$f)+($t[$hi]??.004)*$f;
}

$rows=$sc->get_data('searchanalytics',['startDate'=>$start,'endDate'=>$end,'dimensions'=>'page','limit'=>500]);
$canon=[]; $frag_imp=0; $frag_n=0;
foreach((array)$rows as $r){
  $u=$r->getKeys()[0];
  if(parse_url($u,PHP_URL_FRAGMENT)!==null){ $frag_imp+=(int)$r->getImpressions(); $frag_n++; continue; }
  $canon[]=['u'=>$u,'imp'=>(int)$r->getImpressions(),'clk'=>(int)$r->getClicks(),'pos'=>(float)$r->getPosition()];
}
$ci=0;$cc=0; foreach($canon as $c){$ci+=$c['imp'];$cc+=$c['clk'];}
echo "CANONICAL pages: ".count($canon)."   impressions=$ci   clicks=$cc   CTR=".round($cc*100/max(1,$ci),2)."%\n";
echo "FRAGMENT sitelink rows excluded: $frag_n  (carrying $frag_imp impressions)\n";
echo "[cross-check] site total via date dimension should be ~\$ci\n\n";

$out=[];
foreach($canon as $c){
  if($c['imp']<100) continue;
  if($c['pos']>20) continue;              // title can't fix page-3 rankings
  $e=exp_ctr($c['pos']);
  $out[]=$c+['e'=>$e,'lost'=>$e*$c['imp']-$c['clk']];
}
usort($out, fn($a,$b)=>$b['lost']<=>$a['lost']);
printf("%-46s %6s %5s %7s %5s %7s %6s\n",'PAGE (canonical, pos<=20, imp>=100)','IMP','CLK','CTR','POS','EXP','LOST');
echo str_repeat('-',88)."\n";
$tl=0;
foreach($out as $o){
  printf("%-46s %6d %5d %6.2f%% %5.1f %6.2f%% %+6.0f\n",
    substr(parse_url($o['u'],PHP_URL_PATH),0,46),$o['imp'],$o['clk'],$o['clk']*100/$o['imp'],$o['pos'],$o['e']*100,$o['lost']);
  $tl+=max(0,$o['lost']);
}
echo "\nREALISTIC recoverable clicks / 28d: ~".round($tl)." (vs 230 today)\n";
