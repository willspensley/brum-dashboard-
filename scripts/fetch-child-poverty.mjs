// Agent fetch tool — % of children (0-15) in ABSOLUTE low-income families, per ward,
// full annual series (2015/16 → latest). DWP/HMRC administrative data via City
// Observatory. Native ward %, no derivation — the honest ward-level map of where
// child-poverty money need concentrates (the same geography the two-child limit hit).
//
// Also pulls the LA-level companion dataset for REAL benchmarks: Birmingham LA series
// + the England mean series (same shape as the housing-benefit dataset). If those
// rows are absent the benchmarks are omitted — never synthesised.
//
//   Run:  node scripts/fetch-child-poverty.mjs  → writes proposals/child-poverty.proposal.json
// Writes ONLY to /proposals — publishing requires a human Accept in /review.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS = 'https://www.cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets';
const WARD_DS = 'percentage-of-children-in-absolute-low-income-families-aged-0-15-birmingham-wards';
const LA_DS = 'percentage-of-children-in-absolute-low-income-families-aged-0-15-wmca';

const BHAM_MIN = 11118, BHAM_MAX = 11186;
const isBirmingham = code =>
  typeof code === 'string' && /^E05(\d{6})$/.test(code) &&
  Number(code.slice(3)) >= BHAM_MAX * 0 + 11118 && Number(code.slice(3)) <= BHAM_MAX;

async function exportJson(ds) {
  const url = `${ODS}/${ds}/exports/json`;
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}
const num = v => (v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 10) / 10);

async function main() {
  // ── Ward series ─────────────────────────────────────────────────────────────
  const recs = await exportJson(WARD_DS);
  console.log(`[cp] ward dataset: ${recs.length} records`);

  // periodlabel e.g. "2024/25"; date e.g. "2025-01-01". Sort years by date.
  const yearByDate = {};
  for (const r of recs) if (r.date && r.periodlabel) yearByDate[r.date.slice(0, 4)] = r.periodlabel;
  const dates = Object.keys(yearByDate).sort();
  const years = dates.map(d => yearByDate[d]);
  console.log(`[cp] years: ${years[0]} → ${years.at(-1)} (${years.length})`);

  const byWard = {};
  for (const r of recs) {
    const code = r.areaidentifier;
    if (!isBirmingham(code)) continue;
    const w = (byWard[code] ??= { name: r.arealabel, series: {} });
    w.series[r.date?.slice(0, 4)] = num(r.value);
  }

  const wards = [];
  const skipped = [];
  for (const [code, w] of Object.entries(byWard)) {
    const series = dates.map(d => w.series[d] ?? null);
    const latest = series.at(-1);
    if (latest == null) { skipped.push({ code, name: w.name, reason: 'no latest-year value' }); continue; }
    const first = series.find(v => v != null) ?? null;
    wards.push({
      ward_code: code, ward_name: w.name,
      latest_pct: latest,
      first_pct: first,
      delta_pp: first != null ? Math.round((latest - first) * 10) / 10 : null,   // DERIVED: pp change over the series
      series,
      provenance: {
        pct: { source: 'DWP/HMRC · Children in low income families · City Observatory', method: 'administrative — native %' },
        delta: { method: 'derived — latest − first year, percentage points' },
      },
    });
  }
  wards.sort((a, b) => b.latest_pct - a.latest_pct);

  // ── Real benchmarks: Birmingham LA + England mean (companion LA dataset) ────
  let citySeries = null, englandSeries = null;
  try {
    const laRecs = await exportJson(LA_DS);
    const pick = id => {
      const m = {};
      for (const r of laRecs) if (r.areaidentifier === id) m[r.date?.slice(0, 4)] = num(r.value);
      const s = dates.map(d => m[d] ?? null);
      return s.some(v => v != null) ? s : null;
    };
    citySeries = pick('E08000025');
    englandSeries = pick('AllLaInCountry_England');
    console.log(`[cp] benchmarks: Birmingham LA ${citySeries ? '✓' : '—'} · England mean ${englandSeries ? '✓' : '—'}`);
  } catch (e) {
    console.warn(`[cp] ⚠ benchmark dataset unavailable (${e.message}) — omitting (never synthesised)`);
  }

  const latestYear = years.at(-1);
  const cityLatest = citySeries?.at(-1) ?? null;
  const englandLatest = englandSeries?.at(-1) ?? null;
  const hi = wards[0], lo = wards.at(-1);

  const sources = [
    { id: 'childPoverty', label: 'Children in absolute low income families (0-15), %', publisher: 'DWP/HMRC · via Birmingham City Observatory',
      dataset: WARD_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: latestYear,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${WARD_DS}/`,
      apiUrl: `${ODS}/${WARD_DS}/exports/json` },
    ...(citySeries || englandSeries ? [{
      id: 'childPovertyLA', label: 'LA/England benchmark series', publisher: 'DWP/HMRC · via Birmingham City Observatory',
      dataset: LA_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: latestYear,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${LA_DS}/`,
      apiUrl: `${ODS}/${LA_DS}/exports/json` }] : []),
  ];

  const proposal = {
    id: 'child-poverty', status: 'pending',
    title: 'Children in low-income families by ward',
    metric: '% of children aged 0-15 in absolute low-income families',
    unit: '% of children',
    generated: new Date().toISOString(),
    years,
    city: {
      city_series: citySeries, england_series: englandSeries,
      city_latest: cityLatest, england_latest: englandLatest,
    },
    sources, source: sources[0],
    validation: {
      wards_found: wards.length, wards_expected: 69, complete: wards.length === 69, skipped,
      years_span: years.length, series_from: years[0], series_to: latestYear,
      highest: hi ? { ward: hi.ward_name, pct: hi.latest_pct } : null,
      lowest: lo ? { ward: lo.ward_name, pct: lo.latest_pct } : null,
      city_latest: cityLatest, england_latest: englandLatest,
    },
    raw_sample: recs.filter(r => isBirmingham(r.areaidentifier)).slice(0, 3)
      .map(r => { const { geom, centroid, geo_shape, geo_point_2d, ...rest } = r; return rest; }),
    wards,
  };

  mkdirSync(join(ROOT, 'proposals'), { recursive: true });
  writeFileSync(join(ROOT, 'proposals', 'child-poverty.proposal.json'), JSON.stringify(proposal, null, 2));
  console.log(`[cp] ✓ proposal written · ${wards.length}/69 wards · ${years.length} years · ${latestYear}`);
  if (hi && lo) {
    console.log(`[cp]   highest: ${hi.ward_name} ${hi.latest_pct}% (Δ ${hi.delta_pp > 0 ? '+' : ''}${hi.delta_pp}pp since ${years[0]})`);
    console.log(`[cp]   lowest:  ${lo.ward_name} ${lo.latest_pct}%`);
    console.log(`[cp]   benchmarks: Birmingham ${cityLatest ?? '—'}% · England ${englandLatest ?? '—'}%`);
  }
}

main().catch(err => { console.error('[cp] FAILED:', err.message); process.exit(1); });
