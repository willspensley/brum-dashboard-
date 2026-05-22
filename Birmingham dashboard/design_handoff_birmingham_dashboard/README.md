# Birmingham Employment Deprivation Dashboard — Claude Code Handoff

## What this is

A working prototype of an employment deprivation intelligence dashboard for Birmingham City Council. It visualises 68 wards across IMD 2025, NOMIS claimant count, Census 2021 inactivity, GVA 2022, and modelled estimates for youth unemployment, UC, qualifications, and vacancies.

**Status:** This is a *functional prototype*, not just a design mock. The HTML/JS files in this bundle **already run** — they're a vanilla JS single-page app that fetches three public APIs live (with embedded fallbacks) and renders six views with Chart.js and Leaflet.

You are free to either:
- **Continue iterating it as a static site** (just edit the files and serve with `python3 -m http.server`), or
- **Port it into a real framework** (Next.js, SvelteKit, Astro) for deployment under a council subdomain and authenticated APIs.

Both paths are valid. See "Suggested next steps" below.

---

## Fidelity

**High-fidelity functional prototype.** All colours, typography, spacing, chart configs, fetch logic, and view interactions are final and tested. The editorial paper aesthetic (Instrument Serif headlines + IBM Plex Mono data, warm paper background, BCC red ink accents, ASCII flourishes as Birmingham nods) is intentional and signed off — preserve it.

---

## Files in this bundle

| File | Role |
|---|---|
| `birmingham_dashboard_v3.html` | HTML shell — layout, CSS variables, all styles, DOM scaffolding |
| `dashboard-data.js` | Embedded fallback dataset (68 wards) — used when APIs are unreachable |
| `dashboard-app.js` | All application logic: fetches, normalisation, view rendering, detail panel, drawer |
| `birmingham_dashboard.html` | Original v1 (3 tabs, dark theme) — for reference only |
| `birmingham_dashboard_v2.html` | Earlier v2 (dark BCC theme, ASCII bull) — for reference only |
| `Birmingham Employment Dashboard.html` | Standalone bundled v2 (single file, all assets inlined) |

Run it locally:
```bash
cd design_handoff_birmingham_dashboard
python3 -m http.server 8080
# open http://localhost:8080/birmingham_dashboard_v3.html
```

---

## Architecture (current)

```
┌─────────────────────────────────────────────────────┐
│  birmingham_dashboard_v3.html  (DOM + CSS)         │
│  ├── <script src="dashboard-data.js">              │
│  │     window.FALLBACK = [ ...68 ward objects ]    │
│  └── <script src="dashboard-app.js">               │
│        - initDashboard() orchestrates pipeline     │
│        - fetchNOMIS / fetchIMD / fetchGVA          │
│        - mergeData → normalise → assign quadrants  │
│        - renderGrid / List / Scatter / Matrix /    │
│          Map / Compare / Detail                    │
└─────────────────────────────────────────────────────┘
        │            │             │
        ▼            ▼             ▼
   NOMIS.gov.uk   cityobservatory.   services1.arcgis
   /api/v01/      birmingham.gov.uk  (ONS ward
   NM_162_1       /api/explore/v2.1  boundaries)
   (public CORS)  (public CORS)      (public CORS)
```

All three live APIs are **public and CORS-enabled** — no proxy needed for what's here today.

---

## Data sources

### Live (CORS-enabled, no auth)

| Source | Endpoint | Returns | Cadence |
|---|---|---|---|
| **NOMIS NM_162_1** | `https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.json?geography=1946157186TYPE448&date=latest&gender=0&age=0&measure=2&measures=20100` | Claimant count % per ward, latest month | Monthly |
| **Birmingham City Observatory — IMD 2025** | `/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-lsoa-2021/records?where=lad22cd='E08000025'` | Employment domain score per LSOA, aggregated to ward by mean | Annual (next IMD ~2028) |
| **Birmingham City Observatory — GVA 2022** | `/api/explore/v2.1/catalog/datasets/gross-value-added-gva-all-industries-birmingham-wards/records?where=year=2022` | Workplace GVA £m per ward, divided by Census population for per-head | Annual |
| **ONS Ward Boundaries 2022** | `services1.arcgis.com/.../Wards_December_2022_Boundaries_UK_BGC` | GeoJSON polygons for Birmingham wards | Quasi-static |

### Embedded (no live endpoint)

| Source | Origin | Why embedded |
|---|---|---|
| Census 2021 inactivity (long-term sick) | ONS TS066 | No ward-level live API |
| Modelled estimates (youth unemp, UC %, no quals, vacancies) | Synthesised | See "Modelled values" below |

### Not connected (require a server-side proxy)

| Source | Reason | Recommended approach |
|---|---|---|
| **DWP Stat-Xplore** (real UC caseload) | Requires API key | Cloudflare Worker / Vercel Edge function holds key, dashboard hits proxy |
| **ONS API+** (real youth unemployment) | Requires API key | Same |
| **Companies House** (ward-level business density) | Requires API key | Same |

**A "server-side proxy" is a 30-line Node/Python function** that holds the API key, forwards browser requests to the keyed API, and returns the response. The key never reaches the browser. Cloudflare Workers, Vercel Edge Functions, AWS Lambda — all free-tier friendly for this scale.

---

## Modelled values — replace with real data when proxy is set up

These are deterministically synthesised from ward composite score using a seeded hash (so they're stable across refreshes but **not real data**):

| Field | Function in `dashboard-app.js` | Replace with |
|---|---|---|
| `earnings` (median resident) | `synthEarnings(w)` | ONS ASHE workplace/resident earnings (LAD-level only — ward needs DWP RTI) |
| `gva` (when API fails) | `synthGva(w)` using `gva_band` in fallback data | City Observatory GVA endpoint |
| `population` (when API fails) | `synthPop(w)` | Census 2021 TS001 |
| `extras().youth_unemp` | seeded from composite | NOMIS NM_162_1 with `age=2` (16–24) |
| `extras().uc_pct` | seeded from composite | DWP Stat-Xplore (keyed) |
| `extras().no_quals` | seeded from composite | Census 2021 TS067 (no live ward endpoint — embed or proxy ONS) |
| `extras().vacancies` | seeded from composite | ONS Vacancy Survey (LAD-level, would need disaggregation model) |

Each synthesised value is labelled "est" or "(modelled estimates)" in the UI — preserve those labels until real data lands.

---

## Views (six tabs)

### 1. Grid
- 68 ward cards in responsive auto-fill grid, sorted by composite score desc
- Each card: name, big composite (0–100), 3 thin coloured bars showing IMD/claimant/inactivity normalised
- Coloured top stripe per card uses the 10-step ink ramp
- Hover lifts card; click selects → detail panel opens
- **Scroll:** view scrolls within the `.panel-body` flex container, not the page

### 2. Table
- Ranked list with columns: rank, ward, IMD%, claimant%, inactivity%, composite bar+number
- Same scroll behaviour as grid

### 3. Labour scatter
- Chart.js bubble chart: X = IMD employment %, Y = claimant %, bubble size = inactivity
- Click bubble → select ward

### 4. Economic matrix
- The flagship view. X = GVA per head (£k), Y = IMD employment score
- Dashed median lines split chart into 4 quadrants:
  - **Top-right** "Prosperous" — high GVA + low deprivation (green)
  - **Top-left** "Workhorse" — high GVA + high deprivation (purple)
  - **Bottom-right** "Commuter belt" — low GVA + low deprivation (blue)
  - **Bottom-left** "Disadvantage" — low GVA + high deprivation (red)
- Quadrant filter chips above chart (click to isolate)
- Sortable ranked table below chart
- Bubble size = population
- Each ward gets a `quadrant` assignment used in the detail panel narrative

### 5. Map
- Leaflet choropleth, light CartoDB tiles, ward polygons coloured by composite decile
- Hover tooltip, click → select ward
- Legend in bottom-left
- Loads ward boundaries on first open (~600KB GeoJSON)

### 6. Compare
- Pin up to 2 wards via "Pin for Compare" button in detail panel
- Side-by-side diff with green/red colouring on whether each metric is better/worse than the other ward
- Includes: composite, decile, claimant, IMD, inactivity, GVA, earnings, quadrant

### Detail panel (right column)
Persistent right column showing selected ward:
- Big serif name + ward code + decile + population
- Quadrant banner — coloured strip with the editorial narrative (computed by `quadrantNarrative(w)`)
- 4 chips: GVA/head + rank, IMD + rank, Claimant (LIVE/CACHED pill), Median earnings
- Pin button
- Trend chart (Chart.js line) — toggle 12M / 2019–NOW (with COVID annotation)
- Position vs Birmingham average meters with reference line for GVA/earnings
- Additional indicators 2×2 grid (modelled estimates labelled)
- Composite weights breakdown

---

## Design tokens

### Colour
```css
--paper:     #f5f3ee;   /* main background */
--paper2:    #ede9e1;   /* card secondary */
--surface:   #ffffff;   /* white surfaces */
--ink:       #0e0f11;   /* primary text */
--muted:     #6b6760;
--muted2:    #908a82;
--border:    rgba(14,15,17,0.12);
--border2:   rgba(14,15,17,0.22);

/* Quadrant tones */
--q-prosp:   #1a3a2a;   /* dark green */
--q-work:    #2a1a3a;   /* dark purple */
--q-comm:    #1a2a3a;   /* dark blue */
--q-disad:   #3a1a1a;   /* dark red */

/* 10-step disadvantage ramp (paper-friendly, derived from #3a1a1a) */
#7a8270 #7a7a5e #7d6e4e #7e5e40 #7d4e36
#73402e #683428 #5b2a23 #4d211d #3a1a1a
```

### Type
```
--serif: 'Instrument Serif', Georgia, serif;   /* headlines, big numbers, italic narrative */
--mono:  'IBM Plex Mono', monospace;            /* data, labels, ASCII */
--sans:  'IBM Plex Sans', system-ui, sans-serif;/* body, ward names */
```

Sizes: serif ranges 13–30px; mono 9–11px (labels); sans 11–13.5px (body).

### Spacing
4 / 6 / 8 / 10 / 14 / 18 px scale. No rounded corners anywhere (`border-radius:0`) — the design is intentionally hard-edged like printed matter.

### Motifs
- ASCII bull in detail panel empty state
- ASCII "BIRMINGHAM" banner on loader with column-by-column reveal animation
- "FORWARD" watermark (Birmingham's motto) bottom-right of panel
- ASCII spinners (`⠋⠙⠹⠸⠼⠴⠦⠧`) used for the loader and map spinner
- Single BCC red badge in header `<span>▶ FORWARD</span>B·C·C`

These are **not optional** — they're the visual signature requested by the client. Keep them through any port.

---

## Suggested next steps for Claude Code

### Phase 1 — Move to a real framework
**Recommendation: Next.js 14 (App Router) + Tailwind.** Why:
- Server components for the live API fetches → no CORS surprises, faster TTFB
- Built-in API routes give you the proxy pattern for free (Phase 2)
- Tailwind expresses the dense token system cleanly; arbitrary values for the ramp
- Easy deploy on Vercel under a `data.bham.gov.uk` subdomain

File layout:
```
app/
  layout.tsx               — fonts, paper background, header
  page.tsx                 — server component, fetches all 3 APIs in parallel
  components/
    Header.tsx
    SourcesDrawer.tsx      — port toggleSources()
    StatsRow.tsx
    Tabs/
      Grid.tsx
      Table.tsx
      LabourScatter.tsx
      EconomicMatrix.tsx
      MapView.tsx          — 'use client', Leaflet stays browser-only
      Compare.tsx
    Detail/
      DetailPanel.tsx
      TrendChart.tsx       — 'use client', Chart.js stays browser-only
      QuadrantBanner.tsx
  lib/
    fetch-nomis.ts
    fetch-imd.ts
    fetch-gva.ts
    normalise.ts
    quadrants.ts
    synth.ts               — keep modelled-value functions here, labelled clearly
    fallback.ts            — keep the 68-ward embedded snapshot
  api/
    refresh/route.ts       — Phase 2 proxy endpoint
```

### Phase 2 — Add the keyed APIs via proxy routes
For each keyed API (Stat-Xplore, ONS API+, Companies House):
1. Get a key, put it in `.env.local` as `STATXPLORE_API_KEY=...`
2. Create `app/api/uc-stats/route.ts`:
   ```ts
   export async function GET(req: Request) {
     const res = await fetch('https://stat-xplore.dwp.gov.uk/...', {
       headers: { 'ApiKey': process.env.STATXPLORE_API_KEY! }
     });
     return Response.json(await res.json());
   }
   ```
3. Browser code fetches `/api/uc-stats` — key never leaves the server.

### Phase 3 — Production
- Set up Vercel + custom domain
- Add basic auth / SSO if council wants gated access
- Schedule a daily revalidation cron so NOMIS data is pre-cached on the server
- Add CSV export endpoint
- Add `og-image` route generating a screenshot of the current state for sharing

---

## CLAUDE.md guidance

A `CLAUDE.md` is included in this folder. Drop it at the root of your new project so future Claude Code sessions know the brief.

---

## What NOT to do during port

- **Don't replace the ASCII / BCC / FORWARD elements with generic gov-dashboard chrome.** They are the brand signature.
- **Don't switch the chart library from Chart.js to Recharts/Visx for "framework purity".** Chart.js works, the configs are tuned, the bundle is fine.
- **Don't add a hero section, "About this data" intro page, or onboarding modal.** The dashboard is for council analysts who land directly on the data.
- **Don't drop the paper aesthetic in favour of glassmorphism, gradients, or dark mode.** This is a deliberate editorial choice that holds the whole design together.
- **Don't hide the modelled-estimate labels.** The "est" tags on synthesised values are an honesty signal — keep them visible until real data replaces them.

---

## Open questions / known limitations

1. The City Observatory GVA endpoint slug used (`gross-value-added-gva-all-industries-birmingham-wards`) is a best-guess — verify against their live catalogue and adjust if needed.
2. Census population is fetched via an OpenDataSoft slug guess — same caveat.
3. The Map tab depends on ONS ArcGIS being up; consider bundling a simplified topojson as a fallback.
4. Print stylesheet is landscape A4, currently only renders the Table view. Council may want each tab printable.
5. No accessibility audit yet — colour contrast on the paper background is good for the ink ramp but the muted greys may not meet WCAG AA in all browsers.

Good luck.
