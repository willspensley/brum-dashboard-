# Project context — Birmingham Ozzy

## What this is
**Ozzy** — an AI-powered data voice for Birmingham City Council. A chat-first interface that reads every public dataset about the city and synthesises direct, opinionated commentary. Six data visualisation views sit behind Ozzy as the evidence locker.

Named after Ozzy Osbourne — working class, blunt, globally Brummie, not what the establishment expected.

Audience: council policy officers and analysts. Also WMCA board presentations.

## Visual direction (signed off — preserve)
- **Editorial paper aesthetic.** Warm paper background (`#f5f3ee`), serif headlines (Instrument Serif), monospace data (IBM Plex Mono), no rounded corners anywhere.
- **ASCII flourishes** as Birmingham brand nods: ASCII bull in empty states, ASCII banner on loader, "FORWARD" (Birmingham motto) watermark, ASCII spinners (`⠋⠙⠹⠸`) during loading.
- **Quadrant colours** (used only on the Economic Matrix): green `#1a3a2a` / purple `#2a1a3a` / blue `#1a2a3a` / red `#3a1a1a`.
- **10-step ink ramp** for disadvantage intensity on grid/map: `#7a8270 → #3a1a1a`.

## Data philosophy
- **Live where possible** — NOMIS, IMD 2025 via City Observatory, GVA via City Observatory, ONS ward boundaries are all public CORS-enabled.
- **Embedded fallbacks** for offline / API outage — every live fetch has a cached counterpart so the dashboard never fails to render.
- **Modelled estimates labelled** — youth unemployment, UC %, no quals, vacancies, median earnings are synthesised. UI tags them "est" or "(modelled)" — never hide that.
- **Status drawer** in header shows live/cached state per source — must stay visible during the whole session, not just on load.

## Hard rules
- Never put API keys in browser-shipped code. Keyed APIs (DWP Stat-Xplore, ONS API+) must go through server-side API routes / edge functions.
- Never drop a "est" / "modelled" / "cached" label without replacing the synthesised value with real data first.
- Mobile: full responsive, but desktop is the primary target.
- Print: landscape A4, ranked table view only (currently).

## Brand
- Birmingham City Council. Motto is "Forward" — already used as a watermark.
- A subtle BCC red badge sits in the header. Don't add a full BCC logo — the design predates the council's brand refresh and is intentionally neutral.

## Stack hints
If porting to a framework, recommendation is Next.js 14 (App Router) + Tailwind. Chart.js and Leaflet should stay — they're tuned. See `README.md` in `design_handoff_birmingham_dashboard/` for the full porting plan.
