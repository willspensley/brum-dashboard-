'use client';

import { useState } from 'react';
import type { UcEmpWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

// Cloned from BenefitsTable / CrimeTable — shared .data-table classes.
interface Props {
  wards: UcEmpWard[];
  selected: UcEmpWard | null;
  onSelect: (code: string) => void;
}

export default function UcEmpTable({ wards, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<'pct_in_employment' | 'ward_name'>('pct_in_employment');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sorted = [...wards].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === 'string') return sortDir * (av as string).localeCompare(bv as string);
    return sortDir * ((av as number) - (bv as number));
  });

  const maxPct = Math.max(...wards.map(w => w.pct_in_employment), 1);
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
            <th className="sort-th" onClick={() => handleSort('pct_in_employment')} style={{ cursor: 'pointer' }}>% in work{arrow('pct_in_employment')}</th>
            <th>In work</th>
            <th>Claimants</th>
            <th>Population</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(w => (
            <tr key={w.ward_code} className={selected?.ward_code === w.ward_code ? 'selected' : ''} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
              <td className="td-ward" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}>{w.ward_name}</td>
              <td style={{ color: rampColor(w.pct_in_employment), fontWeight: 500 }}>{w.pct_in_employment}%</td>
              <td>{w.in_work_count?.toLocaleString() ?? '—'}</td>
              <td style={{ color: 'var(--muted)' }}>{w.uc_claimants?.toLocaleString() ?? '—'}</td>
              <td style={{ color: 'var(--muted2)' }}>{w.population?.toLocaleString() ?? '—'}</td>
              <td>
                <div className="mini-bar-bg">
                  <div className="mini-bar-fill" style={{ width: `${(w.pct_in_employment / maxPct) * 100}%`, background: rampColor(w.pct_in_employment) }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
