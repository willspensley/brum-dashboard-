'use client';

import type { Ward } from '@/lib/types';

const RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

interface Props {
  ward: Ward;
  wards: Ward[];
  onClose: () => void;
}

export default function NeetDetailPanel({ ward: w, wards, onClose }: Props) {
  const max = Math.max(...wards.map(x => x.neet_risk_score));
  const col = RAMP[Math.max(0, Math.min(9, Math.round((w.neet_risk_score / max) * 9)))];
  const cityAvgYouth = (wards.reduce((s, x) => s + x.youth_claimant_rate, 0) / wards.length).toFixed(1);
  const cityAvgIA = (wards.reduce((s, x) => s + x.inactivity_sick_pct, 0) / wards.length).toFixed(1);
  const rank = [...wards].sort((a, b) => b.neet_risk_score - a.neet_risk_score).findIndex(x => x.ward_code === w.ward_code) + 1;

  return (
    <div className="detail-panel">
      <div className="dp-hdr">
        <div>
          <div className="dp-eyebrow">NEET Risk — Ward Detail</div>
          <div className="dp-title">{w.ward_name}</div>
        </div>
        <button className="dp-close" onClick={onClose}>×</button>
      </div>

      <div className="dp-rank-row">
        <span className="dp-rank" style={{ color: col }}>#{rank}</span>
        <span className="dp-rank-of">of {wards.length} wards</span>
        <span className="dp-decile-pill" style={{ background: col, color: '#f5f3ee' }}>
          Risk decile {w.neet_risk_decile}/10
        </span>
      </div>

      <div className="dp-section">
        <div className="dp-section-ttl">Risk index components <span className="d-modelled">(modelled)</span></div>
        <div className="dp-stat-row">
          <div className="dp-stat">
            <div className="dp-stat-val" style={{ color: col }}>{w.youth_claimant_rate}%</div>
            <div className="dp-stat-lbl">Youth UC claimant rate (16–24)</div>
            <div className="dp-stat-sub">city avg {cityAvgYouth}% · weight 50%</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val" style={{ color: w.inactivity_sick_pct > parseFloat(cityAvgIA) ? col : 'inherit' }}>
              {w.inactivity_sick_pct}%
            </div>
            <div className="dp-stat-lbl">Health-related inactivity</div>
            <div className="dp-stat-sub">city avg {cityAvgIA}% · weight 30%</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">{(w.imd_employment_score * 100).toFixed(1)}%</div>
            <div className="dp-stat-lbl">IMD employment deprivation score</div>
            <div className="dp-stat-sub">weight 20%</div>
          </div>
        </div>
      </div>

      <div className="dp-section">
        <div className="dp-section-ttl">Structural context</div>
        <div className="dp-stat-row">
          <div className="dp-stat">
            <div className="dp-stat-val">{w.claimant_rate}%</div>
            <div className="dp-stat-lbl">Total UC claimant rate (all ages)</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">{w.composite_decile}/10</div>
            <div className="dp-stat-lbl">Overall deprivation decile</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">£{w.gva.toFixed(1)}k</div>
            <div className="dp-stat-lbl">GVA per head</div>
          </div>
        </div>
      </div>

      <div className="dp-note">
        NEET risk index is a modelled composite — not an official rate. No ward-level NEET
        data exists in public sources. Index weights: youth UC claimant rate (NOMIS, 16–24) 50%,
        health-related inactivity (Census 2021) 30%, IMD employment score (IMD 2025) 20%.
        Official 16–17 NEET figures available at LA level only via DfE NCCIS.
      </div>
    </div>
  );
}
