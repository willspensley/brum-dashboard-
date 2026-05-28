import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Sources · Birmingham Ozzy',
  description: 'All public data sources used in the Birmingham Ozzy intelligence dashboard.',
};

const SOURCES = [
  // Employment
  {
    name: 'DWP Claimant Count',
    dataset_id: 'NM_162_1',
    publisher: 'ONS / DWP via NOMIS',
    geography: 'Ward (Dec 2022)',
    vintage: 'Rolling monthly',
    what: 'UC claimants as % of working-age pop',
    dashboard: 'Employment',
    type: 'live' as const,
    api: 'https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.json',
    href: 'https://www.nomisweb.co.uk/query/construct/summary.asp?mode=construct&version=0&dataset=162',
    key: false,
  },
  {
    name: 'IMD 2025 — Employment Domain',
    dataset_id: 'imd-indices-of-deprivation-2025-wmca-lsoa-2021',
    publisher: 'DLUHC / Birmingham City Observatory',
    geography: 'LSOA 2021 → averaged to ward',
    vintage: 'IMD 2025',
    what: 'Employment deprivation score, used in composite decile',
    dashboard: 'Employment',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-lsoa-2021/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/imd-indices-of-deprivation-2025-wmca-lsoa-2021/',
    key: false,
  },
  {
    name: 'GVA — All Industries',
    dataset_id: 'gross-value-added-gva-all-industries-birmingham-wards',
    publisher: 'Birmingham City Observatory',
    geography: 'Ward (Dec 2022)',
    vintage: '2022',
    what: 'GVA £millions per ward → divided by Census 2021 pop to give GVA per head',
    dashboard: 'Employment',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/gross-value-added-gva-all-industries-birmingham-wards/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/gross-value-added-gva-all-industries-birmingham-wards/',
    key: false,
  },
  {
    name: 'Census 2021 — Ward Population',
    dataset_id: 'census-2021-age-birmingham-wards',
    publisher: 'ONS / Birmingham City Observatory',
    geography: 'Ward (Dec 2022)',
    vintage: 'Census 2021',
    what: 'Total usual residents per ward — used as denominator for GVA per head',
    dashboard: 'Employment',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-age-birmingham-wards/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/census-2021-age-birmingham-wards/',
    key: false,
  },
  {
    name: 'ONS Ward Boundaries Dec 2022',
    dataset_id: 'Wards_December_2022_Boundaries_UK_BGC / FeatureServer/0',
    publisher: 'ONS / ArcGIS Online',
    geography: 'Ward (Dec 2022)',
    vintage: 'Dec 2022',
    what: 'GeoJSON ward polygons for Birmingham (LAD E08000025) — used in all map views',
    dashboard: 'All (maps)',
    type: 'on-demand' as const,
    api: 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query',
    href: 'https://geoportal.statistics.gov.uk/datasets/ons::wards-dec-2022-boundaries-uk-bgc/about',
    key: false,
  },
  // Crime
  {
    name: 'WMP — Recorded Offences per 1,000 pop',
    dataset_id: 'total-recorded-offences-excluding-fraud-per-1000-population-wmca',
    publisher: 'West Midlands Police / Birmingham City Observatory',
    geography: 'Ward (Dec 2022)',
    vintage: 'Latest published',
    what: 'Total crimes per 1,000 population by ward, used to colour Crime Grid and Map',
    dashboard: 'Crime',
    type: 'live' as const,
    api: 'https://api.birmingham.gov.uk/v1/Birmingham-City-Observatory/datasets/total-recorded-offences-excluding-fraud-per-1000-population-wmca/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/total-recorded-offences-excluding-fraud-per-1000-population-wmca/',
    key: false,
  },
  // Education
  {
    name: 'Census 2021 — Highest Level of Qualification',
    dataset_id: 'census-2021-highest-level-of-qualification-birmingham-wards',
    publisher: 'ONS / Birmingham City Observatory',
    geography: 'Ward (Dec 2022), 68 Birmingham wards',
    vintage: 'Census 2021 (March 2021)',
    what: '% of usual residents aged 16+ by qualification band: No quals, L1, L2, Apprenticeship, L3, L4+',
    dashboard: 'Education',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-highest-level-of-qualification-birmingham-wards/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/census-2021-highest-level-of-qualification-birmingham-wards/',
    key: false,
  },
  {
    name: 'IMD 2025 — Education, Skills & Training Domain',
    dataset_id: 'imd-indices-of-deprivation-2025-wmca-wards-2024',
    publisher: 'DLUHC / Birmingham City Observatory',
    geography: 'Ward (2024 WMCA), filtered to Birmingham LAD E08000025',
    vintage: 'IMD 2025',
    what: 'Education deprivation decile and score per ward — shown in grid colouring and detail panel',
    dashboard: 'Education',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-wards-2024/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/imd-indices-of-deprivation-2025-wmca-wards-2024/',
    key: false,
  },
  {
    name: 'NOMIS — Census 2021 TS067 (Qualifications)',
    dataset_id: 'NM_2084_1 / census2021-ts067-ward.csv',
    publisher: 'ONS / NOMIS',
    geography: 'Ward (England & Wales)',
    vintage: 'Census 2021',
    what: 'Authoritative bulk download for qualifications at ward level — alternative to City Observatory API',
    dashboard: 'Education (reference)',
    type: 'bulk-download' as const,
    api: 'https://www.nomisweb.co.uk/output/census/2021/census2021-ts067-extra.zip',
    href: 'https://www.nomisweb.co.uk/sources/census_2021',
    key: false,
  },
];

const TYPE_LABELS = {
  live: { label: 'Live', color: '#1a3a2a', bg: 'rgba(26,58,42,.1)' },
  'on-demand': { label: 'On demand', color: '#1a2a3a', bg: 'rgba(26,42,58,.1)' },
  'bulk-download': { label: 'Bulk download', color: '#3a2a1a', bg: 'rgba(58,42,26,.1)' },
};

export default function SourcesPage() {
  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: 'IBM Plex Mono, monospace' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #d4d0c8', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 14, background: '#f5f3ee' }}>
        <a
          href="/"
          style={{ fontSize: 10, color: '#6b6760', textDecoration: 'none', padding: '4px 8px', border: '1px solid #d4d0c8', letterSpacing: '.04em', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          ← Ozzy
        </a>
        <div style={{ fontSize: 10, color: '#6b6760', letterSpacing: '.04em' }}>▶ FORWARD · B·C·C</div>
        <div>
          <div style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 20, color: '#0e0f11', lineHeight: 1 }}>
            Data Sources
          </div>
          <div style={{ fontSize: 9, color: '#6b6760', marginTop: 3, letterSpacing: '.06em' }}>
            Birmingham Ozzy · All public datasets · No API keys required
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 64px' }}>

        <p style={{ fontSize: 11, color: '#6b6760', lineHeight: 1.7, marginBottom: 32, maxWidth: 640, fontFamily: 'IBM Plex Mono, monospace' }}>
          Every dataset used in this dashboard is publicly available with no API key required.
          Data is fetched server-side on each page render (with caching) and falls back to
          embedded snapshots if a source is unreachable. Live sources are re-fetched on a
          1–24 hour cycle depending on how frequently the source updates.
        </p>

        {/* Modelled fields callout */}
        <div style={{ border: '1px solid #d4d0c8', padding: '12px 16px', marginBottom: 32, fontSize: 10, color: '#6b6760', lineHeight: 1.7, maxWidth: 640 }}>
          <span style={{ fontWeight: 600, color: '#0e0f11' }}>Modelled / synthesised fields</span><br />
          A small number of fields shown in the Employment dashboard are not fetched from a live source.
          These are clearly labelled <em>(est)</em> or <em>(modelled)</em> in the UI:
          median earnings (synthesised from IMD + claimant rate), inactivity % (Census 2021 embedded),
          crime category breakdown, crime YoY %, and the 12-month crime trend line.
          Real ASHE earnings and detailed Police.uk category data would replace these if integrated.
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0e0f11' }}>
                {['Source', 'Publisher', 'Dataset / ID', 'Geography', 'Vintage', 'Powers', 'Dashboard', 'Fetch', 'Links'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b6760', fontWeight: 400, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s, i) => {
                const t = TYPE_LABELS[s.type];
                return (
                  <tr key={s.dataset_id} style={{ borderBottom: '1px solid #d4d0c8', background: i % 2 === 0 ? 'transparent' : 'rgba(14,15,17,.02)' }}>
                    <td style={{ padding: '10px 10px', color: '#0e0f11', fontWeight: 500, fontSize: 11, lineHeight: 1.4, minWidth: 160 }}>
                      {s.name}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#6b6760', fontSize: 10, lineHeight: 1.4, minWidth: 120 }}>
                      {s.publisher}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#6b6760', fontSize: 9, lineHeight: 1.4, minWidth: 140, maxWidth: 200, wordBreak: 'break-all' }}>
                      {s.dataset_id}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#6b6760', fontSize: 10, whiteSpace: 'nowrap' }}>
                      {s.geography}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#6b6760', fontSize: 10, whiteSpace: 'nowrap' }}>
                      {s.vintage}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#6b6760', fontSize: 10, lineHeight: 1.5, minWidth: 180 }}>
                      {s.what}
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#6b6760', letterSpacing: '.04em' }}>
                        {s.dashboard}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', color: t.color, background: t.bg, border: `1px solid ${t.color}22` }}>
                        {t.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#1a2a3a', textDecoration: 'underline', marginRight: 8 }}>
                        Dataset ↗
                      </a>
                      <a href={s.api} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#1a2a3a', textDecoration: 'underline' }}>
                        API ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #d4d0c8', fontSize: 9, color: '#6b6760', lineHeight: 1.8 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '.04em' }}>
            Birmingham Ozzy · Birmingham City Council · All data publicly available
          </div>
          <div>
            Base geography: Birmingham LAD code <strong>E08000025</strong> · 68 wards (Dec 2022 boundary set, codes E05011082–E05011150)
          </div>
          <div>
            Main data provider: <a href="https://cityobservatory.birmingham.gov.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2a3a' }}>Birmingham City Observatory ↗</a> — ODS v2.1 API, no authentication required
          </div>
        </div>
      </div>
    </div>
  );
}
