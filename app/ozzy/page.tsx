'use client';

import { useState } from 'react';
import SiteFooter from '@/app/components/SiteFooter';

const QUESTIONS = [
  {
    q: 'Which wards have the highest unemployment right now?',
    a: `Ladywood, Aston, Nechells, Bordesley & Highgate — these consistently top Birmingham's deprivation index. Ladywood sits at 11.1% claimant rate. Sutton Four Oaks is at 2.3%. That gap hasn't meaningfully closed in 18 months.\n\nThat's not a data quirk. That's a structural problem that keeps showing up month after month.`,
    links: [{ label: 'Employment dashboard →', href: '/dashboard' }],
    tag: 'Employment',
  },
  {
    q: "What's the NEET situation for young people in Birmingham?",
    a: `Birmingham's 16–17 NEET rate sits around 6.1% — above the England average. Nationally, 1.01 million young people are NEET as of Jan–Mar 2026 (13.5%). The Milburn review is ongoing.\n\nThe worst-affected wards cluster in the north and east of the city. Youth unemployment and economic inactivity are highest where educational attainment is also lowest — the same postcode, the same families, the same decade.`,
    links: [{ label: 'Youth & NEET dashboard →', href: '/dashboard' }],
    tag: 'Youth',
  },
  {
    q: 'Which areas have the worst education outcomes?',
    a: `Bordesley Green is at no-quals decile 9 — fourth year running. 35.8% of residents aged 16+ have no qualifications at all. The city average is 24.1%.\n\nAston and Lozells also rank poorly. This isn't a blip. It's structural. Targeted skills investment in the Aston–Nechells–Bordesley corridor has been the obvious call for years.`,
    links: [{ label: 'Education & Skills dashboard →', href: '/dashboard' }],
    tag: 'Education',
  },
  {
    q: "How does crime vary across Birmingham's wards?",
    a: `City centre and Ladywood record the highest offence rates per 1,000 population — which is partly driven by footfall, not just deprivation. Outer wards like Sutton Four Oaks, Sutton Vesey, and Harborne sit well below the city average.\n\nWMP data is updated monthly. The choropleth map is the clearest way to see the pattern.`,
    links: [{ label: 'Crime dashboard →', href: '/dashboard' }],
    tag: 'Crime',
  },
  {
    q: "What does Birmingham's economic output look like by ward?",
    a: `City centre wards dominate GVA — Ladywood, which contains the CBD, generates by far the most. But strip out the commercial core and the picture changes. Residential wards like Edgbaston and Harborne carry their weight.\n\nThe Disadvantage quadrant — low GVA, high deprivation — is concentrated in the north and east. Those wards aren't just deprived, they're economically disconnected from the city they live in.`,
    links: [{ label: 'Economic Matrix →', href: '/dashboard' }],
    tag: 'Economy',
  },
  {
    q: 'What data does Ozzy actually use?',
    a: `Right now: NOMIS NM_162_1 for monthly claimant counts, IMD 2025 via Birmingham City Observatory, GVA 2022 via City Observatory, Census 2021 qualifications, WMP crime data, and ONS ward boundaries.\n\nAll public datasets. All updated as the sources publish. Modelled estimates — where real ward-level data doesn't exist — are clearly labelled throughout.`,
    links: [{ label: 'View all data sources →', href: '/sources' }],
    tag: 'Method',
  },
];

const TAG_COLOR: Record<string, string> = {
  Employment: 'var(--herald-blue)',
  Youth:      'var(--herald-navy)',
  Education:  '#2a6a4a',
  Crime:      'var(--herald-red)',
  Economy:    'var(--accent)',
  Method:     'var(--muted)',
};

export default function OzzyPage() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div style={{ background: 'var(--paper)', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Hero strip */}
      <section style={{
        position: 'relative',
        background: 'var(--herald-navy)',
        padding: '56px 32px 56px',
        overflow: 'hidden',
        borderBottom: '3px solid var(--herald-gold)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" style={{
          position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
          width: 220, opacity: 0.07, pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 920, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.22em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 14 }}>
            Ask Ozzy
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 52, color: '#f5f3ee', lineHeight: 1.1, margin: '0 0 18px', fontWeight: 400, letterSpacing: '-.015em' }}>
            What do you want to know about Birmingham?
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 16, color: 'rgba(245,243,238,.75)', lineHeight: 1.65, maxWidth: 640, margin: 0 }}>
            Pick a question below. Ozzy gives you a straight answer backed by the city&apos;s public data. Every claim is traceable to a number you can check.
          </p>
          <div style={{ marginTop: 22, fontFamily: 'var(--sans)', fontSize: 12, color: 'rgba(245,243,238,.45)', fontStyle: 'italic', maxWidth: 640 }}>
            Full agentic chat — where you type anything and Ozzy answers — is planned for a later release. <a href="/about" style={{ color: 'var(--herald-gold)', textDecoration: 'underline' }}>See the roadmap.</a>
          </div>
        </div>
      </section>

      {/* Questions accordion */}
      <section style={{ background: 'var(--paper)', padding: '52px 32px 80px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.16em', color: 'var(--herald-gold)', textTransform: 'uppercase', marginBottom: 18 }}>
            Pre-loaded questions
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border-solid)' }}>
            {QUESTIONS.map((item, i) => {
              const tagColor = TAG_COLOR[item.tag] ?? 'var(--muted)';
              const isOpen = active === i;
              return (
                <div key={i} style={{ borderBottom: i < QUESTIONS.length - 1 ? '1px solid var(--border-solid)' : 'none' }}>
                  <button
                    onClick={() => setActive(isOpen ? null : i)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: isOpen ? 'rgba(28,63,148,.04)' : 'transparent',
                      border: 'none',
                      padding: '20px 24px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                      transition: 'background .15s',
                      boxShadow: isOpen ? 'inset 3px 0 0 var(--herald-gold)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                      <span style={{
                        fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 700,
                        letterSpacing: '.1em', textTransform: 'uppercase',
                        color: tagColor,
                        background: `${tagColor}14`,
                        padding: '4px 9px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {item.tag}
                      </span>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', lineHeight: 1.4 }}>
                        {item.q}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 20,
                      color: isOpen ? 'var(--herald-gold)' : 'var(--muted)',
                      flexShrink: 0, transition: 'color .15s',
                    }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 24px 26px' }}>
                      <div style={{
                        position: 'relative',
                        background: 'var(--herald-navy)',
                        padding: '24px 26px',
                        marginBottom: 14,
                        overflow: 'hidden',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" style={{
                          position: 'absolute', bottom: -16, right: -16,
                          width: 120, opacity: 0.07, pointerEvents: 'none',
                        }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--herald-gold)', letterSpacing: '.14em', marginBottom: 14 }}>
                            ━━ OZZY · BIRMINGHAM INTELLIGENCE
                          </div>
                          {item.a.split('\n\n').map((para, pi) => (
                            <p key={pi} style={{
                              fontFamily: 'var(--sans)', fontSize: 14,
                              color: 'rgba(245,243,238,.88)',
                              lineHeight: 1.75,
                              margin: pi < item.a.split('\n\n').length - 1 ? '0 0 14px' : 0,
                            }}>
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {item.links.map(link => (
                          <a key={link.href} href={link.href} style={{
                            fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
                            padding: '9px 18px',
                            border: '1px solid var(--herald-navy)',
                            color: 'var(--herald-navy)',
                            textDecoration: 'none', letterSpacing: '.03em',
                            transition: 'all .15s',
                          }}>
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Suggestion / contact */}
          <div style={{
            marginTop: 32,
            padding: '22px 24px',
            background: 'var(--surface)',
            borderTop: '3px solid var(--herald-gold)',
            border: '1px solid var(--border-solid)',
            borderTopWidth: 3,
            borderTopColor: 'var(--herald-gold)',
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>
                A question Ozzy should answer?
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Tell us what matters to your ward, your team, or your work. We&apos;ll add it.
              </div>
            </div>
            <a href="mailto:westmidlands@lookingforgrowth.uk" style={{
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
              padding: '11px 22px',
              background: 'var(--herald-navy)', color: '#f5f3ee',
              textDecoration: 'none', letterSpacing: '.03em',
              whiteSpace: 'nowrap',
            }}>
              Suggest a question →
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
