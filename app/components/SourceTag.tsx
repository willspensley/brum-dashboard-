'use client';

import Tip from './Tip';
import { SOURCES } from '@/lib/sources';

/**
 * Compact inline provenance tag (e.g. "ONS · mid-2024"). Hover = full source +
 * as-of date; click = the /sources page anchored to this dataset. Reads from the
 * single registry in lib/sources.ts so it never drifts from the Sources page.
 */
export default function SourceTag({ id }: { id: string }) {
  const s = SOURCES[id];
  if (!s) return null;
  const tip = `${s.source} — ${s.publisher} (${s.datasetId}). As of ${s.asOf}. ${s.licence}. Click for full provenance & links.`;
  return (
    <Tip text={tip}>
      <a
        href={`/sources#${s.id}`}
        style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)',
          letterSpacing: '.04em', textDecoration: 'none',
          borderBottom: '1px dotted var(--border2)', whiteSpace: 'nowrap',
        }}
      >
        {s.short}
      </a>
    </Tip>
  );
}
