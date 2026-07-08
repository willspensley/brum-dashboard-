// Proposals API — the human-in-the-loop gate.
//
//   GET  /api/proposals            → list staged proposals (from /proposals)
//   POST /api/proposals  {id, action:'accept'}  → promote to public/data/, mark accepted
//   POST /api/proposals  {id, action:'reject', reason} → mark rejected + record reason
//
// This is the ONLY code that writes to public/data/. The fetch tool (scripts/*.mjs)
// only ever writes to /proposals. Nothing reaches the published dashboard without a
// human ACCEPT here — the "wall" in the agent loop.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const PROPOSALS_DIR = join(ROOT, 'proposals');
const PUBLISHED_DIR = join(ROOT, 'public', 'data');

interface Proposal {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  [k: string]: unknown;
}

function readProposals(): Proposal[] {
  if (!existsSync(PROPOSALS_DIR)) return [];
  return readdirSync(PROPOSALS_DIR)
    .filter(f => f.endsWith('.proposal.json'))
    .map(f => {
      try {
        return JSON.parse(readFileSync(join(PROPOSALS_DIR, f), 'utf8')) as Proposal;
      } catch {
        return null;
      }
    })
    .filter((p): p is Proposal => p != null);
}

function proposalPath(id: string): string {
  return join(PROPOSALS_DIR, `${id}.proposal.json`);
}

export async function GET() {
  return Response.json({ proposals: readProposals() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { id?: string; action?: string; reason?: string };
  const { id, action, reason } = body;
  if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 });

  const path = proposalPath(id);
  if (!existsSync(path)) return Response.json({ error: 'proposal not found' }, { status: 404 });
  const proposal = JSON.parse(readFileSync(path, 'utf8')) as Proposal & {
    wards?: unknown[];
    areas?: unknown[];                 // non-ward datasets (e.g. LA-level Housing Benefit)
    benchmarks?: Record<string, unknown>;
    geography?: string;
    months?: unknown[];                // trend-series month labels (e.g. claimant count)
    source?: Record<string, unknown>;
    sources?: unknown[];
    metric?: string;
    unit?: string;
    validation?: { total_claimants?: number; total_population?: number; city_pct?: number | null };
  };

  if (action === 'reject') {
    proposal.status = 'rejected';
    proposal.rejected_reason = reason ?? '(no reason given)';
    proposal.reviewed_at = new Date().toISOString();
    writeFileSync(path, JSON.stringify(proposal, null, 2));
    return Response.json({ ok: true, status: 'rejected' });
  }

  if (action === 'accept') {
    // Promote the proposal's data to the published store.
    mkdirSync(PUBLISHED_DIR, { recursive: true });
    // Generic promotion: carry the proposal's own validation fields through (each
    // dataset has its own — e.g. city_pct for UC counts, ward_mean_pct for the
    // in-employment share) so any dashboard's published file has what it needs.
    const published = {
      generated: new Date().toISOString(),
      metric: proposal.metric,
      unit: proposal.unit,
      source: proposal.source,
      sources: proposal.sources,
      as_of: (proposal.source as { as_of?: string })?.as_of,
      ...(proposal.validation ?? {}),
      // Ward datasets carry `wards`; coarser datasets (e.g. LA-level Housing Benefit)
      // carry `areas` + `benchmarks` + a `geography` flag instead. Pass through whatever
      // this proposal has — undefined fields drop out of the JSON.
      ...(proposal.geography ? { geography: proposal.geography } : {}),
      ...(proposal.benchmarks ? { benchmarks: proposal.benchmarks } : {}),
      ...(proposal.areas ? { areas: proposal.areas } : {}),
      ...(proposal.months ? { months: proposal.months } : {}),
      wards: proposal.wards,
    };
    writeFileSync(join(PUBLISHED_DIR, `${id}.json`), JSON.stringify(published, null, 2));

    proposal.status = 'accepted';
    proposal.reviewed_at = new Date().toISOString();
    writeFileSync(path, JSON.stringify(proposal, null, 2));
    return Response.json({ ok: true, status: 'accepted', published: `public/data/${id}.json` });
  }

  return Response.json({ error: `unknown action: ${action}` }, { status: 400 });
}
