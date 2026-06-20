'use client';
import type { HousingWard } from '@/lib/types';
import { dc } from '@/lib/constants';

interface Props {
  wards: HousingWard[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export default function HousingGrid({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.housing_pressure_score - a.housing_pressure_score);
  const maxScore = Math.max(...wards.map(w => w.housing_pressure_score)) || 1;
  const maxOC = Math.max(...wards.map(w => w.overcrowding_pct)) || 1;
  const maxRI = Math.max(...wards.map(w => w.rent_income_pct)) || 1;
  const maxPI = Math.max(...wards.map(w => w.price_to_income)) || 1;

  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const c = dc(w.housing_pressure_decile);
        const isSelected = selected === w.ward_code;
        return (
          <div
            key={w.ward_code}
            className={`wcard${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(w.ward_code)}
          >
            <div className="wc-stripe" style={{ background: c }} />
            <div className="wc-nm">{w.ward_name}</div>
            <div className="wc-sc">{Math.round((w.housing_pressure_score / maxScore) * 100)}</div>
            <div className="wc-lbl">housing pressure · decile {w.housing_pressure_decile}</div>
            <div className="wc-bars">
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#1a2a3a' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${(w.overcrowding_pct / maxOC) * 100}%`, background: '#1a2a3a' }} /></div>
              </div>
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#7d4e36' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${(w.rent_income_pct / maxRI) * 100}%`, background: '#7d4e36' }} /></div>
              </div>
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#2a1a3a' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${(w.price_to_income / maxPI) * 100}%`, background: '#2a1a3a' }} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
