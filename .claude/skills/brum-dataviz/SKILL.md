---
name: brum-dataviz
description: >-
  How to choose and build the RIGHT visualization for a new dataset in the
  brum-dashboard (Ozzy) app, like a data scientist: a form-selection table
  (data's job → chart type), the validated colour palettes, the honesty
  conventions (gaps, geography banners, checksums), and the proven components
  already in this repo to clone. Use BEFORE designing any new dashboard, chart,
  graph, or view — triggers on: "visualize", "what chart", "build a dashboard
  for", "show this data", "graph this", "new view", "best way to present".
---

# Choosing & building visualizations (Ozzy / brum-dashboard)

Work like a data scientist: **probe the data first, pick the form from the data's
job, colour last (computed, not eyeballed), state the truth on-face.**

## 0. Probe before designing
Never design views from a dataset's title. First verify: geography level (ward /
constituency / LA / GB), series span and gaps, whether values are native or need
derivation, boundary vintage (2024 constituencies E14001xxx vs old; 69 wards
E05011118–E05011186), and whether the source itemises everything its totals contain
(DWP workbooks often don't — see `dwp-money-sources` memory). What exists determines
which forms are honest — e.g. no long history on current boundaries ⇒ no trend view.

## 1. The form-selection table (data's job → chart)

| The reader must… | Form | Proven implementation to clone |
|---|---|---|
| Compare magnitude across units | ranked bars + sortable table | `HousingBenefitView` bars, any `*Table.tsx` |
| See part-to-whole (one moment) | stacked horizontal bars; mosaic/one-level treemap for budget shares | `UcCombinedComposition`, `BenefitsBillView` mosaic |
| See composition **over time** | stacked area, ≤7 series + "Other"; **streamgraph** when 5–15 categories × 10+ points and story > precision | `BillHistoryChart` (Chart.js), `PipStream` (hand-rolled silhouette SVG) |
| See **rank** change over time | bump chart, emphasis on the biggest movers | `PipBump` |
| Compare before → after per item | dumbbell (one hue, two shades; red/green polarity for worsened/improved) | `CpDumbbells`, PIP Mix Shift |
| See a **distribution's shape** across units | dot strip (deterministic binning, benchmark rules) | `CpStrip` |
| Compare a grid of magnitudes | heatmap, **each column on its own scale** | `ConMoneyDashboard` heatmap tab |
| Follow one entity vs context | emphasis line (entity accent, context gray) | `CpDetailPanel` EmphasisLine |
| Compare many entities' trends | small multiples, **uniform scale** | `BillSmallMultiples`, ConMoney UC Trend |
| See geographic pattern | Leaflet choropleth **at the data's true geography only** | `CpMap` (wards), `TwoChildMap`/`ConMoneyMap` (constituencies), `HbMap` (boroughs) |
| Lead with one number | hero figure + facts panel | `hb-headline` block |
| Show a tiny inline trend | sparkline column in a table | `Spark` in `ClaimantTable`/`CpTable` |

Multi-view rule: give each dashboard 3–5 sub-tabs mixing forms (table + one
composition + one change + map). Table first, Map last. Every chart has a table twin.

## 2. Colour — computed, never eyeballed
- Sequential (magnitude): the signed-off 10-step ink ramp `RAMP` in `lib/constants.ts`.
- Categorical, benefits domain (validated, all checks pass): UC `#2a55bf` ·
  State Pension `#d99a00` (heraldic gold) · Housing Benefit `#1f7a33` · PIP `#b01225`
  (herald red) · ESA `#4a3aa7` · "Other" always de-emphasis gray `#8a8f99`.
- Categorical, generic 8 slots (the dataviz skill's validated reference):
  `#2a78d6 #1baf7a #eda100 #008300 #4a3aa7 #e34948 #e87ba4 #eb6834`.
- New palette? Invoke the bundled **dataviz** skill and run its
  `scripts/validate_palette.js` — raw heraldic block colours FAIL as data series
  (too dark / low chroma); snap to lighter same-hue steps until it passes.
- More than ~7 meaningful categories → fold the tail into "Other", facet into small
  multiples, or use a table. Never generate a 9th hue. Text never wears series colour.

## 3. Non-negotiables (learned the hard way here)
- **No dual axes.** Two scales → two charts, small multiples, or an indexed/share ratio
  (e.g. Birmingham ÷ GB from the same workbook needs no deflator).
- **A data gap is a labelled element, never a white hole**: render the real total as a
  neutral "Not itemised by DWP" band with the reason in tooltip + caption
  (`BillHistoryChart`), or a withheld note (`BillSmallMultiples` anomalies). Never
  interpolate or estimate the missing split.
- **Geography banner** (`hb-nowward`) on every view whose data is coarser than wards,
  stating the level and that finer data does not exist.
- **State nominal vs real** on-face; prefer real (2025/26 prices) when the source has it.
- Growth baselines must be honest: never measure growth from a benefit's launch year
  (near-zero base) — pick a mature baseline and say so in the caption. Prefer
  **share-of-total dumbbells** to raw growth when the whole pot grew.
- Selective direct labels (extremes/endpoints), never a number on every point;
  solid hairline grids; tooltips enhance, never gate; ≥24px hit areas.
- Brand exception (documented): hero figures use the serif (Baskervville) —
  editorial identity overrides the generic sans-hero rule.

## 4. Tools in this repo (all npm, self-hosted; no CDN)
- **Chart.js 4** — time-series lines/stacked areas with free crosshair tooltips
  (dynamic-import pattern in `QualBars`/`BillHistoryChart`).
- **Hand-rolled inline SVG** — everything else (strips, dumbbells, bump, sparklines,
  small multiples, streamgraph). The silhouette streamgraph layout + Catmull-Rom
  smoothing live in `PipStream` (~30 lines, no d3 needed).
- **Leaflet** — choropleths; always `scrollWheelZoom: true` and a full-height wrapper
  (`height:'100%'` on the position:relative wrapper). Boundary geojsons in
  `public/data/` (wards, constituencies, WM boroughs) are value-free reference
  geometry harvested from official sources.
- New layout maths (force, treemap-squarify) → prefer hand-rolling small algorithms
  or the tiny MIT `d3-shape`/`d3-hierarchy` (no DOM) — never a heavy chart framework.

## 5. Data-integrity plumbing every new view must join
Fetch script → `proposals/` → human Accept in `/review` → `public/data/` (the wall);
provenance in `lib/sources.ts` linking the EXACT source file (not just its page);
source workbooks archived under `archive/`; checksums that refuse to publish on
drift (sum components vs the source's own totals; cross-check independent parses).
The playbook for ward datasets is the `brum-dataset-dashboard` skill.
