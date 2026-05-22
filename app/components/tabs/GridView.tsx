import type { Ward } from '@/lib/types';
import { dc } from '@/lib/constants';

interface Props {
  wards: Ward[];
  selected: Ward | null;
  onSelect: (code: string) => void;
}

export default function GridView({ wards, selected, onSelect }: Props) {
  const sorted = [...wards].sort((a, b) => b.composite - a.composite);
  return (
    <div className="ward-grid">
      {sorted.map(w => {
        const c = dc(w.composite_decile);
        const isSelected = selected?.ward_code === w.ward_code;
        return (
          <div
            key={w.ward_code}
            className={`wcard${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(w.ward_code)}
          >
            <div className="wc-stripe" style={{ background: c }} />
            <div className="wc-nm">{w.ward_name}</div>
            <div className="wc-sc">{(w.composite * 100).toFixed(0)}</div>
            <div className="wc-lbl">composite score</div>
            <div className="wc-bars">
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#1a2a3a' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${w.imd_norm * 100}%`, background: '#1a2a3a' }} /></div>
              </div>
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#7d4e36' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${w.cc_norm * 100}%`, background: '#7d4e36' }} /></div>
              </div>
              <div className="wc-bar-row">
                <div className="wc-dot" style={{ background: '#2a1a3a' }} />
                <div className="wc-bar-track"><div className="wc-bar-fill" style={{ width: `${w.ia_norm * 100}%`, background: '#2a1a3a' }} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
