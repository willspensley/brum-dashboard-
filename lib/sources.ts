// Provenance registry — the single source of truth for where every dataset comes from.
// Surfaced inline via <SourceTag/> and in full on the /sources page. Edit provenance HERE
// only; the UI reads from this so the tooltip and the Sources page never drift.
//
// HARD RULE (CLAUDE.md "Data integrity"): a metric may render only if it has a real entry
// here — a named official source, an as-of date, and a committed fetch script. No source → no UI.

export interface SourceMeta {
  id: string;
  label: string;       // what the metric is, e.g. "Ward population"
  short: string;       // compact inline tag, e.g. "ONS · mid-2024"
  source: string;      // official dataset name
  publisher: string;
  datasetId: string;   // e.g. "ONS NOMIS NM_2014_1"
  asOf: string;        // as-of period
  licence: string;
  sourceUrl: string;   // link to the official dataset (verified 200)
  scriptUrl: string;   // link to the committed generator script (reproducibility)
  note?: string;
}

const REPO = 'https://github.com/willspensley/brum-dashboard-/blob/main';

export const SOURCES: Record<string, SourceMeta> = {
  population: {
    id: 'population',
    label: 'Ward population',
    short: 'ONS · mid-2024',
    source: 'Small Area Population Estimates (2021-based), all ages, both sexes',
    publisher: 'Office for National Statistics',
    datasetId: 'ONS NOMIS NM_2014_1',
    asOf: 'Mid-2024',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala',
    scriptUrl: `${REPO}/scripts/fetch-population.mjs`,
    note: '69 wards · sums to 1,183,618 = the ONS Birmingham LAD total (verified at generation).',
  },
  crime: {
    id: 'crime',
    label: 'Ward crime',
    short: 'data.police.uk',
    source: 'Street-level recorded crime (West Midlands Police)',
    publisher: 'Home Office · data.police.uk',
    datasetId: 'data.police.uk crimes-street API',
    asOf: 'Monthly (latest month shown in the dashboard header)',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://data.police.uk/data/',
    scriptUrl: `${REPO}/scripts/fetch-crime-wards.mjs`,
    note: 'Crimes aggregated to the 69 official wards by point-in-polygon; rate = count ÷ ONS population.',
  },
  universalCredit: {
    id: 'universalCredit',
    label: 'Universal Credit claimants',
    short: 'DWP · monthly',
    source: 'People on Universal Credit (household heads + partners)',
    publisher: 'Department for Work & Pensions · via Birmingham City Observatory',
    datasetId: 'number-of-people-on-universal-credit-wmca-wards-2025',
    asOf: 'Monthly (latest month shown in the dashboard header)',
    licence: 'Open Government Licence v3.0',
    sourceUrl:
      'https://cityobservatory.birmingham.gov.uk/explore/dataset/number-of-people-on-universal-credit-wmca-wards-2025/',
    scriptUrl: `${REPO}/scripts/fetch-uc.mjs`,
    note: 'Administrative hard count (not modelled). WMCA ward records filtered to the 69 official Birmingham wards (E05011118–E05011186).',
  },
  ucEmployment: {
    id: 'ucEmployment',
    label: 'UC claimants in employment',
    short: 'DWP · monthly',
    source: 'Percentage of Universal Credit claimants who are in employment',
    publisher: 'Department for Work & Pensions · via Birmingham City Observatory',
    datasetId: 'percentage-universal-credit-claimants-in-employment-birmingham-wards',
    asOf: 'Monthly (latest month shown in the dashboard header)',
    licence: 'Open Government Licence v3.0',
    sourceUrl:
      'https://cityobservatory.birmingham.gov.uk/explore/dataset/percentage-universal-credit-claimants-in-employment-birmingham-wards/',
    scriptUrl: `${REPO}/scripts/fetch-uc-employment.mjs`,
    note: 'Native percentage (not modelled, no derivation). 69 Birmingham wards. The "in-work poverty" signal — claimants also in paid work.',
  },
  claimantCount: {
    id: 'claimantCount',
    label: 'Claimant count',
    short: 'DWP · monthly',
    source: 'Claimant count by sex and age (unemployment-related benefits: UC searching-for-work + JSA)',
    publisher: 'Department for Work & Pensions · via Birmingham City Observatory',
    datasetId: 'claimant-count-by-sex-birmingham-wards-latest + claimant-count-birmingham-wards-5years',
    asOf: 'Monthly (latest month shown in the dashboard header)',
    licence: 'Open Government Licence v3.0',
    sourceUrl:
      'https://www.cityobservatory.birmingham.gov.uk/explore/dataset/claimant-count-by-sex-birmingham-wards-latest/',
    scriptUrl: `${REPO}/scripts/fetch-claimant-count.mjs`,
    note: 'Administrative counts, DWP-rounded to the nearest 5. The % is DWP\'s native "claimants as a proportion of residents aged 16-64" (not derived). 69 official wards; 5-year monthly series for trends.',
  },
  housingBenefit: {
    id: 'housingBenefit',
    label: 'Housing Benefit take-up',
    short: 'DWP · monthly',
    source: '% of households in receipt of Housing Benefit',
    publisher: 'Department for Work & Pensions · via Birmingham City Observatory',
    datasetId: 'percentage-households-in-receipt-of-housing-benefits-wmca',
    asOf: 'Monthly (latest month shown in the dashboard header)',
    licence: 'Open Government Licence v3.0',
    sourceUrl:
      'https://www.cityobservatory.birmingham.gov.uk/explore/dataset/percentage-households-in-receipt-of-housing-benefits-wmca/',
    scriptUrl: `${REPO}/scripts/fetch-housing-benefit.mjs`,
    note: 'Administrative hard count (not modelled). Published at LOCAL-AUTHORITY level only — there is no ward breakdown. Shown as Birmingham vs the other West Midlands boroughs, with the DWP regional/national benchmarks.',
  },
  education: {
    id: 'education',
    label: 'Qualifications',
    short: 'Census 2021',
    source: 'Census 2021, table TS067 (highest level of qualification)',
    publisher: 'Office for National Statistics',
    datasetId: 'ONS NOMIS NM_2084_1',
    asOf: 'Census 2021 (frozen until 2031)',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://www.nomisweb.co.uk/sources/census_2021_ts',
    scriptUrl: `${REPO}/scripts/fetch-education-data.mjs`,
    note: '% of usual residents aged 16+. 69 wards.',
  },
};
