'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Ward, DataSources, DataMeta } from '@/lib/types';
import { RAMP } from '@/lib/constants';
import GridView from './tabs/GridView';
import TableView from './tabs/TableView';
import LabourScatter from './tabs/LabourScatter';
import EconomicMatrix from './tabs/EconomicMatrix';
import Compare from './tabs/Compare';
import DetailPanel from './detail/DetailPanel';

const MapView = dynamic(() => import('./tabs/MapView'), { ssr: false });

const BHAM_BANNER =
  ` ____    ___   ____   __  __   ___   _   _    ____   _   _    _    __  __ \n` +
  `| __ )  |_ _| |  _ \\ |  \\/  | |_ _| | \\ | |  / ___| | | | |  / \\  |  \\/  |\n` +
  `|  _ \\   | |  | |_) || |\\/| |  | |  |  \\| | | |  _  | |_| | / _ \\ | |\\/| |\n` +
  `| |_) |  | |  |  _ < | |  | |  | |  | |\\  | | |_| | |  _  |/ ___ \\| |  | |\n` +
  `|____/  |___| |_| \\_\\|_|  |_| |___| |_| \\_|  \\____| |_| |_/_/   \\_\\_|  |_|`;

type View = 'grid' | 'list' | 'scatter' | 'matrix' | 'map' | 'compare';

const VIEW_TITLES: Record<View, string> = {
  grid: 'Ward grid — composite employment disadvantage',
  list: 'Ward table — sorted by composite score',
  scatter: 'Labour market scatter — IMD vs current claimant rate',
  matrix: 'Economic matrix — workplace GVA vs resident deprivation',
  map: 'Choropleth map — composite deprivation by ward',
  compare: 'Compare — pin up to 2 wards side by side',
};

interface Props {
  wards: Ward[];
  dsrc: DataSources;
  dsmeta: DataMeta;
  nomisDate: string;
}

export default function Dashboard({ wards, dsrc, dsmeta, nomisDate }: Props) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('grid');
  const [selected, setSelected] = useState<Ward | null>(null);
  const [pinnedWards, setPinnedWards] = useState<string[]>([]);
  const [trendMode, setTrendMode] = useState<'12m' | 'pandemic'>('12m');
  const [showSources, setShowSources] = useState(false);
  const bannerRef = useRef<HTMLPreElement>(null);

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

  const togglePin = (code: string) => {
    setPinnedWards(prev => {
      const idx = prev.indexOf(code);
      if (idx >= 0) return prev.filter(c => c !== code);
      if (prev.length < 2) return [...prev, code];
      return [prev[1], code];
    });
  };

  const avg = (wards.reduce((s, w) => s + w.claimant_rate, 0) / wards.length).toFixed(1);
  const sorted = [...wards].sort((a, b) => b.claimant_rate - a.claimant_rate);
  const depCount = wards.filter(w => w.composite_decile >= 9).length;

  return (
    <>
      {/* Loading overlay */}
      <div id="overlay" className={ready ? 'fade' : ''} style={{ display: ready ? undefined : undefined }}>
        <div className="scan-line" />
        <pre className="bham-mega" ref={bannerRef} id="bham-mega" />
        <div className="load-meta">
          <div className="load-headline">Initialising the intelligence pipeline</div>
          <div className="load-sub">Birmingham City Council · Employment Deprivation v3.0</div>
          <div className="t-log">
            <div className="t-line vis">
              <span className="t-ts">—</span>
              <span className="tbadge tb-info">INIT</span>
              <span className="t-msg">Data loaded server-side — <b>{wards.length} wards</b> · {Object.values(dsrc).filter(v => v === 'live').length}/3 live layers</span>
            </div>
          </div>
          <div className="t-prog-wrap"><div className="t-prog-fill" style={{ width: '100%' }} /></div>
        </div>
      </div>

      {/* Error toast placeholder */}
      <div className="error-toast" id="error-toast"><span>⚠</span><span id="etxt" /></div>

      {/* Dashboard */}
      <div className="wrap" style={{ display: ready ? 'flex' : 'none' }}>

        {/* Header */}
        <div className="hdr" style={{ position: 'relative' }}>
          <div className="hdr-brand">
            <div className="bcc-badge" title="Birmingham City Council">
              <span>▶ FORWARD</span>B·C·C
            </div>
            <div>
              <div className="hdr-title">Birmingham — Employment Deprivation</div>
              <div className="hdr-sub">68 wards · IMD 2025 · NOMIS · Census 2021 · GVA 2022</div>
            </div>
          </div>
          <div />
          <div className="hdr-right">
            <span className="dsbadge" title={dsrc.imd === 'live' ? 'IMD 2025 — live from City Observatory' : 'IMD embedded cache'}>
              IMD 2025 <span className={dsrc.imd === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
            </span>
            <span className="dsbadge" title={dsrc.nomis === 'live' ? `NOMIS ${nomisDate} — fetched live` : 'NOMIS embedded Jan 2026 cache'}>
              NOMIS {nomisDate} <span className={dsrc.nomis === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
            </span>
            <span className="dsbadge" title={dsrc.gva === 'live' ? 'GVA 2022 — live, per-head computed' : 'GVA synthesised from ward bands'}>
              GVA 2022 <span className={dsrc.gva === 'live' ? 'dot-live' : 'dot-cache'}>●</span>
            </span>
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
              {[
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
              ))}
              <div className="src-foot">
                <b style={{ color: 'var(--q-prosp)' }}>●</b> Live = fetched server-side this render.{' '}
                <b style={{ color: '#7d4e36' }}>●</b> Cached = endpoint unreachable, embedded snapshot used.
              </div>
            </div>
          )}
        </div>

        <div className="body">
          <div className="lcol">

            {/* Stats row */}
            <div className="stats-row">
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

            {/* Tab bar + legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div className="tab-bar">
                {(['grid', 'list', 'scatter', 'matrix', 'map', 'compare'] as View[]).map(v => (
                  <button
                    key={v}
                    className={`tab-btn${view === v ? ' active' : ''}`}
                    onClick={() => setView(v)}
                  >
                    {v === 'list' ? 'Table' : v === 'scatter' ? 'Labour\u00a0Scatter' : v === 'matrix' ? 'Economic\u00a0Matrix' : v.charAt(0).toUpperCase() + v.slice(1)}
                    {v === 'compare' && pinnedWards.length > 0 && (
                      <span className="t-pin-count">{pinnedWards.length}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="legend-row">
                <span className="llbl" style={{ marginRight: 2 }}>Low</span>
                {RAMP.map((c, i) => <div key={i} className="lsw" style={{ background: c }} />)}
                <span className="llbl" style={{ marginLeft: 2 }}>High disadvantage</span>
              </div>
            </div>

            {/* Panel */}
            <div className="panel" style={{ flex: 1, position: 'relative' }}>
              <div className="panel-hdr">
                <span className="panel-ttl">{VIEW_TITLES[view]}</span>
                <span className="panel-hint">click a ward for detail →</span>
              </div>
              <div className="panel-body">
                {view === 'grid' && <GridView wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'list' && <TableView wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'scatter' && <LabourScatter wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'matrix' && <EconomicMatrix wards={wards} selected={selected} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'map' && <MapView wards={wards} onSelect={code => setSelected(wards.find(w => w.ward_code === code) ?? null)} />}
                {view === 'compare' && <Compare wards={wards} pinnedWards={pinnedWards} onUnpin={togglePin} />}
              </div>
              <div className="bham-watermark">FORWARD · BIRMINGHAM</div>
            </div>

          </div>

          {/* Right detail panel */}
          <div className="rcol">
            {selected ? (
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
              <div className="r-empty">
                <div className="ascii-ward">{`┌─────────────────────┐
 │  (\\/)  (\\/)         │
 │   \\  \\/  /          │
 │ .--\\----/--.        │
 │/  ( o)(o)  \\        │
 │|    (---)   |       │
 │ \\___________/       │
 └─────────────────────┘`}</div>
                <p>Select any ward to see a detailed breakdown of employment disadvantage indicators.</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 9, fontStyle: 'normal', color: 'rgba(14,15,17,.18)', letterSpacing: '.18em' }}>THE BULL OF BIRMINGHAM</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
