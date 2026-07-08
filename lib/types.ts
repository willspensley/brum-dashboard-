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

// Real ward-level crime, official 69 wards (data.police.uk → public/data/crime-wards.json)
export interface CrimeWard {
  ward_code: string;
  ward_name: string;
  population: number;
  crime_rate_per_1000: number;
  crime_rank: number;
  crime_categories: Record<string, number>;
}

// Universal Credit — % of residents on UC per ward. Shared shape used identically
// by the Review preview (from a proposal) and the live Dashboards view (from the
// published public/data/uc-wards.json) — so the same component renders in both.
export interface UcWard {
  ward_code: string;
  ward_name: string;
  uc_claimants: number;
  population: number | null;
  pct_on_uc: number | null;
}
export interface UcSource {
  label: string; publisher: string; dataset: string; licence: string;
  as_of: string; catalogueUrl: string; apiUrl: string;
}
export interface BenefitsData {
  as_of: string;
  city_pct: number | null;
  total_claimants: number;
  total_population: number;
  sources: UcSource[];
  wards: UcWard[];
}

// % of UC claimants in employment. The % is a share OF claimants, so we carry the
// claimant count (denominator), a derived in-work headcount, and population for parity.
export interface UcEmpWard {
  ward_code: string;
  ward_name: string;
  pct_in_employment: number;
  uc_claimants: number | null;
  in_work_count: number | null;   // derived: claimants × % ÷ 100
  population: number | null;
}
export interface UcEmpData {
  as_of: string;
  ward_mean_pct: number | null;
  sources: UcSource[];
  wards: UcEmpWard[];
}

// Claimant Count — unemployment-related benefits (UC "searching for work" + JSA) per ward.
// The % is DWP's NATIVE "claimants as a proportion of residents aged 16-64" (not derived).
// Counts are DWP-rounded to the nearest 5. trend[] aligns to ClaimantData.months.
export interface ClaimantWard {
  ward_code: string;
  ward_name: string;
  pct_16_64: number;             // native DWP proportion, Total
  count: number;                 // latest-month claimant count, Total
  male_count: number | null;
  female_count: number | null;
  male_pct: number | null;
  female_pct: number | null;
  age_16_24: number | null;      // latest-month counts by age band
  age_25_49: number | null;
  age_50_plus: number | null;
  trend: (number | null)[];      // monthly counts, aligned to ClaimantData.months
}
export interface ClaimantData {
  as_of: string;
  months: string[];              // 'YYYY-MM' labels for the trend series
  ward_mean_pct: number | null;
  total_claimants: number;
  sources: UcSource[];
  wards: ClaimantWard[];
}

// Housing Benefit — % of households in receipt. Published at LOCAL-AUTHORITY level
// only (no ward breakdown), so this shape is a comparison of the 7 West Midlands
// boroughs plus honest benchmarks — NOT 69 wards. The view labels the missing
// ward granularity explicitly. Same component renders in /review and Dashboards.
export interface HbArea {
  area_code: string;
  area_name: string;
  value: number;          // native % published by DWP (not derived, not modelled)
  is_birmingham: boolean;
  rank: number;           // 1 = highest % among the boroughs
}
export interface HousingBenefitData {
  as_of: string;
  metric: string;
  geography: string;                          // 'local-authority' — drives the "no ward data" banner
  areas: HbArea[];
  benchmarks: { wmca: number | null; england: number | null };
  birmingham_value: number | null;
  birmingham_rank: number | null;
  sources: UcSource[];
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
  skills_decile: number;   // derived from % no quals: 1 = least, 10 = most skills-deprived
  edu_rank: number;
}

export interface EduDataMeta {
  wards: number;
  vintage: string;
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
