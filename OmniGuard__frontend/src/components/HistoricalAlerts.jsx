import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Filter, Calendar, Clock, MapPin,
  ChevronDown, ChevronUp, AlertTriangle, Shield,
  CheckCircle, XCircle, MoreVertical, RefreshCw,
  ArrowRight, ShieldOff, SearchX, Download, Loader2
} from 'lucide-react';
import { getIncidents, updateIncidentStatus } from '../services/api';
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
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AccessDenied() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center bg-obsidian">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center anim-scale-in">
        <ShieldOff size={36} className="text-red-500/60" />
      </div>
      <div>
        <h3 className="text-white font-black text-lg tracking-wider uppercase mb-2">Access Restricted</h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          Historical Alerts is a <span className="text-blue-400 font-bold">Coordinator</span> exclusive database.
        </p>
      </div>
      <div className="px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-slate-500 tracking-widest uppercase">
        CLEARANCE_LEVEL: INSUFFICIENT
      </div>
    </div>
  );
}

const STATUS_MAP = {
  Reported:    'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold',
  Triaged:     'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Dispatching: 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse',
  'En Route':  'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'On Scene':  'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Resolved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Closed:      'bg-slate-700/30 text-slate-500 border-slate-600/30',
};

// ── Incident Card ────────────────────────────────────────

function IncidentCard({ incident, isExpanded, onToggle, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusUpdate(incident.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const statusStyle = STATUS_MAP[incident.status] || 'bg-slate-800 text-slate-400 border-slate-700';

  return (
    <div className={`rounded-2xl border transition-all duration-300 anim-fade-up ${isExpanded ? 'border-blue-500/40 bg-slate-900 shadow-2xl' : 'border-slate-800 bg-charcoal/50 hover:border-slate-700'}`}>
      <div className="p-4 cursor-pointer flex items-center justify-between" onClick={() => onToggle(incident.id)}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${incident.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-slate-100 text-sm uppercase tracking-wide truncate">{incident.type}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${statusStyle}`}>{incident.status}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={10} /> {incident.location?.sector || 'UNKNOWN'}</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {getTimeSince(incident.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="text-slate-600">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-slate-800/60' : 'max-h-0 opacity-0'}`}>
         <div className="p-4 space-y-4">
            <div className="bg-blue-600/5 rounded-xl border border-blue-500/10 p-3.5">
              <div className="flex items-center gap-2 mb-2 text-blue-400 text-[10px] font-black tracking-[0.2em] uppercase">
                <Shield size={12} /> AI Response Triage
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3 italic">
                "{incident.triage?.briefSummary || 'No incident summary available.'}"
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-obsidian/40 rounded-lg border border-white/5">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Severity</div>
                  <div className={`text-xs font-bold ${incident.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>{incident.severity?.toUpperCase() || 'MODERATE'}</div>
                </div>
                <div className="p-2 bg-obsidian/40 rounded-lg border border-white/5">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Priority</div>
                  <div className="text-xs font-bold text-slate-200">{incident.triage?.priorityLevel || 'STANDARD'}</div>
                </div>
              </div>
            </div>

            {!['Resolved', 'Closed'].includes(incident.status) && (
              <div className="flex gap-2">
                <button onClick={() => handleUpdate('Dispatching')} disabled={updating || incident.status === 'Dispatching'} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-black rounded-xl tracking-widest uppercase shadow-lg shadow-blue-900/40">
                  {updating ? '...' : 'DISPATCH'}
                </button>
                <button onClick={() => handleUpdate('Resolved')} disabled={updating} className="flex-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-xl tracking-widest uppercase">
                  {updating ? '...' : 'RESOLVE'}
                </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

// ── Historical Alerts View ───────────────────────────────

export default function HistoricalAlerts() {
  const isCoordinator = useCoordinator();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncidents({ limit: 100 });
      if (res.success) setIncidents(res.data || []);
    } catch (err) {
      console.error('[HistoricalAlerts] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCoordinator) fetchIncidents();
  }, [fetchIncidents, isCoordinator]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await updateIncidentStatus(id, status);
      if (res.success) {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
      }
    } catch (err) {
      console.error('[HistoricalAlerts] Status update error:', err);
    }
  };

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const matchesSearch = inc.type?.toLowerCase().includes(search.toLowerCase()) ||
                          inc.id?.toLowerCase().includes(search.toLowerCase()) ||
                          inc.location?.sector?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [incidents, search, statusFilter]);

  if (!isCoordinator) return <AccessDenied />;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-obsidian">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800/80 bg-obsidian/80 backdrop-blur-xl z-20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              Historical Database
            </h2>
            <p className="text-slate-500 text-[10px] font-mono mt-1 tracking-widest uppercase">NODE_ARCHIVE • {incidents.length} RECORDS</p>
          </div>
          <button onClick={fetchIncidents} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH UUID, SECTOR, OR TYPE..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'Reported', 'Dispatching', 'Resolved', 'Closed'].map(opt => (
              <button key={opt} onClick={() => setStatusFilter(opt)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border whitespace-nowrap ${statusFilter === opt ? 'bg-blue-600/10 text-blue-400 border-blue-500/40' : 'text-slate-600 border-transparent hover:text-slate-400'}`}>{opt}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sidebar-scroll bg-obsidian/40">
        {loading && incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 anim-fade-in"><Loader2 size={24} className="animate-spin mb-4" /><span className="text-[10px] font-mono tracking-widest uppercase">Fetching Records</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-700 anim-scale-in"><SearchX size={32} className="mb-4 opacity-20" /><span className="text-[10px] font-mono tracking-widest uppercase">No matching alerts</span></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(inc => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                isExpanded={expandedId === inc.id}
                onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
