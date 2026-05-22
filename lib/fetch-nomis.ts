export async function fetchNOMIS(): Promise<{ map: Record<string, number>; date: string; count: number }> {
  const url = 'https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.json?geography=1946157186TYPE448&date=latest&gender=0&age=0&measure=2&measures=20100';
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const obs: Record<string, unknown>[] = j.obs ?? j.data ?? [];
  if (!obs.length) throw new Error('empty');
  const map: Record<string, number> = {};
  obs.forEach((o: Record<string, unknown>) => {
    const geo = o.geography as Record<string, unknown> | undefined;
    const val = o.obs_value as Record<string, unknown> | undefined;
    const c = geo?.geogcode ?? geo?.code;
    const v = val?.value ?? o.value;
    if (c && v != null) map[c as string] = parseFloat(v as string);
  });
  const date = (obs[0] as Record<string, unknown>)?.date as Record<string, string> | undefined;
  return { map, date: date?.description ?? 'latest', count: Object.keys(map).length };
}
