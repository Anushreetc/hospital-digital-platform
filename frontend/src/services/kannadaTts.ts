/**
 * Bulletproof Bilingual Speech Synthesis & Web Audio Engine
 * Features Web Audio API unlock chime + safe browser SpeechSynthesis
 */

export type AudioLanguageMode = 'BILINGUAL' | 'KN' | 'EN';

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeout: any = null;
let audioCtx: AudioContext | null = null;

// Keep global reference on window to prevent Chrome garbage-collection speech cutoff bug
(window as any).__currentUtterance = null;

/**
 * Play a subtle 0.08s soft audio chime using WebAudio API
 * This immediately unlocks browser audio playback policies on macOS, Windows, Chrome & Safari
 */
export const unlockBrowserAudio = (): void => {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime); // Very soft
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (e) {
    // Ignore audio context errors silently
  }
};

const sanitizeForSpeech = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[?؟]/g, '') // Completely remove question mark symbol so it never says "question mark"
    .replace(/[:;!#*`_~]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/["'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const playBilingualAudio = (
  textKn: string,
  textEn?: string,
  mode: AudioLanguageMode = 'BILINGUAL',
  onStart?: () => void,
  onEnd?: () => void
): void => {
  stopKannadaAudio();
  unlockBrowserAudio();

  const cleanKn = sanitizeForSpeech(textKn);
  const cleanEn = sanitizeForSpeech(textEn || '');

  if (onStart) onStart();

  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Resume paused synthesis queue (Chrome policy recovery)
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  if (mode === 'EN') {
    speakText(cleanEn || cleanKn, 'en-US', onEnd);
    return;
  }

  if (mode === 'KN' || !cleanEn) {
    speakText(cleanKn, 'kn-IN', onEnd);
    return;
  }

  // BILINGUAL MODE: Always speak both prompts!
  // Speak Kannada segment first, then English segment
  speakText(cleanKn, 'kn-IN', () => {
    speakText(cleanEn, 'en-US', onEnd);
  });
};

const speakText = (text: string, preferredLang: string, onDone?: () => void): void => {
  if (!text) {
    if (onDone) onDone();
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined = undefined;

    if (voices && voices.length > 0) {
      if (preferredLang.startsWith('kn')) {
        selectedVoice = voices.find(v => v.lang.toLowerCase().includes('kn'));
      }
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.toLowerCase().includes('en-in')) ||
                        voices.find(v => v.lang.toLowerCase().includes('en-us')) ||
                        voices.find(v => v.lang.toLowerCase().startsWith('en'));
      }
      if (!selectedVoice) {
        selectedVoice = voices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = preferredLang.startsWith('kn') ? 'kn-IN' : 'en-US';
    }

    utterance.rate = utterance.lang.startsWith('kn') ? 0.88 : 1.0;

    activeUtterance = utterance;
    (window as any).__currentUtterance = utterance;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (speechTimeout) {
        clearTimeout(speechTimeout);
        speechTimeout = null;
      }
      activeUtterance = null;
      (window as any).__currentUtterance = null;
      if (onDone) onDone();
    };

    utterance.onend = () => finish();
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis Utterance error:', e);
      finish();
    };

    // Safety timeout: Never hang UI if browser speech stalls
    const estimatedDuration = Math.max(3000, (text.length / 8) * 1000);
    speechTimeout = setTimeout(() => {
      finish();
    }, estimatedDuration);

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech Error:', err);
    if (onDone) onDone();
  }
};

export const playKannadaAudio = (
  textKn: string,
  onStart?: () => void,
  onEnd?: () => void
) => {
  return playBilingualAudio(textKn, undefined, 'KN', onStart, onEnd);
};

export const stopKannadaAudio = () => {
  if (speechTimeout) {
    clearTimeout(speechTimeout);
    speechTimeout = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  activeUtterance = null;
  (window as any).__currentUtterance = null;
};
