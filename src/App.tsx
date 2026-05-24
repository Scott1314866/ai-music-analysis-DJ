import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, ChatMessage, Theme } from './types';
import { INITIAL_TRACKS } from './utils/musicData';
import { getEnglishMaleVoice } from './utils/speechHelper';
import { LoginPage } from './components/LoginPage';
import { PlayerPage } from './components/PlayerPage';
import { DjModePage } from './components/DjModePage';
import { ProfilePage } from './components/ProfilePage';
import { ParticleTrail } from './components/ParticleTrail';
import { Radio, Moon, Sun, UserCheck, LogOut, RadioTower } from 'lucide-react';
import { logout as apiLogout, fetchTracks } from './utils/api';

export default function App() {
  // Authentication & Identity State
  const [operator, setOperator] = useState<{ name: string; isLoggedIn: boolean }>({
    name: 'scottcui',
    isLoggedIn: false
  });

  // Theme & Navigation States
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeTab, setActiveTab] = useState<'player' | 'dj' | 'profile'>('player');

  // Music Player State Engine
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [favorites, setFavorites] = useState<string[]>(['track-1', 'track-5']);
  const [queueVisible, setQueueVisible] = useState(true);

  // Avatar / profile picture URL, persisted in localStorage
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('claudio-fm-avatar') || '';
    }
    return '';
  });

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('claudio-fm-avatar', url);
    }
  };

  // Chat message timelines starting with Claudio's signature broadcast intro
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-msg-claudio',
      sender: 'claudio',
      text: "This is Claudio. It's late on a Monday, and here's a song that moves with your breath. Back in 1971, David Gates picked up a nylon-string guitar and let every line end in a whisper—you'll feel yourself lift off the ground a little. This one's called If. After a long day with Claude Code, just breathe.",
      timestamp: '21:02',
      status: 'REPLAY'
    }
  ]);

  // Master timer to advance elapsed music time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            // Track finished, auto loop or advance
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // Handle changing tracking selection
  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleToggleFavorite = (trackId: string) => {
    setFavorites(prev => 
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handlePushMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
  };

  const handleLogin = (userName: string) => {
    setOperator({ name: userName, isLoggedIn: true });
  };

  const handleLogout = () => {
    apiLogout().catch(() => {});
    setOperator(prev => ({ ...prev, isLoggedIn: false }));
    setTracks(INITIAL_TRACKS);
    setCurrentTrack(INITIAL_TRACKS[0]);
  };

  // Load tracks from backend when logged in
  useEffect(() => {
    if (operator.isLoggedIn) {
      fetchTracks()
        .then((remoteTracks) => {
          if (remoteTracks.length > 0) {
            setTracks(remoteTracks);
            setCurrentTrack(remoteTracks[0]);
          }
        })
        .catch(() => {
          // Backend unavailable — keep using INITIAL_TRACKS from musicData
        });
    }
  }, [operator.isLoggedIn]);

  // Pre-load synthesis voices to keep speech response sharp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const isDark = theme === 'dark';
  const customAccentColor = isDark ? '#3fb950' : '#6b46c1';

  // If user is not logged in, force the secure login gate screen
  if (!operator.isLoggedIn) {
    return (
      <>
        <ParticleTrail theme={theme} />
        <LoginPage onLogin={handleLogin} theme={theme} />
      </>
    );
  }

  return (
    <div id="app-container" className={`min-h-screen flex flex-col font-mono select-none overflow-x-hidden antialiased transition-all duration-300 relative ${
      isDark 
        ? 'bg-[#030611] text-[#3fb950]' 
        : 'bg-[#faf8ff] text-[#6b46c1]'
    }`}>
      <ParticleTrail theme={theme} />
      
      {/* 1. MASTER HEADER SECTION */}
      <header className={`h-22 w-full flex items-center justify-between px-4 sm:px-8 border-b z-10 backdrop-blur-md shrink-0 transition-all ${
        isDark 
          ? 'border-white/10 bg-black/40 text-white' 
          : 'border-[#6b46c1]/10 bg-white/70 text-[#6b46c1]'
      }`}>
        <div className="flex items-center gap-3">
          
          {/* Brand Cat Logo Avatar */}
          <div className={`w-10 h-10 rounded-full overflow-hidden border ${
            isDark ? 'border-[#3fb950]' : 'border-[#6b46c1]'
          }`}>
            <img
              src={avatarUrl || "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop"}
              alt="Cat Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="font-black text-base tracking-widest uppercase leading-none">
              CLAUDIO FM
            </span>
            <span className="text-[9px] font-mono tracking-wider opacity-60 mt-0.5 uppercase">
              Operator: {operator.name}
            </span>
          </div>
        </div>

        {/* Action Header controls (LOGIN/LOGOUT status, DARK, LIGHT toggle) */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          
          {/* Login Gate switch (acting as LOGOUT back to LoginPage) */}
          <button
            onClick={handleLogout}
            className={`px-3 py-1.5 border rounded-sm text-[10px] tracking-wider font-bold uppercase transition-all flex items-center gap-1.5 hover:bg-white hover:text-black hover:invert cursor-pointer ${
              isDark ? 'border-white/15' : 'border-[#6b46c1]/20'
            }`}
            title="Disconnect current uplink"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="max-sm:hidden">LOGOUT</span>
          </button>

          {/* Theme selectors */}
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1.5 border rounded-sm text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              isDark 
                ? 'bg-[#3fb950] text-black border-[#3fb950] font-black' 
                : 'border-slate-200 text-slate-400 hover:text-slate-800'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span className="max-sm:hidden">DARK</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1.5 border rounded-sm text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              !isDark 
                ? 'bg-[#6b46c1] text-white border-[#6b46c1] font-black' 
                : 'border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span className="max-sm:hidden">LIGHT</span>
          </button>
        </div>
      </header>

      {/* 2. TAB CONTROLS NAVIGATION BAR */}
      <nav className={`py-4 px-4 sm:px-8 flex justify-center border-b transition-all ${
        isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-[#6b46c1]/5'
      }`}>
        <div className={`p-1 border rounded-md flex gap-1 ${
          isDark ? 'bg-black/55 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
              setActiveTab('player');
            }}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer ${
              activeTab === 'player'
                ? isDark ? 'bg-[#3fb950] text-black font-black' : 'bg-[#6b46c1] text-white font-black'
                : 'opacity-50 hover:opacity-100'
            }`}
          >
            PLAYER
          </button>
          
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
              setActiveTab('dj');
            }}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer ${
              activeTab === 'dj'
                ? isDark ? 'bg-[#3fb950] text-black font-black' : 'bg-[#6b46c1] text-white font-black'
                : 'opacity-50 hover:opacity-100'
            }`}
          >
            DJ MODE
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
              setActiveTab('profile');
            }}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer ${
              activeTab === 'profile'
                ? isDark ? 'bg-[#3fb950] text-black font-black' : 'bg-[#6b46c1] text-white font-black'
                : 'opacity-50 hover:opacity-100'
            }`}
          >
            PROFILE
          </button>
        </div>
      </nav>

      {/* 3. CORE ROUTING CONTAINER WITH TRANSITIONS */}
      <main className="flex-grow p-4 sm:p-8 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'player' && (
            <motion.div
              key="player"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-grow flex flex-col justify-center"
            >
              <PlayerPage
                userName={operator.name}
                theme={theme}
                tracks={tracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                volume={volume}
                favorites={favorites}
                chatMessages={chatMessages}
                onTrackSelect={handleTrackSelect}
                onPlayToggle={setIsPlaying}
                onTimeUpdate={setCurrentTime}
                onVolumeChange={setVolume}
                onToggleFavorite={handleToggleFavorite}
                onAddMessage={handlePushMessage}
                queueVisible={queueVisible}
                onToggleQueueVisible={setQueueVisible}
              />
            </motion.div>
          )}

          {activeTab === 'dj' && (
            <motion.div
              key="dj"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-grow flex flex-col justify-center"
            >
              <DjModePage
                currentTrack={currentTrack}
                theme={theme}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlayToggle={setIsPlaying}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-grow flex flex-col justify-center"
            >
              <ProfilePage
                userName={operator.name}
                theme={theme}
                favoritesCount={favorites.length}
                avatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Retro background dot patterns grids mapping screenshot designs */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-[-1]"
           style={{
             backgroundImage: `radial-gradient(${customAccentColor} 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }}
      />
    </div>
  );
}
