// Agent fetch tool — the Constituency Money Map: DWP's ACTUAL benefit expenditure for
// Birmingham's 9 parliamentary constituencies (2024 boundaries), by benefit.
//
// Source: DWP "Benefit expenditure and caseload tables 2025" —
//   benefit-expenditure-by-parliamentary-constituency ODS (real accounting outturn, £m nominal).
//
// What the workbook honestly supports (verified 2026-07-12):
//   • Year sheet "2024-25": every benefit × every constituency (2024 boundaries),
//     WITH a per-row Total → per-constituency checksum validation.
//   • "UC_(PC24)" by-benefit sheet: UC per constituency 2019/20 → 2024/25 (6 years).
//   • DWP did NOT recalculate the long 2010-era history onto 2024 boundaries for the
//     other benefits (mostly 2023/24+ only) — so no long trends are shown, and we say so.
//
//   Run:  node scripts/fetch-constituency-money.mjs → writes proposals/constituency-money.proposal.json
// Writes ONLY to /proposals — publishing requires a human Accept in /review.

import { writeFileSync, mkdirSync, readFileSync, createReadStream, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS_URL = 'https://assets.publishing.service.gov.uk/media/693ffc50c72b0f8ccf33d788/benefit-expenditure-by-parliamentary-constituency-2024-25.ods';
const PUB_URL = 'https://www.gov.uk/government/publications/benefit-expenditure-and-caseload-tables-2025';
const YEAR_SHEET = '2024-25';
const YEAR_LABEL = '2024/25';
const UC_SHEET = 'UC_(PC24)';

// Birmingham's 9 constituencies, 2024 boundaries — codes match our boundaries geojson
// (public/data/birmingham-constituencies.geojson) and the two-child dataset.
const CONS = {
  E14001092: 'Birmingham Edgbaston',
  E14001093: 'Birmingham Erdington',
  E14001094: 'Birmingham Hall Green and Moseley',
  E14001095: 'Birmingham Hodge Hill and Solihull North',
  E14001096: 'Birmingham Ladywood',
  E14001097: 'Birmingham Northfield',
  E14001098: 'Birmingham Perry Barr',
  E14001099: 'Birmingham Selly Oak',
  E14001100: 'Birmingham Yardley',
};

const ALIASES = {
  uc: [/universal credit/i], sp: [/state pension/i, /retirement pension/i], hb: [/housing benefit/i],
  pip: [/personal independence/i], esa: [/employment and support/i], dla: [/disability living/i],
  jsa: [/jobseeker/i], is: [/income support/i], pc: [/pension credit/i], ca: [/carer'?s allowance/i],
  aa: [/attendance allowance/i], wfp: [/winter fuel/i], bb: [/bereavement/i], dhp: [/discretionary housing/i],
  sda: [/severe disablement/i],
};
const LABELS = {
  uc: 'Universal Credit', sp: 'State Pension', hb: 'Housing Benefit', pip: 'Personal Independence Payment',
  esa: 'Employment & Support Allowance', dla: 'Disability Living Allowance', jsa: "Jobseeker's Allowance",
  is: 'Income Support', pc: 'Pension Credit', ca: "Carer's Allowance", aa: 'Attendance Allowance',
  wfp: 'Winter Fuel Payments', bb: 'Bereavement Support', dhp: 'Discretionary Housing Payments',
  sda: 'Severe Disablement Allowance',
};
function canonicalId(label) {
  for (const [id, res] of Object.entries(ALIASES)) if (res.some(re => re.test(label))) return id;
  return null;
}

function cellsOf(rowXml) {
  const cells = [];
  const cellRe = /<table:(covered-table-cell|table-cell)([^>]*)(?:\/>|>([\s\S]*?)<\/table:\1>)/g;
  let m;
  while ((m = cellRe.exec(rowXml)) !== null) {
    if (m[1] === 'covered-table-cell') { cells.push(null); continue; }
    const attrs = m[2] ?? '';
    const vAttr = /office:value="([^"]+)"/.exec(attrs);
    const texts = [...(m[3] ?? '').matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)]
      .map(t => t[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'));
    const rep = /table:number-columns-repeated="(\d+)"/.exec(attrs);
    const n = rep ? Math.min(Number(rep[1]), 60) : 1;
    for (let i = 0; i < n; i++) cells.push(vAttr ? Number(vAttr[1]) : (texts.join(' ').trim() || null));
  }
  return cells;
}
const asNum = c => {
  if (typeof c === 'number') return c;
  if (typeof c === 'string' && c.trim() !== '' && !Number.isNaN(Number(c.replace(/,/g, '')))) return Number(c.replace(/,/g, ''));
  return null;
};

// Capture rows from named sheets: header rows (contain "PC Code") + rows whose first
// cell is one of the wanted codes / GREAT BRITAIN. Exact-cursor buffering (no re-scan).
function scanSheets(contentPath, wantedSheets) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(contentPath, { encoding: 'utf8', highWaterMark: 4 * 1024 * 1024 });
    let buf = '', current = null;
    const out = {};
    function handleRow(rowXml) {
      if (!current) return;
      const slot = out[current];
      const cells = cellsOf(rowXml);
      const first = cells.find(c => c != null && c !== '');
      if (typeof first !== 'string') return;
      if (!slot.header && /^pc code$/i.test(first.trim())) slot.header = cells;
      else if (CONS[first]) (slot.rows[first] = slot.rows[first] ?? cells);
      else if (!slot.gb && /^great britain$/i.test(first.trim())) slot.gb = cells;
    }
    function pump(isEnd) {
      let cur = 0;
      while (true) {
        const tIdx = buf.indexOf('<table:table ', cur);
        const rIdx = buf.indexOf('<table:table-row', cur);
        if (tIdx === -1 && rIdx === -1) { cur = Math.max(cur, buf.length - 20); break; }
        if (tIdx !== -1 && (rIdx === -1 || tIdx < rIdx)) {
          if (buf.length - tIdx < 500 && !isEnd) { cur = tIdx; break; }
          const nameM = /table:name="([^"]+)"/.exec(buf.slice(tIdx, tIdx + 500));
          current = nameM && wantedSheets.has(nameM[1]) ? nameM[1] : null;
          if (current && !out[current]) out[current] = { rows: {} };
          cur = tIdx + 13;
          continue;
        }
        const rEnd = buf.indexOf('</table:table-row>', rIdx);
        if (rEnd === -1) { cur = rIdx; break; }
        handleRow(buf.slice(rIdx, rEnd + 18));
        cur = rEnd + 18;
      }
      buf = buf.slice(cur);
    }
    stream.on('data', chunk => { buf += chunk; pump(false); });
    stream.on('end', () => { pump(true); resolve(out); });
    stream.on('error', reject);
  });
}

// Align a constituency row against the year-sheet header (same backtracking +
// cluster-consistency + total-checksum discipline as the LA parser).
function alignRow(header, dataRow) {
  const tIdx = header.findIndex(c => typeof c === 'string' && /^total$/i.test(String(c).trim()));
  if (tIdx === -1) return null;
  const segs = [];
  for (let i = tIdx + 1; i < header.length; i++) {
    const c = header[i];
    if (c == null || c === '' || typeof c !== 'string') continue;
    if (/^of which/i.test(c.trim())) { if (segs.length) segs[segs.length - 1].ow++; }
    else segs.push({ label: c.trim(), ow: 0 });
  }
  if (!segs.length) return null;
  const nums = [];
  let total = null;
  for (const c of dataRow) {
    const v = asNum(c);
    if (v == null) continue;
    if (total == null) { total = v; continue; }
    nums.push(v);
  }
  if (total == null || !nums.length) return null;
  const tol = Math.max(0.5, total * 0.005);
  const memo = new Set();
  function solve(k, p, acc, sum) {
    if (k === segs.length) {
      if (nums.length - p > 3) return null;
      if (Math.abs(sum - total) <= tol) return { acc, ucExcluded: false };
      const ucSeg = acc.find(a => canonicalId(a.label) === 'uc');
      if (ucSeg && Math.abs(sum - ucSeg.value - total) <= tol) return { acc, ucExcluded: true };
      return null;
    }
    const key = `${k}:${p}:${Math.round(sum * 10)}`;
    if (memo.has(key)) return null;
    if (p < nums.length) {
      const value = nums[p];
      for (let j = segs[k].ow; j >= 0; j--) {
        if (p + 1 + j > nums.length) continue;
        if (j > 0) {
          const owSum = nums.slice(p + 1, p + 1 + j).reduce((s, v) => s + v, 0);
          if (Math.abs(owSum - value) > Math.max(0.5, value * 0.08)) continue;
        }
        const r = solve(k + 1, p + 1 + j, [...acc, { label: segs[k].label, value, owOk: j > 0 }], sum + value);
        if (r) return r;
      }
    }
    const rSkip = solve(k + 1, p, acc, sum);
    if (rSkip) return rSkip;
    memo.add(key);
    return null;
  }
  const sol = solve(0, 0, [], 0);
  if (!sol) return null;
  const byId = {};
  for (const a of sol.acc) {
    if (a.owOk === false) {
      const twin = sol.acc.find(b => b !== a && b.value === a.value && b.owOk);
      if (twin) continue;   // workbook duplicate defect — withhold
    }
    const id = canonicalId(a.label);
    if (id && byId[id] == null) byId[id] = Math.round(a.value * 100) / 100;
  }
  const trueTotal = sol.ucExcluded ? total + (byId.uc ?? 0) : total;
  return { total: Math.round(trueTotal * 100) / 100, components: byId };
}

async function main() {
  const work = join(tmpdir(), 'brum-benexp-pc');
  mkdirSync(work, { recursive: true });
  const odsPath = join(work, 'benexp-pc.ods');
  const zipPath = join(work, 'benexp-pc.zip');
  const outDirX = join(work, 'x');

  console.log('[con£] downloading DWP expenditure-by-constituency workbook…');
  try {
    const r = await fetch(ODS_URL, { signal: AbortSignal.timeout(180000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(odsPath, Buffer.from(await r.arrayBuffer()));
    console.log(`[con£] downloaded ${(readFileSync(odsPath).length / 1e6).toFixed(1)} MB`);
  } catch (e) {
    if (existsSync(odsPath)) console.warn(`[con£] ⚠ download failed (${e.message}) — reusing previous copy`);
    else throw e;
  }
  // Archive our own copy alongside the LA workbook.
  mkdirSync(join(ROOT, 'archive'), { recursive: true });
  writeFileSync(join(ROOT, 'archive', 'benefit-expenditure-by-parliamentary-constituency-2024-25.ods'), readFileSync(odsPath));
  writeFileSync(zipPath, readFileSync(odsPath));
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDirX}' -Force`]);
  const contentPath = join(outDirX, 'content.xml');
  if (!existsSync(contentPath)) throw new Error('content.xml missing after expand');

  console.log('[con£] scanning sheets…');
  const sheets = await scanSheets(contentPath, new Set([YEAR_SHEET, UC_SHEET]));
  const ys = sheets[YEAR_SHEET];
  const us = sheets[UC_SHEET];
  if (!ys?.header) throw new Error(`no header found on year sheet ${YEAR_SHEET}`);
  if (!us?.header) throw new Error(`no header found on ${UC_SHEET}`);

  // ── Latest-year composition per constituency (checksum-validated per row) ────
  const constituencies = [];
  for (const [code, name] of Object.entries(CONS)) {
    const row = ys.rows[code];
    if (!row) { console.warn(`[con£] ⚠ ${name}: no row on ${YEAR_SHEET}`); continue; }
    const aligned = alignRow(ys.header, row);
    if (!aligned) { console.warn(`[con£] ⚠ ${name}: checksum failed — withheld`); continue; }
    constituencies.push({ code, name, total_m: aligned.total, benefits: aligned.components });
  }
  constituencies.sort((a, b) => b.total_m - a.total_m);
  const citySum = constituencies.reduce((s, c) => s + c.total_m, 0);

  // Soft cross-check vs the LA workbook's Birmingham total (constituencies straddle
  // the LA boundary — Hodge Hill & Solihull North — so exact equality is impossible).
  const laTotal = 5414.4;
  const drift = Math.abs(citySum - laTotal) / laTotal;
  console.log(`[con£] cross-check: 9-constituency sum £${citySum.toFixed(1)}m vs Birmingham LA £${laTotal}m (drift ${(drift * 100).toFixed(1)}% — boundary straddle expected)`);
  if (drift > 0.12) throw new Error('constituency sum drifts >12% from the LA total — mapping suspect, DO NOT publish');

  // ── UC trend 2019/20 → 2024/25 per constituency (PC24 sheet) ─────────────────
  const ucYears = us.header.filter(c => typeof c === 'string' && /^\d{4}\/\d{2}$/.test(c.trim())).map(c => c.trim());
  const ucTrends = {};
  for (const [code, name] of Object.entries(CONS)) {
    const row = us.rows[code];
    if (!row) { console.warn(`[con£] ⚠ ${name}: no row on ${UC_SHEET}`); continue; }
    const numsAll = row.map(asNum).filter(v => v != null);
    // values = last N numerics matching the year count (code col is text; no total col)
    const vals = numsAll.slice(-ucYears.length).map(v => Math.round(v * 100) / 100);
    ucTrends[code] = vals;
  }
  // Consistency: UC_(PC24) 2024/25 must match the year sheet's UC per constituency.
  for (const c of constituencies) {
    const trendLast = ucTrends[c.code]?.at(-1);
    const yearUc = c.benefits.uc;
    if (trendLast != null && yearUc != null && Math.abs(trendLast - yearUc) > Math.max(0.5, yearUc * 0.01)) {
      throw new Error(`UC cross-check failed for ${c.name}: trend £${trendLast}m ≠ year sheet £${yearUc}m — DO NOT publish`);
    }
  }
  console.log(`[con£] ✓ UC trend cross-check: ${UC_SHEET} matches the ${YEAR_SHEET} sheet for all constituencies`);

  const sources = [
    { id: 'constituencyMoney', label: `Benefit expenditure by parliamentary constituency workbook (ODS) — sheet "${YEAR_SHEET}" + "${UC_SHEET}", 2024 boundaries`,
      publisher: 'Department for Work & Pensions', dataset: 'benefit-expenditure-by-parliamentary-constituency-2024-25.ods',
      method: 'administrative — accounting outturn', licence: 'Open Government Licence v3.0', as_of: YEAR_LABEL,
      catalogueUrl: ODS_URL, apiUrl: ODS_URL },
    { id: 'constituencyMoneyPage', label: 'DWP publication page (Benefit expenditure and caseload tables 2025)',
      publisher: 'Department for Work & Pensions', dataset: 'Collection page', method: 'reference',
      licence: 'Open Government Licence v3.0', as_of: YEAR_LABEL, catalogueUrl: PUB_URL, apiUrl: PUB_URL },
  ];

  const proposal = {
    id: 'constituency-money', status: 'pending',
    title: 'The Constituency Money Map — DWP £ by constituency',
    metric: 'DWP benefit expenditure by benefit per constituency, £m nominal',
    unit: '£ million / year',
    geography: 'constituency',
    generated: new Date().toISOString(),
    year: YEAR_LABEL,
    benefit_labels: LABELS,
    uc_years: ucYears,
    city: { sum_m: Math.round(citySum * 10) / 10, la_total_m: laTotal, drift_pct: Math.round(drift * 1000) / 10 },
    constituencies: constituencies.map(c => ({ ...c, uc_trend: ucTrends[c.code] ?? null })),
    sources, source: sources[0],
    validation: {
      geography_level: 'parliamentary-constituency', ward_breakdown_available: false,
      constituencies_found: constituencies.length, constituencies_expected: 9,
      complete: constituencies.length === 9,
      per_row_checksums_passed: constituencies.length,
      city_sum_m: Math.round(citySum * 10) / 10, la_cross_check_drift_pct: Math.round(drift * 1000) / 10,
      uc_trend_years: ucYears.length,
    },
    raw_sample: [{ sheet: YEAR_SHEET, header_first_cells: ys.header.filter(c => c).slice(0, 12) }],
  };

  mkdirSync(join(ROOT, 'proposals'), { recursive: true });
  writeFileSync(join(ROOT, 'proposals', 'constituency-money.proposal.json'), JSON.stringify(proposal, null, 2));
  console.log(`[con£] ✓ proposal written · ${constituencies.length}/9 constituencies · city sum £${citySum.toFixed(0)}m · ${YEAR_LABEL}`);
  constituencies.forEach(c => console.log(`[con£]   ${c.name.replace('Birmingham ', '').padEnd(32)} £${String(c.total_m.toFixed(0)).padStart(5)}m · UC £${c.benefits.uc ?? '—'}m · SP £${c.benefits.sp ?? '—'}m · PIP £${c.benefits.pip ?? '—'}m`));
}

main().catch(err => { console.error('[con£] FAILED:', err.message); process.exit(1); });
