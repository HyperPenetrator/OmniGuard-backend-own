import React, { useState } from 'react';
import { ShieldAlert, Loader2, AlertCircle, Lock, Mail } from 'lucide-react';
import { login } from '../services/api';

/**
 * OmniGuard Login Screen
 * Military-grade aesthetic matching the dashboard theme.
 */
export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success && result.data) {
        onLoginSuccess(result.data.user);
      } else {
        setError('Login failed. Check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-urgent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-urgent/10 border-2 border-urgent/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="text-urgent h-7 w-7" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase">
            Omni<span className="font-light text-slate-400">Guard</span>
          </h1>
          <p className="text-xs text-slate-500 tracking-[0.3em] uppercase mt-2 font-mono">
            Crisis Management System
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-charcoal border border-slate-700/50 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] mb-6 text-center">
            Secure Authentication
          </h2>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-urgent/10 border border-urgent/20 rounded-xl flex items-center gap-3 animate-pulse">
              <AlertCircle size={18} className="text-urgent flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
              Operator Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-[#0b1121] border border-slate-700 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                placeholder="operator@omniguard.io"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-8">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
              Access Code
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3.5 bg-[#0b1121] border border-slate-700 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-black rounded-xl transition flex items-center justify-center gap-3 tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50 outline-none"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              'AUTHENTICATE'
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-600 font-mono tracking-wider">
              ENCRYPTED_CHANNEL • AES-256 • JWT_AUTH
            </p>
          </div>
        </form>

        {/* Bottom tag */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-700 font-mono">
            OmniGuard v2.0 • Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
