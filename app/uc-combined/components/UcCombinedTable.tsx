'use client';

import { useState } from 'react';
import type { UcCombinedWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

// The full UC picture per ward in one table — total / in work / not in work / % of residents.
interface Props {
  wards: UcCombinedWard[];
  selected: UcCombinedWard | null;
  onSelect: (code: string) => void;
}

type Key = 'pct_on_uc' | 'uc_claimants' | 'not_in_work_count' | 'in_work_count' | 'ward_name';

export default function UcCombinedTable({ wards, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<Key>('pct_on_uc');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sorted = [...wards].sort((a, b) => {
    const av = a[sortKey] ?? -1;
    const bv = b[sortKey] ?? -1;
    if (typeof av === 'string') return sortDir * av.localeCompare(bv as string);
    return sortDir * ((av as number) - (bv as number));
  });

  const maxPct = Math.max(...wards.map(w => w.pct_on_uc ?? 0), 1);
  const handleSort = (key: Key) => {
    if (key === sortKey) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  };
  const rampColor = (pct: number) => RAMP[Math.max(0, Math.min(9, Math.round((pct / maxPct) * 9)))];
  const arrow = (k: Key) => (sortKey === k ? (sortDir === -1 ? ' ↓' : ' ↑') : '');

  return (
    <div className="crime-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="sort-th" onClick={() => handleSort('ward_name')} style={{ cursor: 'pointer' }}>Ward{arrow('ward_name')}</th>
            <th className="sort-th" onClick={() => handleSort('pct_on_uc')} style={{ cursor: 'pointer' }}>% on UC{arrow('pct_on_uc')}</th>
            <th className="sort-th" onClick={() => handleSort('uc_claimants')} style={{ cursor: 'pointer' }}>On UC{arrow('uc_claimants')}</th>
            <th className="sort-th" onClick={() => handleSort('in_work_count')} style={{ cursor: 'pointer' }}>In work{arrow('in_work_count')}</th>
            <th className="sort-th" onClick={() => handleSort('not_in_work_count')} style={{ cursor: 'pointer' }}>Not in work{arrow('not_in_work_count')}</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(w => (
            <tr key={w.ward_code} className={selected?.ward_code === w.ward_code ? 'selected' : ''} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
              <td className="td-ward" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}>{w.ward_name}</td>
              <td style={{ color: rampColor(w.pct_on_uc ?? 0), fontWeight: 500 }}>{w.pct_on_uc != null ? `${w.pct_on_uc}%` : '—'}</td>
              <td>{w.uc_claimants.toLocaleString()}</td>
              <td style={{ color: 'var(--muted)' }}>{w.in_work_count?.toLocaleString() ?? '—'}</td>
              <td style={{ color: 'var(--herald-red)', fontWeight: 500 }}>{w.not_in_work_count?.toLocaleString() ?? '—'}</td>
              <td>
                <div className="mini-bar-bg">
                  <div className="mini-bar-fill" style={{ width: `${((w.pct_on_uc ?? 0) / maxPct) * 100}%`, background: rampColor(w.pct_on_uc ?? 0) }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
