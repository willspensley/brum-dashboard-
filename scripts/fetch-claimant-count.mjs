// Agent fetch tool — Claimant Count by ward (unemployment-related benefits: UC
// "searching for work" conditionality + JSA). Built via the brum-dataset-dashboard skill.
//
// Combines TWO official ward-level datasets (both DWP via City Observatory, both on the
// official 69 wards E05011118–E05011186):
//   • claimant-count-by-sex-birmingham-wards-latest — latest month; carries BOTH the raw
//     count AND a NATIVE "claimants as a proportion of residents aged 16-64" % (no
//     derivation needed), each split Total / Male / Female.
//   • claimant-count-birmingham-wards-5years — monthly series (May 2021 → latest) of
//     counts by sex and age band (16-24 / 25-49 / 50+ / "All categories: Age 16+"),
//     giving the 5-year trend and the age split.
//
// NOTE: DWP rounds claimant counts to the nearest 5 — surfaced as a footnote in the UI.
// These datasets use the NOMIS-style schema (geography_code / gender_name / obs_value),
// not the ODS areaidentifier/value shape.
//
//   Run:  node scripts/fetch-claimant-count.mjs  → writes proposals/claimant-count.proposal.json
//
// HARD RULE (CLAUDE.md "Data integrity"): writes ONLY to /proposals — nothing reaches
// public/data/ without a human Accept in /review.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS = 'https://www.cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets';
const LATEST_DS = 'claimant-count-by-sex-birmingham-wards-latest';
const FIVEYR_DS = 'claimant-count-birmingham-wards-5years';

const MEASURE_COUNT = 'Claimant count';
const MEASURE_PCT = 'Claimants as a proportion of residents aged 16-64';
const AGE_ALL = 'All categories: Age 16+';
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BHAM_MIN = 11118, BHAM_MAX = 11186;
const isBirmingham = code =>
  typeof code === 'string' && /^E05(\d{6})$/.test(code) &&
  Number(code.slice(3)) >= BHAM_MIN && Number(code.slice(3)) <= BHAM_MAX;

const ym = d => (typeof d === 'string' ? d.slice(0, 7) : '');          // '2026-04-01T…' → '2026-04'
const labelOf = m => `${MONTH_NAMES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const num = v => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

// exports/json streams ALL matching records in one request — no 100-row paging.
async function exportJson(ds, where) {
  const url = `${ODS}/${ds}/exports/json${where ? `?where=${encodeURIComponent(where)}` : ''}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function main() {
  // ── 1. Latest month: counts + native % by sex ────────────────────────────────
  const latestRecs = await exportJson(LATEST_DS);
  console.log(`[cc] latest dataset: ${latestRecs.length} records`);
  const latestMonth = latestRecs.map(r => ym(r.date)).sort().at(-1);
  const periodLabel = labelOf(latestMonth);
  console.log(`[cc] latest month = ${latestMonth} (${periodLabel})`);

  // byWard[code] = { count:{Total,Male,Female}, pct:{Total,Male,Female}, name }
  const byWard = {};
  for (const r of latestRecs) {
    if (ym(r.date) !== latestMonth) continue;
    const code = r.geography_code;
    if (!isBirmingham(code)) continue;
    const w = (byWard[code] ??= { name: r.geography_name, count: {}, pct: {} });
    const v = num(r.obs_value);
    if (r.measure_name === MEASURE_COUNT) w.count[r.gender_name] = v;
    else if (r.measure_name === MEASURE_PCT) w.pct[r.gender_name] = v;
  }
  console.log(`[cc] wards with latest-month data: ${Object.keys(byWard).length}`);

  // ── 2. Five-year series: Total-gender counts by age band ────────────────────
  const fiveRecs = await exportJson(FIVEYR_DS, `gender_name="Total"`);
  console.log(`[cc] 5-year dataset (Total gender): ${fiveRecs.length} records`);

  const monthSet = new Set();
  // trendByWard[code][month] = count (All ages) ; ageByWard[code][age_name] = latest-month count
  const trendByWard = {};
  const ageByWard = {};
  let fiveLatest = '';
  for (const r of fiveRecs) {
    const m = ym(r.date);
    if (m > fiveLatest) fiveLatest = m;
  }
  for (const r of fiveRecs) {
    const code = r.geography_code;
    if (!isBirmingham(code)) continue;
    const m = ym(r.date);
    const v = num(r.obs_value);
    if (r.age_name === AGE_ALL) {
      monthSet.add(m);
      (trendByWard[code] ??= {})[m] = v;
    } else if (m === fiveLatest) {
      (ageByWard[code] ??= {})[r.age_name] = v;
    }
  }
  const months = [...monthSet].sort();
  console.log(`[cc] series: ${months.length} months (${months[0]} → ${months.at(-1)})`);
  if (fiveLatest !== latestMonth) {
    console.warn(`[cc] ⚠ month mismatch: latest dataset ${latestMonth} vs 5-year ${fiveLatest} — using each dataset's own latest`);
  }

  // ── 3. Assemble + validate ───────────────────────────────────────────────────
  const wards = [];
  const skipped = [];
  for (const [code, w] of Object.entries(byWard)) {
    const pct = w.pct.Total;
    const count = w.count.Total;
    if (pct == null || count == null) { skipped.push({ code, name: w.name, reason: 'missing Total count/%' }); continue; }
    const trend = months.map(m => trendByWard[code]?.[m] ?? null);
    const ages = ageByWard[code] ?? {};
    // Cross-check: the two datasets' latest Total counts should agree (same DWP series).
    const trendLast = trend.at(-1);
    if (trendLast != null && fiveLatest === latestMonth && trendLast !== count) {
      console.warn(`[cc] ⚠ ${w.name}: latest count ${count} ≠ 5-year series ${trendLast}`);
    }
    wards.push({
      ward_code: code,
      ward_name: w.name,
      pct_16_64: Math.round(pct * 10) / 10,          // native DWP proportion (not derived)
      count: Math.round(count),                       // DWP-rounded to nearest 5
      male_count: w.count.Male != null ? Math.round(w.count.Male) : null,
      female_count: w.count.Female != null ? Math.round(w.count.Female) : null,
      male_pct: w.pct.Male != null ? Math.round(w.pct.Male * 10) / 10 : null,
      female_pct: w.pct.Female != null ? Math.round(w.pct.Female * 10) / 10 : null,
      age_16_24: num(ages['Aged 16-24']),
      age_25_49: num(ages['Aged 25-49']),
      age_50_plus: num(ages['Aged 50+']),
      trend,
      period: periodLabel,
      provenance: {
        pct: { source: 'DWP claimant count · City Observatory', method: 'administrative — native proportion of residents 16-64' },
        count: { source: 'DWP claimant count · City Observatory', method: 'administrative — rounded to nearest 5 by DWP' },
        trend: { source: 'DWP claimant count (5-year series) · City Observatory', method: 'administrative' },
      },
    });
  }
  wards.sort((a, b) => b.pct_16_64 - a.pct_16_64);

  const wardMean = wards.length ? Math.round((wards.reduce((s, w) => s + w.pct_16_64, 0) / wards.length) * 10) / 10 : null;
  const totalClaimants = wards.reduce((s, w) => s + w.count, 0);

  const sources = [
    { id: 'claimantCount', label: 'Claimant count by sex (latest month)', publisher: 'DWP · via Birmingham City Observatory',
      dataset: LATEST_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: periodLabel,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${LATEST_DS}/`,
      apiUrl: `${ODS}/${LATEST_DS}/records?limit=100` },
    { id: 'claimantCount5y', label: 'Claimant count by sex & age (5-year series)', publisher: 'DWP · via Birmingham City Observatory',
      dataset: FIVEYR_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: `${labelOf(months[0])} – ${labelOf(months.at(-1))}`,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${FIVEYR_DS}/`,
      apiUrl: `${ODS}/${FIVEYR_DS}/records?limit=100` },
  ];

  const proposal = {
    id: 'claimant-count',
    status: 'pending',
    title: 'Claimant count by ward',
    metric: '% of residents aged 16-64 claiming unemployment-related benefits',
    unit: '% of 16-64 residents',
    generated: new Date().toISOString(),
    months,
    sources,
    source: sources[0],
    validation: {
      wards_found: wards.length, wards_expected: 69, complete: wards.length === 69,
      skipped, ward_mean_pct: wardMean, total_claimants: totalClaimants,
      months_span: months.length, series_from: months[0], series_to: months.at(-1),
    },
    raw_sample: latestRecs.filter(r => ym(r.date) === latestMonth && isBirmingham(r.geography_code)).slice(0, 4)
      .map(r => { const { geom, centroid, ...rest } = r; return rest; }),
    wards,
  };

  const outDir = join(ROOT, 'proposals');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'claimant-count.proposal.json'), JSON.stringify(proposal, null, 2));

  console.log(`[cc] ✓ proposal written · ${wards.length}/69 wards · ward mean ${wardMean}% · ${totalClaimants.toLocaleString()} claimants · ${periodLabel}`);
  if (wards.length) {
    const hi = wards[0], lo = wards.at(-1);
    console.log(`[cc]   highest: ${hi.ward_name} ${hi.pct_16_64}% (${hi.count.toLocaleString()})`);
    console.log(`[cc]   lowest:  ${lo.ward_name} ${lo.pct_16_64}% (${lo.count.toLocaleString()})`);
  }
  if (skipped.length) console.log(`[cc]   skipped: ${skipped.map(s => s.name).join(', ')}`);
}

main().catch(err => { console.error('[cc] FAILED:', err.message); process.exit(1); });
