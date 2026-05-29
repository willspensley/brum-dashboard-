'use client';

import type { Ward } from '@/lib/types';

const RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

interface Props {
  wards: Ward[];
  selected: Ward | null;
  onSelect: (code: string) => void;
}

export default function NeetTable({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.neet_risk_score - a.neet_risk_score);
  const max = Math.max(...wards.map(w => w.neet_risk_score));

  const rampColor = (score: number) => {
    const idx = Math.round((score / max) * 9);
    return RAMP[Math.max(0, Math.min(9, idx))];
  };

  return (
    <div className="tbl-wrap">
      <table className="data-tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Ward</th>
            <th>NEET Risk Decile</th>
            <th>Youth UC %</th>
            <th>Health Inactivity %</th>
            <th>IMD Employment</th>
            <th>Composite Decile</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((w, i) => {
            const col = rampColor(w.neet_risk_score);
            const isSelected = selected?.ward_code === w.ward_code;
            return (
              <tr
                key={w.ward_code}
                className={isSelected ? 'row-selected' : ''}
                onClick={() => onSelect(w.ward_code)}
                style={{ cursor: 'pointer' }}
              >
                <td className="rank-cell">{i + 1}</td>
                <td className="name-cell">{w.ward_name}</td>
                <td>
                  <span className="pill" style={{ background: col, color: '#f5f3ee' }}>
                    {w.neet_risk_decile}/10
                  </span>
                </td>
                <td style={{ color: w.youth_claimant_rate > 5 ? col : 'inherit' }}>
                  {w.youth_claimant_rate}%
                  <span className="tbl-mod"> est</span>
                </td>
                <td style={{ color: w.inactivity_sick_pct > 14 ? col : 'inherit' }}>
                  {w.inactivity_sick_pct}%
                </td>
                <td>{(w.imd_employment_score * 100).toFixed(1)}%</td>
                <td>{w.composite_decile}/10</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
