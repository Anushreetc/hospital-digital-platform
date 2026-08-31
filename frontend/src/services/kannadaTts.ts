/**
 * High-Fidelity Bilingual (Kannada + English) Speech Audio Engine
 * Plays authentic native MP3 audio from backend proxy with Web Speech fallback
 */

import { API_BASE } from './apiClient';

export type AudioLanguageMode = 'BILINGUAL' | 'KN' | 'EN';

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeout: any = null;
let audioCtx: AudioContext | null = null;

// Keep global reference to prevent Chrome garbage collection
(window as any).__currentUtterance = null;

/**
 * Unlock browser audio context on any user click
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
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    }
  } catch (e) {
    // Ignore audio context errors
  }
};

const sanitizeForSpeech = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[?؟]/g, '') // Strip question marks
    .replace(/[:;!#*`_~]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/["'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Main Bilingual Audio Player
 */
export const playBilingualAudio = async (
  textKn: string,
  textEn?: string,
  mode: AudioLanguageMode = 'BILINGUAL',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  stopKannadaAudio();
  unlockBrowserAudio();

  const cleanKn = sanitizeForSpeech(textKn);
  const cleanEn = sanitizeForSpeech(textEn || '');

  if (onStart) onStart();

  if (mode === 'EN') {
    playAudioSegment(cleanEn || cleanKn, 'EN', onEnd);
    return;
  }

  if (mode === 'KN' || !cleanEn) {
    playAudioSegment(cleanKn, 'KN', onEnd);
    return;
  }

  // BILINGUAL MODE: Play Kannada first -> then play English
  playAudioSegment(cleanKn, 'KN', () => {
    playAudioSegment(cleanEn, 'EN', onEnd);
  });
};

/**
 * Play a single language audio segment via Backend Neural MP3 or Web Speech
 */
const playAudioSegment = async (text: string, lang: 'KN' | 'EN', onDone?: () => void): Promise<void> => {
  if (!text) {
    if (onDone) onDone();
    return;
  }

  // 1. Try Backend Neural Audio Stream (Authentic Kannada & English MP3)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE}/ai/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: lang,
        provider: 'web_speech'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 200) {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activeAudio = audio;

        audio.onended = () => {
          activeAudio = null;
          URL.revokeObjectURL(audioUrl);
          if (onDone) onDone();
        };

        audio.onerror = () => {
          activeAudio = null;
          URL.revokeObjectURL(audioUrl);
          fallbackWebSpeech(text, lang, onDone);
        };

        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.warn('[TTS Proxy] Backend audio fetch error, using Web Speech fallback:', err);
  }

  // 2. Fallback: Browser Web Speech Synthesis
  fallbackWebSpeech(text, lang, onDone);
};

const fallbackWebSpeech = (text: string, lang: 'KN' | 'EN', onDone?: () => void): void => {
  if (!('speechSynthesis' in window)) {
    if (onDone) onDone();
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined = undefined;

    if (voices && voices.length > 0) {
      if (lang === 'KN') {
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
      utterance.lang = lang === 'KN' ? 'kn-IN' : 'en-US';
    }

    utterance.rate = lang === 'KN' ? 0.88 : 1.0;

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
    utterance.onerror = () => finish();

    // Safety timeout
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
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
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
