import React, { useState, useEffect, useRef } from 'react';
import { Track, ChatMessage } from '../types';
import { DotMatrixText } from './DotMatrixText';
import { speakText } from '../utils/speechHelper';
import { sendChatMessage } from '../utils/api';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Heart,
  Eye,
  EyeOff,
  Volume2,
  Send,
  Mic,
  Radio,
  MessageSquare,
  Sparkles,
  VolumeX
} from 'lucide-react';

interface PlayerPageProps {
  userName: string;
  theme: 'dark' | 'light';
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  favorites: string[];
  chatMessages: ChatMessage[];
  onTrackSelect: (track: Track) => void;
  onPlayToggle: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleFavorite: (trackId: string) => void;
  onAddMessage: (msg: ChatMessage) => void;
  queueVisible: boolean;
  onToggleQueueVisible: (visible: boolean) => void;
}

export function PlayerPage({
  userName,
  theme,
  tracks,
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  favorites,
  chatMessages,
  onTrackSelect,
  onPlayToggle,
  onTimeUpdate,
  onVolumeChange,
  onToggleFavorite,
  onAddMessage,
  queueVisible,
  onToggleQueueVisible
}: PlayerPageProps) {
  const [clockTime, setClockTime] = useState(new Date());
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const speechStopRef = useRef<(() => void) | null>(null);
  const [melodyIntensity, setMelodyIntensity] = useState(0);

  // Fluctuating waveform trigger for the playback window following melody rhythms
  useEffect(() => {
    if (!isPlaying) {
      setMelodyIntensity(0);
      return;
    }

    let animId: number;
    let baseTime = 0;

    const updateMelody = () => {
      baseTime += 0.22;
      // Emulate natural song beat and waveform variations using layered sin/cos oscillations and high-intensity drums
      const slowMelody = Math.sin(baseTime) * 0.35 + 0.5;
      const subBassPulse = Math.cos(baseTime * 1.8) * 0.25 + 0.5;
      const rhythmVelocity = Math.random() > 0.88 ? Math.random() * 0.45 : 0;
      const calculatedIntensity = Math.min(1.0, Math.max(0.0, slowMelody * 0.5 + subBassPulse * 0.3 + rhythmVelocity * 0.2));

      setMelodyIntensity(calculatedIntensity);
      animId = requestAnimationFrame(updateMelody);
    };

    animId = requestAnimationFrame(updateMelody);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const isDark = theme === 'dark';
  const accentColor = isDark ? '#3fb950' : '#6b46c1';
  
  // Update real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Clock string (HH:MM)
  const padZero = (n: number) => String(n).padStart(2, '0');
  const clockHHMM = `${padZero(clockTime.getHours())}:${padZero(clockTime.getMinutes())}`;
  const dayName = clockTime.toLocaleDateString('en-US', { weekday: 'long' }); // Render full day name (e.g., 'Monday')
  const dateFormatted = clockTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  // Progress slide input handler
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    onTimeUpdate(newProgress);
  };

  // Convert seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Trigger TTS voice broadcast and update speaking UI
  const handleTTSReplay = (msgId: string, text: string) => {
    // If already speaking this message, stop it
    if (currentlySpeakingId === msgId) {
      if (speechStopRef.current) speechStopRef.current();
      setCurrentlySpeakingId(null);
      return;
    }

    setCurrentlySpeakingId(msgId);
    
    const speech = speakText(text, undefined, () => {
      setCurrentlySpeakingId(null);
    });

    if (speech) {
      speechStopRef.current = speech.stop;
    }
  };

  // Send human chat message to digital DJ Claudio
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: clockTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    };

    onAddMessage(userMsg);
    setInputText('');

    // Trigger AI response timer
    setTimeout(() => {
      generateClaudioResponse(userMsg.text);
    }, 1000);
  };

  // AI-powered DJ Claudio response via backend LLM API
  const generateClaudioResponse = async (userInput: string) => {
    try {
      const result = await sendChatMessage(userInput, chatMessages);

      const claudioMsg: ChatMessage = {
        ...result.reply,
        status: 'REPLAY',
      };

      onAddMessage(claudioMsg);

      // If AI recommended a track from our library, queue it
      if (result.recommendedTrackId) {
        const recommendedTrack = tracks.find((t) => t.id === result.recommendedTrackId);
        if (recommendedTrack) {
          onTrackSelect(recommendedTrack);
        }
      }

      // Automatically speak the response using Web Speech male voice
      handleTTSReplay(claudioMsg.id, claudioMsg.text);
    } catch {
      // Backend unavailable — use graceful fallback
      const fallbackTexts = [
        "This is Claudio. The signal's a little hazy tonight, but I'm still here — curating every frequency by hand.",
        "You're tuned in to Claudio FM. Deep navy frequencies, late night broadcasts.",
        "Breathing in, breathing out. Running 24/7 on air, bringing you the finest waves.",
      ];
      const replyText = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)];

      const claudioMsg: ChatMessage = {
        id: `msg-claudio-${Date.now()}`,
        sender: 'claudio',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: 'REPLAY',
      };

      onAddMessage(claudioMsg);
      handleTTSReplay(claudioMsg.id, claudioMsg.text);
    }
  };

  // Fake voice recorder trigger
  const handleMicTrigger = () => {
    setIsListening(true);
    speakText("Voice command channel active. What frequency would you like?", undefined, () => {
      setIsListening(false);
    });
    // Add user placeholder message
    setTimeout(() => {
      setInputText("Can you play some jazz boom-bap tracks please?");
    }, 2000);
  };

  // Track buttons navigation triggers
  const playPreviousTrack = () => {
    const index = tracks.findIndex(t => t.id === currentTrack.id);
    const newIdx = index === 0 ? tracks.length - 1 : index - 1;
    onTrackSelect(tracks[newIdx]);
  };

  const playNextTrack = () => {
    const index = tracks.findIndex(t => t.id === currentTrack.id);
    const newIdx = index === tracks.length - 1 ? 0 : index + 1;
    onTrackSelect(tracks[newIdx]);
  };

  const isCurrentFavorite = favorites.includes(currentTrack.id);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      
      {/* 1. TOP SECTION: THE DOT-MATRIX LED DESKTOP CLOCK */}
      <div className={`p-8 border rounded-lg relative overflow-hidden transition-all duration-300 ${
        isDark 
          ? 'bg-[#060a16] border-[#3fb950]/20 text-white' 
          : 'bg-[#faf8ff] border-[#6b46c1]/15 text-slate-800'
      }`}
           style={{
             backgroundImage: isDark
               ? 'radial-gradient(rgba(63, 185, 80, 0.04) 1px, transparent 1px)'
               : 'radial-gradient(rgba(107, 70, 193, 0.04) 1px, transparent 1px)',
             backgroundSize: '12px 12px'
           }}>
        
        {/* LED Backlighting effect */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b opacity-[0.03] pointer-events-none"
             style={{
               backgroundImage: `linear-gradient(to bottom, ${accentColor}, transparent)`
             }}
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          
          {/* Real Dynamic Dot-Matrix display! Looks incredibly authentic */}
          <div className="flex justify-center select-none py-4 overflow-x-auto max-w-full">
            <DotMatrixText 
              text={clockHHMM} 
              dotSizePx={8} 
              gapPx={2.5}
              activeColorClass={isDark ? 'bg-[#3fb950] shadow-[0_0_12px_#3fb950]' : 'bg-[#6b46c1] shadow-[0_0_12px_#6b46c1]'}
              inactiveColorClass={isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}
              scale={1}
            />
          </div>

          <div className="space-y-1 z-10 font-mono">
            <h2 className="text-sm font-semibold tracking-widest uppercase">{dayName}</h2>
            <p className="text-[10px] opacity-50 tracking-wider font-mono">{dateFormatted}</p>
          </div>

          {/* ON AIR flashing glowing beacon */}
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full z-10">
            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3fb950] animate-ping' : 'bg-[#6b46c1] animate-ping'}`}></span>
            <span className="text-[9px] font-bold tracking-widest uppercase font-mono" style={{ color: accentColor }}>
              ON AIR
            </span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: THE AUDIO DECK CONTROLS */}
      <div 
        id="audio-deck-panel" 
        className={`p-6 border rounded-lg space-y-4 transition-all duration-75 relative ${
          isDark ? 'bg-[#070c1b] border-white/10' : 'bg-white border-[#6b46c1]/10 shadow'
        }`}
        style={{
          transform: isPlaying ? `scale(${1 + melodyIntensity * 0.006})` : 'scale(1)',
          boxShadow: isPlaying 
            ? isDark
              ? `0 0 ${12 + melodyIntensity * 28}px rgba(63, 185, 80, ${0.08 + melodyIntensity * 0.28})`
              : `0 0 ${12 + melodyIntensity * 24}px rgba(107, 70, 193, ${0.06 + melodyIntensity * 0.20})`
            : undefined,
          borderColor: isPlaying
            ? isDark
              ? `rgba(63, 185, 80, ${0.2 + melodyIntensity * 0.5})`
              : `rgba(107, 70, 193, ${0.25 + melodyIntensity * 0.45})`
            : undefined
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Active Track Metadata & Animation */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`w-12 h-12 rounded bg-black border flex items-center justify-center relative overflow-hidden shrink-0 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              {isPlaying ? (
                /* Glowing active audio visualizer wave following simulated melody */
                <div className="flex items-end gap-1 h-6">
                  <div className="w-1 rounded-full transition-all duration-75" style={{ height: `${20 + melodyIntensity * 60}%`, backgroundColor: accentColor }}></div>
                  <div className="w-1 rounded-full transition-all duration-75" style={{ height: `${40 + melodyIntensity * 50}%`, backgroundColor: accentColor }}></div>
                  <div className="w-1 rounded-full transition-all duration-75" style={{ height: `${10 + melodyIntensity * 85}%`, backgroundColor: accentColor }}></div>
                  <div className="w-1 rounded-full transition-all duration-75" style={{ height: `${30 + melodyIntensity * 70}%`, backgroundColor: accentColor }}></div>
                </div>
              ) : (
                <Radio className="w-6 h-6 opacity-30" />
              )}
            </div>
            
            <div className="truncate text-left">
              <span className={`font-bold text-sm block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentTrack.title}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-white/50 truncate max-w-[150px]">{currentTrack.artist}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black/40 border border-white/5 text-white/50 rounded scale-90 shrink-0">
                  {isPlaying ? 'PLAYING' : 'STOPPED'}
                </span>
              </div>
            </div>
          </div>

          {/* Core Player Control Actions Buttons (Prev, Play, Next, Stop, Fav) */}
          <div className="flex flex-wrap items-center justify-center gap-2 grow md:grow-0">
            <button
              onClick={playPreviousTrack}
              className={`p-2.5 rounded hover:bg-white/10 transition-all border shrink-0 ${
                isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPlayToggle(!isPlaying)}
              className={`p-3.5 rounded-full hover:scale-105 transition-all cursor-pointer ${
                isDark ? 'bg-[#3fb950] text-black hover:bg-white' : 'bg-[#6b46c1] text-white hover:bg-slate-800'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={playNextTrack}
              className={`p-2.5 rounded hover:bg-white/10 transition-all border shrink-0 ${
                isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onPlayToggle(false);
                onTimeUpdate(0);
              }}
              className={`p-2.5 rounded hover:bg-white/10 transition-all border shrink-0 ${
                isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Stop Deck"
            >
              <Square className="w-4 h-4" />
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-white/10 mx-1 max-sm:hidden"></div>

            {/* FAV Toggle button with visual response */}
            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              className={`px-3 py-2 text-[10px] font-mono tracking-widest uppercase border rounded transition-all flex items-center gap-1.5 ${
                isDark ? 'border-white/10' : 'border-slate-200'
              } ${isCurrentFavorite ? 'text-red-500 font-bold bg-red-500/5' : 'text-white/50 hover:text-white'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isCurrentFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              FAV
            </button>

            {/* Show/Hide Queue Panel switch */}
            <button
              onClick={() => onToggleQueueVisible(!queueVisible)}
              className={`px-3 py-2 text-[10px] font-mono tracking-widest uppercase border rounded transition-all flex items-center gap-1.5 ${
                isDark ? 'border-white/10 text-white/60 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50'
              }`}
            >
              {queueVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {queueVisible ? 'HIDE' : 'QUEUE'}
            </button>
          </div>

          {/* Volume Control Deck */}
          <div className="flex items-center gap-2 w-full md:w-36">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-white/50" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/50" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-[#3fb950] h-1 bg-black/40 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor }}
            />
          </div>
        </div>

        {/* Dynamic progress bar timeline */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={currentTrack.duration}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full accent-[#3fb950] h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor }}
          />
          <div className="flex items-center justify-between text-[10px] font-mono opacity-50">
            <span>{formatTime(currentTime)}</span>
            <span>{currentTrack.durationString}</span>
          </div>
        </div>
      </div>

      {/* 3. COHESIVE TOGGLE QUEUE PANEL BLOCK */}
      {queueVisible && (
        <div id="queue-panel" className={`p-5 border rounded-lg space-y-3 ${
          isDark ? 'bg-black/50 border-white/10' : 'bg-slate-50 border-[#6b46c1]/10'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono uppercase text-white/50 pb-2 border-b border-white/5">
            <span>QUEUE LIST // MUSIC SHUFFLER</span>
            <span>{tracks.length} TRACKS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto max-h-52 pr-1">
            {tracks.map((track, idx) => {
              const isActive = track.id === currentTrack.id;
              const isFav = favorites.includes(track.id);
              return (
                <button
                  key={track.id}
                  onClick={() => onTrackSelect(track)}
                  className={`p-3 text-left border rounded transition-all flex items-center justify-between gap-2 overflow-hidden ${
                    isActive
                      ? isDark ? 'bg-[#3fb950]/10 border-[#3fb950]' : 'bg-[#6b46c1]/5 border-[#6b46c1]'
                      : isDark ? 'bg-[#070d19]/60 border-white/5 hover:bg-white/[0.04]' : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate flex items-center gap-2">
                    <span className="text-[10px] opacity-40 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                    <div className="truncate">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : isDark ? 'text-white/80' : 'text-slate-800'}`}>
                        {track.title}
                      </p>
                      <p className="text-[10px] opacity-40 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono opacity-40">{track.genre}</span>
                    <span className="text-[9px] font-mono opacity-50">({track.durationString})</span>
                    {isFav && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CHAT WITH CLAUDIO PARENT CONTAINER */}
      <div id="claudio-interactive-chat" className={`p-6 border rounded-lg space-y-4 ${
        isDark ? 'bg-[#060a15] border-[#3fb950]/15' : 'bg-white border-[#6b46c1]/10 shadow'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" style={{ color: accentColor }} />
            <h3 className="font-bold text-xs tracking-widest uppercase font-mono">
              Chat to Claudio (AI DJ)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-50 bg-black/30 px-2 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
            <span>LIVE OPERATIONAL</span>
          </div>
        </div>

        {/* MESSAGES LOG VIEWER */}
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1 flex flex-col pt-2 select-text">
          {chatMessages.map((msg) => {
            const isClaudio = msg.sender === 'claudio';
            const isSpeaking = currentlySpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isClaudio ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {/* Cat / Person avatar */}
                <div className="w-8 h-8 rounded bg-black shrink-0 overflow-hidden border border-white/10">
                  <img
                    src={
                      isClaudio
                        ? 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop'
                    }
                    alt={msg.sender}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Bubble info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[9px] font-mono opacity-40">
                    <span className="uppercase tracking-wider">{msg.sender}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Speech Bubble Container */}
                  <div className={`p-3 text-xs leading-relaxed relative ${
                    isClaudio
                      ? isDark 
                        ? 'bg-black/80 text-white/90 border border-[#3fb950]/10 rounded-e-lg rounded-es-lg'
                        : 'bg-indigo-50/50 text-slate-800 border border-slate-200 rounded-e-lg rounded-es-lg'
                      : isDark
                        ? 'bg-[#3fb950]/10 text-white font-mono border border-[#3fb950]/30 rounded-s-lg rounded-ee-lg'
                        : 'bg-[#6b46c1]/10 text-[#6b46c1] font-mono border border-[#6b46c1]/20 rounded-s-lg rounded-ee-lg'
                  }`}>
                    {msg.text}

                    {/* Claudio status badges showing REPLAY */}
                    {isClaudio && (
                      <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-white/10">
                        <button
                          onClick={() => handleTTSReplay(msg.id, msg.text)}
                          className={`px-2 py-0.5 text-[9px] font-mono tracking-tight uppercase border rounded-sm flex items-center gap-1 cursor-pointer transition-all ${
                            isSpeaking
                              ? 'bg-[#3fb950]/20 text-[#3fb950] border-[#3fb950]'
                              : 'text-white/40 hover:text-white border-white/10 bg-black/40'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5 shrink-0" />
                          {isSpeaking ? 'PLAYING' : 'REPLAY'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT AND VOICE BAR CONTROLS */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Say something to the DJ (e.g. 'hi Claudio', or try 'jazz')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`w-full bg-black/80 font-mono text-xs text-white placeholder-white/30 pl-4 pr-10 py-3 border outline-none rounded-sm focus:border-white/30 transition-all ${
                isListening ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/5'
              }`}
            />
            
            {/* Mic trigger */}
            <button
              type="button"
              onClick={handleMicTrigger}
              className={`absolute right-2 top-2 p-1 rounded-sm hover:bg-white/10 transition-all cursor-pointer ${
                isListening ? 'text-red-500 animate-pulse' : 'text-white/30 hover:text-white'
              }`}
              title="Voice Broadcast Command"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            className={`px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-[#3fb950] text-black hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(63,185,80,0.5)]' 
                : 'bg-[#6b46c1] text-white hover:bg-slate-900'
            }`}
            title="Dispatch message payload"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="max-sm:hidden">SEND</span>
          </button>
        </form>
      </div>

    </div>
  );
}
