# Birmingham Dashboard — Public Data Sources Research

Researched: 2026-05-27. Live catalog fetched from City Observatory (696 datasets), NOMIS, Police.uk, DWP Stat-Xplore, ONS, TfWM.
Education deep-dive added: 2026-05-28. Live API calls confirmed against EES, NOMIS TS067, Ofsted CSV, City Observatory education datasets.

---

## Currently Used

| Source | Data | Granularity | API |
|---|---|---|---|
| NOMIS NM_162_1 | Claimant Count | Ward | Open, no key |
| City Observatory (`cityobservatory.birmingham.gov.uk`) | IMD 2025 employment deprivation (LSOA-level) | LSOA → ward | Open, no key |
| City Observatory | GVA all industries (2022) | Ward | Open, no key |
| City Observatory | Census 2021 population/age | Ward | Open, no key |
| Birmingham City Observatory API (`api.birmingham.gov.uk`) | Crime rate per 1,000 population | Ward | Open, no key |

---

## Tier 1 — Add Now (clean APIs, ward-level, no key needed)

### 1. IMD 2025 All 7 Domains at Ward Level
- **Dataset:** `imd-indices-of-deprivation-2025-wmca-wards-2024`
- **API:** `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-wards-2024/records`
- **What it adds:** All 7 deprivation domains (income, employment, education, health, crime, barriers to housing/services, living environment) already aggregated to ward. Currently only using employment domain from LSOA-level data.
- **Key:** None. Same ODS API already in use.

### 2. Census 2021 Economic Activity
- **Dataset:** `census-2021-economic-activity-status-birmingham-wards`
- **API:** `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-economic-activity-status-birmingham-wards/records`
- **What it adds:** Employed / unemployed / economically inactive breakdown at ward level. Much richer than Claimant Count alone.
- **Key:** None.

### 3. Census 2021 Qualifications
- **Dataset:** `census-2021-highest-level-of-qualification-birmingham-wards`
- **API:** `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-highest-level-of-qualification-birmingham-wards/records`
- **What it adds:** % no qualifications, % Level 4+ at ward level. Key skills deprivation indicator.
- **Key:** None.

### 4. Census 2021 Occupation
- **Dataset:** `census-2021-occupation-birmingham-wards`
- **API:** `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-occupation-birmingham-wards/records`
- **What it adds:** SOC group distribution at ward level. Signals job quality, not just employment rate.
- **Key:** None.

### 5. Census 2021 Hours Worked
- **Dataset:** `census-2021-hours-worked-birmingham-wards`
- **API:** `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-hours-worked-birmingham-wards/records`
- **What it adds:** Underemployment — part-time / full-time split at ward level.
- **Key:** None.

### 6. Census 2021 Distance Travelled to Work
- **Dataset:** `census-2021-distance-travelled-to-work-birmingham-wards`
- **API:** `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-distance-travelled-to-work-birmingham-wards/records`
- **What it adds:** Mode of transport + distance to work at ward. Transport barrier to employment.
- **Key:** None.

---

## Tier 1 — Add Now (requires free API key)

### 7. DWP Stat-Xplore — Universal Credit at Ward Level
- **API:** `https://stat-xplore.dwp.gov.uk/webapi/rest/v1/`
- **Register:** `https://stat-xplore.dwp.gov.uk` — free, instant
- **Auth:** `APIKey` header
- **Dataset:** `UC_Monthly` — People on Universal Credit
- **What it adds:** Monthly UC claimants by conditionality regime (work-search / work preparation / light-touch / no requirements / carer). Shows *why* people aren't working, not just that they aren't. Ward-level confirmed available.
- **Rate limit:** 2,000 requests/hour
- **Other Stat-Xplore datasets worth adding later:**
  - Children in Low Income Families (ward level) — tracks in-work poverty
  - Housing Benefit by tenure (LAD level)
  - PIP/DLA claimants (LAD level)

---

## Tier 2 — High Value, More Integration Work

### 8. Police.uk API — Crime by Category (15 categories)
- **API:** `https://data.police.uk/api/crimes-street`
- **Key:** None. Fully open.
- **Force:** West Midlands (`west-midlands`)
- **What it adds:** 15 crime categories (violence, drugs, burglary, ASB, weapons, robbery, theft, vehicle crime etc.) at LSOA level, monthly, ~2 months in arrear. Currently using a single aggregate crime rate. Query by ward polygon or LSOA list.
- **Currency:** Monthly. Currently up to ~March 2026.
- **Endpoints also available:**
  - `GET /outcomes-at-location` — charge / caution / no further action per crime
  - `GET /stop-and-search` — stop & search by area

### 9. NOMIS BRES — Employment by Industry at LSOA
- **Dataset ID:** `NEWBRES6PUB`
- **API:** `https://www.nomisweb.co.uk/api/v01/dataset/NEWBRES6PUB.data.json`
- **Key:** None. Open.
- **What it adds:** Employees by 5-digit SIC2007 industry at LSOA level. Aggregate to ward via City Observatory LSOA→ward lookup (`lsoa-2021-to-ward-2022-to-constituency-2024-to-la-best-fit`). Shows sectoral composition — who works in what industries and where. Updated annually (latest: 2023).

### 10. NOMIS Additional Claimant Datasets
- `NM_1_1` — JSA claimants with rates (ward level, historical pre-UC)
- `NM_68_1` — All working-age benefit claimants (ward level)

---

## Tier 3 — Context / Requires Processing

### 11. DfE School Performance (KS4 / GCSE)
- **Source:** `https://explore-education-statistics.service.gov.uk/api/`
- **Granularity:** School-level. Ward requires joining school postcodes to ONS postcode-ward lookup (NSPL).
- **What it adds:** Attainment 8, Progress 8, EBacc, disadvantaged pupil gap — ward-level educational attainment proxy.
- **Approach:** Annual CSV download + server-side postcode join, not a live API.

### 12. City Observatory — ICP Health Outcomes at Ward
Datasets confirmed available at Birmingham & Solihull ward level:
- `emergency-admissions-for-self-harm-icp-outcomes-framework-birmingham-and-solihull`
- `under-75-mortality-from-acute-myocardial-infarction-icp-outcomes-framework-birmingham-and-solihull-wards`
- `healthy-life-expectancy-male-icp-outcomes-framework-birmingham-and-solihull-wards`
- `child-mortality-rate-icp-outcomes-framework-birmingham-and-solihull-wards`
- `year-6-prevalence-of-overweight-including-obesity-3-years-data-combined-birmingham-wards`
All via same City Observatory ODS API. No key.

### 13. City Observatory — Housing at Ward
- `overcrowded-households-percentage-birmingham-wards` — % overcrowded
- `overcrowded-households-percentage-wmca-wards-2025` — updated 2025 boundaries
- `council-owned-housing-stock` — BCC social housing stock (property level, ward-geocoded)

### 14. City Observatory — NEET + Apprenticeships (LAD level only)
- `percentage-neet-16-17-year-olds-wmca` — NEET rate 16-17 year olds
- `apprenticeship-starts-under-19-wmca` — apprenticeship starts
- `apprenticeship-achievements-under-19-wmca` — apprenticeship completions
Note: LAD level only, not ward.

### 15. TfWM Smartcard Travel Passes (LSOA)
- **Source:** `data-tfwm.opendata.arcgis.com`
- **What it adds:** Actual public transport usage at LSOA level (December 2024). Aggregatable to ward. Transport access is a real employment barrier in outer wards.

---

## Geographic Lookup Datasets (needed for LSOA→ward joins)

Both available via City Observatory ODS API, no key:

| Dataset | Purpose |
|---|---|
| `lsoa-2021-to-ward-2022-to-constituency-2024-to-la-best-fit` | LSOA 2021 → Ward 2022 → LAD best-fit lookup |
| `lsoa-2021-to-ward-2025-to-la-best-fit` | LSOA 2021 → Ward 2025 boundaries |
| `msoa-2011-to-msoa-2021-to-local-authority-district-2022-best-fit` | MSOA concordance |

---

---

## Education Deep-Dive (confirmed 2026-05-28 via live API calls)

### Registration / API Key Summary — Education Sources

| Source | Key / Account Required? | Notes |
|---|---|---|
| Birmingham City Observatory | **No** | ODS v2.1, fully open |
| EES Public API (`api.education.gov.uk/statistics/v1`) | **No** | 20 publications exposed; no auth |
| NOMIS Census 2021 bulk ZIP download | **No** | Direct ZIP, no session needed |
| Ofsted monthly CSV | **No** | Direct download, updated monthly |
| DfE EES website ZIP download | **No** | Browser download, no login |
| GIAS bulk download | **No registration**, but browser session required | Direct curl returns 403; must download via website |
| DfE NEET LA figures | **No** | GOV.UK Excel release |
| NARTs (FE achievement rates) | **No** | Via EES supporting files |

**Every education source is free and open. No accounts needed.**

---

### Ward-Level Education Data (directly usable)

| Indicator | Source | Dataset ID / URL | Currency |
|---|---|---|---|
| Qualification distribution — 8 levels (count + %) | NOMIS TS067 bulk ZIP | `nomisweb.co.uk/output/census/2021/census2021-ts067-extra.zip` → filter E05011xxx | Census 2021 |
| Same qualification data (pre-formatted %) | City Observatory | `census-2021-highest-level-of-qualification-birmingham-wards` | Census 2021 |
| IMD 2025 education & skills domain rank + decile | City Observatory | `imd-indices-of-deprivation-2025-wmca-wards-2024` | 2025 |
| IMD 2019 education & skills rank + decile | City Observatory | `deprivation-2019-education-and-skills-birmingham-postcodes` (postcode→LSOA→ward join) | IMD 2019 |
| SEN per school with `ward_name` field pre-populated | City Observatory | `sen-school-level-underlying-data` | 2023/24 |

**Sample confirmed data (NOMIS TS067, live):**
- Alum Rock: 37.2% no qualifications, 18.4% Level 4+
- Acocks Green: 25.9% no qualifications, 27.1% Level 4+
- Bordesley Green: 35.8% no qualifications, 18.2% Level 4+

---

### School-Level Data (geocodable to ward via postcode)

All sources include school postcodes → join to ONS NSPL or City Observatory `lsoa-2021-to-ward-2025-to-la-best-fit` to get ward codes.

| Indicator | Source | Coverage | Currency |
|---|---|---|---|
| Ofsted overall grade (1-4), quality of education, behaviour, leadership, EYFS, sixth form | Ofsted monthly CSV (direct download, no key) | 443 Birmingham schools; 264 with current OEIF grade | Apr 2026 |
| KS4: Attainment 8, EBacc APS, % grade 5+ Eng+maths, Progress 8 | EES API `key-stage-4-performance` school-level dataset | All Birmingham secondary schools | 2024/25 |
| KS2: % expected standard, % higher standard, progress measures | EES API `key-stage-2-attainment` school-level dataset | All Birmingham primary schools | 2024/25 |
| Pupil numbers, FSM %, ethnicity, SEN %, EAL % | DfE `school-pupils-and-their-characteristics` (EES ZIP) | All Birmingham schools | Jan 2025 |
| SEN headcount by EHC plan / SEN support, primary need (13 categories) | City Observatory `sen-school-level-underlying-data` | Birmingham schools with `ward_name` | 2023/24 |

**Birmingham confirmed figures (EES API, live):**
- Birmingham 2024/25 Attainment 8: 45.7 (all pupils), 39.8 (disadvantaged), 51.2 (not disadvantaged)

---

### LA-Level Education Data (Birmingham as single data point)

| Indicator | Source | Currency |
|---|---|---|
| KS4 performance (170 indicators) by disadvantage status | EES API `key-stage-4-performance` | 2024/25 |
| KS2 % expected / higher standard, progress, disadvantage gap index | EES API `key-stage-2-attainment` | 2024/25 |
| Pupil absence rate, persistent absence, by reason | EES API `pupil-absence-in-schools-in-england` (18 years of history) | 2024/25 |
| SEN pupils by provision type, need, phase, ethnicity | EES API `special-educational-needs-in-england` (also by 9 Birmingham PCONs) | 2024/25 |
| Permanent exclusions + suspensions | EES ZIP download only (not in API yet) | 2023/24 |
| NEET % 16-17 year olds | City Observatory `percentage-neet-16-17-year-olds-wmca` + EES NEET LA figures (Excel) | 2020 (City Obs) / 2024 (EES) |
| Apprenticeship starts/achievements U19 and 19-24 | City Observatory WMCA datasets | 2021/22 |
| % NVQ2+ / NVQ3+ / NVQ4+ aged 16-64 | City Observatory WMCA datasets | APS-based |
| % 19yr olds qualified Level 2 / Level 3 | City Observatory WMCA datasets | 2016/17 |
| % pupils on FSM | City Observatory WMCA datasets | 2016/17 |
| FE participation + achievement rates by sector | EES `further-education-and-skills` (Regional / devolved area) | 2023/24 |
| NARTs — FE provider achievement rates (geocodable) | EES `further-education-and-skills` supporting files | 2023/24 |

---

### What Can Be Built — Education View

**1. Ward Skills Map** (pure ward-level, no geocoding)
- Choropleth: % no qualifications / % Level 4+ per ward
- Bar chart: full 8-level qualification breakdown per ward
- Compare wards — pick any two
- Source: NOMIS TS067 ZIP or City Observatory

**2. Education Deprivation Overlay** (ward-level, no geocoding)
- IMD 2025 education domain rank map — how deprived is each ward on skills/education specifically
- Correlate with employment deprivation (both already in IMD 2025 ward dataset)
- Source: City Observatory `imd-indices-of-deprivation-2025-wmca-wards-2024`

**3. School Performance per Ward** (requires postcode→ward geocoding, one-time server-side join)
- Map: each ward shows count of schools, average Ofsted grade, average Attainment 8
- Ward drill-down: list all schools in the ward with Ofsted grade + KS4/KS2 performance
- Flag: % of ward's schools that are Good/Outstanding vs Requires Improvement/Inadequate
- Secondary focus: disadvantaged pupil attainment gap per ward
- Source: Ofsted CSV + EES API KS4/KS2, joined on URN, geocoded via school postcode

**4. SEN Intelligence per Ward** (ward_name field pre-populated — no geocoding)
- Ward-level: total EHC plan pupils, % of pupils on SEN support
- Breakdown by 13 primary need categories (ASD, SEMH, SLCN, etc.)
- Source: City Observatory `sen-school-level-underlying-data`

**5. Birmingham LA Benchmarking Panel** (LAD level, no ward)
- Attainment 8 over time vs national / West Midlands / statistical neighbours
- KS2 % meeting expected standard trend (18 years of absence data available as context)
- Pupil absence rate trend
- Disadvantaged gap: Birmingham vs England, 2024/25 live
- Source: EES API, fully live with annual revalidation

**6. NEET + Pathways Panel** (LAD level)
- NEET % 16-17 year olds trend
- Apprenticeship starts by age group trend
- Source: City Observatory + EES NEET LA figures

---

### Key Architectural Notes

- **Ofsted CSV**: Download server-side at build time, cache as JSON. Filter `Local authority = "Birmingham"`. Join to EES school data on URN.
- **EES API**: POST queries work cleanly. Birmingham KS4 location ID = `wOGbx`, KS2/absence = `emDuS`. Revalidate annually.
- **NOMIS TS067 ZIP**: Fetch server-side, unzip in-process (no unzip binary needed — use `fflate` or `jszip`), filter E05011xxx rows, serve as static JSON. One-time fetch, no key.
- **School postcode→ward**: Use City Observatory `lsoa-2021-to-ward-2025-to-la-best-fit` lookup (same API already in use). Build a postcode→ward map at startup.
- **SEN data**: City Observatory API, `ward_name` field pre-populated — no geocoding step.

---

## Known Gaps (data does not exist at ward level publicly)

- **Earnings / wages** — ASHE median wages are LAD-level only. No ward-level earnings data is published anywhere publicly.
- **Annual Population Survey employment rate** — LAD-level only on NOMIS.
- **Live vacancies** — no free ward-level vacancy data. Indeed/Reed are not open APIs.
- **Real-time labour market flows** — job starts / separations not published below LAD.

---

## API Reference Summary

| Source | Base URL | Key Required | Notes |
|---|---|---|---|
| Birmingham City Observatory | `https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/` | No | ODS v2.1, CORS-enabled |
| NOMIS | `https://www.nomisweb.co.uk/api/v01/` | No (optional for higher rate limits) | JSON via `.data.json` suffix |
| Police.uk | `https://data.police.uk/api/` | No | West Midlands force: `west-midlands` |
| DWP Stat-Xplore | `https://stat-xplore.dwp.gov.uk/webapi/rest/v1/` | Yes (free registration) | `APIKey` header |
| ONS Explore | `https://api.ons.gov.uk/v1/` | No | Mainly LAD level |
| Fingertips/PHE | `https://fingertips.phe.org.uk/api/` | No | Ward level via City Observatory instead |
| DfE EES | `https://explore-education-statistics.service.gov.uk/api/` | No | School-level; ward requires postcode join |
| TfWM ArcGIS | `https://data-tfwm.opendata.arcgis.com/` | No | ArcGIS Hub |
