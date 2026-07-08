// Build REAL ward-level crime for Birmingham from data.police.uk (open, no API key).
//
// Inputs : public/data/birmingham-wards.geojson  (69 official ward polygons, WD22CD)
//          lib/population.ts                      (real ONS mid-2024 ward populations)
// Output : public/data/crime-wards.json          (per-ward rate + categories, latest month)
//
// Run    : node scripts/fetch-crime-wards.mjs
//
// Method : for each ward, send its (simplified) boundary polygon to
//          data.police.uk /crimes-street/all-crime?poly=...&date=YYYY-MM, then
//          count + categorise the crimes returned and divide by ONS population to
//          get crimes per 1,000. data.police.uk does the point-in-polygon for us.
//
// NOTE   : polygons are decimated to keep the request URL within limits, so ward
//          boundaries are approximate (minor mis-assignment near edges). Good enough
//          for a first real cut; can be refined with proper polygon simplification.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_POLY_POINTS = 60;     // keep poly URL within data.police.uk limits
const DELAY_MS = 120;           // be polite between requests
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadPopulation() {
  const txt = readFileSync(join(ROOT, 'lib', 'population.ts'), 'utf8');
  const pop = {};
  const re = /ward_code:\s*['"](E05\d+)['"][^}]*?population:\s*(\d+)/g;
  let m;
  while ((m = re.exec(txt))) pop[m[1]] = Number(m[2]);
  return pop;
}

function wardRings(geom) {
  if (geom.type === 'Polygon') return [geom.coordinates[0]];
  if (geom.type === 'MultiPolygon') return geom.coordinates.map(p => p[0]);
  return [];
}

function toPolyParam(ring) {
  let pts = ring;
  if (pts.length > MAX_POLY_POINTS) {
    const step = Math.ceil(pts.length / MAX_POLY_POINTS);
    pts = pts.filter((_, i) => i % step === 0);
  }
  // data.police.uk wants lat,lng pairs; GeoJSON coords are [lng,lat]
  return pts.map(([lng, lat]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join(':');
}

async function fetchPoly(poly, date) {
  const url = `https://data.police.uk/api/crimes-street/all-crime?poly=${poly}&date=${date}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (res.status === 503) throw new Error('503 (area too large / >10k crimes)');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const upd = await (await fetch('https://data.police.uk/api/crime-last-updated')).json();
  const date = upd.date.slice(0, 7);
  console.log(`Latest data month: ${date}\n`);

  const geo = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'birmingham-wards.geojson'), 'utf8'));
  const pop = loadPopulation();
  console.log(`Wards: ${geo.features.length} | populations loaded: ${Object.keys(pop).length}\n`);

  const wards = [];
  let i = 0;
  for (const f of geo.features) {
    i++;
    const code = f.properties.WD22CD;
    const name = f.properties.WD22NM;
    const population = pop[code] ?? null;
    process.stdout.write(`[${String(i).padStart(2)}/${geo.features.length}] ${name.padEnd(28)} `);
    try {
      let total = 0;
      const categories = {};
      for (const ring of wardRings(f.geometry)) {
        const crimes = await fetchPoly(toPolyParam(ring), date);
        total += crimes.length;
        for (const c of crimes) categories[c.category] = (categories[c.category] || 0) + 1;
        await sleep(DELAY_MS);
      }
      const rate = population ? +((total / population) * 1000).toFixed(2) : null;
      wards.push({ ward_code: code, ward_name: name, population, crime_count: total, rate_per_1000: rate, categories });
      console.log(`${String(total).padStart(4)} crimes  ${rate ?? '—'}/1000`);
    } catch (e) {
      wards.push({ ward_code: code, ward_name: name, population, crime_count: null, rate_per_1000: null, categories: {}, error: e.message });
      console.log(`ERROR: ${e.message}`);
    }
  }

  const real = wards.filter(w => w.rate_per_1000 != null).sort((a, b) => b.rate_per_1000 - a.rate_per_1000);
  real.forEach((w, idx) => { w.rank = idx + 1; });

  const out = {
    generated: new Date().toISOString(),
    month: date,
    source: 'data.police.uk — West Midlands Police street-level crime, aggregated to 2022 wards by point-in-polygon',
    ward_count: wards.length,
    wards_with_data: real.length,
    wards,
  };
  writeFileSync(join(ROOT, 'public', 'data', 'crime-wards.json'), JSON.stringify(out, null, 2));

  console.log(`\n${real.length}/${wards.length} wards with real data → public/data/crime-wards.json`);
  console.log('Highest:', real.slice(0, 5).map(w => `${w.ward_name} ${w.rate_per_1000}`).join('  |  '));
  console.log('Lowest :', real.slice(-5).map(w => `${w.ward_name} ${w.rate_per_1000}`).join('  |  '));
}

main().catch(e => { console.error(e); process.exit(1); });
