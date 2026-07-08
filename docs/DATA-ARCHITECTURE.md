# Data architecture — how to add a real data source (agent guide)

This is the **proven, repeatable** way to get data into the dashboard. It implements the
`CLAUDE.md` "Data integrity" hard rule: **official sources only, no modelling, provenance
mandatory, missing data renders as "—".** Follow this for every new source.

---

## The canonical geography (read first)

- **69 official Birmingham wards**, ONS codes **`E05011118–E05011186`**, in `lib/wards.ts`
  (derived from `lib/population.ts`).
- **NEVER** join on the legacy `FALLBACK` codes in `lib/data.ts` (`E05011082–E05011150`) —
  that set is a wrong/fabricated vintage. Real data keyed by official codes won't match it.
- Ward polygons: `public/data/birmingham-wards.geojson` (ONS Wards Dec 2022, `WD22CD`/`WD22NM`,
  official codes — matches population + crime).

---

## The recipe (every source follows these 5 steps)

1. **Verify the source from a real browser/terminal first.** Confirm it's reachable, is at the
   right granularity (ward-level if the view is ward-level), and read the actual field names.
   Don't guess. (My sandbox can't TLS some hosts — see gotchas — so verify with `curl`/`node`
   or a browser.)
2. **Write `scripts/fetch-<source>.mjs`** that pulls from the official API and **emits a committed
   real snapshot** — `lib/<x>.ts` (typed) or `public/data/<x>.json`. The file header must record:
   source name, official dataset ID, as-of date, the run command, and a **verification check**
   (e.g. a sum that must equal a published total). The script *is* the provenance.
3. **Register provenance** in `lib/sources.ts` — one `SourceMeta` entry: label, source, publisher,
   `datasetId`, `asOf`, `licence`, `sourceUrl` (verified 200), `scriptUrl` (GitHub link to the
   script), `short` (inline tag), `note`.
4. **Surface it** — inline with `<SourceTag id="<x>" />` (compact tag → hover for source/as-of →
   click to `/sources#<x>`). The `/sources` page renders the whole registry automatically.
5. **Wire the snapshot into the dashboard.** Join by **official ward code**. Any value that can't
   be sourced renders as **"—"**, never as an estimate. Delete the matching `synth*` fallback.

> Keyed APIs only (DWP, ONS API+): the key goes in an env var + a server route (`app/api/<x>/route.ts`),
> never in browser code. See `app/api/ozzy/route.ts` for the pattern. ONS/police.uk need no key.

---

## Verified source catalogue (build off these — they work)

| Metric | Official source | Endpoint / how | Snapshot | Script |
|---|---|---|---|---|
| **Population** | ONS Small Area Population Estimates (2021-based), mid-2024 | NOMIS `NM_2014_1`, `geography=<E05 code>&date=latest&measures=20100`, filter obs `c_age.value===200` (All Ages) & `gender.value===0` (Total). LAD cross-check via `NM_2002_1` (E08000025). | `lib/population.ts` | `scripts/fetch-population.mjs` |
| **Crime** | data.police.uk — West Midlands Police street-level crime | `crimes-street/all-crime?poly=<lat,lng:…>&date=YYYY-MM` per ward polygon; point-in-polygon; count ÷ population × 1000; categories from the records. Latest month via `/api/crime-last-updated`. | `public/data/crime-wards.json` | `scripts/fetch-crime-wards.mjs` |
| **Education** | ONS Census 2021, table TS067 (qualifications) | NOMIS `NM_2084_1`. Census frozen until 2031. | `lib/education-data.ts` | `scripts/fetch-education-data.mjs` |
| **Ward boundaries** | ONS Wards (Dec 2022) BGC | ArcGIS / committed GeoJSON | `public/data/birmingham-wards.geojson` | — |

All open data, **Open Government Licence v3.0, no API key.**

---

## Gotchas (learned the hard way)

- **City Observatory host:** use **`www.cityobservatory.birmingham.gov.uk`** (the bare host fails
  the TLS handshake). API shape: `…/api/explore/v2.1/catalog/datasets/<slug>/records?…`; read
  `j.results ?? j.records`; fields are flat or under `.fields`. ⚠️ Its WMCA crime dataset is
  **LA-level, not ward-level** — that's why crime uses data.police.uk.
- **The dev sandbox can't TLS every host.** `data.police.uk` and NOMIS work via `curl`/`node fetch`;
  some hosts don't. **Real data only appears when the app runs on a normal network or a deploy**,
  not on the sandboxed `npm run dev`. Committed snapshots (population, crime, education) *do* show
  on localhost because they're read from files, not fetched.
- **Provenance must not drift:** edit `lib/sources.ts` only; the tooltip and `/sources` both read
  from it.

---

## Later: scheduled refresh + store (when a source updates often)

Crime is monthly → a `Vercel Cron` route can re-run the fetch and write to a **store** (KV for the
latest snapshot; Postgres only if you want history / real YoY). The dashboard reads the store, not
the providers, on a visit. For slow-moving data (population annual, Census frozen) the committed
snapshot is enough — no cron/DB needed.
