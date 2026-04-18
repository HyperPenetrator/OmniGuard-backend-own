import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ChevronRight, Activity, AlertCircle, Users } from 'lucide-react';
import { login } from '../services/api';

const MOCK_USERS = [
  { email: 'coordinator@omniguard.io', accessCode: 'omni2024!', role: 'coordinator', name: 'COMMAND ALPHA', rank: 'Commander' },
  { email: 'medic1@omniguard.io', accessCode: 'resp2024!', role: 'responder', name: 'UNIT M-1', team: 'Medical', unitId: 'MED-77', status: 'Available' },
  { email: 'fire_beta@omniguard.io', accessCode: 'resp2024!', role: 'responder', name: 'ENGINE 4', team: 'Fire', unitId: 'ENG-04', status: 'On Patrol' },
  { email: 'patrol99@omniguard.io', accessCode: 'resp2024!', role: 'responder', name: 'OFFICER 99', team: 'Police', unitId: 'POL-99', status: 'Available' },
  { email: 'tech_ops@omniguard.io', accessCode: 'resp2024!', role: 'responder', name: 'HAZMAT TEAM', team: 'Tech-Hazard', unitId: 'HAZ-01', clearance: 'Level 4' },
  { email: 'civilian@omniguard.io', accessCode: 'civ2024!', role: 'civilian', name: 'JANE DOE', location: 'Downtown', priority: 'Standard' },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const authData = await login(email, accessCode);
      // authData contains { accessToken, refreshToken, user: { id, name, email, role, nodeId } }
      
      const userData = {
        ...authData.user,
        token: authData.accessToken,
        isAuthenticated: true
      };

      // Ensure the role string matches what the frontend expects
      if (userData.role) {
        userData.role = userData.role.toLowerCase();
      }

      onLogin(userData);
    } catch (err) {
      setError(err.message || 'Invalid credentials or unauthorized access code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-3xl shadow-2xl shadow-emerald-500/20 mb-6 rotate-3">
            <Shield size={40} className="text-slate-900" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">OMNIGUARD</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">Advanced Crisis Management v2.2</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 opacity-50"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@omniguard.io"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Code</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-rose-400 text-xs font-bold bg-rose-400/10 p-4 rounded-xl border border-rose-400/20"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-500 text-slate-900 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <Activity className="animate-spin" size={20} />
              ) : (
                <>
                  AUTHENTICATE
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={14} className="text-emerald-500" /> Test Accounts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {MOCK_USERS.map((u, i) => (
                <div 
                  key={i} 
                  onClick={() => {setEmail(u.email); setAccessCode(u.accessCode);}} 
                  className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl cursor-pointer hover:bg-slate-800 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-200 truncate pr-2 group-hover:text-emerald-400 transition-colors">{u.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-mono">PWD: {u.accessCode}</span>
                    <span className={`text-[8px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full ${
                      u.role === 'coordinator' ? 'bg-blue-500/20 text-blue-400' 
                      : u.role === 'responder' ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  {u.team && <div className="text-[9px] text-slate-400 mt-2 font-mono bg-slate-900/50 inline-block px-2 py-1 rounded">Team: {u.team} | {u.unitId}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center gap-4">
            <p className="text-[10px] text-slate-600 font-mono text-center">
              SYSTEM ACCESS IS MONITORED. UNAUTHORIZED ATTEMPTS WILL BE TRACED.
            </p>
            <div className="flex gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all text-[8px] font-mono tracking-widest text-slate-500 uppercase">
              <span>Encrypted_Channel</span>
              <span>•</span>
              <span>AES-256</span>
              <span>•</span>
              <span>JWT_Auth</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
