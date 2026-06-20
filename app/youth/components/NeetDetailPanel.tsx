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
    <div>
      {/* Same structure as the employment DetailPanel */}
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{w.ward_name}</div>
            <div className="d-sub">{w.ward_code} · risk decile {w.neet_risk_decile}/10 · rank #{rank}/{wards.length}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="q-banner" style={{ borderColor: col, background: col + '0d' }}>
          <div className="q-banner-txt">
            NEET risk decile <strong>{w.neet_risk_decile}/10</strong> — a modelled composite of youth claimant rate, health-related inactivity and employment deprivation. Not an official NEET rate.
          </div>
        </div>

        <div className="d-chips">
          <div className="d-chip">
            <div className="d-chip-lbl">Youth UC 16–24</div>
            <div className="d-chip-val" style={{ color: col }}>{w.youth_claimant_rate}%</div>
            <div className="d-chip-sub">avg {cityAvgYouth}% · weight 50%</div>
          </div>
          <div className="d-chip">
            <div className="d-chip-lbl">Health inactivity</div>
            <div className="d-chip-val">{w.inactivity_sick_pct}%</div>
            <div className="d-chip-sub">avg {cityAvgIA}% · weight 30%</div>
          </div>
          <div className="d-chip">
            <div className="d-chip-lbl">IMD employment</div>
            <div className="d-chip-val">{(w.imd_employment_score * 100).toFixed(1)}%</div>
            <div className="d-chip-sub">weight 20%</div>
          </div>
          <div className="d-chip">
            <div className="d-chip-lbl">Risk rank</div>
            <div className="d-chip-val" style={{ color: col }}>#{rank}</div>
            <div className="d-chip-sub">of {wards.length} wards</div>
          </div>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">Structural context</div>
        <div className="extra-metrics">
          <div className="em-card">
            <div className="em-lbl">Total UC (all ages)</div>
            <div className="em-val">{w.claimant_rate}%</div>
            <div className="em-sub">NOMIS claimant count</div>
          </div>
          <div className="em-card">
            <div className="em-lbl">Deprivation decile</div>
            <div className="em-val">{w.composite_decile}/10</div>
            <div className="em-sub">overall IMD composite</div>
          </div>
          <div className="em-card">
            <div className="em-lbl">GVA per head</div>
            <div className="em-val">£{w.gva.toFixed(1)}k</div>
            <div className="em-sub">workplace output</div>
          </div>
        </div>
      </div>

      <div className="d-sec" style={{ borderBottom: 'none' }}>
        <div className="d-sec-ttl">Method <span className="d-modelled">(modelled)</span></div>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'var(--sans)', margin: 0 }}>
          The NEET risk index is a modelled composite — not an official rate. No ward-level NEET data
          exists in public sources. Weights: youth UC claimant rate (NOMIS 16–24) 50%, health-related
          inactivity (Census 2021) 30%, IMD employment score (IMD 2025) 20%. Official 16–17 NEET figures
          are LA-level only via DfE NCCIS.
        </p>
      </div>
    </div>
  );
}
