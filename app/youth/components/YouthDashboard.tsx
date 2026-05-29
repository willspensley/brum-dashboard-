'use client';

import { useState } from 'react';
import type { Ward, NeetCityData } from '@/lib/types';
import NeetGrid from './NeetGrid';
import NeetTable from './NeetTable';
import NeetDetailPanel from './NeetDetailPanel';

type Sub = 'grid' | 'table';

interface Props {
  wards: Ward[];
  neetData: NeetCityData;
}

export default function YouthDashboard({ wards, neetData }: Props) {
  const [sub, setSub] = useState<Sub>('grid');
  const [selected, setSelected] = useState<Ward | null>(null);

  const handleSelect = (code: string) => {
    const w = wards.find(x => x.ward_code === code) ?? null;
    setSelected(prev => prev?.ward_code === code ? null : w);
  };

  const sorted = [...wards].sort((a, b) => b.neet_risk_score - a.neet_risk_score);
  const highestRisk = sorted[0];
  const cityAvgYouth = (wards.reduce((s, w) => s + w.youth_claimant_rate, 0) / wards.length).toFixed(1);
  const wardsDecile10 = wards.filter(w => w.neet_risk_decile === 10).length;

  return (
    <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>

      {/* Headline stats row */}
      <div className="stat-bar">
        <div className="stat-bar-item">
          <div className="sb-val">13.5%</div>
          <div className="sb-lbl">National NEET rate</div>
          <div className="sb-sub">Jan–Mar 2026 · 1.01m young people</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val" style={{ color: '#3a1a1a' }}>
            {neetData.bham_neet_pct != null ? `${neetData.bham_neet_pct}%` : 'est. 6–7%'}
          </div>
          <div className="sb-lbl">Birmingham NEET (16–17)</div>
          <div className="sb-sub">{neetData.bham_year} · DfE NCCIS · LA level only [{neetData.source}]</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val">
            {neetData.wmca_neet_pct != null ? `${neetData.wmca_neet_pct}%` : 'est. 5–6%'}
          </div>
          <div className="sb-lbl">WMCA average NEET</div>
          <div className="sb-sub">{neetData.bham_year} · City Observatory</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val" style={{ color: '#3a1a1a' }}>{cityAvgYouth}%</div>
          <div className="sb-lbl">City avg youth UC rate</div>
          <div className="sb-sub">16–24 claimants · NOMIS · est</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val" style={{ color: '#3a1a1a' }}>{wardsDecile10}</div>
          <div className="sb-lbl">Wards at highest risk</div>
          <div className="sb-sub">NEET risk decile 10 (modelled)</div>
        </div>
      </div>

      {/* Milburn review banner */}
      <div className="milburn-banner">
        <div className="mb-label">MILBURN REVIEW</div>
        <div className="mb-text">
          Government independent investigation into youth inactivity — launched Nov 2025.
          Led by Alan Milburn. Focuses on mental health and disability as barriers.
        </div>
        <div className="mb-timeline">
          <span className="mb-milestone mb-done">▸ Launched Nov 2025</span>
          <span className="mb-line">————</span>
          <span className="mb-milestone mb-upcoming">◎ Interim findings Spring 2026</span>
          <span className="mb-line">————</span>
          <span className="mb-milestone mb-future">◎ Final report Summer 2026</span>
        </div>
      </div>

      {/* Sub-tab bar + modelled note */}
      <div className="sub-hdr">
        <div className="sub-tab-bar">
          <button className={`sub-tab${sub === 'grid' ? ' active' : ''}`} onClick={() => setSub('grid')}>Grid</button>
          <button className={`sub-tab${sub === 'table' ? ' active' : ''}`} onClick={() => setSub('table')}>Table</button>
        </div>
        <div className="sub-hdr-note">
          Showing NEET risk index — modelled composite, not an official rate.
          Highest risk ward: <strong>{highestRisk?.ward_name}</strong> (decile {highestRisk?.neet_risk_decile}/10)
        </div>
      </div>

      {/* Content + detail */}
      <div className="panel-split" style={{ flex: 1, overflow: 'hidden' }}>
        <div className="panel-main" style={{ overflow: 'auto' }}>
          {sub === 'grid' && (
            <NeetGrid wards={wards} selected={selected} onSelect={handleSelect} />
          )}
          {sub === 'table' && (
            <NeetTable wards={wards} selected={selected} onSelect={handleSelect} />
          )}
        </div>
        {selected && (
          <NeetDetailPanel
            ward={selected}
            wards={wards}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

    </div>
  );
}
