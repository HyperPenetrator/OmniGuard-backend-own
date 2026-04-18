import React from 'react';
import { Activity, Clock, CheckCircle2, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CivilianStatus({ incidents = [] }) {
  const requests = incidents.map(inc => ({
    id: inc.incidentNumber || inc.id,
    type: inc.type,
    status: inc.status,
    time: 'Just now', // Could be formatted from inc.createdAt
    priority: inc.severity || 'Medium',
    sector: inc.location?.sector || inc.location || 'Unknown Location'
  }));

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Status Tracking</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Real-time lifecycle monitoring of your emergency requests</p>
        </div>
        <div className="flex gap-3">
           <div className="px-6 py-2.5 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-3 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unit_Sync: Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((req, i) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/30 group hover:border-emerald-200 transition-all duration-500 relative overflow-hidden"
          >
            {req.status === 'Resolved' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rotate-45 translate-x-16 -translate-y-16"></div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
               <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                    req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Activity size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                       <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">{req.id}</span>
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                         req.status === 'Resolved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                       }`}>
                         {req.status}
                       </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{req.type}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{req.sector}</p>
                  </div>
               </div>

               <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Clock size={10} /> Reported
                     </span>
                     <span className="text-sm font-bold text-slate-900">{req.time}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Impact
                     </span>
                     <span className="text-sm font-bold text-slate-900 uppercase">{req.priority}</span>
                  </div>
                  <button className="p-4 bg-slate-50 group-hover:bg-emerald-500 group-hover:text-white rounded-2xl transition-all shadow-sm active:scale-95">
                     <ChevronRight size={20} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden group h-64 flex items-center shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-center gap-10">
           <div className="hidden lg:block w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/5 backdrop-blur-3xl">
              <ShieldCheck size={64} className="text-emerald-500/30" />
           </div>
           <div>
              <h4 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">Always Operational</h4>
              <p className="max-w-xl text-slate-400 text-base leading-relaxed font-medium">
                Our tactical responders are optimized for zero-latency response. Your safety window is monitored by the G-Sector Control Center in real-time.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
