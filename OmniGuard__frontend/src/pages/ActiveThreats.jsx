import React from 'react'
import { AlertCircle, MapPin, ShieldAlert, Zap, Clock } from 'lucide-react'

// Hardcoded threats removed — now driven entirely by the `incidents` prop.

export default function ActiveThreats({ incidents = [] }) {
  const threats = incidents.map(inc => ({
    id: inc.incidentNumber || inc.id,
    type: inc.type,
    district: typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Unknown'),
    status: inc.status,
    risk: inc.severity,
    time: inc.createdAt ? new Date(inc.createdAt._seconds * 1000).toLocaleTimeString() : 'Just now'
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-text">Active Threat Center</h2>
          <p className="text-brand-muted">Categorized regional hazards and escalation levels</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-muted/10 px-4 py-2 rounded-xl border border-brand-muted/20 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-xs font-bold text-brand-muted uppercase tracking-widest">{incidents.length} LIVE SENSORS</span>
        </div>
      </div>

      <div className="glass-panel !rounded-2xl overflow-hidden">
        {threats.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert size={48} className="text-brand-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-brand-text">No Active Threats</h3>
            <p className="text-brand-muted text-sm">All monitored sectors are currently stable.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-muted/5 border-b border-brand-muted/10">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Threat ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Hazard Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Risk Level</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Detected</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-muted/5">
              {threats.map((threat) => (
                <tr key={threat.id} className="hover:bg-brand-muted/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-brand-muted group-hover:text-emerald-500">{threat.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        ['Critical', 'High'].includes(threat.risk) ? 'bg-rose-100 text-rose-600' : 
                        threat.risk === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <AlertCircle size={16} />
                      </div>
                      <span className="font-bold text-brand-text uppercase">{threat.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-brand-muted flex items-center gap-1">
                      <MapPin size={14} className="text-brand-muted/60" />
                      {threat.district}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-muted/10 text-[10px] font-bold text-brand-muted uppercase">
                      <span className={`w-1.5 h-1.5 rounded-full ${threat.status === 'Resolved' ? 'bg-brand-muted/30' : 'bg-emerald-500 animate-pulse'}`}></span>
                      {threat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${
                      ['Critical', 'High'].includes(threat.risk) ? 'text-rose-600' : 
                      threat.risk === 'Medium' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {threat.risk?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-brand-muted flex items-center gap-1">
                      <Clock size={14} />
                      {threat.time}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-brand-muted/10 rounded-lg text-brand-muted hover:text-emerald-500 transition-colors">
                      <Zap size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl text-white">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="text-emerald-400" size={20} />
            Evacuation Protocols
          </h3>
          <p className="text-slate-400 text-sm mb-6">Standard operating procedures for immediate regional threat escalation.</p>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-rose-500">
              <h4 className="font-bold text-sm">Level 4 Red Alert</h4>
              <p className="text-xs text-slate-500 mt-1">Full state mobilization and mandatory evacuation of low-lying flood zones.</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-orange-500">
              <h4 className="font-bold text-sm">Level 3 Orange Alert</h4>
              <p className="text-xs text-slate-500 mt-1">Regional responder standby and pre-emptive resource distribution.</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 !rounded-2xl">
          <h3 className="font-bold mb-4 text-brand-text">Atmospheric Analysis</h3>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
             {[45, 60, 35, 80, 55, 90, 75, 40].map((h, i) => (
               <div key={i} className="flex-1 bg-brand-muted/5 rounded-t-lg relative group transition-all hover:bg-emerald-500/10">
                 <div style={{height: `${h}%`}} className="bg-emerald-500/20 rounded-t-lg group-hover:bg-emerald-500 transition-all"></div>
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
               </div>
             ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            <span>Guwahati</span>
            <span>Jorhat</span>
            <span>Silchar</span>
            <span>Tinsukia</span>
          </div>
        </div>
      </div>
    </div>
  )
}
