'use client';

import type { Ward } from '@/lib/types';
import { CRIME_RAMP } from '@/lib/constants';

interface Props {
  wards: Ward[];
  selected: Ward | null;
  onSelect: (code: string) => void;
}

export default function CrimeGrid({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.crime_rate_per_1000 - a.crime_rate_per_1000);
  const maxRate = Math.max(...wards.map(w => w.crime_rate_per_1000));

  const rampColor = (rate: number) => {
    const idx = Math.round((rate / maxRate) * 9);
    return CRIME_RAMP[Math.max(0, Math.min(9, idx))];
  };

  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const bg = rampColor(w.crime_rate_per_1000);
        const isSelected = selected?.ward_code === w.ward_code;
        return (
          <div
            key={w.ward_code}
            className={`ward-cell${isSelected ? ' selected' : ''}`}
            style={{ background: bg, borderColor: isSelected ? 'var(--ink)' : 'transparent' }}
            onClick={() => onSelect(w.ward_code)}
            title={`${w.ward_name} — ${w.crime_rate_per_1000.toFixed(1)} crimes/1000`}
          >
            <div className="wc-name">{w.ward_name}</div>
            <div className="wc-val">{w.crime_rate_per_1000.toFixed(1)}</div>
            <div className="wc-sub">per 1k</div>
          </div>
        );
      })}
    </div>
  );
}
