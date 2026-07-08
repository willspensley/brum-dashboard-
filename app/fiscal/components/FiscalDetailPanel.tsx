'use client';
import type { FiscalWard } from '@/lib/types';
import Tip from '../../components/Tip';

const COL = {
  surplus:  '#1a3a2a',
  deficit:  '#3a1a1a',
  revenue:  '#1a2a3a',
  services: '#2a3a4a',
  gold:     '#efb700',
  line:     'rgba(14,15,17,0.10)',
};

const BEN = [
  { key: 'universalCredit',         label: 'Universal Credit',            color: '#2B4A6F' },
  { key: 'statePension',            label: 'State Pension',               color: '#5C7A99' },
  { key: 'disability',              label: 'Disability (PIP / DLA / AA)', color: '#3E7C77' },
  { key: 'childBenefit',            label: 'Child Benefit',               color: '#8a6a2e' },
  { key: 'pensionCredit',           label: 'Pension Credit',              color: '#7a8270' },
  { key: 'carers',                  label: "Carer's Allowance",           color: '#5a6e5a' },
  { key: 'councilTaxSupportOther',  label: 'Council Tax Support & other', color: '#999090' },
] as const;

function gbp(n: number): string {
  return (n < 0 ? '−' : '') + '£' + Math.abs(Math.round(n)).toLocaleString('en-GB');
}

function Bridge({ ward }: { ward: FiscalWard }) {
  const R = ward.revenuePerHead;
  const B = ward.benefitPerHead;
  const S = ward.servicePerHead;
  const net = ward.net;
  const sMin = Math.min(0, net);
  const sMax = R;
  const range = sMax - sMin || 1;
  const pct = (v: number) => ((v - sMin) / range) * 100;
  const rows = [
    { label: 'Revenue raised',         sign: '+',                  value: R,             from: 0,                to: R,                color: COL.revenue,  bold: false },
    { label: 'Less: benefit payments', sign: '−',                  value: B,             from: R - B,            to: R,                color: COL.deficit,  bold: false },
    { label: 'Less: service spend',    sign: '−',                  value: S,             from: net,              to: R - B,            color: COL.services, bold: false },
    { label: 'Net fiscal balance',     sign: net >= 0 ? '+' : '−', value: Math.abs(net), from: Math.min(0, net), to: Math.max(0, net), color: net >= 0 ? COL.surplus : COL.deficit, bold: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 124, flexShrink: 0, fontSize: 11, color: r.bold ? 'var(--ink)' : 'var(--muted)', fontWeight: r.bold ? 700 : 500, lineHeight: 1.2 }}>
            {r.label}
          </span>
          <span style={{ position: 'relative', flex: 1, height: r.bold ? 22 : 16 }}>
            <span style={{ position: 'absolute', left: `${pct(0)}%`, top: -3, bottom: -3, width: 1, borderLeft: `1px dashed ${COL.gold}`, opacity: 0.6 }} />
            <span style={{ position: 'absolute', top: 1, bottom: 1, left: `${pct(r.from)}%`, width: `${Math.max(0.4, pct(r.to) - pct(r.from))}%`, background: r.color, opacity: r.bold ? 1 : 0.85, borderRadius: 2 }} />
          </span>
          <span style={{ width: 64, textAlign: 'right', fontSize: 11.5, fontFamily: 'var(--mono)', fontWeight: r.bold ? 700 : 600, color: r.color }}>
            {r.sign}{gbp(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function BenefitBreakdown({ ward }: { ward: FiscalWard }) {
  const rows = BEN.map(b => ({ ...b, value: ward.benefits[b.key] })).sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map(r => r.value)) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(r => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 132, flexShrink: 0, fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.2 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: r.color, marginRight: 6 }} />
            {r.label}
          </span>
          <span style={{ position: 'relative', flex: 1, height: 14, background: 'var(--paper2)', borderRadius: 2 }}>
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(r.value / max) * 100}%`, background: r.color, borderRadius: 2 }} />
          </span>
          <span style={{ width: 50, textAlign: 'right', fontSize: 11.5, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--ink)' }}>{gbp(r.value)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${COL.line}` }}>
        <span style={{ width: 132, flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Total benefit spend</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 50, textAlign: 'right', fontSize: 12.5, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--ink)' }}>{gbp(ward.benefitPerHead)}</span>
      </div>
    </div>
  );
}

function AgeBar({ ward }: { ward: FiscalWard }) {
  const segs = [
    { k: 'children', label: 'Children',    color: '#8a6a2e', v: ward.age.children },
    { k: 'working',  label: 'Working age', color: '#2B4A6F', v: ward.age.working },
    { k: 'pension',  label: 'Pension age', color: '#5C7A99', v: ward.age.pension },
  ];
  return (
    <div>
      <div style={{ display: 'flex', width: '100%', overflow: 'hidden', height: 20, borderRadius: 2, border: `1px solid ${COL.line}` }}>
        {segs.map(s => (
          <div key={s.k} style={{ width: `${s.v}%`, background: s.color }} title={`${s.label} ${s.v}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {segs.map(s => (
          <span key={s.k} style={{ fontSize: 11, color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 5 }} />
            {s.label} <strong style={{ color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{s.v}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FiscalDetailPanel({ ward: w, onClose }: { ward: FiscalWard; wards: FiscalWard[]; onClose: () => void }) {
  const isContributor = w.net >= 0;
  const netCol = isContributor ? COL.surplus : COL.deficit;
  const ucShare = Math.round((w.benefits.universalCredit / w.benefitPerHead) * 100);
  const spShare = Math.round((w.benefits.statePension / w.benefitPerHead) * 100);

  return (
    <div>
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{w.ward_name}</div>
            <div className="d-sub">{w.ward_code} · Pop {w.population.toLocaleString('en-GB')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="q-banner" style={{ borderColor: netCol, background: netCol + '0d' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 30, fontFamily: 'var(--mono)', fontWeight: 700, color: netCol, lineHeight: 1 }}>
              {gbp(w.net)}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}> /head</span>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: netCol, padding: '4px 10px', whiteSpace: 'nowrap' }}>
              {isContributor ? 'Net contributor' : 'Net recipient'}
            </span>
          </div>
        </div>

        <div className="d-chips">
          <Tip text="Modelled annual benefit & welfare spend per resident — Universal Credit, State Pension, disability, Child Benefit and more. A modelled estimate, not an official figure.">
            <div className="d-chip">
              <div className="d-chip-lbl">Benefits / head</div>
              <div className="d-chip-val" style={{ color: COL.deficit }}>{gbp(w.benefitPerHead)}</div>
            </div>
          </Tip>
          <Tip text="Modelled tax & revenue raised per resident — income tax, National Insurance, council tax and a share of VAT. What the ward contributes to the public purse.">
            <div className="d-chip">
              <div className="d-chip-lbl">Revenue / head</div>
              <div className="d-chip-val" style={{ color: COL.revenue }}>{gbp(w.revenuePerHead)}</div>
            </div>
          </Tip>
          <Tip text="Modelled cost of public services consumed per resident — NHS, schools and local services. A modelled estimate.">
            <div className="d-chip">
              <div className="d-chip-lbl">Services / head</div>
              <div className="d-chip-val" style={{ color: COL.services }}>{gbp(w.servicePerHead)}</div>
            </div>
          </Tip>
          <Tip text="Resident population of the ward (Census 2021 base), used to express every figure on a per-head basis.">
            <div className="d-chip">
              <div className="d-chip-lbl">Population</div>
              <div className="d-chip-val">{w.population.toLocaleString('en-GB')}</div>
            </div>
          </Tip>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">How the net position is built</div>
        <Bridge ward={w} />
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">Benefit spend by type <span className="d-modelled">(modelled)</span></div>
        <BenefitBreakdown ward={w} />
      </div>

      <div className="d-sec" style={{ borderBottom: 'none' }}>
        <div className="d-sec-ttl">Age structure &amp; drivers</div>
        <AgeBar ward={w} />
        <p style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.6, margin: '14px 0 10px' }}>{w.driver}</p>
        <div style={{ background: 'var(--paper2)', padding: '10px 12px', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Of this ward&rsquo;s benefit spend,{' '}
          <strong style={{ color: '#2B4A6F', fontFamily: 'var(--mono)' }}>{ucShare}%</strong> is Universal Credit and{' '}
          <strong style={{ color: '#5C7A99', fontFamily: 'var(--mono)' }}>{spShare}%</strong> is State Pension — a quick read on whether the position is driven by working-age need or by an older population.
        </div>
      </div>
    </div>
  );
}
