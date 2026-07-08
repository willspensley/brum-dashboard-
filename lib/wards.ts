// Canonical Birmingham ward roster — the official 69 wards.
//
// Single source of truth: derived from lib/population.ts (ONS mid-2024 SAPE,
// verified against the published LAD total for E08000025). Official ONS ward
// codes E05011118–E05011186.
//
// USE THIS for the ward list / codes everywhere. Do NOT use the legacy 68-ward
// set embedded in lib/data.ts (FALLBACK) — it uses a different, incorrect code
// series (E05011082–E05011150) and partly non-current names, so real data keyed
// by official codes will not join to it.

import { WARD_POPULATION_2024 } from './population';

export interface WardRef {
  ward_code: string;
  ward_name: string;
  population: number;
}

export const WARDS: WardRef[] = [...WARD_POPULATION_2024]
  .map(w => ({ ward_code: w.ward_code, ward_name: w.ward_name, population: w.population }))
  .sort((a, b) => a.ward_name.localeCompare(b.ward_name));

export const WARD_CODES: string[] = WARDS.map(w => w.ward_code);
export const WARD_NAME_BY_CODE: Record<string, string> =
  Object.fromEntries(WARDS.map(w => [w.ward_code, w.ward_name]));
export const WARD_COUNT = WARDS.length; // 69
