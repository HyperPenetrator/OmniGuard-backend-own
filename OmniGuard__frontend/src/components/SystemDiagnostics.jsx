import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Server, Database, Cpu, Zap, RefreshCw,
  Loader2, CheckCircle, AlertCircle, XCircle, ShieldOff,
  Wifi, WifiOff, Clock, HardDrive, MemoryStick,
} from 'lucide-react';
import { getHealth } from '../services/api';
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
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center bg-obsidian">
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

// ── Subsystem Card ───────────────────────────────────────

function MetricRow({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-widest">
        {Icon && <Icon size={11} className={colorClass} />}
        {label}
      </div>
      <span className={`text-[11px] font-black font-mono ${colorClass || 'text-slate-300'}`}>{value ?? '—'}</span>
    </div>
  );
}

function SubsystemCard({ title, icon: Icon, status, iconColor, children }) {
  const borderColors = {
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    amber: 'border-amber-500/20 hover:border-amber-500/40',
    blue: 'border-blue-500/20 hover:border-blue-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40',
    red: 'border-red-500/20 hover:border-red-500/40',
  };

  return (
    <div className={`bg-charcoal/40 border rounded-2xl p-4 transition-all duration-300 shadow-inner anim-scale-in ${borderColors[iconColor] || 'border-slate-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
            <Icon size={16} className={iconColor ? `text-${iconColor}-400` : 'text-blue-400'} />
          </div>
          <span className="text-white font-black text-xs uppercase tracking-widest">{title}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'} `} />
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ── System Diagnostics View ──────────────────────────────

export default function SystemDiagnostics() {
  const isCoordinator = useCoordinator();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHealth();
      setHealth(res.data || res);
      setLastChecked(new Date());
    } catch (err) {
      console.error('[Diagnostics] Failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCoordinator) return;
    checkHealth();
    const interval = setInterval(() => {
      if (autoRefresh) checkHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, isCoordinator, autoRefresh]);

  if (!isCoordinator) return <AccessDenied />;

  const overallStatus = health?.status || 'unknown';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-obsidian">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800/80 bg-obsidian/80 backdrop-blur-xl z-20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2.5">
               <Activity size={18} className="text-purple-400" />
               System Terminal
            </h2>
            <p className="text-slate-500 text-[10px] font-mono mt-1 tracking-widest uppercase">STATUS_MONITOR • {lastChecked ? `TELEMETRY: ${lastChecked.toLocaleTimeString()}` : 'PROBING...'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black border tracking-widest uppercase transition-all duration-300 ${autoRefresh ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-600 border-white/5'}`}>REALTIME_{autoRefresh ? 'ON' : 'OFF'}</button>
            <button onClick={checkHealth} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        {health && (
          <div className={`p-3 rounded-2xl border flex items-center justify-between anim-fade-in ${overallStatus === 'healthy' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
            <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${overallStatus === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`} /><span className="text-[10px] font-black tracking-[0.2em] uppercase">SYSTEM_{overallStatus.toUpperCase()}</span></div>
            <span className="text-[10px] font-mono opacity-60 uppercase">Runtime: {formatUptime(health.uptime)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sidebar-scroll bg-obsidian/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {health ? (
            <>
              <SubsystemCard title="Database" icon={Database} status={health.checks?.database?.status} iconColor="blue"><MetricRow label="Status" value={health.checks?.database?.status?.toUpperCase()} colorClass="text-blue-400" /><MetricRow label="Latency" value={`${health.checks?.database?.latencyMs}ms`} colorClass="text-blue-300" /></SubsystemCard>
              <SubsystemCard title="Websocket" icon={Wifi} status={health.checks?.websocket?.status} iconColor="emerald"><MetricRow label="Status" value={health.checks?.websocket?.status?.toUpperCase()} colorClass="text-emerald-400" /><MetricRow label="Clients" value={health.checks?.websocket?.activeConnections} colorClass="text-emerald-300" /></SubsystemCard>
              <SubsystemCard title="AI Engine" icon={Zap} status={health.checks?.geminiAI?.status} iconColor="purple"><MetricRow label="Status" value={health.checks?.geminiAI?.status?.replace('_', ' ').toUpperCase()} colorClass="text-purple-400" /><MetricRow label="Model" value={health.checks?.geminiAI?.model} colorClass="text-purple-300" /></SubsystemCard>
              <SubsystemCard title="Environment" icon={Server} status="healthy" iconColor="amber"><MetricRow label="Kernel" value={health.nodeVersion} colorClass="text-amber-400" /><MetricRow label="Node" value={health.environment?.toUpperCase()} colorClass="text-amber-300" /></SubsystemCard>
              {health.memoryUsage && (
                <SubsystemCard title="Memory Pool" icon={MemoryStick} status="healthy" iconColor="red"><MetricRow label="Total RSS" value={health.memoryUsage.rss} colorClass="text-red-400" /><MetricRow label="Heap Target" value={health.memoryUsage.heapTotal} colorClass="text-red-300" /><MetricRow label="Heap Current" value={health.memoryUsage.heapUsed} colorClass="text-red-300" /></SubsystemCard>
              )}
            </>
          ) : (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 anim-fade-in"><Loader2 size={24} className="animate-spin mb-4" /><span className="text-[10px] font-mono tracking-widest uppercase">Probing Subsystems</span></div>
          )}
        </div>
      </div>
    </div>
  );
}
