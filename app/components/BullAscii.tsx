'use client';

import { useEffect, useRef, useCallback } from 'react';

// 11-level density ramp: empty → solid
const CHARS = [' ', '.', "'", ':', ';', '-', '=', '+', 'x', '#', '@'];

// Shimmer pools — characters cycle within their visual weight tier
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
const TICK_MS = 42;
const BASE_SHIMMER = 0.14;   // 14% of cells change per tick at rest
const MOUSE_RADIUS = 8;      // cells
const SCAN_INTERVAL = 2200;  // ms between scan sweeps
const SCAN_ROW_STEP = 28;    // ms per row during scan

export default function BullAscii() {
  const preRef = useRef<HTMLPreElement>(null);
  const mouseRef = useRef<{ col: number; row: number } | null>(null);
  const densityRef = useRef<number[][]>([]);
  const spansRef = useRef<HTMLSpanElement[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanRowRef = useRef(-1);

  const getMouseCell = useCallback((e: MouseEvent) => {
    const pre = preRef.current;
    if (!pre) return null;
    const rect = pre.getBoundingClientRect();
    const col = Math.max(0, Math.min(COLS - 1, Math.floor(((e.clientX - rect.left) / rect.width) * COLS)));
    const row = Math.max(0, Math.min(ROWS - 1, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)));
    return { col, row };
  }, []);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const img = new Image();

    img.onload = () => {
      // ── Sample image → density grid ─────────────────────────────────
      const W = COLS * SAMPLE_SCALE;
      const H = ROWS * SAMPLE_SCALE;
      const cvs = document.createElement('canvas');
      cvs.width = W; cvs.height = H;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);

      const density: number[][] = [];
      for (let r = 0; r < ROWS; r++) {
        const line: number[] = [];
        for (let c = 0; c < COLS; c++) {
          const px = c * SAMPLE_SCALE;
          const py = r * SAMPLE_SCALE;
          const data = ctx.getImageData(px, py, SAMPLE_SCALE, SAMPLE_SCALE).data;
          let total = 0;
          const n = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] / 255;
            total += ((data[i] + data[i + 1] + data[i + 2]) / 3) * a + 255 * (1 - a);
          }
          line.push(Math.round((1 - (total / n) / 255) * (CHARS.length - 1)));
        }
        density.push(line);
      }
      densityRef.current = density;

      // ── Build DOM ────────────────────────────────────────────────────
      pre.innerHTML = density
        .map(row =>
          `<span style="display:block">${row
            .map(d => {
              const ch = d === 0 ? '\u00a0' : CHARS[d];
              const w = d >= 8 ? 500 : d >= 5 ? 400 : 300;
              const op = d === 0 ? 0 : (0.1 + (d / 10) * 0.9).toFixed(2);
              return `<span data-d="${d}" style="font-weight:${w};opacity:${op}">${ch}</span>`;
            })
            .join('')}</span>`
        )
        .join('');

      spansRef.current = Array.from(pre.querySelectorAll<HTMLSpanElement>('[data-d]'));

      // ── Periodic scan-line sweep ─────────────────────────────────────
      // Sets scanRowRef to 0 every SCAN_INTERVAL ms,
      // then steps it forward each row in SCAN_ROW_STEP ms.
      const launchScan = () => {
        scanRowRef.current = 0;
        let r = 0;
        const step = setInterval(() => {
          r++;
          scanRowRef.current = r;
          if (r >= ROWS) { clearInterval(step); scanRowRef.current = -1; }
        }, SCAN_ROW_STEP);
      };
      const scanTimer = setInterval(launchScan, SCAN_INTERVAL);
      // Kick off first scan quickly
      setTimeout(launchScan, 400);

      // ── Main animation tick ──────────────────────────────────────────
      tickRef.current = setInterval(() => {
        const spans = spansRef.current;
        const dens = densityRef.current;
        const mouse = mouseRef.current;
        const scanRow = scanRowRef.current;

        for (let i = 0; i < spans.length; i++) {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const d = dens[row][col];
          if (d === 0) continue;

          // Mouse influence
          let rate = BASE_SHIMMER;
          let widePool = false;
          if (mouse) {
            const dr = row - mouse.row;
            const dc = col - mouse.col;
            const dist = Math.sqrt(dr * dr + dc * dc);
            if (dist < MOUSE_RADIUS) {
              const influence = 1 - dist / MOUSE_RADIUS;
              rate = BASE_SHIMMER + influence * 0.75;
              widePool = dist < MOUSE_RADIUS * 0.45;
            }
          }

          // Scan-line row gets a big surge
          if (row === scanRow) rate = Math.max(rate, 0.72);

          if (Math.random() > rate) continue;

          let pool: string[];
          if (widePool) {
            // Near cursor: scramble across ±3 density levels
            const lo = Math.max(1, d - 3);
            const hi = Math.min(CHARS.length - 1, d + 2);
            pool = CHARS.slice(lo, hi + 1);
          } else if (row === scanRow) {
            // Scan row: briefly use lighter chars for the sweep flash
            const lo = Math.max(0, d - 4);
            pool = CHARS.slice(lo, d + 1);
          } else {
            pool = SHIMMER[d];
          }

          spans[i].textContent = pool[Math.floor(Math.random() * pool.length)];
        }
      }, TICK_MS);

      // Cleanup scan timer alongside tick
      const origCleanup = () => clearInterval(scanTimer);
      pre.dataset.scanCleanup = 'true';
      (pre as HTMLPreElement & { _scanCleanup?: () => void })._scanCleanup = origCleanup;
    };

    img.onerror = () => {
      // Fallback: show a simple text placeholder if image fails
      if (pre) pre.textContent = '';
    };

    img.src = '/bull-logo.png';

    // ── Mouse tracking ───────────────────────────────────────────────
    const onMove = (e: MouseEvent) => { mouseRef.current = getMouseCell(e); };
    const onLeave = () => { mouseRef.current = null; };
    pre.addEventListener('mousemove', onMove);
    pre.addEventListener('mouseleave', onLeave);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      (pre as HTMLPreElement & { _scanCleanup?: () => void })._scanCleanup?.();
      pre.removeEventListener('mousemove', onMove);
      pre.removeEventListener('mouseleave', onLeave);
    };
  }, [getMouseCell]);

  return (
    <pre
      ref={preRef}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        lineHeight: '1.05',
        whiteSpace: 'pre',
        userSelect: 'none',
        color: 'var(--ink)',
        margin: '0 0 28px',
        letterSpacing: '0',
        cursor: 'crosshair',
      }}
      aria-hidden="true"
    />
  );
}
