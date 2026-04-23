import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Phone, Flame, Activity, AlertTriangle, ChevronRight, Lock, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const emergencyNumbers = [
  { label: 'Police', number: '100', color: 'bg-blue-500/15 hover:bg-blue-500/25 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { label: 'Ambulance', number: '108', color: 'bg-emerald-500/15 hover:bg-emerald-500/25 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]' },
  { label: 'Fire', number: '101', color: 'bg-rose-500/15 hover:bg-rose-500/25 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]' },
  { label: 'Disaster', number: '1078', color: 'bg-amber-500/15 hover:bg-amber-500/25 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]' },
];

const reportTypes = [
  { icon: Flame, label: 'Fire', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
  { icon: Activity, label: 'Medical', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
  { icon: ShieldAlert, label: 'Crime / Duress', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
  { icon: AlertTriangle, label: 'Natural Disaster', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
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
    <div className="min-h-screen bg-transparent font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b-0 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Shield size={22} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
          </div>
          <div>
            <span className="font-black text-white text-lg tracking-tight">OMNIGUARD</span>
            <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest leading-none">Public Safety Network</p>
          </div>
        </div>
        <button
          onClick={() => setShowStaffLogin(!showStaffLogin)}
          className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors uppercase tracking-wider"
        >
          <Lock size={14} />
          Staff Login
        </button>
      </header>

      {/* Staff Login Dropdown */}
      {showStaffLogin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 backdrop-blur-xl text-white p-6 border-b border-white/10"
        >
          <form onSubmit={handleStaffLogin} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@omniguard.io"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Access Code</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-500 text-slate-900 font-black text-sm rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-[0_0_15px_rgba(16,185,129,0.3)]"
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
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
            Emergency Response Network — Active
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-none">
            Report an Emergency.<br />
            <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Get Help Fast.</span>
          </h1>
          <p className="text-xl text-[#94A3B8] font-medium max-w-2xl mx-auto leading-relaxed">
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
              className={`group text-white p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] backdrop-blur-[16px] border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_1px_1px_0_rgba(255,255,255,0.2)] ${e.color}`}
            >
              <Phone className="w-5 h-5 md:w-6 md:h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" fill="currentColor" />
              <span className="font-black text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{e.number}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{e.label}</span>
            </a>
          ))}
        </motion.div>

        {/* Report CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel !rounded-3xl p-6 md:p-10 text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-rose-500/20 border border-rose-500/30 rounded-3xl shadow-[0_0_20px_rgba(244,63,94,0.3)] mb-6">
            <ShieldAlert className="text-rose-400 w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-4">
            Report an Emergency Now
          </h2>
          <p className="text-[#94A3B8] text-sm md:text-base font-medium max-w-lg mx-auto mb-8 leading-relaxed">
            Use our guided 3-step form to report fire, medical emergencies, crimes, or natural disasters. No login required.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            {reportTypes.map((t) => (
              <button
                key={t.label}
                onClick={() => navigate(`/report?type=${encodeURIComponent(t.label)}`)}
                className={`p-3 md:p-4 rounded-2xl flex flex-col items-center gap-2 backdrop-blur-sm border cursor-pointer transition-all duration-300 active:scale-95 hover:-translate-y-1 ${t.color}`}
              >
                <t.icon className="w-6 h-6 md:w-7 md:h-7 drop-shadow-[0_0_5px_currentColor]" />
                <span className="text-[10px] md:text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/report')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-rose-500 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:bg-rose-400 transition-all active:scale-95"
          >
            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />
            Report Emergency
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </motion.div>

        {/* Info Footer */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-[#94A3B8] text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span>AI-Powered Triage</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span>Encrypted & Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span>24/7 Active Coverage</span>
          </div>
        </div>
      </main>
    </div>
  );
}
