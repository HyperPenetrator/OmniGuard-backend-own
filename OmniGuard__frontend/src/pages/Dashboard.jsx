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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">Control Overview</h2>
          <p className="text-slate-500 text-sm mt-1 font-mono uppercase tracking-widest text-[10px]">Real-time telemetry and incident reports</p>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status: Normal</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm group hover:border-emerald-200 transition-all duration-500"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">
                <TrendingUp size={12} className="text-emerald-500" />
                {stat.trend}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 mt-1 font-mono">{stat.value}</h3>
            </div>
            <div className="mt-6 flex items-center justify-between text-[10px] text-slate-600 font-mono">
              <span>SCANNING_FREQ</span>
              <span>2.4GHz</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden self-start shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Priority Incident Feed</h3>
            <div className="flex items-center gap-2">
               <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                 {incidents.length} Active
               </span>
            </div>
          </div>
          <div className="p-0">
             {incidents.length === 0 ? (
               <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-emerald-500" size={32} />
                  </div>
                  <h4 className="text-slate-900 font-bold tracking-widest uppercase text-xs">All Clear</h4>
                  <p className="text-slate-500 text-xs mt-2 font-mono">No pending emergencies detected in current sector.</p>
               </div>
             ) : (
               incidents.map((inc, i) => (
                 <motion.div 
                   key={inc.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-none group"
                 >
                   <div className="flex gap-6">
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] font-mono text-emerald-600 font-bold">14:2{i}</span>
                         <div className="w-[2px] flex-1 bg-slate-100 my-2" />
                         <div className={`w-2 h-2 rounded-full ${inc.status === 'detected' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                              inc.severity === 'high' ? 'bg-rose-100 text-rose-500 border-rose-200' : 
                              inc.severity === 'medium' ? 'bg-amber-100 text-amber-500 border-amber-200' : 
                              'bg-blue-100 text-blue-500 border-blue-200'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{inc.incidentNumber || inc.id}</span>
                            <span className="text-[10px] font-mono text-slate-500 ml-auto">{inc.status === 'detected' ? 'UNRECOGNIZED_THREAT' : 'TEAM_EN_ROUTE'}</span>
                         </div>
                         <h4 className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors uppercase">
                           {inc.type} - {typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Unknown Sector')}
                         </h4>
                         <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                           Incident detected at {inc.location?.coordinates ? `coordinates [${inc.location.coordinates.lat.toFixed(4)}, ${inc.location.coordinates.lng.toFixed(4)}]` : (typeof inc.location === 'string' ? inc.location : (inc.location?.address || 'Unknown Location'))}. Immediate response required.
                         </p>
                         
                         <div className="flex items-center gap-4 mt-6">
                            {inc.status === 'detected' ? (
                              <button 
                                onClick={() => onUpdateStatus(inc.id, 'dispatched')}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                              >
                                <Truck size={14} /> Dispatch Team
                              </button>
                            ) : (
                              <button 
                                onClick={() => onUpdateStatus(inc.id, 'resolved')}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/20"
                              >
                                <CheckCircle2 size={14} /> Resolve Case
                              </button>
                            )}
                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Details</button>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] mb-6">Asset Readiness</h3>
             <div className="space-y-6">
                {[
                  { label: 'Ground Units', val: 88, color: 'bg-emerald-500' },
                  { label: 'Aerial Support', val: 42, color: 'bg-blue-500' },
                  { label: 'Medical Response', val: 65, color: 'bg-amber-500' },
                ].map((asset) => (
                  <div key={asset.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{asset.label}</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{asset.val}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
