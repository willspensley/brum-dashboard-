import type { ReactNode } from 'react';

interface ScoringNoteProps {
  /** Gold mono kicker, e.g. "How this is scored". */
  label: string;
  /** Plain-language description of what's on screen / how it's ranked. */
  children: ReactNode;
}

/**
 * Small always-visible callout that sits at the top of a dashboard view and
 * explains the scoring / ranking the analyst is looking at. The repeatable
 * Birmingham treatment: gold ⓘ marker + mono kicker + a line of sans copy.
 */
export default function ScoringNote({ label, children }: ScoringNoteProps) {
  return (
    <div className="scoring-note">
      <span className="scoring-note-mark" aria-hidden="true">i</span>
      <div>
        <div className="scoring-note-lbl">{label}</div>
        <p className="scoring-note-txt">{children}</p>
      </div>
    </div>
  );
}
