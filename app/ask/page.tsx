'use client';

import { useState } from 'react';

interface QA {
  id: string;
  q: string;
  tag: string;
  answer: string[];
  dashboardLabel: string;
  dashboardHref: string;
  dashboardView?: string;
}

const QAS: QA[] = [
  {
    id: 'unemployment',
    q: 'Which Birmingham wards have the highest unemployment?',
    tag: 'Employment',
    answer: [
      'The data is stark. Ladywood leads the city with an 11.1% claimant rate — more than four times higher than Sutton Four Oaks at 2.3%. The top five highest-unemployment wards are all concentrated in the inner city: Ladywood, Nechells, Bordesley Green, Aston, and Handsworth Wood.',
      'These aren\'t isolated pockets. They form a contiguous corridor of deprivation running north from the city centre. The gap between the best and worst wards hasn\'t meaningfully closed in 18 months. That should concern anyone working on economic policy for this city.',
      'The data comes from NOMIS claimant count (NM_162_1), updated monthly. IMD 2025 employment domain confirms the same picture.',
    ],
    dashboardLabel: 'Employment deprivation dashboard →',
    dashboardHref: '/',
    dashboardView: 'employment',
  },
  {
    id: 'neet',
    q: 'How does Birmingham\'s NEET rate compare nationally?',
    tag: 'Youth',
    answer: [
      'The national NEET rate for 16–24 year olds stands at 13.5% — that\'s 1.01 million young people not in education, employment or training, as of January–March 2026. Birmingham\'s estimated rate sits at around 6–7% for 16–17 year olds specifically, based on DfE NCCIS data at local authority level.',
      'The West Midlands Combined Authority average is around 5–6%. But ward-level NEET data doesn\'t exist in public sources. Ozzy uses a modelled composite index — youth UC claimant rate (50%), health-related inactivity (30%), and IMD 2025 employment score (20%) — to identify the wards most at risk.',
      'The Milburn Review, launched November 2025 and led by Alan Milburn, is investigating youth inactivity with a focus on mental health and disability as barriers. Interim findings are expected Spring 2026.',
    ],
    dashboardLabel: 'Youth & NEET Risk dashboard →',
    dashboardHref: '/',
    dashboardView: 'youth',
  },
  {
    id: 'crime',
    q: 'Which areas have the highest crime rates?',
    tag: 'Crime',
    answer: [
      'Crime is unevenly distributed across Birmingham and the pattern closely mirrors deprivation. Inner-city wards consistently record the highest offence rates per 1,000 population, based on West Midlands Police recorded crime figures.',
      'Areas around the city centre and the inner ring road wards see the highest concentrations of recorded crime. It\'s worth noting that crime rates and deprivation are strongly correlated — high-crime areas are almost always high-unemployment, high-deprivation areas too.',
      'Treating crime in isolation from economic context misses the point. The data shows this clearly.',
    ],
    dashboardLabel: 'Crime rates dashboard →',
    dashboardHref: '/',
    dashboardView: 'crime',
  },
  {
    id: 'education',
    q: 'What does the education data tell us about Birmingham?',
    tag: 'Education',
    answer: [
      'The education picture is one of the most persistent challenges in the city\'s data. Bordesley Green has been at no-qualifications decile 9 for four years running — 35.8% of residents aged 16+ have no qualifications at all. The city average is 24.1%, which is itself above the national average.',
      'Level 4+ qualifications (degree-level and above) tell the other side of the story: Harborne, Moseley, and Edgbaston are above 50%, while multiple inner-city wards are below 15%.',
      'The data is from Census 2021 and IMD 2025 education domain. The education gap in Birmingham isn\'t closing — it\'s a structural problem requiring structural investment.',
    ],
    dashboardLabel: 'Education & skills dashboard →',
    dashboardHref: '/',
    dashboardView: 'education',
  },
  {
    id: 'neet-index',
    q: 'What is the NEET risk index and how is it calculated?',
    tag: 'Youth',
    answer: [
      'The NEET risk index is Ozzy\'s modelled composite — it does not exist as an official statistic, and it\'s clearly labelled throughout as modelled. No ward-level NEET data exists in public sources; DfE NCCIS only publishes at local authority level.',
      'The index combines three factors: youth UC claimant rate for 16–24 year olds from NOMIS (weighted 50%), health-related inactivity from Census 2021 (weighted 30%), and IMD 2025 employment deprivation score (weighted 20%). Wards are ranked and assigned a risk decile from 1 (lowest) to 10 (highest).',
      'It\'s a tool for identifying where to focus attention — not a substitute for actual NEET data.',
    ],
    dashboardLabel: 'Youth & NEET Risk dashboard →',
    dashboardHref: '/',
    dashboardView: 'youth',
  },
  {
    id: 'deprivation',
    q: 'How does deprivation vary across Birmingham\'s 68 wards?',
    tag: 'Employment',
    answer: [
      'Birmingham has 68 wards under the December 2022 boundary set. Deprivation is highly concentrated in the inner city and northeastern areas. Using the IMD 2025 composite, wards like Bordesley Green, Nechells, Ladywood, Aston, and Handsworth Wood consistently sit at deprivation decile 9–10.',
      'The south and southwest of the city — Harborne, Edgbaston, Sutton Four Oaks — are at the other end, decile 1–3. The spatial pattern of deprivation in Birmingham is not random.',
      'It reflects decades of industrial decline, underinvestment in skills, and inadequate transport connectivity to employment centres. The data has been saying this for years.',
    ],
    dashboardLabel: 'Employment deprivation dashboard →',
    dashboardHref: '/',
    dashboardView: 'employment',
  },
];

const TAG_COLORS: Record<string, { color: string; bg: string }> = {
  Employment: { color: '#1a3a2a', bg: 'rgba(26,58,42,.1)' },
  Youth:      { color: '#3a1a1a', bg: 'rgba(58,26,26,.1)' },
  Crime:      { color: '#1a2a3a', bg: 'rgba(26,42,58,.1)' },
  Education:  { color: '#2a1a3a', bg: 'rgba(42,26,58,.1)' },
};

export default function AskPage() {
  const [active, setActive] = useState<string | null>(null);
  const activeQA = QAS.find(q => q.id === active) ?? null;

  return (
    <div style={{ background: '#f5f3ee', minHeight: '100vh', fontFamily: 'IBM Plex Mono, monospace' }}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #d4d0c8', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 12, background: '#f5f3ee', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/about" style={{ fontSize: 10, color: '#6b6760', textDecoration: 'none', padding: '4px 8px', border: '1px solid #d4d0c8', letterSpacing: '.04em' }}>
          ← About
        </a>
        <span style={{ fontSize: 10, color: '#6b6760', letterSpacing: '.04em' }}>▶ FORWARD · B·C·C</span>
        <span style={{ fontSize: 10, color: '#6b6760', marginLeft: 'auto', letterSpacing: '.06em' }}>BIRMINGHAM AI INTELLIGENCE</span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '52px 28px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: '#6b6760', textTransform: 'uppercase', marginBottom: 14 }}>
            Ask Ozzy
          </div>
          <h1 style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontSize: 42, color: '#0e0f11', lineHeight: 1.15, margin: '0 0 16px', fontWeight: 400, letterSpacing: '-.02em' }}>
            What do you want to know about Birmingham?
          </h1>
          <p style={{ fontSize: 11, color: '#6b6760', lineHeight: 1.7, maxWidth: 560, margin: '0 0 16px' }}>
            Select a question below to get Ozzy&apos;s take — data-backed, plain spoken, no filter.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #d4d0c8', background: 'rgba(26,42,58,.04)' }}>
            <span style={{ fontSize: 9, color: '#1a2a3a', letterSpacing: '.06em' }}>◎ FULL AI CHAT</span>
            <span style={{ fontSize: 10, color: '#6b6760' }}>Coming soon — Ozzy will answer anything, live.</span>
          </div>
        </div>

        {/* Two-column layout: questions left, response right */}
        <div style={{ display: 'grid', gridTemplateColumns: active ? '1fr 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* Question list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QAS.map(qa => {
              const tag = TAG_COLORS[qa.tag] ?? { color: '#6b6760', bg: 'rgba(107,103,96,.1)' };
              const isActive = active === qa.id;
              return (
                <button
                  key={qa.id}
                  onClick={() => setActive(isActive ? null : qa.id)}
                  style={{
                    all: 'unset',
                    display: 'block',
                    cursor: 'pointer',
                    padding: '14px 16px',
                    border: `1px solid ${isActive ? '#0e0f11' : '#d4d0c8'}`,
                    borderLeft: `3px solid ${isActive ? '#0e0f11' : tag.color}`,
                    background: isActive ? '#0e0f11' : '#f5f3ee',
                    transition: 'all .15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 8, padding: '2px 6px', color: isActive ? '#f5f3ee' : tag.color, background: isActive ? 'rgba(255,255,255,.1)' : tag.bg, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '.04em' }}>
                      {qa.tag}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: isActive ? '#f5f3ee' : '#0e0f11', lineHeight: 1.5, textAlign: 'left' }}>
                    {qa.q}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Response panel */}
          {activeQA && (
            <div style={{ border: '1px solid #d4d0c8', background: '#0e0f11' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#7a8270', letterSpacing: '.1em', marginBottom: 6 }}>
                  OZZY · BIRMINGHAM
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#7d4e36' }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
              </div>
              <div style={{ padding: '20px 20px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#7a8270', marginBottom: 14, letterSpacing: '.04em' }}>
                  Q: {activeQA.q}
                </div>
                {activeQA.answer.map((para, i) => (
                  <p key={i} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#d4d0c8', lineHeight: 1.8, margin: i < activeQA.answer.length - 1 ? '0 0 14px' : 0 }}>
                    {para}
                  </p>
                ))}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                  <a
                    href={activeQA.dashboardHref}
                    style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#7d4e36', textDecoration: 'none', letterSpacing: '.04em' }}
                  >
                    {activeQA.dashboardLabel}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '1px solid #d4d0c8', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, padding: '7px 14px', background: '#0e0f11', color: '#f5f3ee', textDecoration: 'none', letterSpacing: '.04em' }}>
            View all dashboards →
          </a>
          <a href="/about" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, padding: '7px 14px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
            About Ozzy →
          </a>
          <a href="mailto:westmidlands@lookingforgrowth.uk" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, padding: '7px 14px', border: '1px solid #d4d0c8', color: '#6b6760', textDecoration: 'none', letterSpacing: '.04em' }}>
            Contact us →
          </a>
        </div>
        <div style={{ marginTop: 40, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#d4d0c8', letterSpacing: '.4em', textAlign: 'center' }}>
          F · O · R · W · A · R · D
        </div>

      </div>
    </div>
  );
}
