const CRIME_URL =
  'https://api.birmingham.gov.uk/v1/Birmingham-City-Observatory/datasets/total-recorded-offences-excluding-fraud-per-1000-population-wmca/records?where=lad_name%3D%27Birmingham%27&limit=200&offset=0&lang=en';

export async function fetchCrime(): Promise<{
  map: Record<string, number>;
  count: number;
}> {
  const r = await fetch(CRIME_URL, { signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json() as { records?: { ward_code?: string; ward_name?: string; crime_rate?: number; value?: number }[] };
  const records = j.records ?? [];
  if (!records.length) throw new Error('empty');
  const map: Record<string, number> = {};
  records.forEach(rec => {
    const code = rec.ward_code;
    const rate = rec.crime_rate ?? rec.value;
    if (code && rate != null) map[code] = parseFloat(String(rate));
  });
  return { map, count: Object.keys(map).length };
}
