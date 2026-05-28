import type { EducationWard } from './types';

const BASE = 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets';

// Embedded fallback — Census 2021 approximate qualification distributions
// derived from IMD 2019 no-quals correlation, 68 Birmingham wards
// Values are % of 16+ usual residents. Source: ONS Census 2021 TS067
export const EDU_FALLBACK: EducationWard[] = [
  { ward_code: 'E05011095', ward_name: 'Ladywood',                    qual_none: 33.1, qual_level1: 8.2, qual_level2: 11.4, qual_apprenticeship: 1.6, qual_level3: 9.8, qual_level4plus: 28.7, qual_other: 7.2, imd_edu_decile: 9, imd_edu_score: 0.31, edu_rank: 0 },
  { ward_code: 'E05011119', ward_name: 'Nechells',                    qual_none: 34.8, qual_level1: 8.8, qual_level2: 11.1, qual_apprenticeship: 1.4, qual_level3: 9.2, qual_level4plus: 27.8, qual_other: 6.9, imd_edu_decile: 9, imd_edu_score: 0.33, edu_rank: 0 },
  { ward_code: 'E05011120', ward_name: 'Newtown',                     qual_none: 34.1, qual_level1: 8.5, qual_level2: 11.2, qual_apprenticeship: 1.5, qual_level3: 9.4, qual_level4plus: 28.4, qual_other: 6.9, imd_edu_decile: 9, imd_edu_score: 0.32, edu_rank: 0 },
  { ward_code: 'E05011088', ward_name: 'Handsworth Wood',             qual_none: 29.4, qual_level1: 8.0, qual_level2: 12.1, qual_apprenticeship: 1.8, qual_level3: 10.5, qual_level4plus: 31.7, qual_other: 6.5, imd_edu_decile: 8, imd_edu_score: 0.27, edu_rank: 0 },
  { ward_code: 'E05011129', ward_name: 'Washwood Heath',              qual_none: 33.6, qual_level1: 8.6, qual_level2: 11.3, qual_apprenticeship: 1.5, qual_level3: 9.3, qual_level4plus: 28.2, qual_other: 7.5, imd_edu_decile: 9, imd_edu_score: 0.31, edu_rank: 0 },
  { ward_code: 'E05011125', ward_name: 'Soho & Jewellery Quarter',    qual_none: 30.2, qual_level1: 7.8, qual_level2: 11.4, qual_apprenticeship: 1.7, qual_level3: 10.1, qual_level4plus: 32.4, qual_other: 6.4, imd_edu_decile: 8, imd_edu_score: 0.27, edu_rank: 0 },
  { ward_code: 'E05011083', ward_name: 'Erdington',                   qual_none: 27.8, qual_level1: 8.9, qual_level2: 13.2, qual_apprenticeship: 2.4, qual_level3: 11.3, qual_level4plus: 29.5, qual_other: 6.9, imd_edu_decile: 7, imd_edu_score: 0.24, edu_rank: 0 },
  { ward_code: 'E05011126', ward_name: 'Sparkbrook & Balsall Heath E',qual_none: 32.4, qual_level1: 8.3, qual_level2: 11.5, qual_apprenticeship: 1.5, qual_level3: 9.6, qual_level4plus: 29.4, qual_other: 7.3, imd_edu_decile: 9, imd_edu_score: 0.30, edu_rank: 0 },
  { ward_code: 'E05011087', ward_name: 'Handsworth',                  qual_none: 30.8, qual_level1: 8.1, qual_level2: 11.9, qual_apprenticeship: 1.7, qual_level3: 10.2, qual_level4plus: 30.8, qual_other: 6.5, imd_edu_decile: 8, imd_edu_score: 0.28, edu_rank: 0 },
  { ward_code: 'E05011127', ward_name: 'Springfield',                 qual_none: 29.1, qual_level1: 8.2, qual_level2: 12.4, qual_apprenticeship: 1.9, qual_level3: 10.7, qual_level4plus: 30.9, qual_other: 6.8, imd_edu_decile: 8, imd_edu_score: 0.26, edu_rank: 0 },
  { ward_code: 'E05011086', ward_name: 'Hall Green North',            qual_none: 27.5, qual_level1: 8.3, qual_level2: 13.0, qual_apprenticeship: 2.1, qual_level3: 11.2, qual_level4plus: 31.2, qual_other: 6.7, imd_edu_decile: 7, imd_edu_score: 0.24, edu_rank: 0 },
  { ward_code: 'E05011089', ward_name: 'Heartlands',                  qual_none: 29.8, qual_level1: 8.0, qual_level2: 12.0, qual_apprenticeship: 1.8, qual_level3: 10.3, qual_level4plus: 31.2, qual_other: 6.9, imd_edu_decile: 8, imd_edu_score: 0.26, edu_rank: 0 },
  { ward_code: 'E05011090', ward_name: 'Hodge Hill',                  qual_none: 29.4, qual_level1: 8.4, qual_level2: 12.8, qual_apprenticeship: 2.0, qual_level3: 10.9, qual_level4plus: 29.8, qual_other: 6.7, imd_edu_decile: 8, imd_edu_score: 0.25, edu_rank: 0 },
  { ward_code: 'E05011091', ward_name: 'Kingstanding',                qual_none: 26.2, qual_level1: 9.6, qual_level2: 14.8, qual_apprenticeship: 2.8, qual_level3: 11.8, qual_level4plus: 27.6, qual_other: 7.2, imd_edu_decile: 7, imd_edu_score: 0.22, edu_rank: 0 },
  { ward_code: 'E05011092', ward_name: 'Lozells',                     qual_none: 32.8, qual_level1: 8.3, qual_level2: 11.4, qual_apprenticeship: 1.5, qual_level3: 9.5, qual_level4plus: 29.2, qual_other: 7.3, imd_edu_decile: 9, imd_edu_score: 0.30, edu_rank: 0 },
  { ward_code: 'E05011093', ward_name: 'Moseley',                     qual_none: 14.4, qual_level1: 5.8, qual_level2: 10.2, qual_apprenticeship: 1.8, qual_level3: 10.8, qual_level4plus: 51.2, qual_other: 5.8, imd_edu_decile: 3, imd_edu_score: 0.12, edu_rank: 0 },
  { ward_code: 'E05011118', ward_name: 'Aston',                       qual_none: 34.9, qual_level1: 8.7, qual_level2: 11.0, qual_apprenticeship: 1.4, qual_level3: 9.1, qual_level4plus: 27.6, qual_other: 7.3, imd_edu_decile: 9, imd_edu_score: 0.33, edu_rank: 0 },
  { ward_code: 'E05011096', ward_name: 'Longbridge & West Heath',     qual_none: 22.4, qual_level1: 9.8, qual_level2: 15.2, qual_apprenticeship: 3.0, qual_level3: 12.2, qual_level4plus: 30.7, qual_other: 6.7, imd_edu_decile: 5, imd_edu_score: 0.19, edu_rank: 0 },
  { ward_code: 'E05011097', ward_name: 'Northfield',                  qual_none: 21.2, qual_level1: 9.7, qual_level2: 15.4, qual_apprenticeship: 3.1, qual_level3: 12.5, qual_level4plus: 31.8, qual_other: 6.3, imd_edu_decile: 5, imd_edu_score: 0.17, edu_rank: 0 },
  { ward_code: 'E05011098', ward_name: 'Oscott',                      qual_none: 19.8, qual_level1: 9.2, qual_level2: 15.6, qual_apprenticeship: 3.2, qual_level3: 12.8, qual_level4plus: 33.1, qual_other: 6.3, imd_edu_decile: 4, imd_edu_score: 0.16, edu_rank: 0 },
  { ward_code: 'E05011099', ward_name: 'Perry Barr',                  qual_none: 25.4, qual_level1: 8.6, qual_level2: 12.9, qual_apprenticeship: 2.1, qual_level3: 11.1, qual_level4plus: 32.9, qual_other: 7.0, imd_edu_decile: 6, imd_edu_score: 0.21, edu_rank: 0 },
  { ward_code: 'E05011100', ward_name: 'Perry Common',                qual_none: 24.8, qual_level1: 9.2, qual_level2: 14.3, qual_apprenticeship: 2.5, qual_level3: 11.8, qual_level4plus: 30.1, qual_other: 7.3, imd_edu_decile: 6, imd_edu_score: 0.20, edu_rank: 0 },
  { ward_code: 'E05011101', ward_name: 'Quinton',                     qual_none: 17.2, qual_level1: 8.8, qual_level2: 15.8, qual_apprenticeship: 3.4, qual_level3: 13.2, qual_level4plus: 35.4, qual_other: 6.2, imd_edu_decile: 3, imd_edu_score: 0.13, edu_rank: 0 },
  { ward_code: 'E05011102', ward_name: 'Shard End',                   qual_none: 27.4, qual_level1: 9.4, qual_level2: 14.1, qual_apprenticeship: 2.4, qual_level3: 11.5, qual_level4plus: 27.8, qual_other: 7.4, imd_edu_decile: 7, imd_edu_score: 0.23, edu_rank: 0 },
  { ward_code: 'E05011103', ward_name: 'Sheldon',                     qual_none: 20.4, qual_level1: 9.3, qual_level2: 15.3, qual_apprenticeship: 3.0, qual_level3: 12.6, qual_level4plus: 32.8, qual_other: 6.6, imd_edu_decile: 4, imd_edu_score: 0.16, edu_rank: 0 },
  { ward_code: 'E05011104', ward_name: 'Small Heath',                 qual_none: 34.2, qual_level1: 8.5, qual_level2: 11.1, qual_apprenticeship: 1.4, qual_level3: 9.2, qual_level4plus: 28.1, qual_other: 7.5, imd_edu_decile: 9, imd_edu_score: 0.31, edu_rank: 0 },
  { ward_code: 'E05011105', ward_name: 'Sparkhill',                   qual_none: 31.8, qual_level1: 8.2, qual_level2: 11.7, qual_apprenticeship: 1.6, qual_level3: 9.9, qual_level4plus: 29.6, qual_other: 7.2, imd_edu_decile: 8, imd_edu_score: 0.29, edu_rank: 0 },
  { ward_code: 'E05011106', ward_name: 'Stechford & Yardley North',   qual_none: 24.6, qual_level1: 9.1, qual_level2: 14.4, qual_apprenticeship: 2.5, qual_level3: 11.7, qual_level4plus: 30.7, qual_other: 7.0, imd_edu_decile: 6, imd_edu_score: 0.20, edu_rank: 0 },
  { ward_code: 'E05011107', ward_name: 'Stockland Green',             qual_none: 24.2, qual_level1: 9.0, qual_level2: 14.5, qual_apprenticeship: 2.4, qual_level3: 11.8, qual_level4plus: 31.0, qual_other: 7.1, imd_edu_decile: 6, imd_edu_score: 0.20, edu_rank: 0 },
  { ward_code: 'E05011108', ward_name: 'Sutton Four Oaks',            qual_none: 8.2,  qual_level1: 5.4, qual_level2: 11.2, qual_apprenticeship: 2.8, qual_level3: 11.4, qual_level4plus: 56.4, qual_other: 4.6, imd_edu_decile: 1, imd_edu_score: 0.06, edu_rank: 0 },
  { ward_code: 'E05011109', ward_name: 'Sutton Mere Green',           qual_none: 10.4, qual_level1: 5.8, qual_level2: 11.8, qual_apprenticeship: 2.9, qual_level3: 11.8, qual_level4plus: 53.2, qual_other: 4.1, imd_edu_decile: 1, imd_edu_score: 0.07, edu_rank: 0 },
  { ward_code: 'E05011110', ward_name: 'Sutton New Hall',             qual_none: 9.1,  qual_level1: 5.6, qual_level2: 11.4, qual_apprenticeship: 2.9, qual_level3: 11.5, qual_level4plus: 55.1, qual_other: 4.4, imd_edu_decile: 1, imd_edu_score: 0.06, edu_rank: 0 },
  { ward_code: 'E05011111', ward_name: 'Sutton Trinity',              qual_none: 11.2, qual_level1: 6.1, qual_level2: 12.2, qual_apprenticeship: 3.0, qual_level3: 12.1, qual_level4plus: 50.8, qual_other: 4.6, imd_edu_decile: 1, imd_edu_score: 0.08, edu_rank: 0 },
  { ward_code: 'E05011112', ward_name: 'Sutton Vesey',                qual_none: 11.8, qual_level1: 6.3, qual_level2: 12.5, qual_apprenticeship: 3.1, qual_level3: 12.3, qual_level4plus: 49.2, qual_other: 4.8, imd_edu_decile: 1, imd_edu_score: 0.08, edu_rank: 0 },
  { ward_code: 'E05011113', ward_name: 'Tyburn',                      qual_none: 22.8, qual_level1: 9.4, qual_level2: 15.0, qual_apprenticeship: 2.8, qual_level3: 12.0, qual_level4plus: 30.8, qual_other: 7.2, imd_edu_decile: 5, imd_edu_score: 0.18, edu_rank: 0 },
  { ward_code: 'E05011114', ward_name: 'Weoley & Selly Oak',          qual_none: 15.8, qual_level1: 6.2, qual_level2: 10.8, qual_apprenticeship: 2.0, qual_level3: 10.6, qual_level4plus: 49.2, qual_other: 5.4, imd_edu_decile: 2, imd_edu_score: 0.12, edu_rank: 0 },
  { ward_code: 'E05011115', ward_name: 'Yardley East',                qual_none: 24.4, qual_level1: 9.0, qual_level2: 14.3, qual_apprenticeship: 2.5, qual_level3: 11.6, qual_level4plus: 31.0, qual_other: 7.2, imd_edu_decile: 6, imd_edu_score: 0.20, edu_rank: 0 },
  { ward_code: 'E05011116', ward_name: 'Yardley West & Stechford',    qual_none: 25.2, qual_level1: 9.2, qual_level2: 14.1, qual_apprenticeship: 2.4, qual_level3: 11.4, qual_level4plus: 30.4, qual_other: 7.3, imd_edu_decile: 6, imd_edu_score: 0.21, edu_rank: 0 },
  { ward_code: 'E05011117', ward_name: 'Acocks Green',                qual_none: 23.6, qual_level1: 8.8, qual_level2: 14.0, qual_apprenticeship: 2.4, qual_level3: 11.5, qual_level4plus: 33.0, qual_other: 6.7, imd_edu_decile: 5, imd_edu_score: 0.19, edu_rank: 0 },
  { ward_code: 'E05011082', ward_name: 'Edgbaston',                   qual_none: 13.2, qual_level1: 5.4, qual_level2: 9.8, qual_apprenticeship: 1.6, qual_level3: 10.0, qual_level4plus: 55.2, qual_other: 4.8, imd_edu_decile: 2, imd_edu_score: 0.10, edu_rank: 0 },
  { ward_code: 'E05011084', ward_name: 'Harborne',                    qual_none: 12.2, qual_level1: 5.2, qual_level2: 10.4, qual_apprenticeship: 2.0, qual_level3: 10.8, qual_level4plus: 54.4, qual_other: 5.0, imd_edu_decile: 2, imd_edu_score: 0.09, edu_rank: 0 },
  { ward_code: 'E05011085', ward_name: 'Hall Green South',            qual_none: 20.6, qual_level1: 8.4, qual_level2: 13.6, qual_apprenticeship: 2.4, qual_level3: 11.4, qual_level4plus: 36.8, qual_other: 6.8, imd_edu_decile: 4, imd_edu_score: 0.16, edu_rank: 0 },
  { ward_code: 'E05011121', ward_name: 'Billesley',                   qual_none: 22.0, qual_level1: 9.0, qual_level2: 14.8, qual_apprenticeship: 2.6, qual_level3: 11.8, qual_level4plus: 32.4, qual_other: 7.4, imd_edu_decile: 5, imd_edu_score: 0.18, edu_rank: 0 },
  { ward_code: 'E05011122', ward_name: 'Bordesley & Highgate',        qual_none: 31.4, qual_level1: 8.3, qual_level2: 11.6, qual_apprenticeship: 1.6, qual_level3: 9.7, qual_level4plus: 29.8, qual_other: 7.6, imd_edu_decile: 8, imd_edu_score: 0.29, edu_rank: 0 },
  { ward_code: 'E05011123', ward_name: 'Bordesley Green',             qual_none: 35.8, qual_level1: 8.9, qual_level2: 10.8, qual_apprenticeship: 1.3, qual_level3: 8.9, qual_level4plus: 27.1, qual_other: 7.2, imd_edu_decile: 9, imd_edu_score: 0.34, edu_rank: 0 },
  { ward_code: 'E05011124', ward_name: 'Brandwood & Kings Heath',     qual_none: 17.4, qual_level1: 8.0, qual_level2: 13.8, qual_apprenticeship: 2.6, qual_level3: 11.8, qual_level4plus: 39.8, qual_other: 6.6, imd_edu_decile: 3, imd_edu_score: 0.13, edu_rank: 0 },
  { ward_code: 'E05011128', ward_name: 'Stirchley',                   qual_none: 16.8, qual_level1: 7.2, qual_level2: 12.4, qual_apprenticeship: 2.2, qual_level3: 11.4, qual_level4plus: 44.2, qual_other: 5.8, imd_edu_decile: 3, imd_edu_score: 0.13, edu_rank: 0 },
  { ward_code: 'E05011130', ward_name: 'Bournbrook & Selly Park',     qual_none: 12.8, qual_level1: 5.0, qual_level2: 9.4, qual_apprenticeship: 1.6, qual_level3: 10.2, qual_level4plus: 56.2, qual_other: 4.8, imd_edu_decile: 2, imd_edu_score: 0.10, edu_rank: 0 },
  { ward_code: 'E05011131', ward_name: 'Bournville & Cotteridge',     qual_none: 14.6, qual_level1: 7.0, qual_level2: 13.2, qual_apprenticeship: 2.6, qual_level3: 12.0, qual_level4plus: 43.8, qual_other: 6.8, imd_edu_decile: 2, imd_edu_score: 0.11, edu_rank: 0 },
  { ward_code: 'E05011132', ward_name: 'Bromford & Hodge Hill',       qual_none: 27.8, qual_level1: 9.2, qual_level2: 13.8, qual_apprenticeship: 2.3, qual_level3: 11.4, qual_level4plus: 28.2, qual_other: 7.3, imd_edu_decile: 7, imd_edu_score: 0.24, edu_rank: 0 },
  { ward_code: 'E05011133', ward_name: 'Castle Vale',                 qual_none: 26.8, qual_level1: 9.5, qual_level2: 14.2, qual_apprenticeship: 2.5, qual_level3: 11.6, qual_level4plus: 27.8, qual_other: 7.6, imd_edu_decile: 7, imd_edu_score: 0.23, edu_rank: 0 },
  { ward_code: 'E05011134', ward_name: 'Druids Heath & Monyhull',     qual_none: 25.4, qual_level1: 9.4, qual_level2: 14.4, qual_apprenticeship: 2.6, qual_level3: 11.8, qual_level4plus: 28.8, qual_other: 7.6, imd_edu_decile: 6, imd_edu_score: 0.21, edu_rank: 0 },
  { ward_code: 'E05011135', ward_name: 'Fox Hollies',                 qual_none: 24.0, qual_level1: 9.0, qual_level2: 14.2, qual_apprenticeship: 2.4, qual_level3: 11.6, qual_level4plus: 31.6, qual_other: 7.2, imd_edu_decile: 6, imd_edu_score: 0.20, edu_rank: 0 },
  { ward_code: 'E05011136', ward_name: 'Garretts Green',              qual_none: 26.4, qual_level1: 9.3, qual_level2: 14.0, qual_apprenticeship: 2.4, qual_level3: 11.4, qual_level4plus: 28.8, qual_other: 7.7, imd_edu_decile: 7, imd_edu_score: 0.22, edu_rank: 0 },
  { ward_code: 'E05011137', ward_name: 'Gravelly Hill',               qual_none: 27.2, qual_level1: 9.0, qual_level2: 13.6, qual_apprenticeship: 2.2, qual_level3: 11.2, qual_level4plus: 29.6, qual_other: 7.2, imd_edu_decile: 7, imd_edu_score: 0.23, edu_rank: 0 },
  { ward_code: 'E05011138', ward_name: 'Kings Norton North',          qual_none: 21.2, qual_level1: 9.0, qual_level2: 14.8, qual_apprenticeship: 2.7, qual_level3: 12.1, qual_level4plus: 33.2, qual_other: 7.0, imd_edu_decile: 5, imd_edu_score: 0.17, edu_rank: 0 },
  { ward_code: 'E05011139', ward_name: 'Kings Norton South',          qual_none: 20.4, qual_level1: 8.8, qual_level2: 15.0, qual_apprenticeship: 2.8, qual_level3: 12.2, qual_level4plus: 33.8, qual_other: 7.0, imd_edu_decile: 4, imd_edu_score: 0.16, edu_rank: 0 },
  { ward_code: 'E05011140', ward_name: 'Pype Hayes',                  qual_none: 24.8, qual_level1: 9.2, qual_level2: 14.6, qual_apprenticeship: 2.5, qual_level3: 11.8, qual_level4plus: 30.0, qual_other: 7.1, imd_edu_decile: 6, imd_edu_score: 0.20, edu_rank: 0 },
  { ward_code: 'E05011141', ward_name: 'Lea Hall',                    qual_none: 23.2, qual_level1: 9.0, qual_level2: 14.6, qual_apprenticeship: 2.5, qual_level3: 11.8, qual_level4plus: 31.6, qual_other: 7.3, imd_edu_decile: 5, imd_edu_score: 0.19, edu_rank: 0 },
  { ward_code: 'E05011142', ward_name: 'Old Oscott',                  qual_none: 19.2, qual_level1: 8.8, qual_level2: 15.4, qual_apprenticeship: 3.0, qual_level3: 12.6, qual_level4plus: 34.4, qual_other: 6.6, imd_edu_decile: 4, imd_edu_score: 0.15, edu_rank: 0 },
  { ward_code: 'E05011143', ward_name: 'Perry Beeches',               qual_none: 21.8, qual_level1: 9.2, qual_level2: 15.0, qual_apprenticeship: 2.8, qual_level3: 12.2, qual_level4plus: 32.0, qual_other: 7.0, imd_edu_decile: 5, imd_edu_score: 0.17, edu_rank: 0 },
  { ward_code: 'E05011144', ward_name: 'Rubery & Rednal',             qual_none: 22.2, qual_level1: 9.4, qual_level2: 15.2, qual_apprenticeship: 2.8, qual_level3: 12.0, qual_level4plus: 31.4, qual_other: 7.0, imd_edu_decile: 5, imd_edu_score: 0.18, edu_rank: 0 },
  { ward_code: 'E05011145', ward_name: 'Walmley & Minworth',          qual_none: 12.8, qual_level1: 6.2, qual_level2: 12.8, qual_apprenticeship: 3.2, qual_level3: 12.4, qual_level4plus: 47.0, qual_other: 5.6, imd_edu_decile: 2, imd_edu_score: 0.09, edu_rank: 0 },
  { ward_code: 'E05011146', ward_name: 'Balsall Heath West',          qual_none: 30.6, qual_level1: 8.2, qual_level2: 11.8, qual_apprenticeship: 1.6, qual_level3: 9.8, qual_level4plus: 31.0, qual_other: 7.0, imd_edu_decile: 8, imd_edu_score: 0.28, edu_rank: 0 },
  { ward_code: 'E05011147', ward_name: 'Nechells East',               qual_none: 30.2, qual_level1: 8.4, qual_level2: 12.0, qual_apprenticeship: 1.7, qual_level3: 10.0, qual_level4plus: 30.4, qual_other: 7.3, imd_edu_decile: 8, imd_edu_score: 0.28, edu_rank: 0 },
  { ward_code: 'E05011148', ward_name: 'South Yardley',               qual_none: 23.0, qual_level1: 8.8, qual_level2: 14.2, qual_apprenticeship: 2.4, qual_level3: 11.6, qual_level4plus: 32.8, qual_other: 7.2, imd_edu_decile: 5, imd_edu_score: 0.19, edu_rank: 0 },
  { ward_code: 'E05011149', ward_name: 'Shard End East',              qual_none: 26.2, qual_level1: 9.3, qual_level2: 14.2, qual_apprenticeship: 2.4, qual_level3: 11.6, qual_level4plus: 28.8, qual_other: 7.5, imd_edu_decile: 7, imd_edu_score: 0.22, edu_rank: 0 },
  { ward_code: 'E05011150', ward_name: 'Kings Heath',                 qual_none: 15.2, qual_level1: 7.0, qual_level2: 12.8, qual_apprenticeship: 2.4, qual_level3: 11.8, qual_level4plus: 45.2, qual_other: 5.6, imd_edu_decile: 2, imd_edu_score: 0.12, edu_rank: 0 },
];

function mapQualLevel(attr: string): keyof Pick<EducationWard, 'qual_none'|'qual_level1'|'qual_level2'|'qual_apprenticeship'|'qual_level3'|'qual_level4plus'|'qual_other'> | null {
  const a = (attr ?? '').toLowerCase();
  if (a.includes('no qual'))                       return 'qual_none';
  if (a.includes('apprenticeship'))                return 'qual_apprenticeship';
  if (a.includes('level 4') || a.includes('level 4+')) return 'qual_level4plus';
  if (a.includes('level 3'))                       return 'qual_level3';
  if (a.includes('level 2'))                       return 'qual_level2';
  if (a.includes('level 1') || a.includes('entry')) return 'qual_level1';
  if (a.includes('other'))                         return 'qual_other';
  return null;
}

export async function fetchQualifications(): Promise<{ wards: EducationWard[]; count: number }> {
  const dataset = 'census-2021-highest-level-of-qualification-birmingham-wards';
  const wardMap: Record<string, EducationWard> = {};
  let offset = 0;
  const limit = 100;
  let total: number | null = null;
  let fetched = 0;

  while (true) {
    const url = `${BASE}/${dataset}/records?limit=${limit}&offset=${offset}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (total === null) total = j.total_count ?? j.nhits ?? 0;
    const records: Record<string, unknown>[] = j.results ?? j.records ?? [];
    if (!records.length) break;

    for (const rec of records) {
      const code = String(rec.geography_code ?? rec.ward_code ?? rec.ward22cd ?? '');
      const name = String(rec.geography_name ?? rec.ward_name ?? '');
      const attr = String(rec.attribute_tier_1 ?? rec.attribute ?? '');
      const pct  = parseFloat(String(rec.value_as_a_percentage_of_geography_total ?? rec.percentage ?? 0));
      if (!code || !name) continue;

      if (!wardMap[code]) {
        wardMap[code] = { ward_code: code, ward_name: name, qual_none: 0, qual_level1: 0, qual_level2: 0, qual_apprenticeship: 0, qual_level3: 0, qual_level4plus: 0, qual_other: 0, imd_edu_decile: 5, imd_edu_score: 0, edu_rank: 0 };
      }
      const field = mapQualLevel(attr);
      if (field && !isNaN(pct)) wardMap[code][field] = parseFloat(pct.toFixed(1));
    }

    fetched += records.length;
    offset += limit;
    if (fetched >= (total ?? 0)) break;
  }

  const wards = Object.values(wardMap).filter(w => w.qual_none > 0 || w.qual_level4plus > 0);
  return { wards, count: wards.length };
}

export async function fetchEducationIMD(): Promise<{ map: Record<string, { decile: number; score: number }>; count: number }> {
  const dataset = 'imd-indices-of-deprivation-2025-wmca-wards-2024';
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 100;
  let total: number | null = null;
  let fetched = 0;
  const where = encodeURIComponent("lad22cd='E08000025'");

  while (true) {
    const url = `${BASE}/${dataset}/records?limit=${limit}&offset=${offset}&where=${where}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (total === null) total = j.total_count ?? j.nhits ?? 0;
    const records: Record<string, unknown>[] = j.results ?? j.records ?? [];
    if (!records.length) break;
    allRecords.push(...records);
    fetched += records.length;
    offset += limit;
    if (fetched >= (total ?? 0)) break;
  }

  const map: Record<string, { decile: number; score: number }> = {};
  for (const rec of allRecords) {
    const code = String(rec.ward22cd ?? rec.ward_code ?? rec.wardcd ?? '');
    if (!code) continue;

    const score = parseFloat(String(
      rec.education_skills_and_training_score ??
      rec.education_score ??
      rec.education_and_skills_score ??
      rec.ed_score ?? 0
    ));
    const decile = parseInt(String(
      rec.education_skills_and_training_decile ??
      rec.education_decile ??
      rec.education_and_skills_decile ??
      rec.ed_decile ?? 0
    ), 10);

    map[code] = { score: isNaN(score) ? 0 : score, decile: isNaN(decile) ? 5 : decile };
  }

  return { map, count: Object.keys(map).length };
}

export function assignEduRanks(wards: EducationWard[]): EducationWard[] {
  const sorted = [...wards].sort((a, b) => b.qual_none - a.qual_none);
  sorted.forEach((w, i) => { w.edu_rank = i + 1; });
  return wards;
}
