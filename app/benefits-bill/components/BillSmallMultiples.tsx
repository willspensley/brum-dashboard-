'use client';

import type { BillYear } from '@/lib/types';

// Small multiples — one mini-line per benefit (the emphasis alternative to a
// 12-series spaghetti chart). Endpoint direct-labelled with latest £ and change.
interface Props {
  history: BillYear[];
}

const FACETS: { id: string; label: string; color: string }[] = [
  { id: 'uc', label: 'Universal Credit', color: '#2a55bf' },
  { id: 'sp', label: 'State Pension', color: '#d99a00' },
  { id: 'hb', label: 'Housing Benefit', color: '#1f7a33' },
  { id: 'pip', label: 'PIP', color: '#b01225' },
  { id: 'esa', label: 'ESA', color: '#4a3aa7' },
  { id: 'dla', label: 'DLA', color: '#52514e' },
  { id: 'pc', label: 'Pension Credit', color: '#52514e' },
  { id: 'jsa', label: 'JSA', color: '#52514e' },
];

const W = 190, H = 74;

function Facet({ history, id, label, color }: { history: BillYear[]; id: string; label: string; color: string }) {
  const vals = history.map(h => {
    if (!h.components) return null;
    if (h.anomalies?.some(a => a.startsWith(label))) return null;   // source defect → gap, not £0
    return h.components[id] ?? 0;                                    // absent column = benefit didn't exist yet
  });
  const pts = vals.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  if (pts.length < 2) return null;
  const maxV = Math.max(...pts.map(p => p.v), 1);
  const x = (i: number) => 4 + (i / (history.length - 1)) * (W - 62);
  const y = (v: number) => H - 8 - (v / maxV) * (H - 22);

  // split polyline at gaps (withheld years) — never bridge them
  const segments: { v: number; i: number }[][] = [];
  let cur: { v: number; i: number }[] = [];
  vals.forEach((v, i) => {
    if (v == null) { if (cur.length) segments.push(cur); cur = []; }
    else cur.push({ v, i });
  });
  if (cur.length) segments.push(cur);

  const first = pts[0], last = pts.at(-1)!;
  const fmt = (m: number) => m >= 1000 ? `£${(m / 1000).toFixed(1)}bn` : `£${Math.round(m)}m`;
  const delta = first.v > 0 ? Math.round(((last.v - first.v) / first.v) * 100) : null;

  return (
    <div className="bill-facet">
      <div className="bill-facet-ttl">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <line x1={4} y1={H - 8} x2={W - 58} y2={H - 8} stroke="rgba(14,15,17,.12)" strokeWidth="1" />
        {segments.map((seg, si) => (
          <polyline key={si} points={seg.map(p => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}
            fill="none" stroke={color} strokeWidth="1.8" />
        ))}
        <circle cx={x(last.i)} cy={y(last.v)} r="2.6" fill={color} />
        <text x={x(last.i) + 5} y={y(last.v) + 3} fontSize="9" fontFamily="IBM Plex Mono" fill="#15181e">{fmt(last.v)}</text>
        <title>{label}: {fmt(first.v)} ({history[first.i].year}) → {fmt(last.v)} ({history[last.i].year})</title>
      </svg>
      <div className="bill-facet-sub">
        {history[first.i].year}: {fmt(first.v)}
        {delta != null && <span style={{ color: delta > 0 ? '#b01225' : '#1a3a2a', marginLeft: 6 }}>{delta > 0 ? '+' : ''}{delta}%</span>}
      </div>
    </div>
  );
}

export default function BillSmallMultiples({ history }: Props) {
  const anomalyNotes = history.flatMap(h => (h.anomalies ?? []).map(a => `${h.year}: ${a}`));
  return (
    <div style={{ marginTop: 22 }}>
      <div className="bill-sec-ttl">Each benefit&apos;s own path (£ nominal; UC and PIP begin mid-series because they began existing)</div>
      <div className="bill-facets">
        {FACETS.map(f => <Facet key={f.id} history={history} {...f} />)}
      </div>
      {anomalyNotes.length > 0 && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', marginTop: 8, lineHeight: 1.6 }}>
          ◇ Source defects in DWP&apos;s workbook (value withheld, shown as a gap): {anomalyNotes.join(' · ')}
        </div>
      )}
    </div>
  );
}
