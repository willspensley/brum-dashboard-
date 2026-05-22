export async function fetchIMD(): Promise<{ map: Record<string, number>; lsoas: number; wards: number }> {
  const BASE = 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-lsoa-2021/records';
  let off = 0;
  const all: Record<string, unknown>[] = [];
  let total: number | null = null;

  while (true) {
    const url = `${BASE}?limit=100&offset=${off}&where=lad22cd%3D'E08000025'`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (total === null) total = j.total_count ?? j.nhits ?? 0;
    const recs: Record<string, unknown>[] = j.results ?? j.records ?? [];
    if (!recs.length) break;
    all.push(...recs);
    off += 100;
    if (all.length >= (total ?? 0)) break;
  }

  if (!all.length) throw new Error('no records');

  const gf = (r: Record<string, unknown>, ...ks: string[]): unknown => {
    for (const k of ks) {
      const v = r[k] ?? (r.fields as Record<string, unknown> | undefined)?.[k];
      if (v != null) return v;
    }
    return null;
  };

  const buckets: Record<string, number[]> = {};
  all.forEach(r => {
    const wc = gf(r, 'ward22cd', 'ward_code', 'wardcd', 'ward21cd') as string | null;
    const sc = gf(r, 'employment_score', 'employment_domain_score', 'emp_score');
    if (!wc || sc === null) return;
    if (!buckets[wc]) buckets[wc] = [];
    buckets[wc].push(parseFloat(sc as string));
  });

  const map: Record<string, number> = {};
  Object.entries(buckets).forEach(([c, v]) => {
    if (v.length) map[c] = v.reduce((a, b) => a + b, 0) / v.length;
  });

  return { map, lsoas: all.length, wards: Object.keys(map).length };
}
