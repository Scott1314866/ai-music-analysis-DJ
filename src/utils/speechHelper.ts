import { DJWord } from '../types';

export function getEnglishMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  
  // Try to find direct male voices
  const maleKeywords = ['male', 'david', 'puck', 'fenrir', 'microsoft david', 'guy', 'en-us-x', 'en-gb-x'];
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  // Pass 1: English + explicit male keyword
  for (const voice of englishVoices) {
    const nameLower = voice.name.toLowerCase();
    if (maleKeywords.some(keyword => nameLower.includes(keyword))) {
      return voice;
    }
  }
  
  // Pass 2: Any English voice with "google" (Google voices are often high quality) or David/Guy
  for (const voice of englishVoices) {
    if (voice.name.toLowerCase().includes('google')) {
      return voice;
    }
  }

  // Pass 3: Any English voice
  if (englishVoices.length > 0) {
    return englishVoices[0];
  }

  // Pass 4: Any voice
  if (voices.length > 0) {
    return voices[0];
  }

  return null;
}

export function speakText(
  text: string, 
  onWordBoundary?: (charIndex: number, charLength: number, wordIndex: number) => void,
  onEnd?: () => void
): { utterance: SpeechSynthesisUtterance; stop: () => void } | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  // Stop current speech first
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const maleVoice = getEnglishMaleVoice();
  if (maleVoice) {
    utterance.voice = maleVoice;
  }
  utterance.lang = 'en-US';
  utterance.rate = 0.95; // Slightly slower and cooler for a late-night DJ vibe!
  utterance.pitch = 0.85; // Lower pitch for a classic deep, resonant male voice!

  // Track word highlights based on character index if supported by browser
  let wordCounter = 0;
  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      // Estimate length by finding next space
      const part = text.slice(charIndex);
      const spaceIdx = part.indexOf(' ');
      const wordLen = spaceIdx === -1 ? part.length : spaceIdx;
      if (onWordBoundary) {
        onWordBoundary(charIndex, wordLen, wordCounter++);
      }
    }
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);

  return {
    utterance,
    stop: () => {
      window.speechSynthesis.cancel();
    }
  };
}

/**
 * Helper to generate word boundaries with timing for transcript simulation
 * when rendering text synchronizations. Estimates ~0.35 seconds per word.
 */
export function generateTranscriptWords(text: string): DJWord[] {
  const cleanWords = text.trim().split(/\s+/);
  let accumulatedTime = 0;
  
  return cleanWords.map((word) => {
    // Determine custom word length to make highlights feel natural
    const baseDuration = 0.35;
    const punctuationExtra = word.match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/) ? 0.2 : 0;
    const wordDuration = baseDuration + (word.length * 0.02) + punctuationExtra;
    
    const wordObj: DJWord = {
      text: word,
      start: parseFloat(accumulatedTime.toFixed(2)),
      end: parseFloat((accumulatedTime + wordDuration).toFixed(2))
    };
    
    accumulatedTime += wordDuration;
    return wordObj;
  });
}
