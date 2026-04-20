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
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-50 sticky top-0">
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <Menu size={24} />
        </button>

        <div className="hidden md:flex items-center gap-4 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tactical database..." 
            className="bg-transparent border-none text-xs focus:outline-none text-slate-600 placeholder:text-slate-400 w-48"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-6 mr-6 border-r border-slate-100 pr-6">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Network_Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">T-SYNC ACTIVE</span>
          </div>
        </div>

        <button 
          onClick={onQuickSOS}
          className="flex items-center gap-2 bg-rose-500 text-white p-2.5 md:px-5 md:py-2.5 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
        >
          <Zap size={18} fill="currentColor" />
          <span className="hidden md:inline">Quick SOS</span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 transition-colors group rounded-xl ${showNotifications ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
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
                  className="absolute right-0 mt-4 w-[calc(100vw-2rem)] md:w-80 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">Live</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <p className="text-xs italic">No active tactical alerts</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 group">
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg h-fit ${n.type === 'alert' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                              {n.type === 'alert' ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-[9px] text-slate-300 font-mono mt-2 uppercase tracking-widest">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="w-full p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-colors">
                    Clear Tactical Feed
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-slate-100 ml-1 md:ml-2">
          <div className="hidden sm:flex text-right flex-col items-end">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">{user?.name || 'Operator ID'}</p>
            <p className="text-[9px] text-emerald-500 font-mono uppercase font-bold">{user?.role || 'Guest'} Access</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:border-emerald-500 transition-colors overflow-hidden">
             {user?.role === 'coordinator' ? <ShieldCheck className="text-emerald-500" size={18} className="md:size-24" /> : <User className="text-slate-400" size={18} className="md:size-24" />}
          </div>
        </div>
      </div>
    </header>
  )
}
