import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Server, Database, Cpu, Zap, RefreshCw,
  Loader2, CheckCircle, AlertCircle, XCircle, ShieldOff,
  Wifi, WifiOff, Clock, HardDrive, MemoryStick,
} from 'lucide-react';
import { getHealth, getWsHealth } from '../services/api';
import { useCoordinator } from '../hooks/useCoordinator';

// ── Helpers ──────────────────────────────────────────────

function formatUptime(secs) {
  if (!secs) return '—';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
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
          System Diagnostics is a <span className="text-blue-400 font-bold">Coordinator</span> exclusive panel.
        </p>
      </div>
      <div className="px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-slate-500 tracking-widest uppercase">
        CLEARANCE_LEVEL: INSUFFICIENT
      </div>
    </div>
  );
}

// ── Status Icon ──────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'healthy' || status === 'connected' || status === 'active' || status === 'configured')
    return <CheckCircle size={16} className="text-emerald-400" />;
  if (status === 'degraded' || status === 'not_configured')
    return <AlertCircle size={16} className="text-amber-400" />;
  return <XCircle size={16} className="text-red-400" />;
}

// ── Metric Row ───────────────────────────────────────────

function MetricRow({ label, value, icon: Icon, accent = 'emerald' }) {
  const accentColors = {
    emerald: 'text-emerald-400',
    blue:    'text-blue-400',
    amber:   'text-amber-400',
    purple:  'text-purple-400',
    red:     'text-red-400',
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-2.5 text-slate-500 text-xs">
        {Icon && <Icon size={13} className={accentColors[accent]} />}
        <span className="font-mono uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-xs font-bold font-mono ${accentColors[accent]}`}>{value ?? '—'}</span>
    </div>
  );
}

// ── Subsystem Card ───────────────────────────────────────

function SubsystemCard({ title, icon: Icon, iconColor, status, children }) {
  const borderColor = {
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    amber:   'border-amber-500/20 hover:border-amber-500/40',
    red:     'border-red-500/20 hover:border-red-500/40',
    blue:    'border-blue-500/20 hover:border-blue-500/40',
    purple:  'border-purple-500/20 hover:border-purple-500/40',
  };
  const bgGlow = {
    emerald: 'shadow-[inset_0_1px_0_rgba(52,211,153,0.05)]',
    amber:   'shadow-[inset_0_1px_0_rgba(251,191,36,0.05)]',
    red:     'shadow-[inset_0_1px_0_rgba(239,68,68,0.05)]',
    blue:    'shadow-[inset_0_1px_0_rgba(59,130,246,0.05)]',
    purple:  'shadow-[inset_0_1px_0_rgba(168,85,247,0.05)]',
  };

  return (
    <div className={`bg-charcoal border rounded-2xl p-4 transition-all duration-300 ${borderColor[iconColor] || borderColor.blue} ${bgGlow[iconColor] || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800`}>
            <Icon size={16} className={`text-${iconColor}-400`} />
          </div>
          <span className="text-slate-200 font-bold text-sm uppercase tracking-wider">{title}</span>
        </div>
        <StatusIcon status={status} />
      </div>
      {children}
    </div>
  );
}

// ── System Diagnostics View ──────────────────────────────

export default function SystemDiagnostics() {
  const isCoordinator = useCoordinator();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHealth();
      setHealth(res.data || res);
      setLastChecked(new Date());
    } catch (err) {
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCoordinator) return;
    checkHealth();
  }, [checkHealth, isCoordinator]);

  useEffect(() => {
    if (!isCoordinator || !autoRefresh) return;
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, isCoordinator, autoRefresh]);

  if (!isCoordinator) return <AccessDenied />;

  const overallColor = health?.status === 'healthy' ? 'emerald' :
                       health?.status === 'degraded' ? 'amber' : 'red';

  const overallBg = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
    red:     'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800/50 bg-obsidian/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-base uppercase tracking-widest flex items-center gap-2">
              <Activity size={18} className="text-purple-400" />
              System Diagnostics
            </h2>
            <p className="text-slate-500 text-xs font-mono mt-0.5 tracking-wider">
              COORDINATOR VIEW • {lastChecked ? `CHECKED ${Math.floor((Date.now() - lastChecked) / 1000)}s AGO` : 'INITIALIZING...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="diag-autorefresh"
              onClick={() => setAutoRefresh(a => !a)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider transition-all duration-200 ${
                autoRefresh
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800/40 text-slate-500 border-slate-700'
              }`}
            >
              AUTO {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              id="diag-refresh"
              onClick={checkHealth}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        {health && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${overallBg[overallColor]}`}>
            <div className={`w-2.5 h-2.5 rounded-full bg-${overallColor}-400 ${overallColor === 'emerald' ? '' : 'animate-pulse'}`} />
            <span className="font-black uppercase tracking-widest text-sm">
              {health.status?.toUpperCase() ?? 'UNKNOWN'}
            </span>
            <span className="ml-auto font-mono text-xs opacity-70">
              UPTIME: {formatUptime(health.uptime)}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Diagnostics */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
        {loading && !health && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 size={22} className="animate-spin mb-3 text-purple-500/60" />
            <span className="text-xs font-mono tracking-wider">RUNNING DIAGNOSTICS...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Diagnostics Failed</p>
              <p className="text-red-400/70 text-xs font-mono mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {health && (
          <>
            {/* Database */}
            <SubsystemCard
              title="Database"
              icon={Database}
              iconColor="blue"
              status={health.checks?.database?.status}
            >
              <MetricRow label="Status" value={health.checks?.database?.status?.toUpperCase()} icon={Database} accent="blue" />
              <MetricRow label="Latency" value={health.checks?.database?.latencyMs != null ? `${health.checks.database.latencyMs}ms` : '—'} icon={Zap} accent="blue" />
            </SubsystemCard>

            {/* WebSocket */}
            <SubsystemCard
              title="WebSocket"
              icon={Wifi}
              iconColor="emerald"
              status={health.checks?.websocket?.status}
            >
              <MetricRow label="Status" value={health.checks?.websocket?.status?.toUpperCase()} icon={Wifi} accent="emerald" />
              <MetricRow label="Connections" value={health.checks?.websocket?.activeConnections ?? '0'} icon={Activity} accent="emerald" />
            </SubsystemCard>

            {/* Gemini AI */}
            <SubsystemCard
              title="Gemini AI"
              icon={Zap}
              iconColor="purple"
              status={health.checks?.geminiAI?.status}
            >
              <MetricRow label="Status" value={health.checks?.geminiAI?.status?.toUpperCase()?.replace('_', ' ')} icon={Zap} accent="purple" />
              <MetricRow label="Model" value={health.checks?.geminiAI?.model} icon={Cpu} accent="purple" />
            </SubsystemCard>

            {/* Runtime */}
            <SubsystemCard
              title="Runtime"
              icon={Server}
              iconColor="amber"
              status="healthy"
            >
              <MetricRow label="Node.js" value={health.nodeVersion} icon={Server} accent="amber" />
              <MetricRow label="Environment" value={health.environment?.toUpperCase()} icon={Clock} accent="amber" />
              <MetricRow label="Uptime" value={formatUptime(health.uptime)} icon={Clock} accent="amber" />
            </SubsystemCard>

            {/* Memory */}
            {health.memoryUsage && (
              <SubsystemCard
                title="Memory"
                icon={HardDrive}
                iconColor="red"
                status={health.status}
              >
                <MetricRow label="RSS" value={health.memoryUsage.rss} icon={HardDrive} accent="red" />
                <MetricRow label="Heap Used" value={health.memoryUsage.heapUsed} icon={HardDrive} accent="red" />
                <MetricRow label="Heap Total" value={health.memoryUsage.heapTotal} icon={HardDrive} accent="red" />
              </SubsystemCard>
            )}

            {/* Timestamp */}
            <div className="text-center py-3">
              <span className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">
                Server Time: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
