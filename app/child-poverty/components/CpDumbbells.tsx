'use client';

import type { ChildPovertyData, ChildPovertyWard } from '@/lib/types';

// Change view — one dumbbell per ward: pale dot = first year, dark dot = latest,
// red connector where child poverty ROSE, green-ink where it fell. Sorted by latest.
// The textbook before→after-per-item form (one hue, two shades + polarity).
interface Props {
  data: ChildPovertyData;
  selected: ChildPovertyWard | null;
  onSelect: (code: string) => void;
}

const ROW_H = 22, PAD_L = 172, PAD_R = 86, W = 860;

export default function CpDumbbells({ data, selected, onSelect }: Props) {
  const wards = [...data.wards].sort((a, b) => b.latest_pct - a.latest_pct);
  const maxV = Math.max(...wards.map(w => Math.max(w.latest_pct, w.first_pct ?? 0)), 1) * 1.05;
  const H = wards.length * ROW_H + 40;
  const x = (v: number) => PAD_L + (v / maxV) * (W - PAD_L - PAD_R);
  const ticks = [0, 20, 40, 60].filter(t => t <= maxV);

  return (
    <div style={{ padding: '14px 12px' }}>
      <div className="bill-sec-ttl">{data.years[0]} ○ → ● {data.as_of} — sorted by where it&apos;s worst now</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img"
        aria-label="Change in child poverty per ward across the decade">
        {ticks.map(t => (
          <g key={t}>
            <line x1={x(t)} y1={14} x2={x(t)} y2={H - 26} stroke="rgba(14,15,17,.06)" strokeWidth="1" />
            <text x={x(t)} y={H - 12} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill="#8a8f99">{t}%</text>
          </g>
        ))}
        {wards.map((w, i) => {
          const cy = 24 + i * ROW_H;
          const isSel = selected?.ward_code === w.ward_code;
          const first = w.first_pct;
          const rose = w.delta_pp != null && w.delta_pp > 0;
          const conn = rose ? '#b01225' : '#1a3a2a';
          return (
            <g key={w.ward_code} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
              <rect x={0} y={cy - ROW_H / 2} width={W} height={ROW_H} fill={isSel ? 'rgba(28,63,148,.06)' : 'transparent'} />
              <text x={PAD_L - 8} y={cy + 3.5} textAnchor="end" fontSize="10.5"
                fontFamily="var(--sans)" fontWeight={isSel ? 700 : 500} fill="#15181e">{w.ward_name}</text>
              {first != null && (
                <>
                  <line x1={x(first)} y1={cy} x2={x(w.latest_pct)} y2={cy} stroke={conn} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
                  <circle cx={x(first)} cy={cy} r={4} fill="#f5f3ee" stroke={conn} strokeWidth="1.6" />
                </>
              )}
              <circle cx={x(w.latest_pct)} cy={cy} r={4.5} fill={conn} stroke="#f5f3ee" strokeWidth="1.5" />
              <text x={W - PAD_R + 8} y={cy + 3.5} fontSize="9.5" fontFamily="IBM Plex Mono"
                fill={rose ? '#b01225' : '#1a3a2a'}>
                {w.latest_pct}% {w.delta_pp != null ? `(${w.delta_pp > 0 ? '+' : ''}${w.delta_pp})` : ''}
              </text>
              <title>{w.ward_name}: {first ?? '—'}% in {data.years[0]} → {w.latest_pct}% in {data.as_of}{w.delta_pp != null ? ` (${w.delta_pp > 0 ? '+' : ''}${w.delta_pp}pp)` : ''}</title>
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', marginTop: 6 }}>
        Red = child poverty rose over the decade · green = fell. Δ in percentage points.
      </div>
    </div>
  );
}
