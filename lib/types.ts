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
}

export interface DataSources {
  nomis: 'live' | 'cached';
  imd: 'live' | 'cached';
  gva: 'live' | 'cached';
  crime: 'live' | 'cached';
}

export interface DataMeta {
  nomis: { count: number | null; date: string | null; err: string | null };
  imd: { lsoas: number | null; wards: number | null; err: string | null };
  gva: { count: number | null; err: string | null };
  crime: { count: number | null; err: string | null };
}

export interface WardExtras {
  youth_unemp: number;
  uc_pct: number;
  no_quals: number;
  vacancies: number;
}
