# Benefits & tax-expenditure dashboards — delivery plan

*Drafted 2026-07-08. Theme: where benefit spending concentrates in Birmingham, told truthfully
from official DWP/ONS data via City Observatory. Every dashboard goes through the
Review → Accept wall (`/review`); nothing publishes without a human sign-off.*

**Ground rules (unchanged):** official sources only · never fabricate/model a value presented
as fact · missing stays missing ("—") · derived values labelled · provenance on every metric ·
join on official ward codes E05011118–E05011186 · if data only exists at a coarser geography,
show it at that level and label the missing ward breakdown (the Housing Benefit pattern).

**Already delivered:** Universal Credit (uc-wards, live) · UC Claimants in Work (uc-employment,
live) · Housing Benefit LA-comparison + borough map (housing-benefit, **pending Accept in /review**).

---

## Phase 1 — Claimant Count by ward  ★ next build

**Datasets (verified live 2026-07-08):**
- `claimant-count-by-sex-birmingham-wards-latest` — ward-level (E05), **April 2026** (fresher
  than the UC dataset's Feb 2026). Carries BOTH a raw count and a **native "claimants as a
  proportion of residents aged 16–64" %** (no derivation needed), split Total/Male/Female.
- `claimant-count-birmingham-wards-5years` — ward-level counts by sex **and age band**
  (16–24 / 25–49 / 50+), ~5-year monthly series → real trend lines.

**Note:** these use the NOMIS-style schema (`geography_code`, `gender_name`, `measure_name`,
`obs_value`) — not the ODS `areaidentifier`/`value` shape — so the fetch script adapts, filtering
`measure_name` to separate count vs proportion. DWP rounds counts to the nearest 5 (footnote it).

**What it is for the story:** the classic "which wards depend most on out-of-work benefits"
measure — unemployment-related UC + JSA claimants as a share of working-age residents.

**How it looks:**
- **Table** (default): 69 wards ranked by % of 16–64 residents claiming; columns for count,
  %, and a 12-month sparkline. Ink-ramp row tint by intensity.
- **Map**: 69-ward choropleth on the ink ramp (existing `fetchWardBoundaries` + `RAMP` pattern).
- **Detail panel** (click a ward): 5-year trend line (pandemic spike visible), age-band bars
  (16–24 / 25–49 / 50+), male/female split, rank vs city average. ASCII bull empty state.
- Header: `69 wards · % of 16–64 residents claiming · Apr 2026 · DWP`.

**Build:** `scripts/fetch-claimant-count.mjs` → `proposals/claimant-count.proposal.json` →
components cloned from the UC set (`ClaimantTable/Map/DetailPanel/Dashboard`) → sources registry
→ review REGISTRY → Dashboard shell nav (gated on accept). Retire the orphaned
`public/data/claimant-wards.json` + `scripts/fetch-claimant-wards.mjs` as part of this.

---

## Phase 2 — Children in low-income families by ward

**Dataset (verified):** `percentage-of-children-in-absolute-low-income-families-aged-0-15-birmingham-wards`
— ward-level (E05), annual (latest **2024/25**), **native %**. Real range in the data:
Edgbaston 15.2% → **Bordesley Green 64.8%**.

**What it is for the story:** the sharpest picture of benefit *need* — where children grow up
in families on very low income (DWP/HMRC administrative data). This is the dashboard that will
make people stop scrolling, and every number is real.

**How it looks:**
- **Table**: 69 wards ranked by %, with the city mean drawn as a rule; a "gap vs city average"
  column (derived, labelled).
- **Map**: ink-ramp choropleth — the east-Birmingham crescent will be unmistakable.
- **Detail panel**: the ward's % as a big serif figure, rank of 69, distance from city average,
  and (annual data) a short year-on-year trend if the series depth supports it.
- Header: `69 wards · % of children 0–15 in absolute low income · 2024/25 · DWP`.

**Build:** same pipeline; simplest of all (native %, annual, no joins beyond ward roster).

---

## Phase 3 — UC city trend & regional context (enrichment, no new nav entry)

**Dataset (verified):** `number-of-people-on-universal-credit-wmca` — LA-level monthly series
(Feb 2026 latest; Sandwell 63,366 · Solihull 22,814 · Walsall 50,500 · England-LA mean 24,352).

**What it adds:** the existing UC dashboard shows a snapshot; this adds *time* and *context*.
- A monthly **city trend line** (how Birmingham's ~247k claimants moved) in the UC dashboard's
  right-column resting state (where sources currently sit).
- A small **borough comparison strip** (Birmingham vs the 6 neighbours), reusing the Housing
  Benefit bar pattern — honestly labelled LA-level.

**Build:** extend `scripts/fetch-uc.mjs` (or a sibling) to append the LA series to the uc-wards
proposal; re-stage → re-review → re-accept. No new route, no new nav button.

---

## Phase 4 — Fuel poverty by ward  ⚠ decision needed

**Dataset (verified):** `estimated-number-of-households-fuel-poverty-estimates-wmca-wards-2025`
— ward-level (E05), 2024, household **counts**, and the metric label itself says **"Estimated"**:
these are DESNZ *modelled* estimates, not administrative counts.

**The honest options:**
1. Build it with a prominent **MODELLED ESTIMATES (DESNZ)** banner (the skill explicitly allows
   modelled datasets if labelled and never shown as hard counts) — likely converting to % of
   households via a companion %-variant dataset if one exists (verify first), else Census
   households denominator (derived, labelled).
2. Skip it as out of scope for the "real data only" posture.

**Not building until you choose.** It's the only benefits-adjacent ward dataset left that is
modelled at source, so it needs your call under the data-integrity rule.

---

## Explicitly NOT building (and why)

| Dataset | Reason |
|---|---|
| UC / UC-in-work at **constituency** | Coarser duplicate of the ward dashboards we already have |
| UC at **MSOA (2021)** | Different geography with no MSOA boundaries/roster in the app; adds confusion, not insight |
| Claimant count **WMCA Wards (2021 vintage)** | Boundary-vintage risk; the Birmingham-specific datasets cover it on the official 69 wards |
| Children low income **WMCA (LA)** | Folded into Phase 2 as a benchmark line, not a separate dashboard |
| £-expenditure datasets (SEN/care/waste, supplier payments) | Council spend, not resident benefits — and LA/transaction level. A future "where the council spends" view, separate theme |

**No £-per-ward will be shown anywhere** — DWP does not publish ward-level benefit expenditure.
If an "indicative £" is ever wanted, it must be count × national average award, labelled derived
national-rate estimate (separate decision).

---

## Sequence & effort

| # | Dashboard | New route | Effort | Blocked on |
|---|---|---|---|---|
| 0 | Accept Housing Benefit in `/review` | — | 1 click | you |
| 1 | Claimant Count by ward | `/claimant-count` components | ~1 session | — |
| 2 | Children in low-income families | `/child-poverty` components | ~half session | — |
| 3 | UC trend + regional context | none (extends UC) | ~half session | — |
| 4 | Fuel poverty (modelled) | `/fuel-poverty` components | ~half session | your call on modelled labelling |

Each lands as a **pending proposal** for you to review; each registers provenance in
`lib/sources.ts`; commits only when you say so.
