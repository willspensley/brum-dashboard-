import type { Ward, WardExtras } from './types';

export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function synthEarnings(w: Ward): number {
  const noise = (hash01(w.ward_code + 'e') - 0.5) * 4;
  return Math.round(28 + (1 - w.imd_norm) * 18 + (1 - w.cc_norm) * 6 + noise);
}

export function synthPop(w: Pick<Ward, 'ward_code'>): number {
  return 9000 + Math.round(hash01(w.ward_code + 'p') * 8000);
}

export function synthGva(w: Pick<Ward, 'ward_code' | 'gva_band'>): number {
  const [lo, hi] = w.gva_band;
  return parseFloat((lo + hash01(w.ward_code + 'g') * (hi - lo)).toFixed(1));
}

export function synthCrimeRate(w: Pick<Ward, 'ward_code' | 'composite' | 'char'>): number {
  const seed = hash01(w.ward_code + 'cr');
  const base = 52 + w.composite * 60;
  const boost = ({ city: 38, manuf: 18, sutton: -22, outer: 0, edgbaston: 8 } as Record<string, number>)[w.char] ?? 0;
  const noise = (seed - 0.5) * 16;
  return parseFloat(Math.max(18, base + boost + noise).toFixed(1));
}

export function synthCrimeCategories(w: Pick<Ward, 'ward_code' | 'crime_rate_per_1000' | 'population' | 'char'>): Record<string, number> {
  const annualTotal = Math.round((w.crime_rate_per_1000 * w.population) / 1000);
  const isCentre = ['city', 'manuf'].includes(w.char);
  const baseProps: Record<string, number> = {
    'violent-crime': 0.22, 'anti-social-behaviour': 0.18, 'public-order': 0.09,
    'vehicle-crime': 0.10, 'burglary': 0.07, 'criminal-damage-arson': 0.08,
    'other-theft': 0.06, 'shoplifting': 0.06, 'drugs': 0.05, 'robbery': 0.03,
    'theft-from-the-person': 0.02, 'possession-of-weapons': 0.02,
    'bicycle-theft': 0.01, 'other-crime': 0.01,
  };
  const adj: Record<string, number> = {};
  Object.entries(baseProps).forEach(([cat, p]) => {
    let v = p;
    if (isCentre && ['violent-crime', 'robbery', 'theft-from-the-person', 'shoplifting', 'drugs'].includes(cat)) v *= 1.35;
    if (!isCentre && ['burglary', 'vehicle-crime', 'anti-social-behaviour', 'criminal-damage-arson'].includes(cat)) v *= 1.18;
    v *= (1 + (hash01(w.ward_code + cat) - 0.5) * 0.22);
    adj[cat] = v;
  });
  const sum = Object.values(adj).reduce((a, b) => a + b, 0);
  const counts: Record<string, number> = {};
  Object.entries(adj).forEach(([cat, p]) => { counts[cat] = Math.max(0, Math.round((p / sum) * annualTotal)); });
  return counts;
}

export function synthCrimeYoY(w: Pick<Ward, 'ward_code' | 'composite'>): number {
  const seed = hash01(w.ward_code + 'yoy');
  const struct = (w.composite - 0.5) * 7;
  const noise = (seed - 0.5) * 10;
  return parseFloat((struct + noise).toFixed(1));
}

export function synthCrimeTrend12m(w: Pick<Ward, 'ward_code' | 'crime_rate_per_1000' | 'population' | 'crime_yoy_pct'>): number[] {
  const monthlyAvg = (w.crime_rate_per_1000 * w.population / 1000) / 12;
  const yoy = w.crime_yoy_pct / 100;
  const seed = hash01(w.ward_code + 'ctr');
  const arr: number[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const trend = 1 + yoy * t - (yoy / 2);
    const noise = 1 + Math.sin(i * 7 + seed * 90) * 0.08;
    arr.push(Math.max(1, Math.round(monthlyAvg * trend * noise)));
  }
  return arr;
}

export function synthYouthClaimantRate(w: Pick<Ward, 'ward_code' | 'claimant_rate' | 'composite'>): number {
  const seed = hash01(w.ward_code + 'yc');
  // Young people are ~30–45% of claimants; share rises with deprivation
  const baseShare = 0.30 + w.composite * 0.15;
  const noise = (seed - 0.5) * 0.06;
  return parseFloat(Math.max(0.5, w.claimant_rate * (baseShare + noise)).toFixed(1));
}

export function extras(w: Ward): WardExtras {
  const s = w.composite;
  const seed = hash01(w.ward_code + 'x');
  const n = (a: number, b: number) =>
    parseFloat((a + (b - a) * s + (seed - 0.5) * (b - a) * 0.06).toFixed(1));
  return {
    youth_unemp: n(3.5, 24),
    uc_pct: n(5, 34),
    no_quals: n(3.5, 22),
    vacancies: parseFloat((n(1.5, 12) * (1 - s * 0.7) + 0.5).toFixed(1)),
  };
}
