import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Phone, Flame, Activity, AlertTriangle, ChevronRight, Lock, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { login } from '../services/api';

const emergencyNumbers = [
  { label: 'POLICE', number: '100', color: 'bg-[#1b5eff]' },
  { label: 'AMBULANCE', number: '108', color: 'bg-[#00a368]' },
  { label: 'FIRE', number: '101', color: 'bg-[#f4003d]' },
  { label: 'DISASTER', number: '1078', color: 'bg-[#ef8300]' },
];

const reportTypes = [
  { 
    icon: Flame, 
    label: 'FIRE', 
    color: 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' 
  },
  { 
    icon: Activity, 
    label: 'MEDICAL', 
    color: 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
  },
  { 
    icon: Shield, 
    label: 'CRIME / DURESS', 
    color: 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' 
  },
  { 
    icon: AlertTriangle, 
    label: 'NATURAL DISASTER', 
    color: 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' 
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
    <div className="min-h-screen bg-white dark:bg-brand-bg-end font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-brand-bg-end/80 backdrop-blur-md border-b border-slate-100 dark:border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <span className="font-black text-slate-900 dark:text-brand-text text-lg tracking-tight uppercase">OMNIGUARD</span>
            <p className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest leading-none">Public Safety Network</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setShowStaffLogin(!showStaffLogin)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-brand-muted hover:text-emerald-600 dark:hover:text-brand-text transition-colors uppercase tracking-wider"
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
          className="bg-white dark:bg-brand-bg-start text-brand-text p-6 border-b border-slate-100 dark:border-white/10 shadow-xl"
        >
          <form onSubmit={handleStaffLogin} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs text-slate-400 dark:text-brand-muted font-bold uppercase tracking-widest">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@omniguard.io"
                className="w-full bg-slate-50 dark:bg-brand-bg-end border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-brand-text outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs text-slate-400 dark:text-brand-muted font-bold uppercase tracking-widest">Access Code</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-brand-bg-end border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-brand-text outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white font-black text-sm rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? 'Verifying...' : 'Authenticate →'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#2d3436] dark:text-brand-text tracking-tight mb-4">
            Emergency.<br />
            <span className="text-[#00b894]">Get Help Fast.</span>
          </h1>
          <p className="text-slate-500 dark:text-brand-muted text-base font-medium max-w-xl mx-auto leading-relaxed">
            OmniGuard connects you directly to the nearest tactical response unit. Your report is automatically triaged and dispatched in seconds.
          </p>
        </motion.div>

        {/* Big Emergency Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-16"
        >
          {emergencyNumbers.map((e) => (
            <a
              key={e.label}
              href={`tel:${e.number}`}
              className={`${e.color} p-6 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 shadow-xl transition-transform hover:scale-[1.02]`}
            >
              <Phone className="w-6 h-6 text-white" fill="white" />
              <span className="font-black text-2xl text-white tracking-wider">{e.number}</span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{e.label}</span>
            </a>
          ))}
        </motion.div>

        {/* Report CTA Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-brand-card/50 backdrop-blur-xl rounded-[40px] border border-slate-100 dark:border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.08)] dark:shadow-2xl p-8 md:p-12 text-center relative z-10 mb-20"
        >
          {/* Floating Icon */}
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-[#ff3b6b] rounded-3xl shadow-xl shadow-rose-500/20 mb-8">
            <Shield className="text-white w-10 h-10" strokeWidth={2.5} />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-brand-text tracking-tight mb-4">
            Report an Emergency Now
          </h2>
          <p className="text-slate-500 dark:text-brand-muted text-sm md:text-base font-medium max-w-lg mx-auto mb-10 leading-relaxed">
            Use our guided 3-step form to report fire, medical emergencies, crimes, or natural disasters. No login required.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            {reportTypes.map((t) => (
              <button
                key={t.label}
                onClick={() => navigate(`/report?type=${encodeURIComponent(t.label)}`)}
                className={`p-5 rounded-[24px] flex flex-col items-center gap-3 ${t.color} border border-transparent transition-all duration-300 hover:shadow-md active:scale-95`}
              >
                <t.icon className="w-7 h-7" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/report')}
            className="w-full group inline-flex items-center justify-between bg-[#ff3b6b] text-white px-8 py-5 rounded-[24px] font-black text-lg shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Shield size={24} />
              <span>Report Emergency</span>
            </div>
            <ChevronRight className="w-6 h-6" />
          </button>
        </motion.div>

        {/* Info Footer */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-slate-400 dark:text-brand-muted text-xs font-bold uppercase tracking-widest pb-12">
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
