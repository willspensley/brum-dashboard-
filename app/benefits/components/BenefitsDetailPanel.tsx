import type { UcWard, UcSource } from '@/lib/types';
import { RAMP } from '@/lib/constants';
import Tip from '../../components/Tip';

// Modelled on CrimeDetailPanel — same d-hdr / d-chips structure, plus provenance.
interface Props {
  ward: UcWard;
  wards: UcWard[];
  sources: UcSource[];
  onClose: () => void;
}

export default function BenefitsDetailPanel({ ward: w, wards, sources, onClose }: Props) {
  const pct = w.pct_on_uc ?? 0;
  const maxPct = Math.max(...wards.map(x => x.pct_on_uc ?? 0), 1);
  const avgNum = wards.reduce((s, x) => s + (x.pct_on_uc ?? 0), 0) / wards.length;
  const avg = avgNum.toFixed(1);
  const rampColor = RAMP[Math.max(0, Math.min(9, Math.round((pct / maxPct) * 9)))];
  const rank = [...wards].sort((a, b) => (b.pct_on_uc ?? -1) - (a.pct_on_uc ?? -1))
    .findIndex(x => x.ward_code === w.ward_code) + 1;

  return (
    <div>
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{w.ward_name}</div>
            <div className="d-sub">{w.ward_code} · Pop {w.population?.toLocaleString() ?? '—'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="d-chips">
          <Tip text="Share of this ward's residents (all ages) claiming Universal Credit. Claimants ÷ ONS mid-2024 population × 100. 'city avg' is the Birmingham mean.">
            <div className="d-chip">
              <div className="d-chip-lbl">% on UC</div>
              <div className="d-chip-val" style={{ color: rampColor }}>{w.pct_on_uc ?? '—'}%</div>
              <div className="d-chip-sub">city avg {avg}%</div>
            </div>
          </Tip>
          <Tip text="Where this ward sits among all Birmingham wards by % of residents on UC. #1 = the highest.">
            <div className="d-chip">
              <div className="d-chip-lbl">City rank</div>
              <div className="d-chip-val">#{rank}</div>
              <div className="d-chip-sub">of {wards.length} wards</div>
            </div>
          </Tip>
          <Tip text="This ward's % on UC divided by the Birmingham average. 1.0× = exactly average; 2.0× = twice the city average.">
            <div className="d-chip">
              <div className="d-chip-lbl">vs city average</div>
              <div className="d-chip-val">{(pct / avgNum).toFixed(1)}×</div>
              <div className="d-chip-sub">{pct >= avgNum ? 'above' : 'below'} average</div>
            </div>
          </Tip>
          <Tip text="Number of people on Universal Credit in this ward (DWP administrative count).">
            <div className="d-chip">
              <div className="d-chip-lbl">Claimants</div>
              <div className="d-chip-val">{w.uc_claimants.toLocaleString()}</div>
              <div className="d-chip-sub">people</div>
            </div>
          </Tip>
        </div>
      </div>

      <div className="d-sec" style={{ borderBottom: 'none' }}>
        <div className="d-sec-ttl">Sources</div>
        {sources.map((s, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < sources.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 4 }}>{s.publisher} · {s.licence} · {s.as_of}</div>
            <a href={s.catalogueUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#1a2a3a', textDecoration: 'underline' }}>View dataset on City Observatory ↗</a>
          </div>
        ))}
      </div>
    </div>
  );
}
