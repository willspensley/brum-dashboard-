import type { CrimeWard } from '@/lib/types';
import { CRIME_RAMP, CRIME_CATS } from '@/lib/constants';
import Tip from '../Tip';

interface Props {
  ward: CrimeWard;
  wards: CrimeWard[];
  onClose: () => void;
}

export default function CrimeDetailPanel({ ward: w, wards, onClose }: Props) {
  const maxRate = Math.max(...wards.map(x => x.crime_rate_per_1000));
  const avgRateNum = wards.reduce((s, x) => s + x.crime_rate_per_1000, 0) / wards.length;
  const avgRate = avgRateNum.toFixed(1);
  const rampIdx = Math.round((w.crime_rate_per_1000 / maxRate) * 9);
  const rampColor = CRIME_RAMP[Math.max(0, Math.min(9, rampIdx))];

  const cats = Object.entries(w.crime_categories ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCat = cats[0]?.[1] ?? 1;

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
          <Tip text="Recorded crimes per 1,000 residents over the period (West Midlands Police, via data.police.uk). Dividing by population lets large and small wards be compared fairly. 'city avg' is the Birmingham mean.">
            <div className="d-chip">
              <div className="d-chip-lbl">Crimes / 1000</div>
              <div className="d-chip-val" style={{ color: rampColor }}>{w.crime_rate_per_1000.toFixed(1)}</div>
              <div className="d-chip-sub">city avg {avgRate}</div>
            </div>
          </Tip>
          <Tip text="Where this ward sits among all Birmingham wards by crime rate. #1 = the highest recorded crime rate in the city.">
            <div className="d-chip">
              <div className="d-chip-lbl">City rank</div>
              <div className="d-chip-val">#{w.crime_rank}</div>
              <div className="d-chip-sub">of {wards.length} wards</div>
            </div>
          </Tip>
          <Tip text="This ward's crime rate divided by the Birmingham average. 1.0× = exactly average; 2.0× = twice the city average.">
            <div className="d-chip">
              <div className="d-chip-lbl">vs city average</div>
              <div className="d-chip-val">{(w.crime_rate_per_1000 / avgRateNum).toFixed(1)}×</div>
              <div className="d-chip-sub">{w.crime_rate_per_1000 >= avgRateNum ? 'above' : 'below'} average</div>
            </div>
          </Tip>
          <Tip text="This ward's crime rate as a share of the city's highest-crime ward (which is 100%). A quick read of how close this ward is to the worst in Birmingham.">
            <div className="d-chip">
              <div className="d-chip-lbl">Intensity</div>
              <div className="d-chip-val" style={{ color: rampColor }}>{Math.round((w.crime_rate_per_1000 / maxRate) * 100)}%</div>
              <div className="d-chip-sub">of city max</div>
            </div>
          </Tip>
        </div>
      </div>

      {cats.length > 0 && (
        <div className="d-sec" style={{ borderBottom: 'none' }}>
          <div className="d-sec-ttl">Category breakdown</div>
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
    </div>
  );
}
