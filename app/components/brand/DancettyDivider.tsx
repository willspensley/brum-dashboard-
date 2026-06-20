import type { CSSProperties } from 'react';

/**
 * Gold dancetty (zig-zag) divider — the Birmingham heraldic rule used between
 * major sections. Mirrors the divider on the About page.
 */
export default function DancettyDivider({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 8,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='8'%3E%3Cpath d='M0 6 L14 2 L28 6' fill='none' stroke='%23efb700' stroke-width='2'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '28px 8px',
        opacity: 0.8,
        ...style,
      }}
    />
  );
}
