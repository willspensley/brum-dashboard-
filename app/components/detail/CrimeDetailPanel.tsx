import type { Ward } from '@/lib/types';
import { CRIME_RAMP, CRIME_CATS, MONTHS } from '@/lib/constants';

interface Props {
  ward: Ward;
  wards: Ward[];
  onClose: () => void;
}

export default function CrimeDetailPanel({ ward: w, wards, onClose }: Props) {
  const maxRate = Math.max(...wards.map(x => x.crime_rate_per_1000));
  const avgRate = (wards.reduce((s, x) => s + x.crime_rate_per_1000, 0) / wards.length).toFixed(1);
  const rampIdx = Math.round((w.crime_rate_per_1000 / maxRate) * 9);
  const rampColor = CRIME_RAMP[Math.max(0, Math.min(9, rampIdx))];

  const cats = Object.entries(w.crime_categories ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCat = cats[0]?.[1] ?? 1;

  const trend = w.crime_trend_12m ?? [];
  const trendMax = Math.max(...(trend.length ? trend : [1]));
  const trendMonths = MONTHS.slice(0, 12);

  return (
    <div>
      {/* Header + tiles — same structure as the employment DetailPanel */}
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{w.ward_name}</div>
            <div className="d-sub">{w.ward_code} · Pop {w.population.toLocaleString()}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="d-chips">
          <div className="d-chip">
            <div className="d-chip-lbl">Crimes / 1000</div>
            <div className="d-chip-val" style={{ color: rampColor }}>{w.crime_rate_per_1000.toFixed(1)}</div>
            <div className="d-chip-sub">city avg {avgRate}</div>
          </div>
          <div className="d-chip">
            <div className="d-chip-lbl">City rank</div>
            <div className="d-chip-val">#{w.crime_rank}</div>
            <div className="d-chip-sub">of {wards.length} wards</div>
          </div>
          <div className="d-chip">
            <div className="d-chip-lbl">Year on year</div>
            <div className="d-chip-val" style={{ color: w.crime_yoy_pct > 0 ? 'var(--q-disad)' : 'var(--q-prosp)' }}>
              {w.crime_yoy_pct > 0 ? '+' : ''}{w.crime_yoy_pct.toFixed(1)}%
            </div>
            <div className="d-chip-sub">modelled</div>
          </div>
          <div className="d-chip">
            <div className="d-chip-lbl">Intensity</div>
            <div className="d-chip-val" style={{ color: rampColor }}>{Math.round((w.crime_rate_per_1000 / maxRate) * 100)}%</div>
            <div className="d-chip-sub">of city max</div>
          </div>
        </div>
      </div>

      {cats.length > 0 && (
        <div className="d-sec">
          <div className="d-sec-ttl">Category breakdown <span className="d-modelled">(modelled)</span></div>
          <div className="crime-cats">
            {cats.map(([cat, count]) => (
              <div key={cat} className="crime-cat-row">
                <div className="crime-cat-lbl">{CRIME_CATS[cat] ?? cat}</div>
                <div className="crime-cat-bar-wrap">
                  <div className="crime-cat-bar-fill" style={{ width: `${(count / maxCat) * 100}%`, background: rampColor }} />
                </div>
                <div className="crime-cat-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div className="d-sec" style={{ borderBottom: 'none' }}>
          <div className="d-sec-ttl">12-month trend <span className="d-modelled">(modelled)</span></div>
          <svg viewBox="0 0 240 60" className="sparkline-svg" style={{ maxWidth: '100%' }}>
            <polyline
              points={trend.map((v, i) => `${(i / 11) * 230 + 5},${55 - (v / trendMax) * 50}`).join(' ')}
              fill="none"
              stroke={rampColor}
              strokeWidth="1.5"
            />
          </svg>
          <div className="spark-months" style={{ maxWidth: '100%' }}>
            {trendMonths.map((m, i) => (
              <span key={i} className="spark-month">{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
