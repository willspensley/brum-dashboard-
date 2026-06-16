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
  gva: { count: number | null; year?: number; err: string | null };
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

export interface FiscalBenefits {
  universalCredit: number;
  statePension: number;
  disability: number;
  childBenefit: number;
  pensionCredit: number;
  carers: number;
  councilTaxSupportOther: number;
}

export interface FiscalWard {
  ward_code: string;
  ward_name: string;
  population: number;
  age: { children: number; working: number; pension: number };
  benefits: FiscalBenefits;
  benefitPerHead: number;
  revenuePerHead: number;
  servicePerHead: number;
  net: number;
  driver: string;
  provenance: { benefits: string; revenue: string; population: string };
}

export interface HousingWard {
  ward_code: string;
  ward_name: string;
  // Affordability — all modelled
  median_house_price_k: number;    // £k
  price_to_income: number;          // ratio
  private_rent_pcm: number;         // £/month
  rent_income_pct: number;          // % of annual earnings spent on rent
  // Tenure mix — modelled from Census 2021 profile
  owner_occupation_pct: number;
  social_rented_pct: number;
  private_rented_pct: number;
  // Conditions
  overcrowding_pct: number;         // % households overcrowded
  // Composite
  housing_pressure_score: number;   // 0-1
  housing_pressure_decile: number;  // 1-10
  housing_pressure_rank: number;    // 1 = most pressure
  // Context from base Ward
  char: string;
  earnings: number;
  claimant_rate: number;
  imd_employment_score: number;
}
