import type { Ward } from '@/lib/types';
import { Q_LABELS } from '@/lib/constants';

interface Props {
  wards: Ward[];
  pinnedWards: string[];
  onUnpin: (code: string) => void;
}

export default function Compare({ wards, pinnedWards, onUnpin }: Props) {
  if (!pinnedWards.length) {
    return (
      <div className="compare-empty">
        <span style={{ fontSize: 22, opacity: 0.3 }}>⊕</span>
        <span>Pin wards from the detail panel to compare them here.</span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Click any ward → use the &ldquo;Pin for Compare&rdquo; button</span>
      </div>
    );
  }

  const ws = pinnedWards.map(c => wards.find(w => w.ward_code === c)).filter(Boolean) as Ward[];

  if (ws.length === 1) {
    return (
      <div className="compare-empty">
        <span>Pin one more ward to compare.</span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{ws[0].ward_name} is pinned.</span>
      </div>
    );
  }

  const [a, b] = ws;

  const rows: { l: string; a: string; b: string; lower: boolean | null }[] = [
    { l: 'Composite score', a: (a.composite * 100).toFixed(0), b: (b.composite * 100).toFixed(0), lower: true },
    { l: 'Composite decile', a: `${a.composite_decile}/10`, b: `${b.composite_decile}/10`, lower: true },
    { l: 'Claimant rate', a: `${a.claimant_rate}%`, b: `${b.claimant_rate}%`, lower: true },
    { l: 'IMD employment', a: `${(a.imd_employment_score * 100).toFixed(1)}%`, b: `${(b.imd_employment_score * 100).toFixed(1)}%`, lower: true },
    { l: 'Inactivity (sick)', a: `${a.inactivity_sick_pct}%`, b: `${b.inactivity_sick_pct}%`, lower: true },
    { l: 'GVA per head', a: `£${a.gva.toFixed(1)}k`, b: `£${b.gva.toFixed(1)}k`, lower: false },
    { l: 'Median earnings (est)', a: `£${a.earnings}k`, b: `£${b.earnings}k`, lower: false },
    { l: 'Quadrant', a: Q_LABELS[a.quadrant], b: Q_LABELS[b.quadrant], lower: null },
  ];

  const cls = (av: string, bv: string, lower: boolean | null, wi: number) => {
    if (lower === null) return 'diff-neutral';
    const an = parseFloat(av), bn = parseFloat(bv);
    if (isNaN(an) || isNaN(bn)) return 'diff-neutral';
    const aBetter = (lower && an < bn) || (!lower && an > bn);
    return wi === 0 ? (aBetter ? 'diff-better' : 'diff-worse') : (aBetter ? 'diff-worse' : 'diff-better');
  };

  return (
    <div className="compare-grid">
      {ws.map((w, wi) => (
        <div key={w.ward_code} className="compare-card">
          <div className="compare-hdr">
            <span className="compare-ward-name">{w.ward_name}</span>
            <button className="unpin-btn" onClick={() => onUnpin(w.ward_code)}>× unpin</button>
          </div>
          {rows.map(r => (
            <div key={r.l} className="compare-row">
              <span className="compare-lbl">{r.l}</span>
              <span className={`compare-val ${cls(r.a, r.b, r.lower, wi)}`}>{wi === 0 ? r.a : r.b}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
