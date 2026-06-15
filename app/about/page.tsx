'use client';

import { useState, useEffect } from 'react';
import BullAscii from '@/app/components/BullAscii';
import DashboardCards from '@/app/components/DashboardCards';
import SiteFooter from '@/app/components/SiteFooter';

const ROADMAP = [
  { status: 'live',    label: 'Employment deprivation', detail: 'IMD 2025 + NOMIS claimant count, 68 wards' },
  { status: 'live',    label: 'Crime rates',            detail: 'WMP recorded offences, ward-level choropleth' },
  { status: 'live',    label: 'Education & skills',     detail: 'Census 2021 qualifications + IMD education domain' },
  { status: 'live',    label: 'Economic output',        detail: 'GVA per head, 2022, all industries' },
  { status: 'live',    label: 'Youth & NEET risk',      detail: 'Modelled composite index across 68 wards' },
  { status: 'soon',    label: 'Housing affordability',  detail: 'Land Registry price paid + ONS income data' },
  { status: 'soon',    label: 'School performance',     detail: 'DfE Ofsted + attainment data by ward' },
  { status: 'soon',    label: 'Health inequality',      detail: 'OHID / NHS fingertips — life expectancy gap' },
  { status: 'soon',    label: 'Transport connectivity', detail: 'TfWM journey times to key employment centres' },
  { status: 'planned', label: 'Full agentic chat',      detail: 'Ask Ozzy anything. Get a data-backed answer.' },
  { status: 'planned', label: 'Ozzy daily newsletter',  detail: 'Automated weekly briefing — subscribe by ward' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  live:    { label: 'Live',    color: 'var(--herald-navy)',  bg: 'rgba(28,63,148,.1)',  border: 'var(--herald-gold)' },
  soon:    { label: 'Soon',    color: 'var(--herald-blue)',  bg: 'rgba(28,63,148,.06)', border: 'var(--herald-blue)' },
  planned: { label: 'Planned', color: 'var(--muted)',        bg: 'rgba(107,103,96,.08)', border: 'var(--border-solid)' },
};

const STATS = [
  { val: '8',     lbl: 'live datasets connected' },
  { val: '68',    lbl: 'Birmingham wards covered' },
  { val: '1,000s',lbl: 'data points monitored' },
  { val: '0',     lbl: 'API keys required' },
];

export default function AboutPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'none' : 'translateY(14px)',
    transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
  });

  return (
    <div style={{ background: 'var(--paper)', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* HERO — navy field, BullAscii, coat of arms watermark */}
      <section style={{
        position: 'relative',
        background: 'var(--herald-navy)',
        padding: '72px 32px 80px',
        textAlign: 'center',
        overflow: 'hidden',
        borderBottom: '3px solid var(--herald-gold)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/birmingham-coat-of-arms.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 480, opacity: 0.05, pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto' }}>
          <div style={{ ...fade(0), marginBottom: 8 }}>
            <BullAscii />
          </div>

          <div style={{ ...fade(120), fontFamily: 'var(--serif)', fontSize: 96, lineHeight: .95, color: '#f5f3ee', letterSpacing: '-.025em', marginTop: 18 }}>
            Ozzy
          </div>

          <div style={{ ...fade(200), fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: '.24em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginTop: 14 }}>
            Birmingham · AI Intelligence
          </div>

          <div style={{ ...fade(300), fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'rgba(245,243,238,.92)', marginTop: 24, maxWidth: 620, marginInline: 'auto', lineHeight: 1.4 }}>
            &ldquo;Every city deserves to understand itself. Birmingham now has a voice that won&apos;t look away.&rdquo;
          </div>

          <div style={{ ...fade(420), marginTop: 36, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href="/ozzy" style={{
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
              padding: '12px 26px',
              background: 'var(--herald-gold)', color: 'var(--herald-navy)',
              textDecoration: 'none', letterSpacing: '.04em',
            }}>
              Ask Ozzy →
            </a>
            <a href="/dashboard" style={{
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
              padding: '12px 26px',
              background: 'transparent', color: '#f5f3ee',
              border: '1px solid rgba(245,243,238,.4)',
              textDecoration: 'none', letterSpacing: '.04em',
            }}>
              View dashboards →
            </a>
          </div>

          {/* Stats strip */}
          <div style={{ ...fade(540), marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxWidth: 760, marginInline: 'auto' }}>
            {STATS.map(s => (
              <div key={s.lbl} style={{
                borderTop: '2px solid var(--herald-gold)',
                padding: '14px 8px 4px',
              }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1, color: '#f5f3ee', letterSpacing: '-.02em' }}>
                  {s.val}
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'rgba(245,243,238,.6)', marginTop: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IS OZZY — Truth-telling intro */}
      <section style={{ background: 'var(--paper)', padding: '88px 32px 72px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'start' }} className="about-two-col">
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 18 }}>
                What is Ozzy?
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 24px', fontWeight: 400, letterSpacing: '-.01em' }}>
                An agentic agent reading every public dataset about the city.
              </h2>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, margin: '0 0 18px' }}>
                Ozzy is connected to every publicly available dataset about Birmingham &mdash; council releases, ONS, NOMIS, DLUHC, West Midlands Police, NHS fingertips. He reads them all. He cross-references them. And then he presents what they actually say.
              </p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, margin: '0 0 18px' }}>
                There are <strong style={{ color: 'var(--ink)' }}>thousands of data points</strong> about this city in the public domain. Some are quietly published. Some are released in a way that obscures the reality. Some are buried under jargon. Ozzy&apos;s job is to cut through all that &mdash; and make the truth easy to see.
              </p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>
                Not a dashboard. Not a report. Not another PowerPoint. <strong style={{ color: 'var(--ink)' }}>A voice.</strong> One that tells you where Birmingham is doing well, where it isn&apos;t, and what needs to happen next.
              </p>
            </div>

            {/* Quote panel — navy field */}
            <div style={{
              position: 'relative',
              background: 'var(--herald-navy)',
              padding: '36px 36px 32px',
              overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" style={{
                position: 'absolute', bottom: -30, right: -30,
                width: 220, opacity: 0.08, pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--herald-gold)', letterSpacing: '.12em', marginBottom: 14 }}>
                  ━━ OZZY&apos;S PROMISE
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: '#f5f3ee', lineHeight: 1.4, margin: '0 0 18px', fontWeight: 400 }}>
                  &ldquo;I&apos;m a true Brummie. I&apos;m not here to spin the numbers, I&apos;m not here to make anyone look good. I just want the truth to be told.&rdquo;
                </p>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'rgba(239,183,0,.85)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Named after Ozzy Osbourne — working class, blunt, globally Brummie, never what the establishment expected.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DANCETTY DIVIDER */}
      <div style={{
        height: 8,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='8'%3E%3Cpath d='M0 6 L14 2 L28 6' fill='none' stroke='%23efb700' stroke-width='2'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '28px 8px',
        opacity: 0.8,
      }} />

      {/* EXPLORE THE DASHBOARDS */}
      <section style={{ background: 'var(--surface)', padding: '80px 32px 80px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 14 }}>
              The Evidence Locker
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 40, color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 14px', fontWeight: 400, letterSpacing: '-.01em' }}>
              Five dashboards. One city. No spin.
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 620, marginInline: 'auto' }}>
              Each dashboard sits behind Ozzy as evidence. Real data, ward by ward, refreshed as the source publishes. Click any to explore.
            </p>
          </div>

          <DashboardCards />

          <div style={{ marginTop: 36, textAlign: 'center' }}>
            <a href="/dashboard" style={{
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
              padding: '12px 28px',
              background: 'var(--herald-navy)', color: '#f5f3ee',
              textDecoration: 'none', letterSpacing: '.04em',
            }}>
              Open the full dashboard suite →
            </a>
          </div>
        </div>
      </section>

      {/* WHAT OZZY SOUNDS LIKE — sample briefing */}
      <section style={{ background: 'var(--paper)', padding: '80px 32px 72px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 14 }}>
              What Ozzy sounds like
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--ink)', lineHeight: 1.2, margin: 0, fontWeight: 400, letterSpacing: '-.01em' }}>
              Plain talk about the data. Weekly. Daily. When it matters.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }} className="about-two-col">
            <div style={{
              position: 'relative',
              background: 'var(--herald-navy)',
              padding: '28px 32px',
              overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" style={{
                position: 'absolute', bottom: -20, right: -20,
                width: 180, opacity: 0.07, pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--herald-gold)', letterSpacing: '.12em', marginBottom: 14 }}>
                  OZZY WEEKLY · BIRMINGHAM · 28 MAY 2026
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(239,183,0,.4)', marginBottom: 14 }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(245,243,238,.88)', lineHeight: 1.75, margin: '0 0 16px' }}>
                  Claimant rate holding at 7.4% city average. Ladywood still highest at 11.1%. Sutton Four Oaks still lowest at 2.3%. The gap between them hasn&apos;t meaningfully closed in 18 months. <strong style={{ color: '#f5f3ee' }}>That should bother everyone.</strong>
                </p>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(245,243,238,.88)', lineHeight: 1.75, margin: '0 0 16px' }}>
                  Bordesley Green at no-quals decile 9, fourth year running. 35.8% of residents aged 16+ have no qualifications at all. Birmingham average is 24.1%. <strong style={{ color: '#f5f3ee' }}>This is a structural problem, not a data blip.</strong>
                </p>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--herald-gold)', lineHeight: 1.7, margin: 0 }}>
                  → What needs to happen: targeted skills investment in the Aston–Nechells–Bordesley corridor. The data has been saying this for years.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ border: '1px solid var(--border-solid)', borderLeft: '3px solid var(--herald-blue)', padding: '18px 20px' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, color: 'var(--herald-blue)', letterSpacing: '.12em', marginBottom: 8 }}>● NEW DATA DETECTED</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>
                  IMD 2025 Education domain published. 23 Birmingham wards improved vs 2019. 11 got worse. Ozzy has updated all views.
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-solid)', borderLeft: '3px solid var(--herald-red)', padding: '18px 20px' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, color: 'var(--herald-red)', letterSpacing: '.12em', marginBottom: 8 }}>▲ SIGNIFICANT SHIFT</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>
                  Kingstanding claimant rate up 1.4pp this month. Fourth consecutive rise. Worth watching.
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-solid)', borderLeft: '3px solid var(--herald-gold)', padding: '18px 20px' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, color: '#9a7a00', letterSpacing: '.12em', marginBottom: 8 }}>◈ CREDIT WHERE DUE</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>
                  Moseley, Harborne, Edgbaston all holding below 5% claimant rate. Level 4+ qualifications above 50%. Genuinely good numbers.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPEN SOURCE / CONTRIBUTE — strong CTA section */}
      <section style={{
        background: '#faf9f5',
        padding: '88px 32px 88px',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid var(--border)',
        borderBottom: '3px solid var(--herald-gold)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" style={{
          position: 'absolute', top: '50%', right: -60, transform: 'translateY(-50%)',
          width: 380, opacity: 0.04, pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'start' }} className="about-two-col">
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 14 }}>
                Open source · For Birmingham
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 22px', fontWeight: 400, letterSpacing: '-.01em' }}>
                Every line of code. Every dataset. Every methodology. <em>Public.</em>
              </h2>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, margin: '0 0 18px' }}>
                Ozzy is built in the open. The code is on GitHub. The data sources are listed. The way Ozzy reaches every conclusion is traceable, end to end.
              </p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, margin: '0 0 24px' }}>
                We need <strong style={{ color: 'var(--ink)' }}>Brummies</strong> to help build this. You don&apos;t need to code. You just need to know the city, or know a dataset, or know a question that should be asked.
              </p>

              <div style={{
                background: 'var(--surface)',
                borderTop: '3px solid var(--herald-gold)',
                border: '1px solid var(--border-solid)',
                borderTopWidth: 3,
                borderTopColor: 'var(--herald-gold)',
                padding: '22px 24px',
                marginBottom: 18,
              }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, color: 'var(--herald-gold)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Join the team
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 14, lineHeight: 1.3 }}>
                  Email us and you&apos;re added.
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 18px' }}>
                  No interview. No application. No technical bar. If you care about Birmingham and you want the truth told, we want you on the team.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href="mailto:westmidlands@lookingforgrowth.uk" style={{
                    fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                    padding: '11px 22px',
                    background: 'var(--herald-navy)', color: '#f5f3ee',
                    textDecoration: 'none', letterSpacing: '.03em',
                  }}>
                    westmidlands@lookingforgrowth.uk →
                  </a>
                  <a href="https://github.com/willspensley/brum-dashboard-" target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                    padding: '11px 22px',
                    border: '1px solid var(--herald-navy)', color: 'var(--herald-navy)',
                    textDecoration: 'none', letterSpacing: '.03em',
                  }}>
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Three contribute lanes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  glyph: '◈',
                  ttl: 'Know a dataset?',
                  body: 'Public dataset we&apos;re not using? Housing, health, schools, transport, environment. If it&apos;s public and it tells Birmingham&apos;s story, it belongs here.',
                  who: 'Council officers · researchers · journalists · curious residents',
                },
                {
                  glyph: '▦',
                  ttl: 'Can you code?',
                  body: 'Next.js 14 + TypeScript + Chart.js + Leaflet. Build a new view, improve an existing one, write a new data fetcher. Pull requests welcome.',
                  who: 'Devs of all levels · Brum tech scene · students',
                },
                {
                  glyph: '◉',
                  ttl: 'Got a question worth asking?',
                  body: 'Policy officer? Analyst? Community organiser? Tell us which questions matter most for your ward or your work. Shape what Ozzy focuses on.',
                  who: 'No technical skill required',
                },
              ].map(c => (
                <div key={c.ttl} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-solid)',
                  padding: '20px 22px',
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr',
                  gap: 18,
                  alignItems: 'start',
                }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 26,
                    color: 'var(--herald-navy)',
                    background: 'rgba(28,63,148,.08)',
                    width: 48, height: 48,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {c.glyph}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{c.ttl}</div>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 10px' }} dangerouslySetInnerHTML={{ __html: c.body }} />
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--herald-gold)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                      For: {c.who}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section style={{ background: 'var(--paper)', padding: '80px 32px 80px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 14 }}>
              What&apos;s in Ozzy
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--ink)', lineHeight: 1.2, margin: '0 0 12px', fontWeight: 400, letterSpacing: '-.01em' }}>
              This is the start. Not the finished thing.
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 620 }}>
              What Ozzy can see today, what&apos;s coming next, and what the long-term vision looks like. Want to push one of these up the list? <a href="mailto:westmidlands@lookingforgrowth.uk" style={{ color: 'var(--herald-navy)', textDecoration: 'underline', textDecorationColor: 'var(--herald-gold)' }}>Tell us.</a>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="about-two-col">
            {ROADMAP.map(r => {
              const s = STATUS_STYLE[r.status];
              return (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  padding: '16px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-solid)',
                  borderLeft: `3px solid ${s.border}`,
                }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--sans)', fontWeight: 700,
                    padding: '4px 9px',
                    color: s.color, background: s.bg,
                    whiteSpace: 'nowrap', marginTop: 2,
                    letterSpacing: '.08em', textTransform: 'uppercase',
                  }}>
                    {s.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>{r.label}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{r.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />

      <style jsx>{`
        @media (max-width: 880px) {
          .about-two-col {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
