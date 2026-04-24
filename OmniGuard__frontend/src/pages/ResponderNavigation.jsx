import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navigation, CheckCircle, AlertTriangle, MapPin, Radio, Activity } from 'lucide-react';
import TacticalMap from '../components/TacticalMap';

export default function ResponderNavigation({ user, incidents = [], onUpdateStatus }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Find incident: either from state or the most recent active assignment for this team
  const incident = location.state?.incident || 
    incidents
      .filter(inc => inc.assignedTeam === (user?.assignedTeam || user?.responderTeam) && inc.status !== 'Resolved')
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0))[0] ||
    { id: 'T-SYNC', type: 'No Active Assignment', location: 'Awaiting Dispatch', lat: 26.1445, lng: 91.7362, status: 'Idle', severity: 'Low' };

  const handleStatusUpdate = (status) => {
    if (onUpdateStatus && incident.id !== 'T-SYNC') {
      onUpdateStatus(incident.id, status);
    }
  };

  const handleResolve = () => {
    if (onUpdateStatus && incident.id !== 'T-SYNC') {
      onUpdateStatus(incident.id, 'Resolved');
    }
    navigate('/incidents');
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-3">
             <Navigation className="text-emerald-500" />
             Tactical Navigation
          </h2>
          <p className="text-brand-muted font-medium">Real-time GPS routing to {incident.id}</p>
        </div>
        <div className="flex gap-4">
           <div className="px-5 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center gap-3 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Telemetry: Online</span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-8 bg-brand-bg-start/50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-brand-muted/10 relative overflow-hidden shadow-inner group">
          <div className="absolute inset-0 z-0">
             <TacticalMap incidents={[{ ...incident, lat: incident.lat || 26.1445, lng: incident.lng || 91.7362 }]} />
          </div>

          {/* Map Overlay HUD */}
          {/* Map Overlay HUD - Left Group */}
          <div className="absolute top-6 left-6 md:left-[72px] z-10 w-[calc(100%-8rem)] md:max-w-xs">
             <div className="glass-panel !bg-brand-bg-start/80 backdrop-blur-md p-4 !rounded-2xl shadow-2xl !border-brand-muted/20 flex items-center gap-4">
                <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-xl shadow-emerald-500/40 shrink-0">
                   <Navigation size={20} />
                </div>
                <div className="min-w-0">
                   <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest leading-none mb-1">Routing</p>
                   <p className="font-black text-brand-text text-sm truncate">350m - Turn Right</p>
                </div>
             </div>
          </div>

          {/* Map Overlay HUD - Right Grouped Container */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 items-end">
             {/* Arrival Block */}
             <div className="glass-panel !bg-brand-bg-start/80 backdrop-blur-md p-4 !rounded-2xl shadow-2xl !border-brand-muted/20 text-right min-w-[100px]">
                <p className="text-2xl font-black text-brand-text leading-none">4 MIN</p>
                <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mt-1">Est. Arrival</p>
             </div>

             {/* Map Registry Block (Relocated from TacticalMap) */}
             <div className="glass-panel !bg-brand-bg-start/80 backdrop-blur-md p-4 !rounded-2xl shadow-2xl !border-brand-muted/20 min-w-[140px]">
                <h4 className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-3 border-b border-brand-muted/10 pb-2">Map Registry</h4>
                <div className="space-y-2">
                   <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                         <span className="text-[9px] text-brand-text font-mono uppercase">Detected</span>
                      </div>
                      <span className="text-[9px] text-brand-muted font-bold">02</span>
                   </div>
                   <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                         <span className="text-[9px] text-brand-text font-mono uppercase">Dispatched</span>
                      </div>
                      <span className="text-[9px] text-brand-muted font-bold">01</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Controls Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="glass-panel !border-brand-muted/10 p-8 !rounded-[2.5rem] shadow-xl flex-1">
              <div className="flex items-center gap-3 mb-8">
                 <Activity className="text-emerald-500" />
                 <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.2em]">Mission Control</h3>
              </div>

              <div className="space-y-4 mb-10">
                 <div className="p-4 bg-brand-muted/5 rounded-2xl border border-brand-muted/10">
                    <p className="text-[10px] font-black text-brand-muted uppercase">Current Sector</p>
                    <p className="font-bold text-brand-text">ALPHA_DENSE_02</p>
                 </div>
                 <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Assigned Incident</p>
                    <p className="font-black text-brand-text uppercase">{incident.type}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-brand-text uppercase tracking-widest ml-1 mb-4">Update Pulse Status</p>
                 <button onClick={() => handleStatusUpdate('En Route')} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <Radio size={16} />
                    Signal: In Transit
                 </button>
                 <button onClick={() => handleStatusUpdate('On Scene')} className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <Activity size={16} />
                    Signal: On Scene
                 </button>
                 <div className="h-6" />
                 <button onClick={handleResolve} className="w-full py-5 bg-emerald-500 text-white font-black rounded-[1.5rem] shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-tighter">
                    <CheckCircle size={26} />
                    MISSION RESOLVED
                 </button>
                 <button className="w-full py-3 bg-transparent text-rose-500 font-bold rounded-2xl hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest opacity-60 hover:opacity-100">
                    <AlertTriangle size={14} />
                    Emergency Override
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
