import React, { useState } from 'react';
import { DotMatrixText } from './DotMatrixText';
import { Terminal, Shield, ArrowRight, Radio } from 'lucide-react';
import { login } from '../utils/api';

interface LoginPageProps {
  onLogin: (userName: string) => void;
  theme: 'dark' | 'light';
}

export function LoginPage({ onLogin, theme }: LoginPageProps) {
  const [userName, setUserName] = useState('scottcui');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('DJs need a broadcast username.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Security token required for uplink.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(userName.trim(), password);
      onLogin(userName.trim());
    } catch (err) {
      setErrorMsg((err as Error).message || 'Uplink failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-mono flex flex-col justify-between p-6 transition-all duration-300 ${
      isDark 
        ? 'bg-[#050811] text-[#3fb950] border-[#3fb950]' 
        : 'bg-[#faf8ff] text-[#6b46c1] border-[#6b46c1]'
    }`}>
      {/* Top visual bar resembling terminal status */}
      <div className="flex justify-between items-center text-xs opacity-60 uppercase pt-2">
        <span className="flex items-center gap-1.5 animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          CONNECTION: STANDBY // CLAUDIO.FM
        </span>
        <span>SYS TIME: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto space-y-8 p-8 border rounded-lg bg-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden"
           style={{ borderColor: isDark ? 'rgba(63, 185, 80, 0.25)' : 'rgba(107, 70, 193, 0.2)' }}>
        
        {/* Decorative background grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
               backgroundImage: `radial-gradient(${isDark ? '#3fb950' : '#6b46c1'} 1px, transparent 1px)`, 
               backgroundSize: '16px 16px' 
             }} 
        />

        {/* Brand Display Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center select-none overflow-x-hidden">
            <DotMatrixText 
              text="Claudio" 
              dotSizePx={5} 
              gapPx={1.5} 
              activeColorClass={isDark ? 'bg-[#3fb950] shadow-[0_0_8px_#3fb950]' : 'bg-[#6b46c1] shadow-[0_0_8px_#6b46c1]'}
              inactiveColorClass={isDark ? 'bg-white/5' : 'bg-[#6b46c1]/5'}
            />
          </div>
          <p className="text-xs tracking-wider opacity-60 uppercase">
            Your Private AI DJ Broadcast Module
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 block">
              Operator Username
            </span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs opacity-50">&gt;</span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="scottcui4"
                className={`w-full font-mono text-sm px-8 py-2.5 border outline-none rounded-sm transition-all ${
                  isDark
                    ? 'bg-black/80 border-[#3fb950]/30 text-white focus:border-[#3fb950] focus:shadow-[0_0_10px_rgba(63,185,80,0.15)]'
                    : 'bg-white/90 border-[#6b46c1]/30 text-slate-800 placeholder:text-slate-400 focus:border-[#6b46c1] focus:shadow-[0_0_10px_rgba(107,70,193,0.1)]'
                }`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 block">
              Security Token (Password)
            </span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs opacity-50">*</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full font-mono text-sm px-8 py-2.5 border outline-none rounded-sm transition-all ${
                  isDark
                    ? 'bg-black/80 border-[#3fb950]/30 text-white focus:border-[#3fb950] focus:shadow-[0_0_10px_rgba(63,185,80,0.15)]'
                    : 'bg-white/90 border-[#6b46c1]/30 text-slate-800 placeholder:text-slate-400 focus:border-[#6b46c1] focus:shadow-[0_0_10px_rgba(107,70,193,0.1)]'
                }`}
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-red-500 uppercase tracking-tighter animate-pulse">
              [ERROR] {errorMsg}
            </p>
          )}

          {/* Secure connect buttons conforming to retro terminal */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-xs font-bold uppercase tracking-widest active:scale-[0.99] transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer ${
              loading ? 'opacity-50 cursor-wait' : ''
            } ${
              isDark
                ? 'bg-[#3fb950] text-black hover:bg-white hover:text-black hover:shadow-[0_0_15px_#3fb950]'
                : 'bg-[#6b46c1] text-white hover:bg-slate-900 hover:text-white hover:shadow-[0_0_15px_#6b46c1]'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            {loading ? 'Connecting...' : 'Establish AI Uplink'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info inside card */}
        <div className="border-t pt-4 text-[9px] opacity-40 font-mono flex items-center justify-between uppercase"
             style={{ borderColor: isDark ? 'rgba(63, 185, 80, 0.15)' : 'rgba(107, 70, 193, 0.1)' }}>
          <span>SSL 256 Encryption active</span>
          <span>Build: stable-v2.0</span>
        </div>
      </div>

      {/* Outer Page Footer */}
      <footer className="text-center text-[10px] opacity-40 uppercase pt-4 shrink-0">
        Claudio FM Broadcast Service © 2026. Handcrafted for pristine audio delivery.
      </footer>
    </div>
  );
}
