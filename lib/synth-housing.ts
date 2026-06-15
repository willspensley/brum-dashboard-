import { hash01 } from './synth';
import type { Ward, HousingWard } from './types';

// Base price (£k) and rent (£/month) by ward character, before deprivation adjustment
const CHAR_PRICE: Record<string, number> = {
  sutton: 350, edgbaston: 330, city: 200, manuf: 178, outer: 195,
};
const CHAR_RENT: Record<string, number> = {
  sutton: 950, edgbaston: 895, city: 748, manuf: 695, outer: 738,
};

function norm(v: number, min: number, max: number): number {
  return max > min ? (v - min) / (max - min) : 0;
}

export function buildHousingWards(wards: Ward[]): HousingWard[] {
  const imdScores = wards.map(w => w.imd_employment_score);
  const minIMD = Math.min(...imdScores);
  const maxIMD = Math.max(...imdScores);

  const houses: HousingWard[] = wards.map(w => {
    const imdN = norm(w.imd_employment_score, minIMD, maxIMD);

    const pNoise  = (hash01(w.ward_code + 'hp') - 0.5) * 44;
    const rNoise  = (hash01(w.ward_code + 'rn') - 0.5) * 62;
    const oNoise  = (hash01(w.ward_code + 'oo') - 0.5) * 6;
    const sNoise  = (hash01(w.ward_code + 'sr') - 0.5) * 4;
    const cNoise  = (hash01(w.ward_code + 'oc') - 0.5) * 2.2;

    // House price: character base + prosperity uplift, floored at £148k
    const priceK = Math.round(Math.max(148,
      (CHAR_PRICE[w.char] ?? 195) + (1 - imdN) * 100 + pNoise
    ));

    // Private rent: character base + prosperity uplift, floored at £540/mo
    const rentPcm = Math.round(Math.max(540,
      (CHAR_RENT[w.char] ?? 738) + (1 - imdN) * 340 + rNoise
    ));

    const rentIncomePct = parseFloat(((rentPcm * 12) / (w.earnings * 1000) * 100).toFixed(1));
    const priceToIncome = parseFloat((priceK / w.earnings).toFixed(1));

    // Owner occupation: higher in affluent areas
    const ownerPct = parseFloat(Math.max(14, Math.min(88,
      75 - imdN * 44 + (w.char === 'sutton' ? 8 : 0) - (w.char === 'city' ? 7 : 0) + oNoise
    )).toFixed(1));

    // Social rented: higher in deprived/inner-city wards
    const socialPct = parseFloat(Math.max(2, Math.min(42,
      5 + imdN * 30 + (w.char === 'city' ? 5 : 0) - (w.char === 'sutton' ? 3 : 0) + sNoise
    )).toFixed(1));

    const privatePct = parseFloat(Math.max(5, 100 - ownerPct - socialPct).toFixed(1));

    // Overcrowding: strongest in deprived inner-city wards
    const overcrowdPct = parseFloat(Math.max(0.5,
      1.5 + imdN * 11.5 + (w.char === 'city' ? 2.2 : 0) + cNoise
    ).toFixed(1));

    return {
      ward_code: w.ward_code,
      ward_name: w.ward_name,
      median_house_price_k: priceK,
      price_to_income: priceToIncome,
      private_rent_pcm: rentPcm,
      rent_income_pct: rentIncomePct,
      owner_occupation_pct: ownerPct,
      social_rented_pct: socialPct,
      private_rented_pct: privatePct,
      overcrowding_pct: overcrowdPct,
      housing_pressure_score: 0,
      housing_pressure_decile: 1,
      housing_pressure_rank: 1,
      char: w.char,
      earnings: w.earnings,
      claimant_rate: w.claimant_rate,
      imd_employment_score: w.imd_employment_score,
    };
  });

  // Composite: overcrowding 45% + rent-to-income 35% + price-to-income 20%
  const ocRange  = { min: Math.min(...houses.map(h => h.overcrowding_pct)),   max: Math.max(...houses.map(h => h.overcrowding_pct)) };
  const riRange  = { min: Math.min(...houses.map(h => h.rent_income_pct)),    max: Math.max(...houses.map(h => h.rent_income_pct)) };
  const piRange  = { min: Math.min(...houses.map(h => h.price_to_income)),    max: Math.max(...houses.map(h => h.price_to_income)) };

  houses.forEach(h => {
    h.housing_pressure_score = parseFloat((
      norm(h.overcrowding_pct,  ocRange.min,  ocRange.max)  * 0.45 +
      norm(h.rent_income_pct,   riRange.min,  riRange.max)  * 0.35 +
      norm(h.price_to_income,   piRange.min,  piRange.max)  * 0.20
    ).toFixed(4));
  });

  // Decile: 1 = least pressure → 10 = most pressure
  const asc = [...houses].sort((a, b) => a.housing_pressure_score - b.housing_pressure_score);
  asc.forEach((h, i) => {
    h.housing_pressure_decile = Math.min(10, Math.ceil(((i + 1) / asc.length) * 10));
  });

  // Rank: 1 = most pressure
  const desc = [...houses].sort((a, b) => b.housing_pressure_score - a.housing_pressure_score);
  desc.forEach((h, i) => { h.housing_pressure_rank = i + 1; });

  return houses;
}

// Expose normalisation ranges so the detail panel can compute per-component breakdown
export function housingNorms(wards: HousingWard[]) {
  return {
    oc:  { min: Math.min(...wards.map(h => h.overcrowding_pct)),   max: Math.max(...wards.map(h => h.overcrowding_pct)) },
    ri:  { min: Math.min(...wards.map(h => h.rent_income_pct)),    max: Math.max(...wards.map(h => h.rent_income_pct)) },
    pi:  { min: Math.min(...wards.map(h => h.price_to_income)),    max: Math.max(...wards.map(h => h.price_to_income)) },
  };
}
