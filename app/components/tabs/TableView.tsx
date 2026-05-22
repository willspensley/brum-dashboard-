import type { Ward } from '@/lib/types';
import { dc } from '@/lib/constants';

interface Props {
  wards: Ward[];
  selected: Ward | null;
  onSelect: (code: string) => void;
}

export default function TableView({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.composite - a.composite);
  return (
    <div className="ward-list">
      <div className="ward-row hr">
        <span>#</span>
        <span>Ward</span>
        <span style={{ textAlign: 'right' }}>IMD empl</span>
        <span style={{ textAlign: 'right' }}>Claimant%</span>
        <span style={{ textAlign: 'right' }}>Inactive%</span>
        <span>Score</span>
      </div>
      {sorted.map((w, i) => (
        <div
          key={w.ward_code}
          className={`ward-row${selected?.ward_code === w.ward_code ? ' selected' : ''}`}
          onClick={() => onSelect(w.ward_code)}
        >
          <span className="rnum">{i + 1}</span>
          <span className="wnm">{w.ward_name}</span>
          <span className="mcell">{(w.imd_employment_score * 100).toFixed(1)}%</span>
          <span className="mcell">{w.claimant_rate}%</span>
          <span className="mcell">{w.inactivity_sick_pct}%</span>
          <div className="dbar-cell">
            <div className="dbar" style={{ width: `${w.composite * 58 + 3}px`, background: dc(w.composite_decile) }} />
            <span className="dbar-txt">{(w.composite * 100).toFixed(0)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
