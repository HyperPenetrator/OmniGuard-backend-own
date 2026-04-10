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
  <div className="absolute bottom-32 right-4 z-[400] bg-charcoal/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-2xl shadow-2xl min-w-[130px]">
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
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 outline-none group relative
        ${active
          ? 'bg-red-500/10 text-red-400'
          : locked
            ? 'text-slate-700 cursor-pointer hover:bg-slate-800/50 hover:text-slate-500'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
        ${isOpen ? 'justify-start mx-2' : 'justify-center mx-0'}
      `}
    >
      <div className={`flex-shrink-0 ${active ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>
        {icon}
      </div>
      {isOpen && (
        <span className={`text-xs font-bold tracking-wide whitespace-nowrap flex-1 text-left ${active ? 'text-red-400' : ''}`}>
          {label}
        </span>
      )}
      {isOpen && locked && (
        <Lock size={11} className="text-slate-700 flex-shrink-0" />
      )}
      {isOpen && coordinatorOnly && isCoordinator && !active && (
        <span className="text-[8px] font-black uppercase tracking-widest text-blue-500/60 flex-shrink-0">CO</span>
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
  return [26.0 + (hash % 20) * 0.1, 91.5 + (hash % 30) * 0.1];
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

  // Data
  const [incidents, setIncidents]   = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading]       = useState(true);

  // UI
  const [navOpen, setNavOpen]               = useState(window.innerWidth >= 1024);
  const [activeView, setActiveView]         = useState(VIEWS.LIVE);
  const [mapType, setMapType]               = useState('dark');
  const [centerCoords, setCenterCoords]     = useState([26.2441, 92.5376]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [sosLoading, setSosLoading]         = useState(null);

  // Live responder positions for Asset Tracking
  const [livePositions, setLivePositions] = useState({});

  const wsUnsubscribers = useRef([]);

  const tileUrls = {
    dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  // Close nav on mobile when view changes
  useEffect(() => {
    if (window.innerWidth < 768) setNavOpen(false);
  }, [activeView]);

  // ── Fetch Initial Data ──────────────────────────────────

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

  // ── Auth Lifecycle ──────────────────────────────────────

  useEffect(() => {
    const handle = () => {
      setAuthenticated(false);
      setUser(null);
      disconnect();
    };
    window.addEventListener('omniguard:auth:expired', handle);
    return () => window.removeEventListener('omniguard:auth:expired', handle);
  }, []);

  // ── WebSocket Lifecycle ─────────────────────────────────

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
      on('TRIAGE_COMPLETE', (payload) => {
        setIncidents(prev =>
          prev.map(inc =>
            inc.id === payload.incidentId
              ? { ...inc, triage: payload.triage, severity: payload.triage?.severity }
              : inc
          )
        );
      }),
      on('SOS_TRIGGERED', (payload) => {
        setIncidents(prev =>
          prev.map(inc =>
            inc.id === payload.incidentId
              ? { ...inc, sosActive: true, status: 'Dispatching' }
              : inc
          )
        );
      }),
      on('RESPONDER_LOCATION_UPDATE', (payload) => {
        setLivePositions(prev => ({
          ...prev,
          [payload.responderId]: { lat: payload.lat, lng: payload.lng },
        }));
        setResponders(prev =>
          prev.map(r =>
            r.id === payload.responderId
              ? { ...r, currentPosition: { lat: payload.lat, lng: payload.lng } }
              : r
          )
        );
      }),
    ];

    return () => {
      wsUnsubscribers.current.forEach(unsub => unsub());
      wsUnsubscribers.current = [];
      disconnect();
    };
  }, [authenticated, fetchData]);

  // ── Handlers ───────────────────────────────────────────

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

  const handleIncidentCreated = (newIncident) => {
    setIncidents(prev => prev.find(i => i.id === newIncident.id) ? prev : [newIncident, ...prev]);
  };

  // ── Nav config ──────────────────────────────────────────

  const navItems = [
    {
      view: VIEWS.LIVE,
      icon: <AlertTriangle size={20} />,
      label: 'Duress Mode',
      coordinatorOnly: false,
    },
    {
      view: VIEWS.HISTORICAL,
      icon: <Clock size={20} />,
      label: 'Historical Alerts',
      coordinatorOnly: true,
    },
    {
      view: VIEWS.ASSETS,
      icon: <Radio size={20} />,
      label: 'Asset Tracking',
      coordinatorOnly: true,
    },
    {
      view: VIEWS.DIAGNOSTICS,
      icon: <Activity size={20} />,
      label: 'System Diagnostics',
      coordinatorOnly: true,
    },
  ];

  // ── Login Gate ──────────────────────────────────────────

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Right Panel Content (non-live views) ────────────────

  const renderSideContent = () => {
    if (activeView === VIEWS.HISTORICAL) {
      return <HistoricalAlerts liveIncidents={incidents} />;
    }
    if (activeView === VIEWS.ASSETS) {
      return <AssetTracking livePositions={livePositions} />;
    }
    if (activeView === VIEWS.DIAGNOSTICS) {
      return <SystemDiagnostics />;
    }
    return null;
  };

  // ── Render Dashboard ────────────────────────────────────

  return (
    <div className="flex h-screen bg-obsidian text-slate-100 font-sans overflow-hidden select-none">

      {/* ── Incident Form Modal ─────────────────────── */}
      {showIncidentForm && (
        <IncidentForm
          onClose={() => setShowIncidentForm(false)}
          onCreated={handleIncidentCreated}
        />
      )}

      {/* ── Left Navigation ─────────────────────────── */}
      <nav
        className={`
          flex flex-col bg-charcoal border-r border-slate-800/60 shadow-2xl z-50
          transition-all duration-300 ease-in-out flex-shrink-0
          ${navOpen ? 'w-60' : 'w-[60px]'}
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-slate-800/50 bg-obsidian/60 flex-shrink-0 ${navOpen ? 'px-4 gap-3 justify-between' : 'justify-center'}`}>
          {navOpen && (
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert className="text-red-500 h-5 w-5 flex-shrink-0" />
              <span className="font-black text-base tracking-widest text-white uppercase truncate">
                Omni<span className="font-light text-slate-400">Guard</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setNavOpen(o => !o)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all duration-200 flex-shrink-0"
          >
            {navOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav Items */}
        <div className={`flex-1 py-4 flex flex-col gap-1 ${navOpen ? '' : 'items-center px-2'}`}>
          {navItems.map(({ view, icon, label, coordinatorOnly }) => (
            <NavItem
              key={view}
              icon={icon}
              label={label}
              isOpen={navOpen}
              active={activeView === view}
              coordinatorOnly={coordinatorOnly}
              isCoordinator={isCoordinator}
              onClick={() => setActiveView(view)}
            />
          ))}
        </div>

        {/* User + Logout */}
        <div className={`border-t border-slate-800/50 p-3 flex-shrink-0`}>
          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 mb-2 ${navOpen ? '' : 'justify-center'}`}>
            <UserCircle size={22} className="text-slate-400 flex-shrink-0" />
            {navOpen && (
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Operator'}</div>
                <div className={`text-[10px] font-mono uppercase tracking-wider truncate ${isCoordinator ? 'text-blue-400' : 'text-slate-500'}`}>
                  {user?.role || 'unknown'}
                </div>
              </div>
            )}
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ${navOpen ? 'justify-start px-2.5' : 'justify-center'}`}
          >
            <LogOut size={16} />
            {navOpen && <span className="text-[10px] font-bold tracking-widest uppercase">Logout</span>}
          </button>
        </div>
      </nav>

      {/* ── Main Console ────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* ── Live Map View (always rendered, hidden when not active) ── */}
        <div
          className={`
            absolute inset-0 flex transition-opacity duration-300
            ${activeView === VIEWS.LIVE ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}
          `}
        >
          {/* Map */}
          <div className="flex-1 relative bg-obsidian">
            <MapContainer center={centerCoords} zoom={8} zoomControl={false} className="w-full h-full z-0">
              <TileLayer url={tileUrls[mapType]} />
              <CenterMap coords={centerCoords} />

              {incidents.map(inc => (
                <Marker key={inc.id} position={getIncidentCoords(inc)} icon={sosIcon}>
                  <Popup className="omni-popup" closeButton={false}>
                    <div className="bg-charcoal p-4 rounded-xl border border-slate-700 shadow-2xl min-w-[220px]">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusBadge(inc.status)}`}>
                          {inc.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{inc.incidentNumber || inc.id?.slice(0, 8)}</span>
                      </div>
                      <h3 className="font-bold text-white mb-1 uppercase tracking-wider text-sm">{inc.type}</h3>
                      <p className="text-xs text-blue-400 font-mono mb-2 flex items-center gap-1.5">
                        <MapIcon size={11} /> {inc.location?.sector || 'Unknown'}
                      </p>
                      {inc.triage?.briefSummary && (
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{inc.triage.briefSummary}</p>
                      )}
                      {isCoordinator && (
                        <button
                          onClick={() => handleSOS(inc.id)}
                          disabled={inc.sosActive || sosLoading === inc.id}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-lg transition tracking-widest shadow-[0_4px_15px_rgba(37,99,235,0.3)] uppercase"
                        >
                          {inc.sosActive ? 'TEAM DISPATCHED' : sosLoading === inc.id ? 'DISPATCHING...' : 'DISPATCH TEAM'}
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {responders.filter(r => r.currentPosition).map(r => (
                <Marker key={r.id} position={[r.currentPosition.lat, r.currentPosition.lng]} icon={responderIcon}>
                  <Popup closeButton={false}>
                    <div className="bg-charcoal p-3 rounded-lg border border-slate-700 shadow-xl">
                      <span className="font-bold text-sm text-white flex items-center gap-2 mb-1">
                        <Shield size={13} className="text-blue-400" /> {r.name}
                      </span>
                      <p className="text-xs text-emerald-400 font-mono font-bold tracking-widest">STATUS: {r.status || 'MOBILE'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Top-left status */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
              <div className="bg-charcoal/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 shadow-2xl pointer-events-auto">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-0.5 flex items-center gap-2">
                  <Radio size={14} className="text-red-500 animate-pulse" /> Live Feed
                </h2>
                <p className="text-xs font-medium text-slate-500 font-mono">
                  SECTOR_ALPHA • {incidents.filter(i => !['Resolved', 'Closed'].includes(i.status)).length} ACTIVE
                </p>
              </div>
              <div className="pointer-events-auto">
                <ConnectionStatus />
              </div>
            </div>

            {/* Top-right map controls */}
            <div className="absolute top-4 right-4 z-[400] flex gap-2">
              <button
                onClick={() => setMapType(m => m === 'dark' ? 'satellite' : 'dark')}
                className="bg-charcoal/90 hover:bg-slate-700 backdrop-blur-md border border-slate-600 text-white p-2.5 rounded-xl shadow-2xl flex items-center gap-2 transition-all duration-200 outline-none"
              >
                <Layers size={16} />
                <span className="text-xs font-bold tracking-widest hidden sm:inline">{mapType === 'dark' ? 'SATELLITE' : 'DARK MAP'}</span>
              </button>
              <button
                onClick={() => setCenterCoords([26.2441, 92.5376])}
                className="bg-charcoal/90 hover:bg-slate-700 backdrop-blur-md border border-slate-600 text-white p-2.5 rounded-xl shadow-2xl flex items-center gap-2 transition-all duration-200 outline-none"
              >
                <Navigation size={16} className="text-blue-400" />
                <span className="text-xs font-bold tracking-widest hidden sm:inline">CENTER</span>
              </button>
            </div>

            <MapLegend />

            {/* Bottom command bar */}
            <div className="absolute bottom-4 left-4 right-4 z-[400]">
              <div className="bg-charcoal/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowIncidentForm(true)}
                    id="open-incident-form"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] outline-none border border-blue-400/40"
                  >
                    <MessageSquare size={15} />
                    <span className="hidden sm:inline">ENCRYPTED COMM</span>
                    <span className="sm:hidden">REPORT</span>
                  </button>
                  <button
                    onClick={fetchData}
                    className="bg-slate-800/80 hover:bg-slate-700 text-white p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 border border-slate-600 outline-none"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="hidden md:flex items-center gap-4 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                    <Shield size={14} className="text-emerald-400" />
                    SECURE_LINK
                  </div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="text-xs font-mono font-bold text-slate-400">
                    LATENCY <span className="text-emerald-400">12ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Incident Feed Panel */}
          <div className="w-[340px] xl:w-[380px] bg-charcoal border-l border-slate-800 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.3)] flex-shrink-0">
            <div className="h-16 px-5 border-b border-slate-800/50 flex items-center justify-between bg-obsidian/60 flex-shrink-0">
              <h2 className="font-bold text-white tracking-widest text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="text-slate-400" /> INCIDENT LOG
              </h2>
              <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest">
                {incidents.filter(i => !['Resolved', 'Closed'].includes(i.status)).length} ACTIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sidebar-scroll flex flex-col gap-3 bg-obsidian/20">
              {loading && incidents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 size={22} className="animate-spin mb-3" />
                  <span className="text-xs font-mono tracking-wider">LOADING FEED...</span>
                </div>
              )}
              {!loading && incidents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Shield size={28} className="mb-3 text-slate-700" />
                  <span className="text-xs font-mono tracking-wider">NO ACTIVE INCIDENTS</span>
                  <span className="text-[10px] text-slate-600 mt-1">All sectors nominal</span>
                </div>
              )}

              {incidents.map((inc, i) => (
                <div
                  key={inc.id}
                  onClick={() => setCenterCoords(getIncidentCoords(inc))}
                  className={`
                    bg-charcoal hover:bg-slate-800 border rounded-2xl p-4 cursor-pointer
                    transition-all duration-200 relative overflow-hidden group
                    hover:-translate-y-0.5 active:scale-[0.99]
                    ${i === 0 && !['Resolved', 'Closed'].includes(inc.status)
                      ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)] ring-1 ring-red-500/20'
                      : 'border-slate-700/60'
                    }
                  `}
                >
                  {i === 0 && !['Resolved', 'Closed'].includes(inc.status) && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444]" />
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusBadge(inc.status)}`}>
                      {inc.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {getTimeSince(inc.createdAt) || 'Just now'}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-100 text-sm mb-1 uppercase tracking-wide group-hover:text-white transition-colors">
                    {inc.type}
                  </h3>

                  <div className="space-y-2 pt-3 border-t border-slate-700/40 font-mono">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Shield size={12} className="text-slate-600" /> Sector</span>
                      <span className="font-bold text-slate-300">{inc.location?.sector || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Battery size={12} className={parseInt(inc.battery) < 20 ? 'text-red-500' : 'text-emerald-500'} /> Power</span>
                      <span className={`font-bold ${parseInt(inc.battery) < 20 ? 'text-red-400' : 'text-slate-300'}`}>{inc.battery || '98%'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><MapIcon size={12} className="text-slate-600" /> Coords</span>
                      <span className="font-bold text-blue-400 text-[11px]">
                        {(() => { const c = getIncidentCoords(inc); return `${c[0].toFixed(3)}, ${c[1].toFixed(3)}`; })()}
                      </span>
                    </div>
                  </div>

                  {/* Coordinator quick actions in feed */}
                  {isCoordinator && !['Resolved', 'Closed'].includes(inc.status) && (
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-700/40">
                      <button
                        onClick={e => { e.stopPropagation(); handleSOS(inc.id); }}
                        disabled={inc.sosActive || sosLoading === inc.id}
                        className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-300 text-[10px] font-bold rounded-lg transition-all duration-200 disabled:opacity-40 uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        {sosLoading === inc.id ? <Loader2 size={10} className="animate-spin" /> : <Shield size={10} />}
                        {inc.sosActive ? 'Active' : 'Dispatch'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature Views (slide in from right) ─────── */}
        <div
          className={`
            absolute inset-0 flex transition-all duration-300 ease-in-out
            ${activeView !== VIEWS.LIVE ? 'opacity-100 pointer-events-auto z-10 translate-x-0' : 'opacity-0 pointer-events-none z-0 translate-x-4'}
          `}
        >
          {renderSideContent()}
        </div>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 12px; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-container { z-index: 0 !important; }
        .leaflet-pane { z-index: 0 !important; }
        .leaflet-map-pane { z-index: 0 !important; }
        .leaflet-tile-pane { z-index: 100 !important; }
        .leaflet-overlay-pane { z-index: 200 !important; }
        .leaflet-marker-pane { z-index: 300 !important; }
        .leaflet-popup-pane { z-index: 350 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 380 !important; }
        @keyframes animate-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .animate-in { animation: animate-in 0.2s ease-out both; }
        .fade-in { animation-name: animate-in; }
        @media (max-width: 768px) {
          .w-\\[340px\\], .xl\\:w-\\[380px\\] { width: 100%; position: absolute; inset: 0; }
        }
      `}} />
    </div>
  );
}
