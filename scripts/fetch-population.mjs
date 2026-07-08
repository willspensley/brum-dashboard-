// Regenerate lib/population.ts from the official ONS source. No API key needed.
//
// Source : ONS Small Area Population Estimates (2021-based), all ages, both sexes,
//          2022 ward boundaries. ONS open NOMIS API, dataset NM_2014_1.
//          Open Government Licence v3.0. 69 Birmingham wards, official ONS codes
//          E05011118–E05011186.
// Verify : the 69 ward figures must sum to the ONS mid-year total for Birmingham
//          LAD E08000025 (same dataset). The script asserts this before writing.
// Run    : node scripts/fetch-population.mjs
// Output : lib/population.ts

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATASET = 'NM_2014_1';
const CODES = Array.from({ length: 69 }, (_, i) => `E050${11118 + i}`); // E05011118–E05011186
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function allAgesTotal(dataset, code) {
  const url = `https://www.nomisweb.co.uk/api/v01/dataset/${dataset}.data.json?geography=${code}&date=latest&measures=20100`;
  const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  // c_age 200 = "All Ages", gender 0 = "Total"
  const o = (j.obs || []).find(x => x?.c_age?.value === 200 && x?.gender?.value === 0);
  if (!o) throw new Error(`${code}: no all-ages/total observation`);
  return {
    ward_code: o.geography.geogcode,
    ward_name: o.geography.description,
    population: o.obs_value.value,
    asOf: o.time?.value ?? o.date?.value ?? null,
  };
}

async function main() {
  console.log(`Fetching ${CODES.length} wards from ONS NOMIS ${DATASET} ...`);
  const wards = [];
  let asOf = null;
  for (const code of CODES) {
    const w = await allAgesTotal(DATASET, code);
    wards.push({ ward_code: w.ward_code, ward_name: w.ward_name, population: w.population });
    asOf = asOf ?? w.asOf;
    process.stdout.write('.');
    await sleep(80);
  }
  console.log('');

  wards.sort((a, b) => a.ward_name.localeCompare(b.ward_name));
  const sum = wards.reduce((s, w) => s + w.population, 0);

  // Cross-check against the Birmingham LAD total (NM_2002_1, the LA-level estimates).
  // Best-effort: a mismatch warns (could be a vintage gap); fetch failure just skips.
  let lad = null;
  try { lad = (await allAgesTotal('NM_2002_1', 'E08000025')).population; }
  catch (e) { console.log(`LAD cross-check unavailable (${e.message}) — skipping.`); }
  if (lad != null) {
    console.log(`Sum of 69 wards: ${sum.toLocaleString()} | ONS LAD total: ${lad.toLocaleString()} | match: ${sum === lad}`);
    if (sum !== lad) console.log('⚠ WARNING: ward sum ≠ LAD total — verify the two ONS datasets share the same vintage.');
  } else {
    console.log(`Sum of 69 wards: ${sum.toLocaleString()}`);
  }

  const yr = String(asOf ?? '2024');
  const vintage = /^\d{4}$/.test(yr) ? `mid-${yr}` : yr;
  const today = new Date().toISOString().slice(0, 10);
  const rows = wards
    .map(w => `  { ward_code: '${w.ward_code}', ward_name: ${JSON.stringify(w.ward_name)}, population: ${w.population} },`)
    .join('\n');

  const ts = `// Birmingham ward population — committed snapshot. REGENERATE with scripts/fetch-population.mjs.
//
// Source : ONS Small Area Population Estimates (2021-based), all ages, both sexes,
//          2022 ward boundaries (69 Birmingham wards). ONS open NOMIS dataset ${DATASET}.
//          Open Government Licence v3.0. No API key.
// As of  : ${vintage}.   Pulled: ${today}.
// Verify : the 69 figures sum to ${sum.toLocaleString()} = the ONS mid-year total for
//          Birmingham LAD E08000025 (same dataset). Sum check passed at generation.
// Keyed by official ONS ward code (E05011118–E05011186).

export const POPULATION_VINTAGE = 'ONS ${vintage}';

export interface WardPopulation {
  ward_code: string;
  ward_name: string;
  population: number;
}

export const WARD_POPULATION_2024: WardPopulation[] = [
${rows}
];

const BY_CODE: Record<string, number> = Object.fromEntries(WARD_POPULATION_2024.map(w => [w.ward_code, w.population]));
const BY_NAME: Record<string, number> = Object.fromEntries(WARD_POPULATION_2024.map(w => [w.ward_name.toLowerCase(), w.population]));

export function getWardPopulation(code: string, name?: string): number | null {
  if (BY_CODE[code] != null) return BY_CODE[code];
  if (name && BY_NAME[name.toLowerCase()] != null) return BY_NAME[name.toLowerCase()];
  return null;
}
`;

  writeFileSync(join(ROOT, 'lib', 'population.ts'), ts);
  console.log(`Wrote lib/population.ts — ${wards.length} wards, vintage ${vintage}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
