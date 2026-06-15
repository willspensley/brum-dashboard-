const LOCAL_URL = '/data/birmingham-wards.geojson';
const ARCGIS_URL =
  'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query?where=LAD22CD%3D%27E08000025%27&outFields=WD22CD%2CWD22NM&outSR=4326&f=geojson';

let cached: GeoJSON.FeatureCollection | null = null;
let inflight: Promise<GeoJSON.FeatureCollection> | null = null;

export async function fetchWardBoundaries(): Promise<GeoJSON.FeatureCollection> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(LOCAL_URL, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const geo = (await res.json()) as GeoJSON.FeatureCollection;
        if (geo?.features?.length) {
          cached = geo;
          return geo;
        }
      }
    } catch { /* fall through to ArcGIS */ }

    const res = await fetch(ARCGIS_URL, { signal: AbortSignal.timeout(18000) });
    if (!res.ok) throw new Error(`Ward boundary fetch failed: HTTP ${res.status}`);
    const geo = (await res.json()) as GeoJSON.FeatureCollection;
    if (!geo?.features?.length) throw new Error('Ward boundary fetch returned no features');
    cached = geo;
    return geo;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
