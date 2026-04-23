import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, 
  Shield, 
  Settings, 
  Activity, 
  Zap, 
  AlertTriangle, 
  Lock, 
  Cpu, 
  Globe, 
  Crosshair,
  User,
  Clock as ClockIcon,
  Wifi,
  Database,
  Maximize2
} from 'lucide-react';

const TacticalDashboard = () => {
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState([45, 52, 48, 60, 55, 62, 58, 44, 55, 66, 44, 33, 55, 77]);
  const [alerts] = useState([
    { id: 1, text: "SIGNAL DETECTED: SECTOR 7G", type: "warning" },
    { id: 2, text: "UPLINK ESTABLISHED: OMNI-SAT-4", type: "info" },
    { id: 3, text: "ENCRYPTION HANDSHAKE COMPLETE", type: "success" },
    { id: 4, text: "ANOMALY IN PERIMETER B-12", type: "danger" },
    { id: 5, text: "CORE TEMPERATURE STABLE: 34°C", type: "info" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const chartTimer = setInterval(() => {
      setCpuUsage(prev => [...prev.slice(1), Math.floor(Math.random() * 40) + 40]);
    }, 3000);
    return () => {
      clearInterval(timer);
      clearInterval(chartTimer);
    };
  }, []);

  return (
    <div className="h-screen w-full flex flex-col volumetric-bg text-slate-300 font-mono overflow-hidden p-4 gap-4 select-none">
      {/* Top Header - Floating */}
      <header className="h-16 glass-panel flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/30 rounded-lg rotate-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Shield size={22} className="text-brand-cyan -rotate-3" />
            </div>
            <span className="text-2xl font-bold tracking-[0.25em] text-white cyan-glow-text">OMNIGUARD</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-danger/10 border border-brand-danger/20 rounded-full">
            <div className="w-2.5 h-2.5 bg-brand-danger rounded-full animate-blink shadow-[0_0_10px_#ef4444]" />
            <span className="text-[11px] font-black text-brand-danger tracking-widest">LIVE OPS</span>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">Chronos Protocol</span>
            <span className="text-lg text-brand-cyan font-bold leading-none cyan-glow-text">{time.toLocaleTimeString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">Operator Node</span>
            <span className="text-lg text-white font-bold leading-none">OG-7729-ALPHA</span>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-transparent border border-white/10 flex items-center justify-center cursor-pointer shadow-lg"
          >
            <User size={24} className="text-brand-cyan" />
          </motion.div>
        </div>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Sidebar - Detached Floating */}
        <aside className="w-20 glass-panel flex flex-col items-center py-8 gap-10">
          <SidebarIcon icon={<Radar size={24} />} label="RADAR" active />
          <SidebarIcon icon={<Activity size={24} />} label="SURVEIL" />
          <SidebarIcon icon={<Zap size={24} />} label="ARSENAL" />
          <SidebarIcon icon={<Database size={24} />} label="DIAGNOSTIC" />
          <div className="mt-auto">
            <SidebarIcon icon={<Settings size={24} />} label="SETTINGS" />
          </div>
        </aside>

        {/* Center Main Widget - Floating Pane */}
        <main className="flex-1 relative glass-panel overflow-hidden group">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{backgroundImage: 'radial-gradient(var(--color-brand-cyan) 0.5px, transparent 0.5px)', backgroundSize: '40px 40px'}} />
          
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-brand-cyan/10 rounded border border-brand-cyan/20">
                  <Globe size={16} className="text-brand-cyan" />
                </div>
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-slate-300">Global Threat Tracking Map</span>
              </div>
              <div className="flex items-center gap-6 text-[10px] text-slate-500 font-bold">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" /> LAT: 40.7128° N</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" /> LNG: 74.0060° W</span>
                <Maximize2 size={14} className="hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-cyan/[0.03] to-transparent pointer-events-none" />
              
              {/* Stylized Vector Map - Improved Depth */}
              <svg viewBox="0 0 800 400" className="w-full max-w-5xl opacity-40 drop-shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <path d="M150,100 C200,80 300,150 400,120 C500,90 600,180 700,200 L700,300 C600,320 500,250 400,280 C300,310 200,220 100,200 Z" fill="rgba(6,182,212,0.05)" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M50,150 C100,130 200,200 300,170 C400,140 500,230 600,250" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                <circle cx="400" cy="200" r="150" fill="none" stroke="var(--color-brand-cyan)" strokeWidth="0.2" opacity="0.3" />
                <circle cx="400" cy="200" r="100" fill="none" stroke="var(--color-brand-cyan)" strokeWidth="0.2" opacity="0.3" />
              </svg>

              {/* Pulsing Radar Blips */}
              <RadarBlip x="35%" y="45%" color="brand-danger" label="HOSTILE AI" />
              <RadarBlip x="68%" y="58%" color="brand-warning" label="UNIDENTIFIED" />
              <RadarBlip x="48%" y="22%" color="brand-cyan" label="FRIENDLY SQUAD" />

              {/* Active Target Crosshair */}
              <motion.div 
                animate={{ x: [0, 150, -80, 0], y: [0, -70, 120, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-32 h-32 border border-brand-cyan/20 rounded-full flex items-center justify-center"
              >
                <div className="absolute w-full h-px bg-brand-cyan/20 shadow-[0_0_10px_#06b6d444]" />
                <div className="absolute w-px h-full bg-brand-cyan/20 shadow-[0_0_10px_#06b6d444]" />
                <div className="relative">
                  <Crosshair size={40} className="text-brand-cyan animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-brand-danger rounded-full shadow-[0_0_10px_#ef4444]" />
                </div>
                <div className="absolute -top-10 -right-16 glass-panel-heavy px-3 py-2 text-[9px] whitespace-nowrap border-brand-cyan/30">
                  <div className="text-brand-cyan font-black mb-1">LOCK_ON: KILO-NINER</div>
                  <div className="grid grid-cols-2 gap-x-3 text-slate-400">
                    <span>SPD:</span> <span className="text-white">420 KTS</span>
                    <span>ALT:</span> <span className="text-white">32,000 FT</span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Map Scanning Line */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="w-full h-1/4 bg-gradient-to-b from-transparent via-brand-cyan/10 to-transparent animate-scan" />
            </div>
          </div>
        </main>

        {/* Right Panel Stack */}
        <div className="w-96 flex flex-col gap-4">
          {/* Live Alert Feed - Floating */}
          <div className="flex-1 glass-panel flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white cyan-glow-text">LIVE ALERTS</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                 <AlertTriangle size={14} className="text-brand-warning amber-glow-text" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-[10px]">
              {alerts.map(alert => (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={alert.id} 
                  className="group relative border-l-2 border-white/5 pl-4 py-2 hover:bg-white/[0.02] transition-all"
                >
                  <div className="text-slate-500 text-[8px] mb-1 font-bold">UTC: {new Date().toLocaleTimeString()}</div>
                  <div className={`${
                    alert.type === 'danger' ? 'text-brand-danger font-bold' : 
                    alert.type === 'warning' ? 'text-brand-warning' : 
                    alert.type === 'success' ? 'text-brand-accent' : 
                    'text-brand-cyan'
                  } group-hover:cyan-glow-text transition-all`}>
                    {">"} {alert.text}
                  </div>
                  {alert.type === 'danger' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-danger animate-pulse" />}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Biometric Security - Floating */}
          <div className="h-72 glass-panel flex flex-col p-5 group">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white">BIOMETRIC_AUTH</span>
              <Lock size={14} className="text-brand-cyan animate-float" />
            </div>
            <div className="flex-1 border border-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center bg-black/20 group-hover:border-brand-cyan/30 transition-colors">
              <div className="absolute inset-0 bg-brand-cyan/[0.02] animate-pulse" />
              <div className="relative">
                 <User size={100} className="text-white/5 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
                 <motion.div 
                   animate={{ y: [-60, 60] }}
                   transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
                   className="absolute left-[-40px] right-[-40px] h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent shadow-[0_0_15px_#06b6d4]" 
                 />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[9px] font-bold">
                <span className="text-brand-cyan/80 font-mono tracking-tighter cursor-wait">MATCHING... 99.9%</span>
                <span className="text-brand-accent">SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar - Floating */}
      <footer className="h-40 glass-panel flex p-6 gap-8">
        {/* Animated Telemetry Charts */}
        <div className="flex-1 border border-white/5 bg-black/20 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-3">
               <Cpu size={14} className="text-brand-cyan" />
               <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white">Neural Load Telemetry</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-brand-cyan/60">
               <Wifi size={12} />
               <span>DOWNLINK_READY</span>
            </div>
          </div>
          <div className="flex-1 flex items-end gap-1.5 px-1 relative z-10">
            {cpuUsage.map((val, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                className="flex-1 bg-gradient-to-t from-brand-cyan/40 to-brand-cyan/10 border-t border-brand-cyan/50 relative group rounded-t-sm"
              >
                <div className="absolute inset-0 bg-brand-cyan/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-brand-cyan/[0.05] to-transparent pointer-events-none" />
        </div>

        {/* Circular Gauges */}
        <div className="w-96 flex gap-6 px-2">
          <CircularProgress value={78} label="CORE" color="text-brand-primary" />
          <CircularProgress value={42} label="SYNC" color="text-brand-cyan" />
          <CircularProgress value={92} label="DEFENSE" color="text-brand-danger" />
        </div>

        {/* Status Toggles Grid */}
        <div className="grid grid-cols-2 gap-3 w-72">
          <StatusToggle label="HVAC_CTRL" active />
          <StatusToggle label="PRM_LINK" active />
          <StatusToggle label="ENC_COMM" active />
          <StatusToggle label="XTR_DRV" />
        </div>
      </footer>
    </div>
  );
};

const SidebarIcon = ({ icon, label, active = false }) => (
  <motion.button 
    whileHover={{ x: 5 }}
    className={`
      group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500
      ${active ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}
    `}
  >
    {icon}
    <div className="absolute left-16 px-3 py-2 glass-panel-heavy border-brand-cyan/20 text-[9px] font-black tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 pointer-events-none z-50">
      {label}
    </div>
    {/* Visual Glow */}
    <div className={`absolute inset-0 rounded-2xl transition-all blur-lg ${active ? 'bg-brand-cyan/10' : 'bg-transparent group-hover:bg-white/5'}`} />
  </motion.button>
);

const RadarBlip = ({ x, y, color, label }) => (
  <div className="absolute" style={{ left: x, top: y }}>
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 bg-${color} rounded-full relative shadow-[0_0_15px_currentColor]`}>
        <div className={`absolute inset-[-6px] border border-${color} rounded-full animate-ping opacity-75`} />
        <div className={`absolute inset-[-15px] border border-${color}/20 rounded-full animate-ping [animation-delay:0.75s]`} />
      </div>
      <div className="mt-3 glass-panel-heavy px-1.5 py-0.5 text-[7px] font-bold tracking-tighter text-white/80 border-white/10">
        {label}
      </div>
    </div>
  </div>
);

const CircularProgress = ({ value, label, color }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="flex-1 flex flex-col items-center justify-center relative cursor-help"
  >
    <svg className="w-20 h-20 transform -rotate-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
      <motion.circle 
        cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="3" fill="transparent" 
        strokeDasharray={213.6}
        initial={{ strokeDashoffset: 213.6 }}
        animate={{ strokeDashoffset: 213.6 - (213.6 * value) / 100 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className={`${color} drop-shadow-[0_0_8px_currentColor]`}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center mb-1">
      <span className="text-sm font-black text-white">{value}%</span>
    </div>
    <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 mt-2">{label}</span>
  </motion.div>
);

const StatusToggle = ({ label, active = false }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className={`
      p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-lg
      ${active ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20'}
    `}
  >
    <span className="text-[9px] font-bold tracking-wider">{label}</span>
    <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-brand-cyan animate-pulse shadow-[0_0_8px_#06b6d4]' : 'bg-slate-700'}`} />
  </motion.div>
);

export default TacticalDashboard;
