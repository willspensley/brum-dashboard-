'use client';

import { useState } from 'react';
import type { BenefitsBillData, BenefitLine } from '@/lib/types';
import BillHistoryChart from './BillHistoryChart';
import BillSmallMultiples from './BillSmallMultiples';
import BillShareLine from './BillShareLine';

// The Benefits Bill — where DWP money actually goes in Birmingham. Two data-science
// standards for budget composition: a proportional mosaic strip (one-level treemap —
// area = money) and a ranked bar list with exact figures. LA-level only, and says so.

const GROUP_COLOR: Record<BenefitLine['group'], string> = {
  'working-age': '#16306f',   // herald navy
  'pensioner': '#7d4e36',     // warm ink-ramp brown
  'mixed': '#5b2a23',
};
const GROUP_LABEL: Record<BenefitLine['group'], string> = {
  'working-age': 'working-age & children',
  'pensioner': 'pensioners',
  'mixed': 'mixed ages',
};

type Sub = 'today' | 'history' | 'britain';

export default function BenefitsBillView({ data }: { data: BenefitsBillData }) {
  const [sub, setSub] = useState<Sub>('today');
  const history = data.history ?? [];
  const hasHistory = history.length > 1;
  const lines = [...(data.lines ?? [])].sort((a, b) => b.amount_m - a.amount_m);
  const total = data.total_m || lines.reduce((s, l) => s + l.amount_m, 0);
  const maxLine = Math.max(...lines.map(l => l.amount_m), 1);

  const groupTotals = (['working-age', 'pensioner', 'mixed'] as const).map(g => ({
    g, amount: lines.filter(l => l.group === g).reduce((s, l) => s + l.amount_m, 0),
  }));

  const fmt = (m: number) => m >= 1000 ? `£${(m / 1000).toFixed(2)}bn` : `£${m.toFixed(m < 10 ? 1 : 0)}m`;

  return (
    <div className="body">
      <div className="lcol">
        <div className="hb-nowward" role="note">
          <span className="hb-nowward-tag">◇ LOCAL-AUTHORITY FIGURE — ACTUAL DWP ACCOUNTS</span>
          <p>
            Real accounting outturn from DWP&apos;s benefit expenditure tables, {data.year}, nominal £.
            <strong> Ward-level £ does not exist</strong> — DWP publishes expenditure for whole local
            authorities only. Excludes Child Benefit (HMRC) and council-administered support.
          </p>
        </div>

        {hasHistory && (
          <div className="sub-tab-bar">
            {([['today', 'Today'], ['history', 'History'], ['britain', 'vs Britain']] as [Sub, string][]).map(([s, lbl]) => (
              <button key={s} className={`sub-tab${sub === s ? ' active' : ''}`} onClick={() => setSub(s)}>{lbl}</button>
            ))}
          </div>
        )}

        <div className="panel" style={{ flex: 1, position: 'relative' }}>
          <div className="panel-body" style={{ padding: '16px 18px' }}>
            {sub === 'history' && hasHistory ? (
              <>
                <BillHistoryChart history={history} />
                <BillSmallMultiples history={history} />
              </>
            ) : sub === 'britain' && hasHistory ? (
              <BillShareLine history={history} />
            ) : (
            <>

            {/* Mosaic strip — area = money. The single most honest "where it goes" visual. */}
            <div className="bill-sec-ttl">Where the money goes — share of {fmt(total)}</div>
            <div className="bill-mosaic">
              {lines.filter(l => l.amount_m / total > 0.004).map(l => (
                <div
                  key={l.id}
                  className="bill-block"
                  style={{ flexGrow: l.amount_m, background: GROUP_COLOR[l.group] }}
                  title={`${l.label}: ${fmt(l.amount_m)} (${((l.amount_m / total) * 100).toFixed(1)}%)`}
                >
                  {l.amount_m / total > 0.045 && (
                    <span className="bill-block-lbl">{l.label}<em>{((l.amount_m / total) * 100).toFixed(0)}%</em></span>
                  )}
                </div>
              ))}
            </div>
            <div className="comp-legend" style={{ marginTop: 8 }}>
              {groupTotals.map(({ g, amount }) => (
                <span key={g}><i style={{ background: GROUP_COLOR[g] }} /> {GROUP_LABEL[g]} · {fmt(amount)}</span>
              ))}
            </div>

            {/* Ranked bars with exact figures */}
            <div className="bill-sec-ttl" style={{ marginTop: 22 }}>By benefit, {data.year} (£ million, nominal)</div>
            {lines.map(l => (
              <div key={l.id} className="hb-row" style={{ padding: '5px 0' }}>
                <div className="hb-name" style={{ fontSize: 13.5 }}>
                  {l.label}
                  {l.note && <span className="hb-you" style={{ color: 'var(--muted2)', textTransform: 'none', letterSpacing: 0 }}>{l.note}</span>}
                </div>
                <div className="hb-track" style={{ height: 18 }}>
                  <div className="hb-bar" style={{ height: 18, width: `${(l.amount_m / maxLine) * 100}%`, background: GROUP_COLOR[l.group] }} />
                  <span className="hb-val">{fmt(l.amount_m)}</span>
                </div>
              </div>
            ))}
            </>
            )}
          </div>
          <div className="bham-watermark">FORWARD · BIRMINGHAM</div>
        </div>
      </div>

      <div className="rcol">
        <div className="hb-headline">
          <div className="hb-big">{fmt(total)}</div>
          <div className="hb-big-sub">DWP benefit spending in Birmingham, {data.year} — {data.per_head != null ? `£${data.per_head.toLocaleString()} per resident` : ''}</div>

          <div className="hb-facts">
            <div className="hb-fact">
              <span className="hb-fact-k">Largest line</span>
              <span className="hb-fact-v">{lines[0]?.label} — {fmt(lines[0]?.amount_m ?? 0)} ({(((lines[0]?.amount_m ?? 0) / total) * 100).toFixed(0)}%)</span>
            </div>
            {groupTotals.map(({ g, amount }) => (
              <div className="hb-fact" key={g}>
                <span className="hb-fact-k">{GROUP_LABEL[g]}</span>
                <span className="hb-fact-v">{fmt(amount)} · {((amount / total) * 100).toFixed(0)}% of the bill</span>
              </div>
            ))}
            <div className="hb-fact">
              <span className="hb-fact-k">Geography</span>
              <span className="hb-fact-v" style={{ color: 'var(--herald-red)' }}>Local authority — no ward-level £ exists</span>
            </div>
          </div>

          <div className="hb-sources">
            <div className="hb-sources-ttl">Source</div>
            {(data.sources ?? []).map((s, i) => (
              <div key={i} className="hb-src">
                <a href={s.catalogueUrl} target="_blank" rel="noopener noreferrer">{s.label}</a>
                <span className="hb-src-meta">{s.publisher} · {s.licence} · {s.as_of}</span>
              </div>
            ))}
            <a href="/sources" className="hb-sources-all">All sources &amp; methods →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
