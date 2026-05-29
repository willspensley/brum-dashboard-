'use client';

import type { Ward } from '@/lib/types';

const RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

interface Props {
  wards: Ward[];
  selected: Ward | null;
  onSelect: (code: string) => void;
}

export default function NeetGrid({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.neet_risk_score - a.neet_risk_score);
  const max = Math.max(...wards.map(w => w.neet_risk_score));

  const rampColor = (score: number) => {
    const idx = Math.round((score / max) * 9);
    return RAMP[Math.max(0, Math.min(9, idx))];
  };

  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const bg = rampColor(w.neet_risk_score);
        const isSelected = selected?.ward_code === w.ward_code;
        return (
          <div
            key={w.ward_code}
            className={`ward-cell${isSelected ? ' selected' : ''}`}
            style={{ background: bg, borderColor: isSelected ? 'var(--ink)' : 'transparent' }}
            onClick={() => onSelect(w.ward_code)}
            title={`${w.ward_name} — NEET risk decile ${w.neet_risk_decile}/10 · youth UC ${w.youth_claimant_rate}% · health inactivity ${w.inactivity_sick_pct}%`}
          >
            <div className="wc-name">{w.ward_name}</div>
            <div className="wc-val">{w.neet_risk_decile}/10</div>
            <div className="wc-sub">risk decile</div>
          </div>
        );
      })}
    </div>
  );
}
