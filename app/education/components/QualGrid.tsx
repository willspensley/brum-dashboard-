'use client';

import type { EducationWard } from '@/lib/types';

const RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

interface Props {
  wards: EducationWard[];
  selected: EducationWard | null;
  onSelect: (code: string) => void;
}

export default function QualGrid({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.qual_none - a.qual_none);
  const maxNone = Math.max(...wards.map(w => w.qual_none));

  const rampColor = (pct: number) => {
    const idx = Math.round((pct / maxNone) * 9);
    return RAMP[Math.max(0, Math.min(9, idx))];
  };

  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const bg = rampColor(w.qual_none);
        const isSelected = selected?.ward_code === w.ward_code;
        return (
          <div
            key={w.ward_code}
            className={`ward-cell${isSelected ? ' selected' : ''}`}
            style={{ background: bg, borderColor: isSelected ? 'var(--ink)' : 'transparent' }}
            onClick={() => onSelect(w.ward_code)}
            title={`${w.ward_name} — ${w.qual_none}% no qualifications · ${w.qual_level4plus}% Level 4+`}
          >
            <div className="wc-name">{w.ward_name}</div>
            <div className="wc-val">{w.qual_none}%</div>
            <div className="wc-sub">no quals</div>
          </div>
        );
      })}
    </div>
  );
}
