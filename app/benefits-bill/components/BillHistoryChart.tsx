'use client';

import { useEffect, useRef } from 'react';
import type { BillYear } from '@/lib/types';

// 23-year stacked area — the composition of Birmingham's benefits bill over time.
// 5 named benefits + "Other" (= that year's real Total − the five, so the stack's
// top edge IS the workbook Total). Palette validated (see docs/VIZ-EXECUTION-PLAN.md).
// A year whose breakdown failed the workbook sum-check renders as a visible notch —
// withheld, never interpolated.
interface Props {
  history: BillYear[];
}

export const BILL_SERIES: { id: string; label: string; color: string }[] = [
  { id: 'uc', label: 'Universal Credit', color: '#2a55bf' },
  { id: 'sp', label: 'State Pension', color: '#d99a00' },
  { id: 'hb', label: 'Housing Benefit', color: '#1f7a33' },
  { id: 'pip', label: 'PIP', color: '#b01225' },
  { id: 'esa', label: 'ESA', color: '#4a3aa7' },
  { id: 'other', label: 'Everything else', color: '#8a8f99' },
];

export function otherOf(h: BillYear): number | null {
  if (!h.components || h.partial) return null;   // partial years can't split UC out of the residual
  const five = ['uc', 'sp', 'hb', 'pip', 'esa'].reduce((s, id) => s + (h.components?.[id] ?? 0), 0);
  return Math.round((h.total_m - five) * 10) / 10;
}

export default function BillHistoryChart({ history }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let ch: { destroy: () => void } | null = null;
    async function init() {
      const { Chart } = await import('chart.js/auto');
      if (!canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const labels = history.map(h => h.year);
      const val = (h: BillYear, id: string) =>
        id === 'other' ? otherOf(h) : (h.components && !h.partial ? (h.components[id] ?? 0) : null);

      const datasets = [
        ...BILL_SERIES.map(s => ({
          label: s.label,
          data: history.map(h => val(h, s.id)),
          backgroundColor: s.color,
          borderColor: '#f5f3ee',        // 2px-ish surface gap between stacked bands
          borderWidth: 1,
          pointRadius: 0,
          pointHitRadius: 12,
          fill: true,
          spanGaps: false,
          tension: 0.15,
        })),
        {
          // Years DWP didn't itemise (e.g. 2018/19 has no UC column): the REAL total
          // renders as one neutral band so the graph stays continuous — the split is
          // not invented, and the band says why.
          label: 'Not itemised by DWP',
          data: history.map(h => (!h.components || h.partial ? h.total_m : null)),
          backgroundColor: 'rgba(138,143,153,.38)',
          borderColor: '#8a8f99',
          borderWidth: 1,
          pointRadius: 0,
          pointHitRadius: 12,
          fill: true,
          spanGaps: false,
          tension: 0,
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ch = new Chart(canvasRef.current, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index' as const, intersect: false },
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: { color: '#6b6760', font: { size: 9, family: 'IBM Plex Mono' }, boxWidth: 10, padding: 10 },
            },
            tooltip: {
              backgroundColor: '#0e0f11', titleColor: '#fff', bodyColor: '#e5e3df', borderWidth: 0, padding: 8,
              filter: (c: { parsed: { y: number | null } }) => c.parsed.y != null,
              callbacks: {
                label: (c: { dataset: { label: string }; parsed: { y: number | null } }) =>
                  c.dataset.label === 'Not itemised by DWP'
                    ? ` Real total £${c.parsed.y?.toLocaleString()}m — DWP's sheet doesn't itemise UC this year, so the split is withheld, not estimated`
                    : ` ${c.dataset.label}: £${c.parsed.y?.toLocaleString()}m`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#6b6760', font: { size: 8.5, family: 'IBM Plex Mono' }, maxRotation: 45, autoSkipPadding: 8 },
            },
            y: {
              stacked: true,
              grid: { color: 'rgba(14,15,17,.05)' },
              ticks: { color: '#6b6760', font: { size: 9, family: 'IBM Plex Mono' }, callback: (v: number | string) => `£${Number(v).toLocaleString()}m` },
            },
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      chartRef.current = ch;
    }
    init();
    return () => { if (ch) ch.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const withheld = history.filter(h => !h.components || h.partial).map(h => h.year);

  return (
    <div>
      <div className="bill-sec-ttl">The bill, {history[0]?.year} → {history.at(-1)?.year} (£ million, nominal — not inflation-adjusted)</div>
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      {withheld.length > 0 && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', marginTop: 6, lineHeight: 1.6 }}>
          ◇ {withheld.join(', ')} renders as the gray band: DWP&apos;s sheet for that year does not itemise
          every benefit inside its Total (no Universal Credit column in 2018/19), so the REAL total is shown
          whole and the split is withheld — never estimated. The itemised benefits still appear in the
          per-benefit charts below.
        </div>
      )}
    </div>
  );
}
