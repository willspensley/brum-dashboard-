'use client';

import { useState } from 'react';
import type { CrimeWard } from '@/lib/types';
import { CRIME_RAMP } from '@/lib/constants';

interface Props {
  wards: CrimeWard[];
  selected: CrimeWard | null;
  onSelect: (code: string) => void;
}

export default function CrimeTable({ wards, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<'crime_rate_per_1000' | 'ward_name'>('crime_rate_per_1000');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sorted = [...wards].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === 'string') return sortDir * (av as string).localeCompare(bv as string);
    return sortDir * ((av as number) - (bv as number));
  });

  const maxRate = Math.max(...wards.map(w => w.crime_rate_per_1000));

  const handleSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  };

  const rampColor = (rate: number) => {
    const idx = Math.round((rate / maxRate) * 9);
    return CRIME_RAMP[Math.max(0, Math.min(9, idx))];
  };

  return (
    <div className="crime-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="sort-th" onClick={() => handleSort('ward_name')}>
              Ward {sortKey === 'ward_name' ? (sortDir === -1 ? '↓' : '↑') : ''}
            </th>
            <th className="sort-th" onClick={() => handleSort('crime_rate_per_1000')}>
              Rate /1000 {sortKey === 'crime_rate_per_1000' ? (sortDir === -1 ? '↓' : '↑') : ''}
            </th>
            <th>Rank</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(w => (
            <tr
              key={w.ward_code}
              className={selected?.ward_code === w.ward_code ? 'row-selected' : ''}
              onClick={() => onSelect(w.ward_code)}
            >
              <td className="td-ward">{w.ward_name}</td>
              <td className="td-mono" style={{ color: rampColor(w.crime_rate_per_1000) }}>
                {w.crime_rate_per_1000.toFixed(1)}
              </td>
              <td className="td-mono td-muted">#{w.crime_rank}</td>
              <td>
                <div className="mini-bar-bg">
                  <div
                    className="mini-bar-fill"
                    style={{ width: `${(w.crime_rate_per_1000 / maxRate) * 100}%`, background: rampColor(w.crime_rate_per_1000) }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
