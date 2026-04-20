import React from 'react';
import { Activity, Clock, CheckCircle2, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CivilianStatus({ user, incidents = [] }) {
  // Filter incidents reported by this user
  const userIncidents = incidents.filter(inc => (inc.reportedBy?.userId || inc.reportedBy) === user?.id);

  const requests = userIncidents.map(inc => ({
    id: inc.incidentNumber || inc.id,
    type: inc.type,
    status: inc.status,
    time: inc.createdAt ? new Date(inc.createdAt._seconds * 1000).toLocaleTimeString() : 'Recently',
    priority: inc.severity || 'Medium',
    sector: typeof inc.location === 'string' 
      ? inc.location 
      : (inc.location?.sector || (inc.location?.address ? inc.location.address : 'Target Coordinates'))
  }));

  return (
    <div className="flex flex-col h-full gap-6 md:gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Status Tracking</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1 md:mt-2 font-medium">Real-time lifecycle monitoring of your emergency requests</p>
        </div>
        <div className="flex gap-3">
           <div className="px-4 md:px-6 py-2 md:py-2.5 bg-white border border-slate-200 md:border-2 md:border-slate-100 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 shadow-xl">
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unit_Sync: Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white border-2 border-slate-50 rounded-3xl md:rounded-[3rem] shadow-xl text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-6">
              <Activity size={32} className="md:size-40 text-slate-200" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">No Active Reports</h3>
            <p className="text-slate-500 text-sm md:text-base max-w-xs mx-auto font-medium">You haven't submitted any emergency requests in the current session cycle.</p>
          </div>
        ) : requests.map((req, i) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-100 md:border-2 md:border-slate-50 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-200/30 group hover:border-emerald-200 transition-all duration-500 relative overflow-hidden"
          >
            {req.status === 'Resolved' && (
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-emerald-500/5 rotate-45 translate-x-12 md:translate-x-16 -translate-y-12 md:-translate-y-16"></div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
               <div className="flex items-start md:items-center gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0 ${
                    req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Activity size={24} className="md:size-32" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                       <span className="text-[9px] md:text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">{req.id}</span>
                       <span className={`text-[8px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest ${
                         req.status === 'Resolved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                       }`}>
                         {req.status}
                       </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{req.type}</h3>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium truncate">{req.sector}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between lg:justify-end gap-4 md:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-10">
                  <div className="flex flex-col">
                     <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Clock size={10} /> Time
                     </span>
                     <span className="text-xs md:text-sm font-bold text-slate-900">{req.time}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Priority
                     </span>
                     <span className="text-xs md:text-sm font-bold text-slate-900 uppercase">{req.priority}</span>
                  </div>
                  <button className="p-3 md:p-4 bg-slate-50 group-hover:bg-emerald-500 group-hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95">
                     <ChevronRight size={18} md:size={20} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-white relative overflow-hidden group min-h-[12rem] md:h-64 flex items-center shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-center gap-6 md:gap-10">
           <div className="hidden lg:block w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/5 backdrop-blur-3xl">
              <ShieldCheck size={64} className="text-emerald-500/30" />
           </div>
           <div>
              <h4 className="text-2xl md:text-3xl font-black mb-3 md:mb-4 tracking-tighter uppercase italic">Always Operational</h4>
              <p className="max-w-xl text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                Our tactical responders are optimized for zero-latency response. Your safety window is monitored by the G-Sector Control Center in real-time.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
