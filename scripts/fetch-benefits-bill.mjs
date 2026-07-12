// Agent fetch tool — Birmingham's ACTUAL DWP benefit expenditure by benefit ("the
// Benefits Bill"). Source: DWP "Benefit expenditure and caseload tables 2025" —
// benefit-expenditure-by-local-authority ODS (real accounting outturn, £m nominal).
//
// HONESTY: this is LOCAL-AUTHORITY level. Ward-level £ does not exist anywhere —
// DWP does not publish it. The view must say so. Excludes Child Benefit (HMRC) and
// council-administered support.
//
// Method: download the ODS (a zip), expand via PowerShell, stream content.xml, find
// the requested year sheet's Birmingham row (cells parsed INCLUDING covered cells so
// merged headers don't misalign), map columns by verified positions, then VALIDATE by
// summing the components against the workbook's own Total column — abort on mismatch.
//
//   Run:  node scripts/fetch-benefits-bill.mjs  → writes proposals/benefits-bill.proposal.json

import { writeFileSync, mkdirSync, readFileSync, createReadStream, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS_URL = 'https://assets.publishing.service.gov.uk/media/693ffb536a12691d48491fb3/benefit-expenditure-by-local-authority-2024-25.ods';
const YEAR_SHEET = '2024-25';
const YEAR_LABEL = '2024/25';
const PUB_URL = 'https://www.gov.uk/government/publications/benefit-expenditure-and-caseload-tables-2025';

// Column positions in the year sheet's Birmingham row (0-indexed, covered cells counted).
// Verified 2026-07-08 against the 2024-25 sheet: the mapped components sum to the
// Total column to within £0.5m. Re-verified at every run by the sum check below.
const COLS = [
  { idx: 3,  id: 'aa',   label: 'Attendance Allowance',            group: 'pensioner',   note: 'Disability costs, state-pension age' },
  { idx: 4,  id: 'bb',   label: 'Bereavement Support',             group: 'mixed' },
  { idx: 5,  id: 'ca',   label: "Carer's Allowance",               group: 'working-age', note: 'Full-time carers (35+ hrs/week)' },
  { idx: 6,  id: 'dla',  label: 'Disability Living Allowance',     group: 'mixed',       note: 'Mostly children (legacy for adults)' },
  { idx: 10, id: 'dhp',  label: 'Discretionary Housing Payments',  group: 'working-age' },
  { idx: 11, id: 'esa',  label: 'Employment & Support Allowance',  group: 'working-age', note: 'Legacy incapacity benefit' },
  { idx: 12, id: 'hb',   label: 'Housing Benefit',                 group: 'mixed',       note: 'Rent — now mostly pensioners + supported/temporary housing' },
  { idx: 13, id: 'is',   label: 'Income Support',                  group: 'working-age', note: 'Legacy' },
  { idx: 17, id: 'jsa',  label: "Jobseeker's Allowance",           group: 'working-age', note: 'Legacy unemployment benefit' },
  { idx: 18, id: 'pc',   label: 'Pension Credit',                  group: 'pensioner',   note: 'Pensioner income top-up' },
  { idx: 19, id: 'pip',  label: 'Personal Independence Payment',   group: 'working-age', note: 'Disability living costs — mobility component can fund a Motability vehicle' },
  { idx: 20, id: 'sda',  label: 'Severe Disablement Allowance',    group: 'working-age' },
  { idx: 22, id: 'sp',   label: 'State Pension',                   group: 'pensioner' },
  { idx: 23, id: 'uc',   label: 'Universal Credit',                group: 'working-age', note: 'Includes housing (rent), child, disability (LCWRA), carer and childcare elements' },
  { idx: 24, id: 'wfp',  label: 'Winter Fuel Payments',            group: 'pensioner' },
];
const TOTAL_IDX = 2;

function loadPopulationTotal() {
  const src = readFileSync(join(ROOT, 'lib', 'population.ts'), 'utf8');
  let total = 0; const re = /population:\s*(\d+)/g; let m;
  while ((m = re.exec(src)) !== null) total += Number(m[1]);
  return total || null;
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
      .map(t => t[1].replace(/<[^>]+>/g, ''));
    const rep = /table:number-columns-repeated="(\d+)"/.exec(attrs);
    const n = rep ? Math.min(Number(rep[1]), 60) : 1;
    for (let i = 0; i < n; i++) cells.push(vAttr ? Number(vAttr[1]) : (texts.join(' ').trim() || null));
  }
  return cells;
}

function findBirminghamRow(contentPath) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(contentPath, { encoding: 'utf8', highWaterMark: 4 * 1024 * 1024 });
    let buf = '', inSheet = false, captured = '';
    stream.on('data', chunk => {
      buf += chunk;
      if (!inSheet) {
        const idx = buf.indexOf(`table:name="${YEAR_SHEET}"`);
        if (idx === -1) { buf = buf.slice(-300); return; }
        inSheet = true; buf = buf.slice(idx);
      }
      captured += buf; buf = '';
      const bIdx = captured.indexOf('>Birmingham<');
      if (bIdx !== -1) {
        const rowStart = captured.lastIndexOf('<table:table-row', bIdx);
        const rowEnd = captured.indexOf('</table:table-row>', bIdx);
        if (rowStart !== -1 && rowEnd !== -1) {
          stream.destroy();
          resolve(cellsOf(captured.slice(rowStart, rowEnd + 18)));
        }
      }
      if (captured.length > 60 * 1024 * 1024) { stream.destroy(); reject(new Error('sheet scanned without finding Birmingham')); }
    });
    stream.on('end', () => reject(new Error(`sheet ${YEAR_SHEET} / Birmingham row not found`)));
    stream.on('error', reject);
  });
}

// ── History: every year sheet, label-aligned + checksum-validated ─────────────
//
// Column layouts SHIFT across the 23 year sheets (benefits appear/disappear; the
// "of which" sub-columns shrink in data rows vs the header). So instead of fixed
// positions we align by header LABEL with a small backtracking search over how many
// sub-cells each top-level benefit consumed — and accept an alignment ONLY when the
// aligned top-level components sum to that year's own Total. Years with no passing
// alignment keep their Total and drop components (with a warning). Honest by design.

const ALIASES = {
  uc: [/universal credit/i],
  sp: [/state pension/i, /retirement pension/i],
  hb: [/housing benefit/i],
  pip: [/personal independence/i],
  esa: [/employment and support/i],
  dla: [/disability living/i],
  jsa: [/jobseeker/i],
  is: [/income support/i],
  pc: [/pension credit/i],
  ca: [/carer'?s allowance/i],
  aa: [/attendance allowance/i],
  wfp: [/winter fuel/i],
};
function canonicalId(label) {
  for (const [id, res] of Object.entries(ALIASES)) if (res.some(re => re.test(label))) return id;
  return null;
}

// Collect, per YEAR sheet, the header row + Birmingham row + GREAT BRITAIN row.
// The buffer keeps ONLY unprocessed content between chunks (an exact cursor) —
// a blind tail-keep re-attributes the previous sheet's rows to the next sheet.
function scanAllYearSheets(contentPath) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(contentPath, { encoding: 'utf8', highWaterMark: 4 * 1024 * 1024 });
    let buf = '', current = null;
    const out = {};   // sheet -> { header, bham, gb }

    function handleRow(rowXml) {
      if (!current) return;
      const slot = out[current];
      if (slot.header && slot.bham && slot.gb) return;
      const cells = cellsOf(rowXml);
      const first = cells.find(c => c != null && c !== '');
      if (!slot.header && typeof first === 'string' && /^area code$/i.test(first)) slot.header = cells;
      else if (!slot.bham && cells.includes('Birmingham')) slot.bham = cells;
      else if (!slot.gb && typeof first === 'string' && /great britain/i.test(first)) slot.gb = cells;
    }

    function process(isEnd) {
      let cur = 0;
      while (true) {
        const tIdx = buf.indexOf('<table:table ', cur);
        const rIdx = buf.indexOf('<table:table-row', cur);
        if (tIdx === -1 && rIdx === -1) { cur = Math.max(cur, buf.length - 20); break; }
        if (tIdx !== -1 && (rIdx === -1 || tIdx < rIdx)) {
          if (buf.length - tIdx < 500 && !isEnd) { cur = tIdx; break; }   // tag may be split
          const nameM = /table:name="([^"]+)"/.exec(buf.slice(tIdx, tIdx + 500));
          current = nameM && /^\d{4}-\d{2}$/.test(nameM[1]) ? nameM[1] : null;
          if (current && !out[current]) out[current] = {};
          cur = tIdx + 13;
          continue;
        }
        const rEnd = buf.indexOf('</table:table-row>', rIdx);
        if (rEnd === -1) { cur = rIdx; break; }                           // row split across chunks
        handleRow(buf.slice(rIdx, rEnd + 18));
        cur = rEnd + 18;
      }
      buf = buf.slice(cur);
    }

    stream.on('data', chunk => { buf += chunk; process(false); });
    stream.on('end', () => { process(true); resolve(out); });
    stream.on('error', reject);
  });
}

const asNum = c => {
  if (typeof c === 'number') return c;
  if (typeof c === 'string' && c.trim() !== '' && !Number.isNaN(Number(c.replace(/,/g, '')))) return Number(c.replace(/,/g, ''));
  return null;
};

// Align top-level header labels to the Birmingham row's numeric cells.
function alignComponents(header, dataRow) {
  const tIdx = header.findIndex(c => typeof c === 'string' && /^total$/i.test(c.trim()));
  if (tIdx === -1) return null;
  // segments: top-level labels after Total, each with its count of "of which" labels
  const segs = [];
  for (let i = tIdx + 1; i < header.length; i++) {
    const c = header[i];
    if (c == null || c === '') continue;
    if (typeof c !== 'string') continue;
    if (/^of which/i.test(c.trim())) { if (segs.length) segs[segs.length - 1].ow++; }
    else segs.push({ label: c.trim(), ow: 0 });
  }
  if (!segs.length) return null;
  // data numerics: everything after the row's Total (= first numeric after the name)
  const nums = [];
  let seenTotal = false, total = null;
  for (const c of dataRow) {
    const v = asNum(c);
    if (v == null) continue;
    if (!seenTotal) { total = v; seenTotal = true; continue; }
    nums.push(v);
  }
  if (total == null || !nums.length) return null;
  const tol = Math.max(2, total * 0.005);

  // backtracking: seg k takes nums[p] as its value, then skips j∈[0..ow] sub-cells.
  // Memo key MUST include the running sum — with skip-branches, whether a state can
  // reach the checksum depends on (k, p, sum), not (k, p) alone.
  const memo = new Set();
  function solve(k, p, acc, sum) {
    if (k === segs.length) {
      const leftover = nums.length - p;
      if (leftover > 3) return null;   // stray trailing cells beyond a few → misaligned
      if (Math.abs(sum - total) <= tol) return { acc, ucExcluded: false };
      // Some vintages (2020/21) print a Total that EXCLUDES the UC column.
      const ucSeg = acc.find(a => canonicalId(a.label) === 'uc');
      if (ucSeg && Math.abs(sum - ucSeg.value - total) <= tol) return { acc, ucExcluded: true };
      return null;
    }
    const key = `${k}:${p}:${Math.round(sum * 10)}`;
    if (memo.has(key)) return null;
    if (p < nums.length) {
      const value = nums[p];
      for (let j = segs[k].ow; j >= 0; j--) {   // prefer consuming the full ow cluster
        if (p + 1 + j > nums.length) continue;
        // CLUSTER CONSISTENCY: consumed "of which" cells must reproduce their parent
        // (within 2%/£1m). Without this, a shifted partition can pass the total-sum
        // check while assigning every benefit its neighbour's money.
        if (j > 0) {
          // 8% tolerance: DWP's own sub-splits can disagree with their parent by
          // several % (2023/24 DLA is 6.3% off) — while chain-shifted partitions
          // are off by 100%+, so the protection holds.
          const owSum = nums.slice(p + 1, p + 1 + j).reduce((s, v) => s + v, 0);
          if (Math.abs(owSum - value) > Math.max(2, value * 0.08)) continue;
        }
        const r = solve(k + 1, p + 1 + j, [...acc, { label: segs[k].label, value, owOk: j > 0 }], sum + value);
        if (r) return r;
      }
    }
    // a benefit can be entirely absent from the data row (zero/suppressed cells
    // dropped) — allow skipping the segment; the checksum still gates correctness
    const rSkip = solve(k + 1, p, acc, sum);
    if (rSkip) return rSkip;
    memo.add(key);
    return null;
  }
  const sol = solve(0, 0, [], 0);
  if (sol) {
    // SOURCE-DEFECT detection: the workbook occasionally duplicates one benefit's
    // value into another's cell (2005/06 Birmingham: SDA's exact float sits in the
    // Pension Credit cell; the sheet's own Total is consistent with the duplicate).
    // If two benefits received float-identical values and one is validated by its
    // own sub-columns, the OTHER is the defect — null it, never display it as fact.
    const anomalies = [];
    for (const a of sol.acc) {
      if (a.owOk) continue;
      const twin = sol.acc.find(b => b !== a && b.value === a.value && b.owOk);
      if (twin) {
        anomalies.push(`${a.label} withheld — DWP's sheet duplicates ${twin.label}'s value into its cell (workbook defect)`);
        a.defect = true;
      }
    }
    const byId = {};
    for (const { label, value, defect } of sol.acc) {
      const id = canonicalId(label);
      if (id && byId[id] == null && !defect) byId[id] = Math.round(value * 10) / 10;
    }
    // If this vintage's printed Total excluded UC, correct it: the true bill is
    // Total + UC (both the workbook's own numbers — no estimation).
    const trueTotal = sol.ucExcluded ? total + (byId.uc ?? 0) : total;
    return { total: Math.round(trueTotal * 10) / 10, components: byId, partial: false, ucExcluded: sol.ucExcluded, anomalies };
  }

  // FALLBACK — partial extraction for sheets whose Total includes benefits that are
  // NOT itemised as columns (e.g. 2018-19 has no Universal Credit column, but its
  // Total includes UC). The full checksum can never pass there. Instead walk the
  // segments and lock each parent by its OWN sub-column checksum (parent ≈ Σ of its
  // "of which" cells). Only cluster-validated parents are kept; the components are
  // flagged partial so the stacked chart still withholds the year.
  {
    const byId = {};
    let p = 0, sum = 0, ok = true;
    for (const seg of segs) {
      if (p >= nums.length) break;
      const value = nums[p];
      if (seg.ow > 0) {
        const owSum = nums.slice(p + 1, p + 1 + seg.ow).reduce((s, v) => s + v, 0);
        const owSumShort = nums.slice(p + 1, p + seg.ow).reduce((s, v) => s + v, 0); // data may drop one ow cell
        if (Math.abs(owSum - value) <= Math.max(1, value * 0.02)) p += 1 + seg.ow;
        else if (seg.ow > 1 && Math.abs(owSumShort - value) <= Math.max(1, value * 0.02)) p += seg.ow;
        else { ok = false; break; }   // cluster doesn't self-validate → stop, keep what's locked
      } else {
        p += 1;
      }
      const id = canonicalId(seg.label);
      if (id && byId[id] == null) byId[id] = Math.round(value * 10) / 10;
      sum += value;
    }
    if (ok && Object.keys(byId).length >= 6 && sum < total) {
      return {
        total: Math.round(total * 10) / 10,
        components: byId,
        partial: true,
        unlisted_m: Math.round((total - sum) * 10) / 10,   // benefits the sheet doesn't itemise (incl. UC in old vintages)
      };
    }
  }
  return null;
}

async function main() {
  const work = join(tmpdir(), 'brum-benexp');
  mkdirSync(work, { recursive: true });
  const odsPath = join(work, 'benexp-la.ods');
  const zipPath = join(work, 'benexp-la.zip');
  const outDirX = join(work, 'x');

  console.log('[bill] downloading DWP expenditure-by-LA workbook…');
  try {
    const r = await fetch(ODS_URL, { signal: AbortSignal.timeout(180000) });
    if (!r.ok) throw new Error(`HTTP ${r.status} downloading ODS`);
    writeFileSync(odsPath, Buffer.from(await r.arrayBuffer()));
    console.log(`[bill] downloaded ${(readFileSync(odsPath).length / 1e6).toFixed(1)} MB`);
  } catch (e) {
    if (existsSync(odsPath)) {
      console.warn(`[bill] ⚠ download failed (${e.message}) — reusing the previously downloaded workbook (same URL, same vintage)`);
    } else {
      throw e;
    }
  }
  // Archive OUR OWN copy of the exact workbook in the repo — reproducibility even if
  // GOV.UK moves the asset. (Committed alongside the fetch script that parses it.)
  const archiveDir = join(ROOT, 'archive');
  mkdirSync(archiveDir, { recursive: true });
  const archivePath = join(archiveDir, 'benefit-expenditure-by-local-authority-2024-25.ods');
  writeFileSync(archivePath, readFileSync(odsPath));
  console.log(`[bill] archived → archive/benefit-expenditure-by-local-authority-2024-25.ods`);

  writeFileSync(zipPath, readFileSync(odsPath));
  console.log('[bill] expanding…');
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDirX}' -Force`]);
  const contentPath = join(outDirX, 'content.xml');
  if (!existsSync(contentPath)) throw new Error('content.xml missing after expand');

  // ── History: all year sheets, aligned + checksum-validated ─────────────────
  console.log('[bill] scanning all year sheets for the 23-year history…');
  const sheets = await scanAllYearSheets(contentPath);
  const history = [];
  for (const sheet of Object.keys(sheets).sort()) {
    const { header, bham, gb } = sheets[sheet];
    const yearLbl = sheet.replace('-', '/');
    if (!bham) { console.warn(`[bill]   ⚠ ${yearLbl}: no Birmingham row`); continue; }
    const aligned = header ? alignComponents(header, bham) : null;
    // GB row: align the same way so a UC-excluded printed Total gets the SAME
    // correction (both sides of the share ratio stay like-for-like). Falls back to
    // the printed GB Total if alignment fails.
    const gbAligned = header && gb ? alignComponents(header, gb) : null;
    const gbTotal = gbAligned?.total ?? (gb ? asNum(gb.find(c => asNum(c) != null)) : null);
    const bhamTotal = aligned?.total ?? (() => {
      for (const c of bham) { const v = asNum(c); if (v != null) return v; } return null;
    })();
    if (bhamTotal == null) { console.warn(`[bill]   ⚠ ${yearLbl}: no Total`); continue; }
    history.push({
      year: yearLbl,
      total_m: Math.round(bhamTotal * 10) / 10,
      gb_total_m: gbTotal != null ? Math.round(gbTotal) : null,
      share_pct: gbTotal ? Math.round((bhamTotal / gbTotal) * 1000) / 10 : null,
      components: aligned?.components ?? null,     // null = alignment failed checksum → components withheld
      partial: aligned?.partial ?? false,          // true = sheet's Total includes benefits it doesn't itemise
      ...(aligned?.unlisted_m != null ? { unlisted_m: aligned.unlisted_m } : {}),
      ...(aligned?.ucExcluded ? { uc_excluded_from_printed_total: true } : {}),
      ...(aligned?.anomalies?.length ? { anomalies: aligned.anomalies } : {}),
    });
    if (aligned?.anomalies?.length) console.warn(`[bill]   ◇ ${yearLbl}: ${aligned.anomalies.join(' · ')}`);
    if (!aligned) console.warn(`[bill]   ⚠ ${yearLbl}: components failed the sum check — Total kept, breakdown withheld`);
    else if (aligned.partial) console.warn(`[bill]   ◇ ${yearLbl}: sheet doesn't itemise every benefit (unlisted £${aligned.unlisted_m}m incl. UC) — listed benefits kept, stack withheld`);
    else if (aligned.ucExcluded) console.warn(`[bill]   ◇ ${yearLbl}: printed Total excluded the UC column — corrected to Total+UC (workbook's own figures)`);
  }
  const withComponents = history.filter(h => h.components && !h.partial).length;
  console.log(`[bill] history: ${history.length} years (${history[0]?.year} → ${history.at(-1)?.year}) · components validated for ${withComponents}/${history.length}`);
  // Guard against duplicate-sheet capture: no two consecutive years may be identical.
  for (let i = 1; i < history.length; i++) {
    if (history[i].total_m === history[i - 1].total_m &&
        JSON.stringify(history[i].components) === JSON.stringify(history[i - 1].components)) {
      throw new Error(`history integrity: ${history[i - 1].year} and ${history[i].year} are identical — sheet scan misattributed rows; DO NOT publish`);
    }
  }

  const row = await findBirminghamRow(contentPath);
  if (row[0] !== 'E08000025') throw new Error(`unexpected row: ${row[0]}`);
  const total = Number(row[TOTAL_IDX]);
  const lines = COLS.map(c => ({
    id: c.id, label: c.label, group: c.group, note: c.note,
    amount_m: Math.round(Number(row[c.idx]) * 10) / 10,
  })).filter(l => Number.isFinite(l.amount_m));

  // THE integrity check: components must reproduce the workbook's own Total.
  const sum = lines.reduce((s, l) => s + l.amount_m, 0);
  if (Math.abs(sum - total) > 1) throw new Error(`column mapping drifted: components sum £${sum.toFixed(1)}m ≠ Total £${total.toFixed(1)}m — DO NOT publish`);
  console.log(`[bill] ✓ sum check: components £${sum.toFixed(1)}m ≈ Total £${total.toFixed(1)}m`);

  // Cross-check: the history's latest year (label-aligned solver) must agree with
  // the Today figures (independent position-based parse) — two parsers, one truth.
  const lastH = history.at(-1);
  if (lastH?.components) {
    for (const c of COLS) {
      const hv = lastH.components[c.id];
      const lv = Number(row[c.idx]);
      if (hv != null && Number.isFinite(lv) && Math.abs(hv - lv) > 1) {
        throw new Error(`cross-check failed: ${c.label} history £${hv}m ≠ today £${lv.toFixed(1)}m — solver misaligned; DO NOT publish`);
      }
    }
    console.log('[bill] ✓ cross-check: history latest year matches the position-parsed Today figures');
  }

  lines.sort((a, b) => b.amount_m - a.amount_m);
  const population = loadPopulationTotal();
  const perHead = population ? Math.round((total * 1e6) / population) : null;

  const sources = [
    { id: 'benefitsBill', label: 'Benefit expenditure by local authority workbook (ODS) — sheets "2002-03"…"2024-25", Birmingham row E08000025',
      publisher: 'Department for Work & Pensions', dataset: 'benefit-expenditure-by-local-authority-2024-25.ods',
      method: 'administrative — accounting outturn', licence: 'Open Government Licence v3.0', as_of: YEAR_LABEL,
      catalogueUrl: ODS_URL, apiUrl: ODS_URL },
    { id: 'benefitsBillPage', label: 'DWP publication page (Benefit expenditure and caseload tables 2025)',
      publisher: 'Department for Work & Pensions', dataset: 'Collection page listing all workbooks',
      method: 'reference', licence: 'Open Government Licence v3.0', as_of: YEAR_LABEL,
      catalogueUrl: PUB_URL, apiUrl: PUB_URL },
    { id: 'population', label: 'Population (per-head denominator)', publisher: 'Office for National Statistics',
      dataset: 'NOMIS NM_2014_1 (SAPE mid-2024)', method: 'official estimate', licence: 'Open Government Licence v3.0',
      as_of: 'Mid-2024', catalogueUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala', apiUrl: 'https://www.nomisweb.co.uk/datasets/pestsyoala' },
  ];

  const proposal = {
    id: 'benefits-bill', status: 'pending',
    title: 'The Benefits Bill — DWP expenditure in Birmingham',
    metric: 'DWP benefit expenditure by benefit, £m nominal',
    unit: '£ million / year',
    geography: 'local-authority',
    generated: new Date().toISOString(),
    year: YEAR_LABEL,
    total_m: Math.round(total * 10) / 10,
    per_head: perHead,
    population,
    lines,
    history,
    sources, source: sources[0],
    validation: {
      geography_level: 'local-authority', ward_breakdown_available: false,
      lines_found: lines.length, components_sum_m: Math.round(sum * 10) / 10,
      workbook_total_m: Math.round(total * 10) / 10, sum_check_passed: Math.abs(sum - total) <= 1,
      total_m: Math.round(total * 10) / 10, per_head: perHead,
      history_years: history.length, history_years_with_components: withComponents,
      history_from: history[0]?.year ?? null, history_to: history.at(-1)?.year ?? null,
    },
    raw_sample: [Object.fromEntries(COLS.slice(0, 6).map(c => [c.label, row[c.idx]]))],
  };

  mkdirSync(join(ROOT, 'proposals'), { recursive: true });
  writeFileSync(join(ROOT, 'proposals', 'benefits-bill.proposal.json'), JSON.stringify(proposal, null, 2));
  console.log(`[bill] ✓ proposal written · ${YEAR_LABEL} · Total £${total.toFixed(1)}m · £${perHead}/resident`);
  lines.forEach(l => console.log(`[bill]   ${l.label.padEnd(36)} £${String(l.amount_m).padStart(8)}m  (${l.group})`));
}

main().catch(err => { console.error('[bill] FAILED:', err.message); process.exit(1); });
