import React, { useState, useEffect, useRef } from 'react';
import { Track, DJWord } from '../types';
import { speakText, generateTranscriptWords } from '../utils/speechHelper';
import { generateDjIntro } from '../utils/api';
import { DotMatrixText } from './DotMatrixText';
import {
  Radio,
  Play,
  Pause,
  ChevronRight,
  Music,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface DjModePageProps {
  currentTrack: Track;
  theme: 'dark' | 'light';
  isPlaying: boolean;
  currentTime: number;
  onPlayToggle: (playing: boolean) => void;
}

function getFallbackIntro(track: Track): string {
  return `This is Claudio. It's late, and the airwaves are clear. Up next, we have a ${track.genre.toLowerCase()} track called "${track.title}" by ${track.artist}. Turn down the lights, turn up the volume — this one's for you. You're locked in to Claudio FM.`;
}

export function DjModePage({
  currentTrack,
  theme,
  isPlaying,
  currentTime,
  onPlayToggle
}: DjModePageProps) {
  const isDark = theme === 'dark';
  const [isDJSpeaking, setIsDJSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [speechPlaybackRate, setSpeechPlaybackRate] = useState(1);
  const speechRef = useRef<(() => void) | null>(null);

  // Dynamic DJ intro text — fetched from AI backend or fallback
  const [djIntroText, setDjIntroText] = useState(() => getFallbackIntro(currentTrack));
  const [introLoading, setIntroLoading] = useState(false);

  // Fetch AI-generated DJ intro when track changes
  useEffect(() => {
    let cancelled = false;
    setIntroLoading(true);

    generateDjIntro({
      title: currentTrack.title,
      artist: currentTrack.artist,
      genre: currentTrack.genre,
    })
      .then((result) => {
        if (!cancelled) {
          setDjIntroText(result.introText);
          setIntroLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDjIntroText(getFallbackIntro(currentTrack));
          setIntroLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack.id, currentTrack.title, currentTrack.artist, currentTrack.genre]);

  // Custom estimated word-timelines — rebuilt when intro text changes
  const transcriptWordsRef = useRef<DJWord[]>(generateTranscriptWords(djIntroText));
  const [transcriptWords, setTranscriptWords] = useState<DJWord[]>(transcriptWordsRef.current);

  useEffect(() => {
    transcriptWordsRef.current = generateTranscriptWords(djIntroText);
    setTranscriptWords(transcriptWordsRef.current);
  }, [djIntroText]);

  const [waveformBars, setWaveformBars] = useState<number[]>(Array.from({ length: 45 }, () => 15));
  const [melodyIntensity, setMelodyIntensity] = useState(0);

  // Fluctuating waveform trigger for the playback window following melody rhythms
  useEffect(() => {
    if (!isPlaying) {
      setMelodyIntensity(0);
      return;
    }

    let animId: number;
    let baseTime = Math.random() * 100;

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

  // Audio animation loops for waveforms
  useEffect(() => {
    let animId: number;
    
    const updateWaveform = () => {
      const time = Date.now() * 0.005;
      
      setWaveformBars(() => {
        return Array.from({ length: 45 }, (_, i) => {
          const x = i / 44; // normalized index [0, 1]
          
          if (isPlaying || isDJSpeaking) {
            // HIGH-AMPLITUDE DYNAMIC MODE
            // We want organic, tall, beautiful spectrum peaks that bounce up to 100%
            
            // Outer envelope: shape curve of spectrum heights
            const envelope = Math.sin(x * Math.PI); // beautiful arc
            
            // Rhythmic main wave (bass-heavy on left, mid/high on right)
            const w1 = Math.sin(time * 2.5 + x * 6) * 35;
            const w2 = Math.cos(time * 5.2 - x * 12) * 25;
            const w3 = Math.sin(time * 9.5 + x * 20) * 15;
            
            // Adjust factor according to position
            const bassPower = Math.max(0, 1 - x * 1.2) * 1.5;
            const midPower = (1 - Math.abs(x - 0.5) * 2) * 1.2;
            const treblePower = Math.max(0, (x - 0.4) * 1.6) * 1.0;
            
            let waveOffset = (w1 * bassPower) + (w2 * midPower) + (w3 * treblePower);
            
            // Amplify based on player/DJ intensity
            const intensityMultiplier = isDJSpeaking ? 1.4 : (0.8 + melodyIntensity * 1.4);
            waveOffset *= intensityMultiplier;
            
            // Live micro-jitter representation
            const jitter = (Math.random() - 0.5) * 18;
            
            // Base dynamic height range: 15% to 100%
            let h = 25 + envelope * 45 + waveOffset + jitter;
            
            // Clamp strictly within 8% and 100%
            return Math.max(8, Math.min(100, Math.round(h)));
          } else {
            // BEAUTIFUL GENERIC STANDBY IDLE WAVE
            // Instead of sitting flat, we ripple slowly and beautifully with low amplitude
            const idleArc = Math.sin(x * Math.PI) * 18;
            const bounce = Math.sin(time * 0.8 + x * 5) * 6;
            return Math.max(8, Math.round(10 + idleArc + bounce));
          }
        });
      });
      
      animId = requestAnimationFrame(updateWaveform);
    };

    animId = requestAnimationFrame(updateWaveform);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isDJSpeaking, melodyIntensity]);

  // Synchronized word highlighter interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDJSpeaking) {
      let currentWordIdx = 0;
      setActiveWordIndex(0);

      const runHighlight = () => {
        if (currentWordIdx < transcriptWords.length) {
          const word = transcriptWords[currentWordIdx];
          const durationOfWord = (word.end - word.start) * 1000 / speechPlaybackRate;
          
          timer = setTimeout(() => {
            currentWordIdx++;
            setActiveWordIndex(currentWordIdx);
            runHighlight();
          }, durationOfWord);
        } else {
          setIsDJSpeaking(false);
          setActiveWordIndex(-1);
        }
      };

      runHighlight();
    } else {
      setActiveWordIndex(-1);
    }

    return () => clearTimeout(timer);
  }, [isDJSpeaking, transcriptWords, speechPlaybackRate]);

  // Trigger DJ speech synthesis
  const handleTriggerSpeech = () => {
    if (isDJSpeaking) {
      if (speechRef.current) speechRef.current();
      setIsDJSpeaking(false);
      setActiveWordIndex(-1);
      return;
    }

    setIsDJSpeaking(true);

    // Play with AI-generated DJ intro text via Web Speech API
    const speech = speakText(djIntroText, undefined, () => {
      setIsDJSpeaking(false);
      setActiveWordIndex(-1);
    });

    if (speech) {
      speechRef.current = speech.stop;
    }
  };

  const handleStopSpeech = () => {
    if (speechRef.current) speechRef.current();
    setIsDJSpeaking(false);
    setActiveWordIndex(-1);
  };

  useEffect(() => {
    return () => {
      if (speechRef.current) speechRef.current();
    };
  }, []);

  return (
    <div className={`flex flex-col flex-grow items-center w-full max-w-5xl mx-auto space-y-6 pb-16 transition-all duration-300`}>
      
      {/* FULL DJ HUB HEADER SCREEN */}
      <div className={`w-full p-6 border rounded-lg flex flex-col items-center select-none ${
        isDark ? 'bg-black/90 border-[#3fb950]/15' : 'bg-white border-[#6b46c1]/10 shadow-lg'
      }`}>
        
        {/* Top bar with system status */}
        <div className="w-full flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <DotMatrixText 
              text="Claudio" 
              dotSizePx={4} 
              gapPx={1.2}
              activeColorClass={isDark ? 'bg-[#3fb950] shadow-[0_0_8px_#3fb950]' : 'bg-[#6b46c1] shadow-[0_0_8px_#6b46c1]'}
              inactiveColorClass={isDark ? 'bg-white/5' : 'bg-black/5'}
            />
          </div>
          
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className={`w-2 h-2 rounded-full ${isDJSpeaking ? 'bg-red-500 animate-ping' : isDark ? 'bg-[#3fb950]' : 'bg-[#6b46c1]'}`}></span>
            <span className={isDJSpeaking ? 'text-red-500 font-bold' : 'text-white/60'} style={{ color: !isDJSpeaking ? (isDark ? '#3fb950' : '#6b46c1') : undefined }}>
              {isDJSpeaking ? 'Speaking...' : 'ON AIR'}
            </span>
          </div>
        </div>

        {/* 1. LARGE GLOWING AUDIO WAVEFORM VISUALIZATION */}
        <div className="h-44 w-full flex items-center justify-center gap-1.5 px-4 overflow-hidden my-6">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-[height] duration-75 ease-out"
              style={{
                height: `${height}%`,
                backgroundColor: isDJSpeaking 
                  ? '#ef4444' 
                  : i % 2 === 0 
                    ? isDark ? '#3fb950' : '#6b46c1' 
                    : isDark ? 'rgba(63,185,80,0.4)': 'rgba(107,70,193,0.4)'
              }}
            />
          ))}
        </div>

        {/* 2. FLOATING CURRENT SONG CARD WITH CYBER RHYTHMIC VIBRATION */}
        <div 
          className={`w-full max-w-md p-5 border rounded-lg text-left shadow-2xl space-y-3 transition-all duration-75 ${
            isDark ? 'bg-[#0d1117] border-white/10' : 'bg-slate-50 border-slate-200'
          }`}
          style={{
            transform: isPlaying 
              ? `scale(${1 + melodyIntensity * 0.014}) rotate(${(Math.sin(melodyIntensity * 12) * 0.35)}deg)` 
              : 'scale(1) rotate(0deg)',
            boxShadow: isPlaying 
              ? isDark
                ? `0 0 ${16 + melodyIntensity * 36}px rgba(63, 185, 80, ${0.12 + melodyIntensity * 0.35})`
                : `0 0 ${16 + melodyIntensity * 30}px rgba(107, 70, 193, ${0.10 + melodyIntensity * 0.28})`
              : undefined,
            borderColor: isPlaying
              ? isDark
                ? `rgba(63, 185, 80, ${0.25 + melodyIntensity * 0.55})`
                : `rgba(107, 70, 193, ${0.30 + melodyIntensity * 0.50})`
              : undefined
          }}
        >
          <div className="flex justify-between items-start">
            <div className="truncate">
              <span className="text-[10px] font-mono opacity-50 block uppercase tracking-wide">
                NOW BROADCASTING
              </span>
              <h4 className={`font-black text-xl truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentTrack.title}
              </h4>
              <p className="text-xs text-white/60 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => onPlayToggle(!isPlaying)}
              className="p-3 bg-black border border-white/10 hover:bg-white hover:text-black hover:invert rounded-full transition-all shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>
          </div>

          {/* Simple card timeline */}
          <div className="space-y-1 pt-1 font-mono">
            <div className="w-full bg-black/50 h-1 rounded overflow-hidden">
              <div 
                className="h-full rounded"
                style={{ 
                  width: `${(currentTime / currentTrack.duration) * 100}%`,
                  backgroundColor: isDark ? '#3fb950' : '#6b46c1'
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] opacity-40">
              <span>Time progression</span>
              <span>{currentTrack.durationString}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC TRANSCRIPT AREA WITH GLOWING WORD LEVEL HGHLGHTS */}
      <div className={`w-full p-6 border rounded-lg flex flex-col text-left space-y-4 ${
        isDark ? 'bg-[#070b15] border-[#3fb950]/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-widest">
            DJ Claudio Broadcast Transcript
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono opacity-50 px-2 py-0.5 bg-black/60 rounded">
              SPEED: {speechPlaybackRate}X
            </span>
          </div>
        </div>

        {/* Word Level Highlight box */}
        <div className="p-5 bg-black/30 border border-white/5 rounded-sm select-text leading-relaxed">
          <p className="flex flex-wrap gap-x-2.5 gap-y-3 text-lg md:text-xl font-light text-white/40">
            {transcriptWords.map((wordObj, idx) => {
              const isWordHighlighted = idx === activeWordIndex;
              const hasBeenSpoken = idx < activeWordIndex;
              
              return (
                <span
                  key={idx}
                  className={`transition-all duration-150 inline-block px-1 rounded-sm ${
                    isWordHighlighted
                      ? isDark
                        ? 'bg-[#3fb950] text-black font-semibold shadow-[0_0_12px_#3fb950] scale-105'
                        : 'bg-[#6b46c1] text-white font-semibold shadow-[0_0_12px_#6b46c1] scale-105'
                      : hasBeenSpoken
                        ? 'text-white/80'
                        : 'text-white/30 truncate'
                  }`}
                >
                  {wordObj.text}
                </span>
              );
            })}
          </p>
        </div>

        {/* Bottom player bar for speech */}
        <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={handleTriggerSpeech}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest border rounded transition-all flex items-center gap-2 cursor-pointer ${
                isDJSpeaking
                  ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                  : 'bg-black hover:bg-white hover:text-black font-semibold text-white/90 border-white/15'
              }`}
            >
              {isDJSpeaking ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
              {isDJSpeaking ? 'HALT DJ AUDIO' : 'SPEECHES BROADCAST'}
            </button>
            <button
              onClick={handleStopSpeech}
              title="Reset Transcript"
              className="p-2 border border-white/10 hover:bg-white/5 rounded transition-all text-white/50 hover:text-white cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono text-white/40">Broadcasting flow</span>
            <div className="w-40 h-8 flex items-center gap-1 overflow-hidden opacity-40">
              <div className="w-1.5 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-5 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-6 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-4 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-7 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
