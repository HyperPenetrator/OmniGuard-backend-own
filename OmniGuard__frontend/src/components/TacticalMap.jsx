import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createTacticalIcon = (status) => {
  const colorClass = status === 'detected' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]';
  const animationClass = status === 'detected' ? 'animate-ping' : 'animate-pulse';

  return L.divIcon({
    className: 'custom-tactical-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-4 h-4 ${colorClass} rounded-full ${animationClass} opacity-75"></div>
        <div class="relative w-3 h-3 ${colorClass} rounded-full border-2 border-white/20"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function TacticalMap({ incidents, userLocation, targetIncident }) {
  // Center of Assam/Guwahati
  const position = [26.1445, 91.7362];
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : position;

  const unitIcon = L.divIcon({
    className: 'custom-unit-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-25"></div>
        <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <div className="h-full w-full rounded-2xl border border-slate-800 overflow-hidden tactical-glow relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* User Location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={unitIcon}>
            <Popup>Your Current Position</Popup>
          </Marker>
        )}

        {/* Target Routing Polyline */}
        {targetIncident?.location?.coordinates && userLocation && (
          <Polyline 
            positions={[
              [userLocation.lat, userLocation.lng],
              [targetIncident.location.coordinates.lat, targetIncident.location.coordinates.lng]
            ]}
            pathOptions={{ 
              color: '#10b981', 
              weight: 4, 
              dashArray: '10, 10',
              opacity: 0.6
            }}
          />
        )}

        {incidents.filter(inc => inc.location?.coordinates).map((inc) => (
          <Marker 
            key={inc.id}
            position={[inc.location.coordinates.lat, inc.location.coordinates.lng]} 
            icon={createTacticalIcon(inc.status)}
          >
            <Popup className="tactical-popup">
              <div className="bg-slate-900 text-white p-2 rounded-lg font-sans border border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{inc.incidentNumber || inc.id}</p>
                <p className="text-xs font-bold">{inc.type}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${inc.status === 'detected' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400">{inc.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <ChangeView center={mapCenter} zoom={13} />
      </MapContainer>

    </div>
  );
}
