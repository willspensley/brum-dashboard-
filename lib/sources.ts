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
  childPoverty: {
    id: 'childPoverty',
    label: 'Children in low-income families',
    short: 'DWP/HMRC · annual',
    source: '% of children aged 0-15 in absolute low-income families (below 60% of 2010/11 median, inflation-adjusted)',
    publisher: 'DWP/HMRC · via Birmingham City Observatory',
    datasetId: 'percentage-of-children-in-absolute-low-income-families-aged-0-15-birmingham-wards',
    asOf: 'Annual, 2015/16 → latest (shown in the dashboard header)',
    licence: 'Open Government Licence v3.0',
    sourceUrl:
      'https://www.cityobservatory.birmingham.gov.uk/explore/dataset/percentage-of-children-in-absolute-low-income-families-aged-0-15-birmingham-wards/',
    scriptUrl: `${REPO}/scripts/fetch-child-poverty.mjs`,
    note: 'Native ward % (administrative, not modelled). 69 wards × 10-year series. Benchmarks are the REAL Birmingham-LA and England-mean series from the companion LA dataset.',
  },
  benefitsBill: {
    id: 'benefitsBill',
    label: 'Benefits Bill (DWP expenditure)',
    short: 'DWP · 2024/25',
    source: 'Benefit expenditure by local authority, 2024/25 outturn (£m nominal)',
    publisher: 'Department for Work & Pensions',
    datasetId: 'Benefit expenditure and caseload tables 2025',
    asOf: '2024/25 financial year',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://assets.publishing.service.gov.uk/media/693ffb536a12691d48491fb3/benefit-expenditure-by-local-authority-2024-25.ods',
    scriptUrl: `${REPO}/scripts/fetch-benefits-bill.mjs`,
    note: 'The exact file: benefit-expenditure-by-local-authority-2024-25.ods (from the DWP "Benefit expenditure and caseload tables 2025" publication page). One sheet per year ("2002-03"…"2024-25"); Birmingham is row E08000025 on each. A copy is archived in-repo at archive/. Column mapping re-validated at every fetch against each sheet\'s own Total. Excludes Child Benefit (HMRC).',
  },
  pipConditions: {
    id: 'pipConditions',
    label: 'PIP by medical condition (GB)',
    short: 'DWP · 2013/14–2024/25',
    source: 'PIP expenditure by reported medical condition — category + granular condition, nominal & real (2025/26 prices), WA/PA splits',
    publisher: 'Department for Work & Pensions',
    datasetId: 'pip-expenditure-2024-to-2025.ods',
    asOf: '2024/25 financial year (series from 2013/14)',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://assets.publishing.service.gov.uk/media/695b8ddfa2fb6c15f98d1954/pip-expenditure-2024-to-2025.ods',
    scriptUrl: `${REPO}/scripts/fetch-pip-conditions.mjs`,
    note: 'GREAT BRITAIN ONLY — no sub-national £-by-condition exists anywhere. Validated at every fetch: category sum matches the by-LA workbook\'s GB PIP row; condition sheet reconciles with the category sheet. Copy archived in-repo at archive/.',
  },
  constituencyMoney: {
    id: 'constituencyMoney',
    label: 'Constituency Money Map (DWP £)',
    short: 'DWP · 2024/25',
    source: 'Benefit expenditure by parliamentary constituency, 2024/25 outturn (£m nominal, 2024 boundaries)',
    publisher: 'Department for Work & Pensions',
    datasetId: 'benefit-expenditure-by-parliamentary-constituency-2024-25.ods — sheets "2024-25" + "UC_(PC24)"',
    asOf: '2024/25 financial year (UC trend 2019/20→2024/25)',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://assets.publishing.service.gov.uk/media/693ffc50c72b0f8ccf33d788/benefit-expenditure-by-parliamentary-constituency-2024-25.ods',
    scriptUrl: `${REPO}/scripts/fetch-constituency-money.mjs`,
    note: 'Actual DWP accounts, per-constituency rows each checksum-validated against the workbook\'s own Total. Copy archived in-repo at archive/. Constituencies straddle the LA boundary so their sum ≠ the Birmingham LA figure exactly (drift logged at every fetch). No ward-level £ exists.',
  },
  twoChild: {
    id: 'twoChild',
    label: 'Two-child limit (final statistics)',
    short: 'DWP · Apr 2026',
    source: 'UC statistics on the two child limit policy, April 2026 (final release — policy abolished 6 Apr 2026)',
    publisher: 'Department for Work & Pensions',
    datasetId: 'data-tables-universal-credit-statistics-two-child-limit-april-2026',
    asOf: 'April 2026',
    licence: 'Open Government Licence v3.0',
    sourceUrl: 'https://www.gov.uk/government/statistics/universal-credit-claimants-statistics-on-the-two-child-limit-policy-april-2026',
    scriptUrl: `${REPO}/scripts/fetch-two-child.mjs`,
    note: 'Constituency level — no ward breakdown exists. £ gains are DERIVED: children denied an element × the official child-element rate (£292.81/month). Cross-checked: constituency sum vs LA total at every fetch.',
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
