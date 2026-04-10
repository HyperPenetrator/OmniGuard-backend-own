import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Filter, CheckCircle2, AlertTriangle, Shield,
  ChevronDown, RefreshCw, Search, Loader2, ShieldOff,
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
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES = {
  Reported:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Triaged:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Dispatching: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
  'En Route':  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'On Scene':  'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Resolved:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Closed:      'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const SEVERITY_DOT = {
  critical: 'bg-red-500 shadow-[0_0_6px_#ef4444]',
  high:     'bg-orange-400 shadow-[0_0_6px_#fb923c]',
  medium:   'bg-amber-400',
  low:      'bg-emerald-400',
};

const STATUS_OPTIONS = ['Reported', 'Triaged', 'Dispatching', 'En Route', 'On Scene', 'Resolved', 'Closed'];

// ── Access Denied Wall ───────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldOff size={36} className="text-red-500/60" />
      </div>
      <div>
        <h3 className="text-white font-black text-lg tracking-wider uppercase mb-2">Access Restricted</h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          This panel is reserved for <span className="text-blue-400 font-bold">Coordinator</span> personnel only.
          Contact your system administrator to elevate your clearance level.
        </p>
      </div>
      <div className="px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-slate-500 tracking-widest uppercase">
        CLEARANCE_LEVEL: INSUFFICIENT
      </div>
    </div>
  );
}

// ── Incident Row ─────────────────────────────────────────

function IncidentRow({ inc, onResolve, onDispatch, resolving, dispatching }) {
  const [expanded, setExpanded] = useState(false);
  const severity = inc.triage?.severity?.toLowerCase() || 'medium';

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
        inc.status === 'Resolved' || inc.status === 'Closed'
          ? 'border-slate-700/50 bg-slate-800/20 opacity-70'
          : 'border-slate-700 bg-charcoal hover:border-slate-600'
      }`}
    >
      {/* Row Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 text-left group"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[severity] || SEVERITY_DOT.medium}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100 text-sm truncate">{inc.type}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 ${STATUS_STYLES[inc.status] || STATUS_STYLES.Reported}`}>
              {inc.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
            <span>{inc.location?.sector || 'Unknown sector'}</span>
            <span>•</span>
            <span>{getTimeSince(inc.createdAt)}</span>
            {inc.incidentNumber && <><span>•</span><span className="text-slate-600">{inc.incidentNumber}</span></>}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 space-y-4 animate-in fade-in duration-200">
          {inc.triage?.briefSummary && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 leading-relaxed">{inc.triage.briefSummary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              ['Severity', inc.triage?.severity || 'Pending'],
              ['Resource', inc.triage?.recommendedResponseTeam || '—'],
              ['ETA', inc.triage?.estimatedResponseTime || '—'],
              ['Reporter', inc.reporterId?.slice(0, 12) || 'Anonymous'],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-800/40 rounded-lg p-2.5">
                <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1">{k}</div>
                <div className="text-slate-200 font-bold truncate">{v}</div>
              </div>
            ))}
          </div>

          {/* Coordinator Actions */}
          {inc.status !== 'Resolved' && inc.status !== 'Closed' && (
            <div className="flex gap-2 pt-1">
              <button
                id={`dispatch-btn-${inc.id}`}
                onClick={() => onDispatch(inc.id)}
                disabled={dispatching === inc.id || inc.sosActive}
                className="flex-1 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {dispatching === inc.id
                  ? <><Loader2 size={12} className="animate-spin" /> Dispatching...</>
                  : <><Shield size={12} /> {inc.sosActive ? 'Team Active' : 'Dispatch'}</>
                }
              </button>
              <button
                id={`resolve-btn-${inc.id}`}
                onClick={() => onResolve(inc.id)}
                disabled={resolving === inc.id}
                className="flex-1 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {resolving === inc.id
                  ? <><Loader2 size={12} className="animate-spin" /> Resolving...</>
                  : <><CheckCircle2 size={12} /> Mark Resolved</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Historical Alerts View ───────────────────────────────

export default function HistoricalAlerts({ liveIncidents }) {
  const isCoordinator = useCoordinator();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolving, setResolving] = useState(null);
  const [dispatching, setDispatching] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncidents({ limit: 100, ...(statusFilter && { status: statusFilter }) });
      if (res.success) setIncidents(res.data || []);
    } catch (err) {
      console.error('[HistoricalAlerts] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!isCoordinator) return;
    fetchHistory();
  }, [fetchHistory, isCoordinator]);

  // Merge live WS updates into historical list
  useEffect(() => {
    if (!liveIncidents?.length) return;
    setIncidents(prev => {
      const byId = new Map(prev.map(i => [i.id, i]));
      liveIncidents.forEach(i => byId.set(i.id, { ...byId.get(i.id), ...i }));
      return Array.from(byId.values()).sort((a, b) => {
        const ta = a.createdAt?._seconds || new Date(a.createdAt).getTime() / 1000 || 0;
        const tb = b.createdAt?._seconds || new Date(b.createdAt).getTime() / 1000 || 0;
        return tb - ta;
      });
    });
  }, [liveIncidents]);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await updateIncidentStatus(id, 'Resolved');
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));
    } catch (err) {
      console.error('[HistoricalAlerts] resolve error:', err);
    } finally {
      setResolving(null);
    }
  };

  const handleDispatch = async (id) => {
    setDispatching(id);
    try {
      await updateIncidentStatus(id, 'Dispatching');
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'Dispatching', sosActive: true } : i));
    } catch (err) {
      console.error('[HistoricalAlerts] dispatch error:', err);
    } finally {
      setDispatching(null);
    }
  };

  if (!isCoordinator) return <AccessDenied />;

  const filtered = incidents.filter(inc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return inc.type?.toLowerCase().includes(q) ||
      inc.location?.sector?.toLowerCase().includes(q) ||
      inc.incidentNumber?.toLowerCase().includes(q);
  });

  const stats = {
    total: incidents.length,
    active: incidents.filter(i => !['Resolved', 'Closed'].includes(i.status)).length,
    resolved: incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length,
    critical: incidents.filter(i => i.triage?.severity?.toLowerCase() === 'critical').length,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800/50 bg-obsidian/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-base uppercase tracking-widest flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              Historical Alerts
            </h2>
            <p className="text-slate-500 text-xs font-mono mt-0.5 tracking-wider">COORDINATOR VIEW • ALL INCIDENTS</p>
          </div>
          <button
            onClick={fetchHistory}
            id="historical-refresh"
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-200' },
            { label: 'Active', value: stats.active, color: 'text-amber-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
            { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 text-center">
              <div className={`text-lg font-black font-mono ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="historical-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search type, sector, ID..."
              className="w-full pl-8 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors text-xs font-mono"
            />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              id="historical-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-8 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 size={22} className="animate-spin mb-3 text-blue-500/60" />
            <span className="text-xs font-mono tracking-wider">LOADING INCIDENT ARCHIVE...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <AlertTriangle size={28} className="mb-3 text-slate-700" />
            <span className="text-xs font-mono tracking-wider">NO INCIDENTS MATCH FILTER</span>
          </div>
        )}

        {!loading && filtered.map(inc => (
          <IncidentRow
            key={inc.id}
            inc={inc}
            onResolve={handleResolve}
            onDispatch={handleDispatch}
            resolving={resolving}
            dispatching={dispatching}
          />
        ))}
      </div>
    </div>
  );
}
