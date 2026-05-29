export interface Ward {
  ward_code: string;
  ward_name: string;
  imd_employment_score: number;
  claimant_rate: number;
  inactivity_sick_pct: number;
  trend_12m: number[];
  trend_months: string[];
  gva_band: [number, number];
  char: string;
  // computed by normalise()
  imd_norm: number;
  cc_norm: number;
  ia_norm: number;
  composite: number;
  composite_decile: number;
  // computed by fetchGVA / synthGva
  gva: number;
  population: number;
  earnings: number;
  quadrant: 'prosperous' | 'workhorse' | 'commuter' | 'disadvantage';
  // crime fields (live or modelled)
  crime_rate_per_1000: number;
  crime_rank: number;
  crime_yoy_pct: number;
  crime_trend_12m: number[];
  crime_categories: Record<string, number>;
  // NEET risk (modelled composite index)
  youth_claimant_rate: number;
  neet_risk_score: number;
  neet_risk_decile: number;
}

export interface DataSources {
  nomis: 'live' | 'cached';
  imd: 'live' | 'cached';
  gva: 'live' | 'cached';
  crime: 'live' | 'cached';
  neet: 'live' | 'cached';
}

export interface DataMeta {
  nomis: { count: number | null; date: string | null; err: string | null };
  imd: { lsoas: number | null; wards: number | null; err: string | null };
  gva: { count: number | null; err: string | null };
  crime: { count: number | null; err: string | null };
  neet: { count: number | null; bham_neet_pct: number | null; bham_year: string; err: string | null };
}

export interface NeetCityData {
  bham_neet_pct: number | null;
  bham_year: string;
  wmca_neet_pct: number | null;
  source: 'live' | 'cached';
}

export interface WardExtras {
  youth_unemp: number;
  uc_pct: number;
  no_quals: number;
  vacancies: number;
}

export interface EducationWard {
  ward_code: string;
  ward_name: string;
  qual_none: number;
  qual_level1: number;
  qual_level2: number;
  qual_apprenticeship: number;
  qual_level3: number;
  qual_level4plus: number;
  qual_other: number;
  imd_edu_decile: number;
  imd_edu_score: number;
  edu_rank: number;
}

export type EduDataSource = 'live' | 'cached';

export interface EduDataMeta {
  quals: { wards: number | null; err: string | null; source: EduDataSource };
  imd: { wards: number | null; err: string | null; source: EduDataSource };
}
