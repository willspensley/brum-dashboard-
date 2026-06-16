import { hash01 } from './synth';
import type { Ward, FiscalWard } from './types';

const AGE_PROFILE: Record<string, { children: number; pension: number }> = {
  sutton:    { children: 18, pension: 27 },
  edgbaston: { children: 17, pension: 16 },
  city:      { children: 25, pension: 7 },
  manuf:     { children: 24, pension: 11 },
  outer:     { children: 21, pension: 16 },
};

const BEN_LABELS: Record<keyof FiscalWard['benefits'], string> = {
  universalCredit: 'Universal Credit',
  statePension: 'State Pension',
  disability: 'disability benefits (PIP/DLA)',
  childBenefit: 'Child Benefit',
  pensionCredit: 'Pension Credit',
  carers: "Carer's Allowance",
  councilTaxSupportOther: 'Council Tax Support',
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function wardDriver(w: Ward, f: FiscalWard): string {
  const topKey = (Object.keys(f.benefits) as (keyof FiscalWard['benefits'])[])
    .sort((a, b) => f.benefits[b] - f.benefits[a])[0];
  const topLabel = BEN_LABELS[topKey];
  const isContributor = f.net >= 0;

  if (f.age.pension > 22) {
    return `${w.ward_name} has an older-than-average population (${f.age.pension}% pension age). ${topLabel} is the largest spend component. ${isContributor ? 'Despite significant pension transfers, high earnings keep it a net contributor.' : 'Pension and care costs outweigh the local revenue base, though this reflects lifelong contribution, not current need.'}`;
  }
  if (f.age.children > 24) {
    return `${w.ward_name} has a young population (${f.age.children}% children) with high UC and Child Benefit spend. ${isContributor ? 'A growing workforce is strengthening the revenue base.' : 'Working-age deprivation and family support costs create a significant funding gap.'}`;
  }
  if (isContributor) {
    return `${w.ward_name} is a net contributor — earnings of £${w.earnings}k per head support strong Income Tax and NI receipts. ${topKey === 'statePension' ? 'Pension spend is present but more than offset by revenue.' : 'Benefit dependency is below the city average.'}`;
  }
  return `${w.ward_name} is a net recipient — ${topLabel} is the largest spend component. The revenue base is held down by lower earnings (£${w.earnings}k/head) and a ${w.claimant_rate}% out-of-work claimant rate.`;
}

export function buildFiscalWards(wards: Ward[]): FiscalWard[] {
  return wards.map(w => {
    const profile = AGE_PROFILE[w.char] ?? { children: 21, pension: 16 };

    const children = clamp(profile.children + Math.round((hash01(w.ward_code + 'ac') - 0.5) * 5), 10, 35);
    const pension  = clamp(profile.pension  + Math.round((hash01(w.ward_code + 'ap') - 0.5) * 5), 4, 34);
    const working  = Math.max(48, 100 - children - pension);
    const age = { children, working, pension };

    // Revenue per head: income tax + NI (earnings-driven), VAT, council tax
    const employed = clamp(0.28 + (1 - w.imd_norm) * 0.44, 0.24, 0.76);
    const incTaxNI = employed * w.earnings * 1000 * 0.28;
    const vat      = 1400 + (1 - w.imd_norm) * 1900;
    const ct       = 650 + (1 - w.imd_norm) * 1200;
    const revNoise = (hash01(w.ward_code + 'rev') - 0.5) * 700;
    const revenuePerHead = Math.round(Math.max(3200, incTaxNI + vat + ct + revNoise));

    // Benefits by type
    const totalUCRate = clamp((w.claimant_rate / 100) / 0.28, 0.04, 0.58);
    const universalCredit = Math.round(Math.max(280,
      totalUCRate * 11000 * 0.88 + (hash01(w.ward_code + 'uc') - 0.5) * 200));
    const statePension = Math.round((pension / 100) * 0.92 * 11500);
    const disability = Math.round(Math.max(180,
      200 + (w.inactivity_sick_pct / 100) * 3000 + (hash01(w.ward_code + 'dis') - 0.5) * 110));
    const childBenefit = Math.round(Math.max(70, (children / 100) * 1250 * 0.88));
    const pensionCredit = Math.round(Math.max(28, (pension / 100) * w.imd_norm * 900 + 38));
    const carers = Math.round(Math.max(18, 42 + w.ia_norm * 185 + (hash01(w.ward_code + 'ca') - 0.5) * 32));
    const councilTaxSupportOther = Math.round(Math.max(22, 52 + w.cc_norm * 240 + (hash01(w.ward_code + 'cts') - 0.5) * 32));

    const benefits = { universalCredit, statePension, disability, childBenefit, pensionCredit, carers, councilTaxSupportOther };
    const benefitPerHead = (Object.values(benefits) as number[]).reduce((s, v) => s + v, 0);

    // Service spend per head: health, education, social care
    const health     = 3100 + (pension / 100) * 7000 + w.ia_norm * 1400;
    const education  = (children / 100) * 8800;
    const socialCare = 280 + w.imd_norm * 580 + (pension / 100) * 2800;
    const svcNoise   = (hash01(w.ward_code + 'svc') - 0.5) * 280;
    const servicePerHead = Math.round(Math.max(6200, health + education + socialCare + svcNoise));

    const net = revenuePerHead - benefitPerHead - servicePerHead;

    const fiscalWard: FiscalWard = {
      ward_code: w.ward_code,
      ward_name: w.ward_name,
      population: w.population,
      age,
      benefits,
      benefitPerHead,
      revenuePerHead,
      servicePerHead,
      net,
      driver: '',
      provenance: { benefits: 'modelled', revenue: 'modelled', population: 'real' },
    };
    fiscalWard.driver = wardDriver(w, fiscalWard);
    return fiscalWard;
  });
}
