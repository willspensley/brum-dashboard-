// Birmingham ward population — committed snapshot. REGENERATE with scripts/fetch-population.mjs.
//
// Source : ONS Small Area Population Estimates (2021-based), all ages, both sexes,
//          2022 ward boundaries (69 Birmingham wards). ONS open NOMIS dataset NM_2014_1.
//          Open Government Licence v3.0. No API key.
// As of  : mid-2024.   Pulled: 2026-06-24.
// Verify : the 69 figures sum to 1,183,618 = the ONS mid-year total for
//          Birmingham LAD E08000025 (same dataset). Sum check passed at generation.
// Keyed by official ONS ward code (E05011118–E05011186).

export const POPULATION_VINTAGE = 'ONS mid-2024';

export interface WardPopulation {
  ward_code: string;
  ward_name: string;
  population: number;
}

export const WARD_POPULATION_2024: WardPopulation[] = [
  { ward_code: 'E05011118', ward_name: "Acocks Green", population: 25120 },
  { ward_code: 'E05011119', ward_name: "Allens Cross", population: 11408 },
  { ward_code: 'E05011120', ward_name: "Alum Rock", population: 28753 },
  { ward_code: 'E05011121', ward_name: "Aston (Birmingham)", population: 24653 },
  { ward_code: 'E05011122', ward_name: "Balsall Heath West", population: 12878 },
  { ward_code: 'E05011123', ward_name: "Bartley Green", population: 23013 },
  { ward_code: 'E05011124', ward_name: "Billesley", population: 21906 },
  { ward_code: 'E05011125', ward_name: "Birchfield (Birmingham)", population: 13011 },
  { ward_code: 'E05011126', ward_name: "Bordesley & Highgate", population: 17835 },
  { ward_code: 'E05011127', ward_name: "Bordesley Green", population: 13580 },
  { ward_code: 'E05011128', ward_name: "Bournbrook & Selly Park", population: 22817 },
  { ward_code: 'E05011129', ward_name: "Bournville & Cotteridge", population: 19404 },
  { ward_code: 'E05011130', ward_name: "Brandwood & King's Heath", population: 18977 },
  { ward_code: 'E05011131', ward_name: "Bromford & Hodge Hill", population: 23225 },
  { ward_code: 'E05011132', ward_name: "Castle Vale", population: 10243 },
  { ward_code: 'E05011133', ward_name: "Druids Heath & Monyhull", population: 11664 },
  { ward_code: 'E05011134', ward_name: "Edgbaston", population: 18898 },
  { ward_code: 'E05011135', ward_name: "Erdington", population: 22831 },
  { ward_code: 'E05011136', ward_name: "Frankley Great Park", population: 12471 },
  { ward_code: 'E05011137', ward_name: "Garretts Green", population: 11896 },
  { ward_code: 'E05011138', ward_name: "Glebe Farm & Tile Cross", population: 25563 },
  { ward_code: 'E05011139', ward_name: "Gravelly Hill", population: 10932 },
  { ward_code: 'E05011140', ward_name: "Hall Green North", population: 25866 },
  { ward_code: 'E05011141', ward_name: "Hall Green South", population: 11094 },
  { ward_code: 'E05011142', ward_name: "Handsworth", population: 12651 },
  { ward_code: 'E05011143', ward_name: "Handsworth Wood", population: 20753 },
  { ward_code: 'E05011144', ward_name: "Harborne", population: 22786 },
  { ward_code: 'E05011145', ward_name: "Heartlands", population: 13610 },
  { ward_code: 'E05011146', ward_name: "Highter's Heath", population: 10966 },
  { ward_code: 'E05011147', ward_name: "Holyhead", population: 11635 },
  { ward_code: 'E05011148', ward_name: "King's Norton North", population: 11579 },
  { ward_code: 'E05011149', ward_name: "King's Norton South", population: 11688 },
  { ward_code: 'E05011150', ward_name: "Kingstanding", population: 21643 },
  { ward_code: 'E05011151', ward_name: "Ladywood", population: 29283 },
  { ward_code: 'E05011152', ward_name: "Longbridge & West Heath", population: 22479 },
  { ward_code: 'E05011153', ward_name: "Lozells", population: 12500 },
  { ward_code: 'E05011154', ward_name: "Moseley", population: 21621 },
  { ward_code: 'E05011155', ward_name: "Nechells", population: 18647 },
  { ward_code: 'E05011156', ward_name: "Newtown (Birmingham)", population: 18108 },
  { ward_code: 'E05011157', ward_name: "North Edgbaston", population: 23867 },
  { ward_code: 'E05011158', ward_name: "Northfield (Birmingham)", population: 10450 },
  { ward_code: 'E05011159', ward_name: "Oscott", population: 20993 },
  { ward_code: 'E05011160', ward_name: "Perry Barr", population: 21141 },
  { ward_code: 'E05011161', ward_name: "Perry Common", population: 12187 },
  { ward_code: 'E05011162', ward_name: "Pype Hayes", population: 11431 },
  { ward_code: 'E05011163', ward_name: "Quinton (Birmingham)", population: 21577 },
  { ward_code: 'E05011164', ward_name: "Rubery & Rednal", population: 10306 },
  { ward_code: 'E05011165', ward_name: "Shard End", population: 12459 },
  { ward_code: 'E05011166', ward_name: "Sheldon", population: 20619 },
  { ward_code: 'E05011167', ward_name: "Small Heath", population: 22167 },
  { ward_code: 'E05011168', ward_name: "Soho & Jewellery Quarter", population: 27826 },
  { ward_code: 'E05011169', ward_name: "South Yardley", population: 11583 },
  { ward_code: 'E05011170', ward_name: "Sparkbrook & Balsall Heath East", population: 28274 },
  { ward_code: 'E05011171', ward_name: "Sparkhill", population: 22285 },
  { ward_code: 'E05011172', ward_name: "Stirchley", population: 10309 },
  { ward_code: 'E05011173', ward_name: "Stockland Green", population: 24847 },
  { ward_code: 'E05011174', ward_name: "Sutton Four Oaks", population: 9277 },
  { ward_code: 'E05011175', ward_name: "Sutton Mere Green", population: 10086 },
  { ward_code: 'E05011176', ward_name: "Sutton Reddicap", population: 10060 },
  { ward_code: 'E05011177', ward_name: "Sutton Roughley", population: 12152 },
  { ward_code: 'E05011178', ward_name: "Sutton Trinity", population: 9683 },
  { ward_code: 'E05011179', ward_name: "Sutton Vesey", population: 20145 },
  { ward_code: 'E05011180', ward_name: "Sutton Walmley & Minworth", population: 16324 },
  { ward_code: 'E05011181', ward_name: "Sutton Wylde Green", population: 9047 },
  { ward_code: 'E05011182', ward_name: "Tyseley & Hay Mills", population: 12360 },
  { ward_code: 'E05011183', ward_name: "Ward End", population: 14110 },
  { ward_code: 'E05011184', ward_name: "Weoley & Selly Oak", population: 24079 },
  { ward_code: 'E05011185', ward_name: "Yardley East", population: 11554 },
  { ward_code: 'E05011186', ward_name: "Yardley West & Stechford", population: 14433 },
];

const BY_CODE: Record<string, number> = Object.fromEntries(WARD_POPULATION_2024.map(w => [w.ward_code, w.population]));
const BY_NAME: Record<string, number> = Object.fromEntries(WARD_POPULATION_2024.map(w => [w.ward_name.toLowerCase(), w.population]));

export function getWardPopulation(code: string, name?: string): number | null {
  if (BY_CODE[code] != null) return BY_CODE[code];
  if (name && BY_NAME[name.toLowerCase()] != null) return BY_NAME[name.toLowerCase()];
  return null;
}
