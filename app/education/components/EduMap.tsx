'use client';

import { useEffect, useRef, useState } from 'react';
import type { EducationWard } from '@/lib/types';
import { RAMP } from '@/lib/constants';

type Metric = 'none' | 'level4' | 'imd';

const METRIC_LABELS: Record<Metric, string> = {
  none: '% no qualifications',
  level4: '% degree (L4+)',
  imd: 'IMD 2025 edu deprivation',
};

const LEGEND_LABELS: Record<Metric, [string, string]> = {
  none: ['Low no-quals', 'High no-quals'],
  level4: ['High degree', 'Low degree'],
  imd: ['Least deprived', 'Most deprived'],
};

const BOUNDS_URL =
  'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query?where=LAD22CD%3D%27E08000025%27&outFields=WD22CD%2CWD22NM&f=geojson&returnGeometry=true';

interface Props {
  wards: EducationWard[];
  onSelect: (code: string) => void;
}

export default function EduMap({ wards, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);
  const metricRef = useRef<Metric>('none');
  const [metric, setMetric] = useState<Metric>('none');

  const wardIndex = Object.fromEntries(wards.map(w => [w.ward_code, w]));
  const maxNone = Math.max(...wards.map(w => w.qual_none));
  const minNone = Math.min(...wards.map(w => w.qual_none));
  const maxL4   = Math.max(...wards.map(w => w.qual_level4plus));
  const minL4   = Math.min(...wards.map(w => w.qual_level4plus));

  function getColor(w: EducationWard, m: Metric): string {
    if (m === 'imd') return RAMP[Math.max(0, Math.min(9, (w.imd_edu_decile || 1) - 1))];
    if (m === 'level4') {
      const norm = maxL4 === minL4 ? 0.5 : (w.qual_level4plus - minL4) / (maxL4 - minL4);
      return RAMP[Math.max(0, Math.min(9, Math.round((1 - norm) * 9)))];
    }
    const norm = maxNone === minNone ? 0.5 : (w.qual_none - minNone) / (maxNone - minNone);
    return RAMP[Math.max(0, Math.min(9, Math.round(norm * 9)))];
  }

  function getTooltip(w: EducationWard, m: Metric): string {
    const avg = wards.reduce((s, x) =>
      s + (m === 'level4' ? x.qual_level4plus : m === 'imd' ? x.imd_edu_decile : x.qual_none), 0
    ) / wards.length;
    if (m === 'imd') {
      return `<b>${w.ward_name}</b><br>Edu deprivation decile: ${w.imd_edu_decile} / 10<br>City avg: ${avg.toFixed(1)}`;
    }
    const val = m === 'level4' ? w.qual_level4plus : w.qual_none;
    const diff = val - avg;
    return `<b>${w.ward_name}</b><br>${METRIC_LABELS[m]}: ${val.toFixed(1)}%<br>vs city avg ${avg.toFixed(1)}% (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`;
  }

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import('leaflet').then(L => {
      if (!containerRef.current) return;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([52.48, -1.9], 11);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 18,
      }).addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, pane: 'shadowPane',
      }).addTo(map);

      mapRef.current = map;

      fetch(BOUNDS_URL)
        .then(r => r.json())
        .then((geo: GeoJSON.FeatureCollection) => {
          const layer = L.geoJSON(geo, {
            style: feat => {
              const w = wardIndex[feat?.properties?.WD22CD ?? ''];
              return { fillColor: w ? getColor(w, metricRef.current) : '#ccc', fillOpacity: 0.75, color: '#f5f3ee', weight: 1 };
            },
            onEachFeature: (feat, lyr) => {
              const code = feat.properties?.WD22CD ?? '';
              const w = wardIndex[code];
              if (!w) return;
              lyr.on('click', () => onSelect(code));
              lyr.on('mouseover', e => (e.target as L.Path).setStyle({ fillOpacity: 0.95, weight: 2 }));
              lyr.on('mouseout',  e => (e.target as L.Path).setStyle({ fillOpacity: 0.75, weight: 1 }));
              (lyr as L.Layer & { bindTooltip(s: string, o: object): void })
                .bindTooltip(getTooltip(w, metricRef.current), { className: 'map-tooltip', sticky: true });
            },
          }).addTo(map);
          layerRef.current = layer;
        })
        .catch(console.error);
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove(): void }).remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    metricRef.current = metric;
    if (!layerRef.current) return;

    const layer = layerRef.current as {
      setStyle(fn: (f: { properties?: { WD22CD?: string } }) => object): void;
      eachLayer(fn: (l: unknown) => void): void;
    };

    layer.setStyle((feat: { properties?: { WD22CD?: string } }) => {
      const w = wardIndex[feat?.properties?.WD22CD ?? ''];
      return { fillColor: w ? getColor(w, metric) : '#ccc', fillOpacity: 0.75, color: '#f5f3ee', weight: 1 };
    });

    layer.eachLayer((l: unknown) => {
      const lyr = l as {
        feature?: { properties?: { WD22CD?: string } };
        unbindTooltip?(): void;
        bindTooltip?(s: string, o: object): void;
      };
      const code = lyr.feature?.properties?.WD22CD ?? '';
      const w = wardIndex[code];
      if (!w || !lyr.unbindTooltip || !lyr.bindTooltip) return;
      lyr.unbindTooltip();
      lyr.bindTooltip(getTooltip(w, metric), { className: 'map-tooltip', sticky: true });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric]);

  return (
    <div>
      {/* Metric switcher */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 14px 8px', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginRight: 2 }}>
          Colour by
        </span>
        {(['none', 'level4', 'imd'] as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 9px',
              background: metric === m ? 'var(--ink)' : 'none',
              color: metric === m ? '#f5f3ee' : 'var(--muted)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
        {/* Ramp legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>{LEGEND_LABELS[metric][0]}</span>
          {RAMP.map((c, i) => <div key={i} style={{ width: 12, height: 12, background: c }} />)}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>{LEGEND_LABELS[metric][1]}</span>
        </div>
      </div>
      <div ref={containerRef} className="map-container" style={{ minHeight: 440 }} />
    </div>
  );
}
