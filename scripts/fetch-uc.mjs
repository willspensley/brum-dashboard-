// Agent fetch tool — Universal Credit claimants per Birmingham ward.
//
// The "researcher" step of the agent loop. It:
//   1. finds the latest month in the dataset,
//   2. pages the City Observatory API for that month,
//   3. filters the WMCA-wide records down to Birmingham's 69 official wards,
//   4. JOINS ONS ward population (mid-2024) and derives a rate per 1,000 residents,
//   5. validates every value (real number + official ward code + period),
//   6. writes a PROPOSAL to proposals/ — it NEVER writes to public/data/.
//
// Only a human ACCEPT in the /review UI promotes this to the published dataset.
//   Run:  node scripts/fetch-uc.mjs
//
// Sources (both official, both cited in the proposal):
//   • UC counts   — DWP, via Birmingham City Observatory (ODS v2.1). No key.
//                   dataset: number-of-people-on-universal-credit-wmca-wards-2025
//   • Population  — ONS mid-2024 SAPE (NOMIS NM_2014_1), committed in lib/population.ts.
// The rate is a DERIVED value: claimants ÷ residents × 1000, computed transparently
// from the two official inputs and labelled as derived (CLAUDE.md allows this).

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DATASET = 'number-of-people-on-universal-credit-wmca-wards-2025';
const BASE =
  `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/${DATASET}/records`;
const BHAM_LAD = 'E08000025';

// A clean, WORKING "live API" link — filter on local_authority_code (a text field,
// so equality works, unlike `date` which is a date type). Returns Birmingham only.
const LIVE_API_URL = `${BASE}?where=local_authority_code%3D%22${BHAM_LAD}%22&order_by=date%20DESC&limit=100`;

// Birmingham's 69 official wards are the contiguous ONS block E05011118–E05011186.
const BHAM_MIN = 11118, BHAM_MAX = 11186;
const isBirmingham = code =>
  typeof code === 'string' && /^E05(\d{6})$/.test(code) &&
  Number(code.slice(3)) >= BHAM_MIN && Number(code.slice(3)) <= BHAM_MAX;

// Load ONS population (mid-2024) from the committed snapshot lib/population.ts.
function loadPopulation() {
  const src = readFileSync(join(ROOT, 'lib', 'population.ts'), 'utf8');
  const map = {};
  const re = /ward_code:\s*'(E05\d{6})'[^}]*?population:\s*(\d+)/g;
  let m;
  while ((m = re.exec(src)) !== null) map[m[1]] = Number(m[2]);
  return map;
}

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function main() {
  const POP = loadPopulation();
  console.log(`[uc] loaded population for ${Object.keys(POP).length} wards`);

  console.log('[uc] finding latest month…');
  const latest = await getJson(`${BASE}?order_by=date%20DESC&limit=1`);
  const latestRec = (latest.results ?? [])[0];
  if (!latestRec) throw new Error('no records — dataset slug may have changed');
  const month = latestRec.date;
  const periodLabel = latestRec.periodlabel ?? month;
  console.log(`[uc] latest month = ${month} (${periodLabel})`);

  // Page newest-first, keep the latest month (client-side; `date` can't be filtered).
  const rows = [];
  let done = false;
  for (let offset = 0; offset < 3000 && !done; offset += 100) {
    const page = await getJson(`${BASE}?order_by=date%20DESC&limit=100&offset=${offset}`);
    const recs = page.results ?? [];
    for (const rec of recs) {
      if (rec.date === month) rows.push(rec);
      else { done = true; break; }
    }
    if (recs.length < 100) break;
  }
  console.log(`[uc] fetched ${rows.length} WMCA ward records for ${month}`);

  const wards = [];
  const skipped = [];
  for (const rec of rows) {
    const code = rec.areaidentifier, name = rec.arealabel, value = rec.value;
    if (!isBirmingham(code)) continue;
    if (value == null || Number.isNaN(Number(value))) {
      skipped.push({ code, name, reason: 'missing/NaN value' });
      continue;
    }
    const claimants = Math.round(Number(value));
    const population = POP[code] ?? null;
    // DERIVED: % of residents on Universal Credit = claimants ÷ residents × 100.
    const pct = population ? Math.round((claimants / population) * 100 * 10) / 10 : null;
    if (population == null) skipped.push({ code, name, reason: 'no population match — % omitted' });
    wards.push({
      ward_code: code,
      ward_name: name,
      uc_claimants: claimants,
      population,                     // ONS mid-2024
      pct_on_uc: pct,                // DERIVED: % of residents on UC
      period: periodLabel,
      provenance: {
        count: { source: 'DWP · via Birmingham City Observatory', method: 'administrative',
                 url: `${BASE}?where=areaidentifier%3D%22${code}%22&order_by=date%20DESC&limit=1` },
        population: { source: 'ONS mid-2024 SAPE (NOMIS NM_2014_1)', method: 'official estimate' },
        pct: { method: 'derived — claimants ÷ residents × 100' },
      },
    });
  }
  // Rank by the honest metric — % of residents on UC — not raw count.
  wards.sort((a, b) => (b.pct_on_uc ?? -1) - (a.pct_on_uc ?? -1));

  const total = wards.reduce((s, w) => s + w.uc_claimants, 0);
  const totalPop = wards.reduce((s, w) => s + (w.population ?? 0), 0);
  const cityPct = totalPop ? Math.round((total / totalPop) * 100 * 10) / 10 : null;

  const proposal = {
    id: 'uc-wards',
    status: 'pending',
    title: 'Universal Credit claimants by ward',
    metric: 'People on Universal Credit',
    unit: 'claimants',
    generated: new Date().toISOString(),
    sources: [
      { id: 'universalCredit', label: 'Universal Credit claimants',
        publisher: 'DWP · via Birmingham City Observatory', dataset: DATASET,
        method: 'administrative (hard count, not modelled)', licence: 'Open Government Licence v3.0',
        as_of: periodLabel,
        catalogueUrl: `https://cityobservatory.birmingham.gov.uk/explore/dataset/${DATASET}/`,
        apiUrl: LIVE_API_URL },
      { id: 'population', label: 'Ward population (denominator for the rate)',
        publisher: 'Office for National Statistics', dataset: 'NOMIS NM_2014_1 (SAPE)',
        method: 'official estimate', licence: 'Open Government Licence v3.0', as_of: 'Mid-2024',
        catalogueUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala',
        apiUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala' },
    ],
    // Back-compat: keep a primary `source` too so the current UI still reads it.
    source: {
      label: 'Universal Credit claimants', publisher: 'DWP · via Birmingham City Observatory',
      dataset: DATASET, method: 'administrative (hard count, not modelled)',
      licence: 'Open Government Licence v3.0', as_of: periodLabel,
      catalogueUrl: `https://cityobservatory.birmingham.gov.uk/explore/dataset/${DATASET}/`,
      apiUrl: LIVE_API_URL,
    },
    validation: {
      wards_found: wards.length, wards_expected: 69, complete: wards.length === 69,
      skipped, total_claimants: total, total_population: totalPop, city_pct: cityPct,
    },
    // Raw sample for the "view raw" panel — real records, minus the huge boundary
    // geometry (kept out for readability; boundaries ARE available and power the map).
    raw_sample: rows.filter(r => isBirmingham(r.areaidentifier)).slice(0, 3).map(r => {
      const { geo_shape, geo_point_2d, ...rest } = r;
      return { ...rest, _note: 'geo_shape (ward boundary polygon) present in API, omitted here for readability' };
    }),
    wards,
  };

  const outDir = join(ROOT, 'proposals');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'uc-wards.proposal.json');
  writeFileSync(outPath, JSON.stringify(proposal, null, 2));

  console.log(`[uc] ✓ proposal written: ${outPath}`);
  console.log(`[uc]   ${wards.length}/69 wards · ${total.toLocaleString()} claimants · city ${cityPct}% on UC · as-of ${periodLabel}`);
  if (wards.length) {
    const hi = wards[0], lo = wards[wards.length - 1];
    console.log(`[uc]   highest: ${hi.ward_name} ${hi.pct_on_uc}% (${hi.uc_claimants.toLocaleString()} of ${hi.population?.toLocaleString()})`);
    console.log(`[uc]   lowest:  ${lo.ward_name} ${lo.pct_on_uc}% (${lo.uc_claimants.toLocaleString()} of ${lo.population?.toLocaleString()})`);
  }
}

main().catch(err => { console.error('[uc] FAILED:', err.message); process.exit(1); });
