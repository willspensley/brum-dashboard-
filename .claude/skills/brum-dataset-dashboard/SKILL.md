---
name: brum-dataset-dashboard
description: >-
  Use when adding a new Birmingham open dataset as a reviewable ward dashboard in
  the brum-dashboard (Ozzy) app. Discovers the dataset in City Observatory, fetches
  and validates it to the 69 official wards, derives an honest per-capita metric,
  builds a dashboard from the EXISTING Crime/Benefits components (one shared component
  rendered in both Review and Dashboards), registers provenance, and routes it through
  Review → Accept → Dashboards. Triggers on: "add <dataset> as a dashboard", "put
  <metric> by ward on Ozzy", "build a dashboard for <City Observatory dataset>",
  "add <benefit/health/housing> to the dashboards".
---

# Birmingham dataset → reviewable ward dashboard

This playbook adds one City Observatory (or comparable ONS-keyed) dataset to the app
as a dashboard that must be **reviewed and accepted by a human before it goes live**.
It reproduces the exact pipeline used for the Universal Credit dashboard.

## When NOT to use
- Data that isn't ward-level for Birmingham (LA-only / MSOA-only) — it can't drive a
  ward map/table. Say so and stop, or offer the coarser geography explicitly.
- Anything that can't be traced to a named official source → do not build it.

## Hard rules (from CLAUDE.md — these override convenience)
- **Official sources only.** A value renders only if traceable to a named source for
  that exact ward/period.
- **Never fabricate / model / synthesise** a value presented as fact. Missing data →
  render `"—"`, never an estimate.
- **Derived values are allowed** only if computed transparently from official inputs
  (e.g. a rate = count ÷ population), **labelled as derived**, adding no new info.
- **Provenance is mandatory** — every metric carries its source + as-of date.
- **The wall:** the fetch script writes ONLY to `proposals/`. Nothing reaches
  `public/data/` (and therefore Dashboards) without a human **Accept** in `/review`.
- Join on official ONS ward codes **E05011118–E05011186**. Never the `FALLBACK` codes
  in `lib/data.ts`.

## The pipeline

### 1. Discover
Query the City Observatory catalog for the dataset and confirm the exact `dataset_id`
(the URL slug), that it is **ward-level**, and its currency:
```
https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets?where=%22<keywords>%22&limit=20
```
Ask for the verbatim `dataset_id`. Do NOT trust an id summarised from prose — verify it
resolves on the records endpoint before coding against it.

### 2. Inspect the record shape
Pull a few real records and note the field names + gotchas:
```
.../catalog/datasets/<dataset_id>/records?limit=6
```
- Fields are usually `areaidentifier` (ONS code), `arealabel`, `value`, `date`,
  `periodlabel`, `local_authority_code`. Confirm which field holds the number.
- **`date` is a reserved/date-typed field** — you cannot filter `where=date="2026-02"`
  (400). Find the latest month with `?order_by=date DESC&limit=1`, then page
  `?order_by=date DESC` and keep records where `rec.date === latest` (client-side).
- If the dataset is WMCA-wide, filter to Birmingham (codes E05011118–E05011186, or
  `where=local_authority_code="E08000025"`).

### 3. Fetch + validate  → writes a PROPOSAL
Copy `scripts/fetch-uc.mjs` to `scripts/fetch-<topic>.mjs` and adapt. Keep its shape:
- filter to Birmingham 69 wards; take the latest period;
- if the raw value is a **count**, join `lib/population.ts` and derive a **% of
  residents** (or per-1,000) — label it derived, and cite population as a 2nd source.
- if the value is **already a % / share**, identify **what it is a share OF** and show
  that denominator — a context-less % is not acceptable. Join the base count from its
  own official dataset for the **same month** and derive the headcount, so the reader
  sees what the % means. (e.g. "% of UC claimants in work" → join the UC claimant count
  and derive the in-work headcount; also carry population for parity with sibling
  dashboards.) Label derived figures derived and cite every input as a source.
- validate: real number + real ward + period, else push to `skipped` (renders "—");
- tag each `method`: `administrative` | `census` | `modelled` (a modelled dataset,
  e.g. fuel poverty, MUST be labelled modelled and never shown as a hard count);
- write `proposals/<topic>.proposal.json` (data + validation + `sources[]` + raw sample).
  **Never** write to `public/data/`.
Run it: `node scripts/fetch-<topic>.mjs` and sanity-check the console summary.

### 4. Choose the views (viz-selection heuristic)
- Geographic + **one** metric per ward → **Table + Map** (Table first, Map last).
- Geographic + **two** related metrics → add a **Scatter** (model on `LabourScatter`).
- A value **over time** → a trend line.
- A **categorical breakdown** per ward → show it in the detail panel (see CrimeDetailPanel's
  category bars).
Match the existing sub-tab order: Table first, Map always last.

### 5. Build from existing components  (WYSIWYG — the key rule)
Create `app/<topic>/components/`:
- `XTable.tsx`  ← clone `app/components/tabs/crime/CrimeTable.tsx` (`.data-table` classes)
- `XMap.tsx`    ← clone `app/components/tabs/crime/CrimeMap.tsx` (Leaflet + `fetchWardBoundaries` + `RAMP`)
- `XDetailPanel.tsx` ← clone `app/components/detail/CrimeDetailPanel.tsx` (`.d-hdr`/`.d-chips`)
- `XDashboard.tsx` ← clone `app/benefits/components/BenefitsDashboard.tsx`. This is the
  **one shared component** that renders the whole `.body` (lcol sub-tabs + panel + rcol
  detail). Map is loaded with `dynamic(() => import('./XMap'), { ssr: false })`.

**The WYSIWYG guarantee:** `XDashboard` is rendered in BOTH `/review` and the Dashboards
shell, fed an identically-shaped data object. Same component + same-shaped data + shared
global CSS classes ⇒ the two pages cannot diverge and Accept needs no rebuild. Never build
a second, page-specific version.

### 6. Register provenance (single source of truth)
- Add each dataset to `lib/sources.ts` `SOURCES` (id, label, publisher, datasetId, asOf,
  licence, sourceUrl, scriptUrl). This is the ONE registry — `/sources` renders it and
  the detail panel should look up from it. Do not keep a second copy of provenance.
- **Every source link rendered in the UI points to the human catalogue page**
  (`catalogueUrl` = `https://cityobservatory.birmingham.gov.uk/explore/dataset/<id>/`),
  NEVER the raw API records URL. Keep `apiUrl` in the data for the fetch script's
  reproducibility, but users must click through to the normal website that shows the
  dataset — not a page of raw JSON numbers.
- Show the dashboard's sources in the **right panel's resting state** (when no ward is
  selected), the way `app/components/Dashboard.tsx` renders `EDU_SOURCES` for Education —
  plus a link to `/sources`. Not buried inside a ward's detail only.

### 7. Wire the shell + route
In `app/components/Dashboard.tsx`:
- add the view to the `View` type; add an `is<Topic>` const;
- client-fetch `/data/<topic>.json` on mount → state (present only once accepted);
- add a sidebar `dash-nav-btn` **gated on that state** (appears only after Accept);
- add the header title/sub; render `<XDashboard data={...} />` in place of the `.body`
  when the view is active.
In `app/api/proposals/route.ts` the accept path already promotes any `proposals/*.proposal.json`
to `public/data/<id>.json` — reuse it. In `app/review/page.tsx`, render `<XDashboard>` for the
candidate with the Accept/Reject bar (model on the UC review).

### 8. Verify
- Fetch tool: correct ward count (usually 69/69), sensible min/max, `"—"` for any gaps.
- `/review` (pending) renders the full candidate dashboard; `/dashboard` shows no entry yet.
- Accept → `public/data/<topic>.json` written → the sidebar entry appears in Dashboards,
  identical to Review. No rebuild.
- Every metric has a working source link; modelled data is labelled modelled.

## Canonical templates (copy these)
- `scripts/fetch-uc.mjs` — discover/fetch/validate/derive/stage
- `app/benefits/components/*` — the component set + shared `BenefitsDashboard`
- `app/api/proposals/route.ts` — the accept/reject wall
- `app/review/page.tsx` — the review gate rendering the shared component
- `lib/sources.ts`, `lib/population.ts`, `lib/wards.ts` — provenance, denominator, ward roster
