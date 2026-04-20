import React from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldAlert, Users, Zap, TrendingUp, Truck, CheckCircle2 } from 'lucide-react'
import TacticalMap from '../components/TacticalMap'

export default function Dashboard({ incidents, onUpdateStatus }) {
  const activeCount = incidents.length;
  const highPriority = incidents.filter(i => i.severity === 'High' || i.severity === 'Critical').length;
  
  const stats = [
    { label: 'Live Incidents', value: activeCount.toString(), icon: ShieldAlert, color: 'text-red-500', trend: 'Live' },
    { label: 'High Priority', value: highPriority.toString(), icon: Zap, color: 'text-amber-500', trend: 'Alert' },
    { label: 'Active Responders', value: '148', icon: Users, color: 'text-emerald-500', trend: 'Stable' },
    { label: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-emerald-500', trend: 'Optimal' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">Control Overview</h2>
          <p className="text-slate-500 text-[9px] md:text-[10px] mt-1 font-mono uppercase tracking-widest">Real-time telemetry and incident reports</p>
        </div>
        <div className="flex gap-3">
           <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white border border-slate-200 rounded-lg md:rounded-xl flex items-center gap-2 shadow-sm">
              <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status: Normal</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-200 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm group hover:border-emerald-200 transition-all duration-500"
          >
            <div className="flex items-start justify-between">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 border border-slate-100 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={18} className="md:size-24" />
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[9px] md:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">
                <TrendingUp size={10} className="text-emerald-500" />
                {stat.trend}
              </div>
            </div>
            <div className="mt-4 md:mt-6">
              <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.1em] md:tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 mt-1 font-mono tracking-tighter md:tracking-normal">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden self-start shadow-sm">
          <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-[0.1em] md:tracking-[0.2em]">Priority Incident Feed</h3>
            <div className="flex items-center gap-2">
               <span className="px-2 md:px-3 py-0.5 md:py-1 bg-white border border-slate-200 rounded-lg text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                 {incidents.length} Active
               </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
             {incidents.length === 0 ? (
                <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="text-emerald-500" size={32} />
                   </div>
                   <h4 className="text-slate-900 font-bold tracking-widest uppercase text-[10px] md:text-xs">All Clear</h4>
                   <p className="text-slate-500 text-[10px] md:text-xs mt-2 font-mono">No pending emergencies detected in current sector.</p>
                </div>
             ) : (
                incidents.map((inc, i) => (
                  <motion.div 
                    key={inc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 md:p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex gap-4 md:gap-6">
                       <div className="hidden sm:flex flex-col items-center">
                          <span className="text-[9px] md:text-[10px] font-mono text-emerald-600 font-bold">14:2{i}</span>
                          <div className="w-[1px] md:w-[2px] flex-1 bg-slate-100 my-2" />
                          <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${['Reported', 'Triaged', 'Dispatching'].includes(inc.status) ? 'bg-rose-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                             <span className={`px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[8px] font-bold border uppercase ${
                               ['Critical', 'High'].includes(inc.severity) ? 'bg-rose-100 text-rose-500 border-rose-200' : 
                               inc.severity === 'Medium' ? 'bg-amber-100 text-amber-500 border-amber-200' : 
                               'bg-blue-100 text-blue-500 border-blue-200'
                             }`}>
                               {inc.severity}
                             </span>
                             <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{inc.incidentNumber || inc.id}</span>
                          </div>
                          <h4 className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors uppercase truncate">
                            {inc.type} - {typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Unknown Sector')}
                          </h4>
                          <p className="text-[10px] md:text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 md:line-clamp-none">
                            {inc.description || `Incident detected at ${inc.location?.coordinates?.lat ? `coordinates [${inc.location.coordinates.lat.toFixed(4)}, ${inc.location.coordinates.lng.toFixed(4)}]` : (typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Unknown Location'))}. Immediate response required.`}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 md:mt-6">
                             {['Reported', 'Triaged'].includes(inc.status) ? (
                               <button 
                                 onClick={() => onUpdateStatus(inc.id, 'En Route')}
                                 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                               >
                                 <Truck size={12} /> Dispatch
                               </button>
                             ) : (
                               <button 
                                 onClick={() => onUpdateStatus(inc.id, 'Resolved')}
                                 className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/20 active:scale-95"
                               >
                                 <CheckCircle2 size={12} /> Resolve
                               </button>
                             )}
                             <button className="text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Details</button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))
             )}
          </div>
        </div>

        {/* Status Widget */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-sm">
             <h3 className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-4 md:mb-6">Asset Readiness</h3>
             <div className="space-y-5 md:space-y-6">
                {[
                  { label: 'Ground Units', val: 88, color: 'bg-emerald-500' },
                  { label: 'Aerial Support', val: 42, color: 'bg-blue-500' },
                  { label: 'Medical Response', val: 65, color: 'bg-amber-500' },
                ].map((asset) => (
                  <div key={asset.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{asset.label}</span>
                      <span className="text-[10px] md:text-xs font-mono font-bold text-slate-900">{asset.val}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${asset.val}%` }}
                        className={`h-full rounded-full ${asset.color}`}
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
