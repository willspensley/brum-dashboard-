'use client';
import type { HousingWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

interface Props {
  ward: HousingWard;
  wards: HousingWard[];
  onClose: () => void;
}

function normOf(v: number, arr: HousingWard[], key: keyof HousingWard): number {
  const vals = arr.map(w => w[key] as number);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  return mx > mn ? (v - mn) / (mx - mn) : 0;
}

function avg(arr: HousingWard[], key: keyof HousingWard): number {
  return arr.reduce((s, w) => s + (w[key] as number), 0) / arr.length;
}

export default function HousingDetailPanel({ ward: w, wards, onClose }: Props) {
  const color = RAMP[w.housing_pressure_decile - 1];

  const cityAvgPrice = Math.round(avg(wards, 'median_house_price_k'));
  const cityAvgRent  = Math.round(avg(wards, 'private_rent_pcm'));
  const cityAvgRI    = avg(wards, 'rent_income_pct').toFixed(1);
  const cityAvgOC    = avg(wards, 'overcrowding_pct').toFixed(1);
  const cityAvgPTI   = avg(wards, 'price_to_income').toFixed(1);

  // Normalised components for composite breakdown
  const ocN  = normOf(w.overcrowding_pct, wards, 'overcrowding_pct');
  const riN  = normOf(w.rent_income_pct,  wards, 'rent_income_pct');
  const piN  = normOf(w.price_to_income,  wards, 'price_to_income');

  // Comparative meter positions (% of max)
  const pricePos    = normOf(w.median_house_price_k, wards, 'median_house_price_k') * 100;
  const avgPricePos = normOf(cityAvgPrice,           wards, 'median_house_price_k') * 100;
  const rentPos     = normOf(w.private_rent_pcm,     wards, 'private_rent_pcm')     * 100;
  const avgRentPos  = normOf(cityAvgRent,            wards, 'private_rent_pcm')     * 100;
  const ocPos       = normOf(w.overcrowding_pct,     wards, 'overcrowding_pct')     * 100;
  const avgOCPos    = normOf(parseFloat(cityAvgOC),  wards, 'overcrowding_pct')     * 100;

  // Tenure stacked bar widths (normalised to sum = 100%)
  const tenureTotal = w.owner_occupation_pct + w.social_rented_pct + w.private_rented_pct;
  const ownerW   = (w.owner_occupation_pct / tenureTotal) * 100;
  const socialW  = (w.social_rented_pct    / tenureTotal) * 100;
  const privateW = (w.private_rented_pct   / tenureTotal) * 100;

  const meters = [
    { lbl: 'House price', pos: pricePos,  ref: avgPricePos, val: `£${w.median_house_price_k}k` },
    { lbl: 'Monthly rent', pos: rentPos,  ref: avgRentPos,  val: `£${w.private_rent_pcm}` },
    { lbl: 'Overcrowding', pos: ocPos,    ref: avgOCPos,    val: `${w.overcrowding_pct}%` },
  ];

  return (
    <div className="detail-panel">
      <button className="dp-close" onClick={onClose}>×</button>

      <div className="dp-hdr">
        <div className="dp-eyebrow">Housing profile</div>
        <div className="dp-title">{w.ward_name}</div>
        <div className="dp-rank-row">
          <div>
            <span className="dp-rank">#{w.housing_pressure_rank}</span>
            <span className="dp-rank-of"> of 68</span>
          </div>
          <span className="dp-decile-pill" style={{ background: color }}>
            Decile {w.housing_pressure_decile}
          </span>
        </div>
      </div>

      <div className="dp-section">
        <div className="dp-section-ttl">Affordability</div>
        <div className="dp-stats">
          <div className="dp-stat">
            <div className="dp-stat-val">£{w.median_house_price_k}k</div>
            <div className="dp-stat-lbl">Median house price</div>
            <div className="dp-stat-sub">city avg £{cityAvgPrice}k</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">{w.price_to_income}×</div>
            <div className="dp-stat-lbl">Price-to-income</div>
            <div className="dp-stat-sub">city avg {cityAvgPTI}× · earnings £{w.earnings}k</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">£{w.private_rent_pcm}</div>
            <div className="dp-stat-lbl">Median rent / month</div>
            <div className="dp-stat-sub">city avg £{cityAvgRent}</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">{w.rent_income_pct}%</div>
            <div className="dp-stat-lbl">Rent-to-income</div>
            <div className="dp-stat-sub">city avg {cityAvgRI}% · 30% = stress threshold</div>
          </div>
        </div>
      </div>

      <div className="dp-section">
        <div className="dp-section-ttl">Housing conditions</div>
        <div className="dp-stats">
          <div className="dp-stat">
            <div className="dp-stat-val">{w.overcrowding_pct}%</div>
            <div className="dp-stat-lbl">Households overcrowded</div>
            <div className="dp-stat-sub">city avg {cityAvgOC}%</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-val">{(w.imd_employment_score * 100).toFixed(1)}%</div>
            <div className="dp-stat-lbl">IMD employment score</div>
            <div className="dp-stat-sub">deprivation proxy · 0–100%</div>
          </div>
        </div>
      </div>

      <div className="dp-section">
        <div className="dp-section-ttl">Tenure mix</div>
        <div style={{ display: 'flex', height: 14, width: '100%', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${ownerW}%`, background: '#1a3a2a' }} />
          <div style={{ width: `${socialW}%`, background: '#7d4e36' }} />
          <div style={{ width: `${privateW}%`, background: '#2a3a4a' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span><span style={{ color: '#1a3a2a' }}>■</span> Owned {w.owner_occupation_pct}%</span>
          <span><span style={{ color: '#7d4e36' }}>■</span> Social {w.social_rented_pct}%</span>
          <span><span style={{ color: '#2a3a4a' }}>■</span> Private {w.private_rented_pct}%</span>
        </div>
      </div>

      <div className="dp-section">
        <div className="dp-section-ttl">Position vs Birmingham average</div>
        <div className="meter-row">
          {meters.map(m => (
            <div key={m.lbl} className="meter-item">
              <span className="meter-lbl">{m.lbl}</span>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${m.pos}%`, background: color }} />
                <div className="meter-ref" style={{ left: `${m.ref}%` }} />
              </div>
              <span className="meter-val">{m.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dp-section" style={{ borderBottom: 'none' }}>
        <div className="dp-section-ttl">Pressure composite</div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 2, fontFamily: 'var(--mono)' }}>
          Overcrowding × 0.45 = {(ocN * 0.45).toFixed(3)}<br />
          Rent:income × 0.35 = {(riN * 0.35).toFixed(3)}<br />
          Price:income × 0.20 = {(piN * 0.20).toFixed(3)}<br />
          <span style={{ borderTop: '1px solid var(--border)', display: 'block', paddingTop: 4, marginTop: 2 }}>
            Score = <b style={{ color: 'var(--ink)' }}>{w.housing_pressure_score.toFixed(3)}</b>
            {' → '}decile <b style={{ color }}>{w.housing_pressure_decile}</b>
          </span>
        </div>
      </div>

      <div className="dp-note">
        All figures are modelled estimates derived from IMD 2025, Census 2021 tenure
        profiles, and ward deprivation indices. Not suitable for individual property decisions.
        Source: Birmingham City Observatory · ONS Census 2021 · Land Registry (reference).
      </div>
    </div>
  );
}
