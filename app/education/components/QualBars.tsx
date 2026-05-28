'use client';

import { useEffect, useRef } from 'react';
import type { EducationWard } from '@/lib/types';

interface Props {
  wards: EducationWard[];
  selected: EducationWard | null;
}

const QUAL_COLORS = ['#3a1a1a','#683428','#7d4e36','#b07a5e','#c4a882','#1a3a2a','#4a8a6a'];
const QUAL_LABELS = ['No qualifications','Level 1','Level 2','Apprenticeship','Level 3','Level 4+','Other'];
const QUAL_KEYS: (keyof EducationWard)[] = ['qual_none','qual_level1','qual_level2','qual_apprenticeship','qual_level3','qual_level4plus','qual_other'];

function cityAvg(wards: EducationWard[], key: keyof EducationWard): number {
  return wards.reduce((s, w) => s + (w[key] as number), 0) / wards.length;
}

export default function QualBars({ wards, selected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let ch: { destroy: () => void } | null = null;

    async function init() {
      const { Chart } = await import('chart.js/auto');
      if (!canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const ward = selected ?? null;

      const cityData  = QUAL_KEYS.map(k => parseFloat(cityAvg(wards, k).toFixed(1)));
      const wardData  = ward ? QUAL_KEYS.map(k => (ward[k] as number)) : null;

      const labels = ward ? ['Birmingham average', ward.ward_name] : ['Birmingham average'];
      const datasets = QUAL_KEYS.map((_, qi) => ({
        label: QUAL_LABELS[qi],
        data: ward ? [cityData[qi], wardData![qi]] : [cityData[qi]],
        backgroundColor: QUAL_COLORS[qi],
        borderWidth: 0,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ch = new Chart(canvasRef.current, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          indexAxis: 'y' as const,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: { color: '#6b6760', font: { size: 9, family: 'IBM Plex Mono' }, boxWidth: 10, padding: 10 },
            },
            tooltip: {
              backgroundColor: '#0e0f11',
              titleColor: '#fff',
              bodyColor: '#e5e3df',
              borderWidth: 0,
              padding: 8,
              callbacks: {
                label: (c: { dataset: { label: string }; parsed: { x: number } }) =>
                  ` ${c.dataset.label}: ${c.parsed.x.toFixed(1)}%`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              max: 100,
              grid: { color: 'rgba(14,15,17,.04)' },
              ticks: { color: '#6b6760', font: { size: 9, family: 'IBM Plex Mono' }, callback: (v: number | string) => v + '%' },
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { color: '#0e0f11', font: { size: 11, family: 'Instrument Serif' } },
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
  }, [selected, wards]);

  const chartH = selected ? 160 : 90;

  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        Qualification split{selected ? ` — ${selected.ward_name} vs Birmingham average` : ' — Birmingham average'}
      </div>
      <div style={{ height: chartH, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
