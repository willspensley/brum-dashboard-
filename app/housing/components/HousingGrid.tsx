'use client';
import type { HousingWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

interface Props {
  wards: HousingWard[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export default function HousingGrid({ wards, selected, onSelect }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginRight: 6 }}>
          lower pressure
        </span>
        {RAMP.map((c, i) => (
          <div key={i} style={{ width: 18, height: 11, background: c }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginLeft: 6 }}>
          higher
        </span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 12, lineHeight: 1.5 }}>
        Decile = overcrowding × 0.45 + rent-to-income × 0.35 + price-to-income × 0.20
      </div>
      <div className="ward-grid">
        {wards.map(w => (
          <div
            key={w.ward_code}
            className={`ward-cell${selected === w.ward_code ? ' sel' : ''}`}
            style={{ background: RAMP[w.housing_pressure_decile - 1] }}
            onClick={() => onSelect(w.ward_code)}
          >
            <div className="wc-name">{w.ward_name}</div>
            <div className="wc-val">{w.overcrowding_pct}%</div>
            <div className="wc-sub">overcrowded · D{w.housing_pressure_decile}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
