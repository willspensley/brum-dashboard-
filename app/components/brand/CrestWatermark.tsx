import type { CSSProperties } from 'react';

interface CrestWatermarkProps {
  /** Image source. Defaults to the Birmingham coat of arms; pass the flag for variety. */
  src?: string;
  width?: number;
  opacity?: number;
  /** Positioning overrides (top/right/bottom/left/transform). Parent must be position:relative. */
  style?: CSSProperties;
}

/**
 * Faded heraldic watermark — the coat of arms (or flag) bled behind a panel.
 * Part of the Birmingham brand chrome. Parent must be position:relative + overflow:hidden.
 */
export default function CrestWatermark({
  src = '/assets/birmingham-coat-of-arms.png',
  width = 300,
  opacity = 0.05,
  style,
}: CrestWatermarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{ position: 'absolute', pointerEvents: 'none', width, opacity, ...style }}
    />
  );
}
