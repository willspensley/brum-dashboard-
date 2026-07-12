'use client';

import type { ChildPovertyData, ChildPovertyWard } from '@/lib/types';

// Distribution strip — all 69 wards as dots on one % axis, so the SHAPE of the
// inequality reads at a glance (the cluster at ~10-20% and the tail out past 60%).
// Dots stack vertically where wards share a value (dot-plot binning — deterministic,
// no random jitter). City and England rules are the REAL benchmark figures.
interface Props {
  data: ChildPovertyData;
  selected: ChildPovertyWard | null;
  onSelect: (code: string) => void;
}

const W = 860, H = 300, PAD_L = 30, PAD_R = 20, BASE_Y = H - 46, R = 5, BIN = 1.5;

export default function CpStrip({ data, selected, onSelect }: Props) {
  const wards = data.wards;
  const maxV = Math.max(...wards.map(w => w.latest_pct), data.city.city_latest ?? 0, 1) * 1.06;
  const x = (v: number) => PAD_L + (v / maxV) * (W - PAD_L - PAD_R);

  // deterministic stacking: bin by value, stack upwards within a bin
  const bins: Record<number, number> = {};
  const dots = [...wards].sort((a, b) => a.latest_pct - b.latest_pct).map(w => {
    const bin = Math.round(w.latest_pct / BIN);
    const level = (bins[bin] = (bins[bin] ?? 0) + 1);
    return { w, cx: x(w.latest_pct), cy: BASE_Y - (level - 1) * (R * 2 + 3) };
  });

  const ticks = [0, 10, 20, 30, 40, 50, 60].filter(t => t <= maxV);
  const rules: { v: number; label: string; color: string }[] = [];
  if (data.city.city_latest != null) rules.push({ v: data.city.city_latest, label: `Birmingham ${data.city.city_latest}%`, color: '#b01225' });
  if (data.city.england_latest != null) rules.push({ v: data.city.england_latest, label: `England ${data.city.england_latest}%`, color: '#52514e' });

  return (
    <div style={{ padding: '14px 12px' }}>
      <div className="bill-sec-ttl">Every ward on one axis — {data.as_of}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img"
        aria-label="Distribution of child poverty rates across the 69 wards">
        {/* axis + grid: solid hairlines */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={x(t)} y1={26} x2={x(t)} y2={BASE_Y + 8} stroke="rgba(14,15,17,.06)" strokeWidth="1" />
            <text x={x(t)} y={BASE_Y + 22} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill="#8a8f99">{t}%</text>
          </g>
        ))}
        <line x1={PAD_L} y1={BASE_Y + 8} x2={W - PAD_R} y2={BASE_Y + 8} stroke="rgba(14,15,17,.18)" strokeWidth="1" />

        {/* benchmark rules — solid, direct-labelled */}
        {rules.map(r => (
          <g key={r.label}>
            <line x1={x(r.v)} y1={16} x2={x(r.v)} y2={BASE_Y + 8} stroke={r.color} strokeWidth="1.4" />
            <text x={x(r.v) + 5} y={22} fontSize="10" fontFamily="IBM Plex Mono" fill={r.color}>{r.label}</text>
          </g>
        ))}

        {/* dots — 24px hit area, 2px surface ring on the selected mark */}
        {dots.map(({ w, cx, cy }) => {
          const isSel = selected?.ward_code === w.ward_code;
          return (
            <g key={w.ward_code} onClick={() => onSelect(w.ward_code)} style={{ cursor: 'pointer' }}>
              <circle cx={cx} cy={cy} r={12} fill="transparent" />
              <circle cx={cx} cy={cy} r={R} fill={isSel ? '#b01225' : '#16306f'}
                stroke="#f5f3ee" strokeWidth={isSel ? 2.5 : 1.5} />
              <title>{w.ward_name}: {w.latest_pct}% of children in absolute low income ({data.as_of})</title>
            </g>
          );
        })}

        {/* selective direct labels: the two extremes only */}
        {wards.length > 0 && (() => {
          const hi = wards[0], lo = wards[wards.length - 1];
          return (
            <>
              <text x={x(hi.latest_pct)} y={BASE_Y + 36} textAnchor="end" fontSize="10" fontFamily="IBM Plex Mono" fill="#b01225">{hi.ward_name} {hi.latest_pct}%</text>
              <text x={x(lo.latest_pct)} y={BASE_Y + 36} textAnchor="start" fontSize="10" fontFamily="IBM Plex Mono" fill="#52514e">{lo.ward_name} {lo.latest_pct}%</text>
            </>
          );
        })()}
      </svg>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', marginTop: 6, lineHeight: 1.6 }}>
        Each dot = one ward (stacked where values coincide). Click a dot for the ward&apos;s detail.
        Benchmark rules are the real DWP/HMRC Birmingham and England figures, not averages of these dots.
      </div>
    </div>
  );
}
