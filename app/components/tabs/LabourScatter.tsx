'use client';

import { useEffect, useRef } from 'react';
import type { Ward } from '@/lib/types';
import { dc, MUTED } from '@/lib/constants';

interface Props {
  wards: Ward[];
  onSelect: (code: string) => void;
}

export default function LabourScatter({ wards, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    let ch: { destroy: () => void } | null = null;

    async function init() {
      const { Chart } = await import('chart.js/auto');
      if (!canvasRef.current) return;
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();

      const data = wards.map(w => ({
        x: w.imd_employment_score * 100,
        y: w.claimant_rate,
        r: Math.max(4, w.inactivity_sick_pct * 0.55),
        ward: w,
      }));

      ch = new Chart(canvasRef.current, {
        type: 'bubble',
        data: {
          datasets: [{
            data,
            backgroundColor: data.map(d => dc(d.ward.composite_decile) + 'cc'),
            borderColor: data.map(d => dc(d.ward.composite_decile)),
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick: (_e: any, els: any[]) => {
            if (els.length) onSelect(data[els[0].index].ward.ward_code);
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label: (c: any) => {
                  const w = (c.raw as { ward: Ward }).ward;
                  return [`${w.ward_name}`, `IMD: ${(w.imd_employment_score * 100).toFixed(1)}%`, `Claimant: ${w.claimant_rate}%`, `Inactivity: ${w.inactivity_sick_pct}%`];
                },
              },
              backgroundColor: '#0e0f11', titleColor: '#fff', bodyColor: '#e5e3df', borderWidth: 0, padding: 9,
            },
          },
          scales: {
            x: { title: { display: true, text: 'IMD Employment Score (%)', color: MUTED, font: { size: 10, family: 'IBM Plex Mono' } }, grid: { color: 'rgba(14,15,17,.06)' }, ticks: { color: MUTED, font: { size: 9, family: 'IBM Plex Mono' }, callback: (v: number | string) => v + '%' } },
            y: { title: { display: true, text: 'Claimant Rate (%)', color: MUTED, font: { size: 10, family: 'IBM Plex Mono' } }, grid: { color: 'rgba(14,15,17,.06)' }, ticks: { color: MUTED, font: { size: 9, family: 'IBM Plex Mono' }, callback: (v: number | string) => v + '%' } },
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      chartRef.current = ch;
    }

    init();
    return () => { if (ch) ch.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wards]);

  return (
    <div>
      <div style={{ padding: '12px 14px 0', display: 'flex', gap: 14, flexWrap: 'wrap', background: 'var(--surface)' }}>
        <span className="llbl"><b style={{ color: 'var(--ink)' }}>X</b> IMD employment score</span>
        <span className="llbl"><b style={{ color: 'var(--ink)' }}>Y</b> Claimant rate %</span>
        <span className="llbl"><b style={{ color: 'var(--ink)' }}>Size</b> Inactivity rate</span>
      </div>
      <div className="scatter-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
