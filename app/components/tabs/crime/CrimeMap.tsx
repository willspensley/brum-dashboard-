'use client';

import { useEffect, useRef } from 'react';
import type { Ward } from '@/lib/types';
import { CRIME_RAMP } from '@/lib/constants';

interface Props {
  wards: Ward[];
  onSelect: (code: string) => void;
}

const BOUNDS_URL =
  'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query?where=LAD22CD%3D%27E08000025%27&outFields=WD22CD%2CWD22NM&f=geojson&returnGeometry=true';

export default function CrimeMap({ wards, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInited = useRef(false);

  useEffect(() => {
    if (mapInited.current || !mapRef.current) return;
    mapInited.current = true;

    const maxRate = Math.max(...wards.map(w => w.crime_rate_per_1000));
    const wardIndex = Object.fromEntries(wards.map(w => [w.ward_code, w]));

    const rampColor = (rate: number) => {
      const idx = Math.round((rate / maxRate) * 9);
      return CRIME_RAMP[Math.max(0, Math.min(9, idx))];
    };

    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false })
        .setView([52.48, -1.9], 11);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 18,
      }).addTo(map);

      fetch(BOUNDS_URL)
        .then(r => r.json())
        .then((geo: GeoJSON.FeatureCollection) => {
          L.geoJSON(geo, {
            style: feat => {
              const w = wardIndex[feat?.properties?.WD22CD ?? ''];
              return {
                fillColor: w ? rampColor(w.crime_rate_per_1000) : '#ccc',
                fillOpacity: 0.75,
                color: '#0e0f11',
                weight: 0.7,
              };
            },
            onEachFeature: (feat, layer) => {
              const code = feat.properties?.WD22CD ?? '';
              const w = wardIndex[code];
              if (w) {
                layer.bindTooltip(`<b>${w.ward_name}</b><br>${w.crime_rate_per_1000.toFixed(1)} crimes/1000<br>Rank #${w.crime_rank}`, { sticky: true });
                layer.on('click', () => onSelect(code));
              }
            },
          }).addTo(map);
        })
        .catch(console.error);
    });
  }, [wards, onSelect]);

  return <div ref={mapRef} className="map-container" style={{ height: '100%', minHeight: 420 }} />;
}
