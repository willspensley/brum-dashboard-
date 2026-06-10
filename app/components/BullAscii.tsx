'use client';

import { useEffect, useRef } from 'react';

const CHARS = [' ', '.', "'", ':', ';', '-', '=', '+', 'x', '#', '@'];

const SHIMMER: string[][] = [
  [' '],
  ['.', "'", ' ', ','],
  ["'", '.', '`', ','],
  [':', ';', '!', '.'],
  [';', ':', '~', '-'],
  ['-', '=', '_', '~'],
  ['=', '+', '-', 'o'],
  ['+', 'x', 'o', '='],
  ['x', '#', '+', '%'],
  ['#', '@', '%', 'x'],
  ['@', '#', '%', '&', '$'],
];

const COLS = 56;
const ROWS = 32;
const SAMPLE_SCALE = 4;
const FONT_SIZE = 9;
const LINE_H = 9.5;
const DAMPING = 0.984;
const WAVE_SPEED = 0.09;  // c² factor — tuned for visible but stable propagation

export default function BullAscii() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ col: number; row: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    ctx.font = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;
    const charW = ctx.measureText('M').width;

    canvas.width = Math.ceil(COLS * charW);
    canvas.height = Math.ceil(ROWS * LINE_H);

    const img = new Image();

    img.onload = () => {
      // ── Sample image → density grid ─────────────────────────────────────
      const W = COLS * SAMPLE_SCALE;
      const H = ROWS * SAMPLE_SCALE;
      const sCanvas = document.createElement('canvas');
      sCanvas.width = W; sCanvas.height = H;
      const sCtx = sCanvas.getContext('2d')!;
      sCtx.fillStyle = 'white';
      sCtx.fillRect(0, 0, W, H);
      sCtx.drawImage(img, 0, 0, W, H);

      const density: number[][] = [];
      for (let r = 0; r < ROWS; r++) {
        const row: number[] = [];
        for (let c = 0; c < COLS; c++) {
          const data = sCtx.getImageData(c * SAMPLE_SCALE, r * SAMPLE_SCALE, SAMPLE_SCALE, SAMPLE_SCALE).data;
          let total = 0;
          const n = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] / 255;
            total += ((data[i] + data[i + 1] + data[i + 2]) / 3) * a + 255 * (1 - a);
          }
          row.push(Math.round((1 - (total / n) / 255) * (CHARS.length - 1)));
        }
        density.push(row);
      }

      // ── 2D wave buffers (cellular automaton wave equation) ───────────────
      // u[t+1] = 2*u[t] - u[t-1] + c²*(∇²u[t])
      let wave     = new Float32Array(COLS * ROWS);
      let wavePrev = new Float32Array(COLS * ROWS);
      let waveNext = new Float32Array(COLS * ROWS);

      const addWave = (r: number, c: number, amount: number) => {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        wave[r * COLS + c] += amount;
      };

      // ── Scan-line state ──────────────────────────────────────────────────
      let scanRow = -1;
      let scanRowFloat = -1;
      let lastScan = performance.now();
      const SCAN_INTERVAL = 2200;
      const SCAN_SPEED = 28;

      // ── Render loop ──────────────────────────────────────────────────────
      let rafId = 0;

      const render = (ts: number) => {
        // Advance scan line
        if (scanRow === -1 && ts - lastScan > SCAN_INTERVAL) {
          scanRowFloat = 0;
          lastScan = ts;
        }
        if (scanRowFloat >= 0) {
          scanRowFloat += 16 / SCAN_SPEED;
          scanRow = Math.floor(scanRowFloat);
          if (scanRow >= ROWS) { scanRow = -1; scanRowFloat = -1; }
          else {
            // Inject wave energy along scan row
            for (let c = 0; c < COLS; c++) {
              if ((density[scanRow]?.[c] ?? 0) > 0) {
                addWave(scanRow, c, 0.35 * Math.sin(ts * 0.012 + c * 0.3));
              }
            }
          }
        }

        // Sporadic wave impulses from dense cells
        if (Math.random() < 0.25) {
          const r = 1 + Math.floor(Math.random() * (ROWS - 2));
          const c = 1 + Math.floor(Math.random() * (COLS - 2));
          if ((density[r]?.[c] ?? 0) >= 3) {
            addWave(r, c, (Math.random() - 0.5) * 0.5);
          }
        }

        // Mouse ripples
        const mouse = mouseRef.current;
        if (mouse) {
          const { row: mr, col: mc } = mouse;
          addWave(mr, mc, Math.sin(ts * 0.009) * 0.18);
          addWave(mr - 1, mc, Math.sin(ts * 0.009 - 0.4) * 0.1);
          addWave(mr + 1, mc, Math.sin(ts * 0.009 - 0.4) * 0.1);
          addWave(mr, mc - 1, Math.sin(ts * 0.009 - 0.4) * 0.1);
          addWave(mr, mc + 1, Math.sin(ts * 0.009 - 0.4) * 0.1);
        }

        // Wave propagation step
        for (let r = 1; r < ROWS - 1; r++) {
          for (let c = 1; c < COLS - 1; c++) {
            const idx = r * COLS + c;
            const laplacian =
              wave[(r - 1) * COLS + c] + wave[(r + 1) * COLS + c] +
              wave[r * COLS + c - 1] + wave[r * COLS + c + 1] -
              4 * wave[idx];
            waveNext[idx] = DAMPING * (2 * wave[idx] - wavePrev[idx] + WAVE_SPEED * laplacian);
          }
        }

        // Swap wave buffers
        const tmp = wavePrev;
        wavePrev = wave;
        wave = waveNext;
        waveNext = tmp;

        // ── Draw ──────────────────────────────────────────────────────────
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const d = density[r]?.[c] ?? 0;
            if (d === 0) continue;

            const idx = r * COLS + c;
            const wv = wave[idx];   // typically ±0.3

            // Character from shimmer pool, driven by wave phase
            const pool = SHIMMER[d];
            const phase = (wv * 1.5 + 0.5) * pool.length;
            const char = pool[Math.max(0, Math.min(pool.length - 1, Math.floor(phase)))];

            // Alpha: base opacity from density, wave adds ±0.2
            const baseAlpha = 0.1 + (d / 10) * 0.9;
            const alpha = Math.max(0.05, Math.min(1.0, baseAlpha + wv * 0.22));

            const isScan = r === scanRow;
            ctx.globalAlpha = isScan ? Math.min(1, alpha * 1.7) : alpha;
            ctx.fillStyle = isScan ? '#7d4e36' : '#0e0f11';

            ctx.fillText(char, c * charW, r * LINE_H + FONT_SIZE);
          }
        }

        ctx.globalAlpha = 1;
        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);

      // ── Mouse tracking ───────────────────────────────────────────────────
      const onMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const col = Math.max(0, Math.min(COLS - 1, Math.floor(((e.clientX - rect.left) / rect.width) * COLS)));
        const row = Math.max(0, Math.min(ROWS - 1, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)));
        mouseRef.current = { col, row };
      };
      const onLeave = () => { mouseRef.current = null; };
      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('mouseleave', onLeave);

      return () => {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('mouseleave', onLeave);
      };
    };

    img.src = '/bull-logo.png';

    return () => { /* image hasn't loaded yet, no cleanup needed */ };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 0 28px',
        cursor: 'crosshair',
      }}
      aria-hidden="true"
    />
  );
}
