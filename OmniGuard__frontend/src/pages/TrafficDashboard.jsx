import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  Server, 
  Wifi, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  ArrowUpRight, 
  RotateCw 
} from 'lucide-react';
import { getTrafficStats } from '../services/api';
import { wsService } from '../services/wsService';

export default function TrafficDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTrafficStats(user.token);
      setStats(data);
      setLogs(data.recentLogs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load traffic telemetry');
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchStats();

    // Monitor WebSocket connection state
    const updateWsStatus = () => {
      setWsConnected(wsService.socket?.readyState === WebSocket.OPEN);
    };
    updateWsStatus();
    
    // Periodically poll WS state just in case
    const wsInterval = setInterval(updateWsStatus, 3000);

    // Listen to real-time traffic updates from WS
    const removeListener = wsService.addListener((msg) => {
      if (msg.event === 'TRAFFIC_UPDATE') {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 500);

        const { latestLog, summary, statusCodes, methods } = msg.payload;
        
        setStats(prev => ({
          ...prev,
          summary,
          statusCodes,
          methods
        }));

        setLogs(prev => {
          // Unshift and slice to keep MAX logs (100)
          const newLogs = [latestLog, ...prev];
          if (newLogs.length > 100) newLogs.pop();
          return newLogs;
        });
      }
    });

    return () => {
      clearInterval(wsInterval);
      removeListener();
    };
  }, [user, fetchStats]);


  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (status >= 300 && status < 400) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'POST': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PATCH': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DELETE': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-100 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background cyber grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Header section */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-2xl font-black tracking-wider uppercase text-white font-mono flex items-center gap-3">
              <Server className="text-rose-500" size={28} />
              Traffic Analytics Telemetry
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Real-time HTTP request ingestion logs & security analytics uplink.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Security check badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-mono">
            <Lock size={14} />
            ROLE: COORDINATOR LEVEL-3
          </div>

          {/* WS Uplink connection monitor */}
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-mono transition-all duration-300 ${
            wsConnected 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/40 text-rose-400 animate-pulse'
          }`}>
            <Wifi size={14} className={wsConnected ? 'animate-bounce' : ''} />
            UPLINK: {wsConnected ? 'SECURED_LIVE' : 'DISCONNECTED'}
          </div>

          <button 
            onClick={fetchStats}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl text-slate-300 transition-all hover:text-white"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 z-10 relative">
          <Activity className="animate-spin text-rose-500" size={48} />
          <p className="font-mono text-sm tracking-widest animate-pulse">ESTABLISHING TELEMETRY FEED...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center max-w-lg mx-auto space-y-4 z-10 relative">
          <ShieldAlert className="text-rose-500 mx-auto" size={48} />
          <h3 className="text-lg font-bold text-white uppercase tracking-widest">Feed Connection Error</h3>
          <p className="text-slate-300 text-sm font-mono">{error}</p>
          <button 
            onClick={fetchStats}
            className="px-6 py-2.5 bg-rose-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all"
          >
            Reconnect Uplink
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 relative">
          {/* Left / Top - KPI Cards & Distribution charts */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Real-time stats numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl transition-all duration-300 ${pulseActive ? 'bg-rose-500/30' : ''}`} />
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono tracking-widest uppercase">Total Ingestion</span>
                  <Activity size={16} className="text-rose-500" />
                </div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {stats?.summary.totalRequests}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Packets Triaged</div>
              </div>

              <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono tracking-widest uppercase">Recent Avg</span>
                  <Clock size={16} className="text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {stats?.summary.recentAvgResponseTimeMs}
                  <span className="text-xs font-bold text-slate-500 ml-1">ms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Response Latency</div>
              </div>
            </div>

            {/* HTTP Status Code distribution list */}
            <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-mono tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                Response Status Breakdown
              </h3>
              
              <div className="space-y-3">
                {Object.entries(stats?.statusCodes || {}).map(([category, count]) => {
                  const total = Object.values(stats?.statusCodes || {}).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  
                  let barColor = 'bg-emerald-500';
                  if (category === '3xx') barColor = 'bg-cyan-500';
                  if (category === '4xx') barColor = 'bg-amber-500';
                  if (category === '5xx') barColor = 'bg-rose-500';

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">{category} Responses</span>
                        <span className="text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full ${barColor}`} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methods hit distribution */}
            <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-mono tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <Cpu size={14} className="text-sky-400" />
                Ingestion Request Methods
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats?.methods || {}).map(([method, count]) => (
                  <div key={method} className="p-3 bg-slate-950 border border-slate-800/40 rounded-xl flex justify-between items-center font-mono">
                    <span className="text-xs font-bold text-slate-300">{method}</span>
                    <span className="text-sm font-black text-rose-400">{count}</span>
                  </div>
                ))}
                {Object.keys(stats?.methods || {}).length === 0 && (
                  <div className="col-span-2 text-center text-xs text-slate-500 font-mono py-4">
                    NO ACTIVE METHOD DATA
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right - scrolling real-time logs table */}
          <div className="lg:col-span-2 p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <Terminal size={14} className="text-rose-500" />
                Live Ingestion Request Stream
              </h3>
              <span className="text-[10px] font-mono text-slate-500">SHOWING LAST {logs.length} ACTIONS</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 font-mono text-xs">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.requestId + '-' + log.timestamp}
                    initial={{ opacity: 0, x: -10, y: -5 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 bg-slate-950 border border-slate-800/40 hover:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-900/25 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      <span className="text-slate-200 font-medium truncate select-all">{log.path}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 text-slate-400 shrink-0 font-mono text-[11px]">
                      <span className="text-slate-500 select-all">{log.ip}</span>
                      <span className="text-slate-300 font-bold">{log.durationMs}ms</span>
                      <span className="text-slate-600">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <ArrowUpRight size={12} className="text-slate-700 hidden sm:block" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 py-20">
                  <Terminal size={32} className="text-slate-700" />
                  <p className="tracking-widest uppercase text-xs">AWAITING REQUEST METRICS...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
