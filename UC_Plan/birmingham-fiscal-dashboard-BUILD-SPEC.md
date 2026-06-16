# Build Spec — Birmingham Ward Net Fiscal Balance Dashboard

> **For the Claude Code agent.** This is the authoritative spec. Build to it. Where it says MUST, treat it as a hard requirement. A visual reference prototype already exists (`birmingham-fiscal-dashboard.jsx`) — match its structure and behaviour, but apply the project's existing theme (see §7, colours deliberately omitted here).

---

## 1. Goal

Build a reproducible data pipeline plus an interactive dashboard that shows, for each **Birmingham ward**:
1. **Benefit spend per head, broken down by benefit type** (the granular view).
2. **Net fiscal balance per head** — revenue raised minus (benefit spend + service spend) — i.e. whether the ward is a *net contributor* or *net recipient*.

The net-balance figure is the headline. Benefit spend on its own is a **cost**, not a profit/loss; it only becomes a net position once revenue is subtracted. The pipeline MUST therefore model both sides.

---

## 2. What you're building (two parts)

**A. Data pipeline** — fetchers + transforms that pull from the sources in §4, compute the model in §5, and emit a single clean dataset (`data/processed/wards.json`) that the dashboard consumes. Must be re-runnable end to end.

**B. Dashboard** — a single-page interactive app (the existing prototype is React; keep that unless the project already standardises on something else). Reads `wards.json`. No backend required for v1; the processed JSON can be a static asset.

---

## 3. Setup & secrets

- Secrets live in `.env` (git-ignored). Provide a committed `.env.example`.
- The **only required secret** is the DWP Stat-Xplore API key:
  ```
  STATXPLORE_API_KEY=your_key_here
  ```
- Optional: `NOMIS_API_KEY` (raises rate limits; Nomis works without it).
- **Never** hardcode keys or commit them. **Never** log the key. Load via `process.env`.
- Stat-Xplore auth: send the key in an **`APIKey` header** on every request to `https://stat-xplore.dwp.gov.uk/webapi/rest/v1`. It is rate-limited — cache every response to disk (`data/raw/`) and don't re-fetch unchanged queries.

---

## 4. Data sources & access

| Source | Feeds | Access | Auth |
|---|---|---|---|
| **DWP Stat-Xplore** | Benefit caseloads by ward (UC, PIP, DLA, AA, Pension Credit, State Pension, Carer's, Housing Benefit) | REST API, `…/rest/v1`, `/schema` + `/table` | **API key** (`APIKey` header) |
| **Nomis** | Ward population by age; Census 2021 economic activity | REST API, `nomisweb.co.uk/api/v01` | None (optional key) |
| **ONS Open Geography Portal** | Ward↔LSOA↔LA lookups + boundaries (GeoJSON) | REST / download | None |
| **DfE Explore Education Statistics** | School-age children per ward | REST API | None |
| **DWP Benefit Expenditure & Caseload Tables** | £ outturn by LA/constituency (calibration target) | File (ODS/XLSX) | None |
| **HMRC Child Benefit statistics** | Child Benefit recipients/children | File | None |
| **HMRC subnational Income Tax & NI** | Revenue side (modelled split base) | File | None |
| **VOA Council Tax band counts** | Council Tax raised by ward | File (CSV/ODS) | None |
| **HM Treasury Country & Regional Analysis (CRA)** | Service spend by region/function | File (ODS) | None |
| **ONS Country & Regional Public Sector Finances** | Regional net-balance anchor (West Midlands) | File (XLSX) | None |
| **ONS Effects of Taxes & Benefits (ETB)** | Age / contributor ratios for caveats | File (XLSX) | None |
| **NHS England ICB allocations** | Health spend (services) | File | None |
| **Birmingham City Council — Council Tax Support** | Local CTS by ward | FOI / council open-data portal | None (manual; may lag) |

**File sources have no API.** Download the relevant ODS/XLSX once and commit them to `data/raw/` so builds are reproducible; don't scrape live. Note their URLs are versioned annually.

**Stat-Xplore query workflow:** build each table in the Stat-Xplore web UI → `Download Table` → `Open Data API Query (.json)` → save into `pipeline/queries/`. The pipeline POSTs these JSON bodies to `/table`. Geography dimension MUST be set to **ward**; time to **latest**.

---

## 5. The model — entities & calculations

Per ward `w`, benefit type `b`, age band `a ∈ {children, working, pension}`. All money is **£ per head, per financial year** unless stated.

### Layer 1 — Benefit spend per type
```
BenefitSpend[w,b] = Caseload[w,b] × AvgAnnualAward[b]
```
- `Caseload[w,b]` — REAL, from Stat-Xplore (ward).
- `AvgAnnualAward[b]` — prefer Stat-Xplore amount-paid measure where it exists (UC); else national average award from DWP Expenditure Tables ÷ national caseload (ESTIMATE — tag it).

### Layer 1b — Calibration (MUST)
Scale ward results so they sum to the **real Birmingham LA total** from the DWP "expenditure by local authority" table:
```
ScaleFactor       = DWP_LA_Total / Σ_w Σ_b BenefitSpend[w,b]
BenefitSpend[w,b] = BenefitSpend[w,b] × ScaleFactor
TotalBenefitSpend[w] = Σ_b BenefitSpend[w,b]
```

### Layer 2 — Benefit spend per head
```
BenefitSpendPerHead[w] = TotalBenefitSpend[w] / Population[w]   // Population REAL (ONS/Nomis)
```

### Layer 3 — Revenue per head
```
Revenue[w] = IncomeTaxNI[w] + VATandDuties[w] + CouncilTax[w] + BusinessRates[w]
```
- `CouncilTax[w]`, `BusinessRates[w]` — REAL (VOA bands × charge; NNDR).
- `IncomeTaxNI[w]` — ESTIMATE: distribute regional HMRC receipts by a ward earnings proxy (Census economic activity / occupation; ASHE).
- `VATandDuties[w]` — ESTIMATE: distribute regional indirect tax by a consumption proxy (population × income-adjusted spend).

### Layer 4 — Service spend per head (for net balance)
```
ServiceSpend[w] = Health[w] + Education[w] + SocialCare[w] + OtherServices[w]
```
- `Education[w]` — ~REAL: by school-age children (DfE).
- `Health[w]`, `SocialCare[w]` — ESTIMATE: distribute regional/ICB + CRA totals by ward **age profile** (+ deprivation for care).
- Uniformly-allocated national spend (defence, debt interest) is out of scope as a *ward differentiator*; if included, allocate strictly per capita as a constant and document it.

### Layer 5 — Net fiscal balance per head
```
NetFiscalBalance[w]        = Revenue[w] − (TotalBenefitSpend[w] + ServiceSpend[w])
NetFiscalBalancePerHead[w] = NetFiscalBalance[w] / Population[w]
```
**Sign convention (match ONS):** positive = surplus / net contributor; negative = deficit / net recipient.

### Layer 5b — Reconciliation (MUST)
Confirm `Σ_w NetFiscalBalance[w]` ties to the ONS **West Midlands** regional net fiscal balance, adjusting for "West Midlands ITL1 region ≠ Birmingham LA" (use the LA share). If it doesn't tie, the revenue/service allocation is wrong — surface a warning in the build log.

### Layer 6 — Age segmentation
Re-compute Layer 5 split by age band so each ward's position is explainable (pension-driven vs working-age vs children). Output per-ward age shares and a derived `driver` label.

---

## 6. Taxonomy & geography

**Benefit types** (series for the breakdown): Universal Credit; State Pension; Disability (PIP/DLA/AA); Child Benefit; Pension Credit; Carer's Allowance; Council Tax Support & other.

**Geography:** Birmingham wards. Confirm boundary vintage before fetching (default: the 69-ward 2018 set) and use the matching ONS ward↔LA lookup so every source aligns to the same codes. Out-of-scope for v1: devolved payments (Birmingham is in England).

**Output record shape (`wards.json`):**
```json
{
  "name": "Ladywood",
  "wardCode": "E05011151",
  "population": 24000,
  "age": { "children": 24, "working": 68, "pension": 8 },
  "benefits": { "universalCredit": 0, "statePension": 0, "disability": 0,
                "childBenefit": 0, "pensionCredit": 0, "carers": 0,
                "councilTaxSupportOther": 0 },
  "benefitPerHead": 0,
  "revenuePerHead": 0,
  "servicePerHead": 0,
  "net": 0,
  "provenance": { "benefits": "modelled", "revenue": "modelled", "population": "real" },
  "driver": "…short generated sentence…"
}
```
Compute `benefitPerHead` and `net` in code, never hardcode.

---

## 7. How it should look & behave

> Apply the project's existing theme. This spec defines **semantic colour roles** to map to your tokens, never hex values: `surplus` (net contributor), `deficit` (net recipient), `neutral/structure`, `revenue`, `services`, and a **7-step benefit category series**. Numbers SHOULD use a tabular/monospace face for alignment.

**Concept:** a fiscal *ledger* — each ward runs into the red (recipient) or the black (contributor) from a central zero spine. Spend boldness on that one signature element; keep the rest quiet.

### Layout (desktop → responsive)
- **Header**: eyebrow, title, one-line description.
- **Prototype/data-status banner**: states clearly which inputs are live vs modelled vs awaiting (drop once all data is real).
- **Ward control**: a `<select>` AND click-to-select on the main chart.
- **Main grid** (2 columns ≥900px, stack below):
  - **Left (hero):** *Net fiscal balance per head, by ward* — horizontal **divergent bars centred on £0**, sorted deepest deficit → highest surplus, each clickable, selected one highlighted. Axis labels at min / £0 / max. Footnote with the population-weighted average + the reconciliation note.
  - **Right (detail for selected ward):** big net figure + contributor/recipient badge; a 4-stat row (population, benefits/head, revenue/head, services/head); a **calculation bridge** (waterfall: Revenue − Benefits − Services = Net, dashed line at £0).
- **Second grid** (2 columns): **benefit breakdown** (ledger-style horizontal bars per benefit type, sorted desc, with total row); **age structure** (stacked bar) + the generated `driver` sentence + a line stating UC % vs State Pension % of spend.
- **Interpretation callout** (high-contrast block): the §8 caveat.
- **Provenance table**: every model layer with what / source / status dot (live / modelled / awaiting).
- **Footer**: source list + "figures illustrative until pipeline is live."

### Interaction & states
- Selecting a ward (chart click OR dropdown) updates every detail panel; keep them in sync.
- Bars animate width on data change; respect `prefers-reduced-motion`.
- **Loading / empty / error states** required: if `wards.json` is missing or a field is null, show a labelled placeholder, not a crash or a silent zero.
- Number formatting: GBP, whole pounds per head, true minus sign for negatives.

### Quality floor (MUST)
Responsive to mobile; keyboard-operable ward selection with visible focus; reduced-motion honoured; no layout shift on ward change.

---

## 8. Integrity rules (non-negotiable)

1. **Label every modelled figure as modelled.** Revenue and service splits are ward-level estimates, not official statistics. The UI MUST make real-vs-modelled legible (the provenance table + per-record `provenance`).
2. **Never present the State Pension (or a pension-heavy ward) as a "loss."** It's the largest transfer and goes to lifelong contributors.
3. **Always show the age split alongside the headline.** A "net recipient" ward usually reflects age structure and economic base, not residents' worth — the ETB data shows ~89% of retired vs ~46% of non-retired people live in net-recipient households. Build the §5 Layer-6 segmentation so this is visible, not buried.
4. **Reconcile to the regional total** and warn on failure (Layer 5b).
5. **Don't invent numbers.** Until a real source is wired, the field stays an explicit placeholder flagged in `provenance`, never a fabricated value presented as real.

---

## 9. Suggested structure
```
/data
  /raw          # committed downloads + cached Stat-Xplore responses
  /processed    # wards.json (pipeline output, dashboard input)
/pipeline
  /queries      # Stat-Xplore Open Data API query JSONs (from the UI)
  fetch_statxplore.*   # POST queries with APIKey header, cache to raw
  fetch_nomis.*        # population + age by ward
  fetch_files.*        # parse committed ODS/XLSX (DWP, HMRC, VOA, ONS, CRA)
  build_model.*        # Layers 1–6: calibrate, allocate, reconcile -> processed/wards.json
sources.yaml           # one entry per source: endpoint/url, geography codes, auth, output path
.env.example
/app                   # dashboard (reads processed/wards.json)
```

## 10. Build order
1. Scaffold + `.env.example` + `sources.yaml`.
2. Stat-Xplore fetcher: hit `/schema`, confirm key works, pull one ward caseload, cache it.
3. Nomis: ward populations + age.
4. Layer 1 + calibration to the DWP LA total → benefit side complete (real).
5. Council Tax / business rates (real) + modelled Income Tax/VAT → revenue side.
6. CRA / NHS / DfE → service side.
7. Layer 5 + reconciliation (5b) + Layer 6 → emit `wards.json`.
8. Dashboard against real `wards.json`; wire all states; apply theme.

## 11. Acceptance criteria
- `wards.json` regenerates from scratch with one command, using only `.env` secrets + committed raw files.
- Benefit totals reconcile to the published Birmingham LA expenditure figure (within rounding).
- Summed ward net balance reconciles to the ONS West Midlands figure (LA-share adjusted), or logs a clear warning.
- Every dashboard figure traces to a `provenance` status; no unlabelled estimate appears as fact.
- Dashboard is responsive, keyboard-navigable, reduced-motion-safe, and degrades gracefully on missing data.
- The interpretation caveat (§8.3) and age split are present on the default view.
```
