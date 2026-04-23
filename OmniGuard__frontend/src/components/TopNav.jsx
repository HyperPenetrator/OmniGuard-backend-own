import React, { useState } from 'react'
import { Bell, Search, User, Zap, Wifi, Clock, ShieldCheck, Menu, X, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TopNav({ user, toggleSidebar, onQuickSOS, incidents = [] }) {
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Derive notifications from incidents
  const notifications = incidents
    .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0))
    .slice(0, 5)
    .map(inc => ({
      id: inc.id,
      title: inc.status === 'Reported' ? 'New Incident' : `Update: ${inc.status}`,
      message: `${inc.type} at ${typeof inc.location === 'string' ? inc.location : (inc.location?.sector || 'Unknown Location')}`,
      type: ['Critical', 'High'].includes(inc.severity) ? 'alert' : 'info',
      time: inc.createdAt ? new Date(inc.createdAt._seconds * 1000).toLocaleTimeString() : 'Recently'
    }));

  return (
    <header className="h-20 glass-panel !rounded-none !border-x-0 !border-t-0 flex items-center justify-between px-4 md:px-8 z-50 sticky top-0">
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#F8FAFC]"
        >
          <Menu size={24} />
        </button>

        <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <Search size={16} className="text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search tactical database..." 
            className="bg-transparent border-none text-xs focus:outline-none text-[#F8FAFC] placeholder:text-[#94A3B8] w-48"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">Network_Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">T-SYNC ACTIVE</span>
          </div>
        </div>

        <button 
          onClick={onQuickSOS}
          className="flex items-center gap-2 bg-rose-500 text-white p-2.5 md:px-5 md:py-2.5 rounded-full font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:bg-rose-600 transition-all active:scale-95"
        >
          <Zap size={18} fill="currentColor" />
          <span className="hidden md:inline">Quick SOS</span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 transition-colors group rounded-xl ${showNotifications ? 'bg-white/10 text-[#F8FAFC]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:animate-ping"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-[calc(100vw-2rem)] md:w-80 glass-panel overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-[#F8FAFC] text-sm">Notifications</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">Live</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-[#94A3B8]">
                        <p className="text-xs italic">No active tactical alerts</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/10 group">
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg h-fit ${n.type === 'alert' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                              {n.type === 'alert' ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#F8FAFC] text-xs truncate">{n.title}</p>
                              <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-[9px] text-[#94A3B8] font-mono mt-2 uppercase tracking-widest">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="w-full p-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest hover:bg-white/5 hover:text-[#F8FAFC] transition-colors">
                    Clear Tactical Feed
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-white/10 ml-1 md:ml-2">
          <div className="hidden sm:flex text-right flex-col items-end">
            <p className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">{user?.name || 'Operator ID'}</p>
            <p className="text-[9px] text-emerald-500 font-mono uppercase font-bold">{user?.role || 'Guest'} Access</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-500 transition-colors overflow-hidden">
             {user?.role === 'coordinator' ? <ShieldCheck className="text-emerald-500 w-5 md:w-6" /> : <User className="text-[#94A3B8] w-5 md:w-6" />}
          </div>
        </div>
      </div>
    </header>
  )
}
