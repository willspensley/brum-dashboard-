'use client';

import { useState } from 'react';
import type { PipData } from '@/lib/types';

// The River — a silhouette streamgraph of PIP money by condition category.
// Chosen per the research: 5–15 categories + 10+ time points + story-over-precision
// is exactly the streamgraph's sweet spot. Top 8 categories + "Other" (fold rule),
// centred baseline (silhouette offset, computed here — no chart library needed),
// direct labels on the widest bands, per-band hover.
interface Props {
  data: PipData;
  mode: 'real' | 'nominal';
}

// The validated reference categorical palette (8 slots) + de-emphasis gray for Other.
const PALETTE = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const OTHER = '#8a8f99';

const W = 880, H = 380, PAD_L = 14, PAD_R = 132, PAD_T = 18, PAD_B = 34;

// Catmull-Rom → cubic bezier for a smooth stream edge.
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export default function PipStream({ data, mode }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const years = data.years;
  const last = years.length - 1;

  const seriesOf = (c: { real: (number | null)[]; nominal: (number | null)[] | null }) =>
    (mode === 'real' ? c.real : (c.nominal ?? c.real)).map(v => v ?? 0);

  const top = data.categories.slice(0, 8);
  const rest = data.categories.slice(8);
  const bands = [
    ...top.map((c, i) => ({ name: c.name, vals: seriesOf(c), color: PALETTE[i] })),
    {
      name: 'All other categories',
      vals: years.map((_, t) => rest.reduce((s, c) => s + (seriesOf(c)[t] ?? 0), 0)),
      color: OTHER,
    },
  ];

  const totals = years.map((_, t) => bands.reduce((s, b) => s + b.vals[t], 0));
  const maxTotal = Math.max(...totals, 1);
  const x = (t: number) => PAD_L + (t / last) * (W - PAD_L - PAD_R);
  const yScale = (H - PAD_T - PAD_B) / maxTotal;
  const midY = PAD_T + (H - PAD_T - PAD_B) / 2;

  // silhouette offset: baseline(t) = −total(t)/2, stack the bands upward from it
  const edges: { name: string; color: string; top: [number, number][]; bottom: [number, number][]; thick: number[] }[] = [];
  const cum = years.map((_, t) => -totals[t] / 2);
  for (const b of bands) {
    const bottom: [number, number][] = [], topE: [number, number][] = [], thick: number[] = [];
    for (let t = 0; t <= last; t++) {
      const y0 = cum[t], y1 = cum[t] + b.vals[t];
      bottom.push([x(t), midY + y0 * yScale * -1 * -1]);   // y grows downward: map value→px
      topE.push([x(t), midY + y1 * yScale * -1 * -1]);
      thick.push(b.vals[t] * yScale);
      cum[t] = y1;
    }
    // flip: SVG y increases downward, our stack grows upward → invert around midY
    const inv = (p: [number, number]): [number, number] => [p[0], 2 * midY - p[1]];
    edges.push({ name: b.name, color: b.color, top: topE.map(inv), bottom: bottom.map(inv), thick });
  }

  const fmt = (m: number) => (m >= 1000 ? `£${(m / 1000).toFixed(1)}bn` : `£${Math.round(m)}m`);

  return (
    <div>
      <div className="bill-sec-ttl">
        PIP money by condition category, {years[0]} → {years[last]} — {mode === 'real' ? 'real terms (2025/26 prices)' : 'nominal £'}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img"
        aria-label="Streamgraph of PIP expenditure by condition category over time">
        {years.map((yl, t) => (t % 2 === 0 || t === last) && (
          <text key={yl} x={x(t)} y={H - 12} textAnchor="middle" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#8a8f99">{yl}</text>
        ))}
        {edges.map(e => {
          const pathD = `${smoothPath(e.top)} L${e.bottom[last][0].toFixed(1)},${e.bottom[last][1].toFixed(1)} ${smoothPath([...e.bottom].reverse()).replace(/^M/, 'L')} Z`;
          const dim = hover != null && hover !== e.name;
          return (
            <path key={e.name} d={pathD} fill={e.color} fillOpacity={dim ? 0.25 : 0.88}
              stroke="#f5f3ee" strokeWidth="1"
              onMouseEnter={() => setHover(e.name)} onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer', transition: 'fill-opacity .15s' }}>
              <title>{e.name}: {fmt(e.thick[last] / yScale)} in {years[last]} (from {fmt(e.thick[0] / yScale)} in {years[0]})</title>
            </path>
          );
        })}
        {/* direct labels at the right edge, centred on each band's end thickness */}
        {edges.map(e => {
          const yMid = (e.top[last][1] + e.bottom[last][1]) / 2;
          if (Math.abs(e.bottom[last][1] - e.top[last][1]) < 11 && e.name !== 'All other categories') return null;
          return (
            <text key={`lbl-${e.name}`} x={W - PAD_R + 6} y={yMid + 3} fontSize="9" fontFamily="IBM Plex Mono"
              fill={hover === e.name ? '#0e0f11' : '#52514e'}>
              {e.name.length > 22 ? `${e.name.slice(0, 21)}…` : e.name} {fmt(e.thick[last] / yScale)}
            </text>
          );
        })}
      </svg>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', marginTop: 4, lineHeight: 1.6 }}>
        Band thickness = £ that year (total {fmt(totals[last])} in {years[last]}). Top 8 categories named;
        the rest fold into gray. Hover a band to isolate it.
      </div>
    </div>
  );
}
