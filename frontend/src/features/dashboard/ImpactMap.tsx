import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { SimulationResult } from '../scenario/types';
import 'leaflet/dist/leaflet.css';
import './ImpactMap.css';

interface ImpactMapProps {
  result: SimulationResult;
  activeLayer: 'environmental' | 'financial' | 'human' | 'risks';
}

// Key Hyderabad zones
const ZONES = [
  { name: 'Hi-tech City', lat: 17.4459, lng: 78.3782, area: 'IT / Commercial', axes: { environmental: 0.5, financial: 1.0, human: 0.6, risks: 0.4 } },
  { name: 'Charminar / Old City', lat: 17.3616, lng: 78.4747, area: 'Dense Residential', axes: { environmental: 1.0, financial: 0.4, human: 1.0, risks: 0.8 } },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983, area: 'Transport Hub', axes: { environmental: 0.9, financial: 0.6, human: 0.7, risks: 0.9 } },
  { name: 'Gachibowli', lat: 17.4401, lng: 78.3489, area: 'IT Corridor', axes: { environmental: 0.5, financial: 0.9, human: 0.5, risks: 0.5 } },
  { name: 'LB Nagar', lat: 17.3483, lng: 78.5540, area: 'South Corridor', axes: { environmental: 0.7, financial: 0.3, human: 0.8, risks: 0.7 } },
  { name: 'Kukatpally', lat: 17.4849, lng: 78.3995, area: 'Residential Hub', axes: { environmental: 0.8, financial: 0.5, human: 0.9, risks: 0.6 } },
  { name: 'Ameerpet', lat: 17.4374, lng: 78.4487, area: 'Commerce / Metro', axes: { environmental: 0.7, financial: 0.7, human: 0.7, risks: 0.7 } },
  { name: 'Uppal', lat: 17.4058, lng: 78.5592, area: 'East Industrial', axes: { environmental: 0.9, financial: 0.6, human: 0.6, risks: 0.8 } },
];

const LAYER_COLORS = {
  environmental: { low: '#22c55e', high: '#ef4444', label: '🌿 Environmental' },
  financial: { low: '#06b6d4', high: '#f59e0b', label: '💰 Financial' },
  human: { low: '#a78bfa', high: '#ec4899', label: '👥 Human' },
  risks: { low: '#f59e0b', high: '#ef4444', label: '⚠️ Risks' },
};

function interpolateColor(t: number, low: string, high: string): string {
  // Simple linear interpolation between two hex colors
  const hexToRgb = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = hexToRgb(low);
  const [r2, g2, b2] = hexToRgb(high);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function MapRecenter() {
  const map = useMap();
  // Re-invalidate size after mount (important for hidden/flex containers)
  setTimeout(() => map.invalidateSize(), 200);
  return null;
}

export default function ImpactMap({ result, activeLayer }: ImpactMapProps) {
  const layerMeta = LAYER_COLORS[activeLayer];

  const axisScore = useMemo(() => {
    const axis = result.impacts.find(i => i.category === activeLayer);
    return axis ? axis.score / 100 : 0.5;
  }, [result, activeLayer]);

  return (
    <div className="impact-map">
      <MapContainer
        center={[17.4065, 78.4772]}
        zoom={11}
        className="impact-map__leaflet"
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapRecenter />

        {ZONES.map((zone) => {
          const zoneWeight = zone.axes[activeLayer];
          const intensity = zoneWeight * axisScore;
          const color = interpolateColor(intensity, layerMeta.low, layerMeta.high);
          const radius = 500 + intensity * 4000;

          return (
            <CircleMarker
              key={zone.name}
              center={[zone.lat, zone.lng]}
              radius={14 + intensity * 20}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.35 + intensity * 0.3,
                weight: 2,
              }}
            >
              <Popup className="impact-map__popup">
                <div className="impact-map__popup-content">
                  <strong>{zone.name}</strong>
                  <span className="impact-map__popup-area">{zone.area}</span>
                  <div className="impact-map__popup-score">
                    {layerMeta.label}: <b>{Math.round(intensity * 100)}%</b> impact
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
