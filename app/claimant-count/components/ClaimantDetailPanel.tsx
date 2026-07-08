import type { ClaimantWard, UcSource } from '@/lib/types';
import { RAMP } from '@/lib/constants';
import Tip from '../../components/Tip';

// Cloned from UcEmpDetailPanel — same d-hdr / d-chips structure, plus the 5-year DWP
// trend line, the age-band split and the male/female split (all real figures; counts
// are DWP-rounded to the nearest 5).
interface Props {
  ward: ClaimantWard;
  wards: ClaimantWard[];
  months: string[];
  sources: UcSource[];
  onClose: () => void;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const labelOf = (m: string) => `${MONTH_NAMES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`;

function TrendLine({ trend, months }: { trend: (number | null)[]; months: string[] }) {
  const pts = trend.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map(p => p.v)), max = Math.max(...pts.map(p => p.v));
  const span = max - min || 1;
  const W = 252, H = 72;
  const x = (i: number) => (i / (trend.length - 1)) * W;
  const y = (v: number) => H - 4 - ((v - min) / span) * (H - 8);
  const path = pts.map(p => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const last = pts.at(-1)!;
  return (
    <div>
      <svg width="100%" height={H + 14} viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1="0" y1={y(max)} x2={W} y2={y(max)} stroke="rgba(14,15,17,.07)" strokeWidth="1" />
        <line x1="0" y1={y(min)} x2={W} y2={y(min)} stroke="rgba(14,15,17,.07)" strokeWidth="1" />
        <polyline points={path} fill="none" stroke="#16306f" strokeWidth="1.6" />
        <circle cx={x(last.i)} cy={y(last.v)} r="2.4" fill="#b01225" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--muted2)' }}>
        <span>{labelOf(months[0])}</span>
        <span>peak {max.toLocaleString()} · low {min.toLocaleString()}</span>
        <span>{labelOf(months[months.length - 1])}</span>
      </div>
    </div>
  );
}

export default function ClaimantDetailPanel({ ward: w, wards, months, sources, onClose }: Props) {
  const pct = w.pct_16_64;
  const maxPct = Math.max(...wards.map(x => x.pct_16_64), 1);
  const mean = (wards.reduce((s, x) => s + x.pct_16_64, 0) / wards.length).toFixed(1);
  const rampColor = RAMP[Math.max(0, Math.min(9, Math.round((pct / maxPct) * 9)))];
  const rank = [...wards].sort((a, b) => b.pct_16_64 - a.pct_16_64)
    .findIndex(x => x.ward_code === w.ward_code) + 1;

  // 12-month change from the real series (both ends DWP-rounded).
  const t = w.trend.filter((v): v is number => v != null);
  const yearAgo = w.trend.length >= 13 ? w.trend[w.trend.length - 13] : null;
  const change12 = yearAgo != null && t.length ? t[t.length - 1] - yearAgo : null;

  const ages: [string, number | null][] = [
    ['16–24', w.age_16_24],
    ['25–49', w.age_25_49],
    ['50+', w.age_50_plus],
  ];
  const ageMax = Math.max(...ages.map(([, v]) => v ?? 0), 1);

  return (
    <div>
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{w.ward_name}</div>
            <div className="d-sub">{w.ward_code} · {w.count.toLocaleString()} claimants</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="d-chips">
          <Tip text="DWP's own published proportion — claimants of unemployment-related benefits (UC 'searching for work' + JSA) as a share of residents aged 16-64. Not derived by us. 'ward mean' is the unweighted average across the 69 wards.">
            <div className="d-chip">
              <div className="d-chip-lbl">% of 16–64</div>
              <div className="d-chip-val" style={{ color: rampColor }}>{pct}%</div>
              <div className="d-chip-sub">ward mean {mean}%</div>
            </div>
          </Tip>
          <Tip text="Claimant headcount in this ward, latest month. DWP rounds all claimant counts to the nearest 5.">
            <div className="d-chip">
              <div className="d-chip-lbl">Claimants</div>
              <div className="d-chip-val">{w.count.toLocaleString()}</div>
              <div className="d-chip-sub">rounded to 5</div>
            </div>
          </Tip>
          <Tip text="Where this ward ranks among all 69 Birmingham wards by % of working-age residents claiming. #1 = highest.">
            <div className="d-chip">
              <div className="d-chip-lbl">City rank</div>
              <div className="d-chip-val">#{rank}</div>
              <div className="d-chip-sub">of {wards.length} wards</div>
            </div>
          </Tip>
          <Tip text="Change in the claimant count over the last 12 months, from the same DWP series (both figures rounded to the nearest 5).">
            <div className="d-chip">
              <div className="d-chip-lbl">12-mo change</div>
              <div className="d-chip-val" style={{ color: change12 == null ? 'var(--muted)' : change12 > 0 ? 'var(--herald-red)' : 'var(--q-prosp)' }}>
                {change12 == null ? '—' : `${change12 > 0 ? '+' : ''}${change12.toLocaleString()}`}
              </div>
              <div className="d-chip-sub">claimants</div>
            </div>
          </Tip>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">5-year claimant count</div>
        <TrendLine trend={w.trend} months={months} />
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">By age (latest month)</div>
        {ages.map(([lbl, v]) => (
          <div key={lbl} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 52px', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{lbl}</span>
            <div className="mini-bar-bg">
              <div className="mini-bar-fill" style={{ width: `${((v ?? 0) / ageMax) * 100}%`, background: 'var(--herald-navy)' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textAlign: 'right' }}>{v?.toLocaleString() ?? '—'}</span>
          </div>
        ))}
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">By sex (latest month)</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {([['Male', w.male_count, w.male_pct], ['Female', w.female_count, w.female_pct]] as [string, number | null, number | null][]).map(([lbl, c, p]) => (
            <div key={lbl} style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted2)' }}>{lbl}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{c?.toLocaleString() ?? '—'}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--muted)' }}>{p != null ? `${p}% of 16–64 ${lbl.toLowerCase()}s` : '—'}</div>
            </div>
          ))}
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
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--muted2)', marginTop: 8, lineHeight: 1.5 }}>
          DWP rounds all claimant counts to the nearest 5; age/sex splits may not sum exactly to the total.
        </div>
      </div>
    </div>
  );
}
