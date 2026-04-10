import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  UserCircle,
  Plus,
  LogOut,
  RefreshCw,
  Zap,
  Loader2,
  Clock,
  Server,
  Lock,
} from 'lucide-react';

// Services
import {
  isAuthenticated, getStoredUser,
  getIncidents, getResponders, triggerSOS,
  logout as apiLogout,
} from './services/api';
import { connect, disconnect, on, getConnectionState } from './services/ws';
import { getAccessToken } from './services/api';
import { useCoordinator } from './hooks/useCoordinator';

// Components
import LoginScreen from './components/LoginScreen';
import ConnectionStatus from './components/ConnectionStatus';
import IncidentForm from './components/IncidentForm';
import HistoricalAlerts from './components/HistoricalAlerts';
import AssetTracking from './components/AssetTracking';
import SystemDiagnostics from './components/SystemDiagnostics';

// ── Views ────────────────────────────────────────────────
const VIEWS = {
  LIVE:        'live',
  HISTORICAL:  'historical',
  ASSETS:      'assets',
  DIAGNOSTICS: 'diagnostics',
};

// ── Custom Map Markers ───────────────────────────────────

const sosIcon = L.divIcon({
  className: 'sos-marker-pulse',
  html: `<div class="sos-pulse-ring"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const responderIcon = L.divIcon({
  className: 'responder-marker-dot',
  html: `<div class="responder-dot"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ── Map Utilities ────────────────────────────────────────

const CenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom(), { animate: true });
  }, [coords, map]);
  return null;
};

const MapLegend = () => (
  <div className="absolute bottom-32 right-4 z-[400] bg-charcoal/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-2xl shadow-2xl min-w-[130px] hide-mobile">
    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pb-1.5 border-b border-slate-700/50">Legend</h4>
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse" />
        <span className="text-[10px] font-bold text-slate-300">SOS INCIDENT</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
        <span className="text-[10px] font-bold text-slate-300">RESPONDER</span>
      </div>
    </div>
  </div>
);

// ── Nav Item ─────────────────────────────────────────────

const NavItem = ({ icon, label, isOpen, active, onClick, coordinatorOnly, isCoordinator }) => {
  const locked = coordinatorOnly && !isCoordinator;
  return (
    <button
      onClick={locked ? undefined : onClick}
      title={!isOpen ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 outline-none group relative
        ${active
          ? 'bg-blue-600/10 text-blue-400 shadow-[inset_0_0_12px_rgba(37,99,235,0.1)]'
          : locked
            ? 'text-slate-700 cursor-not-allowed grayscale'
            : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-200'}
        ${isOpen ? 'justify-start mx-2' : 'justify-center mx-0'}
      `}
    >
      <div className={`flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
        {icon}
      </div>
      {isOpen && (
        <span className={`text-[11px] font-black tracking-widest uppercase flex-1 text-left ${active ? 'text-blue-400' : ''}`}>
          {label}
        </span>
      )}
      {isOpen && locked && (
        <Lock size={11} className="text-slate-800 flex-shrink-0" />
      )}
    </button>
  );
};

// ── Helpers ──────────────────────────────────────────────

function getIncidentCoords(inc) {
  if (inc.location?.coordinates) {
    return [inc.location.coordinates.lat, inc.location.coordinates.lng];
  }
  const hash = inc.id?.charCodeAt(0) || 0;
  return [26.24, 91.73 + (hash % 10) * 0.1];
}

function getStatusBadge(status) {
  const map = {
    Reported:    'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Triaged:     'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Dispatching: 'bg-red-500 text-white border-red-400 animate-pulse shadow-md',
    'En Route':  'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'On Scene':  'bg-orange-500/10 text-orange-400 border-orange-500/30',
    Resolved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Closed:      'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };
  return map[status] || 'bg-slate-500/10 text-slate-300 border-slate-500/30';
}

function getTimeSince(dateStr) {
  if (!dateStr) return '';
  let date;
  if (dateStr?.toDate) date = dateStr.toDate();
  else if (dateStr?._seconds) date = new Date(dateStr._seconds * 1000);
  else date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Just now';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${Math.max(0, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ══════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser]                   = useState(getStoredUser());
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const isCoordinator                     = useCoordinator();

  const [incidents, setIncidents]   = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading]       = useState(true);

  const [navOpen, setNavOpen]               = useState(window.innerWidth >= 1280);
  const [activeView, setActiveView]         = useState(VIEWS.LIVE);
  const [mapType, setMapType]               = useState('dark');
  const [centerCoords, setCenterCoords]     = useState([26.2441, 92.5376]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [sosLoading, setSosLoading]         = useState(null);

  const [livePositions, setLivePositions] = useState({});

  const wsUnsubscribers = useRef([]);

  const tileUrls = {
    dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setNavOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [incRes, respRes] = await Promise.allSettled([
        getIncidents({ limit: 50 }),
        getResponders().catch(() => ({ success: true, data: [] })),
      ]);
      if (incRes.status === 'fulfilled' && incRes.value?.success) {
        setIncidents(incRes.value.data || []);
      }
      if (respRes.status === 'fulfilled' && respRes.value?.success) {
        setResponders(respRes.value.data || []);
      }
    } catch (err) {
      console.error('[App] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const token = getAccessToken();
    if (!token) return;

    connect(token);

    wsUnsubscribers.current = [
      on('INCIDENT_CREATED', (payload) => {
        const incident = payload.incident || payload;
        setIncidents(prev => prev.find(i => i.id === incident.id) ? prev : [incident, ...prev]);
      }),
      on('INCIDENT_UPDATED', (payload) => {
        setIncidents(prev =>
          prev.map(inc =>
            inc.id === (payload.incidentId || payload.incident?.id)
              ? { ...inc, ...payload.incident, status: payload.newStatus || inc.status }
              : inc
          )
        );
      }),
      on('INCIDENT_DELETED', (payload) => {
        setIncidents(prev => prev.filter(inc => inc.id !== payload.incidentId));
      }),
      on('RESPONDER_LOCATION_UPDATE', (payload) => {
        setLivePositions(prev => ({
          ...prev,
          [payload.responderId]: { lat: payload.lat, lng: payload.lng },
        }));
      }),
    ];

    return () => {
      wsUnsubscribers.current.forEach(unsub => unsub());
      wsUnsubscribers.current = [];
      disconnect();
    };
  }, [authenticated, fetchData]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    apiLogout();
    setAuthenticated(false);
    setUser(null);
    setIncidents([]);
    setResponders([]);
    setActiveView(VIEWS.LIVE);
  };

  const handleSOS = async (incidentId) => {
    setSosLoading(incidentId);
    try { await triggerSOS(incidentId); }
    catch (err) { console.error('[SOS] Failed:', err); }
    finally { setSosLoading(null); }
  };

  const navItems = [
    { view: VIEWS.LIVE, icon: <AlertTriangle size={18} />, label: 'Duress Live', coordinatorOnly: false },
    { view: VIEWS.HISTORICAL, icon: <Clock size={18} />, label: 'Archives', coordinatorOnly: true },
    { view: VIEWS.ASSETS, icon: <Radio size={18} />, label: 'Assets', coordinatorOnly: true },
    { view: VIEWS.DIAGNOSTICS, icon: <Activity size={18} />, label: 'System', coordinatorOnly: true },
  ];

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const renderSideContent = () => {
    if (activeView === VIEWS.HISTORICAL) return <HistoricalAlerts liveIncidents={incidents} />;
    if (activeView === VIEWS.ASSETS) return <AssetTracking livePositions={livePositions} />;
    if (activeView === VIEWS.DIAGNOSTICS) return <SystemDiagnostics />;
    return null;
  };

  return (
    <div className="flex h-screen bg-obsidian text-slate-100 font-sans overflow-hidden select-none">
      
      {/* ── Modals ──────────────────────────────────── */}
      {showIncidentForm && (
        <IncidentForm onClose={() => setShowIncidentForm(false)} onCreated={fetchData} />
      )}

      {/* ── Navigation ──────────────────────────────── */}
      <nav className={`flex flex-col bg-charcoal border-r border-white/5 z-50 transition-all duration-500 ease-[0.23,1,0.32,1] flex-shrink-0 ${navOpen ? 'w-64' : 'w-[64px]'}`}>
        <div className={`h-16 flex items-center border-b border-white/5 ${navOpen ? 'px-5 justify-between' : 'justify-center'}`}>
          {navOpen && (
            <div className="flex items-center gap-3 anim-fade-in">
              <ShieldAlert className="text-blue-500 h-5 w-5" />
              <span className="font-black text-xs tracking-[0.3em] text-white uppercase">OMNIGUARD</span>
            </div>
          )}
          <button onClick={() => setNavOpen(!navOpen)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            {navOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2">
          {navItems.map(item => (
            <NavItem
              key={item.view}
              {...item}
              isOpen={navOpen}
              active={activeView === item.view}
              isCoordinator={isCoordinator}
              onClick={() => setActiveView(item.view)}
            />
          ))}
        </div>

        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 mb-3 ${navOpen ? '' : 'justify-center'}`}>
            <UserCircle size={22} className="text-blue-500/60 flex-shrink-0" />
            {navOpen && (
              <div className="min-w-0 anim-fade-in">
                <div className="text-[11px] font-black text-white truncate uppercase tracking-widest">{user?.name?.split(' ')[0] || 'ADMIN'}</div>
                <div className="text-[9px] font-mono text-slate-600 uppercase truncate">
                  {user?.role || 'operator'}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-3 rounded-xl text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 ${navOpen ? 'px-4' : 'justify-center'}`}>
            <LogOut size={16} />
            {navOpen && <span className="text-[10px] font-black uppercase tracking-widest">Terminate Link</span>}
          </button>
        </div>
      </nav>

      {/* ── Main Canvas ─────────────────────────────── */}
      <main className="flex-1 relative flex overflow-hidden">
        
        {/* Map Layer */}
        <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${activeView !== VIEWS.LIVE ? 'scale-[1.02] blur-md opacity-40' : 'scale-100 blur-0 opacity-100'}`}>
          <MapContainer center={centerCoords} zoom={11} zoomControl={false} className="w-full h-full">
            <TileLayer url={tileUrls[mapType]} />
            <CenterMap coords={centerCoords} />

            {incidents.map(inc => (
              <Marker key={inc.id} position={getIncidentCoords(inc)} icon={sosIcon}>
                <Popup className="omni-popup" closeButton={false}>
                   <div className="bg-charcoal p-4 rounded-2xl border border-white/5 shadow-2xl min-w-[200px] anim-scale-in">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border tracking-widest uppercase ${getStatusBadge(inc.status)}`}>{inc.status}</span>
                        <span className="text-[9px] font-mono text-slate-600">#{inc.id?.slice(-4).toUpperCase()}</span>
                      </div>
                      <h3 className="font-black text-white text-xs uppercase tracking-widest mb-1">{inc.type}</h3>
                      <p className="text-[10px] text-blue-400 font-mono mb-4 flex items-center gap-1.5"><MapIcon size={12} /> {inc.location?.sector || 'UNKNOWN'}</p>
                      {isCoordinator && !['Resolved', 'Closed'].includes(inc.status) && (
                        <button onClick={() => handleSOS(inc.id)} className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black rounded-xl tracking-[0.2em] uppercase shadow-lg shadow-blue-900/40">DISPATCH</button>
                      )}
                   </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute top-6 left-6 z-[400] flex flex-col gap-3 pointer-events-none">
            <div className="bg-obsidian/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl pointer-events-auto anim-fade-up">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                Neural Feed
              </h2>
              <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Sector_Alpha • {incidents.filter(i => !['Resolved', 'Closed'].includes(i.status)).length} Active Threats</p>
            </div>
            <div className="pointer-events-auto"><ConnectionStatus /></div>
          </div>

          <div className="absolute top-6 right-6 z-[400] flex gap-2 pointer-events-auto">
             <button onClick={() => setMapType(m => m === 'dark' ? 'satellite' : 'dark')} className="p-3 bg-obsidian/80 backdrop-blur-xl border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
               <Layers size={16} />
             </button>
             <button onClick={() => setCenterCoords([26.2441, 92.5376])} className="p-3 bg-obsidian/80 backdrop-blur-xl border border-white/5 rounded-2xl text-blue-400 hover:text-blue-300 transition-all shadow-xl">
               <Navigation size={16} />
             </button>
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none">
             <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 pointer-events-auto bg-obsidian/90 backdrop-blur-2xl border border-white/5 rounded-3xl p-5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
                <button onClick={() => setShowIncidentForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] flex items-center gap-3 transition-all shadow-lg shadow-blue-900/40 uppercase">
                  <Plus size={16} /> New Intel Report
                </button>
                <div className="hidden md:flex items-center gap-6">
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Protocol</span>
                      <span className="text-[10px] font-black text-emerald-500 tracking-[0.1em]">SECURE_CRYPT_v2</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Feature Overlay View */}
        <div 
          className={`absolute inset-0 z-20 bg-obsidian/40 backdrop-blur-md transition-all duration-500 ease-[0.23,1,0.32,1] ${
            activeView !== VIEWS.LIVE ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div 
            className={`absolute right-0 top-0 bottom-0 w-full lg:w-[480px] xl:w-[560px] bg-obsidian border-l border-white/5 shadow-[-30px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[0.23,1,0.32,1] ${
              activeView !== VIEWS.LIVE ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
             {activeView !== VIEWS.LIVE && renderSideContent()}
             <button onClick={() => setActiveView(VIEWS.LIVE)} className="absolute top-6 left-[-64px] p-4 bg-obsidian border border-white/5 border-r-0 rounded-l-2xl text-slate-400 hover:text-white transition-all shadow-2xl">
                <LogOut size={20} className="rotate-180" />
             </button>
          </div>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .omni-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .omni-popup .leaflet-popup-tip { display: none; }
      `}} />
    </div>
  );
}
