// Agent fetch tool — PIP expenditure by reported medical condition (GB), 2013/14 →
// 2024/25, nominal AND real (2025/26 prices), split working-age / pension-age.
//
// Source: DWP "Benefit expenditure and caseload tables 2025" —
//   pip-expenditure-2024-to-2025.ods (real accounting outturn, £m).
// GEOGRAPHY: GREAT BRITAIN ONLY — no sub-national £-by-condition exists anywhere.
// The dashboard carries Birmingham's REAL total PIP £ (from the by-LA workbook via
// the benefits-bill proposal) as context, never a fabricated local split.
//
// Validation:
//   • category sum (nominal, 2024/25) vs the by-LA workbook's GB PIP row (£25,876m)
//   • condition sum ≈ category sum (real, latest)
//   • WA + PA ≈ total per category (soft warn)
//
//   Run:  node scripts/fetch-pip-conditions.mjs → writes proposals/pip-conditions.proposal.json

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ODS_URL = 'https://assets.publishing.service.gov.uk/media/695b8ddfa2fb6c15f98d1954/pip-expenditure-2024-to-2025.ods';
const PUB_URL = 'https://www.gov.uk/government/publications/benefit-expenditure-and-caseload-tables-2025';
// Anchor: GB PIP 2024/25 from the by-LA workbook's GREAT BRITAIN row (parsed 2026-07-08).
const GB_PIP_ANCHOR_M = 25876.2;

function cellsOf(rowXml) {
  const cells = [];
  const cellRe = /<table:(covered-table-cell|table-cell)([^>]*)(?:\/>|>([\s\S]*?)<\/table:\1>)/g;
  let m;
  while ((m = cellRe.exec(rowXml)) !== null) {
    if (m[1] === 'covered-table-cell') { cells.push(null); continue; }
    const attrs = m[2] ?? '';
    const vAttr = /office:value="([^"]+)"/.exec(attrs);
    const texts = [...(m[3] ?? '').matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)]
      .map(t => t[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&apos;/g, "'"));
    const rep = /table:number-columns-repeated="(\d+)"/.exec(attrs);
    const n = rep ? Math.min(Number(rep[1]), 30) : 1;
    for (let i = 0; i < n; i++) cells.push(vAttr ? Number(vAttr[1]) : (texts.join(' ').trim() || null));
  }
  return cells;
}

// The workbook is small — load whole content.xml and slice per sheet.
function parseSheet(content, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = content.search(new RegExp(`<table:table[^>]*table:name="${esc}"`));
  if (start === -1) throw new Error(`sheet ${name} not found`);
  const next = content.indexOf('<table:table ', start + 20);
  const xml = content.slice(start, next === -1 ? undefined : next);
  const rows = [...xml.matchAll(/<table:table-row[\s\S]*?<\/table:table-row>/g)].map(r => cellsOf(r[0]));
  // header row = the one containing year labels
  const header = rows.find(r => r.some(c => typeof c === 'string' && /^\d{4}\/\d{2}$/.test(c)));
  if (!header) throw new Error(`sheet ${name}: no year header`);
  const years = header.filter(c => typeof c === 'string' && /^\d{4}\/\d{2}$/.test(c));
  const data = {};
  for (const r of rows) {
    const name0 = r.find(c => typeof c === 'string' && c.trim() !== '');
    if (!name0 || /^\d{4}\/\d{2}$/.test(name0) || /expenditure by/i.test(name0)) continue;
    const nums = r.filter(c => typeof c === 'number');
    if (nums.length < years.length) continue;
    data[name0.trim()] = nums.slice(-years.length).map(v => Math.round(v * 100) / 100);
  }
  return { years, data };
}

const isTotalRow = n => /^total/i.test(n) || /^all /i.test(n) || /^unknown/i.test(n) === false && false;

async function main() {
  const work = join(tmpdir(), 'brum-pip-cond');
  mkdirSync(work, { recursive: true });
  const odsPath = join(work, 'pip-cond.ods');
  const zipPath = join(work, 'pip-cond.zip');
  const outDirX = join(work, 'x');

  console.log('[pip] downloading PIP-by-condition workbook…');
  try {
    const r = await fetch(ODS_URL, { signal: AbortSignal.timeout(120000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(odsPath, Buffer.from(await r.arrayBuffer()));
    console.log(`[pip] downloaded ${(readFileSync(odsPath).length / 1e6).toFixed(1)} MB`);
  } catch (e) {
    if (existsSync(odsPath)) console.warn(`[pip] ⚠ download failed (${e.message}) — reusing previous copy`);
    else throw e;
  }
  mkdirSync(join(ROOT, 'archive'), { recursive: true });
  writeFileSync(join(ROOT, 'archive', 'pip-expenditure-2024-to-2025.ods'), readFileSync(odsPath));
  writeFileSync(zipPath, readFileSync(odsPath));
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDirX}' -Force`]);
  const content = readFileSync(join(outDirX, 'content.xml'), 'utf8');

  const catNom = parseSheet(content, 'PIP_by_Category_(Nominal)');
  const catReal = parseSheet(content, 'PIP_by_Category_(Real)');
  const catRealWA = parseSheet(content, 'PIP_by_Category_(Real)_WA');
  const catRealPA = parseSheet(content, 'PIP_by_Category_(Real)_PA');
  const condReal = parseSheet(content, 'PIP_by_Condition_(Real)');
  const years = catReal.years;
  console.log(`[pip] years: ${years[0]} → ${years.at(-1)} · categories: ${Object.keys(catReal.data).length} · conditions: ${Object.keys(condReal.data).length}`);

  // Separate any Total rows from the categories.
  const totalKey = Object.keys(catReal.data).find(k => /^total/i.test(k));
  const catNames = Object.keys(catReal.data).filter(k => !/^total/i.test(k));
  const last = years.length - 1;

  const categories = catNames.map(name => ({
    name,
    nominal: catNom.data[name] ?? null,
    real: catReal.data[name],
    wa_real: catRealWA.data[name] ?? null,
    pa_real: catRealPA.data[name] ?? null,
  })).sort((a, b) => (b.real[last] ?? 0) - (a.real[last] ?? 0));

  // ── Validation ────────────────────────────────────────────────────────────────
  const catSumNomLatest = categories.reduce((s, c) => s + (c.nominal?.[last] ?? 0), 0);
  const driftAnchor = Math.abs(catSumNomLatest - GB_PIP_ANCHOR_M) / GB_PIP_ANCHOR_M;
  console.log(`[pip] anchor check: category sum (nominal ${years[last]}) £${catSumNomLatest.toFixed(0)}m vs by-LA GB PIP £${GB_PIP_ANCHOR_M}m (drift ${(driftAnchor * 100).toFixed(1)}%)`);
  if (driftAnchor > 0.05) throw new Error('category sum drifts >5% from the by-LA GB PIP anchor — DO NOT publish');

  const catSumRealLatest = categories.reduce((s, c) => s + (c.real[last] ?? 0), 0);
  const condNames = Object.keys(condReal.data).filter(k => !/^total/i.test(k));
  const condSumRealLatest = condNames.reduce((s, k) => s + (condReal.data[k][last] ?? 0), 0);
  const driftCond = Math.abs(condSumRealLatest - catSumRealLatest) / catSumRealLatest;
  console.log(`[pip] condition/category check: £${condSumRealLatest.toFixed(0)}m vs £${catSumRealLatest.toFixed(0)}m (drift ${(driftCond * 100).toFixed(1)}%)`);
  if (driftCond > 0.02) throw new Error('condition sheet does not reconcile with category sheet — DO NOT publish');

  let waPaWarn = 0;
  for (const c of categories) {
    if (!c.wa_real || !c.pa_real) continue;
    const s = (c.wa_real[last] ?? 0) + (c.pa_real[last] ?? 0);
    if (c.real[last] > 5 && Math.abs(s - c.real[last]) > Math.max(2, c.real[last] * 0.05)) waPaWarn++;
  }
  if (waPaWarn) console.warn(`[pip] ⚠ ${waPaWarn} categories where WA+PA ≠ total by >5% (shown as published)`);

  // Top 30 granular conditions by latest real £.
  const conditions = condNames
    .map(name => ({ name, real: condReal.data[name] }))
    .sort((a, b) => (b.real[last] ?? 0) - (a.real[last] ?? 0))
    .slice(0, 30);

  // Birmingham anchor — REAL total PIP £ from the accepted-by-pipeline benefits-bill proposal.
  let bhamPip = null;
  try {
    const bill = JSON.parse(readFileSync(join(ROOT, 'proposals', 'benefits-bill.proposal.json'), 'utf8'));
    bhamPip = bill.lines?.find(l => l.id === 'pip')?.amount_m ?? null;
  } catch { /* absent — panel omits the anchor */ }
  console.log(`[pip] Birmingham PIP anchor: £${bhamPip ?? '—'}m (from benefits-bill proposal)`);

  const sources = [
    { id: 'pipConditions', label: 'PIP expenditure by reported medical condition workbook (ODS) — category + condition sheets, nominal & real, WA/PA',
      publisher: 'Department for Work & Pensions', dataset: 'pip-expenditure-2024-to-2025.ods',
      method: 'administrative — accounting outturn', licence: 'Open Government Licence v3.0', as_of: years.at(-1),
      catalogueUrl: ODS_URL, apiUrl: ODS_URL },
    { id: 'pipConditionsPage', label: 'DWP publication page (Benefit expenditure and caseload tables 2025)',
      publisher: 'Department for Work & Pensions', dataset: 'Collection page', method: 'reference',
      licence: 'Open Government Licence v3.0', as_of: years.at(-1), catalogueUrl: PUB_URL, apiUrl: PUB_URL },
  ];

  const proposal = {
    id: 'pip-conditions', status: 'pending',
    title: 'PIP: where the money goes — by medical condition (GB)',
    metric: 'PIP expenditure by condition category, £m',
    unit: '£ million / year',
    geography: 'great-britain',
    generated: new Date().toISOString(),
    years,
    categories,
    conditions,
    gb_total_real_latest: Math.round(catSumRealLatest * 10) / 10,
    gb_total_nominal_latest: Math.round(catSumNomLatest * 10) / 10,
    birmingham_pip_m: bhamPip,
    sources, source: sources[0],
    validation: {
      geography_level: 'great-britain', ward_breakdown_available: false,
      categories_found: categories.length, conditions_kept: conditions.length,
      years_span: years.length, series_from: years[0], series_to: years.at(-1),
      anchor_drift_pct: Math.round(driftAnchor * 1000) / 10,
      condition_category_drift_pct: Math.round(driftCond * 1000) / 10,
      total_row_present: !!totalKey,
    },
    raw_sample: categories.slice(0, 3).map(c => ({ name: c.name, real_latest: c.real[last] })),
  };

  mkdirSync(join(ROOT, 'proposals'), { recursive: true });
  writeFileSync(join(ROOT, 'proposals', 'pip-conditions.proposal.json'), JSON.stringify(proposal, null, 2));
  console.log(`[pip] ✓ proposal written · ${categories.length} categories · GB real ${years.at(-1)} £${(catSumRealLatest / 1000).toFixed(1)}bn`);
  categories.slice(0, 8).forEach(c => {
    const growth = c.real[3] > 0 ? (c.real[last] / c.real[3]).toFixed(1) : '—';
    console.log(`[pip]   ${c.name.padEnd(34)} £${String(Math.round(c.real[last])).padStart(6)}m · ×${growth} since ${years[3]}`);
  });
}

main().catch(err => { console.error('[pip] FAILED:', err.message); process.exit(1); });
