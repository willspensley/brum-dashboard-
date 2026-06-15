export async function fetchGVA(): Promise<{
  map: Record<string, number>;
  popMap: Record<string, number>;
  count: number;
  year: number;
}> {
  // Fetch without a year filter, sorted newest first — picks up 2023/2024 data automatically when City Observatory publishes it
  const gvaUrl = 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/gross-value-added-gva-all-industries-birmingham-wards/records?limit=100&select=ward_name,ward_code,gva_total_millions,year&order_by=year%20desc';
  const popUrl = 'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-age-birmingham-wards/records?limit=100&select=ward_code,total_population';

  const [gr, pr] = await Promise.all([
    fetch(gvaUrl, { signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } }),
    fetch(popUrl, { signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } }),
  ]);
  if (!gr.ok) throw new Error(`GVA HTTP ${gr.status}`);
  if (!pr.ok) throw new Error(`Pop HTTP ${pr.status}`);

  const gj = await gr.json();
  const pj = await pr.json();
  const allGvs: Record<string, unknown>[] = gj.results ?? gj.records ?? [];
  const pps: Record<string, unknown>[] = pj.results ?? pj.records ?? [];
  if (!allGvs.length || !pps.length) throw new Error('empty');

  // Use only the most recent year present in the dataset
  const latestYear = Math.max(...allGvs.map(r => {
    const f = (r.fields ?? r) as Record<string, unknown>;
    return parseInt(f.year as string) || 0;
  }));
  const gvs = allGvs.filter(r => {
    const f = (r.fields ?? r) as Record<string, unknown>;
    return parseInt(f.year as string) === latestYear;
  });

  const popMap: Record<string, number> = {};
  pps.forEach(r => {
    const f = (r.fields ?? r) as Record<string, unknown>;
    if (f.ward_code && f.total_population) popMap[f.ward_code as string] = parseFloat(f.total_population as string);
  });

  const map: Record<string, number> = {};
  gvs.forEach(r => {
    const f = (r.fields ?? r) as Record<string, unknown>;
    if (f.ward_code && f.gva_total_millions && popMap[f.ward_code as string]) {
      const perHead = (parseFloat(f.gva_total_millions as string) * 1e6) / popMap[f.ward_code as string] / 1000;
      map[f.ward_code as string] = parseFloat(perHead.toFixed(1));
    }
  });

  return { map, popMap, count: Object.keys(map).length, year: latestYear };
}
