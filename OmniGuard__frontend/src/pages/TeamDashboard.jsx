import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  Users, 
  Zap, 
  TrendingUp, 
  Truck, 
  CheckCircle2, 
  Flame, 
  Shield, 
  AlertTriangle,
  MapPin,
  Clock,
  Navigation
} from 'lucide-react';
import TacticalMap from '../components/TacticalMap';

const teamConfigs = {
  Fire: {
    label: 'Fire Department',
    icon: Flame,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500',
    borderColor: 'border-rose-200',
    hoverBorder: 'hover:border-rose-400',
    glow: 'shadow-rose-500/20',
    accent: 'bg-rose-50',
    incidentFilter: 'Fire'
  },
  Police: {
    label: 'Police Task Force',
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    glow: 'shadow-blue-500/20',
    accent: 'bg-blue-50',
    incidentFilter: 'Crime'
  },
  'Tech-Hazard': {
    label: 'Bio-Hazard / Disaster',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
    glow: 'shadow-amber-500/20',
    accent: 'bg-amber-50',
    incidentFilter: 'Natural Disaster'
  },
  Medical: {
    label: 'Medical Response',
    icon: Activity,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    glow: 'shadow-emerald-500/20',
    accent: 'bg-emerald-50',
    incidentFilter: 'Medical'
  }
};

export default function TeamDashboard({ user, incidents, onUpdateStatus, userLocation }) {
  const team = user.assignedTeam || user.team || 'Medical';
  const config = teamConfigs[team] || teamConfigs.Medical;
  
  // Filter incidents for this team and only active ones
  const teamIncidents = incidents.filter(inc => 
    inc && 
    (inc.assignedTeam === team || inc.type === config.incidentFilter) &&
    inc.status !== 'Resolved' && inc.status !== 'resolved' &&
    inc.status !== 'Closed' && inc.status !== 'closed'
  );

  const activeCount = teamIncidents.length;
  const highPriority = teamIncidents.filter(i => i.severity === 'High' || i.severity === 'Critical').length;

  const stats = [
    { label: 'Assigned Ops', value: activeCount.toString(), icon: config.icon, color: config.color, trend: 'Active' },
    { label: 'Priority Alerts', value: highPriority.toString(), icon: Zap, color: 'text-amber-500', trend: 'Critical' },
    { label: 'Unit Readiness', value: '94%', icon: Truck, color: 'text-emerald-500', trend: 'Stable' },
    { label: 'Sector Coverage', value: '88%', icon: Navigation, color: 'text-blue-500', trend: 'Optimal' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Team Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${config.bgColor} text-white shadow-lg ${config.glow} rotate-3`}>
            <config.icon size={32} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">{config.label} Dashboard</h2>
            <p className="text-slate-500 text-[9px] md:text-[10px] mt-1 font-mono uppercase tracking-widest">
              Unit: {user.unitId || 'CMD-01'} | Status: <span className="text-emerald-500 font-bold">In Sync</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status: Active</span>
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
            className={`bg-white border ${config.borderColor} p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm group ${config.hoverBorder} transition-all duration-500`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${config.accent} border border-slate-100 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tighter">
                <TrendingUp size={10} className="text-emerald-500" />
                {stat.trend}
              </div>
            </div>
            <div className="mt-4 md:mt-6">
              <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 mt-1 font-mono tracking-tighter">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map and Routing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 h-[400px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <TacticalMap incidents={teamIncidents} userLocation={userLocation} showRouting={true} />
            
            {/* Routing Instruction Overlay (Match User Image) */}
            {userLocation && teamIncidents.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-6 left-6 z-[1000] bg-white/95 backdrop-blur shadow-2xl rounded-3xl p-4 flex items-center gap-5 border border-slate-200 pr-10"
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Navigation size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Routing Instruction</p>
                  <h4 className="text-xl font-black text-slate-900 tracking-tighter">350m - Turn Right at Beltola Chowk</h4>
                </div>
                <div className="absolute top-4 right-6 flex flex-col items-center">
                   <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter leading-none">4 MIN</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Est. Arrival</span>
                </div>
              </motion.div>
            )}
         </div>

         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                  <MapPin size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Zone Intelligence</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Real-time perimeter analysis</p>
               </div>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Sector</p>
                  <p className="text-sm font-black text-slate-900 font-mono">G-SECTOR ALPHA [26.14, 91.73]</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Optimal Route</p>
                  <p className="text-sm font-black text-emerald-600 font-mono">NORTH-BY-NORTHEAST [ACTIVE]</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden self-start shadow-sm">
          <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Active Team Assignments</h3>
            <span className={`px-3 py-1 ${config.bgColor} text-white rounded-lg text-[9px] font-bold uppercase tracking-widest`}>
              {teamIncidents.length} Tasks
            </span>
          </div>
          <div className="divide-y divide-slate-100">
             {teamIncidents.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="text-emerald-500" size={32} />
                   </div>
                   <h4 className="text-slate-900 font-bold tracking-widest uppercase text-xs">All Clear</h4>
                   <p className="text-slate-500 text-xs mt-2 font-mono">No incidents assigned to your team currently.</p>
                </div>
             ) : (
                teamIncidents.map((inc, i) => (
                  <motion.div 
                    key={inc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex gap-6">
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">14:2{i}</span>
                          <div className="w-[2px] flex-1 bg-slate-100 my-2" />
                          <div className={`w-2 h-2 rounded-full ${['Reported', 'Triaged', 'Dispatching'].includes(inc.status) ? 'bg-rose-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                               ['Critical', 'High'].includes(inc.severity) ? 'bg-rose-100 text-rose-500 border-rose-200' : 
                               inc.severity === 'Medium' ? 'bg-amber-100 text-amber-500 border-amber-200' : 
                               'bg-blue-100 text-blue-500 border-blue-200'
                             }`}>
                               {inc.severity}
                             </span>
                             <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{inc.incidentNumber || inc.id}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors uppercase">
                            {inc.type} - {typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Unknown Sector')}
                          </h4>
                          
                          <div className="flex items-center gap-4 mt-6">
                             {['Reported', 'Triaged'].includes(inc.status) ? (
                               <button 
                                 onClick={() => onUpdateStatus(inc.id, 'En Route')}
                                 className={`flex items-center gap-2 ${config.bgColor} hover:brightness-110 px-4 py-2 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg ${config.glow} active:scale-95`}
                               >
                                 <Truck size={12} /> Dispatch
                               </button>
                             ) : (
                               <button 
                                 onClick={() => onUpdateStatus(inc.id, 'Resolved')}
                                 className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/20 active:scale-95"
                               >
                                 <CheckCircle2 size={12} /> Resolve
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))
             )}
          </div>
        </div>

        {/* Team Status Widget */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-[0.2em] mb-6">Team Readiness</h3>
             <div className="space-y-6">
                {[
                  { label: 'Field Personnel', val: 92, color: config.bgColor },
                  { label: 'Vehicle Fleet', val: 78, color: config.bgColor },
                  { label: 'Comms Uplink', val: 100, color: 'bg-emerald-500' },
                ].map((asset) => (
                  <div key={asset.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{asset.label}</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{asset.val}%</span>
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

          <div className={`p-6 rounded-2xl ${config.bgColor} text-white shadow-xl ${config.glow} relative overflow-hidden`}>
             <div className="relative z-10">
                <h4 className="font-black text-lg uppercase tracking-tight mb-2">Team Protocol</h4>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  {team === 'Fire' ? 'Ensure structural integrity checks before entry. Respiratory sync active.' :
                   team === 'Police' ? 'Maintain perimeter control. All tactical uplinks are encrypted.' :
                   team === 'Tech-Hazard' ? 'Full Level 4 containment required. Observe decontamination protocols.' :
                   'Rapid response triage active. Prioritize non-ambulatory victims.'}
                </p>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
