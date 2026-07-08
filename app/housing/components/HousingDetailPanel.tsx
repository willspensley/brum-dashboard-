'use client';
import type { HousingWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';
import Tip from '../../components/Tip';

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

  const ocN = normOf(w.overcrowding_pct, wards, 'overcrowding_pct');
  const riN = normOf(w.rent_income_pct,  wards, 'rent_income_pct');
  const piN = normOf(w.price_to_income,  wards, 'price_to_income');

  const pricePos    = normOf(w.median_house_price_k, wards, 'median_house_price_k') * 100;
  const avgPricePos = normOf(cityAvgPrice,           wards, 'median_house_price_k') * 100;
  const rentPos     = normOf(w.private_rent_pcm,     wards, 'private_rent_pcm')     * 100;
  const avgRentPos  = normOf(cityAvgRent,            wards, 'private_rent_pcm')     * 100;
  const ocPos       = normOf(w.overcrowding_pct,     wards, 'overcrowding_pct')     * 100;
  const avgOCPos    = normOf(parseFloat(cityAvgOC),  wards, 'overcrowding_pct')     * 100;

  const tenureTotal = w.owner_occupation_pct + w.social_rented_pct + w.private_rented_pct;
  const ownerW   = (w.owner_occupation_pct / tenureTotal) * 100;
  const socialW  = (w.social_rented_pct    / tenureTotal) * 100;
  const privateW = (w.private_rented_pct   / tenureTotal) * 100;

  const meters = [
    { lbl: 'House price', pos: pricePos, ref: avgPricePos, val: `£${w.median_house_price_k}k` },
    { lbl: 'Monthly rent', pos: rentPos, ref: avgRentPos, val: `£${w.private_rent_pcm}` },
    { lbl: 'Overcrowding', pos: ocPos,   ref: avgOCPos,   val: `${w.overcrowding_pct}%` },
  ];

  return (
    <div>
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{w.ward_name}</div>
            <div className="d-sub">{w.ward_code} · pressure decile {w.housing_pressure_decile}/10 · rank #{w.housing_pressure_rank}/68</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="q-banner" style={{ borderColor: color, background: color + '0d' }}>
          <div className="q-banner-txt">
            Housing pressure decile <strong>{w.housing_pressure_decile}/10</strong> — a modelled composite of overcrowding, rent-to-income and price-to-income. Not an official measure.
          </div>
        </div>

        <div className="d-chips">
          <Tip text="Median home sale price in the ward (£, thousands). 'avg' is the Birmingham median. Modelled from Land Registry and Census tenure profiles.">
            <div className="d-chip">
              <div className="d-chip-lbl">House price</div>
              <div className="d-chip-val">£{w.median_house_price_k}k</div>
              <div className="d-chip-sub">avg £{cityAvgPrice}k</div>
            </div>
          </Tip>
          <Tip text="Median house price divided by median resident income — roughly how many years of income it takes to buy a home. Higher = less affordable; around 5× is widely seen as stretched.">
            <div className="d-chip">
              <div className="d-chip-lbl">Price to income</div>
              <div className="d-chip-val">{w.price_to_income}×</div>
              <div className="d-chip-sub">avg {cityAvgPTI}×</div>
            </div>
          </Tip>
          <Tip text="Typical private monthly rent (£) for the ward. 'avg' is the Birmingham mean. Modelled estimate.">
            <div className="d-chip">
              <div className="d-chip-lbl">Rent / month</div>
              <div className="d-chip-val">£{w.private_rent_pcm}</div>
              <div className="d-chip-sub">avg £{cityAvgRent}</div>
            </div>
          </Tip>
          <Tip text="Share of a typical renter's income spent on rent. Above ~30% is widely considered unaffordable ('rent stress'). 'avg' is the Birmingham mean.">
            <div className="d-chip">
              <div className="d-chip-lbl">Rent to income</div>
              <div className="d-chip-val" style={{ color: w.rent_income_pct > 30 ? 'var(--herald-red)' : undefined }}>{w.rent_income_pct}%</div>
              <div className="d-chip-sub">avg {cityAvgRI}% · 30% stress</div>
            </div>
          </Tip>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">Housing conditions</div>
        <div className="extra-metrics">
          <div className="em-card">
            <div className="em-lbl">Overcrowded</div>
            <div className="em-val">{w.overcrowding_pct}%</div>
            <div className="em-sub">city avg {cityAvgOC}%</div>
          </div>
          <div className="em-card">
            <div className="em-lbl">IMD employment</div>
            <div className="em-val">{(w.imd_employment_score * 100).toFixed(1)}%</div>
            <div className="em-sub">deprivation proxy</div>
          </div>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">Tenure mix</div>
        <div style={{ display: 'flex', height: 14, width: '100%', overflow: 'hidden', marginBottom: 8, borderRadius: 'var(--radius)' }}>
          <div style={{ width: `${ownerW}%`, background: 'var(--q-prosp)' }} />
          <div style={{ width: `${socialW}%`, background: 'var(--herald-blue)' }} />
          <div style={{ width: `${privateW}%`, background: 'var(--muted2)' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span><span style={{ color: 'var(--q-prosp)' }}>■</span> Owned {w.owner_occupation_pct}%</span>
          <span><span style={{ color: 'var(--herald-blue)' }}>■</span> Social {w.social_rented_pct}%</span>
          <span><span style={{ color: 'var(--muted2)' }}>■</span> Private {w.private_rented_pct}%</span>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">Position vs Birmingham average</div>
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
        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 8 }}>
          Vertical line = Birmingham average.
        </div>
      </div>

      <div className="d-sec" style={{ borderBottom: 'none' }}>
        <div className="d-sec-ttl">Pressure composite <span className="d-modelled">(modelled)</span></div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 2, fontFamily: 'var(--mono)' }}>
          Overcrowding × 0.45 = {(ocN * 0.45).toFixed(3)}<br />
          Rent:income × 0.35 = {(riN * 0.35).toFixed(3)}<br />
          Price:income × 0.20 = {(piN * 0.20).toFixed(3)}<br />
          <span style={{ borderTop: '1px solid var(--border)', display: 'block', paddingTop: 4, marginTop: 2 }}>
            Score = <b style={{ color: 'var(--ink)' }}>{w.housing_pressure_score.toFixed(3)}</b>
            {' → '}decile <b style={{ color }}>{w.housing_pressure_decile}</b>
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'var(--sans)', margin: '10px 0 0' }}>
          All figures are modelled estimates derived from IMD 2025, Census 2021 tenure profiles and ward
          deprivation indices. Not suitable for individual property decisions.
        </p>
      </div>
    </div>
  );
}
