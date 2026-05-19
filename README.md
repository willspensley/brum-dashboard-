# Birmingham Employment Deprivation Dashboard

A functional prototype intelligence dashboard for Birmingham City Council, visualising employment deprivation across 68 wards.

## Quick start

```bash
python3 -m http.server 8080
# open http://localhost:8080/birmingham_dashboard_v3.html
```

## Files

| File | Role |
|---|---|
| `birmingham_dashboard_v3.html` | **Current version** — HTML shell, CSS, DOM scaffolding |
| `dashboard-data.js` | Embedded fallback dataset (68 wards) |
| `dashboard-app.js` | All application logic: fetches, views, detail panel |
| `birmingham_dashboard.html` | v1 reference (dark theme, 3 tabs) |
| `birmingham_dashboard_v2.html` | v2 reference (dark BCC theme, ASCII bull) |
| `Birmingham Employment Dashboard.html` | Standalone bundled v2 (single file, all assets inlined) |

See `CLAUDE.md` for full project context, data sources, and next-step recommendations.
