import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Phone, Flame, Activity, AlertTriangle, ChevronRight, Lock, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { login } from '../services/api';

const emergencyNumbers = [
  { label: 'Police', number: '100', color: 'btn-police' },
  { label: 'Ambulance', number: '108', color: 'btn-ambulance' },
  { label: 'Fire', number: '101', color: 'btn-fire' },
  { label: 'Disaster', number: '1078', color: 'btn-disaster' },
];

const reportTypes = [
  { 
    icon: Flame, 
    label: 'Fire', 
    color: 'bg-white border-slate-200 text-rose-600 shadow-sm hover:border-rose-500 dark:bg-slate-800/40 dark:border-rose-500/20 dark:text-rose-400 dark:hover:border-rose-500 dark:hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
  },
  { 
    icon: Activity, 
    label: 'Medical', 
    color: 'bg-white border-slate-200 text-emerald-600 shadow-sm hover:border-emerald-500 dark:bg-slate-800/40 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:border-emerald-500 dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
  },
  { 
    icon: ShieldAlert, 
    label: 'Crime / Duress', 
    color: 'bg-white border-slate-200 text-blue-600 shadow-sm hover:border-blue-500 dark:bg-slate-800/40 dark:border-blue-500/20 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
  },
  { 
    icon: AlertTriangle, 
    label: 'Natural Disaster', 
    color: 'bg-white border-slate-200 text-amber-600 shadow-sm hover:border-amber-500 dark:bg-slate-800/40 dark:border-amber-500/20 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
  },
];

export default function CivilianPortal({ onLogin }) {
  const navigate = useNavigate();
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const authData = await login(email, password);
      const userData = {
        ...authData.user,
        assignedTeam: authData.user.assignedTeam || authData.user.team,
        token: authData.accessToken,
        isAuthenticated: true,
      };
      if (userData.role) userData.role = userData.role.toLowerCase();
      onLogin(userData);
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen civilian-bg font-sans">
      {/* Header */}
      <header className="bg-brand-bg-end/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <span className="font-black text-brand-text text-lg tracking-tight">OMNIGUARD</span>
            <p className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest leading-none">Public Safety Network</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setShowStaffLogin(!showStaffLogin)}
            className="flex items-center gap-2 text-xs font-bold text-brand-muted hover:text-brand-text transition-colors uppercase tracking-wider"
          >
            <Lock size={14} />
            Staff Login
          </button>
        </div>
      </header>

      {/* Staff Login Dropdown */}
      {showStaffLogin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-bg-start text-brand-text p-6 border-b border-white/10"
        >
          <form onSubmit={handleStaffLogin} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-brand-muted font-bold uppercase tracking-widest">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@omniguard.io"
                className="w-full bg-brand-bg-end border border-white/10 rounded-xl px-4 py-3 text-sm text-brand-text outline-none focus:border-emerald-500 transition-colors placeholder:text-brand-muted/50"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-brand-muted font-bold uppercase tracking-widest">Access Code</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-bg-end border border-white/10 rounded-xl px-4 py-3 text-sm text-brand-text outline-none focus:border-emerald-500 transition-colors placeholder:text-brand-muted/50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-500 text-slate-900 font-black text-sm rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
            >
              {isLoading ? 'Verifying...' : 'Authenticate →'}
            </button>
          </form>
          {loginError && (
            <p className="text-rose-400 text-xs text-center mt-3 font-bold">{loginError}</p>
          )}
        </motion.div>
      )}

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-brand-card border border-[#10b981] text-[#10b981] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_10px_rgba(16,185,129,0.3)] relative z-10">
            <div className="w-2 h-2 bg-[#10b981] rounded-full radar-pulse" />
            Emergency Response Network — Active
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-brand-text tracking-tight mb-6 leading-none relative z-10">
            Report an Emergency.<br />
            <span className="text-emerald-500">Get Help Fast.</span>
          </h1>
          <p className="text-xl text-brand-muted font-medium max-w-2xl mx-auto leading-relaxed relative z-10">
            OmniGuard connects you directly to the nearest tactical response unit. Your report is automatically triaged and dispatched in seconds.
          </p>
        </motion.div>

        {/* Emergency Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 md:mb-12"
        >
          {emergencyNumbers.map((e) => (
            <a
              key={e.label}
              href={`tel:${e.number}`}
              className={`emergency-btn ${e.color} p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 shadow-lg`}
            >
              <Phone className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
              <span className="font-black text-xl md:text-2xl">{e.number}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{e.label}</span>
            </a>
          ))}
        </motion.div>

        {/* Report CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-card backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 md:p-10 text-center mb-12 relative z-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-rose-500 rounded-3xl shadow-2xl shadow-rose-500/30 mb-6">
            <ShieldAlert className="text-white w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight mb-4">
            Report an Emergency Now
          </h2>
          <p className="text-brand-muted text-sm md:text-base font-medium max-w-lg mx-auto mb-8 leading-relaxed">
            Use our guided 3-step form to report fire, medical emergencies, crimes, or natural disasters. No login required.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            {reportTypes.map((t) => (
              <button
                key={t.label}
                onClick={() => navigate(`/report?type=${encodeURIComponent(t.label)}`)}
                className={`p-3 md:p-4 rounded-2xl flex flex-col items-center gap-2 ${t.color} border cursor-pointer hover:scale-105 transition-all duration-300 ease-out active:scale-95`}
              >
                <t.icon className="w-6 h-6 md:w-7 md:h-7" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/report')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-rose-500 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-95"
          >
            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />
            Report Emergency
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </motion.div>

        {/* Info Footer */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-brand-muted text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-500" />
            <span>AI-Powered Triage</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-500" />
            <span>Encrypted & Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" />
            <span>24/7 Active Coverage</span>
          </div>
        </div>
      </main>
    </div>
  );
}
