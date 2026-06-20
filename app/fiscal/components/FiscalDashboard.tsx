'use client';
import { useState, useMemo } from 'react';
import type { Ward, FiscalWard } from '@/lib/types';
import { buildFiscalWards } from '@/lib/synth-fiscal';
import DashboardHeader from '@/app/components/brand/DashboardHeader';
import SectionHeader from '@/app/components/brand/SectionHeader';
import DancettyDivider from '@/app/components/brand/DancettyDivider';
import CrestWatermark from '@/app/components/brand/CrestWatermark';

const COL = {
  surplus:   '#1a3a2a',
  surplusBg: 'rgba(26,58,42,0.07)',
  deficit:   '#3a1a1a',
  deficitBg: 'rgba(58,26,26,0.07)',
  revenue:   '#1a2a3a',
  services:  '#2a3a4a',
  gold:      '#efb700',
  line:      'rgba(14,15,17,0.10)',
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

const PROVENANCE: { layer: string; what: string; source: string; status: 'real' | 'modelled' | 'login' }[] = [
  { layer: 'Population',          what: 'Ward resident population, age split estimated by ward character', source: 'ONS mid-year estimates (real) · age split modelled', status: 'modelled' },
  { layer: 'Benefit caseloads',    what: 'UC, PIP/DLA/AA, State Pension, Pension Credit counts per ward', source: 'DWP Stat-Xplore (requires free API key)', status: 'login' },
  { layer: 'Benefit £ value',      what: 'Award amounts applied to caseloads; calibrated to DWP LA total', source: 'DWP Benefit Expenditure & Caseload Tables + Stat-Xplore', status: 'modelled' },
  { layer: 'Child Benefit',        what: 'Recipients and children covered', source: 'HMRC Child Benefit statistics', status: 'modelled' },
  { layer: 'Council Tax',          what: 'Properties by band × band charge', source: 'VOA band counts + BCC council-tax base', status: 'modelled' },
  { layer: 'Income Tax & NI',      what: 'Allocated to wards via ward earnings proxy', source: 'HMRC subnational statistics + Census / ASHE', status: 'modelled' },
  { layer: 'VAT & duties',         what: 'Allocated via consumption proxy', source: 'ONS regional indirect tax + modelled split', status: 'modelled' },
  { layer: 'Health & care',        what: "Allocated via ward age profile + deprivation", source: 'NHS ICB allocations + HM Treasury CRA', status: 'modelled' },
  { layer: 'Education',            what: 'Allocated via number of school-age children', source: 'DfE school census', status: 'modelled' },
  { layer: 'Regional reconciliation', what: "Sum of all ward balances tied to West Midlands total", source: 'ONS Country & Regional Public Sector Finances', status: 'modelled' },
];

const STATUS_META: Record<'real' | 'modelled' | 'login', { label: string; color: string }> = {
  real:     { label: 'Live source',             color: '#1a3a2a' },
  modelled: { label: 'Modelled estimate',       color: '#8a6a2e' },
  login:    { label: 'Behind login — awaiting', color: '#3a1a1a' },
};

function gbp(n: number): string {
  return (n < 0 ? '−' : '') + '£' + Math.abs(Math.round(n)).toLocaleString('en-GB');
}
function gbpK(n: number): string {
  return (n < 0 ? '−' : '') + '£' + (Math.abs(n) / 1000).toFixed(1) + 'k';
}

function StatusDot({ status }: { status: 'real' | 'modelled' | 'login' }) {
  const m = STATUS_META[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: m.color, fontWeight: 600, fontFamily: 'var(--mono)' }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: m.color, display: 'inline-block', flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function BalanceBars({ data, selected, onSelect }: { data: FiscalWard[]; selected: string | null; onSelect: (code: string) => void }) {
  const nets = data.map(w => w.net);
  const gMin = Math.min(0, ...nets);
  const gMax = Math.max(0, ...nets);
  const range = gMax - gMin || 1;
  const pct = (x: number) => ((x - gMin) / range) * 100;
  const zero = pct(0);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {data.map(w => {
          const isSel = w.ward_code === selected;
          const pos = w.net >= 0;
          const left = pos ? zero : pct(w.net);
          const width = Math.max(0.4, pos ? pct(w.net) - zero : zero - pct(w.net));
          return (
            <button
              key={w.ward_code}
              onClick={() => onSelect(w.ward_code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '3px 4px',
                background: isSel ? 'rgba(26,42,58,0.07)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <span
                title={w.ward_name}
                style={{
                  width: 142, flexShrink: 0, fontSize: 11, lineHeight: 1.15,
                  color: isSel ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: isSel ? 700 : 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontFamily: 'var(--mono)',
                }}
              >
                {w.ward_name}
              </span>
              <span style={{ position: 'relative', flex: 1, height: 14 }}>
                <span style={{ position: 'absolute', left: `${zero}%`, top: -2, bottom: -2, width: 1.5, background: COL.gold, opacity: 0.65 }} />
                <span
                  className="bw-bar"
                  style={{
                    position: 'absolute', top: 2, bottom: 2,
                    left: `${left}%`, width: `${width}%`,
                    background: pos ? COL.surplus : COL.deficit,
                    opacity: isSel ? 1 : 0.8, borderRadius: 1,
                  }}
                />
              </span>
              <span style={{ width: 58, flexShrink: 0, textAlign: 'right', fontSize: 11.5, fontFamily: 'var(--mono)', fontWeight: 600, color: pos ? COL.surplus : COL.deficit }}>
                {gbpK(w.net)}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingLeft: 150, paddingRight: 66, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
        <span>{gbpK(gMin)}</span>
        <span style={{ color: COL.gold }}>£0</span>
        <span>{gbpK(gMax)}</span>
      </div>
    </div>
  );
}

function BenefitBreakdown({ ward }: { ward: FiscalWard }) {
  const rows = BEN.map(b => ({ ...b, value: ward.benefits[b.key] })).sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map(r => r.value)) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(r => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 160, flexShrink: 0, fontSize: 11, color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: r.color, marginRight: 6 }} />
            {r.label}
          </span>
          <span style={{ position: 'relative', flex: 1, height: 14, background: 'rgba(14,15,17,0.05)', borderRadius: 2 }}>
            <span className="bw-bar" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(r.value / max) * 100}%`, background: r.color, borderRadius: 2 }} />
          </span>
          <span style={{ width: 56, textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--ink)' }}>{gbp(r.value)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${COL.line}` }}>
        <span style={{ width: 160, flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--ink)' }}>Total benefit spend</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 56, textAlign: 'right', fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--ink)' }}>{gbp(ward.benefitPerHead)}</span>
      </div>
    </div>
  );
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
    { label: 'Revenue raised',          sign: '+',                       value: R,             from: 0,                 to: R,            color: COL.revenue,  bold: false },
    { label: 'Less: benefit payments',  sign: '−',                  value: B,             from: R - B,             to: R,            color: COL.deficit,  bold: false },
    { label: 'Less: service spend',     sign: '−',                  value: S,             from: net,               to: R - B,        color: COL.services, bold: false },
    { label: 'Net fiscal balance',      sign: net >= 0 ? '+' : '−', value: Math.abs(net), from: Math.min(0, net), to: Math.max(0, net), color: net >= 0 ? COL.surplus : COL.deficit, bold: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 160, flexShrink: 0, fontSize: 11.5, color: r.bold ? 'var(--ink)' : 'var(--muted)', fontWeight: r.bold ? 700 : 500 }}>
            {r.label}
          </span>
          <span style={{ position: 'relative', flex: 1, height: r.bold ? 22 : 16 }}>
            <span style={{ position: 'absolute', left: `${pct(0)}%`, top: -3, bottom: -3, width: 1, borderLeft: `1px dashed ${COL.gold}`, opacity: 0.6 }} />
            <span
              className="bw-bar"
              style={{ position: 'absolute', top: 1, bottom: 1, left: `${pct(r.from)}%`, width: `${Math.max(0.4, pct(r.to) - pct(r.from))}%`, background: r.color, opacity: r.bold ? 1 : 0.85, borderRadius: 2 }}
            />
          </span>
          <span style={{ width: 72, textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)', fontWeight: r.bold ? 700 : 600, color: r.color }}>
            {r.sign}{gbp(r.value)}
          </span>
        </div>
      ))}
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
          <div key={s.k} className="bw-bar" style={{ width: `${s.v}%`, background: s.color }} title={`${s.label} ${s.v}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
        {segs.map(s => (
          <span key={s.k} style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 5 }} />
            {s.label} <strong style={{ color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{s.v}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FiscalDashboard({ wards }: { wards: Ward[] }) {
  const fiscalWards = useMemo(() => buildFiscalWards(wards), [wards]);
  const sorted = useMemo(() => [...fiscalWards].sort((a, b) => a.net - b.net), [fiscalWards]);

  const [selected, setSelected] = useState<string | null>(() => sorted[0]?.ward_code ?? null);

  const ward = useMemo(
    () => fiscalWards.find(w => w.ward_code === selected) ?? fiscalWards[0] ?? null,
    [fiscalWards, selected]
  );

  const totalPop = fiscalWards.reduce((s, w) => s + w.population, 0);
  const avgBenefits = Math.round(fiscalWards.reduce((s, w) => s + w.benefitPerHead * w.population, 0) / totalPop);
  const avgRevenue  = Math.round(fiscalWards.reduce((s, w) => s + w.revenuePerHead  * w.population, 0) / totalPop);
  const avgNet      = totalPop > 0 ? fiscalWards.reduce((s, w) => s + w.net * w.population, 0) / totalPop : 0;
  const contributors = fiscalWards.filter(w => w.net >= 0);
  const biggestContributor = [...fiscalWards].sort((a, b) => b.net - a.net)[0];
  const biggestDeficit     = sorted[0];

  if (!ward) return null;

  const isContributor = ward.net >= 0;
  const ucShare = Math.round((ward.benefits.universalCredit / ward.benefitPerHead) * 100);
  const spShare = Math.round((ward.benefits.statePension    / ward.benefitPerHead) * 100);

  return (
    <div className="panel-body bw-fiscal" style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
      <style>{`
        .bw-fiscal .bw-bar { transition: width 480ms cubic-bezier(.22,.61,.36,1), left 480ms cubic-bezier(.22,.61,.36,1); }
        @media (prefers-reduced-motion: reduce) { .bw-fiscal .bw-bar { transition: none !important; } }
        @media (min-width: 900px) {
          .bw-fiscal-grid  { grid-template-columns: 5fr 7fr !important; }
          .bw-fiscal-grid2 { grid-template-columns: 1fr 1fr !important; }
          .bw-fiscal-stats { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      {/* Brand header */}
      <DashboardHeader
        eyebrow="Birmingham · Fiscal Balance"
        title="Who pays in, who draws down"
        subtitle={`A ward-by-ward estimate of revenue raised against benefits and public services, showing the net fiscal position per head across all ${fiscalWards.length} Birmingham wards.`}
      />

      {/* Stat bar */}
      <div className="stat-bar">
        <div className="stat-bar-item">
          <div className="sb-val">{gbp(avgBenefits)}</div>
          <div className="sb-lbl">City avg benefit spend</div>
          <div className="sb-sub">per head · modelled</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val">{gbp(avgRevenue)}</div>
          <div className="sb-lbl">City avg revenue</div>
          <div className="sb-sub">per head · modelled</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val">{contributors.length}<span style={{ fontSize: 14, fontWeight: 400 }}>/{fiscalWards.length}</span></div>
          <div className="sb-lbl">Net contributor wards</div>
          <div className="sb-sub">fiscal surplus estimated</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val" style={{ fontSize: 13 }}>{biggestContributor?.ward_name}</div>
          <div className="sb-lbl">Top contributor</div>
          <div className="sb-sub">{gbp(biggestContributor?.net ?? 0)}/head surplus</div>
        </div>
        <div className="stat-bar-item stat-bar-sep">
          <div className="sb-val" style={{ fontSize: 13 }}>{biggestDeficit?.ward_name}</div>
          <div className="sb-lbl">Largest deficit</div>
          <div className="sb-sub">{gbp(Math.abs(biggestDeficit?.net ?? 0))}/head</div>
        </div>
      </div>

      <div style={{ padding: '0 18px 18px' }}>

        {/* DEMO banner */}
        <div style={{ margin: '14px 0 12px', padding: '10px 14px', background: 'rgba(239,183,0,0.08)', border: '1px solid rgba(239,183,0,0.4)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#9a7a00', fontSize: 11, flexShrink: 0, paddingTop: 1, letterSpacing: '.08em' }}>DEMO</span>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--ink)' }}>All £ figures are modelled estimates</strong> — synthesised from ward earnings, deprivation scores and demographic profiles, not official statistics. They show how the model behaves, not a real result. Wiring DWP Stat-Xplore, HMRC and ONS sources (see provenance table below) would replace these with real ward-level figures.
          </p>
        </div>

        {/* Ward selector */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <label htmlFor="fiscal-wardpick" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Ward</label>
          <select
            id="fiscal-wardpick"
            value={selected ?? ''}
            onChange={e => setSelected(e.target.value)}
            style={{ fontSize: 12.5, padding: '6px 10px', border: '1px solid rgba(14,15,17,0.15)', background: 'var(--surface)', color: 'var(--ink)', minWidth: 230, fontFamily: 'var(--mono)', fontWeight: 600 }}
          >
            {[...fiscalWards].sort((a, b) => a.ward_name.localeCompare(b.ward_name)).map(w => (
              <option key={w.ward_code} value={w.ward_code}>{w.ward_name}</option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>or click any bar →</span>
        </div>

        {/* Main 2-col grid */}
        <div className="bw-fiscal-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', alignItems: 'start' }}>

          {/* Left: all wards bars */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius)', padding: 14 }}>
            <SectionHeader eyebrow="All wards · ranked" title="Net fiscal balance per head" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
              <span style={{ color: COL.deficit, fontWeight: 700 }}>● In the red</span> = net recipient ·{' '}
              <span style={{ color: COL.surplus, fontWeight: 700 }}>● In the black</span> = net contributor
            </p>
            <div style={{ maxHeight: 700, overflowY: 'auto' }}>
              <BalanceBars data={sorted} selected={selected} onSelect={setSelected} />
            </div>
            <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5, paddingTop: 10, borderTop: `1px solid ${COL.line}` }}>
              Population-weighted city average: <strong style={{ color: avgNet >= 0 ? COL.surplus : COL.deficit, fontFamily: 'var(--mono)' }}>{gbp(avgNet)}</strong>/head.
              In the full model this ties to the published ONS West Midlands figure. Figures are modelled estimates.
            </p>
          </div>

          {/* Right: ward detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Headline net + badge */}
            <div style={{ background: isContributor ? COL.surplusBg : COL.deficitBg, border: `1px solid ${isContributor ? 'rgba(26,58,42,0.18)' : 'rgba(58,26,26,0.18)'}`, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, fontFamily: 'var(--mono)', marginBottom: 2 }}>{ward.ward_name}</div>
                  <div style={{ fontSize: 36, fontFamily: 'var(--mono)', fontWeight: 700, color: isContributor ? COL.surplus : COL.deficit, lineHeight: 1.05 }}>
                    {gbp(ward.net)}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}> /head</span>
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: isContributor ? COL.surplus : COL.deficit, padding: '5px 12px', whiteSpace: 'nowrap' }}>
                  {isContributor ? 'Net contributor' : 'Net recipient'}
                </span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="bw-fiscal-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { label: 'Population',     value: ward.population.toLocaleString('en-GB'), color: undefined },
                { label: 'Benefits / head', value: gbp(ward.benefitPerHead), color: COL.deficit },
                { label: 'Revenue / head',  value: gbp(ward.revenuePerHead), color: COL.revenue },
                { label: 'Services / head', value: gbp(ward.servicePerHead), color: COL.services },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 17, fontFamily: 'var(--mono)', fontWeight: 700, color: s.color ?? 'var(--ink)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Bridge waterfall */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius)', padding: 14 }}>
              <SectionHeader eyebrow={ward.ward_name} title="How the net position is built" subtitle="Per head, per year · dashed line marks £0" size={14} />
              <Bridge ward={ward} />
            </div>
          </div>
        </div>

        {/* Second row: breakdown + age */}
        <div className="bw-fiscal-grid2" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', marginTop: 16 }}>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius)', padding: 14 }}>
            <SectionHeader eyebrow={ward.ward_name} title="Benefit spend by type" size={14} />
            <BenefitBreakdown ward={ward} />
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius)', padding: 14 }}>
            <SectionHeader eyebrow={ward.ward_name} title="Age structure & what's driving the result" size={14} />
            <AgeBar ward={ward} />
            <p style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.6, marginTop: 14, marginBottom: 10 }}>{ward.driver}</p>
            <div style={{ background: 'rgba(14,15,17,0.04)', padding: '10px 12px', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              Of this ward&rsquo;s benefit spend,{' '}
              <strong style={{ color: '#2B4A6F', fontFamily: 'var(--mono)' }}>{ucShare}%</strong> is Universal Credit and{' '}
              <strong style={{ color: '#5C7A99', fontFamily: 'var(--mono)' }}>{spShare}%</strong> is State Pension — a quick read on whether the position is driven by working-age need or by an older population.
            </div>
          </div>
        </div>

        {/* Interpretation callout */}
        <DancettyDivider style={{ marginTop: 22, marginBottom: 16 }} />
        <div style={{ position: 'relative', overflow: 'hidden', padding: '18px 20px', background: 'var(--herald-navy)', color: '#e7eaef' }}>
          <CrestWatermark width={220} opacity={0.07} style={{ bottom: -28, right: -24 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionHeader tone="dark" eyebrow="How to read this" title="Before drawing conclusions" size={16} />
          <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: '#c5ccd6' }}>
            A &ldquo;net recipient&rdquo; ward is usually telling you about its <strong style={{ color: '#fff' }}>age structure and economic base, not the character of its residents</strong>. In the official ONS data, about{' '}
            <strong style={{ color: '#fff' }}>89% of retired people</strong> live in net-recipient households versus around{' '}
            <strong style={{ color: '#fff' }}>46% of non-retired people</strong> — almost everyone is a net recipient as a child and in retirement, and a net contributor during working life. The State Pension, the single largest transfer, goes to people who paid in across a full career — it should never be read as a &ldquo;loss.&rdquo; Because Income Tax, NI and VAT can only be split to ward level by modelling, the revenue figures here are estimates, not official statistics.
          </p>
          </div>
        </div>

        {/* Provenance table */}
        <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius)', padding: 14, overflowX: 'auto' }}>
          <SectionHeader
            eyebrow="Data lineage"
            title="Data sources & provenance"
            subtitle="Every layer of the calculation, and whether each input is a live source, a modelled estimate, or still behind a login."
          />
          <div style={{ minWidth: 600 }}>
            <div style={{ display: 'flex', gap: 10, padding: '0 0 8px', borderBottom: '2px solid var(--herald-gold)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
              <span style={{ width: 160, flexShrink: 0 }}>Layer</span>
              <span style={{ flex: 1.3 }}>What it provides</span>
              <span style={{ flex: 1.4 }}>Source</span>
              <span style={{ width: 160, flexShrink: 0 }}>Status</span>
            </div>
            {PROVENANCE.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(14,15,17,0.07)', fontSize: 11.5 }}>
                <span style={{ width: 160, flexShrink: 0, fontWeight: 600, color: 'var(--ink)' }}>{p.layer}</span>
                <span style={{ flex: 1.3, color: 'var(--muted)', lineHeight: 1.4 }}>{p.what}</span>
                <span style={{ flex: 1.4, color: 'var(--muted)', lineHeight: 1.4 }}>{p.source}</span>
                <span style={{ width: 160, flexShrink: 0 }}><StatusDot status={p.status} /></span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6, fontFamily: 'var(--mono)' }}>
          Prototype · All figures illustrative · Real sources: DWP Stat-Xplore · DWP Benefit Expenditure &amp; Caseload Tables · HMRC Child Benefit &amp; subnational tax statistics · ONS small-area population estimates · ONS Country &amp; Regional Public Sector Finances · VOA · Birmingham City Council
        </p>
      </div>
    </div>
  );
}
