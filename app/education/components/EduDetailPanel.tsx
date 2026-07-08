'use client';

import type { EducationWard } from '@/lib/types';
import Tip from '../../components/Tip';
import SourceTag from '../../components/SourceTag';
import { getWardPopulation } from '@/lib/population';

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
  const col = dc(ward.skills_decile);
  const population = getWardPopulation(ward.ward_code, ward.ward_name);

  return (
    <div>
      <div className="d-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-name">{ward.ward_name}</div>
            <div className="d-sub">{ward.ward_code} · rank {ward.edu_rank}/{wards.length} · skills decile {ward.skills_decile}/10</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 2 }}>×</button>
        </div>

        <div className="q-banner" style={{ borderColor: col, background: col + '0d' }}>
          <div className="q-banner-txt">
            Skills decile <strong>{ward.skills_decile}/10</strong> (by % with no qualifications) —{' '}
            {ward.skills_decile >= 8 ? 'among the most skills-deprived wards in the city'
              : ward.skills_decile >= 5 ? 'above the city average for skills deprivation'
              : ward.skills_decile >= 3 ? 'below the city average for skills deprivation'
              : 'among the least skills-deprived wards'}.
          </div>
        </div>

        <div className="d-chips">
          {population != null && (
            <div className="d-chip">
              <div className="d-chip-lbl">Population</div>
              <div className="d-chip-val">{population.toLocaleString()}</div>
              <div className="d-chip-sub"><SourceTag id="population" /></div>
            </div>
          )}
          <Tip text="Share of residents aged 16+ with no formal qualifications (Census 2021). Higher = a lower skills base. '▲ above / ▼ below' compares the ward to the Birmingham average.">
            <div className="d-chip">
              <div className="d-chip-lbl">No qualifications</div>
              <div className="d-chip-val">{ward.qual_none.toFixed(1)}%</div>
              <div className="d-chip-sub">avg {avgNone.toFixed(1)}% {ward.qual_none > avgNone ? '▲ above' : '▼ below'}</div>
            </div>
          </Tip>
          <Tip text="Share of residents aged 16+ whose highest qualification is degree-level or above (Census 2021). Higher = a more highly qualified population.">
            <div className="d-chip">
              <div className="d-chip-lbl">Level 4+ (degree)</div>
              <div className="d-chip-val">{ward.qual_level4plus.toFixed(1)}%</div>
              <div className="d-chip-sub">avg {avgL4.toFixed(1)}% {ward.qual_level4plus < avgL4 ? '▼ below' : '▲ above'}</div>
            </div>
          </Tip>
          <Tip text="Skills decile — Birmingham wards ranked into tenths by % of residents with no qualifications (Census 2021). 10 = among the most skills-deprived wards; 1 = among the least.">
            <div className="d-chip">
              <div className="d-chip-lbl">Skills decile</div>
              <div className="d-chip-val" style={{ color: col }}>{ward.skills_decile}/10</div>
              <div className="d-chip-sub">by % no quals</div>
            </div>
          </Tip>
          <Tip text="Where this ward ranks among all Birmingham wards on the education measure. #1 = the most skills-deprived ward.">
            <div className="d-chip">
              <div className="d-chip-lbl">City rank</div>
              <div className="d-chip-val">#{ward.edu_rank}</div>
              <div className="d-chip-sub">of {wards.length} wards</div>
            </div>
          </Tip>
        </div>
      </div>

      <div className="d-sec">
        <div className="d-sec-ttl">Qualification breakdown — % of residents aged 16+</div>
        <div style={{ display: 'flex', height: 18, width: '100%', border: '1px solid var(--border)', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
          {QUAL_KEYS.map((k, i) => (
            <div key={k} style={{ width: `${ward[k] as number}%`, background: QUAL_COLORS[i], flexShrink: 0 }} title={`${QUAL_LABELS[i]}: ${(ward[k] as number).toFixed(1)}%`} />
          ))}
        </div>
        <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--muted2)', margin: '6px 0 2px' }}>City average</div>
        <div style={{ display: 'flex', height: 10, width: '100%', border: '1px solid var(--border)', overflow: 'hidden', opacity: 0.6, borderRadius: 'var(--radius)' }}>
          {QUAL_KEYS.map((k, i) => (
            <div key={k} style={{ width: `${cityAvg(wards, k)}%`, background: QUAL_COLORS[i], flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 10 }}>
          {QUAL_LABELS.map((lbl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
              <div style={{ width: 8, height: 8, background: QUAL_COLORS[i] }} />
              {lbl}
            </div>
          ))}
        </div>
      </div>

      <div className="d-sec" style={{ borderBottom: 'none' }}>
        <div className="d-sec-ttl">Per-level vs city average</div>
        <div>
          {QUAL_KEYS.map((k, i) => {
            const val = ward[k] as number;
            const a = cityAvg(wards, k);
            const diff = val - a;
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, background: QUAL_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--ink)' }}>{QUAL_LABELS[i]}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--mono)', fontSize: 10 }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{val.toFixed(1)}%</span>
                  <span style={{ color: Math.abs(diff) < 0.5 ? 'var(--muted)' : 'var(--muted2)' }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)} vs avg</span>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted2)', lineHeight: 1.6, margin: '12px 0 0' }}>
          Source: Census 2021 (ONS). Residents aged 16+ usual residents.
        </p>
      </div>
    </div>
  );
}
