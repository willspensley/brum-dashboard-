// Agent fetch tool — the COMBINED Universal Credit picture per ward:
//   total on UC · in work · NOT in work · % of residents on UC · % of claimants in work.
// Replaces the need to flip between the "Benefits (UC)" and "UC in Work" tabs.
//
// Sources (all official, same month, all cited):
//   • UC claimant count — DWP via City Observatory: number-of-people-on-universal-credit-wmca-wards-2025
//   • % of claimants in employment — DWP via City Observatory: percentage-universal-credit-claimants-in-employment-birmingham-wards
//   • ward population — ONS mid-2024 (NOMIS NM_2014_1), committed in lib/population.ts
// Derived (transparent, labelled): in_work = claimants × % ÷ 100 ; not_in_work = claimants − in_work.
//
//   Run:  node scripts/fetch-uc-combined.mjs  → writes proposals/uc-combined.proposal.json
// Writes ONLY to /proposals — publishing requires a human Accept in /review.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS = 'https://www.cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets';
const UC_DS = 'number-of-people-on-universal-credit-wmca-wards-2025';
const EMP_DS = 'percentage-universal-credit-claimants-in-employment-birmingham-wards';
const UC_BASE = `${ODS}/${UC_DS}/records`;
const EMP_BASE = `${ODS}/${EMP_DS}/records`;

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
async function fetchMonth(base, month) {
  const map = {}; let done = false;
  for (let offset = 0; offset < 4000 && !done; offset += 100) {
    const page = await getJson(`${base}?order_by=date%20DESC&limit=100&offset=${offset}`);
    const recs = page.results ?? [];
    for (const rec of recs) {
      if (rec.date > month) continue;
      if (rec.date === month) { if (isBirmingham(rec.areaidentifier)) map[rec.areaidentifier] = rec; }
      else { done = true; break; }
    }
    if (recs.length < 100) break;
  }
  return map;
}

async function main() {
  const POP = loadPopulation();

  // The two datasets publish on different lags — join on the latest month BOTH have.
  const [ucLatest, empLatest] = await Promise.all([
    getJson(`${UC_BASE}?order_by=date%20DESC&limit=1`),
    getJson(`${EMP_BASE}?order_by=date%20DESC&limit=1`),
  ]);
  const ucMonth = (ucLatest.results ?? [])[0]?.date;
  const empMonth = (empLatest.results ?? [])[0]?.date;
  if (!ucMonth || !empMonth) throw new Error('no records — a dataset slug may have changed');
  const month = ucMonth < empMonth ? ucMonth : empMonth;   // older of the two latests
  const latestRec = (ucMonth < empMonth ? ucLatest : empLatest).results[0];
  const periodLabel = latestRec?.periodlabel ?? month;
  console.log(`[ucc] common month = ${month} (${periodLabel}) · UC latest ${ucMonth}, in-work latest ${empMonth}`);

  const ucRows = await fetchMonth(UC_BASE, month);
  const empRows = await fetchMonth(EMP_BASE, month);
  console.log(`[ucc] UC counts: ${Object.keys(ucRows).length} wards · in-work %: ${Object.keys(empRows).length} wards`);

  const wards = [];
  const skipped = [];
  for (const [code, rec] of Object.entries(ucRows)) {
    const claimants = rec.value != null ? Math.round(Number(rec.value)) : null;
    if (claimants == null || Number.isNaN(claimants)) { skipped.push({ code, name: rec.arealabel, reason: 'missing UC count' }); continue; }
    const population = POP[code] ?? null;
    const empPct = empRows[code]?.value != null ? Math.round(Number(empRows[code].value) * 10) / 10 : null;
    const inWork = empPct != null ? Math.round(claimants * empPct / 100) : null;   // DERIVED
    const notInWork = inWork != null ? claimants - inWork : null;                  // DERIVED
    wards.push({
      ward_code: code, ward_name: rec.arealabel,
      uc_claimants: claimants,
      population,
      pct_on_uc: population ? Math.round((claimants / population) * 1000) / 10 : null,  // DERIVED: % of ALL residents
      pct_in_employment: empPct,                                                        // native DWP %
      in_work_count: inWork,
      not_in_work_count: notInWork,
      period: periodLabel,
      provenance: {
        claimants: { source: 'DWP · City Observatory', method: 'administrative',
          url: `${UC_BASE}?where=areaidentifier%3D%22${code}%22&order_by=date%20DESC&limit=1` },
        pct_in_employment: { source: 'DWP · City Observatory', method: 'administrative — native %' },
        population: { source: 'ONS mid-2024 (NOMIS NM_2014_1)', method: 'official estimate' },
        in_work: { method: 'derived — claimants × % ÷ 100' },
        not_in_work: { method: 'derived — claimants − in-work' },
        pct_on_uc: { method: 'derived — claimants ÷ residents × 100' },
      },
    });
  }
  wards.sort((a, b) => (b.pct_on_uc ?? 0) - (a.pct_on_uc ?? 0));

  const total = wards.reduce((s, w) => s + w.uc_claimants, 0);
  const totalInWork = wards.reduce((s, w) => s + (w.in_work_count ?? 0), 0);
  const totalNotInWork = total - totalInWork;
  const totalPop = wards.reduce((s, w) => s + (w.population ?? 0), 0);

  const sources = [
    { id: 'universalCredit', label: 'UC claimant count', publisher: 'DWP · via Birmingham City Observatory',
      dataset: UC_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: periodLabel,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${UC_DS}/`, apiUrl: `${UC_BASE}?order_by=date%20DESC&limit=100` },
    { id: 'ucEmployment', label: 'UC claimants in employment (%)', publisher: 'DWP · via Birmingham City Observatory',
      dataset: EMP_DS, method: 'administrative', licence: 'Open Government Licence v3.0', as_of: periodLabel,
      catalogueUrl: `https://www.cityobservatory.birmingham.gov.uk/explore/dataset/${EMP_DS}/`, apiUrl: `${EMP_BASE}?order_by=date%20DESC&limit=100` },
    { id: 'population', label: 'Ward population (denominator)', publisher: 'Office for National Statistics',
      dataset: 'NOMIS NM_2014_1 (SAPE)', method: 'official estimate', licence: 'Open Government Licence v3.0', as_of: 'Mid-2024',
      catalogueUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala', apiUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala' },
  ];

  const proposal = {
    id: 'uc-combined', status: 'pending',
    title: 'Universal Credit — the full picture by ward',
    metric: 'UC claimants: total / in work / not in work per ward',
    unit: 'people',
    generated: new Date().toISOString(),
    sources, source: sources[0],
    city: { total, in_work: totalInWork, not_in_work: totalNotInWork,
            pct_pop: totalPop ? Math.round((total / totalPop) * 1000) / 10 : null,
            pct_not_in_work: total ? Math.round((totalNotInWork / total) * 1000) / 10 : null },
    validation: {
      wards_found: wards.length, wards_expected: 69, complete: wards.length === 69, skipped,
      total_claimants: total, total_in_work: totalInWork, total_not_in_work: totalNotInWork,
    },
    raw_sample: Object.values(ucRows).slice(0, 3).map(r => { const { geo_shape, geo_point_2d, ...rest } = r; return rest; }),
    wards,
  };

  mkdirSync(join(ROOT, 'proposals'), { recursive: true });
  writeFileSync(join(ROOT, 'proposals', 'uc-combined.proposal.json'), JSON.stringify(proposal, null, 2));
  console.log(`[ucc] ✓ proposal written · ${wards.length}/69 wards · ${total.toLocaleString()} on UC · ${totalInWork.toLocaleString()} in work · ${totalNotInWork.toLocaleString()} NOT in work (${proposal.city.pct_not_in_work}%)`);
}

main().catch(err => { console.error('[ucc] FAILED:', err.message); process.exit(1); });
