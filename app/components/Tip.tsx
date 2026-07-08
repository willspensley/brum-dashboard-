'use client';

import { cloneElement, isValidElement, useCallback, useRef, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

interface TipProps {
  /** Plain-language explanation shown on hover / focus. */
  text: string;
  /** A single host element (e.g. a stat tile div) to attach the explainer to. */
  children: ReactElement;
}

/**
 * Editorial hover/focus explainer for stat tiles. Wraps a single element and
 * shows a styled popover describing what the metric means.
 *
 * The popover is position:fixed so it escapes the scrolling detail panel
 * (`.rcol`, overflow-y:auto) instead of being clipped. A subtle ⓘ affordance is
 * drawn by CSS (`.has-tip::after`); the whole tile is the hover/focus target.
 */
export default function Tip({ text, children }: TipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const nodeRef = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const WIDTH = 244;
    let left = r.left;
    if (left + WIDTH > window.innerWidth - 12) left = window.innerWidth - 12 - WIDTH;
    if (left < 12) left = 12;
    const next: CSSProperties = { width: WIDTH, left };
    // Flip above the tile when there isn't room below (tiles near the fold).
    if (window.innerHeight - r.bottom < 150) next.bottom = window.innerHeight - r.top + 8;
    else next.top = r.bottom + 8;
    setPos(next);
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  if (!isValidElement(children)) return children;

  const child = children as ReactElement<{ className?: string; style?: CSSProperties }>;
  const className = ['has-tip', child.props.className].filter(Boolean).join(' ');

  return (
    <>
      {cloneElement(child, {
        ref: (n: HTMLElement | null) => { nodeRef.current = n; },
        className,
        tabIndex: 0,
        'aria-label': text,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        style: { cursor: 'help', ...child.props.style },
      } as Record<string, unknown>)}
      {open && <span className="tip-pop" role="tooltip" style={pos}>{text}</span>}
    </>
  );
}
