import type { CSSProperties, ReactNode } from 'react';

interface SectionHeaderProps {
  /** Gold uppercase mono kicker above the title. */
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Serif title size in px. */
  size?: number;
  /** Light panels (default) use ink text; dark panels (navy) use white. */
  tone?: 'light' | 'dark';
  style?: CSSProperties;
}

/**
 * Editorial section header — gold mono eyebrow + serif title + optional subtitle.
 * The repeatable Birmingham treatment for every panel heading.
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  size = 15,
  tone = 'light',
  style,
}: SectionHeaderProps) {
  const dark = tone === 'dark';
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {eyebrow && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--herald-gold)', marginBottom: 5 }}>
          {eyebrow}
        </div>
      )}
      <div style={{ fontFamily: 'var(--serif)', fontSize: size, fontWeight: 600, lineHeight: 1.2, color: dark ? '#fff' : 'var(--ink)' }}>
        {title}
      </div>
      {subtitle && (
        <p style={{ fontFamily: 'var(--sans)', fontSize: 11, margin: '4px 0 0', lineHeight: 1.45, color: dark ? 'rgba(255,255,255,.72)' : 'var(--muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
