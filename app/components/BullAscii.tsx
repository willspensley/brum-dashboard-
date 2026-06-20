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

const DEFAULT_COLS = 56;
const DEFAULT_ROWS = 32;
const SAMPLE_SCALE = 4;
const DEFAULT_FONT_SIZE = 9;
const DEFAULT_LINE_H = 9.5;
const DAMPING = 0.984;
const WAVE_SPEED = 0.09;  // c² factor — tuned for visible but stable propagation

interface BullAsciiProps {
  /** Colour of the ASCII glyphs. Must be a real colour — canvas can't read CSS vars. */
  textColor?: string;
  /** Colour of the scan-line sweep. */
  sweepColor?: string;
  /** Animate the wave + sweep + mouse ripples. When false, paints one static frame. */
  animate?: boolean;
  /** CSS display size (px). The canvas renders at full resolution then scales down crisply. */
  displayWidth?: number;
  displayHeight?: number;
  /** Style overrides for the canvas element (e.g. margin). */
  style?: React.CSSProperties;
  /** Grid resolution. Fewer cols/rows = chunkier, bolder glyphs — better when shrunk small. */
  cols?: number;
  rows?: number;
  fontSize?: number;
  lineH?: number;
  /** Minimum glyph opacity. Raise it (e.g. 0.5) so a small mark reads dense and solid. */
  minAlpha?: number;
  /** Milliseconds between sweep passes. Lower = the sweep fires more often. */
  scanInterval?: number;
}

export default function BullAscii({
  textColor = '#f5f3ee',
  sweepColor = '#efb700',
  animate = true,
  displayWidth,
  displayHeight,
  style,
  cols = DEFAULT_COLS,
  rows = DEFAULT_ROWS,
  fontSize = DEFAULT_FONT_SIZE,
  lineH = DEFAULT_LINE_H,
  minAlpha = 0.05,
  scanInterval = 2200,
}: BullAsciiProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ col: number; row: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const COLS = cols;
    const ROWS = rows;
    const FONT_SIZE = fontSize;
    const LINE_H = lineH;

    ctx.font = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;
    const charW = ctx.measureText('M').width;

    canvas.width = Math.ceil(COLS * charW);
    canvas.height = Math.ceil(ROWS * LINE_H);

    let rafId = 0;
    let onMove: (e: MouseEvent) => void = () => {};
    let onLeave: () => void = () => {};
    let cancelled = false;

    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
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
      const SCAN_INTERVAL = scanInterval;
      const SCAN_SPEED = 28;

      // ── Render loop ──────────────────────────────────────────────────────
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
            const alpha = Math.max(minAlpha, Math.min(1.0, baseAlpha + wv * 0.22));

            const isScan = r === scanRow;
            ctx.globalAlpha = isScan ? Math.min(1, alpha * 1.7) : alpha;
            ctx.fillStyle = isScan ? sweepColor : textColor;

            ctx.fillText(char, c * charW, r * LINE_H + FONT_SIZE);
          }
        }

        ctx.globalAlpha = 1;
        if (animate) rafId = requestAnimationFrame(render);
      };

      // Static mode: paint a single frame and stop — no loop, no listeners.
      if (!animate) { render(0); return; }

      rafId = requestAnimationFrame(render);

      // ── Mouse tracking ───────────────────────────────────────────────────
      onMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const col = Math.max(0, Math.min(COLS - 1, Math.floor(((e.clientX - rect.left) / rect.width) * COLS)));
        const row = Math.max(0, Math.min(ROWS - 1, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)));
        mouseRef.current = { col, row };
      };
      onLeave = () => { mouseRef.current = null; };
      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('mouseleave', onLeave);
    };

    img.src = '/bull-logo.png';

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [textColor, sweepColor, animate, cols, rows, fontSize, lineH, minAlpha, scanInterval]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 auto 28px',
        ...(animate ? { cursor: 'crosshair' } : {}),
        ...(displayWidth != null ? { width: displayWidth } : {}),
        ...(displayHeight != null ? { height: displayHeight } : {}),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
