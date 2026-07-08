'use client';

import { useState } from 'react';
import type { UcWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

// Modelled on CrimeTable — shared .data-table classes, sortable, ink-ramp bar.
interface Props {
  wards: UcWard[];
  selected: UcWard | null;
  onSelect: (code: string) => void;
}

export default function BenefitsTable({ wards, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<'pct_on_uc' | 'uc_claimants' | 'ward_name'>('pct_on_uc');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sorted = [...wards].sort((a, b) => {
    const av = a[sortKey] as number | string | null;
    const bv = b[sortKey] as number | string | null;
    if (typeof av === 'string') return sortDir * (av as string).localeCompare(bv as string);
    return sortDir * (((av as number) ?? -1) - ((bv as number) ?? -1));
  });

  const maxPct = Math.max(...wards.map(w => w.pct_on_uc ?? 0), 1);
  const handleSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  };
  const rampColor = (pct: number | null) => {
    if (pct == null) return 'var(--muted2)';
    return RAMP[Math.max(0, Math.min(9, Math.round((pct / maxPct) * 9)))];
  };
  const arrow = (k: typeof sortKey) => (sortKey === k ? (sortDir === -1 ? ' ↓' : ' ↑') : '');

  return (
    <div className="crime-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="sort-th" onClick={() => handleSort('ward_name')} style={{ cursor: 'pointer' }}>Ward{arrow('ward_name')}</th>
            <th className="sort-th" onClick={() => handleSort('pct_on_uc')} style={{ cursor: 'pointer' }}>% on UC{arrow('pct_on_uc')}</th>
            <th className="sort-th" onClick={() => handleSort('uc_claimants')} style={{ cursor: 'pointer' }}>Claimants{arrow('uc_claimants')}</th>
            <th>Population</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(w => (
            <tr key={w.ward_code} className={selected?.ward_code === w.ward_code ? 'selected' : ''} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
              <td className="td-ward" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}>{w.ward_name}</td>
              <td style={{ color: rampColor(w.pct_on_uc), fontWeight: 500 }}>{w.pct_on_uc != null ? `${w.pct_on_uc}%` : '—'}</td>
              <td>{w.uc_claimants.toLocaleString()}</td>
              <td style={{ color: 'var(--muted)' }}>{w.population?.toLocaleString() ?? '—'}</td>
              <td>
                <div className="mini-bar-bg">
                  <div className="mini-bar-fill" style={{ width: `${((w.pct_on_uc ?? 0) / maxPct) * 100}%`, background: rampColor(w.pct_on_uc) }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
