import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ShieldAlert, Users, Terminal, Key, Lock, Radio, Activity, Globe, Power, CornerDownRight } from 'lucide-react'

const accessCodes = [
  { id: 'OP-449', operator: 'S. Singh', code: '••••-••••', level: 4, status: 'Active' },
  { id: 'OP-122', operator: 'A. Baruah', code: '••••-••••', level: 3, status: 'Restricted' },
  { id: 'OP-982', operator: 'M. Ahmed', code: '••••-••••', level: 5, status: 'Active' },
  { id: 'OP-301', operator: 'K. Datta', code: '••••-••••', level: 2, status: 'Revoked' },
]

export default function CommanderCenter({ user, incidents = [] }) {
  const responders = incidents.filter(inc => inc.assignedTeam).map(inc => ({
    id: inc.id.substring(0, 5).toUpperCase(),
    name: inc.assignedTeam,
    status: inc.status,
    location: typeof inc.location === 'string' ? inc.location : (inc.location?.sector || 'SECTOR_UNKNOWN'),
    load: inc.severity === 'Critical' ? 95 : inc.severity === 'High' ? 70 : 40
  }));

  const [lockdownOpen, setLockdownOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [terminalLog, setTerminalLog] = useState([
    `> AUTHENTICATED: ${user?.email || 'coordinator@omniguard.io'}`,
    '> ENCRYPTION: AES-256 ACTIVE',
    '> SYSTEM READY'
  ])

  const toggleLockdown = () => {
    setIsLocked(!isLocked)
    setLockdownOpen(false)
    setTerminalLog(prev => [...prev, isLocked ? '> SYSTEM UNLOCKED - ALL NODES ONLINE' : '> CRITICAL: SYSTEM-WIDE LOCKDOWN INITIATED'])
  }

  return (
    <div className="bg-[#020617] text-emerald-500 min-h-full p-6 font-mono border border-emerald-500/20 rounded-2xl relative overflow-hidden">
      {/* Terminal Backdrop Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'repeating-linear-gradient(0deg, #10b981 0px, transparent 1px, transparent 3px)'}}></div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-emerald-500/20 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/40 rounded flex items-center justify-center">
            <Terminal size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-widest uppercase">Commander Control Center</h2>
            <div className="flex items-center gap-2 text-xs opacity-60">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>CONNECTED AS: {(user?.email || 'COORDINATOR@OMNIGUARD.IO').toUpperCase()}</span>
              <span className="ml-2 border-l border-emerald-500/20 pl-2">UPTIME: 142:09:44</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setLockdownOpen(true)}
            className={`px-6 py-2 border flex items-center gap-2 font-bold text-xs tracking-tighter transition-all active:scale-95 ${
              isLocked ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'border-rose-500/50 text-rose-500 hover:bg-rose-500/10'
            }`}
          >
            <Power size={16} />
            {isLocked ? 'ABORT LOCKDOWN' : 'INITIATE LOCKDOWN'}
          </button>
          <button className="px-6 py-2 border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 font-bold text-xs tracking-tighter active:scale-95 transition-all">
            <Radio size={16} className="inline mr-2" />
            MASS BROADCAST
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Stats & Log */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-[#0f172a] border border-emerald-500/10 p-4 rounded">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">Network Load</span>
               <span className="text-xs">74%</span>
            </div>
            <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
               <motion.div initial={{width: 0}} animate={{width: '74%'}} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></motion.div>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-emerald-500/10 p-4 rounded flex-1">
             <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
                <Activity size={12} />
                Live Terminal Log
             </div>
             <div className="text-[10px] space-y-2 overflow-y-auto max-h-[300px]">
                {terminalLog.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-500/30">[{new Date().toLocaleTimeString()}]</span>
                    <span className={log.includes('CRITICAL') ? 'text-rose-400' : ''}>{log}</span>
                  </div>
                ))}
                <motion.div animate={{opacity: [0, 1]}} transition={{repeat: Infinity, duration: 0.8}} className="w-2 h-3 bg-emerald-500 inline-block"></motion.div>
             </div>
          </div>
        </div>

        {/* Center Column: Incident Command Overview */}
        <div className="lg:col-span-6 space-y-6">
           <div className="bg-[#0f172a] border border-emerald-500/10 p-6 rounded relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rotate-45 translate-x-16 -translate-y-16"></div>
              <h3 className="font-bold flex items-center gap-3 border-b border-emerald-500/10 pb-4 mb-6">
                 <Shield className="text-emerald-400" size={20} />
                 INCIDENT COMMAND OVERVIEW
              </h3>
              
              <div className="space-y-4">
                 {responders.length === 0 ? (
                    <div className="p-8 text-center border border-emerald-500/5 bg-emerald-500/5">
                      <Radio size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-xs opacity-40 uppercase">No Active Dispatch Missions</p>
                    </div>
                 ) : (
                    responders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between border border-emerald-500/5 p-3 hover:bg-emerald-500/5 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                           <div className="font-mono text-[10px] text-emerald-500/40 bg-[#1e293b] px-1.5 py-0.5">{r.id}</div>
                           <div>
                              <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">{r.name}</p>
                              <p className="text-[10px] opacity-40 uppercase tracking-tighter">{r.location}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`text-[10px] font-bold ${['Active', 'En Route', 'On Scene'].includes(r.status) ? 'text-emerald-400' : 'text-amber-400'}`}>{r.status.toUpperCase()}</div>
                           <div className="w-24 h-1 bg-[#1e293b] rounded-full mt-1">
                              <div style={{width: `${r.load}%`}} className={`h-full ${r.load > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                           </div>
                        </div>
                      </div>
                    ))
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f172a] border border-emerald-500/10 p-4 rounded text-center">
                 <Globe size={24} className="mx-auto mb-2 opacity-40" />
                 <p className="text-[10px] opacity-40 uppercase">Satellite Link</p>
                 <p className="text-sm font-bold">SECURE_CHANNEL_Alpha_9</p>
              </div>
              <div className="bg-[#0f172a] border border-emerald-500/10 p-4 rounded text-center">
                 <Lock size={24} className="mx-auto mb-2 opacity-40 text-rose-500" />
                 <p className="text-[10px] opacity-40 uppercase">E-Encryption</p>
                 <p className="text-sm font-bold">ACTIVE / 4096-BIT</p>
              </div>
           </div>
        </div>

        {/* Right Column: Operator Access Codes */}
        <div className="lg:col-span-3">
           <div className="bg-[#0f172a] border border-emerald-500/10 p-6 rounded h-full flex flex-col">
              <h3 className="font-bold flex items-center gap-3 border-b border-emerald-500/10 pb-4 mb-6">
                 <Key className="text-emerald-400" size={20} />
                 OPERATOR ACCESS
              </h3>
              <div className="space-y-6 flex-1">
                 {accessCodes.map((ac) => (
                   <div key={ac.id} className="border-b border-emerald-500/5 pb-4 last:border-0 relative group">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-bold text-emerald-500/40">{ac.id}</span>
                         <span className={`text-[8px] font-bold px-1 rounded ${
                           ac.status === 'Active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                         }`}>{ac.status.toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-bold text-white">{ac.operator}</p>
                      <p className="text-[10px] opacity-40">LVL {ac.level} • {ac.code}</p>
                   </div>
                 ))}
              </div>
              <button className="mt-6 w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs hover:bg-emerald-500/20 transition-all uppercase tracking-widest">
                 Generate Tokens
              </button>
           </div>
        </div>
      </div>

      {/* Lockdown Confirmation Modal */}
      <AnimatePresence>
        {lockdownOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-[#0f172a] border-2 border-rose-500 p-8 shadow-[0_0_50px_rgba(244,63,94,0.3)] text-center"
            >
              <ShieldAlert className="text-rose-500 mx-auto mb-6" size={64} />
              <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">CRITICAL AUTHORIZATION</h4>
              <p className="text-rose-300 text-sm mb-8 leading-relaxed">
                You are about to initiate a **System-Wide Lockdown**. All active credentials will be suspended and all peripheral nodes will disconnect. This action requires Commander Level Override.
              </p>
              
              <div className="flex flex-col gap-3">
                 <button 
                  onClick={toggleLockdown}
                  className="w-full py-4 bg-rose-500 text-white font-black text-lg tracking-widest hover:bg-rose-600 transition-colors uppercase"
                 >
                   Confirm Override
                 </button>
                 <button 
                  onClick={() => setLockdownOpen(false)}
                  className="w-full py-3 bg-transparent border border-emerald-500/20 text-emerald-500/60 font-bold text-sm tracking-widest hover:bg-emerald-500/5 transition-colors uppercase"
                 >
                   Aborted Initiation
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
