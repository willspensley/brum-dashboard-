import type { Ward } from './types';

export const RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

export const Q_COLORS: Record<string, string> = {
  prosperous: '#1a3a2a',
  workhorse:  '#2a1a3a',
  commuter:   '#1a2a3a',
  disadvantage: '#3a1a1a',
};

export const Q_LABELS: Record<string, string> = {
  prosperous:  'Productive & prosperous',
  workhorse:   'Economic workhorse',
  commuter:    'Commuter belt',
  disadvantage:'Compound disadvantage',
};

export const MUTED = '#6b6760';
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const CRIME_CATS: Record<string, string> = {
  'violent-crime': 'Violent Crime',
  'anti-social-behaviour': 'Anti-Social Behaviour',
  'public-order': 'Public Order',
  'vehicle-crime': 'Vehicle Crime',
  'burglary': 'Burglary',
  'criminal-damage-arson': 'Criminal Damage & Arson',
  'other-theft': 'Other Theft',
  'shoplifting': 'Shoplifting',
  'drugs': 'Drugs',
  'robbery': 'Robbery',
  'theft-from-the-person': 'Theft from Person',
  'possession-of-weapons': 'Weapons Possession',
  'bicycle-theft': 'Bicycle Theft',
  'other-crime': 'Other Crime',
};

export const CRIME_RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

export function dc(d: number): string {
  return RAMP[Math.max(0, Math.min(9, (d || 1) - 1))];
}

export function rankOf(wards: Ward[], w: Ward, key: keyof Ward, reverse: boolean): number {
  const sorted = [...wards].sort((a, b) =>
    reverse ? (b[key] as number) - (a[key] as number) : (a[key] as number) - (b[key] as number)
  );
  return sorted.findIndex(x => x.ward_code === w.ward_code) + 1;
}

export function quadrantNarrative(wards: Ward[], w: Ward): string {
  const gvaRank = rankOf(wards, w, 'gva', true);
  const depRank = rankOf(wards, w, 'imd_employment_score', true);
  const avgIMD = (wards.reduce((s, x) => s + x.imd_employment_score, 0) / wards.length * 100).toFixed(1);
  const x = w.gva.toFixed(1);
  const imd = (w.imd_employment_score * 100).toFixed(1);
  switch (w.quadrant) {
    case 'prosperous':
      return `${w.ward_name} generates high workplace GVA (£${x}k per head, ranked ${gvaRank} in Birmingham) and residents face below-average deprivation. Economic output is being captured as resident prosperity — higher wages, lower benefit dependency.`;
    case 'workhorse':
      return `${w.ward_name} is an economic workhorse — generating significant output (£${x}k GVA per head) but residents face above-average deprivation (score ${imd} vs city average ${avgIMD}). The gap between what this ward produces and what residents earn suggests low-wage employment or high in-commuter capture of economic value.`;
    case 'commuter':
      return `${w.ward_name} is a prosperous residential ward — residents face low deprivation (score ${imd}) but workplace GVA is below city average at £${x}k per head. Residents' economic contribution registers in other wards where they work.`;
    case 'disadvantage':
      return `${w.ward_name} faces compound disadvantage — low workplace output (£${x}k GVA, ranked ${gvaRank}) and high resident deprivation (score ${imd}, ranked ${depRank} most deprived). Both job creation and skills investment are needed simultaneously.`;
    default:
      return '';
  }
}
