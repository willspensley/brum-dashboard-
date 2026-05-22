'use client';

import { useEffect, useRef, useState } from 'react';
import type { Ward } from '@/lib/types';
import { dc, RAMP, MUTED } from '@/lib/constants';

interface Props {
  wards: Ward[];
  onSelect: (code: string) => void;
}

const SP = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

export default function MapView({ wards, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [spinIdx, setSpinIdx] = useState(0);

  useEffect(() => {
    if (mapRef.current) return;
    const ticker = setInterval(() => setSpinIdx(i => (i + 1) % SP.length), 80);

    async function init() {
      const L = (await import('leaflet')).default;
      if (!containerRef.current) return;

      const geoUrl = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query?where=LAD22CD%3D%27E08000025%27&outFields=WD22CD,WD22NM&outSR=4326&f=geojson';
      const res = await fetch(geoUrl, { signal: AbortSignal.timeout(18000) });
      if (!res.ok) throw new Error(`ONS HTTP ${res.status}`);
      const geo = await res.json();

      clearInterval(ticker);
      setStatus('ready');

      const map = L.map(containerRef.current).setView([52.48, -1.90], 11);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', { attribution: '© OSM, © CARTO', maxZoom: 18 }).addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 18, pane: 'shadowPane' }).addTo(map);

      L.geoJSON(geo, {
        style: (f) => {
          const w = wards.find(x => x.ward_code === f?.properties?.WD22CD);
          if (!w) return { fillColor: '#ddd6cc', fillOpacity: 0.5, color: '#bbb', weight: 1 };
          return { fillColor: dc(w.composite_decile), fillOpacity: 0.7, color: '#f5f3ee', weight: 1.2 };
        },
        onEachFeature: (f, layer) => {
          const w = wards.find(x => x.ward_code === f.properties?.WD22CD);
          if (!w) return;
          layer.on('click', () => onSelect(w.ward_code));
          layer.on('mouseover', (e) => (e.target as L.Path).setStyle({ fillOpacity: 0.9, weight: 2 }));
          layer.on('mouseout', (e) => (e.target as L.Path).setStyle({ fillOpacity: 0.7, weight: 1.2 }));
          (layer as L.Layer & { bindTooltip: (s: string, o: object) => void }).bindTooltip(
            `<b>${w.ward_name}</b><br>Claimant: ${w.claimant_rate}%<br>Score: ${(w.composite * 100).toFixed(0)} · D${w.composite_decile}`,
            { className: 'map-tooltip', sticky: true }
          );
        },
      }).addTo(map);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legend = (L as any).control({ position: 'bottomleft' });
      legend.onAdd = () => {
        const d = L.DomUtil.create('div', 'map-legend');
        d.innerHTML = `<div class="map-legend-title">Composite disadvantage</div><div style="display:flex;gap:2px;align-items:center"><span style="font-size:9px;color:${MUTED};margin-right:3px">Low</span>${RAMP.map(c => `<div style="width:14px;height:14px;background:${c}"></div>`).join('')}<span style="font-size:9px;color:${MUTED};margin-left:3px">High</span></div>`;
        return d;
      };
      legend.addTo(map);
    }

    init().catch(e => {
      clearInterval(ticker);
      setErrMsg(e.message);
      setStatus('error');
    });

    return () => {
      clearInterval(ticker);
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {status !== 'ready' && (
        <div className="map-loading">
          {status === 'loading' ? (
            <>
              <span style={{ fontSize: 18, fontFamily: 'var(--mono)' }}>{SP[spinIdx]}</span>
              <span>Loading ward boundaries…</span>
            </>
          ) : (
            <span style={{ color: 'var(--q-disad)', fontFamily: 'var(--mono)', fontSize: 11 }}>⚠ Map unavailable: {errMsg}</span>
          )}
        </div>
      )}
      <div ref={containerRef} className="map-container" style={{ display: status === 'ready' ? 'block' : 'none' }} />
    </div>
  );
}
