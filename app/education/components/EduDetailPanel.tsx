'use client';

import type { EducationWard } from '@/lib/types';

const RAMP = ['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];

function dc(d: number) { return RAMP[Math.max(0, Math.min(9, (d || 1) - 1))]; }

const QUAL_KEYS: (keyof EducationWard)[] = ['qual_none','qual_level1','qual_level2','qual_apprenticeship','qual_level3','qual_level4plus','qual_other'];
const QUAL_LABELS = ['No qualifications','Level 1 / entry','Level 2','Apprenticeship','Level 3','Level 4+','Other'];
const QUAL_COLORS = ['#3a1a1a','#683428','#7d4e36','#b07a5e','#c4a882','#1a3a2a','#4a8a6a'];

interface Props {
  ward: EducationWard;
  wards: EducationWard[];
  onClose: () => void;
}

function cityAvg(wards: EducationWard[], key: keyof EducationWard): number {
  return wards.reduce((s, w) => s + (w[key] as number), 0) / wards.length;
}

export default function EduDetailPanel({ ward, wards, onClose }: Props) {
  const avgNone = cityAvg(wards, 'qual_none');
  const avgL4   = cityAvg(wards, 'qual_level4plus');

  return (
    <div style={{ padding: '18px', fontFamily: 'var(--sans)', fontSize: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{ward.ward_name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em' }}>
            {ward.ward_code} · RANK {ward.edu_rank} / {wards.length}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '3px 8px', fontFamily: 'var(--mono)' }}>×</button>
      </div>

      {/* Headline stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div className="stat-card" style={{ padding: '10px 12px' }}>
          <div className="stat-lbl">No qualifications</div>
          <div className="stat-val" style={{ fontSize: 26 }}>{ward.qual_none.toFixed(1)}%</div>
          <div className="stat-sub" style={{ color: ward.qual_none > avgNone ? '#7d4e36' : '#1a3a2a' }}>
            City avg {avgNone.toFixed(1)}% {ward.qual_none > avgNone ? '▲ above' : '▼ below'}
          </div>
        </div>
        <div className="stat-card" style={{ padding: '10px 12px' }}>
          <div className="stat-lbl">Level 4+ (degree)</div>
          <div className="stat-val" style={{ fontSize: 26 }}>{ward.qual_level4plus.toFixed(1)}%</div>
          <div className="stat-sub" style={{ color: ward.qual_level4plus < avgL4 ? '#7d4e36' : '#1a3a2a' }}>
            City avg {avgL4.toFixed(1)}% {ward.qual_level4plus < avgL4 ? '▼ below' : '▲ above'}
          </div>
        </div>
      </div>

      {/* IMD Education Deprivation */}
      <div className="stat-card" style={{ padding: '10px 12px', marginBottom: 16 }}>
        <div className="stat-lbl">IMD 2025 — Education domain deprivation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: 14, height: 14, background: RAMP[i], opacity: i < ward.imd_edu_decile ? 1 : 0.15 }} />
            ))}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
            Decile {ward.imd_edu_decile} / 10 <span style={{ marginLeft: 6, color: dc(ward.imd_edu_decile) }}>
              {ward.imd_edu_decile >= 8 ? 'Most deprived' : ward.imd_edu_decile >= 5 ? 'Above average' : ward.imd_edu_decile >= 3 ? 'Below average' : 'Least deprived'}
            </span>
          </div>
        </div>
      </div>

      {/* Stacked bar — this ward */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Qualification breakdown — % of residents aged 16+
        </div>
        {/* Full-width stacked bar */}
        <div style={{ display: 'flex', height: 18, width: '100%', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {QUAL_KEYS.map((k, i) => {
            const pct = ward[k] as number;
            return (
              <div
                key={k}
                style={{ width: `${pct}%`, background: QUAL_COLORS[i], transition: 'width .3s ease', flexShrink: 0 }}
                title={`${QUAL_LABELS[i]}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        {/* City avg bar */}
        <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--muted2)', margin: '4px 0 2px' }}>City average</div>
        <div style={{ display: 'flex', height: 10, width: '100%', border: '1px solid var(--border)', overflow: 'hidden', opacity: 0.6 }}>
          {QUAL_KEYS.map((k, i) => {
            const pct = cityAvg(wards, k);
            return (
              <div key={k} style={{ width: `${pct}%`, background: QUAL_COLORS[i], flexShrink: 0 }} title={`${QUAL_LABELS[i]}: ${pct.toFixed(1)}%`} />
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 10 }}>
          {QUAL_LABELS.map((lbl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
              <div style={{ width: 8, height: 8, background: QUAL_COLORS[i] }} />
              {lbl}
            </div>
          ))}
        </div>
      </div>

      {/* Per-level breakdown rows */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {QUAL_KEYS.map((k, i) => {
          const val = ward[k] as number;
          const avg = cityAvg(wards, k);
          const diff = val - avg;
          return (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, background: QUAL_COLORS[i], flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ink)' }}>{QUAL_LABELS[i]}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--mono)', fontSize: 10 }}>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{val.toFixed(1)}%</span>
                <span style={{ color: Math.abs(diff) < 0.5 ? 'var(--muted)' : diff > 0 ? (k === 'qual_level4plus' ? '#1a3a2a' : '#7d4e36') : (k === 'qual_level4plus' ? '#7d4e36' : '#1a3a2a') }}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} vs avg
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted2)', lineHeight: 1.6 }}>
        Source: Census 2021 (ONS). Residents aged 16+ usual residents.
      </div>
    </div>
  );
}
