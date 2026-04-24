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
    incidentFilter: ['Natural', 'Natural Disaster']
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
  
  // Helper for distance calculation (Haversine)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const getBearing = (lat1, lon1, lat2, lon2) => {
    const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
    const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    if (brng >= 337.5 || brng < 22.5) return 'North';
    if (brng >= 22.5 && brng < 67.5) return 'North-East';
    if (brng >= 67.5 && brng < 112.5) return 'East';
    if (brng >= 112.5 && brng < 157.5) return 'South-East';
    if (brng >= 157.5 && brng < 202.5) return 'South';
    if (brng >= 202.5 && brng < 247.5) return 'South-West';
    if (brng >= 247.5 && brng < 292.5) return 'West';
    return 'North-West';
  };

  // Filter incidents for this team and only active ones
  const teamIncidents = incidents.filter(inc => {
    if (!inc) return false;
    
    // Strict assignment check: If assignedTeam is set, it must match this team
    // Otherwise, fallback to type filter for untriaged incidents
    const isAssignedToThisTeam = inc.assignedTeam === team;
    const isMatchingType = Array.isArray(config.incidentFilter) 
      ? config.incidentFilter.includes(inc.type) 
      : inc.type === config.incidentFilter;
      
    // If it's already assigned to another team, don't show it here even if the type matches
    if (inc.assignedTeam && inc.assignedTeam !== team) return false;

    return (isAssignedToThisTeam || isMatchingType) &&
      inc.status !== 'Resolved' && inc.status !== 'resolved' &&
      inc.status !== 'Closed' && inc.status !== 'closed';
  });

  // Find nearest incident for routing
  const nearestIncident = React.useMemo(() => {
    if (!userLocation || teamIncidents.length === 0) return null;
    // Filter out incidents without coordinates before finding the nearest
    const incidentsWithCoords = teamIncidents.filter(inc => inc.location?.coordinates?.lat && inc.location?.coordinates?.lng);
    if (incidentsWithCoords.length === 0) return null;

    return [...incidentsWithCoords].sort((a, b) => {
      const distA = getDistance(userLocation.lat, userLocation.lng, a.location.coordinates.lat, a.location.coordinates.lng);
      const distB = getDistance(userLocation.lat, userLocation.lng, b.location.coordinates.lat, b.location.coordinates.lng);
      return distA - distB;
    })[0];
  }, [userLocation, teamIncidents]);

  const routingData = React.useMemo(() => {
    if (!nearestIncident?.location?.coordinates || !userLocation) return null;
    try {
      const dist = getDistance(
        userLocation.lat, 
        userLocation.lng, 
        nearestIncident.location.coordinates.lat, 
        nearestIncident.location.coordinates.lng
      );
      const bearing = getBearing(
        userLocation.lat, 
        userLocation.lng, 
        nearestIncident.location.coordinates.lat, 
        nearestIncident.location.coordinates.lng
      );
      const eta = Math.round(dist * 2.5) + 1; // 2.5 min per km + 1 min overhead
      return { 
        dist: dist.toFixed(1), 
        bearing, 
        eta,
        sector: nearestIncident.location.sector || 'Sector Delta'
      };
    } catch (e) {
      console.warn('Routing calculation failed', e);
      return null;
    }
  }, [nearestIncident, userLocation]);

  const activeCount = teamIncidents.length;
  const highPriority = teamIncidents.filter(i => i.severity === 'High' || i.severity === 'Critical').length;

  const stats = [
    { label: 'Assigned Ops', value: (activeCount ?? 0).toString(), icon: config.icon, color: config.color, trend: 'Active' },
    { label: 'Priority Alerts', value: (highPriority ?? 0).toString(), icon: Zap, color: 'text-amber-500', trend: 'Critical' },
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
            <h2 className="text-xl md:text-2xl font-black text-brand-text tracking-tight uppercase tracking-[0.1em]">{config.label} Dashboard</h2>
            <p className="text-brand-muted text-[9px] md:text-[10px] mt-1 font-mono uppercase tracking-widest">
              Unit: {user.unitId || 'CMD-01'} | Status: <span className="text-emerald-500 font-bold">In Sync</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-brand-muted/10 border border-brand-muted/20 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Global Status: Active</span>
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
            className={`glass-panel p-4 md:p-6 !rounded-xl md:!rounded-2xl shadow-sm group !border-brand-muted/10 ${config.hoverBorder} transition-all duration-500`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${config.accent} dark:bg-brand-muted/10 border border-slate-100 dark:border-brand-muted/20 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-brand-muted uppercase tracking-tighter">
                <TrendingUp size={10} className="text-emerald-500" />
                {stat.trend}
              </div>
            </div>
            <div className="mt-4 md:mt-6">
              <p className="text-[9px] md:text-xs font-bold text-brand-muted uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-2xl md:text-4xl font-black text-brand-text mt-1 font-mono tracking-tighter">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map and Routing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 h-[400px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <TacticalMap incidents={teamIncidents} userLocation={userLocation} targetIncident={nearestIncident} />
          
          {/* GPS Status / Enablement Prompt */}
          {!userLocation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-6 right-6 z-[1000] bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl border border-rose-500/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                  <MapPin size={20} />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-tight">Tactical GPS Disabled</h5>
                  <p className="text-[10px] text-white/70 font-medium tracking-tight">Enable location services for real-time tactical routing.</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors"
              >
                Sync Uplink
              </button>
            </motion.div>
          )}

          {/* Routing Instruction Overlay - Fixed over sidebar */}
          {routingData && nearestIncident && ['En Route', 'Dispatching'].includes(nearestIncident.status) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-24 left-8 lg:left-72 z-[9999] glass-panel !bg-brand-bg-start/80 backdrop-blur-xl shadow-2xl !rounded-3xl p-4 flex items-center gap-5 !border-brand-muted/20 pr-10 ring-1 ring-black/5"
            >
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Navigation size={28} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Active Tactical Routing</p>
                <h4 className="text-xl font-black text-brand-text tracking-tighter">
                  {routingData.dist}km — {routingData.bearing} to {routingData.sector}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live Uplink Active</span>
                </div>
              </div>
              <div className="ml-4 pl-6 border-l border-brand-muted/10 flex flex-col items-center">
                 <span className="text-2xl font-black text-brand-text font-mono tracking-tighter leading-none">{routingData.eta} MIN</span>
                 <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest mt-1 text-center">Est. Arrival</span>
              </div>
            </motion.div>
          )}
        </div>


         <div className="glass-panel p-6 shadow-sm flex flex-col justify-center !rounded-2xl !border-brand-muted/10">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                  <MapPin size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-brand-text uppercase tracking-tight">Zone Intelligence</h4>
                  <p className="text-[10px] text-brand-muted font-medium">Real-time perimeter analysis</p>
               </div>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-brand-muted/5 rounded-xl border border-brand-muted/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Sector</p>
                  <p className="text-sm font-black text-brand-text font-mono">
                    {routingData && nearestIncident?.location?.coordinates 
                      ? `${routingData.sector} [${nearestIncident.location.coordinates.lat.toFixed(2)}, ${nearestIncident.location.coordinates.lng.toFixed(2)}]` 
                      : 'Waiting for assignment...'}
                  </p>
               </div>
               <div className="p-4 bg-brand-muted/5 rounded-xl border border-brand-muted/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Optimal Route</p>
                  <p className="text-sm font-black text-emerald-600 font-mono uppercase">
                    {routingData ? `${routingData.bearing} [${routingData.dist} KM]` : 'Calculating...'}
                  </p>
               </div>
            </div>
         </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2 glass-panel !rounded-2xl overflow-hidden self-start shadow-sm !border-brand-muted/10">
          <div className="p-4 md:p-6 border-b border-brand-muted/10 flex items-center justify-between bg-brand-muted/5">
            <h3 className="text-[10px] md:text-xs font-bold text-brand-text uppercase tracking-[0.2em]">Active Team Assignments</h3>
            <span className={`px-3 py-1 ${config.bgColor} text-white rounded-lg text-[9px] font-bold uppercase tracking-widest`}>
              {teamIncidents.length} Tasks
            </span>
          </div>
          <div className="divide-y divide-brand-muted/10">
             {teamIncidents.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="text-emerald-500" size={32} />
                   </div>
                   <h4 className="text-brand-text font-bold tracking-widest uppercase text-xs">All Clear</h4>
                   <p className="text-brand-muted text-xs mt-2 font-mono">No incidents assigned to your team currently.</p>
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
                          <div className="w-[2px] flex-1 bg-brand-muted/10 my-2" />
                          <div className={`w-2 h-2 rounded-full ${['Reported', 'Triaged', 'Dispatching'].includes(inc.status) ? 'bg-rose-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                               ['Critical', 'High'].includes(inc.severity) ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                               inc.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                               'bg-blue-500/10 text-blue-500 border-blue-500/20'
                             }`}>
                                {inc.severity}
                             </span>
                             <span className="text-[10px] font-mono text-brand-muted uppercase tracking-widest">{inc.incidentNumber || inc.id}</span>
                          </div>
                          <h4 className="text-sm font-bold text-brand-text group-hover:text-emerald-600 transition-colors uppercase">
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
          <div className="glass-panel !border-brand-muted/10 !rounded-2xl p-6 shadow-sm">
             <h3 className="text-[10px] md:text-xs font-bold text-brand-text uppercase tracking-[0.2em] mb-6">Team Readiness</h3>
             <div className="space-y-6">
                {[
                  { label: 'Field Personnel', val: 92, color: config.bgColor },
                  { label: 'Vehicle Fleet', val: 78, color: config.bgColor },
                  { label: 'Comms Uplink', val: 100, color: 'bg-emerald-500' },
                ].map((asset) => (
                  <div key={asset.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{asset.label}</span>
                      <span className="text-xs font-mono font-bold text-brand-text">{asset.val}%</span>
                    </div>
                    <div className="h-1 bg-brand-muted/10 rounded-full overflow-hidden">
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
