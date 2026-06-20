'use client';
import { useState } from 'react';
import type { HousingWard } from '@/lib/types';
import HousingGrid from './HousingGrid';
import HousingTable from './HousingTable';

type Tab = 'grid' | 'table';

interface Props {
  wards: HousingWard[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export default function HousingDashboard({ wards, selected, onSelect }: Props) {
  const [tab, setTab] = useState<Tab>('grid');

  const avgPrice    = Math.round(wards.reduce((s, w) => s + w.median_house_price_k, 0) / wards.length);
  const avgPTI      = (wards.reduce((s, w) => s + w.price_to_income, 0) / wards.length).toFixed(1);
  const stressCount = wards.filter(w => w.rent_income_pct > 30).length;
  const worstOC     = [...wards].sort((a, b) => b.overcrowding_pct - a.overcrowding_pct)[0];
  const highPressure = wards.filter(w => w.housing_pressure_decile >= 9).length;
  const highestWard  = [...wards].sort((a, b) => b.housing_pressure_score - a.housing_pressure_score)[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Headline stats */}
      <div className="stat-bar">
        <div className="stat-bar-item">
          <div className="sb-val">£{avgPrice}k</div>
          <div className="sb-lbl">City median house price</div>
          <div className="sb-sub">modelled · ward profile</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val">{avgPTI}×</div>
          <div className="sb-lbl">Avg price-to-income</div>
          <div className="sb-sub">price ÷ ward median earnings</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val">{stressCount}<span style={{ fontSize: 14, fontWeight: 400 }}>/68</span></div>
          <div className="sb-lbl">Wards rent &gt;30% income</div>
          <div className="sb-sub">rental affordability threshold</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val" style={{ fontSize: 14 }}>{worstOC?.ward_name}</div>
          <div className="sb-lbl">Most overcrowded ward</div>
          <div className="sb-sub">{worstOC?.overcrowding_pct}% of households</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val">{highPressure}</div>
          <div className="sb-lbl">Wards decile 9–10</div>
          <div className="sb-sub">highest housing pressure</div>
        </div>
      </div>

      {/* Sub-tabs + note */}
      <div className="sub-hdr">
        <div className="sub-tab-bar">
          <button className={`sub-tab${tab === 'grid' ? ' active' : ''}`} onClick={() => setTab('grid')}>Grid</button>
          <button className={`sub-tab${tab === 'table' ? ' active' : ''}`} onClick={() => setTab('table')}>Table</button>
        </div>
        <div className="sub-hdr-note">
          Showing housing pressure index — modelled composite, not an official measure.
          Highest pressure ward: <strong>{highestWard?.ward_name}</strong> (decile {highestWard?.housing_pressure_decile}/10)
        </div>
      </div>

      {/* Grid / table — selection flows up to the shared right-side detail panel */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tab === 'grid' && <HousingGrid wards={wards} selected={selected} onSelect={onSelect} />}
        {tab === 'table' && <HousingTable wards={wards} selected={selected} onSelect={onSelect} />}
      </div>

    </div>
  );
}
