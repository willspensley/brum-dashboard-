import type { Ward } from './types';

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function normalise(wards: Ward[]): Ward[] {
  const maxI = Math.max(...wards.map(w => w.imd_employment_score));
  const minI = Math.min(...wards.map(w => w.imd_employment_score));
  const maxC = Math.max(...wards.map(w => w.claimant_rate));
  const minC = Math.min(...wards.map(w => w.claimant_rate));
  const maxA = Math.max(...wards.map(w => w.inactivity_sick_pct));
  const minA = Math.min(...wards.map(w => w.inactivity_sick_pct));

  wards.forEach(w => {
    w.imd_norm = maxI > minI ? (w.imd_employment_score - minI) / (maxI - minI) : 0;
    w.cc_norm  = maxC > minC ? (w.claimant_rate - minC) / (maxC - minC) : 0;
    w.ia_norm  = maxA > minA ? (w.inactivity_sick_pct - minA) / (maxA - minA) : 0;
    w.composite = w.imd_norm * 0.4 + w.cc_norm * 0.35 + w.ia_norm * 0.25;
  });

  const srt = [...wards].sort((a, b) => a.composite - b.composite);
  srt.forEach((w, i) => {
    w.composite_decile = Math.min(10, Math.ceil(((i + 1) / srt.length) * 10));
  });

  return wards;
}

export function assignQuadrants(wards: Ward[]): { gvaMed: number; depMed: number } {
  const gvaMed = median(wards.map(w => w.gva));
  const depMed = median(wards.map(w => w.imd_employment_score));
  wards.forEach(w => {
    if (w.gva >= gvaMed && w.imd_employment_score < depMed)       w.quadrant = 'prosperous';
    else if (w.gva >= gvaMed && w.imd_employment_score >= depMed) w.quadrant = 'workhorse';
    else if (w.gva < gvaMed && w.imd_employment_score < depMed)   w.quadrant = 'commuter';
    else                                                            w.quadrant = 'disadvantage';
  });
  return { gvaMed, depMed };
}
