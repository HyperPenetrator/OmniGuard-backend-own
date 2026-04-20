import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hardcoded activeIncidents removed to prevent unresolvable ghost incidents.

export default function ResponderIncidents({ user, incidents = [] }) {
  const navigate = useNavigate();

  // Filter incidents for this responder's team with safety checks and exclude resolved/closed
  const displayIncidents = incidents
    .filter(inc => 
      inc && 
      inc.assignedTeam === (user.assignedTeam || user.responderTeam) &&
      inc.status !== 'Resolved' && inc.status !== 'resolved' &&
      inc.status !== 'Closed' && inc.status !== 'closed'
    )
    .map(inc => ({
      id: inc.incidentNumber || inc.id || 'INC-UNKNOWN',
      type: inc.type || 'Unknown Incident',
      status: inc.status || 'Dispatched',
      priority: ['Critical', 'High'].includes(inc.severity) ? 'Critical' : inc.severity === 'Medium' ? 'High' : 'Normal',
      location: (typeof inc.lat === 'number' && typeof inc.lng === 'number') 
        ? `${inc.lat.toFixed(2)}, ${inc.lng.toFixed(2)}` 
        : (typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Unknown Location')),
      distance: inc.distance || '1.2km',
      ...inc
    }));
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Assignments</h2>
          <p className="text-slate-500 font-medium">Prioritized emergency queue for your unit</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-slate-700">DUTY ACTIVE</span>
        </div>
      </div>

      {displayIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Queue Cleared</h3>
          <p className="text-slate-500 font-medium">All assigned emergencies have been resolved. Awaiting further dispatch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayIncidents.map((incident) => (
            <motion.div
              key={incident.id}
              whileHover={{ scale: 1.02, translateY: -5 }}
              className={`p-6 rounded-[2.5rem] border-2 transition-all ${
                incident.priority === 'Critical' ? 'bg-rose-50 border-rose-100 shadow-rose-100' : 'bg-white border-slate-50'
              } shadow-xl relative overflow-hidden group`}
            >
              {incident.priority === 'Critical' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rotate-45 translate-x-16 -translate-y-16"></div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black font-mono bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter">
                  {incident.id}
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                  incident.priority === 'Critical' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {incident.priority}
                </span>
              </div>

              <h3 className="font-black text-slate-900 text-2xl mb-2 uppercase tracking-tighter">{incident.type}</h3>
              <p className="text-slate-500 flex items-center gap-2 mb-8 font-medium">
                <MapPin size={18} className="text-slate-400" /> {incident.location}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Estimated Distance</p>
                    <p className="text-sm font-bold text-slate-900">{incident.distance} away</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/maps', { state: { incident } })}
                  className="flex items-center gap-2 bg-emerald-500 text-white pl-6 pr-4 py-3 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 group"
                >
                  VIEW DETAILS
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-auto max-w-md bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <h4 className="font-black text-lg uppercase tracking-tight">Safety Protocol Delta</h4>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-6 relative z-10 font-medium">
          Automated risk assessment confirms high density in Beltola. Maintain active sync with dispatcher. Secondary units are on standby.
        </p>
        <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/5 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all relative z-10 shadow-2xl">
          Request Backup
        </button>
      </div>
    </div>
  );
}
