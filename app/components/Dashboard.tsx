'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Ward, DataSources, DataMeta, EducationWard, EduDataMeta, NeetCityData, CrimeWard, BenefitsData, UcEmpData, HousingBenefitData, ClaimantData } from '@/lib/types';
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
import QualGrid from '../education/components/QualGrid';
import QualTable from '../education/components/QualTable';
import QualBars from '../education/components/QualBars';
import EduDetailPanel from '../education/components/EduDetailPanel';
import YouthDashboard from '../youth/components/YouthDashboard';
import NeetDetailPanel from '../youth/components/NeetDetailPanel';
import HousingDashboard from '../housing/components/HousingDashboard';
import HousingDetailPanel from '../housing/components/HousingDetailPanel';
import { buildHousingWards } from '@/lib/synth-housing';
import { buildFiscalWards } from '@/lib/synth-fiscal';
import type { HousingWard, FiscalWard } from '@/lib/types';
import FiscalDashboard from '../fiscal/components/FiscalDashboard';
import FiscalDetailPanel from '../fiscal/components/FiscalDetailPanel';
import BenefitsDashboard from '../benefits/components/BenefitsDashboard';
import UcEmpDashboard from '../uc-employment/components/UcEmpDashboard';
import HousingBenefitView from '../housing-benefit/components/HousingBenefitView';
import ClaimantDashboard from '../claimant-count/components/ClaimantDashboard';
import ScoringNote from './brand/ScoringNote';

const EduMap = dynamic(() => import('../education/components/EduMap'), { ssr: false });

const MapView = dynamic(() => import('./tabs/MapView'), { ssr: false });
const CrimeMap = dynamic(() => import('./tabs/crime/CrimeMap'), { ssr: false });

type View = 'employment' | 'crime' | 'education' | 'youth' | 'housing' | 'fiscal' | 'benefits' | 'ucemp' | 'hbenefit' | 'claimant';
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
  crimeWards: CrimeWard[];
  crimeMonth: string;
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

export default function Dashboard({ wards, dsrc, dsmeta, nomisDate, eduWards, eduMeta, neetData, crimeWards, crimeMonth }: Props) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('employment');
  const [empSub, setEmpSub] = useState<EmpSub>('grid');
  const [crimeSub, setCrimeSub] = useState<CrimeSub>('crime-table');
  const [eduSub, setEduSub] = useState<EduSub>('edu-grid');
  const [selected, setSelected] = useState<Ward | null>(null);
  const [selectedEdu, setSelectedEdu] = useState<EducationWard | null>(null);
  const [selectedYouth, setSelectedYouth] = useState<Ward | null>(null);
  const [selectedHousing, setSelectedHousing] = useState<string | null>(null);
  const [selectedFiscal, setSelectedFiscal] = useState<string | null>(null);
  const [selectedCrime, setSelectedCrime] = useState<string | null>(null);
  const [pinnedWards, setPinnedWards] = useState<string[]>([]);
  const [trendMode, setTrendMode] = useState<'12m' | 'pandemic'>('12m');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [benefitsData, setBenefitsData] = useState<BenefitsData | null>(null);
  const [ucEmpData, setUcEmpData] = useState<UcEmpData | null>(null);
  const [hbData, setHbData] = useState<HousingBenefitData | null>(null);
  const [claimantData, setClaimantData] = useState<ClaimantData | null>(null);

  // Load PUBLISHED dashboards at runtime. Each is present only once its proposal has
  // been accepted in /review (which writes public/data/<id>.json). Client-side fetch →
  // Accept makes the sidebar entry appear with no rebuild.
  useEffect(() => {
    fetch('/data/uc-wards.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.wards) setBenefitsData({
          as_of: j.as_of, city_pct: j.city_pct, total_claimants: j.total_claimants,
          total_population: j.total_population, sources: j.sources ?? (j.source ? [j.source] : []), wards: j.wards,
        });
      })
      .catch(() => { /* not published yet */ });

    fetch('/data/uc-employment.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.wards) setUcEmpData({
          as_of: j.as_of, ward_mean_pct: j.ward_mean_pct,
          sources: j.sources ?? (j.source ? [j.source] : []), wards: j.wards,
        });
      })
      .catch(() => { /* not published yet */ });

    fetch('/data/claimant-count.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.wards) setClaimantData({
          as_of: j.as_of, months: j.months ?? [], ward_mean_pct: j.ward_mean_pct ?? null,
          total_claimants: j.total_claimants ?? 0,
          sources: j.sources ?? (j.source ? [j.source] : []), wards: j.wards,
        });
      })
      .catch(() => { /* not published yet */ });

    fetch('/data/housing-benefit.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.areas) setHbData({
          as_of: j.as_of, metric: j.metric, geography: j.geography ?? 'local-authority',
          areas: j.areas, benchmarks: j.benchmarks ?? { wmca: null, england: null },
          birmingham_value: j.birmingham_value ?? null, birmingham_rank: j.birmingham_rank ?? null,
          sources: j.sources ?? (j.source ? [j.source] : []),
        });
      })
      .catch(() => { /* not published yet */ });
  }, []);

  useEffect(() => {
    try {
      const lev = localStorage.getItem('lastEmploymentView') as EmpSub | null;
      if (lev) setEmpSub(lev);
      const lcv = localStorage.getItem('lastCrimeView') as CrimeSub | null;
      if (lcv) setCrimeSub(lcv);
      const lev2 = localStorage.getItem('lastEduView') as EduSub | null;
      if (lev2) setEduSub(lev2);
      const sc = localStorage.getItem('sidebarCollapsed');
      if (sc === '1') setSidebarCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 650);
    return () => clearTimeout(t);
  }, []);


  const togglePin = (code: string) => {
    setPinnedWards(prev => {
      const idx = prev.indexOf(code);
      if (idx >= 0) return prev.filter(c => c !== code);
      if (prev.length < 2) return [...prev, code];
      return [prev[1], code];
    });
  };

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

  const isCrime   = view === 'crime';
  const selectedCrimeWard = crimeWards.find(w => w.ward_code === selectedCrime) ?? null;
  const isEdu     = view === 'education';
  const isYouth   = view === 'youth';
  const isHousing = view === 'housing';
  const isFiscal  = view === 'fiscal';
  const isBenefits = view === 'benefits';
  const isUcEmp = view === 'ucemp';
  const isHBenefit = view === 'hbenefit';
  const isClaimant = view === 'claimant';

  const housingWards: HousingWard[] = useMemo(() => buildHousingWards(wards), [wards]);
  const fiscalWards: FiscalWard[] = useMemo(() => buildFiscalWards(wards), [wards]);

  const bodyClass = isCrime ? ' crime-mode' : isEdu ? ' edu-mode' : '';

  const emptyBull = (
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
  );

  return (
    <>
      {/* Loading overlay */}
      <div id="overlay" className={ready ? 'fade' : ''}>
        <div className="splash">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/birmingham-coat-of-arms.png" alt="" aria-hidden="true" className="splash-crest" />
          <div className="splash-wordmark">BIRMINGHAM</div>
          <div className="splash-sub">City Dashboard · Ozzy Intelligence</div>
        </div>
      </div>

      <div className="error-toast" id="error-toast"><span>⚠</span><span id="etxt" /></div>

      {/* Treatment A — permanent sidebar + main column */}
      <div className={`dash-shell${sidebarCollapsed ? ' collapsed' : ''}`} style={{ display: ready ? 'grid' : 'none' }}>

        {/* Permanent sidebar */}
        <aside className="dash-sidebar">
          {/* Brand */}
          <div className="dash-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/birmingham-coat-of-arms.png" alt="Birmingham crest" className="dash-crest" />
            <div>
              <div className="dash-brand-name">Birmingham</div>
              <div className="dash-brand-sub">City Dashboard</div>
            </div>
          </div>

          {/* Dashboards nav */}
          <div className="dash-nav-section">
            <div className="dash-nav-section-ttl">Reporting</div>
            <button className={`dash-nav-btn${view === 'employment' ? ' active' : ''}`} onClick={() => setView('employment')}>
              <span className="dash-nav-glyph">▦</span> Employment
            </button>
            <button className={`dash-nav-btn${isCrime ? ' active' : ''}`} onClick={() => setView('crime')}>
              <span className="dash-nav-glyph">⚠</span> Crime
              {dsrc.crime === 'live' && <span className="dash-live-dot">●</span>}
            </button>
            <button className={`dash-nav-btn${isEdu ? ' active' : ''}`} onClick={() => setView('education')}>
              <span className="dash-nav-glyph">◈</span> Education &amp; Skills
            </button>
            <button className={`dash-nav-btn${isYouth ? ' active' : ''}`} onClick={() => setView('youth')}>
              <span className="dash-nav-glyph">◑</span> Youth &amp; NEET
              {dsrc.neet === 'live' && <span className="dash-live-dot">●</span>}
            </button>
            <button className={`dash-nav-btn${isHousing ? ' active' : ''}`} onClick={() => setView('housing')}>
              <span className="dash-nav-glyph">⌂</span> Housing
            </button>
            <button className={`dash-nav-btn${isFiscal ? ' active' : ''}`} onClick={() => setView('fiscal')}>
              <span className="dash-nav-glyph">£</span> Fiscal Balance
            </button>
            {benefitsData && (
              <button className={`dash-nav-btn${isBenefits ? ' active' : ''}`} onClick={() => setView('benefits')}>
                <span className="dash-nav-glyph">▤</span> Benefits (UC)
                <span className="dash-live-dot">●</span>
              </button>
            )}
            {ucEmpData && (
              <button className={`dash-nav-btn${isUcEmp ? ' active' : ''}`} onClick={() => setView('ucemp')}>
                <span className="dash-nav-glyph">◧</span> UC in Work
                <span className="dash-live-dot">●</span>
              </button>
            )}
            {hbData && (
              <button className={`dash-nav-btn${isHBenefit ? ' active' : ''}`} onClick={() => setView('hbenefit')}>
                <span className="dash-nav-glyph">⌂</span> Housing Benefit
                <span className="dash-live-dot">●</span>
              </button>
            )}
            {claimantData && (
              <button className={`dash-nav-btn${isClaimant ? ' active' : ''}`} onClick={() => setView('claimant')}>
                <span className="dash-nav-glyph">▥</span> Claimant Count
                <span className="dash-live-dot">●</span>
              </button>
            )}
          </div>

          {/* Ask Ozzy link */}
          <div className="dash-nav-section">
            <div className="dash-nav-section-ttl">Ozzy</div>
            <a href="/ozzy" className="dash-nav-btn">
              <span className="dash-nav-glyph">?</span> Ask Ozzy
            </a>
            <a href="/about" className="dash-nav-btn">
              <span className="dash-nav-glyph">◉</span> About Ozzy
            </a>
          </div>

          {/* FORWARD scroll */}
          <div className="dash-sidebar-foot">
            <svg viewBox="0 0 200 44" width="150" height="33" aria-label="Forward — city motto">
              <path d="M14 14 L2 8 L6 22 L2 36 L14 30 Z" fill="var(--herald-navy)" />
              <path d="M186 14 L198 8 L194 22 L198 36 L186 30 Z" fill="var(--herald-navy)" />
              <path d="M14 8 L186 8 L180 22 L186 36 L14 36 L20 22 Z" fill="#f6f4ee" stroke="var(--herald-navy)" strokeWidth="1.4" />
              <text x="100" y="27" textAnchor="middle" fontFamily="Baskervville, Georgia, serif" fontSize="15" fontWeight="600" letterSpacing="3" fill="var(--herald-red)">FORWARD</text>
            </svg>
          </div>
        </aside>

        {/* Main column */}
        <div className="wrap">

          {/* Top bar */}
          <div className="hdr">
            <div className="hdr-brand">
              <button
                className="hdr-sidebar-toggle"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              <div>
                <div className="hdr-title">
                  {isClaimant ? 'Claimant Count' : isHBenefit ? 'Housing Benefit' : isUcEmp ? 'UC Claimants in Work' : isBenefits ? 'Universal Credit' : isEdu ? 'Education & Skills' : isYouth ? 'Youth & NEET Risk' : isCrime ? 'Crime Dashboard' : isHousing ? 'Housing Affordability' : isFiscal ? 'Ward Net Fiscal Balance' : 'Employment & Benefits'}
                </div>
                <div className="hdr-sub">
                  {isClaimant ? `69 wards · % of 16–64 residents claiming · ${claimantData?.as_of ?? ''} · DWP`
                    : isHBenefit ? `Local authority · no ward breakdown · % of households · ${hbData?.as_of ?? ''} · DWP`
                    : isUcEmp ? `69 wards · % of claimants in employment · ${ucEmpData?.as_of ?? ''} · DWP`
                    : isBenefits ? `69 wards · % of residents on UC · ${benefitsData?.as_of ?? ''} · DWP`
                    : isEdu ? '68 wards · qualifications & skills'
                    : isYouth ? '68 wards · 16–24 NEET risk'
                    : isHousing ? '68 wards · affordability pressure · modelled'
                    : isFiscal ? '68 wards · net fiscal balance per head · modelled'
                    : isCrime ? `${crimeWards.length} wards · recorded crime · ${crimeMonth} · data.police.uk`
                    : '68 wards · claimant rate & deprivation'}
                </div>
              </div>
            </div>
            <div className="hdr-right">
              <a href="/sources" className="refresh-btn"><span>⌥</span> Sources</a>
              <button className="print-btn" onClick={() => window.print()}>⎙ print</button>
          </div>

        </div>
        <div className="hdr-dancetty" aria-hidden="true" />

        {isClaimant && claimantData ? (
          <ClaimantDashboard data={claimantData} />
        ) : isHBenefit && hbData ? (
          <HousingBenefitView data={hbData} />
        ) : isBenefits && benefitsData ? (
          <BenefitsDashboard data={benefitsData} />
        ) : isUcEmp && ucEmpData ? (
          <UcEmpDashboard data={ucEmpData} />
        ) : (
        <div className={`body${bodyClass}`}>
          <div className="lcol">

            {/* Top stat-tile rows removed across all dashboards — per design review */}

            {/* Education stats row removed — per design review */}

            {/* Per-view scoring / ranking explainer */}
            {view === 'employment' && (
              <ScoringNote label="How wards are scored">
                Wards are ranked by a composite disadvantage score — IMD employment 40%, claimant count 35%,
                health inactivity 25% — then split into deciles 1–10. Decile 10 (darkest) = most disadvantaged;
                decile 1 (lightest) = least. The Economic Matrix instead plots workplace output (GVA per head)
                against this deprivation.
              </ScoringNote>
            )}
            {isCrime && (
              <ScoringNote label="What you're seeing">
                Wards are ranked by recorded crimes per 1,000 residents (West Midlands Police). Darker = a higher
                crime rate; #1 = the highest-crime ward. Rates are population-adjusted so large and small wards
                compare fairly.
              </ScoringNote>
            )}
            {isEdu && (
              <ScoringNote label="How wards are scored">
                Wards are shaded by the % of residents with no qualifications and ranked on the IMD 2025
                education-skills domain (deciles 1–10).
              </ScoringNote>
            )}
            {isYouth && (
              <ScoringNote label="How wards are scored">
                A modelled NEET-risk score ranks wards by youth disadvantage — youth UC claimants 50%, health
                inactivity 30%, employment deprivation 20% — split into deciles 1–10. Decile 10 = highest risk.
                This is an estimate; no official ward-level NEET data exists.
              </ScoringNote>
            )}
            {isHousing && (
              <ScoringNote label="How wards are scored">
                A modelled housing-pressure score ranks wards on affordability — overcrowding 45%, rent-to-income
                35%, price-to-income 20% — split into deciles 1–10. Decile 10 (darkest) = highest pressure. A
                modelled estimate, not an official measure.
              </ScoringNote>
            )}
            {isFiscal && (
              <ScoringNote label="What you're seeing">
                Each ward's net fiscal balance per head = revenue raised − (benefits + service spend). Positive
                (green) = a net contributor to the public purse; negative (red) = a net recipient. All figures are
                modelled estimates.
              </ScoringNote>
            )}

            {/* Breadcrumb + legend — employment */}
            {view === 'employment' && (
              <div className="data-view-toolbar">
                <div className="legend-row">
                  <span className="llbl" style={{ marginRight: 2 }}>Low</span>
                  {RAMP.map((c, i) => <div key={i} className="lsw" style={{ background: c }} />)}
                  <span className="llbl" style={{ marginLeft: 2 }}>High disadvantage</span>
                </div>
              </div>
            )}

            {/* Breadcrumb + legend — education */}
            {isEdu && (
              <div className="data-view-toolbar">
                <div className="legend-row">
                  <span className="llbl" style={{ marginRight: 2 }}>Low</span>
                  {RAMP.map((c, i) => <div key={i} className="lsw" style={{ background: c }} />)}
                  <span className="llbl" style={{ marginLeft: 2 }}>High — % no quals</span>
                </div>
              </div>
            )}

            {/* Breadcrumb + legend — housing */}
            {isHousing && (
              <div className="data-view-toolbar">
                <div className="legend-row">
                  <span className="llbl" style={{ marginRight: 2 }}>Lower pressure</span>
                  {RAMP.map((c, i) => <div key={i} className="lsw" style={{ background: c }} />)}
                  <span className="llbl" style={{ marginLeft: 2 }}>Higher</span>
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
                {/* Employment sub-views */}
                {view === 'employment' && empSub === 'grid'    && <GridView wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'list'    && <TableView wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'scatter' && <LabourScatter wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'matrix'  && <EconomicMatrix wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'map'     && <MapView wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'employment' && empSub === 'compare' && <Compare wards={wards} pinnedWards={pinnedWards} onUnpin={togglePin} />}
                {/* Crime sub-views */}
                {isCrime && crimeSub === 'crime-table' && <CrimeTable wards={crimeWards} selected={selectedCrimeWard} onSelect={code => setSelectedCrime(prev => prev === code ? null : code)} />}
                {isCrime && crimeSub === 'crime-grid'  && <CrimeGrid  wards={crimeWards} selected={selectedCrimeWard} onSelect={code => setSelectedCrime(prev => prev === code ? null : code)} />}
                {isCrime && crimeSub === 'crime-map'   && <CrimeMap   wards={crimeWards} onSelect={code => setSelectedCrime(prev => prev === code ? null : code)} />}
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
                {isYouth && <YouthDashboard wards={wards} selected={selectedYouth} onSelect={code => setSelectedYouth(prev => prev?.ward_code === code ? null : (wards.find(w => w.ward_code === code) ?? null))} />}
                {/* Housing Affordability */}
                {isHousing && <HousingDashboard wards={housingWards} selected={selectedHousing} onSelect={code => setSelectedHousing(prev => prev === code ? null : code)} />}
                {/* Ward Net Fiscal Balance */}
                {isFiscal && <FiscalDashboard wards={fiscalWards} selected={selectedFiscal} onSelect={code => setSelectedFiscal(prev => (!code || prev === code) ? null : code)} />}
              </div>
              <div className="bham-watermark">FORWARD · BIRMINGHAM</div>
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
                      {' Education: committed Census 2021 snapshot.'}
                    </div>
                  </div>
                </>
              )
            ) : isYouth ? (
              selectedYouth ? (
                <NeetDetailPanel ward={selectedYouth} wards={wards} onClose={() => setSelectedYouth(null)} />
              ) : emptyBull
            ) : isHousing ? (
              selectedHousing ? (
                <HousingDetailPanel ward={housingWards.find(w => w.ward_code === selectedHousing)!} wards={housingWards} onClose={() => setSelectedHousing(null)} />
              ) : emptyBull
            ) : isFiscal ? (
              selectedFiscal ? (
                <FiscalDetailPanel ward={fiscalWards.find(w => w.ward_code === selectedFiscal)!} wards={fiscalWards} onClose={() => setSelectedFiscal(null)} />
              ) : emptyBull
            ) : isCrime ? (
              selectedCrimeWard ? (
                <CrimeDetailPanel ward={selectedCrimeWard} wards={crimeWards} onClose={() => setSelectedCrime(null)} />
              ) : emptyBull
            ) : selected ? (
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
            ) : (
              emptyBull
            )}
          </div>
        </div>
        )}
        </div>{/* end .wrap */}
      </div>{/* end .dash-shell */}
    </>
  );
}
