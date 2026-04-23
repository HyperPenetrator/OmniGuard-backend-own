import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShieldAlert, LogOut, Activity, Zap, MapPin, User, Terminal, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const menuItems = {
  civilian: [
    { id: 'sos', icon: Zap, label: 'Emergency SOS', path: '/sos' },
    { id: 'status', icon: Activity, label: 'Status Tracking', path: '/status' },
    { id: 'profile', icon: User, label: 'Civilian ID', path: '/profile' },
  ],
  responder: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Unit Dashboard', path: '/' },
    { id: 'incidents', icon: ShieldAlert, label: 'Task List', path: '/incidents' },
    { id: 'maps', icon: MapPin, label: 'Navigation Map', path: '/maps' },
    { id: 'profile', icon: User, label: 'Responder ID', path: '/profile' },
  ],
  coordinator: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Admin Panel', path: '/dashboard' },
    { id: 'command', icon: Terminal, label: 'Command Terminal', path: '/coordinator' },
    { id: 'maps', icon: MapPin, label: 'Tactical Map', path: '/maps' },
    { id: 'alerts', icon: ShieldAlert, label: 'Threat Center', path: '/alerts' },
    { id: 'profile', icon: User, label: 'Admin ID', path: '/profile' },
  ]
}

export default function Sidebar({ user, onLogout, isOpen, setIsOpen }) {
  const role = user?.role || 'civilian';
  const items = menuItems[role] || menuItems.civilian;
  const roleLabel = role === 'coordinator' ? 'ADMIN' : role;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full glass-panel !rounded-none !border-y-0 !border-l-0 border-r border-brand-border flex flex-col z-[100] transition-all duration-300 ease-in-out shadow-2xl overflow-hidden",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className={cn(
          "p-6 flex flex-col items-center border-b border-brand-border transition-all duration-300",
          !isOpen && "lg:p-4 lg:items-center"
        )}>
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-emerald-500/10 blur-lg rounded-full" />
            <ShieldCheck className="w-8 h-8 text-emerald-500 relative z-10" />
          </div>
          <div className={cn(
            "text-center transition-opacity duration-300",
            !isOpen && "lg:opacity-0 lg:h-0 overflow-hidden"
          )}>
            <h1 className="font-bold text-base tracking-[0.2em] text-brand-text uppercase">OMNIGUARD</h1>
            <p className="text-[8px] text-brand-accent font-mono tracking-[0.4em] uppercase mt-1">Operational {roleLabel}</p>
          </div>

        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
          <p className={cn(
            "text-[10px] font-bold text-brand-text-muted uppercase tracking-widest px-4 mb-2 transition-opacity duration-300",
            !isOpen && "lg:opacity-0 lg:h-0 overflow-hidden"
          )}>
            Main Terminal
          </p>
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) setIsOpen(false)
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                  : "text-brand-text-muted hover:text-brand-text hover:bg-white/5",
                !isOpen && "lg:justify-center lg:px-0"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                    />
                  )}
                  <item.icon size={18} className={cn(
                    "transition-transform duration-300 group-hover:scale-110 shrink-0",
                    isActive ? "text-emerald-400" : "text-[#94A3B8] group-hover:text-emerald-400/70"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300",
                    !isOpen && "lg:hidden"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-brand-bg-end text-brand-text text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden lg:block border border-brand-border">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 space-y-4">
          {/* System Health Card */}
          <div className={cn(
            "bg-white/5 border border-white/10 p-4 rounded-xl transition-all duration-300",
            !isOpen && "lg:p-2 lg:flex lg:flex-col lg:items-center"
          )}>
            <div className={cn(
              "flex items-center justify-between mb-3",
              !isOpen && "lg:mb-0 lg:flex-col lg:gap-2"
            )}>
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-emerald-500" />
                <span className={cn(
                  "text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider",
                  !isOpen && "lg:hidden"
                )}>sys_health</span>
              </div>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className={cn(
              "space-y-2",
              !isOpen && "lg:hidden"
            )}>
              <div className="flex justify-between text-[8px] font-mono text-[#94A3B8] uppercase">
                <span>Encryption</span>
                <span>Active</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="w-[94%] h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full text-brand-text-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-xl transition-all duration-300 group",
              !isOpen && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut size={18} className={cn(
              "transition-transform",
              isOpen ? "group-hover:-translate-x-1" : "group-hover:scale-110"
            )} />
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300",
              !isOpen && "lg:hidden"
            )}>
              Terminate
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
