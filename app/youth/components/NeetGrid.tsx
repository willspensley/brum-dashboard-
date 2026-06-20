'use client';

import type { Ward } from '@/lib/types';
import { dc } from '@/lib/constants';

interface Props {
  wards: Ward[];
  selected: Ward | null;
  onSelect: (code: string) => void;
}

export default function NeetGrid({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.neet_risk_score - a.neet_risk_score);
  const maxScore = Math.max(...wards.map(w => w.neet_risk_score)) || 1;
  const maxYouth = Math.max(...wards.map(w => w.youth_claimant_rate)) || 1;

  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const c = dc(w.neet_risk_decile);
        const isSelected = selected?.ward_code === w.ward_code;
        return (
          <div
            key={w.ward_code}
            className={`wcard${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(w.ward_code)}
          >
            <div className="wc-stripe" style={{ background: c }} />
            <div className="wc-nm">{w.ward_name}</div>
            <div className="wc-sc">{Math.round((w.neet_risk_score / maxScore) * 100)}</div>
            <div className="wc-lbl">NEET risk · decile {w.neet_risk_decile}</div>
            <div className="wc-bars">
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#1a2a3a' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${(w.youth_claimant_rate / maxYouth) * 100}%`, background: '#1a2a3a' }} /></div>
              </div>
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#7d4e36' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${w.ia_norm * 100}%`, background: '#7d4e36' }} /></div>
              </div>
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#2a1a3a' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${w.imd_norm * 100}%`, background: '#2a1a3a' }} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
