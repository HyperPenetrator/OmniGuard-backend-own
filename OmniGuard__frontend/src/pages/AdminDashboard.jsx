import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  Zap,
  BarChart3,
  PieChart,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { getStats } from '../services/api';

export default function AdminDashboard({ user, incidents = [], onUpdateStatus }) {
  const [stats, setStats] = useState({
    active: 0,
    resolved: 0,
    closed: 0,
    successRate: '0%',
    totalHandled: 0
  });
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats(user.token);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user.token, incidents]);

  const activeIncidents = incidents.filter(i => 
    i && i.status !== 'Resolved' && i.status !== 'resolved' && 
    i.status !== 'Closed' && i.status !== 'closed'
  );

  const filteredIncidents = filterType === 'All' 
    ? activeIncidents 
    : activeIncidents.filter(i => i.assignedTeam === filterType);

  const statCards = [
    { label: 'Network Success Rate', value: stats?.successRate || '0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active Deployments', value: (stats?.active ?? 0).toString(), icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Incidents Resolved', value: (stats?.resolved ?? 0).toString(), icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Avg Response Time', value: '4.2m', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const teams = ['All', 'Fire', 'Police', 'Medical', 'Tech-Hazard'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Admin Strategic Command</h1>
          <p className="text-brand-muted font-mono text-xs uppercase tracking-[0.2em] mt-1">Autonomous Triage & Dispatch Monitor</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-brand-muted/10 border border-brand-muted/20 px-4 py-2 rounded-2xl shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-brand-text uppercase tracking-widest">Global Link Active</span>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 shadow-xl shadow-slate-900/50 group hover:border-emerald-500/30 transition-all relative overflow-hidden"
          >
            <div className={`p-3 rounded-2xl bg-brand-muted/10 ${stat.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-brand-text mt-1 font-mono">{stat.value}</h3>
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-muted/5 rounded-full translate-x-12 -translate-y-12 -z-10 opacity-50" />
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Automated Incident Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel !rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-brand-text uppercase tracking-tight">Autonomous Incident Stream</h3>
                <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">System-handled triage and routing</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {teams.map(team => (
                  <button
                    key={team}
                    onClick={() => setFilterType(team)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      filterType === team 
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                        : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredIncidents.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-16 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h4 className="text-xl font-black text-brand-text uppercase">Sector Secure</h4>
                    <p className="text-brand-muted font-medium mt-2">Zero unhandled threats in current protocol radius.</p>
                  </motion.div>
                ) : (
                  filteredIncidents.map((inc) => (
                    <motion.div
                      layout
                      key={inc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="p-8 hover:bg-white/5 transition-all group border-l-4 border-transparent hover:border-emerald-500"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              inc.severity === 'Critical' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                              inc.severity === 'High' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                              'bg-blue-100 text-blue-600 border-blue-200'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className="text-[10px] font-mono text-[#94A3B8] font-bold uppercase tracking-tighter">
                              {inc.incidentNumber || inc.id}
                            </span>
                            <div className="flex-1" />
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Auto-Dispatched
                            </span>
                          </div>
                          <h4 className="text-xl font-black text-brand-text uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                            {inc.type} — {typeof inc.location === 'string' ? inc.location : (inc.location?.sector || inc.location?.address || 'Sector Delta')}
                          </h4>
                          <p className="text-brand-muted text-sm mt-3 leading-relaxed font-medium">
                            {inc.description || 'Automated sensor detection triggered in this sector. Tactical units have been notified and routing is active.'}
                          </p>
                          
                          <div className="flex items-center gap-6 mt-6">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                              <Users size={14} className="text-[#94A3B8]" />
                              Assigned: <span className="text-[#F8FAFC]">{inc.assignedTeam}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                              <Clock size={14} className="text-[#94A3B8]" />
                              <span className="text-[#F8FAFC]">{inc.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col justify-end gap-3">
                          <button 
                            onClick={() => onUpdateStatus(inc.id, 'Resolved')}
                            className="px-6 py-3 bg-emerald-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          >
                            Close File
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tactical Reports & Health */}
        <div className="space-y-8">
          <div className="glass-panel !rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">Team Performance</h3>
              <BarChart3 size={18} className="text-[#94A3B8]" />
            </div>
            <div className="space-y-8">
              {[
                { label: 'Fire Response', rate: 94, color: 'bg-rose-500' },
                { label: 'Police Security', rate: 89, color: 'bg-blue-500' },
                { label: 'Medical Emergency', rate: 98, color: 'bg-emerald-500' },
                { label: 'Tech Stability', rate: 76, color: 'bg-amber-500' },
              ].map(team => (
                <div key={team.label} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">{team.label}</span>
                    <span className="text-xs font-mono font-black text-[#F8FAFC]">{team.rate}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${team.rate}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${team.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel !rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] translate-x-20 -translate-y-20" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <Shield size={24} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight">System Integrity</h4>
              </div>
              <p className="text-[#94A3B8] text-sm font-medium leading-relaxed mb-8">
                Autonomous triage model is currently performing at <span className="text-white">99.8% accuracy</span>. No manual intervention required for 94% of incidents.
              </p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/5 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all">
                Download Operational Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
