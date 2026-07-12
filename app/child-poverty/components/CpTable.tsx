'use client';

import { useState } from 'react';
import type { ChildPovertyWard, ChildPovertyData } from '@/lib/types';
import { RAMP } from '@/lib/constants';

// Ranked table — latest %, gap vs the REAL Birmingham-LA figure, decade change,
// 10-year sparkline. Shared .data-table classes.
interface Props {
  data: ChildPovertyData;
  selected: ChildPovertyWard | null;
  onSelect: (code: string) => void;
}

function Spark({ series }: { series: (number | null)[] }) {
  const pts = series.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  if (pts.length < 2) return <span style={{ color: 'var(--muted2)' }}>—</span>;
  const min = Math.min(...pts.map(p => p.v)), max = Math.max(...pts.map(p => p.v));
  const span = max - min || 1;
  const W = 64, H = 18;
  const path = pts.map(p => `${(p.i / (series.length - 1)) * W},${H - 2 - ((p.v - min) / span) * (H - 4)}`).join(' ');
  const up = pts.at(-1)!.v > pts[0].v;
  return (
    <svg width={W} height={H} style={{ display: 'block' }} aria-hidden="true">
      <polyline points={path} fill="none" stroke={up ? '#b01225' : '#1a3a2a'} strokeWidth="1.4" />
    </svg>
  );
}

type Key = 'latest_pct' | 'delta_pp' | 'ward_name';

export default function CpTable({ data, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<Key>('latest_pct');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const wards = data.wards;
  const cityLatest = data.city.city_latest;

  const sorted = [...wards].sort((a, b) => {
    const av = a[sortKey] ?? -999, bv = b[sortKey] ?? -999;
    if (typeof av === 'string') return sortDir * av.localeCompare(bv as string);
    return sortDir * ((av as number) - (bv as number));
  });

  const maxPct = Math.max(...wards.map(w => w.latest_pct), 1);
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
            <th className="sort-th" onClick={() => handleSort('latest_pct')} style={{ cursor: 'pointer' }}>% of children{arrow('latest_pct')}</th>
            <th>vs city ({cityLatest ?? '—'}%)</th>
            <th className="sort-th" onClick={() => handleSort('delta_pp')} style={{ cursor: 'pointer' }}>Δ since {data.years[0]}{arrow('delta_pp')}</th>
            <th>10 years</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(w => {
            const gap = cityLatest != null ? Math.round((w.latest_pct - cityLatest) * 10) / 10 : null;
            return (
              <tr key={w.ward_code} className={selected?.ward_code === w.ward_code ? 'selected' : ''} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
                <td className="td-ward" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}>{w.ward_name}</td>
                <td style={{ color: rampColor(w.latest_pct), fontWeight: 500 }}>{w.latest_pct}%</td>
                <td style={{ color: gap != null && gap > 0 ? 'var(--herald-red)' : 'var(--muted)' }}>{gap != null ? `${gap > 0 ? '+' : ''}${gap}pp` : '—'}</td>
                <td style={{ color: w.delta_pp != null && w.delta_pp > 0 ? 'var(--herald-red)' : 'var(--q-prosp)' }}>{w.delta_pp != null ? `${w.delta_pp > 0 ? '+' : ''}${w.delta_pp}pp` : '—'}</td>
                <td><Spark series={w.series} /></td>
                <td>
                  <div className="mini-bar-bg">
                    <div className="mini-bar-fill" style={{ width: `${(w.latest_pct / maxPct) * 100}%`, background: rampColor(w.latest_pct) }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
