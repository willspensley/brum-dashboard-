// Crime — recorded offences per 1,000 population, Birmingham wards.
//
// Source: Birmingham City Observatory (OpenDataSoft v2.1 API). No API key required.
// Keyed by official ONS ward code (E05011118–E05011186), so it joins to lib/wards.ts.
//
// ⚠️ VERIFY BEFORE TRUSTING — the dataset slug + field names below are NOT yet
//    confirmed. Open this URL in a real browser (this sandbox can't reach the host
//    over TLS) and check the JSON:
//
//    https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/
//      total-recorded-offences-excluding-fraud-per-1000-population-wmca/records?limit=5
//
//    Confirm: (a) rows are Birmingham WARD-level (a ward_code like E05011118), and
//    (b) which field holds the rate. The "-wmca" slug may be combined-authority /
//    local-authority level with NO ward breakdown — if so, City Observatory can't
//    drive a ward map and crime must come from data.police.uk (spatial aggregation).
//    Update BASE / the field list below to match what the JSON actually shows.

const BASE =
  'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/' +
  'total-recorded-offences-excluding-fraud-per-1000-population-wmca/records';

export async function fetchCrime(): Promise<{ map: Record<string, number>; count: number }> {
  const url = `${BASE}?limit=100&where=lad_name%3D'Birmingham'`;
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`Crime HTTP ${r.status}`);
  const j = await r.json();
  const recs: Record<string, unknown>[] = j.results ?? j.records ?? [];
  if (!recs.length) throw new Error('empty');

  const gf = (rec: Record<string, unknown>, ...keys: string[]): unknown => {
    for (const k of keys) {
      const v = rec[k] ?? (rec.fields as Record<string, unknown> | undefined)?.[k];
      if (v != null) return v;
    }
    return null;
  };

  const map: Record<string, number> = {};
  recs.forEach(rec => {
    const code = gf(rec, 'ward_code', 'ward22cd', 'wardcd') as string | null;
    const rate = gf(rec, 'crime_rate', 'value', 'rate', 'offences_per_1000', 'total_recorded_offences_per_1000_population');
    if (code && rate != null) map[code as string] = parseFloat(String(rate));
  });
  return { map, count: Object.keys(map).length };
}
