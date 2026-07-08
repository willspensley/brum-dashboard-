// Agent fetch tool — % of Universal Credit claimants who are in employment, per ward.
// Built via the brum-dataset-dashboard skill. The "in-work poverty" lens.
//
// The headline value is a native % (% of claimants in work). To make it meaningful we
// also show the DENOMINATOR it is a share of — the UC claimant count for the SAME month
// (joined from the UC dataset) — plus ward population for parity with the UC dashboard,
// and a DERIVED in-work headcount (claimants × % ÷ 100, labelled derived).
//
//   Run:  node scripts/fetch-uc-employment.mjs   → writes proposals/uc-employment.proposal.json
//
// Sources (all official, all cited):
//   • in-employment %  — DWP, City Observatory: percentage-universal-credit-claimants-in-employment-birmingham-wards
//   • claimant count   — DWP, City Observatory: number-of-people-on-universal-credit-wmca-wards-2025 (same month)
//   • population       — ONS mid-2024 (NOMIS NM_2014_1), committed in lib/population.ts

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS = 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets';
const EMP_DS = 'percentage-universal-credit-claimants-in-employment-birmingham-wards';
const UC_DS = 'number-of-people-on-universal-credit-wmca-wards-2025';
const EMP_BASE = `${ODS}/${EMP_DS}/records`;
const UC_BASE = `${ODS}/${UC_DS}/records`;

const BHAM_MIN = 11118, BHAM_MAX = 11186;
const isBirmingham = code =>
  typeof code === 'string' && /^E05(\d{6})$/.test(code) &&
  Number(code.slice(3)) >= BHAM_MIN && Number(code.slice(3)) <= BHAM_MAX;

function loadPopulation() {
  const src = readFileSync(join(ROOT, 'lib', 'population.ts'), 'utf8');
  const map = {}; const re = /ward_code:\s*'(E05\d{6})'[^}]*?population:\s*(\d+)/g; let m;
  while ((m = re.exec(src)) !== null) map[m[1]] = Number(m[2]);
  return map;
}
async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}
// Collect all Birmingham records for a given month from a monthly ODS dataset.
async function fetchMonth(base, month) {
  const map = {}; let done = false;
  for (let offset = 0; offset < 4000 && !done; offset += 100) {
    const page = await getJson(`${base}?order_by=date%20DESC&limit=100&offset=${offset}`);
    const recs = page.results ?? [];
    for (const rec of recs) {
      if (rec.date > month) continue;          // newer month → skip
      if (rec.date === month) { if (isBirmingham(rec.areaidentifier)) map[rec.areaidentifier] = rec; }
      else { done = true; break; }              // older month → stop (sorted desc)
    }
    if (recs.length < 100) break;
  }
  return map;
}

async function main() {
  const POP = loadPopulation();
  console.log(`[uc-emp] loaded population for ${Object.keys(POP).length} wards`);

  const latest = await getJson(`${EMP_BASE}?order_by=date%20DESC&limit=1`);
  const latestRec = (latest.results ?? [])[0];
  if (!latestRec) throw new Error('no records — dataset slug may have changed');
  const month = latestRec.date;
  const periodLabel = latestRec.periodlabel ?? month;
  console.log(`[uc-emp] latest month = ${month} (${periodLabel})`);

  const empRows = await fetchMonth(EMP_BASE, month);
  console.log(`[uc-emp] in-employment %: ${Object.keys(empRows).length} Birmingham wards`);
  const ucRows = await fetchMonth(UC_BASE, month);       // claimant count for the SAME month
  console.log(`[uc-emp] claimant count (same month): ${Object.keys(ucRows).length} Birmingham wards`);

  const wards = [];
  const skipped = [];
  for (const [code, rec] of Object.entries(empRows)) {
    const name = rec.arealabel, value = rec.value;
    if (value == null || Number.isNaN(Number(value))) { skipped.push({ code, name, reason: 'missing/NaN %' }); continue; }
    const pct = Math.round(Number(value) * 10) / 10;
    const claimants = ucRows[code]?.value != null ? Math.round(Number(ucRows[code].value)) : null;
    const population = POP[code] ?? null;
    const in_work = claimants != null ? Math.round(claimants * pct / 100) : null;  // DERIVED headcount
    wards.push({
      ward_code: code, ward_name: name,
      pct_in_employment: pct,
      uc_claimants: claimants,       // the denominator the % is a share OF
      in_work_count: in_work,        // DERIVED: claimants × % ÷ 100
      population,                     // ONS mid-2024, for parity/context
      period: periodLabel,
      provenance: {
        pct: { source: 'DWP · City Observatory', method: 'administrative',
               url: `${EMP_BASE}?where=areaidentifier%3D%22${code}%22&order_by=date%20DESC&limit=1` },
        claimants: { source: 'DWP · City Observatory (UC count)', method: 'administrative' },
        population: { source: 'ONS mid-2024 (NOMIS NM_2014_1)', method: 'official estimate' },
        in_work: { method: 'derived — claimants × % ÷ 100' },
      },
    });
  }
  wards.sort((a, b) => b.pct_in_employment - a.pct_in_employment);

  const wardMean = wards.length ? Math.round((wards.reduce((s, w) => s + w.pct_in_employment, 0) / wards.length) * 10) / 10 : null;
  const totalClaimants = wards.reduce((s, w) => s + (w.uc_claimants ?? 0), 0);
  const totalInWork = wards.reduce((s, w) => s + (w.in_work_count ?? 0), 0);

  // Every rendered link points at the human CATALOGUE page (a normal website), not the API.
  const sources = [
    { id: 'ucEmployment', label: 'UC claimants in employment (%)', publisher: 'DWP · via Birmingham City Observatory',
      dataset: EMP_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: periodLabel,
      catalogueUrl: `https://cityobservatory.birmingham.gov.uk/explore/dataset/${EMP_DS}/`,
      apiUrl: `${EMP_BASE}?order_by=date%20DESC&limit=100` },
    { id: 'universalCredit', label: 'UC claimant count (denominator)', publisher: 'DWP · via Birmingham City Observatory',
      dataset: UC_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: periodLabel,
      catalogueUrl: `https://cityobservatory.birmingham.gov.uk/explore/dataset/${UC_DS}/`,
      apiUrl: `${UC_BASE}?order_by=date%20DESC&limit=100` },
    { id: 'population', label: 'Ward population (context)', publisher: 'Office for National Statistics',
      dataset: 'NOMIS NM_2014_1 (SAPE)', method: 'official estimate', licence: 'Open Government Licence v3.0', as_of: 'Mid-2024',
      catalogueUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala',
      apiUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala' },
  ];

  const proposal = {
    id: 'uc-employment', status: 'pending',
    title: 'UC claimants in employment by ward',
    metric: '% of UC claimants in employment',
    unit: '% of claimants',
    generated: new Date().toISOString(),
    sources, source: sources[0],
    validation: {
      wards_found: wards.length, wards_expected: 69, complete: wards.length === 69,
      skipped, ward_mean_pct: wardMean, total_claimants: totalClaimants, total_in_work: totalInWork,
    },
    raw_sample: Object.values(empRows).slice(0, 3).map(r => {
      const { geo_shape, geo_point_2d, ...rest } = r;
      return { ...rest, _note: 'geo_shape (ward boundary) present in API, omitted here for readability' };
    }),
    wards,
  };

  const outDir = join(ROOT, 'proposals');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'uc-employment.proposal.json'), JSON.stringify(proposal, null, 2));

  console.log(`[uc-emp] ✓ proposal written · ${wards.length}/69 wards · ward mean ${wardMean}% · ${totalInWork.toLocaleString()} of ${totalClaimants.toLocaleString()} claimants in work · ${periodLabel}`);
  if (wards.length) {
    const hi = wards[0], lo = wards[wards.length - 1];
    console.log(`[uc-emp]   highest: ${hi.ward_name} ${hi.pct_in_employment}% (${hi.in_work_count} of ${hi.uc_claimants})`);
    console.log(`[uc-emp]   lowest:  ${lo.ward_name} ${lo.pct_in_employment}% (${lo.in_work_count} of ${lo.uc_claimants})`);
  }
}

main().catch(err => { console.error('[uc-emp] FAILED:', err.message); process.exit(1); });
