/* FBF — Florida saltwater recreational regulations dataset + season evaluator.
 *
 * SOURCE: myfwc.com species pages. Every entry carries the date it was checked.
 * Regulations change, sometimes mid-season, so the widget always shows the
 * verified date and links to the FWC page rather than presenting itself as
 * authoritative. This is a fast answer, not a legal one.
 *
 * ZONES
 *   gulf     Gulf state waters, shore to 9 nm (excludes Monroe)
 *   atlantic Atlantic state waters, shore to 3 nm
 *   keys     Monroe County / Keys, where it differs from the Atlantic rule
 *
 * SEASON SHAPES
 *   {kind:'open'}                     open year-round
 *   {kind:'closed'}                   no harvest at all (catch-and-release)
 *   {kind:'closedWindows', w:[[s,e]]} open except these MM-DD windows
 *   {kind:'openWindows',   w:[[s,e]]} closed except these MM-DD windows
 * Windows are inclusive and may wrap the year end (e.g. ['12-15','01-31']).
 */
(function (root) {
  'use strict';

  var VERIFIED = '2026-08-15';
  var FWC = 'https://myfwc.com/fishing/saltwater/recreational/';

  function mmdd(d) {
    return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  // inclusive, wrap-aware
  function inWindow(today, start, end) {
    if (start <= end) return today >= start && today <= end;
    return today >= start || today <= end;   // wraps New Year
  }

  function evaluate(season, today) {
    if (!season) return { open: null, label: 'Check FWC' };
    if (season.kind === 'open') return { open: true, label: 'Open' };
    if (season.kind === 'closed') return { open: false, label: 'No harvest' };

    var i, hit = false;
    for (i = 0; i < season.w.length; i++) {
      if (inWindow(today, season.w[i][0], season.w[i][1])) { hit = true; break; }
    }
    if (season.kind === 'closedWindows') {
      return hit ? { open: false, label: 'Closed now' } : { open: true, label: 'Open now' };
    }
    return hit ? { open: true, label: 'Open now' } : { open: false, label: 'Closed now' };
  }

  var YEAR_ROUND = { kind: 'open' };

  var SPECIES = [
    {
      key: 'mullet', name: 'Mullet (bait)', group: 'Bait', guide: '/how-to-throw-a-cast-net-florida/',
      fwc: FWC + 'mullet/',
      note: 'Legal gear includes cast net. No minimum size. More restrictive limits apply in Pinellas County, and parts of Charlotte County have seasonal night closures.',
      zones: {
        atlantic: { size: 'No minimum size', bag: '50 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round',
          regionNote: 'VESSEL limit tightens to 50 from Sept 1 \u2013 Jan 31 (it is 100 from Feb 1 \u2013 Aug 31) \u2014 that stricter window covers the whole mullet run.' },
        gulf: { size: 'No minimum size', bag: '50 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round',
          regionNote: 'VESSEL limit tightens to 50 from Sept 1 \u2013 Jan 31 (it is 100 from Feb 1 \u2013 Aug 31). Pinellas County is more restrictive still.' }
      }
    },
    {
      key: 'snook', name: 'Snook', group: 'Inshore', guide: '/how-to-catch-snook-florida/',
      fwc: FWC + 'snook/',
      note: 'Snook permit required in addition to a saltwater licence. Must stay whole until ashore; hook and line only.',
      zones: {
        atlantic: { size: '28–32" total length (slot)', bag: '1 per person per day',
          season: { kind: 'closedWindows', w: [['12-15', '01-31'], ['06-01', '08-31']] },
          seasonText: 'Closed Dec 15–Jan 31 and Jun 1–Aug 31' },
        gulf: { size: '28–33" total length (slot)', bag: '1 per person per day',
          season: { kind: 'closedWindows', w: [['12-01', '02-28'], ['05-01', '08-31']] },
          seasonText: 'Closed Dec 1–end of Feb and May 1–Aug 31 (Charlotte Harbor and Southwest run to Sep 30)',
          regionNote: 'Charlotte Harbor and Southwest regions stay closed through September 30, not August 31.' }
      }
    },
    {
      key: 'redfish', name: 'Redfish (red drum)', group: 'Inshore', guide: '/how-to-catch-redfish-florida/',
      fwc: FWC + 'red-drum/',
      note: 'Must stay whole until ashore. A 4-fish transport limit applies when travelling away from the water.',
      zones: {
        atlantic: { size: '18–27" total length (slot)', bag: '1 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round',
          regionNote: 'Indian River Lagoon is CATCH-AND-RELEASE ONLY. Northeast allows 4 per vessel; Southeast 2 per vessel.' },
        gulf: { size: '18–27" total length (slot)', bag: '1 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round',
          regionNote: 'Vessel limits vary: Panhandle and Big Bend 4 per vessel; Tampa Bay, Sarasota Bay, Charlotte Harbor and Southwest 2 per vessel.' }
      }
    },
    {
      key: 'seatrout', name: 'Spotted Seatrout', group: 'Inshore', guide: '/how-to-catch-spotted-seatrout-florida/',
      fwc: FWC + 'spotted-seatrout/',
      note: 'Managed in 9 regions. The slot is the same statewide; the bag limit is not.',
      zones: {
        atlantic: { size: '15–19" total length (slot)', bag: '3 per person per day (2 in Indian River Lagoon)',
          season: { kind: 'closedWindows', w: [['11-01', '12-31']] },
          seasonText: 'Indian River Lagoon closed Nov 1–Dec 31; other Atlantic regions open year-round',
          regionNote: 'One fish over 19" per vessel (or per person from shore). Northeast 3/day, Indian River Lagoon 2/day, Southeast 3/day.' },
        gulf: { size: '15–19" total length (slot)', bag: '3 per person per day (5 in Big Bend)',
          season: { kind: 'closedWindows', w: [['02-01', '02-28']] },
          seasonText: 'Panhandle closed all of February; other Gulf regions open year-round',
          regionNote: 'One fish over 19" per vessel (or per person from shore). Big Bend 5/day; Panhandle, Tampa Bay, Sarasota Bay, Charlotte Harbor and Southwest 3/day.' }
      }
    },
    {
      key: 'tarpon', name: 'Tarpon', group: 'Inshore', guide: '/how-to-catch-tarpon-florida/',
      fwc: FWC + 'tarpon/',
      note: 'Catch-and-release only. Tarpon over 40" MUST stay in the water unless you hold a tarpon tag and are pursuing a state or world record. Keep the gills wet.',
      zones: {
        atlantic: { size: 'No harvest', bag: 'Catch and release only', season: { kind: 'closed' }, seasonText: 'No harvest at any time' },
        gulf: { size: 'No harvest', bag: 'Catch and release only', season: { kind: 'closed' }, seasonText: 'No harvest at any time' }
      }
    },
    {
      key: 'flounder', name: 'Flounder', group: 'Inshore', guide: '/how-to-catch-flounder-florida/',
      fwc: FWC + 'flounder/',
      note: 'Covers Gulf, southern, summer and fringed flounder.',
      zones: {
        atlantic: { size: '14" total length', bag: '5 per person',
          season: { kind: 'closedWindows', w: [['10-15', '11-30']] }, seasonText: 'Closed Oct 15–Nov 30' },
        gulf: { size: '14" total length', bag: '5 per person',
          season: { kind: 'closedWindows', w: [['10-15', '11-30']] }, seasonText: 'Closed Oct 15–Nov 30' }
      }
    },
    {
      key: 'sheepshead', name: 'Sheepshead', group: 'Inshore', guide: '',
      fwc: FWC + 'sheepshead/',
      note: '',
      zones: {
        atlantic: { size: '12" total length', bag: '8 per person', season: YEAR_ROUND,
          seasonText: 'Open year-round', regionNote: 'Vessel limit of 50 per trip applies during March and April.' },
        gulf: { size: '12" total length', bag: '8 per person', season: YEAR_ROUND,
          seasonText: 'Open year-round', regionNote: 'Vessel limit of 50 per trip applies during March and April.' }
      }
    },
    {
      key: 'pompano', name: 'Florida Pompano', group: 'Surf', guide: '/how-to-catch-pompano-florida/',
      fwc: FWC + 'permit/',
      note: 'Hook and line only in state waters. No multiple hooks with natural bait; snatching prohibited.',
      zones: {
        atlantic: { size: '11" fork length', bag: '6 per person', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '11" fork length', bag: '6 per person', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'bluefish', name: 'Bluefish', group: 'Surf', guide: '/bluefish-spanish-mackerel-florida-surf/',
      fwc: FWC + 'bluefish/', verified: '2026-08-16',
      note: 'Legal gear includes hook and line, cast net, seine, gig and spear. The Atlantic bag limit was cut to 3 in 2020 after a federal assessment found the stock overfished.',
      zones: {
        atlantic: { size: '12" fork length', bag: '3 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round',
          regionNote: 'The 3-fish limit covers the Atlantic coast, Nassau through Miami-Dade. For-hire vessels are allowed 5 per person.' },
        gulf: { size: '12" fork length', bag: '10 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round' },
        keys: { size: '12" fork length', bag: '10 per person per day', season: YEAR_ROUND,
          seasonText: 'Open year-round',
          regionNote: 'Monroe County follows the Gulf rule, not the 3-fish Atlantic limit.' }
      }
    },
    {
      key: 'permit', name: 'Permit', group: 'Flats', guide: '/how-to-catch-permit-florida/',
      fwc: FWC + 'permit/',
      note: 'Hook and line only in state waters.',
      zones: {
        atlantic: { size: '11–22" fork length (slot); 1 over 22" allowed within the bag', bag: '2 per person',
          season: YEAR_ROUND, seasonText: 'Open year-round outside the Special Permit Zone',
          regionNote: 'No more than 2 fish over 22" per vessel.' },
        gulf: { size: '11–22" fork length (slot); 1 over 22" allowed within the bag', bag: '2 per person',
          season: YEAR_ROUND, seasonText: 'Open year-round outside the Special Permit Zone',
          regionNote: 'No more than 2 fish over 22" per vessel.' },
        keys: { size: '22" fork length minimum', bag: '1 per person, max 2 per vessel',
          season: { kind: 'closedWindows', w: [['04-01', '07-31']] },
          seasonText: 'Special Permit Zone closed Apr 1–Jul 31',
          regionNote: 'The Special Permit Zone covers waters south of Cape Florida and south of Cape Sable.' }
      }
    },
    {
      key: 'spanish-mackerel', name: 'Spanish Mackerel', group: 'Nearshore', guide: '/how-to-catch-spanish-mackerel-florida/',
      fwc: FWC + 'spanish-mackerel/', verified: '2026-08-16',
      note: 'Legal gear includes hook and line, cast net, beach or haul seine and spear.',
      zones: {
        atlantic: { size: '12" fork length', bag: '15 per person per day', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '12" fork length', bag: '15 per person per day', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'cobia', name: 'Cobia', group: 'Nearshore', guide: '/cobia-fishing-florida-guide/',
      fwc: FWC + 'cobia/',
      note: '',
      zones: {
        atlantic: { size: '36" fork length', bag: '1 per person or 2 per vessel, whichever is less', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '36" fork length', bag: '1 per person or 2 per vessel, whichever is less', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'hogfish', name: 'Hogfish', group: 'Reef', guide: '/how-to-catch-hogfish-florida/',
      fwc: FWC + 'hogfish/',
      note: 'The Atlantic rule covers the Keys and waters south of Cape Sable.',
      zones: {
        atlantic: { size: '16" fork length', bag: '1 per person',
          season: { kind: 'openWindows', w: [['05-01', '10-31']] }, seasonText: 'Open May 1–Oct 31' },
        keys: { size: '16" fork length', bag: '1 per person',
          season: { kind: 'openWindows', w: [['05-01', '10-31']] }, seasonText: 'Open May 1–Oct 31' },
        gulf: { size: '14" fork length', bag: '5 per person', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'mangrove-snapper', name: 'Mangrove (Gray) Snapper', group: 'Reef', guide: '/how-to-catch-mangrove-snapper-florida/',
      fwc: FWC + 'snappers/', aggregate: true,
      note: 'Counts inside the 10-snapper aggregate.',
      zones: {
        atlantic: { size: '10" total length', bag: '5 per person (within the 10-snapper aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '10" total length', bag: '5 per person (within the 10-snapper aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'yellowtail-snapper', name: 'Yellowtail Snapper', group: 'Reef', guide: '/how-to-catch-yellowtail-snapper-florida/',
      fwc: FWC + 'snappers/', aggregate: true,
      note: 'Counts inside the 10-snapper aggregate.',
      zones: {
        atlantic: { size: '12" total length', bag: 'Up to 10 per person (within the 10-snapper aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '12" total length', bag: 'Up to 10 per person (within the 10-snapper aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'mutton-snapper', name: 'Mutton Snapper', group: 'Reef', guide: '/how-to-catch-mutton-snapper-florida/',
      fwc: FWC + 'snappers/', aggregate: true,
      note: 'Counts inside the 10-snapper aggregate.',
      zones: {
        atlantic: { size: '18" total length', bag: '5 per person (within the 10-snapper aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '18" total length', bag: '5 per person (within the 10-snapper aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'lane-snapper', name: 'Lane Snapper', group: 'Reef', guide: '/florida-snapper-fishing-guide/',
      fwc: FWC + 'snappers/',
      note: 'Lane snapper sit OUTSIDE the 10-snapper aggregate.',
      zones: {
        atlantic: { size: '10" total length', bag: '20 per person (not in the aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' },
        gulf: { size: '10" total length', bag: '20 per person (not in the aggregate)', season: YEAR_ROUND, seasonText: 'Open year-round' }
      }
    },
    {
      key: 'red-snapper', name: 'Red Snapper', group: 'Reef', guide: '/florida-red-snapper-season-2026/',
      fwc: FWC + 'snappers/', aggregate: true,
      note: 'Season dates move every year and state and federal waters can differ. Check FWC before you run offshore.',
      zones: {
        atlantic: { size: '20" total length', bag: '2 per person (within the 10-snapper aggregate)',
          season: null, seasonText: 'State waters open; federal Atlantic season is set annually — verify with FWC' },
        gulf: { size: '16" total length', bag: '2 per person (within the 10-snapper aggregate)',
          season: null, seasonText: 'Gulf 2026 season: May 22–Jul 31 plus announced fall dates — verify with FWC' }
      }
    },
    {
      key: 'gag-grouper', name: 'Gag Grouper', group: 'Reef', guide: '/florida-gag-grouper-season-2026/',
      fwc: FWC + 'groupers/',
      note: 'Gulf allows 4 grouper total per person per day across species; Atlantic allows 3 grouper/tilefish.',
      zones: {
        gulf: { size: '24" total length', bag: '2 per person within the 4-grouper aggregate',
          season: { kind: 'openWindows', w: [['09-01', '09-30']] }, seasonText: 'Open Sep 1–30, 2026' },
        atlantic: { size: '24" total length', bag: '1 gag or black within the 3-grouper aggregate',
          season: { kind: 'openWindows', w: [['05-01', '08-01']] }, seasonText: 'Open May 1–Aug 1' }
      }
    },
    {
      key: 'red-grouper', name: 'Red Grouper', group: 'Reef', guide: '/how-to-catch-grouper-florida/',
      fwc: FWC + 'groupers/',
      note: 'Federal waters close Feb 1–Mar 31 seaward of 20 fathoms.',
      zones: {
        gulf: { size: '20" total length', bag: '2 per person within the 4-grouper aggregate', season: YEAR_ROUND, seasonText: 'State waters open year-round' },
        atlantic: { size: '20" total length', bag: 'Up to 3 per person within the 3-grouper aggregate',
          season: { kind: 'openWindows', w: [['05-01', '12-31']] }, seasonText: 'Open May 1–Dec 31' }
      }
    },
    {
      key: 'black-grouper', name: 'Black Grouper', group: 'Reef', guide: '/how-to-catch-grouper-florida/',
      fwc: FWC + 'groupers/',
      note: '',
      zones: {
        gulf: { size: '24" total length', bag: '4 per person within the 4-grouper aggregate', season: YEAR_ROUND, seasonText: 'State waters open year-round' },
        atlantic: { size: '24" total length', bag: '1 gag or black within the 3-grouper aggregate',
          season: { kind: 'openWindows', w: [['05-01', '12-31']] }, seasonText: 'Open May 1–Dec 31' }
      }
    },
    {
      key: 'scamp', name: 'Scamp Grouper', group: 'Reef', guide: '/how-to-catch-grouper-florida/',
      fwc: FWC + 'groupers/',
      note: '',
      zones: {
        gulf: { size: '16" total length', bag: 'Up to 4 per person within the 4-grouper aggregate', season: YEAR_ROUND, seasonText: 'State waters open year-round' },
        atlantic: { size: '20" total length', bag: 'Up to 3 per person within the 3-grouper aggregate',
          season: { kind: 'openWindows', w: [['05-01', '12-31']] }, seasonText: 'Open May 1–Dec 31' }
      }
    }
  ];

  root.FBF_REGS = {
    verified: VERIFIED,
    species: SPECIES,
    zones: { gulf: 'Gulf Coast', atlantic: 'Atlantic Coast', keys: 'Florida Keys' },
    mmdd: mmdd,
    evaluate: evaluate
  };
})(window);
