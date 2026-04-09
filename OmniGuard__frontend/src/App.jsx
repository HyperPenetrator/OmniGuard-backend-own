import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Menu, 
  Map as MapIcon, 
  Navigation, 
  MessageSquare, 
  Radio, 
  Battery, 
  Smartphone, 
  Shield, 
  ChevronLeft, 
  Layers, 
  UserCircle 
} from 'lucide-react';

// Custom Map Markers
const sosHtml = `<div class="sos-pulse-ring"></div>`;
const sosIcon = L.divIcon({
  className: 'sos-marker-pulse',
  html: sosHtml,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const respHtml = `<div class="responder-dot"></div>`;
const responderIcon = L.divIcon({
  className: 'responder-marker-dot',
  html: respHtml,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Mock Incidents & Responders in Assam
const incidents = [
  { id: 'INC-9021', type: 'Severe Flooding', status: 'CRITICAL', user: 'Guwahati Ward 4', battery: '14%', device: 'OmniNode V2', coords: [26.1445, 91.7362], time: '2m ago' },
  { id: 'INC-9022', type: 'River Erosion', status: 'ACTIVE', user: 'Dibrugarh Embankment', battery: '98%', device: 'Radio Hub', coords: [27.4728, 94.9120], time: '14m ago' },
  { id: 'INC-9023', type: 'Communication Outage', status: 'DISPATCHED', user: 'Tezpur Center', battery: 'AC Power', device: 'Satellite Link', coords: [26.6338, 92.7926], time: '1h ago' }
];

const responders = [
  { id: 'R-01', name: 'SDRF Alpha Team', coords: [26.1600, 91.7500] },
  { id: 'R-02', name: 'Dibrugarh Response Unit', coords: [27.4800, 94.9200] },
];

const CenterMap = ({ coords }) => {
  const map = useMap();
  map.setView(coords, map.getZoom(), { animate: true });
  return null;
};

// Legend Component
const MapLegend = () => (
  <div className="absolute bottom-32 right-6 z-[400] bg-charcoal/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-2xl min-w-[140px]">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-700/50">Map Legend</h4>
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse"></div>
        <span className="text-[10px] font-bold text-slate-300">SOS INCIDENT</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
        <span className="text-[10px] font-bold text-slate-300">RESPONDER</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-1 bg-blue-400/50 rounded-full"></div>
        <span className="text-[10px] font-bold text-slate-300">BRAHMAPUTRA</span>
      </div>
    </div>
  </div>
);

// NavItem Component
const NavItem = ({ icon, label, isOpen, active }) => (
  <button className={`w-full flex items-center gap-4 px-4 py-3 mx-2 rounded-xl transition-all outline-none
    ${active ? 'bg-urgent/10 text-urgent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
    ${isOpen ? 'justify-start' : 'justify-center mx-0 w-auto'}
  `}>
    <div className={`${active ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>{icon}</div>
    {isOpen && <span className={`text-sm font-bold tracking-wide whitespace-nowrap ${active ? 'text-urgent' : ''}`}>{label}</span>}
  </button>
);

export default function App() {
  const [navOpen, setNavOpen] = useState(true);
  const [mapType, setMapType] = useState('dark');
  const [centerCoords, setCenterCoords] = useState([26.2441, 92.5376]);

  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  return (
    <div className="flex h-screen bg-obsidian text-slate-100 font-sans overflow-hidden select-none">
      
      {/* Left Navigation */}
      <nav className={`flex flex-col bg-charcoal border-r border-[#1e293b] shadow-2xl transition-all duration-300 z-50 ${navOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-20 px-4 flex items-center justify-between border-b border-slate-800/50 bg-[#0b1121]">
          {navOpen && (
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-urgent h-6 w-6" />
              <span className="font-bold text-lg tracking-widest text-white uppercase">Omni<span className="font-light text-slate-400">Guard</span></span>
            </div>
          )}
          <button onClick={() => setNavOpen(!navOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 mx-auto">
            {navOpen ? <ChevronLeft size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2">
          <NavItem icon={<AlertTriangle size={22} />} label="Duress Mode" isOpen={navOpen} active/>
          <NavItem icon={<Activity size={22}/>} label="Historical Alerts" isOpen={navOpen}/>
          <NavItem icon={<MapIcon size={22}/>} label="Asset Tracking" isOpen={navOpen}/>
          <NavItem icon={<Layers size={22}/>} label="System Diagnostics" isOpen={navOpen}/>
        </div>

        <div className="p-4 border-t border-slate-800">
           <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition text-slate-300">
             <UserCircle size={24} className="text-slate-400"/>
             {navOpen && <div className="text-left">
               <div className="text-sm font-bold text-white">Commander</div>
               <div className="text-xs text-slate-500">Node Alpha-1</div>
             </div>}
           </button>
        </div>
      </nav>

      {/* Main Console */}
      <main className="flex-1 flex relative">
        
        {/* Central Map Area */}
        <div className="flex-1 relative bg-[#0b1121]">
          <MapContainer center={centerCoords} zoom={8} zoomControl={false} className="w-full h-full z-0">
            <TileLayer url={tileUrls[mapType]} />
            <CenterMap coords={centerCoords} />

            {/* Incidents API Output */}
            {incidents.map(inc => (
              <Marker key={inc.id} position={inc.coords} icon={sosIcon}>
                <Popup className="omni-popup" closeButton={false}>
                  <div className="bg-charcoal p-4 rounded-xl border border-slate-700 shadow-2xl min-w-[220px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-urgent px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded shadow-[0_0_10px_rgba(239,68,68,0.2)] uppercase tracking-wider">{inc.status}</span>
                      <span className="text-[10px] font-mono text-slate-400">{inc.id}</span>
                    </div>
                    <h3 className="font-bold text-white mb-1 uppercase tracking-wider text-sm">{inc.type}</h3>
                    <p className="text-xs text-blue-400 font-mono mb-4 flex items-center gap-2"><MapIcon size={12}/> {inc.coords[0].toFixed(5)}, {inc.coords[1].toFixed(5)}</p>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition tracking-widest shadow-[0_4px_15px_rgba(37,99,235,0.4)]">DISPATCH TEAM</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Active Responders Data */}
            {responders.map(r => (
              <Marker key={r.id} position={r.coords} icon={responderIcon}>
                <Popup closeButton={false}>
                  <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-700 shadow-xl">
                    <span className="font-bold text-sm text-white flex items-center gap-2 mb-1"><Shield size={14} className="text-blue-400"/> {r.name}</span>
                    <p className="text-xs text-green-400 font-mono font-bold tracking-widest">STATUS: MOBILE</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating UI: Top Left Status */}
          <div className="absolute top-6 left-6 z-[400] flex flex-col gap-3 pointer-events-none">
            <div className="bg-charcoal/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl pointer-events-auto">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2 drop-shadow-md">
                 <Radio size={16} className="text-urgent animate-pulse"/> Live Screen
              </h2>
              <p className="text-xs font-medium text-slate-400 font-mono">SECTOR_ALPHA • 3 EVENTS</p>
            </div>
          </div>

          {/* Floating UI: Top Right Map Controls */}
          <div className="absolute top-6 right-6 z-[400] flex gap-3">
            <button onClick={() => setMapType(m => m === 'dark' ? 'satellite' : 'dark')} className="bg-charcoal/90 hover:bg-slate-700 backdrop-blur-md border border-slate-600 text-white p-3 rounded-xl shadow-2xl flex items-center gap-2 transition outline-none">
              <Layers size={18}/>
              <span className="text-xs font-bold tracking-widest">{mapType === 'dark' ? 'SATELLITE' : 'DARK MAP'}</span>
            </button>
            <button onClick={() => setCenterCoords([26.2441, 92.5376])} className="bg-charcoal/90 hover:bg-slate-700 backdrop-blur-md border border-slate-600 text-white p-3 rounded-xl shadow-2xl flex items-center gap-2 transition outline-none">
              <Navigation size={18} className="text-blue-400"/>
              <span className="text-xs font-bold tracking-widest">CENTER ASSAM</span>
            </button>
          </div>

          {/* Map Legend */}
          <MapLegend />

          {/* Floating UI: Bottom Command Bar */}
          <div className="absolute bottom-6 left-6 right-6 z-[400]">
            <div className="bg-charcoal/95 backdrop-blur-xl border border-slate-700 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition shadow-[0_0_20px_rgba(37,99,235,0.4)] outline-none border border-blue-400/50">
                  <MessageSquare size={18}/>
                  ENCRYPTED COMM
                </button>
                <button className="bg-[#0f172a] hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition border border-slate-600 shadow-inner outline-none">
                  <Activity size={18} className="text-urgent"/>
                  MASS NOTIFICATION
                </button>
              </div>
              <div className="flex items-center gap-6 px-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
                  <Shield size={16} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"/> 
                  SECURE_LINK
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
                  LATENCY <span className="text-emerald-400">12ms</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Incident Feed Panel */}
        <div className="w-[380px] bg-charcoal border-l border-slate-800 flex flex-col z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.3)]">
          <div className="h-20 px-6 border-b border-slate-800/50 flex items-center justify-between bg-[#0b1121]">
            <h2 className="font-bold text-white tracking-widest text-sm flex items-center gap-2"><AlertTriangle size={18} className="text-slate-400"/> INCIDENT LOG</h2>
            <span className="bg-urgent/10 text-urgent border border-urgent/30 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">{incidents.length} CRITICAL</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 sidebar-scroll flex flex-col gap-5 bg-obsidian/30">
            {incidents.map((inc, i) => (
              <div key={inc.id} onClick={() => setCenterCoords(inc.coords)} className={`bg-charcoal hover:bg-slate-800 border ${i === 0 ? 'border-urgent/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-urgent/30' : 'border-slate-700'} rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group transform hover:-translate-y-1`}>
                
                {/* Critical Top Accent line */}
                {i === 0 && <div className="absolute top-0 left-0 w-full h-[3px] bg-urgent shadow-[0_0_10px_#ef4444]"></div>}
                
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${inc.status === 'CRITICAL' ? 'bg-urgent text-white animate-pulse shadow-md border border-red-400' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
                    {inc.status}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">{inc.time}</span>
                </div>
                
                <h3 className="font-black text-slate-100 text-[15px] mb-1.5 uppercase tracking-wide group-hover:text-white transition-colors">{inc.type}</h3>
                <p className="text-xs text-slate-400 mb-5 max-w-[90%]">Coordinates have been logged. Awaiting operator action.</p>
                
                <div className="space-y-3 pt-4 border-t border-slate-700/60 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-2"><Shield size={14} className="text-slate-600"/> Target</span>
                    <span className="font-bold text-slate-200 tracking-wide">{inc.user}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-2"><Smartphone size={14} className="text-slate-600"/> Hardware</span>
                    <span className="font-bold text-slate-200">{inc.device}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-2"><Battery size={14} className={inc.battery.includes('%') && parseInt(inc.battery) < 20 ? 'text-urgent' : 'text-emerald-500'}/> Power</span>
                    <span className={`font-bold ${inc.battery.includes('%') && parseInt(inc.battery) < 20 ? 'text-urgent' : 'text-slate-200'}`}>{inc.battery}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-2"><MapIcon size={14} className="text-slate-600"/> Loc</span>
                    <span className="font-bold text-blue-400">{inc.coords[0].toFixed(4)}, {inc.coords[1].toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 12px; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
      `}} />
    </div>
  );
}
