'use client';

import type { PipData } from '@/lib/types';

// The League Table — a bump chart of condition-category RANKS over time (emphasis
// form: the biggest climbers take accent colours, everything else recedes to gray).
// Rank strips out overall growth and shows the changing MIX of what PIP pays for.
interface Props {
  data: PipData;
}

const W = 880, ROW = 30, PAD_L = 36, PAD_R = 250, PAD_T = 16, PAD_B = 30;

export default function PipBump({ data }: Props) {
  const years = data.years;
  const last = years.length - 1;
  const top = data.categories.slice(0, 12);

  // rank per year among these 12 (1 = biggest £ that year)
  const ranks: number[][] = top.map(() => []);
  for (let t = 0; t <= last; t++) {
    const order = top.map((_, i) => i).sort((a, b) => (top[b].real[t] ?? 0) - (top[a].real[t] ?? 0));
    order.forEach((ci, pos) => { ranks[ci][t] = pos + 1; });
  }
  // climbers = biggest improvement from first to last rank
  const climbs = top.map((c, i) => ({ i, climb: ranks[i][0] - ranks[i][last] }));
  const topClimbers = [...climbs].sort((a, b) => b.climb - a.climb).slice(0, 2).filter(c => c.climb > 0).map(c => c.i);
  const accents = ['#b01225', '#2a55bf'];

  const H = PAD_T + PAD_B + top.length * ROW;
  const x = (t: number) => PAD_L + (t / last) * (W - PAD_L - PAD_R);
  const y = (rank: number) => PAD_T + (rank - 0.5) * ROW;
  const fmt = (m: number) => (m >= 1000 ? `£${(m / 1000).toFixed(1)}bn` : `£${Math.round(m)}m`);

  return (
    <div>
      <div className="bill-sec-ttl">Rank of each category by £, {years[0]} → {years[last]} (real terms) — the changing mix of what PIP pays for</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Bump chart of PIP category rankings over time">
        {years.map((yl, t) => (t % 2 === 0 || t === last) && (
          <text key={yl} x={x(t)} y={H - 8} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="#8a8f99">{yl}</text>
        ))}
        {top.map((c, i) => {
          const climberIdx = topClimbers.indexOf(i);
          const color = climberIdx >= 0 ? accents[climberIdx] : '#c3c2b7';
          const wgt = climberIdx >= 0 ? 2.4 : 1.4;
          const pts = years.map((_, t) => `${x(t).toFixed(1)},${y(ranks[i][t]).toFixed(1)}`).join(' ');
          return (
            <g key={c.name}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth={wgt} strokeLinejoin="round" />
              <circle cx={x(0)} cy={y(ranks[i][0])} r="3" fill={color} stroke="#f5f3ee" strokeWidth="1.4" />
              <circle cx={x(last)} cy={y(ranks[i][last])} r="3.4" fill={color} stroke="#f5f3ee" strokeWidth="1.4" />
              <text x={x(0) - 8} y={y(ranks[i][0]) + 3} textAnchor="end" fontSize="9" fontFamily="IBM Plex Mono" fill="#8a8f99">#{ranks[i][0]}</text>
              <text x={x(last) + 10} y={y(ranks[i][last]) + 3.5} fontSize="9.5" fontFamily="var(--sans)"
                fontWeight={climberIdx >= 0 ? 700 : 400} fill={climberIdx >= 0 ? color : '#52514e'}>
                #{ranks[i][last]} {c.name.length > 26 ? `${c.name.slice(0, 25)}…` : c.name} · {fmt(c.real[last] ?? 0)}
              </text>
              <title>{c.name}: rank #{ranks[i][0]} in {years[0]} → #{ranks[i][last]} in {years[last]}</title>
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', marginTop: 4 }}>
        Highlighted = the two biggest climbers up the rankings. Rank compares the 12 largest categories.
      </div>
    </div>
  );
}
