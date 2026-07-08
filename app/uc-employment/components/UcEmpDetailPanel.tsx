import type { UcEmpWard, UcSource } from '@/lib/types';
import { RAMP } from '@/lib/constants';
import Tip from '../../components/Tip';

// Cloned from BenefitsDetailPanel — same d-hdr / d-chips structure.
interface Props {
  ward: UcEmpWard;
  wards: UcEmpWard[];
  sources: UcSource[];
  onClose: () => void;
}

export default function UcEmpDetailPanel({ ward: w, wards, sources, onClose }: Props) {
  const pct = w.pct_in_employment;
  const maxPct = Math.max(...wards.map(x => x.pct_in_employment), 1);
  const meanNum = wards.reduce((s, x) => s + x.pct_in_employment, 0) / wards.length;
  const mean = meanNum.toFixed(1);
  const rampColor = RAMP[Math.max(0, Math.min(9, Math.round((pct / maxPct) * 9)))];
  const rank = [...wards].sort((a, b) => b.pct_in_employment - a.pct_in_employment)
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
          <Tip text="Share of this ward's Universal Credit claimants who are also in paid work — the 'in-work poverty' signal. DWP administrative figure. 'ward mean' is the unweighted average across Birmingham's 69 wards.">
            <div className="d-chip">
              <div className="d-chip-lbl">% in work</div>
              <div className="d-chip-val" style={{ color: rampColor }}>{pct}%</div>
              <div className="d-chip-sub">ward mean {mean}%</div>
            </div>
          </Tip>
          <Tip text="Headcount of claimants in this ward who are also in paid work. Derived: claimants × % ÷ 100.">
            <div className="d-chip">
              <div className="d-chip-lbl">In work</div>
              <div className="d-chip-val">{w.in_work_count?.toLocaleString() ?? '—'}</div>
              <div className="d-chip-sub">of {w.uc_claimants?.toLocaleString() ?? '—'} claimants</div>
            </div>
          </Tip>
          <Tip text="Total Universal Credit claimants in this ward — the denominator this percentage is a share of (DWP, same month).">
            <div className="d-chip">
              <div className="d-chip-lbl">Claimants</div>
              <div className="d-chip-val">{w.uc_claimants?.toLocaleString() ?? '—'}</div>
              <div className="d-chip-sub">on UC</div>
            </div>
          </Tip>
          <Tip text="Where this ward sits among all Birmingham wards by the share of claimants in work. #1 = the highest share working while claiming.">
            <div className="d-chip">
              <div className="d-chip-lbl">City rank</div>
              <div className="d-chip-val">#{rank}</div>
              <div className="d-chip-sub">of {wards.length} wards</div>
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
