export interface NeetCityData {
  bham_neet_pct: number | null;
  bham_year: string;
  wmca_neet_pct: number | null;
  source: 'live' | 'cached';
}

const NEET_FALLBACK: NeetCityData = {
  bham_neet_pct: 6.1,   // DfE NCCIS 2022/23 Birmingham 16–17 NEET %
  bham_year: '2022/23',
  wmca_neet_pct: 5.4,
  source: 'cached',
};

function gf(r: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = r[k] ?? (r.fields as Record<string, unknown> | undefined)?.[k];
    if (v != null) return v;
  }
  return null;
}

export async function fetchNEETCity(): Promise<NeetCityData> {
  try {
    const url =
      'https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/percentage-neet-16-17-year-olds-wmca/records?limit=100';
    const r = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json() as Record<string, unknown>;
    const records = (j.results ?? j.records ?? []) as Record<string, unknown>[];
    if (!records.length) throw new Error('empty');

    const bham = records.find(rec => {
      const name = String(gf(rec, 'local_authority_name', 'la_name', 'area_name', 'lad_name', 'name') ?? '').toLowerCase();
      return name.includes('birmingham');
    });

    const pctRaw = bham ? gf(bham, 'percentage_neet', 'neet_percentage', 'pct_neet', 'value', 'percent') : null;
    const yearRaw = bham ? gf(bham, 'date', 'year', 'period', 'academic_year') : null;

    const vals = records
      .map(rec => parseFloat(String(gf(rec, 'percentage_neet', 'neet_percentage', 'pct_neet', 'value', 'percent') ?? '')))
      .filter(v => !isNaN(v) && v > 0 && v < 100);
    const wmcaAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

    return {
      bham_neet_pct: pctRaw != null ? parseFloat(String(pctRaw)) : null,
      bham_year: String(yearRaw ?? '2022/23'),
      wmca_neet_pct: wmcaAvg ? parseFloat(wmcaAvg.toFixed(1)) : null,
      source: 'live',
    };
  } catch {
    return NEET_FALLBACK;
  }
}

// NOMIS NM_162_1, age=1 (16–24), ward-level youth claimant rate
export async function fetchYouthClaimants(): Promise<{ map: Record<string, number>; count: number }> {
  const url =
    'https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.json?geography=1946157186TYPE448&date=latest&gender=0&age=1&measure=2&measures=20100';
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json() as Record<string, unknown>;
  const obs = (j.obs ?? j.data ?? []) as Record<string, unknown>[];
  if (!obs.length) throw new Error('empty');
  const map: Record<string, number> = {};
  obs.forEach(o => {
    const geo = o.geography as Record<string, unknown> | undefined;
    const val = o.obs_value as Record<string, unknown> | undefined;
    const c = geo?.geogcode ?? geo?.code;
    const v = val?.value ?? o.value;
    if (c && v != null) map[c as string] = parseFloat(v as string);
  });
  return { map, count: Object.keys(map).length };
}
