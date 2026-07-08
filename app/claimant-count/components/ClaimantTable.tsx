'use client';

import { useState } from 'react';
import type { ClaimantWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

// Cloned from UcEmpTable / CrimeTable — shared .data-table classes, plus a 12-month
// sparkline of the DWP claimant-count series (real monthly figures, rounded to 5).
interface Props {
  wards: ClaimantWard[];
  selected: ClaimantWard | null;
  onSelect: (code: string) => void;
}

function Spark({ trend }: { trend: (number | null)[] }) {
  const pts = trend.slice(-12).filter((v): v is number => v != null);
  if (pts.length < 2) return <span style={{ color: 'var(--muted2)' }}>—</span>;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const W = 64, H = 18;
  const path = pts.map((v, i) => `${(i / (pts.length - 1)) * W},${H - 2 - ((v - min) / span) * (H - 4)}`).join(' ');
  const up = pts.at(-1)! > pts[0];
  return (
    <svg width={W} height={H} style={{ display: 'block' }} aria-hidden="true">
      <polyline points={path} fill="none" stroke={up ? '#b01225' : '#1a3a2a'} strokeWidth="1.4" />
    </svg>
  );
}

export default function ClaimantTable({ wards, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<'pct_16_64' | 'count' | 'ward_name'>('pct_16_64');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sorted = [...wards].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === 'string') return sortDir * (av as string).localeCompare(bv as string);
    return sortDir * ((av as number) - (bv as number));
  });

  const maxPct = Math.max(...wards.map(w => w.pct_16_64), 1);
  const handleSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  };
  const rampColor = (pct: number) => RAMP[Math.max(0, Math.min(9, Math.round((pct / maxPct) * 9)))];
  const arrow = (k: typeof sortKey) => (sortKey === k ? (sortDir === -1 ? ' ↓' : ' ↑') : '');

  return (
    <div className="crime-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="sort-th" onClick={() => handleSort('ward_name')} style={{ cursor: 'pointer' }}>Ward{arrow('ward_name')}</th>
            <th className="sort-th" onClick={() => handleSort('pct_16_64')} style={{ cursor: 'pointer' }}>% of 16–64{arrow('pct_16_64')}</th>
            <th className="sort-th" onClick={() => handleSort('count')} style={{ cursor: 'pointer' }}>Claimants{arrow('count')}</th>
            <th>12 months</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(w => (
            <tr key={w.ward_code} className={selected?.ward_code === w.ward_code ? 'selected' : ''} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
              <td className="td-ward" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}>{w.ward_name}</td>
              <td style={{ color: rampColor(w.pct_16_64), fontWeight: 500 }}>{w.pct_16_64}%</td>
              <td style={{ color: 'var(--muted)' }}>{w.count.toLocaleString()}</td>
              <td><Spark trend={w.trend} /></td>
              <td>
                <div className="mini-bar-bg">
                  <div className="mini-bar-fill" style={{ width: `${(w.pct_16_64 / maxPct) * 100}%`, background: rampColor(w.pct_16_64) }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
