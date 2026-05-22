'use client';

import { useEffect, useRef } from 'react';
import type { Ward } from '@/lib/types';
import { hash01 } from '@/lib/synth';
import { MUTED, MONTHS } from '@/lib/constants';

function pandemicTrend(w: Ward): { vals: number[]; lbls: string[] } {
  const base = w.claimant_rate;
  const seed = hash01(w.ward_code + 't');
  const vals: number[] = [], lbls: string[] = [];
  for (let yr = 2019; yr <= 2026; yr++) {
    for (let m = 0; m < 12; m++) {
      if (yr === 2025 && m >= 3) break;
      const t = yr + m / 12; let mult: number;
      if (t < 2020.17)      mult = 0.57 + (seed - 0.5) * 0.04;
      else if (t < 2020.42) mult = 0.57 + (t - 2020.17) / 0.25 * 1.78;
      else if (t < 2021.0)  mult = 2.35 - (t - 2020.42) / 0.58 * 0.3;
      else if (t < 2022.5)  mult = 2.05 - (t - 2021.0) / 1.5 * 1.0;
      else if (t < 2024.0)  mult = 1.05 - (t - 2022.5) / 1.5 * 0.08;
      else                  mult = 0.97 + (seed - 0.5) * 0.04;
      const noise = Math.sin(yr * 17 + m * 31 + seed * 90) * 0.06;
      vals.push(parseFloat((base * mult * (1 + noise)).toFixed(1)));
      lbls.push(`${MONTHS[m]} '${String(yr).slice(2)}`);
    }
  }
  return { vals: [...vals, ...w.trend_12m], lbls: [...lbls, ...w.trend_months] };
}

interface Props {
  ward: Ward;
  wards: Ward[];
  trendMode: '12m' | 'pandemic';
}

export default function TrendChart({ ward, wards, trendMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    let ch: { destroy: () => void } | null = null;

    async function init() {
      const { Chart } = await import('chart.js/auto');
      if (!canvasRef.current) return;
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();

      const avgCC = (wards.reduce((s, x) => s + x.claimant_rate, 0) / wards.length).toFixed(1);
      let vals: number[], lbls: string[];
      if (trendMode === 'pandemic') {
        const pt = pandemicTrend(ward);
        vals = pt.vals; lbls = pt.lbls;
      } else {
        vals = ward.trend_12m; lbls = ward.trend_months;
      }
      const avgLine = Array(vals.length).fill(parseFloat(avgCC));

      const covidPlugin = trendMode === 'pandemic' ? [{
        id: 'cv',
        afterDraw(chart: { ctx: CanvasRenderingContext2D; scales: Record<string, { getPixelForValue: (v: number) => number }>; chartArea: { top: number; bottom: number; left: number; right: number } }) {
          const { ctx, scales: { x }, chartArea } = chart;
          const xPos = x.getPixelForValue(14);
          if (xPos < chartArea.left || xPos > chartArea.right) return;
          ctx.save();
          ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(58,26,26,.5)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(xPos, chartArea.top); ctx.lineTo(xPos, chartArea.bottom); ctx.stroke();
          ctx.fillStyle = 'rgba(58,26,26,.7)'; ctx.font = '9px IBM Plex Mono, monospace';
          ctx.fillText('COVID-19', xPos + 4, chartArea.top + 12);
          ctx.restore();
        },
      }] : [];

      ch = new Chart(canvasRef.current, {
        type: 'line',
        plugins: covidPlugin,
        data: {
          labels: lbls,
          datasets: [
            { label: ward.ward_name, data: vals, borderColor: '#7d4e36', backgroundColor: 'rgba(125,78,54,.12)', fill: true, tension: 0.4, pointRadius: trendMode === 'pandemic' ? 0 : 2, borderWidth: 1.8 },
            { label: 'Bham avg', data: avgLine, borderColor: 'rgba(14,15,17,.4)', borderDash: [4, 3], fill: false, tension: 0, pointRadius: 0, borderWidth: 1.2 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: MUTED, font: { size: 9, family: 'IBM Plex Mono' }, boxWidth: 10, padding: 8 } },
            tooltip: { backgroundColor: '#0e0f11', titleColor: '#fff', bodyColor: '#e5e3df', borderWidth: 0, padding: 7, callbacks: { label: (c: { dataset: { label: string }; parsed: { y: number } }) => `${c.dataset.label}: ${c.parsed.y}%` } },
          },
          scales: {
            x: { grid: { color: 'rgba(14,15,17,.04)' }, ticks: { color: MUTED, font: { size: 8, family: 'IBM Plex Mono' }, maxRotation: 0, maxTicksLimit: 12 } },
            y: { grid: { color: 'rgba(14,15,17,.04)' }, ticks: { color: MUTED, font: { size: 9, family: 'IBM Plex Mono' }, callback: (v: number | string) => v + '%' } },
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      chartRef.current = ch;
    }

    init();
    return () => { if (ch) ch.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ward, trendMode]);

  return <canvas ref={canvasRef} />;
}
