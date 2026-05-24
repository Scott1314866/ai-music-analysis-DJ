import React, { useState } from 'react';
import { DotMatrixText } from './DotMatrixText';
import { Radio, Sparkles, Award, Heart, CheckCircle2, Flame, Disc, Globe, Edit3, Camera, X, ArrowRight } from 'lucide-react';

interface ProfilePageProps {
  userName: string;
  theme: 'dark' | 'light';
  favoritesCount: number;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
}

export function ProfilePage({ userName, theme, favoritesCount, avatarUrl, onAvatarChange }: ProfilePageProps) {
  const isDark = theme === 'dark';
  const accentColor = isDark ? '#3fb950' : '#6b46c1';

  const [avatarEditing, setAvatarEditing] = useState(false);
  const [avatarInput, setAvatarInput] = useState(avatarUrl);

  const handleAvatarSave = () => {
    const trimmed = avatarInput.trim();
    onAvatarChange(trimmed);
    setAvatarEditing(false);
  };

  const handleAvatarCancel = () => {
    setAvatarInput(avatarUrl);
    setAvatarEditing(false);
  };

  const defaultAvatar = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&auto=format&fit=crop&q=80";

  // Specific genre tags requested in mockup
  const genres = [
    'JAZZ-HIPHOP',
    'NEO-CLASSICAL',
    '90S CHINESE',
    'HIP-HOP',
    'J-ROCK',
    'POST-PUNK',
    'SHIBUYA-KEI',
    'AMBIENT INDIE'
  ];

  return (
    <div className="max-w-xl mx-auto w-full pb-16 font-mono">
      <div className={`border rounded-lg p-8 relative overflow-hidden transition-all duration-300 shadow-2xl ${
        isDark 
          ? 'bg-[#050914] border-[#3fb950]/20 text-white' 
          : 'bg-[#faf8ff] border-[#6b46c1]/15 text-slate-800'
      }`}
           style={{
             backgroundImage: isDark
               ? 'radial-gradient(rgba(63, 185, 80, 0.04) 1px, transparent 1px)'
               : 'radial-gradient(rgba(107, 70, 193, 0.04) 1px, transparent 1px)',
             backgroundSize: '16px 16px'
           }}>

        {/* Top visual retro ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#3fb950] to-transparent opacity-50" 
             style={{ backgroundImage: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
        />

        {/* Profile Card Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          
          {/* Circular cool Cat Avatar */}
          <div className="relative">
            <div className={`w-32 h-32 rounded-full overflow-hidden p-1 bg-gradient-to-b border-2 relative group ${
              isDark ? 'from-[#3fb950] to-[#050914] border-white/15' : 'from-[#6b46c1] to-[#faf8ff] border-[#6b46c1]/20'
            }`}>
              <img
                src={avatarUrl || defaultAvatar}
                alt="Claudio the Cyber Cat DJ"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
              {/* Edit overlay on hover */}
              <button
                onClick={() => {
                  setAvatarInput(avatarUrl);
                  setAvatarEditing(true);
                }}
                className={`absolute inset-0 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  avatarEditing ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
                } bg-black/70`}
                title="Change Avatar URL"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Glowing ONLINE indicator flag */}
            <div className="absolute bottom-1 right-2 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
          </div>

          {/* Avatar URL editor panel — terminal style */}
          {avatarEditing && (
            <div className={`w-full max-w-xs p-4 border rounded-sm text-left space-y-3 animate-in fade-in ${
              isDark ? 'bg-black/60 border-[#3fb950]/30' : 'bg-white/90 border-[#6b46c1]/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3" />
                  Avatar Image URL
                </span>
                <button
                  onClick={handleAvatarCancel}
                  className={`p-0.5 rounded-sm transition-all cursor-pointer ${
                    isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs opacity-40">&gt;</span>
                <input
                  type="url"
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAvatarSave(); }}
                  placeholder="https://example.com/avatar.jpg"
                  autoFocus
                  className={`w-full font-mono text-xs px-7 py-2 border outline-none rounded-sm transition-all ${
                    isDark
                      ? 'bg-black/80 border-[#3fb950]/30 text-white placeholder:text-white/20 focus:border-[#3fb950] focus:shadow-[0_0_8px_rgba(63,185,80,0.12)]'
                      : 'bg-white border-[#6b46c1]/30 text-slate-800 placeholder:text-slate-300 focus:border-[#6b46c1] focus:shadow-[0_0_8px_rgba(107,70,193,0.08)]'
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAvatarSave}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-[#3fb950] text-black hover:shadow-[0_0_10px_#3fb950]'
                      : 'bg-[#6b46c1] text-white hover:shadow-[0_0_10px_#6b46c1]'
                  }`}
                >
                  <ArrowRight className="w-3 h-3" />
                  Apply Avatar
                </button>
                <button
                  onClick={() => {
                    onAvatarChange('');
                    setAvatarInput('');
                    setAvatarEditing(false);
                  }}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all cursor-pointer ${
                    isDark ? 'border-white/10 text-white/50 hover:text-white hover:border-white/30' : 'border-[#6b46c1]/15 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Reset
                </button>
              </div>

              <p className="text-[8px] opacity-35 uppercase tracking-wider">
                Paste any image URL. JPEG, PNG, WebP supported. Leave empty for default cat avatar.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-center select-none py-1">
              <DotMatrixText 
                text="Claudio" 
                dotSizePx={5} 
                gapPx={1.5}
                activeColorClass={isDark ? 'bg-[#3fb950] shadow-[0_0_8px_#3fb950]' : 'bg-[#6b46c1] shadow-[0_0_8px_#6b46c1]'}
                inactiveColorClass={isDark ? 'bg-white/5' : 'bg-[#6b46c1]/5'}
              />
            </div>
            
            {/* Dynamic tagline replacing static string */}
            <h3 className="text-xs uppercase font-bold tracking-widest mt-2" style={{ color: accentColor }}>
              {userName}'s Private DJ
            </h3>
          </div>

          {/* Biography Block */}
          <p className={`text-xs max-w-sm italic border-y py-3 ${
            isDark ? 'text-white/75 border-white/5' : 'text-slate-600 border-slate-200'
          }`}>
            "Your mood is my prompt. I hate algorithm. I have taste."
          </p>

          {/* Stats Bar Grid (ON AIR, GENRES, LISTENER) */}
          <div className="grid grid-cols-3 gap-4 w-full pt-4 text-center">
            <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
              <span className="text-[9px] uppercase font-mono opacity-40 block tracking-wider">
                BROADCAST
              </span>
              <span className="text-sm font-black text-white block mt-1 flex items-center justify-center gap-1">
                <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                24/7
              </span>
            </div>
            
            <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
              <span className="text-[9px] uppercase font-mono opacity-40 block tracking-wider">
                GENRES
              </span>
              <span className="text-sm font-black text-white block mt-1 flex items-center justify-center gap-1">
                <Disc className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                ∞
              </span>
            </div>

            <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
              <span className="text-[9px] uppercase font-mono opacity-40 block tracking-wider">
                LISTENERS
              </span>
              <span className="text-sm font-black text-white block mt-1 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                01
              </span>
            </div>
          </div>

          {/* Genre chips layout */}
          <div className="w-full text-left space-y-2.5 pt-4">
            <span className="text-[10px] text-white/40 block font-bold tracking-widest uppercase">
              Curated Genreflow Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 text-[9px] font-mono rounded-sm border border-white/5 bg-black/50 text-white/70 hover:text-white transition-all cursor-crosshair"
                >
                  #{g}
                </span>
              ))}
            </div>
          </div>

          {/* Curated Playlist numbers & Favorite highlights */}
          <div className={`w-full p-4 border rounded text-left flex items-center gap-3 ${
            isDark ? 'bg-black/30 border-white/5 text-white/80' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Award className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
            <div className="text-xs">
              <p className="font-bold">3,000+ Curated Cross-Platform Playlists</p>
              <p className="opacity-50 mt-0.5">Custom tuned frequencies, offline state cache, with {favoritesCount} favorited songs.</p>
            </div>
          </div>

          {/* System diagnostics log at bottom */}
          <div className="w-full text-left text-[9px] opacity-30 space-y-1 font-mono pt-2">
            <p className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              CONNECTED STATE: UPLINK ESTABLISHED
            </p>
            <p className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              BROADCAST SERVER: LOCAL NODE ON AIR
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
