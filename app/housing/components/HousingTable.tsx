'use client';
import { useState } from 'react';
import type { HousingWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

type SortKey =
  | 'housing_pressure_rank'
  | 'median_house_price_k'
  | 'price_to_income'
  | 'private_rent_pcm'
  | 'rent_income_pct'
  | 'overcrowding_pct'
  | 'owner_occupation_pct'
  | 'social_rented_pct';

interface Col { key: SortKey; label: string }

const COLS: Col[] = [
  { key: 'housing_pressure_rank', label: 'Rank' },
  { key: 'median_house_price_k',  label: 'Med price' },
  { key: 'price_to_income',       label: 'P:I ratio' },
  { key: 'private_rent_pcm',      label: 'Rent/mo' },
  { key: 'rent_income_pct',       label: 'Rent:income' },
  { key: 'overcrowding_pct',      label: 'Overcrowding' },
  { key: 'owner_occupation_pct',  label: 'Owned' },
  { key: 'social_rented_pct',     label: 'Social' },
];

function fmt(w: HousingWard, key: SortKey): string {
  switch (key) {
    case 'housing_pressure_rank':  return `#${w[key]}`;
    case 'median_house_price_k':   return `£${w[key]}k`;
    case 'price_to_income':        return `${w[key]}×`;
    case 'private_rent_pcm':       return `£${w[key]}`;
    case 'rent_income_pct':        return `${w[key]}%`;
    case 'overcrowding_pct':       return `${w[key]}%`;
    case 'owner_occupation_pct':   return `${w[key]}%`;
    case 'social_rented_pct':      return `${w[key]}%`;
  }
}

interface Props {
  wards: HousingWard[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export default function HousingTable({ wards, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('housing_pressure_rank');
  const [sortAsc, setSortAsc] = useState(true);

  const rows = [...wards].sort((a, b) =>
    sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
  );

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  return (
    <div className="tbl-wrap">
      <table className="data-tbl">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Ward</th>
            <th style={{ textAlign: 'center' }}>D</th>
            {COLS.map(col => (
              <th
                key={col.key}
                style={{ textAlign: 'right', cursor: 'pointer', fontWeight: col.key === sortKey ? 700 : undefined }}
                onClick={() => handleSort(col.key)}
              >
                {col.label}{col.key === sortKey ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(w => (
            <tr
              key={w.ward_code}
              className={selected === w.ward_code ? 'sel' : ''}
              onClick={() => onSelect(w.ward_code)}
              style={{ cursor: 'pointer' }}
            >
              <td>{w.ward_name}</td>
              <td style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  background: RAMP[w.housing_pressure_decile - 1],
                  color: '#fff',
                  fontSize: 9,
                  fontFamily: 'var(--mono)',
                  padding: '1px 5px',
                }}>
                  {w.housing_pressure_decile}
                </span>
              </td>
              {COLS.map(col => (
                <td key={col.key} style={{ textAlign: 'right' }}>{fmt(w, col.key)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
