import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Navigation, RefreshCw, Loader2, Radio,
  Shield, Wifi, WifiOff, ShieldOff, Battery, Clock,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { getResponders } from '../services/api';
import { useCoordinator } from '../hooks/useCoordinator';

// ── Helpers ──────────────────────────────────────────────

function getTimeSince(dateStr) {
  if (!dateStr) return '—';
  let date;
  if (dateStr?._seconds) date = new Date(dateStr._seconds * 1000);
  else date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Just now';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function AccessDenied() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldOff size={36} className="text-red-500/60" />
      </div>
      <div>
        <h3 className="text-white font-black text-lg tracking-wider uppercase mb-2">Access Restricted</h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          Asset Tracking is a <span className="text-blue-400 font-bold">Coordinator</span> exclusive feature.
        </p>
      </div>
      <div className="px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-slate-500 tracking-widest uppercase">
        CLEARANCE_LEVEL: INSUFFICIENT
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────

const STATUS_CONFIG = {
  available: { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]', label: 'AVAILABLE' },
  responding: { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', dot: 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse', label: 'RESPONDING' },
  'on scene': { color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', dot: 'bg-orange-400', label: 'ON SCENE' },
  busy: { color: 'text-red-400 border-red-500/30 bg-red-500/10', dot: 'bg-red-400', label: 'BUSY' },
  offline: { color: 'text-slate-500 border-slate-600/30 bg-slate-700/30', dot: 'bg-slate-600', label: 'OFFLINE' },
};

function statusConf(status) {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.offline;
}

// ── Team Type Badge ──────────────────────────────────────

const TEAM_COLORS = {
  medical:   'text-red-300 bg-red-500/10 border-red-500/20',
  fire:      'text-orange-300 bg-orange-500/10 border-orange-500/20',
  security:  'text-blue-300 bg-blue-500/10 border-blue-500/20',
  flood:     'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  structural:'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
};

// ── Responder Card ───────────────────────────────────────

function ResponderCard({ responder, livePosition }) {
  const conf = statusConf(responder.status);
  const pos = livePosition || responder.currentPosition;
  const teamColor = TEAM_COLORS[responder.teamType?.toLowerCase()] || 'text-slate-300 bg-slate-700/20 border-slate-600/20';

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${
      responder.status?.toLowerCase() === 'offline' || !responder.status
        ? 'border-slate-700/40 bg-slate-800/20 opacity-60'
        : 'border-slate-700 bg-charcoal hover:border-slate-600'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-100 text-sm truncate">{responder.name}</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${teamColor}`}>
              {responder.teamType || 'General'}
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${conf.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
          {conf.label}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2 text-xs font-mono">
        {pos ? (
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
            <Navigation size={12} className="text-blue-400 flex-shrink-0" />
            <span className="text-blue-300 font-bold">
              {pos.lat?.toFixed(4)}, {pos.lng?.toFixed(4)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/30">
            <MapPin size={12} className="text-slate-600 flex-shrink-0" />
            <span className="text-slate-600">No GPS signal</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/30">
            <div className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Radio</div>
            <div className="flex items-center gap-1">
              {responder.radioChannel ? (
                <><Radio size={10} className="text-emerald-400" /><span className="text-slate-300 text-[11px]">CH {responder.radioChannel}</span></>
              ) : <span className="text-slate-600 text-[11px]">—</span>}
            </div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/30">
            <div className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Last Ping</div>
            <div className="text-slate-400 text-[11px]">{getTimeSince(responder.lastUpdated)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Asset Tracking View ──────────────────────────────────

export default function AssetTracking({ livePositions }) {
  const isCoordinator = useCoordinator();
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchResponders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResponders();
      if (res.success) {
        setResponders(res.data || []);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('[AssetTracking] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCoordinator) return;
    fetchResponders();
    const interval = setInterval(fetchResponders, 30000);
    return () => clearInterval(interval);
  }, [fetchResponders, isCoordinator]);

  if (!isCoordinator) return <AccessDenied />;

  const filterOptions = [
    { key: 'all', label: 'All Assets' },
    { key: 'available', label: 'Available' },
    { key: 'responding', label: 'Responding' },
    { key: 'offline', label: 'Offline' },
  ];

  const filtered = responders.filter(r => {
    if (filter === 'all') return true;
    return r.status?.toLowerCase() === filter;
  });

  const stats = {
    total: responders.length,
    available: responders.filter(r => r.status?.toLowerCase() === 'available').length,
    responding: responders.filter(r => ['responding', 'on scene'].includes(r.status?.toLowerCase())).length,
    offline: responders.filter(r => !r.status || r.status?.toLowerCase() === 'offline').length,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800/50 bg-obsidian/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-base uppercase tracking-widest flex items-center gap-2">
              <Radio size={18} className="text-emerald-400 animate-pulse" />
              Asset Tracking
            </h2>
            <p className="text-slate-500 text-xs font-mono mt-0.5 tracking-wider">
              COORDINATOR VIEW • {lastRefresh ? `UPDATED ${getTimeSince(lastRefresh)}` : 'LIVE FEED'}
            </p>
          </div>
          <button
            onClick={fetchResponders}
            id="asset-refresh"
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-200' },
            { label: 'Available', value: stats.available, color: 'text-emerald-400' },
            { label: 'Active', value: stats.responding, color: 'text-amber-400' },
            { label: 'Offline', value: stats.offline, color: 'text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 text-center">
              <div className={`text-lg font-black font-mono ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              id={`asset-filter-${opt.key}`}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 border ${
                filter === opt.key
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-800/40 text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 size={22} className="animate-spin mb-3 text-emerald-500/60" />
            <span className="text-xs font-mono tracking-wider">SCANNING ASSET POSITIONS...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <MapPin size={28} className="mb-3 text-slate-700" />
            <span className="text-xs font-mono tracking-wider">NO ASSETS MATCH FILTER</span>
          </div>
        )}

        {!loading && filtered.map(r => (
          <ResponderCard
            key={r.id}
            responder={r}
            livePosition={livePositions?.[r.id]}
          />
        ))}

        {!loading && responders.length === 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
            <p className="text-amber-400 text-xs font-mono">No responders registered in system</p>
          </div>
        )}
      </div>
    </div>
  );
}
