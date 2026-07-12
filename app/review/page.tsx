'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import BenefitsDashboard from '../benefits/components/BenefitsDashboard';
import UcEmpDashboard from '../uc-employment/components/UcEmpDashboard';
import HousingBenefitView from '../housing-benefit/components/HousingBenefitView';
import ClaimantDashboard from '../claimant-count/components/ClaimantDashboard';
import UcCombinedDashboard from '../uc-combined/components/UcCombinedDashboard';
import BenefitsBillView from '../benefits-bill/components/BenefitsBillView';
import TwoChildView from '../two-child/components/TwoChildView';
import ChildPovertyDashboard from '../child-poverty/components/ChildPovertyDashboard';
import ConMoneyDashboard from '../constituency-money/components/ConMoneyDashboard';
import PipDashboard from '../pip/components/PipDashboard';

// ── Review ────────────────────────────────────────────────────────────────────
// Renders the SAME dashboard component the Dashboards tab uses, fed the candidate
// data from each proposal — so what you sign off here is byte-for-byte what lands
// in Dashboards. Accept promotes it (writes public/data/<id>.json); no rebuild.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Proposal = { id: string; status: 'pending' | 'accepted' | 'rejected'; title: string; rejected_reason?: string; source: { as_of: string }; sources?: any[]; validation: any; wards: any[]; areas?: any[]; benchmarks?: any; geography?: string; metric?: string; months?: string[]; years?: string[]; city?: any; lines?: any[]; constituencies?: any[]; year?: string; total_m?: number; per_head?: number | null; population?: number | null; child_element_month?: number; history?: any[]; benefit_labels?: any; uc_years?: string[]; categories?: any[]; conditions?: any[]; gb_total_real_latest?: number; gb_total_nominal_latest?: number; birmingham_pip_m?: number | null };

// One entry per dataset — maps a proposal to its dashboard component + a summary line.
const REGISTRY: Record<string, { label: string; summary: (p: Proposal) => string; render: (p: Proposal) => ReactNode }> = {
  'uc-wards': {
    label: 'Universal Credit',
    summary: p => `${p.validation.wards_found}/69 wards · ${p.validation.city_pct}% city-wide · ${p.validation.total_claimants?.toLocaleString()} claimants`,
    render: p => <BenefitsDashboard data={{ as_of: p.source.as_of, city_pct: p.validation.city_pct, total_claimants: p.validation.total_claimants, total_population: p.validation.total_population, sources: p.sources ?? [], wards: p.wards }} />,
  },
  'uc-employment': {
    label: 'UC Claimants in Work',
    summary: p => `${p.validation.wards_found}/69 wards · ward mean ${p.validation.ward_mean_pct}% in work`,
    render: p => <UcEmpDashboard data={{ as_of: p.source.as_of, ward_mean_pct: p.validation.ward_mean_pct, sources: p.sources ?? [], wards: p.wards }} />,
  },
  'pip-conditions': {
    label: 'PIP Deep Dive',
    summary: p => `GB-level · ${p.validation.categories_found} categories × ${p.validation.years_span} yrs · £${((p.gb_total_real_latest ?? 0) / 1000).toFixed(1)}bn real · anchor drift ${p.validation.anchor_drift_pct}%`,
    render: p => <PipDashboard data={{
      years: p.years ?? [], categories: p.categories ?? [], conditions: p.conditions ?? [],
      gb_total_real_latest: p.gb_total_real_latest ?? 0, gb_total_nominal_latest: p.gb_total_nominal_latest ?? 0,
      birmingham_pip_m: p.birmingham_pip_m ?? null, sources: p.sources ?? [],
    }} />,
  },
  'constituency-money': {
    label: 'Money Map (£)',
    summary: p => `9 constituencies · £${((p.city?.sum_m ?? 0) / 1000).toFixed(2)}bn real DWP £ · ${p.year} · per-row checksums`,
    render: p => <ConMoneyDashboard data={{
      year: p.year ?? '', benefit_labels: p.benefit_labels ?? {}, uc_years: p.uc_years ?? [],
      city: p.city ?? { sum_m: 0, la_total_m: 0, drift_pct: 0 },
      sources: p.sources ?? [], constituencies: p.constituencies ?? [],
    }} />,
  },
  'child-poverty': {
    label: 'Child Poverty',
    summary: p => `${p.validation.wards_found}/69 wards · ${p.validation.years_span}-yr series · ${p.validation.highest?.ward} ${p.validation.highest?.pct}% → ${p.validation.lowest?.ward} ${p.validation.lowest?.pct}%`,
    render: p => <ChildPovertyDashboard data={{
      as_of: p.source.as_of, years: p.years ?? [],
      city: p.city ?? { city_series: null, england_series: null, city_latest: null, england_latest: null },
      sources: p.sources ?? [], wards: p.wards,
    }} />,
  },
  'uc-combined': {
    label: 'UC — Full Picture',
    summary: p => `${p.validation.wards_found}/69 wards · ${p.validation.total_claimants?.toLocaleString()} on UC · ${p.validation.total_not_in_work?.toLocaleString()} not in work`,
    render: p => <UcCombinedDashboard data={{
      as_of: p.source.as_of, city: p.city, sources: p.sources ?? [], wards: p.wards,
    }} />,
  },
  'benefits-bill': {
    label: 'Benefits Bill (£)',
    summary: p => `LA-level · £${((p.total_m ?? 0) / 1000).toFixed(2)}bn total · £${p.per_head?.toLocaleString()}/resident · ${p.year}`,
    render: p => <BenefitsBillView data={{
      year: p.year ?? '', total_m: p.total_m ?? 0, per_head: p.per_head ?? null,
      population: p.population ?? null, sources: p.sources ?? [], lines: p.lines ?? [],
      history: p.history ?? [],
    }} />,
  },
  'two-child': {
    label: 'Two-Child Limit',
    summary: p => `Constituency-level · ${p.validation.households_affected?.toLocaleString()} households · derived +£${p.validation.derived_annual_gain_m}m/yr`,
    render: p => <TwoChildView data={{
      as_of: p.source.as_of, child_element_month: p.child_element_month ?? 292.81,
      city: p.city, sources: p.sources ?? [], constituencies: p.constituencies ?? [],
    }} />,
  },
  'claimant-count': {
    label: 'Claimant Count',
    summary: p => `${p.validation.wards_found}/69 wards · ward mean ${p.validation.ward_mean_pct}% of 16–64 · ${p.validation.total_claimants?.toLocaleString()} claimants · ${p.validation.months_span}-month series`,
    render: p => <ClaimantDashboard data={{
      as_of: p.source.as_of,
      months: p.months ?? [],
      ward_mean_pct: p.validation.ward_mean_pct ?? null,
      total_claimants: p.validation.total_claimants ?? 0,
      sources: p.sources ?? [],
      wards: p.wards,
    }} />,
  },
  'housing-benefit': {
    label: 'Housing Benefit',
    summary: p => `LA-level · Birmingham ${p.validation.birmingham_value}% (#${p.validation.birmingham_rank} of ${p.validation.areas_found}) · no ward breakdown`,
    render: p => <HousingBenefitView data={{
      as_of: p.source.as_of,
      metric: p.metric ?? 'Housing Benefit',
      geography: p.geography ?? 'local-authority',
      areas: p.areas ?? [],
      benchmarks: p.benchmarks ?? { wmca: null, england: null },
      birmingham_value: p.validation.birmingham_value ?? null,
      birmingham_rank: p.validation.birmingham_rank ?? null,
      sources: p.sources ?? [],
    }} />,
  },
};

export default function ReviewPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/proposals', { cache: 'no-store' });
    const j = await r.json();
    const ps: Proposal[] = (j.proposals ?? []).filter((p: Proposal) => REGISTRY[p.id]);
    if (!ps.length) { setState('empty'); return; }
    setProposals(ps);
    setSelId(prev => prev && ps.some(p => p.id === prev) ? prev : (ps.find(p => p.status === 'pending') ?? ps[0]).id);
    setState('ready');
  }, []);

  useEffect(() => { load(); }, [load]);

  const proposal = proposals.find(p => p.id === selId) ?? null;

  const act = async (action: 'accept' | 'reject') => {
    if (!proposal) return;
    setBusy(true);
    await fetch('/api/proposals', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: proposal.id, action, reason }) });
    await load();
    setBusy(false); setRejecting(false); setReason('');
  };

  if (state === 'loading') return <Frame sub="loading…"><div style={{ padding: 40, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>⠋ loading proposals…</div></Frame>;
  if (state === 'empty' || !proposal) return <Frame sub="no proposals"><div style={{ padding: 40, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--muted)' }}>No proposals staged. Run a <code style={{ fontFamily: 'var(--mono)' }}>scripts/fetch-*.mjs</code> tool.</div></Frame>;

  const reg = REGISTRY[proposal.id];

  return (
    <div className="dash-shell" style={{ gridTemplateColumns: '1fr' }}>
      <div className="wrap">
        <div className="hdr">
          <div className="hdr-brand">
            <div>
              <div className="hdr-title">Review · {reg.label}</div>
              <div className="hdr-sub">
                {reg.summary(proposal)} · {proposal.source.as_of} ·{' '}
                <span style={{ color: proposal.status === 'accepted' ? 'var(--q-prosp)' : proposal.status === 'rejected' ? 'var(--q-disad)' : 'var(--herald-navy)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{proposal.status}</span>
              </div>
            </div>
          </div>
          <div className="hdr-right">
            {proposal.status === 'pending' && !rejecting && (
              <>
                <button className="refresh-btn" onClick={() => act('accept')} disabled={busy} style={{ background: 'var(--herald-navy)', color: '#f5f3ee', borderColor: 'var(--herald-navy)', fontWeight: 600 }}>
                  {busy ? '⠋ publishing…' : '✓ Accept & publish'}
                </button>
                <button className="refresh-btn" onClick={() => setRejecting(true)} disabled={busy}>✗ Reject</button>
              </>
            )}
            {proposal.status === 'accepted' && <a href="/dashboard" className="refresh-btn" style={{ background: 'var(--q-prosp)', color: '#f5f3ee', borderColor: 'var(--q-prosp)' }}>✓ Published — view in Dashboards →</a>}
            {proposal.status === 'rejected' && <span className="dsbadge" style={{ color: 'var(--q-disad)' }}>✗ rejected</span>}
          </div>
        </div>
        <div className="hdr-dancetty" aria-hidden="true" />

        {/* Proposal selector — wrapping chips so the whole queue is always visible */}
        {proposals.length > 1 && (
          <div className="review-picker">
            {proposals.map(p => (
              <button key={p.id} className={`review-chip${p.id === selId ? ' active' : ''}`} onClick={() => { setSelId(p.id); setRejecting(false); }}>
                <span className={`review-dot ${p.status}`} aria-hidden="true" />
                {REGISTRY[p.id].label}
              </button>
            ))}
          </div>
        )}

        {rejecting && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--paper2)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why reject? e.g. 'wrong vintage' — the agent sees this and retries." style={{ flex: 1, padding: '8px 10px', fontFamily: 'var(--sans)', fontSize: 12, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--ink)' }} />
            <button className="refresh-btn" onClick={() => act('reject')} disabled={busy} style={{ borderColor: 'var(--q-disad)', color: 'var(--q-disad)' }}>Confirm reject</button>
            <button className="refresh-btn" onClick={() => { setRejecting(false); setReason(''); }}>Cancel</button>
          </div>
        )}

        {/* The candidate dashboard — identical component to the Dashboards tab */}
        {reg.render(proposal)}
      </div>
    </div>
  );
}

function Frame({ children, sub }: { children: ReactNode; sub: string }) {
  return (
    <div className="dash-shell" style={{ gridTemplateColumns: '1fr' }}>
      <div className="wrap">
        <div className="hdr">
          <div className="hdr-brand"><div>
            <div className="hdr-title">Review</div>
            <div className="hdr-sub">{sub}</div>
          </div></div>
        </div>
        <div className="hdr-dancetty" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
