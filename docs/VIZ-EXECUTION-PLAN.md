# Execution plan — Money Over Time + Child Poverty dashboards

*2026-07-10. Research done: dataviz form-selection method applied, chart palette
computed and validated (not eyeballed), child-poverty series depth verified (10 annual
points per ward, 2015/16 → 2024/25). Frame: government money → people's pockets.*

---

## Design research — what the data's job demands

Method: pick the FORM from the data's job first, colour last, validate computationally.

| Data's job | Chosen form | Why not something else |
|---|---|---|
| "What does the bill look like today" | hero figure + mosaic + ranked bars (already built) | a pie past 6 segments is unreadable |
| "How did the bill change over 23 years" | **stacked area, 5 named benefits + Other** | >7 colour classes blur; 15 benefits → fold the tail |
| "Which benefit is rising/falling" | **small multiples** (one mini-line per benefit, direct-labelled endpoint + % change) | one big multi-line chart = spaghetti; dual axes are banned |
| "Is Birmingham taking a bigger slice of Britain's bill" | **single-series share line** (Birmingham £ ÷ GB £) | avoids per-head deflator/population problems; one axis, one honest ratio |
| "Where is child poverty worst" | choropleth + ranked table (existing pattern) | — |
| "How unequal is the spread across 69 wards" | **distribution strip** — 69 dots on one % axis, city-average rule, selected ward highlighted | a bar-per-ward hides the *shape* of inequality; the strip shows the 15%→65% chasm as a picture |
| "Which wards got worse over the decade" | **dumbbell (before→after per ward)** — 2015/16 dot → 2024/25 dot, one hue two shades, sorted by latest | the textbook form for before→after per item |
| "One ward's story" | detail-panel **emphasis line** — ward accent vs city average in gray | emphasis beats categorical when one series is the point |

**New view types this adds beyond maps + leaderboards:** stacked area (composition over
time), small multiples (per-benefit trends), share-of-nation line, distribution strip
(inequality shape), dumbbells (decade change), emphasis trend (ward vs city).

**Chart palette (validated, all checks pass):**
UC `#2a55bf` · State Pension `#d99a00` · Housing Benefit `#1f7a33` · PIP `#b01225` ·
ESA `#4a3aa7` · Other `#8a8f99` (de-emphasis gray, not a categorical slot).
Validator WARNs (red↔green CVD 11.9; gold contrast 2.39) are covered by the mandated
secondary encoding: 2px surface gaps between stacked segments, direct labels, legend,
and a table twin for every chart. Sequential (map/table tint) stays the signed-off
10-step ink ramp. Deliberate brand deviation: hero figures stay serif (Baskervville) —
the editorial identity overrides the generic sans-hero rule; documented here.

**Interaction rules applied everywhere:** crosshair+tooltip on lines/areas, per-mark
tooltip on dots/bars (Chart.js for the time charts — tooltips built in; plain SVG for
strips/dumbbells with ≥24px hit areas), no number-on-every-point, solid hairline grid,
every chart has a table view, container height includes the axis band.

---

## Build 1 — "The Benefits Bill" becomes Money Over Time

**Data:** extend `scripts/fetch-benefits-bill.mjs` to parse ALL year sheets
(2002-03 → 2024-25) of the DWP expenditure-by-LA workbook, not just the latest.
Because column layouts shift across years (UC/PIP don't exist early; legacy benefits
die), switch from fixed positions to **header-row label matching** (both rows parsed
with covered-cell handling so merged headers can't misalign). Per-year integrity
check: matched top-level components must sum to that year's own Total (±£1m) —
a failing year keeps its Total but drops components, with a console warning. Also
capture the GREAT BRITAIN row per year → Birmingham's share of the national bill.
Series for the stack: UC, State Pension, Housing Benefit, PIP, ESA + **Other =
Total − those five** (always real by construction). All £ nominal — stated on-face.

**Dashboard (sub-tabs on the existing Benefits Bill view):**
- **Today** — existing mosaic + ranked bars + £5.41bn hero (unchanged).
- **History** — the stacked area (23 years, 6 series, validated palette, legend +
  endpoint labels, crosshair tooltip). The story it will show, truthfully: the bill
  roughly tripling in cash terms; UC exploding from £0 (2013) to £1.81bn while
  Housing Benefit, ESA, IS and JSA drain into it; PIP's climb after 2013.
  Below it: **small multiples** — 8 mini-lines (UC, State Pension, HB, PIP, ESA,
  DLA, JSA, Pension Credit), each with endpoint value + Δ% badge.
- **vs Britain** — single line: Birmingham's % share of GB benefit spend, 2002→2025,
  with a reference note of its population share (~1.7–1.8%). If the share line sits
  above population share and rises, that's the honest "Birmingham takes an outsized
  and growing slice" chart; if flat, we show flat.
- Right column: headline panel (unchanged) + as-of/provenance.
- Banner stays: LA-level, real DWP accounts, no ward £ exists, nominal terms.

**Files:** extend fetch script; `BenefitsBillView` gains sub-tabs; new
`BillHistoryChart.tsx` (Chart.js stacked area), `BillSmallMultiples.tsx` (SVG),
`BillShareLine.tsx` (Chart.js). Proposal gains `history[]` + `gb_share[]`;
route/review already generic enough (add passthrough keys). Re-review required —
Accept republishes.

## Build 2 — Child Poverty by ward (new dashboard)

**Data:** new `scripts/fetch-child-poverty.mjs` —
`percentage-of-children-in-absolute-low-income-families-aged-0-15-birmingham-wards`
via exports endpoint, ALL years (69 wards × 10 years ≈ 690 records). Native ward %,
no derivation. Benchmarks from the companion `…-wmca` LA dataset if it carries
Birmingham-LA + England rows (verified at fetch; omitted if absent). Validation:
69/69 wards, latest year present, per-ward year count, min/max sanity
(Edgbaston ~15%, Bordesley Green ~65%).

**Dashboard (`app/child-poverty/components/`), sub-tabs:**
- **Table** — rank · ward · latest % (ink-ramp tint) · gap vs city average (derived,
  labelled) · Δ since 2015/16 · 10-year sparkline · bar.
- **Distribution** — the strip: one axis 0→70%, 69 dots (≥8px, jittered rows to
  avoid overlap), city-average rule + England rule (if sourced), hover tooltip per
  dot, selected ward in herald red. The inequality *shape* at a glance.
- **Change** — 69 dumbbells sorted by latest %: light dot (2015/16) → dark dot
  (2024/25), connector; wards that worsened get the red connector, improved get
  green-ink. Direct labels on the extremes only.
- **Map** — ink-ramp choropleth, scroll-zoom, full-height (existing pattern).
- **Detail panel** — chips (latest %, city rank, Δ decade, gap vs city avg) +
  emphasis line: this ward's 10-year path in red vs city average in gray + sources.
- Header: `69 wards · % of children 0–15 in absolute low income · 2024/25 · DWP/HMRC`.

**Files:** fetch script; `ChildPovertyDashboard/Table/Strip/Dumbbells/Map/DetailPanel`;
types; sources.ts entry; review REGISTRY entry; Dashboard shell nav (gated on accept).

## Order & verification
1. Build 2 first (self-contained, fastest to review), then Build 1 (bigger parse work).
2. Both land as **pending proposals** in /review — nothing publishes without Accept.
3. Verify: fetch logs (69/69, year counts, sum checks), tsc clean, /review renders
   each candidate, anti-pattern checklist pass, eyeball render.
4. No git commits without an explicit go-ahead.
