import type { Metadata } from 'next';
import SiteFooter from '@/app/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Data Sources · Ozzy',
  description: 'All public data sources used in the Birmingham Ozzy intelligence dashboard.',
};

const SOURCES = [
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
  },
  {
    name: 'ONS Ward Boundaries Dec 2022',
    dataset_id: 'Wards_December_2022_Boundaries_UK_BGC',
    publisher: 'ONS / ArcGIS Online',
    geography: 'Ward (Dec 2022)',
    vintage: 'Dec 2022',
    what: 'GeoJSON ward polygons for Birmingham (LAD E08000025) — used in all map views',
    dashboard: 'All (maps)',
    type: 'on-demand' as const,
    api: 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query',
    href: 'https://geoportal.statistics.gov.uk/datasets/ons::wards-dec-2022-boundaries-uk-bgc/about',
  },
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
  },
  {
    name: 'Census 2021 — Highest Level of Qualification',
    dataset_id: 'census-2021-highest-level-of-qualification-birmingham-wards',
    publisher: 'ONS / Birmingham City Observatory',
    geography: 'Ward (Dec 2022), 68 Birmingham wards',
    vintage: 'Census 2021 (March 2021)',
    what: '% of usual residents aged 16+ by qualification band',
    dashboard: 'Education',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-highest-level-of-qualification-birmingham-wards/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/census-2021-highest-level-of-qualification-birmingham-wards/',
  },
  {
    name: 'IMD 2025 — Education, Skills & Training Domain',
    dataset_id: 'imd-indices-of-deprivation-2025-wmca-wards-2024',
    publisher: 'DLUHC / Birmingham City Observatory',
    geography: 'Ward (2024 WMCA), filtered to Birmingham LAD',
    vintage: 'IMD 2025',
    what: 'Education deprivation decile and score per ward',
    dashboard: 'Education',
    type: 'live' as const,
    api: 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-wards-2024/records',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/imd-indices-of-deprivation-2025-wmca-wards-2024/',
  },
  {
    name: 'NOMIS — Census 2021 TS067 (Qualifications)',
    dataset_id: 'NM_2084_1 / census2021-ts067-ward.csv',
    publisher: 'ONS / NOMIS',
    geography: 'Ward (England & Wales)',
    vintage: 'Census 2021',
    what: 'Authoritative bulk download for qualifications — reference dataset',
    dashboard: 'Education (ref)',
    type: 'bulk-download' as const,
    api: 'https://www.nomisweb.co.uk/output/census/2021/census2021-ts067-extra.zip',
    href: 'https://www.nomisweb.co.uk/sources/census_2021',
  },
];

const TYPE_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  live:           { label: 'Live',          color: 'var(--herald-navy)', bg: 'rgba(28,63,148,.1)',  border: 'var(--herald-blue)' },
  'on-demand':    { label: 'On demand',     color: 'var(--muted)',       bg: 'rgba(107,103,96,.1)', border: 'var(--border-solid)' },
  'bulk-download':{ label: 'Bulk download', color: '#6b4c2a',            bg: 'rgba(107,76,42,.1)',  border: '#9a7a5a' },
};

const DASHBOARD_COLORS: Record<string, string> = {
  Employment: 'var(--herald-blue)',
  Crime:      'var(--herald-red)',
  Education:  '#2a6a4a',
  'Education (ref)': '#2a6a4a',
  'All (maps)':'var(--muted)',
};

export default function SourcesPage() {
  return (
    <div style={{ background: 'var(--paper)', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Hero strip */}
      <section style={{
        position: 'relative',
        background: 'var(--herald-navy)',
        padding: '52px 32px',
        overflow: 'hidden',
        borderBottom: '3px solid var(--herald-gold)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" style={{
          position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
          width: 200, opacity: 0.07, pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.22em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 14 }}>
            Data Sources
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 46, color: '#f5f3ee', lineHeight: 1.1, margin: '0 0 14px', fontWeight: 400, letterSpacing: '-.015em' }}>
            Everything Ozzy reads. All public. No API keys.
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'rgba(245,243,238,.75)', lineHeight: 1.65, maxWidth: 720, margin: 0 }}>
            Every dataset used in this dashboard is publicly available with no API key required. Data is fetched server-side with caching, and falls back to embedded snapshots if a source is unreachable.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: 'var(--paper)', padding: '52px 32px 72px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>

          {/* Modelled fields callout */}
          <div style={{
            background: 'var(--surface)',
            borderTop: '3px solid var(--herald-gold)',
            border: '1px solid var(--border-solid)',
            borderTopWidth: 3,
            borderTopColor: 'var(--herald-gold)',
            padding: '20px 22px',
            marginBottom: 32,
            maxWidth: 720,
          }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, color: 'var(--herald-gold)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Modelled / synthesised fields
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
              A small number of fields are not from a live source. These are clearly labelled <em>(est)</em> or <em>(modelled)</em> in the UI: median earnings, inactivity %, crime category breakdown, crime YoY %, and the 12-month crime trend line. Real ASHE earnings and Police.uk category data would replace these if integrated.
            </p>
          </div>

          {/* Sources table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-solid)', background: 'var(--surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--herald-navy)' }}>
                  {['Source', 'Publisher', 'Dataset / ID', 'Geography', 'Vintage', 'Powers', 'Dashboard', 'Fetch', 'Links'].map(h => (
                    <th key={h} style={{
                      padding: '11px 14px',
                      textAlign: 'left',
                      fontFamily: 'var(--sans)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(245,243,238,.75)',
                      whiteSpace: 'nowrap',
                      borderBottom: '2px solid var(--herald-gold)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s, i) => {
                  const t = TYPE_STYLE[s.type];
                  const dashColor = DASHBOARD_COLORS[s.dashboard] ?? 'var(--muted)';
                  return (
                    <tr key={s.dataset_id} style={{
                      borderBottom: '1px solid var(--border-solid)',
                      background: i % 2 === 0 ? 'var(--surface)' : 'rgba(245,243,238,.5)',
                    }}>
                      <td style={{ padding: '12px 14px', color: 'var(--ink)', fontWeight: 600, fontSize: 12, lineHeight: 1.4, minWidth: 170, fontFamily: 'var(--sans)' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 11, lineHeight: 1.4, minWidth: 130, fontFamily: 'var(--sans)' }}>
                        {s.publisher}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 10, lineHeight: 1.4, minWidth: 140, maxWidth: 200, wordBreak: 'break-all', fontFamily: 'var(--mono)' }}>
                        {s.dataset_id}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
                        {s.geography}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>
                        {s.vintage}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 11, lineHeight: 1.55, minWidth: 200, fontFamily: 'var(--sans)' }}>
                        {s.what}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--sans)', fontWeight: 700, color: dashColor, letterSpacing: '.03em' }}>
                          {s.dashboard}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 9, padding: '3px 8px',
                          color: t.color, background: t.bg,
                          border: `1px solid ${t.border}`,
                          fontFamily: 'var(--sans)', fontWeight: 700,
                          letterSpacing: '.06em', textTransform: 'uppercase',
                        }}>
                          {t.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--herald-blue)', textDecoration: 'underline', marginRight: 10, fontFamily: 'var(--sans)' }}>
                          Dataset ↗
                        </a>
                        <a href={s.api} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--herald-blue)', textDecoration: 'underline', fontFamily: 'var(--sans)' }}>
                          API ↗
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-solid)', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              Birmingham Ozzy · Birmingham City Council · All data publicly available
            </div>
            <div>
              Base geography: Birmingham LAD code <strong style={{ color: 'var(--ink)' }}>E08000025</strong> · 68 wards (Dec 2022 boundary set)
            </div>
            <div>
              Main data provider:{' '}
              <a href="https://cityobservatory.birmingham.gov.uk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--herald-blue)' }}>
                Birmingham City Observatory ↗
              </a>{' '}
              — ODS v2.1 API, no authentication required
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
