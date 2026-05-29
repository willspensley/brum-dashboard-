'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Ward, DataSources, DataMeta, EducationWard, EduDataMeta, NeetCityData } from '@/lib/types';
import { RAMP } from '@/lib/constants';
import GridView from './tabs/GridView';
import TableView from './tabs/TableView';
import LabourScatter from './tabs/LabourScatter';
import EconomicMatrix from './tabs/EconomicMatrix';
import Compare from './tabs/Compare';
import DetailPanel from './detail/DetailPanel';
import CrimeDetailPanel from './detail/CrimeDetailPanel';
import CrimeTable from './tabs/crime/CrimeTable';
import CrimeGrid from './tabs/crime/CrimeGrid';
import OzzyView from './OzzyView';
import QualGrid from '../education/components/QualGrid';
import QualTable from '../education/components/QualTable';
import QualBars from '../education/components/QualBars';
import EduDetailPanel from '../education/components/EduDetailPanel';
import YouthDashboard from '../youth/components/YouthDashboard';

const EduMap = dynamic(() => import('../education/components/EduMap'), { ssr: false });

const MapView = dynamic(() => import('./tabs/MapView'), { ssr: false });
const CrimeMap = dynamic(() => import('./tabs/crime/CrimeMap'), { ssr: false });

const BHAM_BANNER =
  ` ____    ___   ____   __  __   ___   _   _    ____   _   _    _    __  __ \n` +
  `| __ )  |_ _| |  _ \\ |  \\/  | |_ _| | \\ | |  / ___| | | | |  / \\  |  \\/  |\n` +
  `|  _ \\   | |  | |_) || |\\/| |  | |  |  \\| | | |  _  | |_| | / _ \\ | |\\/| |\n` +
  `| |_) |  | |  |  _ < | |  | |  | |  | |\\  | | |_| | |  _  |/ ___ \\| |  | |\n` +
  `|____/  |___| |_| \\_\\|_|  |_| |___| |_| \\_|  \\____| |_| |_/_/   \\_\\_|  |_|`;

type View = 'ozzy' | 'employment' | 'crime' | 'education' | 'youth';
type EmpSub = 'grid' | 'list' | 'scatter' | 'matrix' | 'map' | 'compare';
type CrimeSub = 'crime-table' | 'crime-grid' | 'crime-map';
type EduSub = 'edu-grid' | 'edu-table' | 'edu-chart' | 'edu-map';

interface Props {
  wards: Ward[];
  dsrc: DataSources;
  dsmeta: DataMeta;
  nomisDate: string;
  eduWards: EducationWard[];
  eduMeta: EduDataMeta;
  neetData: NeetCityData;
}

const EDU_SOURCES = [
  {
    nm: 'Census 2021 — Highest Level of Qualification',
    ep: 'census-2021-highest-level-of-qualification-birmingham-wards',
    pub: 'ONS / Birmingham City Observatory',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/census-2021-highest-level-of-qualification-birmingham-wards/',
    desc: 'Usual residents aged 16+ by qualification level. 68 Birmingham wards. March 2021.',
  },
  {
    nm: 'IMD 2025 — Education, Skills & Training Domain',
    ep: 'imd-indices-of-deprivation-2025-wmca-wards-2024',
    pub: 'DLUHC / Birmingham City Observatory',
    href: 'https://cityobservatory.birmingham.gov.uk/explore/dataset/imd-indices-of-deprivation-2025-wmca-wards-2024/',
    desc: 'Education deprivation domain from IMD 2025, ward level for all WMCA wards.',
  },
  {
    nm: 'NOMIS — Census 2021 TS067 (Qualifications)',
    ep: 'NM_2084_1 · census2021-ts067-ward.csv',
    pub: 'ONS / NOMIS',
    href: 'https://www.nomisweb.co.uk/sources/census_2021',
    desc: 'Authoritative Census 2021 qualifications ZIP. Filter to E05011xxx for Birmingham wards.',
  },
];

export default function Dashboard({ wards, dsrc, dsmeta, nomisDate, eduWards, eduMeta, neetData }: Props) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('ozzy');
  const [empSub, setEmpSub] = useState<EmpSub>('grid');
  const [crimeSub, setCrimeSub] = useState<CrimeSub>('crime-table');
  const [eduSub, setEduSub] = useState<EduSub>('edu-grid');
  const [selected, setSelected] = useState<Ward | null>(null);
  const [selectedEdu, setSelectedEdu] = useState<EducationWard | null>(null);
  const [pinnedWards, setPinnedWards] = useState<string[]>([]);
  const [trendMode, setTrendMode] = useState<'12m' | 'pandemic'>('12m');
  const [showSources, setShowSources] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentHistory, setRecentHistory] = useState<string[]>([]);
  const bannerRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    try {
      const h = localStorage.getItem('ozzy_history_v2');
      if (h) setRecentHistory((JSON.parse(h) as { q: string }[]).slice(0, 12).map(x => x.q));
      const lev = localStorage.getItem('lastEmploymentView') as EmpSub | null;
      if (lev) setEmpSub(lev);
      const lcv = localStorage.getItem('lastCrimeView') as CrimeSub | null;
      if (lcv) setCrimeSub(lcv);
      const lev2 = localStorage.getItem('lastEduView') as EduSub | null;
      if (lev2) setEduSub(lev2);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const lines = BHAM_BANNER.split('\n');
    el.innerHTML = lines
      .map(l => l.split('').map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join(''))
      .join('<br>');
    const chars = el.querySelectorAll<HTMLElement>('.ch');
    const cols = lines[0].length;
    let col = 0;
    const tick = setInterval(() => {
      chars.forEach((c, i) => { if (i % cols === col) c.classList.add('in'); });
      col++;
      if (col >= cols) {
        clearInterval(tick);
        setTimeout(() => setReady(true), 400);
      }
    }, 12);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
        if ((e.key === 'm' || e.key === 'M') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          setSidebarOpen(o => !o);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  const togglePin = (code: string) => {
    setPinnedWards(prev => {
      const idx = prev.indexOf(code);
      if (idx >= 0) return prev.filter(c => c !== code);
      if (prev.length < 2) return [...prev, code];
      return [prev[1], code];
    });
  };

  const handleAddHistory = useCallback((q: string) => {
    setRecentHistory(prev => {
      const next = [q, ...prev.filter(h => h !== q)].slice(0, 12);
      try {
        const full: { q: string; ts: number }[] = next.map(x => ({ q: x, ts: Date.now() }));
        localStorage.setItem('ozzy_history_v2', JSON.stringify(full));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const navigateFromHistory = useCallback((q: string) => {
    setSidebarOpen(false);
    setView('ozzy');
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.ozzy-input');
      if (input) { input.value = q; input.focus(); }
    }, 60);
  }, []);

  const setEmpSubPersist = (s: EmpSub) => {
    setEmpSub(s);
    try { localStorage.setItem('lastEmploymentView', s); } catch { /* ignore */ }
  };
  const setCrimeSubPersist = (s: CrimeSub) => {
    setCrimeSub(s);
    try { localStorage.setItem('lastCrimeView', s); } catch { /* ignore */ }
  };
  const setEduSubPersist = (s: EduSub) => {
    setEduSub(s);
    try { localStorage.setItem('lastEduView', s); } catch { /* ignore */ }
  };

  const handleOpenView = useCallback((v: string) => {
    if (v === 'crime')      { setView('crime');      setSidebarOpen(false); }
    else if (v === 'matrix')    { setView('employment'); setEmpSub('matrix'); setSidebarOpen(false); }
    else if (v === 'employment') { setView('employment'); setSidebarOpen(false); }
    else if (v === 'education')  { setView('education'); setSidebarOpen(false); }
    else if (v === 'youth')      { setView('youth'); setSidebarOpen(false); }
  }, []);

  // Employment stats
  const avg      = (wards.reduce((s, w) => s + w.claimant_rate, 0) / wards.length).toFixed(1);
  const sorted   = [...wards].sort((a, b) => b.claimant_rate - a.claimant_rate);
  const depCount = wards.filter(w => w.composite_decile >= 9).length;

  // Crime stats
  const avgCrime    = (wards.reduce((s, w) => s + w.crime_rate_per_1000, 0) / wards.length).toFixed(1);
  const sortedCrime = [...wards].sort((a, b) => b.crime_rate_per_1000 - a.crime_rate_per_1000);

  // Education stats
  const sortedEdu   = [...eduWards].sort((a, b) => b.qual_none - a.qual_none);
  const avgNone     = (eduWards.reduce((s, w) => s + w.qual_none, 0) / eduWards.length).toFixed(1);
  const avgL4       = (eduWards.reduce((s, w) => s + w.qual_level4plus, 0) / eduWards.length).toFixed(1);
  const highEduDep  = eduWards.filter(w => w.imd_edu_decile >= 8).length;

  const isOzzy  = view === 'ozzy';
  const isCrime = view === 'crime';
  const isEdu   = view === 'education';
  const isYouth = view === 'youth';

  const bodyClass = isOzzy ? ' ozzy-mode' : isCrime ? ' crime-mode' : isEdu ? ' edu-mode' : '';

  return (
    <>
      {/* Loading overlay */}
      <div id="overlay" className={ready ? 'fade' : ''}>
        <div className="scan-line" />
        <pre className="bham-mega" ref={bannerRef} id="bham-mega" />
        <div className="load-meta">
          <div className="load-headline">Initialising the intelligence pipeline</div>
          <div className="load-sub">Birmingham City Council · Employment Deprivation v4.0</div>
          <div className="t-log">
            <div className="t-line vis">
              <span className="t-ts">—</span>
              <span className="tbadge tb-info">INIT</span>
              <span className="t-msg">Data loaded server-side — <b>{wards.length} wards</b> · {Object.values(dsrc).filter(v => v === 'live').length}/4 live layers</span>
            </div>
          </div>
          <div className="t-prog-wrap"><div className="t-prog-fill" style={{ width: '100%' }} /></div>
        </div>
      </div>

      <div className="error-toast" id="error-toast"><span>⚠</span><span id="etxt" /></div>

      {/* Sidebar backdrop */}
      <div className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-hidden={!sidebarOpen}>
        <div className="sidebar-hdr">
          <span className="sidebar-ttl">Menu</span>
          <button className="sidebar-x" onClick={() => setSidebarOpen(false)} aria-label="Close menu">×</button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-ttl">Ozzy</div>
          <button
            className={`side-nav-btn${isOzzy ? ' active' : ''}`}
            onClick={() => { setView('ozzy'); setSidebarOpen(false); }}
          >
            <span className="side-nav-glyph">O</span> Conversation
          </button>
          <button
            className="side-nav-btn"
            onClick={() => {
              try { localStorage.removeItem('ozzy_conv_v2'); } catch { /* ignore */ }
              setView('ozzy');
              setSidebarOpen(false);
              window.location.reload();
            }}
          >
            <span className="side-nav-glyph">+</span> New conversation
          </button>
          <a href="/about" className="side-nav-btn" style={{ textDecoration: 'none' }}>
            <span className="side-nav-glyph">◉</span> About Ozzy
          </a>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-ttl">Recent questions</div>
          <div className="sidebar-history-list">
            {recentHistory.length === 0
              ? <div className="sidebar-history-empty">no history yet</div>
              : recentHistory.slice(0, 2).map((q, i) => (
                <button key={i} className="sidebar-history-item" onClick={() => navigateFromHistory(q)}>
                  {q}
                </button>
              ))
            }
            {recentHistory.length > 2 && (
              <button className="sidebar-history-more" onClick={() => {
                recentHistory.slice(2).forEach(q => {
                  const btn = document.createElement('button');
                  btn.className = 'sidebar-history-item';
                  btn.textContent = q;
                  btn.onclick = () => navigateFromHistory(q);
                });
              }}>
                + {recentHistory.length - 2} more
              </button>
            )}
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-ttl">Dashboards</div>
          <button
            className={`side-nav-btn${view === 'employment' ? ' active' : ''}`}
            onClick={() => { setView('employment'); setSidebarOpen(false); }}
          >
            <span className="side-nav-glyph">▦</span> Employment Deprivation
          </button>
          <button
            className={`side-nav-btn${isCrime ? ' active' : ''}`}
            onClick={() => { setView('crime'); setSidebarOpen(false); }}
          >
            <span className="side-nav-glyph">⚠</span> Crime Dashboard
            {dsrc.crime === 'live' && <span className="side-live-dot">●</span>}
          </button>
          <button
            className={`side-nav-btn${isEdu ? ' active' : ''}`}
            onClick={() => { setView('education'); setSidebarOpen(false); }}
          >
            <span className="side-nav-glyph">◈</span> Education &amp; Skills
            {eduMeta.quals.source === 'live' && <span className="side-live-dot">●</span>}
          </button>
          <button
            className={`side-nav-btn${isYouth ? ' active' : ''}`}
            onClick={() => { setView('youth'); setSidebarOpen(false); }}
          >
            <span className="side-nav-glyph">◑</span> Youth &amp; NEET Risk
            {dsrc.neet === 'live' && <span className="side-live-dot">●</span>}
          </button>
        </div>
        <div className="sidebar-foot">F·O·R·W·A·R·D</div>
      </aside>

      {/* Dashboard */}
      <div className="wrap" style={{ display: ready ? 'flex' : 'none' }}>

        {/* Header */}
        <div className="hdr" style={{ position: 'relative' }}>
          <div className="hdr-brand">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Open menu">
              <span className="st-lines"><span /><span /><span /></span>
            </button>
            <div className="bcc-badge" title="Birmingham City Council">
              <span>▶ FORWARD</span>B·C·C
            </div>
            <div>
              <div className="hdr-title">Birmingham — Ozzy</div>
              <div className="hdr-sub">
                {isEdu
                  ? '68 wards · Census 2021 · IMD 2025 Education Domain'
                  : isYouth
                  ? '68 wards · NOMIS 16–24 · IMD 2025 · Census 2021 · modelled NEET risk index'
                  : '68 wards · IMD 2025 · NOMIS · Census 2021 · GVA 2022'}
              </div>
            </div>
          </div>
          <div />
          <div className="hdr-right">
            {isEdu ? (
              <>
                <span className="dsbadge" title={eduMeta.quals.source === 'live' ? `City Observatory — ${eduMeta.quals.wards} wards` : eduMeta.quals.err ?? 'Embedded Census 2021 snapshot'}>
                  Qualifications <span className={eduMeta.quals.source === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
                <span className="dsbadge" title={eduMeta.imd.source === 'live' ? `IMD 2025 edu — ${eduMeta.imd.wards} wards` : eduMeta.imd.err ?? 'Embedded IMD scores'}>
                  IMD 2025 <span className={eduMeta.imd.source === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
              </>
            ) : isYouth ? (
              <>
                <span className="dsbadge" title={dsrc.neet === 'live' ? `NOMIS 16–24 claimant count — live` : 'Youth claimants modelled from total claimant rate'}>
                  NOMIS 16–24 <span className={dsrc.neet === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
                <span className="dsbadge" title={`Birmingham NEET ${neetData.bham_year}: ${neetData.bham_neet_pct ?? 'est. 6–7'}% [${neetData.source}]`}>
                  NEET {neetData.bham_year} <span className={neetData.source === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
                <span className="dsbadge" title="NEET risk index is a modelled composite — not an official rate">
                  Risk index <span className="dot-cache">●</span> modelled
                </span>
              </>
            ) : (
              <>
                <span className="dsbadge" title={dsrc.imd === 'live' ? 'IMD 2025 — live from City Observatory' : 'IMD embedded cache'}>
                  IMD 2025 <span className={dsrc.imd === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
                <span className="dsbadge" title={dsrc.nomis === 'live' ? `NOMIS ${nomisDate} — fetched live` : 'NOMIS embedded Jan 2026 cache'}>
                  NOMIS {nomisDate} <span className={dsrc.nomis === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
                <span className="dsbadge" title={dsrc.crime === 'live' ? 'WMP Crime — live from City Observatory' : 'Crime rates modelled from composite score'}>
                  Crime <span className={dsrc.crime === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
                <span className="dsbadge" title={dsrc.gva === 'live' ? 'GVA 2022 — live, per-head computed' : 'GVA synthesised from ward bands'}>
                  GVA 2022 <span className={dsrc.gva === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
                </span>
              </>
            )}
            <button className="refresh-btn" onClick={() => setShowSources(s => !s)}>
              <span>⌥</span> sources
            </button>
            <button className="print-btn" onClick={() => window.print()}>⎙ print</button>
          </div>

          {showSources && (
            <div className="sources-drawer">
              <div className="sources-hdr">
                <h3>Data sources</h3>
                <button className="x" onClick={() => setShowSources(false)}>×</button>
              </div>
              {isEdu ? (
                EDU_SOURCES.map(s => (
                  <div className="src-row" key={s.nm}>
                    <div className="src-row-top">
                      <span className="src-name">{s.nm}</span>
                      <span className="src-status src-static">Census 2021 / IMD 2025</span>
                    </div>
                    <div className="src-meta">
                      {s.desc}<br />
                      <span style={{ opacity: 0.7 }}>{s.pub} · {s.ep}</span>
                      {' · '}
                      <a href={s.href} target="_blank" rel="noopener noreferrer">View dataset ↗</a>
                    </div>
                  </div>
                ))
              ) : (
                [
                  { nm: 'NOMIS — Claimant Count', ep: 'NM_162_1 · ward geography', pub: 'ONS · DWP', st: dsrc.nomis, desc: dsmeta.nomis.err ? `Error: ${dsmeta.nomis.err}. Using embedded Jan 2026 snapshot.` : dsrc.nomis === 'live' ? `${dsmeta.nomis.count} wards · ${dsmeta.nomis.date}` : 'Embedded Jan 2026 snapshot — 68 wards.' },
                  { nm: 'IMD 2025 — Employment Domain', ep: 'imd-indices-of-deprivation-2025-wmca-lsoa-2021', pub: 'Birmingham City Observatory', st: dsrc.imd, desc: dsmeta.imd.err ? `Error: ${dsmeta.imd.err}. Using embedded IMD 2025.` : dsrc.imd === 'live' ? `${dsmeta.imd.lsoas} LSOAs → ${dsmeta.imd.wards} wards` : 'Embedded IMD 2025 employment scores.' },
                  { nm: 'GVA 2022 — Per-Head Output', ep: 'gross-value-added-gva-all-industries-birmingham-wards', pub: 'Birmingham City Observatory', st: dsrc.gva, desc: dsmeta.gva.err ? `Error: ${dsmeta.gva.err}. Synthesised from ward character bands.` : dsrc.gva === 'live' ? `${dsmeta.gva.count} wards · joined with Census population` : 'Synthesised from ward character bands.' },
                  { nm: 'ONS Ward Boundaries', ep: 'Wards Dec 2022 BGC', pub: 'ONS', st: 'static' as const, desc: 'Fetched on demand when Map tab opens. GeoJSON, ~69 features for E08000025.' },
                  { nm: 'Census 2021 — Inactivity & Skills', ep: 'TS066, TS067 (modelled)', pub: 'ONS Census 2021', st: 'static' as const, desc: 'Inactivity rates embedded. Youth unemployment, UC %, vacancies are modelled estimates.' },
                ].map(r => (
                  <div className="src-row" key={r.nm}>
                    <div className="src-row-top">
                      <span className="src-name">{r.nm}</span>
                      {r.st === 'static' ? <span className="src-status src-static">EMBEDDED</span> :
                        r.st === 'live' ? <span className="src-status src-live">● LIVE</span> :
                          <span className="src-status src-cache">● CACHED</span>}
                    </div>
                    <div className="src-meta">{r.desc}<br /><span style={{ opacity: 0.7 }}>{r.pub} · {r.ep}</span></div>
                  </div>
                ))
              )}
              <div className="src-foot">
                {isEdu
                  ? 'All education data is publicly available. No API key required. Data loaded server-side with a 24hr cache.'
                  : <><b style={{ color: 'var(--q-prosp)' }}>●</b> Live = fetched server-side this render.{' '}<b style={{ color: '#7d4e36' }}>●</b> Cached = endpoint unreachable, embedded snapshot used.</>}
                <div style={{ marginTop: 8 }}>
                  <a href="/sources" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink)', textDecoration: 'underline', letterSpacing: '.04em' }}>
                    View all sources ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`body${bodyClass}`}>
          <div className="lcol">

            {/* Employment stats row — hidden in ozzy-mode, crime-mode, edu-mode via CSS */}
            <div className="stats-row emp-stats">
              <div className="stat-card">
                <div className="stat-lbl">Birmingham avg</div>
                <div className="stat-val">{avg}%</div>
                <div className="stat-sub">claimant rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">Highest ward</div>
                <div className="stat-val txt">{sorted[0].ward_name}</div>
                <div className="stat-sub">{sorted[0].claimant_rate}% claimant rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">Lowest ward</div>
                <div className="stat-val txt">{sorted[sorted.length - 1].ward_name}</div>
                <div className="stat-sub">{sorted[sorted.length - 1].claimant_rate}% claimant rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">Decile 9–10</div>
                <div className="stat-val">{depCount}</div>
                <div className="stat-sub">most deprived wards</div>
              </div>
            </div>

            {/* Crime stats row */}
            {isCrime && (
              <div className="stats-row crime-stats">
                <div className="stat-card">
                  <div className="stat-lbl">City avg crime</div>
                  <div className="stat-val">{avgCrime}</div>
                  <div className="stat-sub">per 1,000 pop</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">Highest ward</div>
                  <div className="stat-val txt">{sortedCrime[0].ward_name}</div>
                  <div className="stat-sub">{sortedCrime[0].crime_rate_per_1000.toFixed(1)}/1000</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">Lowest ward</div>
                  <div className="stat-val txt">{sortedCrime[sortedCrime.length - 1].ward_name}</div>
                  <div className="stat-sub">{sortedCrime[sortedCrime.length - 1].crime_rate_per_1000.toFixed(1)}/1000</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">Data source</div>
                  <div className="stat-val txt" style={{ fontSize: 14 }}>{dsrc.crime === 'live' ? 'WMP Live' : 'Modelled'}</div>
                  <div className="stat-sub">WMP via City Observatory</div>
                </div>
              </div>
            )}

            {/* Education stats row */}
            {isEdu && (
              <div className="stats-row edu-stats">
                <div className="stat-card">
                  <div className="stat-lbl">Birmingham avg</div>
                  <div className="stat-val">{avgNone}%</div>
                  <div className="stat-sub">no qualifications</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">Highest no-quals ward</div>
                  <div className="stat-val txt">{sortedEdu[0]?.ward_name}</div>
                  <div className="stat-sub">{sortedEdu[0]?.qual_none}% no qualifications</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">Birmingham avg</div>
                  <div className="stat-val">{avgL4}%</div>
                  <div className="stat-sub">Level 4+ (degree)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-lbl">IMD edu decile 8–10</div>
                  <div className="stat-val">{highEduDep}</div>
                  <div className="stat-sub">most skills-deprived wards</div>
                </div>
              </div>
            )}

            {/* Breadcrumb + legend — employment */}
            {view === 'employment' && (
              <div className="data-view-toolbar">
                <div className="breadcrumb">
                  <button className="breadcrumb-back" onClick={() => setView('ozzy')}>← Ozzy</button>
                  <span style={{ margin: '0 6px' }}>/</span>
                  <span>Employment Deprivation</span>
                </div>
                <div className="legend-row">
                  <span className="llbl" style={{ marginRight: 2 }}>Low</span>
                  {RAMP.map((c, i) => <div key={i} className="lsw" style={{ background: c }} />)}
                  <span className="llbl" style={{ marginLeft: 2 }}>High disadvantage</span>
                </div>
              </div>
            )}

            {/* Breadcrumb — crime */}
            {isCrime && (
              <div className="data-view-toolbar">
                <div className="breadcrumb">
                  <button className="breadcrumb-back" onClick={() => setView('ozzy')}>← Ozzy</button>
                  <span style={{ margin: '0 6px' }}>/</span>
                  <span>Crime Dashboard</span>
                </div>
              </div>
            )}

            {/* Breadcrumb + legend — education */}
            {isEdu && (
              <div className="data-view-toolbar">
                <div className="breadcrumb">
                  <button className="breadcrumb-back" onClick={() => setView('ozzy')}>← Ozzy</button>
                  <span style={{ margin: '0 6px' }}>/</span>
                  <span>Education &amp; Skills</span>
                </div>
                <div className="legend-row">
                  <span className="llbl" style={{ marginRight: 2 }}>Low</span>
                  {RAMP.map((c, i) => <div key={i} className="lsw" style={{ background: c }} />)}
                  <span className="llbl" style={{ marginLeft: 2 }}>High — % no quals</span>
                </div>
              </div>
            )}

            {/* Employment sub-tabs */}
            {view === 'employment' && (
              <div className="sub-tab-bar">
                {([['grid', 'Grid'], ['list', 'Table'], ['scatter', 'Labour Scatter'], ['matrix', 'Economic Matrix'], ['map', 'Map'], ['compare', 'Compare']] as [EmpSub, string][]).map(([s, lbl]) => (
                  <button key={s} className={`sub-tab${empSub === s ? ' active' : ''}`} onClick={() => setEmpSubPersist(s)}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {/* Crime sub-tabs */}
            {isCrime && (
              <div className="sub-tab-bar">
                {([['crime-table', 'Table'], ['crime-grid', 'Grid'], ['crime-map', 'Map']] as [CrimeSub, string][]).map(([s, lbl]) => (
                  <button key={s} className={`sub-tab${crimeSub === s ? ' active' : ''}`} onClick={() => setCrimeSubPersist(s)}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {/* Education sub-tabs */}
            {isEdu && (
              <div className="sub-tab-bar">
                {([['edu-grid', 'Grid'], ['edu-table', 'Table'], ['edu-chart', 'Distribution'], ['edu-map', 'Map']] as [EduSub, string][]).map(([s, lbl]) => (
                  <button key={s} className={`sub-tab${eduSub === s ? ' active' : ''}`} onClick={() => setEduSubPersist(s)}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {/* Panel */}
            <div className="panel" style={{ flex: 1, position: 'relative' }}>
              <div className="panel-body">
                {isOzzy && (
                  <OzzyView
                    wards={wards}
                    dsrc={dsrc}
                    neetData={neetData}
                    onAddHistory={handleAddHistory}
                    onOpenView={handleOpenView}
                  />
                )}
                {/* Employment sub-views */}
                {view === 'employment' && empSub === 'grid'    && <GridView wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'list'    && <TableView wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'scatter' && <LabourScatter wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'matrix'  && <EconomicMatrix wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'map'     && <MapView wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'compare' && <Compare wards={wards} pinnedWards={pinnedWards} onUnpin={togglePin} />}
                {/* Crime sub-views */}
                {isCrime && crimeSub === 'crime-table' && <CrimeTable wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {isCrime && crimeSub === 'crime-grid'  && <CrimeGrid  wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {isCrime && crimeSub === 'crime-map'   && <CrimeMap   wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {/* Education sub-views */}
                {isEdu && eduSub === 'edu-grid'  && <QualGrid  wards={eduWards} selected={selectedEdu} onSelect={code => setSelectedEdu(eduWards.find(w => w.ward_code === code) ?? null)} />}
                {isEdu && eduSub === 'edu-table' && <QualTable wards={eduWards} selected={selectedEdu} onSelect={code => setSelectedEdu(eduWards.find(w => w.ward_code === code) ?? null)} />}
                {isEdu && eduSub === 'edu-chart' && (
                  <div style={{ padding: '18px 18px 0' }}>
                    <QualBars wards={eduWards} selected={selectedEdu} />
                  </div>
                )}
                {isEdu && eduSub === 'edu-map' && (
                  <EduMap wards={eduWards} onSelect={code => setSelectedEdu(eduWards.find(w => w.ward_code === code) ?? null)} />
                )}
                {/* Youth & NEET risk */}
                {isYouth && <YouthDashboard wards={wards} neetData={neetData} />}
              </div>
              {!isOzzy && <div className="bham-watermark">FORWARD · BIRMINGHAM</div>}
            </div>

          </div>

          {/* Right detail panel */}
          <div className="rcol">
            {isEdu ? (
              selectedEdu ? (
                <EduDetailPanel
                  ward={selectedEdu}
                  wards={eduWards}
                  onClose={() => setSelectedEdu(null)}
                />
              ) : (
                <>
                  <div className="r-empty">
                    <div className="ascii-ward">{`┌─────────────────────┐
 │  (\\/)  (\\/)         │
 │   \\  \\/  /          │
 │ .--\\----/--.        │
 │/  ( o)(o)  \\        │
 │|    (---)   |       │
 │ \\___________/       │
 └─────────────────────┘`}</div>
                    <p>Select any ward to see its full qualification breakdown.</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 9, fontStyle: 'normal', color: 'rgba(14,15,17,.18)', letterSpacing: '.18em' }}>THE BULL OF BIRMINGHAM</p>
                  </div>
                  {/* Data sources — visible in right panel when no ward selected */}
                  <div style={{ margin: '0 18px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ padding: '14px 0 8px', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)' }}>Data sources</div>
                    {EDU_SOURCES.map(s => (
                      <div key={s.nm} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{s.nm}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 5 }}>{s.desc}</div>
                        <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#1a2a3a', textDecoration: 'underline' }}>
                          View dataset ↗
                        </a>
                      </div>
                    ))}
                    <div style={{ padding: '10px 0', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted2)', lineHeight: 1.6 }}>
                      All sources are publicly available. No API key required.
                      {eduMeta.quals.source === 'live' ? ' Qualifications fetched live.' : ' Using embedded Census 2021 snapshot.'}
                    </div>
                  </div>
                </>
              )
            ) : selected ? (
              isCrime ? (
                <CrimeDetailPanel
                  ward={selected}
                  wards={wards}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <DetailPanel
                  ward={selected}
                  wards={wards}
                  dsrc={dsrc}
                  isPinned={pinnedWards.includes(selected.ward_code)}
                  onPin={() => togglePin(selected.ward_code)}
                  onClose={() => setSelected(null)}
                  trendMode={trendMode}
                  onTrendMode={setTrendMode}
                />
              )
            ) : (
              <div className="r-empty">
                <div className="ascii-ward">{`┌─────────────────────┐
 │  (\\/)  (\\/)         │
 │   \\  \\/  /          │
 │ .--\\----/--.        │
 │/  ( o)(o)  \\        │
 │|    (---)   |       │
 │ \\___________/       │
 └─────────────────────┘`}</div>
                <p>Select any ward to see a detailed breakdown.</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 9, fontStyle: 'normal', color: 'rgba(14,15,17,.18)', letterSpacing: '.18em' }}>THE BULL OF BIRMINGHAM</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
