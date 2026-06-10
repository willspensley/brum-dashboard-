'use client';

import { useState, useEffect } from 'react';
import BullAscii from '@/app/components/BullAscii';

const CAPABILITIES = [
  { icon: '◈', label: '8 live data sources', sub: '' },
  { icon: '▦', label: '68 Birmingham wards', sub: 'Dec 2022 boundary set' },
  { icon: '⚠', label: 'Real-time monitoring', sub: 'Hourly claimant data' },
  { icon: '◉', label: 'IMD 2025', sub: 'Employment + Education domains' },
  { icon: '■', label: 'Census 2021', sub: 'Qualifications + Population' },
  { icon: '▲', label: 'WMP Crime data', sub: 'Offences per 1,000 pop' },
];

const ROADMAP = [
  { status: 'live', label: 'Employment deprivation', detail: 'IMD 2025 + NOMIS claimant count, 68 wards' },
  { status: 'live', label: 'Crime rates', detail: 'WMP recorded offences, ward-level choropleth' },
  { status: 'live', label: 'Education & skills', detail: 'Census 2021 qualifications + IMD education domain' },
  { status: 'live', label: 'Economic output', detail: 'GVA per head, 2022, all industries' },
  { status: 'live', label: 'Youth & NEET risk', detail: 'Modelled composite index across 68 wards' },
  { status: 'soon', label: 'Housing affordability', detail: 'Land Registry price paid + ONS income data' },
  { status: 'soon', label: 'School performance', detail: 'DfE Ofsted + attainment data by ward' },
  { status: 'soon', label: 'Health inequality', detail: 'OHID / NHS fingertips — life expectancy gap' },
  { status: 'soon', label: 'Transport connectivity', detail: 'TfWM journey times to key employment centres' },
  { status: 'planned', label: 'Full AI chat', detail: 'Ask Ozzy anything. Get a data-backed answer.' },
  { status: 'planned', label: 'Ozzy daily newsletter', detail: 'Automated weekly briefing — subscribe by ward' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  live:    { label: 'Live',    color: '#1a3a2a', bg: 'rgba(26,58,42,.12)' },
  soon:    { label: 'Soon',    color: '#1a2a3a', bg: 'rgba(26,42,58,.12)' },
  planned: { label: 'Planned', color: '#6b6760', bg: 'rgba(107,103,96,.1)' },
};

export default function AboutPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'none' : 'translateY(12px)',
    transition: `opacity .5s ease ${delay}ms, transform .5s ease ${delay}ms`,
  });

  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: 'IBM Plex Mono, monospace' }}>

      {/* Nav bar */}
      <div style={{ borderBottom: '1px solid #d4d0c8', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 12, background: '#f5f3ee', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: 10, color: '#6b6760', letterSpacing: '.04em' }}>▶ FORWARD · B·C·C</span>
        <span style={{ fontSize: 10, color: '#6b6760', marginLeft: 'auto', letterSpacing: '.06em' }}>BIRMINGHAM AI INTELLIGENCE</span>
        <a href="/" style={{ fontSize: 10, color: '#6b6760', textDecoration: 'none', padding: '4px 8px', border: '1px solid #d4d0c8', letterSpacing: '.04em' }}>
          View dashboards →
        </a>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '52px 24px 40px', borderBottom: '1px solid #d4d0c8' }}>
        <BullAscii />
        <div style={{ ...fadeStyle(100), fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 68, lineHeight: 1, color: '#0e0f11', marginTop: 20, letterSpacing: '-.02em' }}>
          Ozzy
        </div>
        <div style={{ ...fadeStyle(200), fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '.18em', color: '#6b6760', textTransform: 'uppercase', marginTop: 10 }}>
          Birmingham AI Intelligence
        </div>
        <div style={{ ...fadeStyle(320), fontFamily: 'Instrument Serif, Georgia, serif', fontStyle: 'italic', fontSize: 17, color: '#7d4e36', marginTop: 14 }}>
          &ldquo;Taking Brum into the AI era.&rdquo;
        </div>
        <div style={{ ...fadeStyle(440), marginTop: 28, display: 'flex', justifyContent: 'center', gap: 10 }}>
          <a href="/ask" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', background: '#0e0f11', color: '#f5f3ee', textDecoration: 'none', letterSpacing: '.04em' }}>
            Ask Ozzy →
          </a>
          <a href="/" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
            View dashboards →
          </a>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 28px 80px' }}>

        {/* What is Ozzy */}
        <section style={{ padding: '52px 0 40px', borderBottom: '1px solid #d4d0c8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 14 }}>
                What is Ozzy?
              </div>
              <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 30, color: '#0e0f11', lineHeight: 1.25, margin: '0 0 18px', fontWeight: 400 }}>
                Every city deserves to understand itself.
              </h2>
              <p style={{ fontSize: 12, color: '#6b6760', lineHeight: 1.8, margin: '0 0 14px' }}>
                Ozzy is Birmingham&apos;s open-source AI intelligence layer — an agentic system that reads every public dataset about the city and turns raw numbers into direct, useful commentary.
              </p>
              <p style={{ fontSize: 12, color: '#6b6760', lineHeight: 1.8, margin: '0 0 14px' }}>
                Not a dashboard. Not a report. Not another PowerPoint. <strong style={{ color: '#0e0f11' }}>A voice.</strong> One that tells you where Birmingham is doing well, where it isn&apos;t, and what needs to happen next.
              </p>
              <p style={{ fontSize: 12, color: '#6b6760', lineHeight: 1.8, margin: 0 }}>
                Ozzy is a true Brummie and he&apos;ll always speak the truth.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 14 }}>
                What Ozzy sees today
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CAPABILITIES.map(c => (
                  <div key={c.icon} style={{ border: '1px solid #d4d0c8', padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: '#0e0f11', marginBottom: 4 }}>{c.icon}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 500, color: '#0e0f11', lineHeight: 1.3 }}>{c.label}</div>
                    {c.sub && <div style={{ fontSize: 9, color: '#6b6760', marginTop: 2, lineHeight: 1.4 }}>{c.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Daily briefing preview */}
        <section style={{ padding: '48px 0 40px', borderBottom: '1px solid #d4d0c8' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 14 }}>
            What Ozzy sounds like
          </div>
          <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 26, color: '#0e0f11', lineHeight: 1.3, margin: '0 0 24px', fontWeight: 400 }}>
            Plain talk about the data. Weekly. Daily. When it matters.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ border: '1px solid #d4d0c8', background: '#0e0f11', padding: '20px 22px' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#7a8270', letterSpacing: '.1em', marginBottom: 10 }}>
                OZZY WEEKLY · BIRMINGHAM · 28 MAY 2026
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#7d4e36', marginBottom: 10 }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#d4d0c8', lineHeight: 1.75, margin: '0 0 12px' }}>
                Claimant rate holding at 7.4% city average. Ladywood still highest at 11.1%. Sutton Four Oaks still lowest at 2.3%. The gap between them hasn&apos;t meaningfully closed in 18 months. That should bother everyone.
              </p>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#d4d0c8', lineHeight: 1.75, margin: '0 0 12px' }}>
                Education: Bordesley Green at no-quals decile 9, fourth year running. 35.8% of residents aged 16+ have no qualifications at all. Birmingham average is 24.1%. This is a structural problem, not a data blip.
              </p>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#7d4e36', lineHeight: 1.75, margin: 0 }}>
                → What needs to happen: targeted skills investment in the Aston–Nechells–Bordesley corridor. The data has been saying this for years.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ border: '1px solid #d4d0c8', padding: '14px 16px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#1a3a2a', letterSpacing: '.08em', marginBottom: 6 }}>● NEW DATA DETECTED</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#0e0f11', lineHeight: 1.5 }}>
                  IMD 2025 Education domain published. 23 Birmingham wards improved vs 2019. 11 got worse. Ozzy has updated all views.
                </div>
              </div>
              <div style={{ border: '1px solid #d4d0c8', padding: '14px 16px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#7d4e36', letterSpacing: '.08em', marginBottom: 6 }}>▲ SIGNIFICANT SHIFT</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#0e0f11', lineHeight: 1.5 }}>
                  Kingstanding claimant rate up 1.4pp this month. Fourth consecutive rise. Worth watching.
                </div>
              </div>
              <div style={{ border: '1px solid #d4d0c8', padding: '14px 16px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#1a3a2a', letterSpacing: '.08em', marginBottom: 6 }}>◈ PRAISE</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#0e0f11', lineHeight: 1.5 }}>
                  Moseley, Harborne, Edgbaston all holding below 5% claimant rate. Level 4+ qualifications above 50% in all three. Genuinely good numbers.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contribute */}
        <section style={{ padding: '48px 0 40px', borderBottom: '1px solid #d4d0c8' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 14 }}>
            Open source · for Birmingham
          </div>
          <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 26, color: '#0e0f11', lineHeight: 1.3, margin: '0 0 14px', fontWeight: 400 }}>
            Built by the city, for the city. Every line of code is public.
          </h2>
          <p style={{ fontSize: 12, color: '#6b6760', lineHeight: 1.8, maxWidth: 580, marginBottom: 32 }}>
            We want you to help contribute to Ozzy.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { icon: '◈', title: 'Contribute data', body: 'Know a public dataset we\'re not using? Housing, health, schools, transport — add it. If it\'s public and it tells Birmingham\'s story, it belongs here.' },
              { icon: '▦', title: 'Contribute code', body: 'Developer? Build a new view, improve an existing one, add a new data fetcher. Next.js 14 + TypeScript. Full stack welcome.' },
              { icon: '◉', title: 'Contribute insight', body: 'Policy officer? Analyst? Community organiser? Tell us which questions matter most to your ward or your work. Shape what Ozzy focuses on.' },
            ].map(c => (
              <div key={c.icon} style={{ border: '1px solid #d4d0c8', padding: '20px 20px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 20, color: '#0e0f11', marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 16, color: '#0e0f11', marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: '#6b6760', lineHeight: 1.7 }}>{c.body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
<<<<<<< HEAD
            <a href="https://github.com/willspensley/brum-dashboard-" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', background: '#0e0f11', color: '#f5f3ee', textDecoration: 'none', letterSpacing: '.04em' }}>
              View on GitHub →
            </a>
            <a href="mailto:westmidlands@lookingforgrowth.uk" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
=======
            <a
              href="https://github.com/willspensley/brum-dashboard-"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', background: '#0e0f11', color: '#f5f3ee', textDecoration: 'none', letterSpacing: '.04em' }}
            >
              GitHub →
            </a>
            <a
              href="mailto:westmidlands@lookingforgrowth.uk"
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}
            >
>>>>>>> Rewrite about page, add pre-written Ask Ozzy page
              Contact us to contribute →
            </a>
            <a href="/sources" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '8px 18px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
              View all data sources →
            </a>
          </div>
        </section>

        {/* Roadmap */}
        <section style={{ padding: '48px 0 80px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 14 }}>
            What&apos;s in Ozzy
          </div>
          <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 26, color: '#0e0f11', lineHeight: 1.3, margin: '0 0 24px', fontWeight: 400 }}>
            This is the start. Not the finished thing.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ROADMAP.map(r => {
              const s = STATUS_STYLE[r.status];
              return (
                <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: '1px solid #d4d0c8', borderLeft: `3px solid ${s.color}` }}>
                  <span style={{ fontSize: 9, padding: '2px 6px', color: s.color, background: s.bg, whiteSpace: 'nowrap', marginTop: 2, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '.04em' }}>
                    {s.label}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#0e0f11', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: '#6b6760', lineHeight: 1.5 }}>{r.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
<<<<<<< HEAD
        </section>

        {/* Final CTA */}
        <section style={{ padding: '52px 0 0', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 32, color: '#0e0f11', lineHeight: 1.3, marginBottom: 24, fontWeight: 400 }}>
            Birmingham deserves better data.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <a href="/ozzy" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '10px 22px', background: '#0e0f11', color: '#f5f3ee', textDecoration: 'none', letterSpacing: '.04em' }}>
              Ask Ozzy →
            </a>
            <a href="/dashboard" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '10px 22px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
              View the dashboards →
            </a>
          </div>
          <div style={{ marginTop: 48, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#d4d0c8', letterSpacing: '.4em' }}>
=======
          <div style={{ marginTop: 48, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#d4d0c8', letterSpacing: '.4em', textAlign: 'center' }}>
>>>>>>> Rewrite about page, add pre-written Ask Ozzy page
            F · O · R · W · A · R · D
          </div>
        </section>

      </div>
    </div>
  );
}
