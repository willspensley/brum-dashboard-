'use client';

import type { CrimeWard } from '@/lib/types';
import { CRIME_RAMP } from '@/lib/constants';

interface Props {
  wards: CrimeWard[];
  selected: CrimeWard | null;
  onSelect: (code: string) => void;
}

const BAR_COLORS = ['#1a2a3a', '#7d4e36', '#2a1a3a'];

export default function CrimeGrid({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.crime_rate_per_1000 - a.crime_rate_per_1000);
  const maxRate = Math.max(...wards.map(w => w.crime_rate_per_1000)) || 1;

  const rampColor = (rate: number) => CRIME_RAMP[Math.max(0, Math.min(9, Math.round((rate / maxRate) * 9)))];

  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const c = rampColor(w.crime_rate_per_1000);
        const isSelected = selected?.ward_code === w.ward_code;
        const cats = Object.entries(w.crime_categories ?? {}).sort(([, a], [, b]) => b - a).slice(0, 3);
        const maxCat = cats[0]?.[1] ?? 1;
        return (
          <div
            key={w.ward_code}
            className={`wcard${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(w.ward_code)}
            title={`${w.ward_name} — ${w.crime_rate_per_1000.toFixed(1)} crimes/1000`}
          >
            <div className="wc-stripe" style={{ background: c }} />
            <div className="wc-nm">{w.ward_name}</div>
            <div className="wc-sc">{w.crime_rate_per_1000.toFixed(1)}</div>
            <div className="wc-lbl">crimes / 1,000 · #{w.crime_rank}</div>
            <div className="wc-bars">
              {cats.map(([cat, count], i) => (
                <div className="wc-bar-row" key={cat}>
                  <div className="wc-dot" style={{ background: BAR_COLORS[i] }} />
                  <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${(count / maxCat) * 100}%`, background: BAR_COLORS[i] }} /></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
