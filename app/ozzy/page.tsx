'use client';

import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'Which wards have the highest unemployment right now?',
    a: `Ladywood, Aston, Nechells, Bordesley & Highgate — these consistently top Birmingham's deprivation index. Ladywood sits at 11.1% claimant rate. Sutton Four Oaks is at 2.3%. That gap hasn't meaningfully closed in 18 months.\n\nThat's not a data quirk. That's a structural problem that keeps showing up month after month.`,
    links: [{ label: 'Employment dashboard →', href: '/dashboard' }],
  },
  {
    q: "What's the NEET situation for young people in Birmingham?",
    a: `Birmingham's 16–17 NEET rate sits around 6.1% — above the England average. Nationally, 1.01 million young people are NEET as of Jan–Mar 2026 (13.5%). The Milburn review is ongoing.\n\nThe worst-affected wards cluster in the north and east of the city. Youth unemployment and economic inactivity are highest where educational attainment is also lowest — the same postcode, the same families, the same decade.`,
    links: [{ label: 'Youth & NEET dashboard →', href: '/dashboard' }],
  },
  {
    q: 'Which areas have the worst education outcomes?',
    a: `Bordesley Green is at no-quals decile 9 — fourth year running. 35.8% of residents aged 16+ have no qualifications at all. The city average is 24.1%.\n\nAston and Lozells also rank poorly. This isn't a blip. It's structural. Targeted skills investment in the Aston–Nechells–Bordesley corridor has been the obvious call for years.`,
    links: [{ label: 'Education & Skills dashboard →', href: '/dashboard' }],
  },
  {
    q: "How does crime vary across Birmingham's wards?",
    a: `City centre and Ladywood record the highest offence rates per 1,000 population — which is partly driven by footfall, not just deprivation. Outer wards like Sutton Four Oaks, Sutton Vesey, and Harborne sit well below the city average.\n\nWMP data is updated monthly. The choropleth map is the clearest way to see the pattern.`,
    links: [{ label: 'Crime dashboard →', href: '/dashboard' }],
  },
  {
    q: "What does Birmingham's economic output look like by ward?",
    a: `City centre wards dominate GVA — Ladywood, which contains the CBD, generates by far the most. But strip out the commercial core and the picture changes. Residential wards like Edgbaston and Harborne carry their weight.\n\nThe Disadvantage quadrant — low GVA, high deprivation — is concentrated in the north and east. Those wards aren't just deprived, they're economically disconnected from the city they live in.`,
    links: [{ label: 'Economic Matrix →', href: '/dashboard' }],
  },
  {
    q: 'What data does Ozzy actually use?',
    a: `Right now: NOMIS NM_162_1 for monthly claimant counts, IMD 2025 via Birmingham City Observatory, GVA 2022 via City Observatory, Census 2021 qualifications, WMP crime data, and ONS ward boundaries.\n\nAll public datasets. All updated as the sources publish. Modelled estimates — where real ward-level data doesn't exist — are clearly labelled throughout.`,
    links: [{ label: 'View all data sources →', href: '/sources' }],
  },
];

export default function OzzyPage() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: 'IBM Plex Mono, monospace' }}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #d4d0c8', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 12, background: '#f5f3ee', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/about" style={{ fontSize: 10, color: '#6b6760', textDecoration: 'none', padding: '4px 8px', border: '1px solid #d4d0c8', letterSpacing: '.04em' }}>
          ← About
        </a>
        <a href="/dashboard" style={{ fontSize: 10, color: '#6b6760', textDecoration: 'none', padding: '4px 8px', border: '1px solid #d4d0c8', letterSpacing: '.04em' }}>
          Dashboards
        </a>
        <span style={{ fontSize: 10, color: '#6b6760', marginLeft: 'auto', letterSpacing: '.06em' }}>▶ FORWARD · B·C·C</span>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '52px 28px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 12 }}>
            Ask Ozzy
          </div>
          <h1 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 38, color: '#0e0f11', lineHeight: 1.2, margin: '0 0 14px', fontWeight: 400 }}>
            What do you want to know about Birmingham?
          </h1>
          <p style={{ fontSize: 11, color: '#6b6760', lineHeight: 1.8, maxWidth: 560, margin: 0 }}>
            Pick a question below. Ozzy gives you a straight answer backed by the city&apos;s public data.
          </p>
          <div style={{ marginTop: 12, fontSize: 10, color: '#908a82', fontStyle: 'italic' }}>
            Full AI chat — where you type anything and Ozzy answers — is planned for a later release.
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {QUESTIONS.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid #d4d0c8', ...(i === QUESTIONS.length - 1 ? { borderBottom: '1px solid #d4d0c8' } : {}) }}>

              {/* Question row */}
              <button
                onClick={() => setActive(active === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '18px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 16,
                }}
              >
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#0e0f11', lineHeight: 1.4 }}>
                  {item.q}
                </span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: '#6b6760', flexShrink: 0 }}>
                  {active === i ? '−' : '+'}
                </span>
              </button>

              {/* Answer */}
              {active === i && (
                <div style={{ padding: '0 0 24px 0' }}>
                  <div style={{ background: '#0e0f11', padding: '20px 22px', marginBottom: 12 }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#7a8270', letterSpacing: '.1em', marginBottom: 10 }}>
                      OZZY · BIRMINGHAM INTELLIGENCE
                    </div>
                    {item.a.split('\n\n').map((para, pi) => (
                      <p key={pi} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#d4d0c8', lineHeight: 1.8, margin: pi < item.a.split('\n\n').length - 1 ? '0 0 12px' : 0 }}>
                        {para}
                      </p>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {item.links.map(link => (
                      <a key={link.href} href={link.href} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, padding: '6px 14px', border: '1px solid #0e0f11', color: '#0e0f11', textDecoration: 'none', letterSpacing: '.04em' }}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 52, paddingTop: 28, borderTop: '1px solid #d4d0c8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 10, color: '#908a82' }}>
            Data: NOMIS · IMD 2025 · Census 2021 · WMP · City Observatory
          </div>
          <a href="/about" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
            About Ozzy →
          </a>
        </div>
      </div>
    </div>
  );
}
