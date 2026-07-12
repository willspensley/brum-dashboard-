// Agent fetch tool — the Two-Child Limit's footprint in Birmingham, from DWP's FINAL
// statistical release (April 2026; the policy was abolished 6 April 2026).
//
// Source: "Universal Credit claimants statistics on the two child limit policy, April
// 2026" data tables (UC admin data). Geography: parliamentary CONSTITUENCY + LA — no
// ward breakdown exists; the view must say so.
//
// Tables used (titles verified in the workbook):
//   12A households affected (LA) · 12B children in those households (LA) ·
//   12C children affected/denied an element (LA) · 12D households likely to gain (LA) ·
//   12E children in gaining households (LA) · 13A/13C/13D same by constituency.
// In every table the FIRST numeric after the area name is the Total column.
//
// DERIVED (labelled): annual £ gain = children affected × child element £292.81/month
// × 12. The child element rate is the official national rate (GOV.UK). The benefit cap
// means some households will not see the full gain.
//
//   Run:  node scripts/fetch-two-child.mjs  → writes proposals/two-child.proposal.json

import { writeFileSync, mkdirSync, readFileSync, createReadStream, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS_URL = 'https://assets.publishing.service.gov.uk/media/6a4cb35a4889d85e75ab40df/data-tables-universal-credit-statistics-two-child-limit-april-2026.ods';
const PUB_URL = 'https://www.gov.uk/government/statistics/universal-credit-claimants-statistics-on-the-two-child-limit-policy-april-2026';
const CHILD_ELEMENT_MONTH = 292.81;   // official UC child element rate, £/month (GOV.UK)

// Birmingham's 9 constituencies (2024 boundaries). Hodge Hill & Solihull North
// straddles the Solihull border — kept, labelled as such in the UI note.
const CONSTITUENCIES = [
  'Birmingham Edgbaston', 'Birmingham Erdington', 'Birmingham Hall Green and Moseley',
  'Birmingham Hodge Hill and Solihull North', 'Birmingham Ladywood', 'Birmingham Northfield',
  'Birmingham Perry Barr', 'Birmingham Selly Oak', 'Birmingham Yardley',
];

function cellsOf(rowXml) {
  const cells = [];
  const cellRe = /<table:(covered-table-cell|table-cell)([^>]*)(?:\/>|>([\s\S]*?)<\/table:\1>)/g;
  let m;
  while ((m = cellRe.exec(rowXml)) !== null) {
    if (m[1] === 'covered-table-cell') { cells.push(null); continue; }
    const attrs = m[2] ?? '';
    const vAttr = /office:value="([^"]+)"/.exec(attrs);
    const texts = [...(m[3] ?? '').matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)]
      .map(t => t[1].replace(/<[^>]+>/g, ''));
    const rep = /table:number-columns-repeated="(\d+)"/.exec(attrs);
    const n = rep ? Math.min(Number(rep[1]), 60) : 1;
    for (let i = 0; i < n; i++) cells.push(vAttr ? Number(vAttr[1]) : (texts.join(' ').trim() || null));
  }
  return cells;
}

// Scan content.xml once; for each wanted sheet collect rows whose first text cell is a
// wanted area name. Returns { sheet: { areaName: firstNumeric } }.
function scanSheets(contentPath, wantedSheets, wantedAreas) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(contentPath, { encoding: 'utf8', highWaterMark: 4 * 1024 * 1024 });
    let buf = '', current = null;
    const out = {};
    const firstNumeric = cells => cells.find(c => typeof c === 'number');

    stream.on('data', chunk => {
      buf += chunk;
      let pos = 0;
      while (true) {
        const tIdx = buf.indexOf('<table:table ', pos);
        const stopAt = tIdx === -1 ? buf.length : tIdx;
        if (current) {
          // harvest complete rows in [pos, stopAt)
          let rPos = pos;
          while (true) {
            const rs = buf.indexOf('<table:table-row', rPos);
            if (rs === -1 || rs >= stopAt) break;
            const re = buf.indexOf('</table:table-row>', rs);
            if (re === -1 || re >= stopAt) break;
            const cells = cellsOf(buf.slice(rs, re + 18));
            const name = typeof cells[0] === 'string' ? cells[0] : null;
            if (name && wantedAreas.has(name) && out[current][name] === undefined) {
              out[current][name] = firstNumeric(cells.slice(1)) ?? null;
            }
            rPos = re + 18;
          }
        }
        if (tIdx === -1) break;
        const nameM = /table:name="([^"]+)"/.exec(buf.slice(tIdx, tIdx + 400));
        current = nameM && wantedSheets.has(nameM[1]) ? nameM[1] : null;
        if (current && !out[current]) out[current] = {};
        pos = tIdx + 13;
      }
      // keep tail — enough for a split row/table tag
      const keepFrom = Math.max(0, buf.length - 2 * 1024 * 1024);
      buf = buf.slice(keepFrom);
    });
    stream.on('end', () => resolve(out));
    stream.on('error', reject);
  });
}

async function main() {
  const work = join(tmpdir(), 'brum-twochild');
  mkdirSync(work, { recursive: true });
  const odsPath = join(work, 'twochild.ods');
  const zipPath = join(work, 'twochild.zip');
  const outDirX = join(work, 'x');

  console.log('[2c] downloading DWP two-child limit tables…');
  const r = await fetch(ODS_URL, { signal: AbortSignal.timeout(180000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} downloading ODS`);
  writeFileSync(odsPath, Buffer.from(await r.arrayBuffer()));
  writeFileSync(zipPath, readFileSync(odsPath));
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDirX}' -Force`]);
  const contentPath = join(outDirX, 'content.xml');
  if (!existsSync(contentPath)) throw new Error('content.xml missing after expand');

  const wantedAreas = new Set(['Birmingham', ...CONSTITUENCIES]);
  const sheets = await scanSheets(contentPath, new Set(['12A', '12B', '12C', '12D', '12E', '13A', '13C', '13D']), wantedAreas);
  for (const s of ['12A', '12B', '12C', '12D', '12E', '13A', '13C', '13D']) {
    if (!sheets[s] || Object.keys(sheets[s]).length === 0) throw new Error(`sheet ${s} yielded no Birmingham rows — table layout may have changed`);
  }

  const city = {
    households_affected: sheets['12A'].Birmingham,
    children_in_households: sheets['12B'].Birmingham,
    children_affected: sheets['12C'].Birmingham,
    households_gaining: sheets['12D'].Birmingham,
    children_in_gaining: sheets['12E'].Birmingham,
    derived_annual_gain_m: Math.round(sheets['12C'].Birmingham * CHILD_ELEMENT_MONTH * 12 / 1e5) / 10,
  };
  for (const [k, v] of Object.entries(city)) if (v == null || Number.isNaN(v)) throw new Error(`city figure ${k} missing`);

  const constituencies = CONSTITUENCIES.map(name => {
    const affected = sheets['13A'][name];
    const children = sheets['13C'][name];
    const gaining = sheets['13D'][name];
    return {
      name,
      households_affected: affected ?? null,
      children_affected: children ?? null,
      households_gaining: gaining ?? null,
      derived_annual_gain_m: children != null ? Math.round(children * CHILD_ELEMENT_MONTH * 12 / 1e5) / 10 : null,
    };
  }).filter(c => c.households_affected != null);
  constituencies.sort((a, b) => b.households_affected - a.households_affected);

  // Cross-check: constituencies should roughly reproduce the LA total (Hodge Hill
  // straddles Solihull, so allow a small tolerance).
  const cSum = constituencies.reduce((s, c) => s + c.households_affected, 0);
  const drift = Math.abs(cSum - city.households_affected) / city.households_affected;
  console.log(`[2c] cross-check: constituency sum ${cSum.toLocaleString()} vs LA ${city.households_affected.toLocaleString()} (drift ${(drift * 100).toFixed(1)}%)`);
  if (drift > 0.05) throw new Error('constituency/LA drift > 5% — column mapping suspect, DO NOT publish');

  const sources = [
    { id: 'twoChild', label: 'Two-child limit statistics, April 2026 (final release)',
      publisher: 'Department for Work & Pensions', dataset: 'UC statistics on the two child limit policy',
      method: 'administrative — UC admin data', licence: 'Open Government Licence v3.0', as_of: 'April 2026',
      catalogueUrl: PUB_URL, apiUrl: ODS_URL },
  ];

  const proposal = {
    id: 'two-child', status: 'pending',
    title: 'Two-Child Limit — what abolition means for Birmingham',
    metric: 'households/children affected + derived £ gain',
    unit: 'households · children · £m/year (derived)',
    geography: 'constituency',
    generated: new Date().toISOString(),
    child_element_month: CHILD_ELEMENT_MONTH,
    city,
    constituencies,
    sources, source: sources[0],
    validation: {
      geography_level: 'parliamentary-constituency', ward_breakdown_available: false,
      constituencies_found: constituencies.length, constituencies_expected: CONSTITUENCIES.length,
      complete: constituencies.length === CONSTITUENCIES.length,
      la_cross_check_drift_pct: Math.round(drift * 1000) / 10,
      households_affected: city.households_affected, children_affected: city.children_affected,
      derived_annual_gain_m: city.derived_annual_gain_m,
    },
    raw_sample: [{ table: '12A', birmingham: sheets['12A'].Birmingham }, { table: '13A', ladywood: sheets['13A']['Birmingham Ladywood'] }],
  };

  mkdirSync(join(ROOT, 'proposals'), { recursive: true });
  writeFileSync(join(ROOT, 'proposals', 'two-child.proposal.json'), JSON.stringify(proposal, null, 2));

  // Boundary geojson for the map — BOUNDARIES ONLY, no statistics. Harvested from the
  // City Observatory constituency dataset (same 2024 names + E14 codes as the DWP
  // tables), the same pattern as public/data/wm-boroughs.geojson. Value-free reference
  // geometry, so it can publish directly; the stats still go through /review.
  const CONS_DS = 'number-of-people-on-universal-credit-birmingham-constituency';
  const consUrl = `https://www.cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/${CONS_DS}/records?limit=100&order_by=date%20DESC`;
  const consResp = await fetch(consUrl, { signal: AbortSignal.timeout(60000) });
  if (consResp.ok) {
    const consJson = await consResp.json();
    const byName = {};
    for (const rec of consJson.results ?? []) {
      const name = rec.arealabel;
      if (CONSTITUENCIES.includes(name) && rec.geo_shape?.geometry && !byName[name]) {
        byName[name] = { type: 'Feature', properties: { code: rec.areaidentifier, name }, geometry: rec.geo_shape.geometry };
      }
    }
    const features = Object.values(byName);
    if (features.length === CONSTITUENCIES.length) {
      mkdirSync(join(ROOT, 'public', 'data'), { recursive: true });
      writeFileSync(join(ROOT, 'public', 'data', 'birmingham-constituencies.geojson'), JSON.stringify({ type: 'FeatureCollection', features }));
      console.log(`[2c] ✓ boundaries written · ${features.length}/9 constituency polygons → public/data/birmingham-constituencies.geojson`);
    } else {
      console.warn(`[2c] ⚠ only ${features.length}/9 constituency polygons found — geojson NOT written`);
    }
  } else {
    console.warn(`[2c] ⚠ constituency boundary fetch failed (HTTP ${consResp.status}) — map will fall back gracefully`);
  }
  console.log(`[2c] ✓ proposal written · ${city.households_affected.toLocaleString()} households affected · ${city.children_affected.toLocaleString()} children denied an element · derived gain £${city.derived_annual_gain_m}m/yr`);
  constituencies.forEach(c => console.log(`[2c]   ${c.name.padEnd(44)} ${String(c.households_affected).padStart(6)} hh · ${String(c.children_affected).padStart(6)} children · £${c.derived_annual_gain_m}m/yr`));
}

main().catch(err => { console.error('[2c] FAILED:', err.message); process.exit(1); });
