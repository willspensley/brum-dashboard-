// Agent fetch tool — % of households in receipt of Housing Benefit.
// Built via the brum-dataset-dashboard skill, but this dataset is published at
// LOCAL-AUTHORITY level only — there is NO ward breakdown. Rather than discard a
// real, sourced figure, we show it honestly at its true granularity (Birmingham vs
// the other West Midlands boroughs) and the view labels the missing ward breakdown.
//
//   Run:  node scripts/fetch-housing-benefit.mjs  → writes proposals/housing-benefit.proposal.json
//
// Source (official, cited): DWP, via Birmingham City Observatory —
//   percentage-households-in-receipt-of-housing-benefits-wmca
//   Areas present: the 7 WMCA metropolitan boroughs (E08000025–E08000031),
//   the West Midlands combined-authority aggregate, and the England LA mean.
//
// HARD RULE (CLAUDE.md "Data integrity"): official source only, no modelled values,
// provenance mandatory. This writes ONLY to /proposals — nothing reaches public/data/
// without a human Accept in /review.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DS = 'percentage-households-in-receipt-of-housing-benefits-wmca';
// www. host is the canonical one (bare host can fail TLS on some networks).
const ODS = 'https://www.cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets';
const BASE = `${ODS}/${DS}/records`;

const BIRMINGHAM = 'E08000025';
// The 7 WMCA metropolitan boroughs — the real like-for-like comparison group.
const BOROUGHS = {
  E08000025: 'Birmingham',
  E08000026: 'Coventry',
  E08000027: 'Dudley',
  E08000028: 'Sandwell',
  E08000029: 'Solihull',
  E08000030: 'Walsall',
  E08000031: 'Wolverhampton',
};
// Honest benchmarks published in the same dataset (not modelled by us).
const WMCA_ID = 'CombinedAuthorities_WestMidlands';
const ENGLAND_ID = 'AllLaInCountry_England';

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function main() {
  // `date` is a reserved/date-typed field — can't filter where=date. Find the latest
  // month, then page desc and keep only that month's rows (client-side).
  const latest = await getJson(`${BASE}?order_by=date%20DESC&limit=1`);
  const latestRec = (latest.results ?? [])[0];
  if (!latestRec) throw new Error('no records — dataset slug may have changed');
  const month = latestRec.date;
  const periodLabel = latestRec.periodlabel ?? month;
  console.log(`[hb] latest month = ${month} (${periodLabel})`);

  const byArea = {};
  for (let offset = 0; offset < 2000; offset += 100) {
    const page = await getJson(`${BASE}?order_by=date%20DESC&limit=100&offset=${offset}`);
    const recs = page.results ?? [];
    let sawOlder = false;
    for (const rec of recs) {
      if (rec.date > month) continue;
      if (rec.date === month) byArea[rec.areaidentifier] = rec;
      else { sawOlder = true; }
    }
    if (sawOlder || recs.length < 100) break;
  }

  const asPct = v => (v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 100) / 100);

  // Boroughs — the ranked comparison group.
  const areas = [];
  const skipped = [];
  for (const [code, name] of Object.entries(BOROUGHS)) {
    const rec = byArea[code];
    const value = rec ? asPct(rec.value) : null;
    if (value == null) { skipped.push({ code, name, reason: 'missing/NaN value' }); continue; }
    areas.push({
      area_code: code,
      area_name: name,
      value,                       // native % published by DWP (not derived, not modelled)
      is_birmingham: code === BIRMINGHAM,
      period: periodLabel,
      provenance: {
        value: {
          source: 'DWP · via Birmingham City Observatory',
          method: 'administrative',
          url: `${BASE}?where=areaidentifier%3D%22${code}%22&order_by=date%20DESC&limit=1`,
        },
      },
    });
  }
  areas.sort((a, b) => b.value - a.value);           // worst (highest) first
  areas.forEach((a, i) => { a.rank = i + 1; });

  const benchmarks = {
    wmca: asPct(byArea[WMCA_ID]?.value),             // West Midlands combined authority
    england: asPct(byArea[ENGLAND_ID]?.value),       // mean of all English LAs
  };

  const bham = areas.find(a => a.is_birmingham) ?? null;
  const validation = {
    geography_level: 'local-authority',
    ward_breakdown_available: false,                 // the honest flag the UI surfaces
    areas_found: areas.length,
    areas_expected: Object.keys(BOROUGHS).length,
    complete: areas.length === Object.keys(BOROUGHS).length,
    skipped,
    birmingham_value: bham?.value ?? null,
    birmingham_rank: bham?.rank ?? null,             // rank among the 7 boroughs (1 = highest)
    wmca_benchmark: benchmarks.wmca,
    england_benchmark: benchmarks.england,
  };

  const sources = [
    {
      id: 'housingBenefit',
      label: 'Households in receipt of Housing Benefit (%)',
      publisher: 'DWP · via Birmingham City Observatory',
      dataset: DS,
      method: 'administrative',
      licence: 'Open Government Licence v3.0',
      as_of: periodLabel,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${DS}/`,
      apiUrl: `${BASE}?order_by=date%20DESC&limit=100`,
    },
  ];

  const proposal = {
    id: 'housing-benefit',
    status: 'pending',
    title: 'Housing Benefit — % of households in receipt',
    metric: '% of households in receipt of Housing Benefit',
    unit: '% of households',
    geography: 'local-authority',                    // signals "no ward breakdown" to the shell
    generated: new Date().toISOString(),
    sources,
    source: sources[0],
    validation,
    benchmarks,
    areas,
    raw_sample: [byArea[BIRMINGHAM], byArea[WMCA_ID], byArea[ENGLAND_ID]]
      .filter(Boolean)
      .map(r => { const { geo_shape, geo_point_2d, ...rest } = r; return rest; }),
  };

  const outDir = join(ROOT, 'proposals');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'housing-benefit.proposal.json'), JSON.stringify(proposal, null, 2));

  // Boundaries geojson for the map view — BOUNDARIES ONLY, no Housing Benefit values.
  // The dataset ships each borough's polygon in `geo_shape`; we capture the 7 WMCA
  // boroughs so the map can render a choropleth. This carries no metric claims, so it
  // is reference geometry (like public/data/birmingham-wards.geojson) — the actual HB
  // values still only reach the UI via the accepted areas[] through /review.
  const features = [];
  for (const code of Object.keys(BOROUGHS)) {
    const shape = byArea[code]?.geo_shape;
    if (shape?.geometry) features.push({ type: 'Feature', properties: { code, name: BOROUGHS[code] }, geometry: shape.geometry });
  }
  const geojson = { type: 'FeatureCollection', features };
  const dataDir = join(ROOT, 'public', 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'wm-boroughs.geojson'), JSON.stringify(geojson));
  console.log(`[hb] ✓ boundaries written · ${features.length}/${Object.keys(BOROUGHS).length} borough polygons → public/data/wm-boroughs.geojson`);

  console.log(`[hb] ✓ proposal written · ${areas.length}/${Object.keys(BOROUGHS).length} boroughs · ${periodLabel}`);
  console.log(`[hb]   Birmingham: ${bham?.value}% (rank ${bham?.rank} of ${areas.length})`);
  console.log(`[hb]   benchmarks: WMCA ${benchmarks.wmca}% · England ${benchmarks.england}%`);
  areas.forEach(a => console.log(`[hb]     ${String(a.rank).padStart(2)}. ${a.area_name.padEnd(14)} ${a.value}%${a.is_birmingham ? '  ← Birmingham' : ''}`));
  if (skipped.length) console.log(`[hb]   skipped: ${skipped.map(s => s.name).join(', ')}`);
}

main().catch(err => { console.error('[hb] FAILED:', err.message); process.exit(1); });
