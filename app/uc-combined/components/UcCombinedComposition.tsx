'use client';

import type { UcCombinedWard } from '@/lib/types';

// Composition view — the data-science standard for part-to-whole per category:
// one stacked horizontal bar per ward (in work vs not in work), sorted by claimant
// count, so both the SIZE of each ward's UC population and its SPLIT read at a glance.
interface Props {
  wards: UcCombinedWard[];
  selected: UcCombinedWard | null;
  onSelect: (code: string) => void;
}

const IN_WORK = '#16306f';    // herald navy
const NOT_IN_WORK = '#b01225';    // herald red

export default function UcCombinedComposition({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.uc_claimants - a.uc_claimants);
  const max = Math.max(...wards.map(w => w.uc_claimants), 1);

  return (
    <div className="crime-table-wrap" style={{ padding: '10px 14px' }}>
      <div className="comp-legend">
        <span><i style={{ background: IN_WORK }} /> in work</span>
        <span><i style={{ background: NOT_IN_WORK }} /> not in work</span>
        <span style={{ marginLeft: 'auto', color: 'var(--muted2)' }}>bar length = people on UC</span>
      </div>
      {sorted.map(w => {
        const inW = w.in_work_count ?? 0;
        const notW = w.not_in_work_count ?? 0;
        const notPct = w.uc_claimants ? Math.round((notW / w.uc_claimants) * 100) : null;
        return (
          <div
            key={w.ward_code}
            className={`comp-row${selected?.ward_code === w.ward_code ? ' selected' : ''}`}
            onClick={() => onSelect(w.ward_code)}
          >
            <div className="comp-name">{w.ward_name}</div>
            <div className="comp-track">
              <div className="comp-seg" style={{ width: `${(inW / max) * 100}%`, background: IN_WORK }} />
              <div className="comp-seg" style={{ width: `${(notW / max) * 100}%`, background: NOT_IN_WORK }} />
              <span className="comp-val">{w.uc_claimants.toLocaleString()}{notPct != null ? ` · ${notPct}% not in work` : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
