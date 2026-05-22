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
