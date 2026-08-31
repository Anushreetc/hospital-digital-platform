/**
 * Ultra-Smooth High-Fidelity Speech Audio Engine
 * Provides studio-clear, warm, natural speech synthesis in Kannada & English
 */

import { API_BASE } from './apiClient';
import { transliterateKannadaToPhonetic } from './kannadaTransliterate';

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
    .replace(/[?؟]/g, '') // Strip question marks to prevent robot reading 'question mark'
    .replace(/[:;!#*`_~]/g, ', ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/["'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Select the highest quality, most natural female/warm neural voice available on the device
 */
const getBestSmoothVoice = (lang: 'KN' | 'EN'): { voice?: SpeechSynthesisVoice; langCode: string } => {
  if (!('speechSynthesis' in window)) {
    return { langCode: 'en-IN' };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { langCode: lang === 'KN' ? 'kn-IN' : 'en-IN' };
  }

  // If Kannada is requested, first check if genuine kn-IN voice is available
  if (lang === 'KN') {
    const knVoice = voices.find(v => v.lang.toLowerCase().includes('kn'));
    if (knVoice) {
      return { voice: knVoice, langCode: knVoice.lang };
    }
  }

  // Premium voice ranking score for clear, warm, smooth human speech
  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = v.name.toLowerCase();
    const voiceLang = v.lang.toLowerCase();

    // Prefer Indian English or UK/US clear natural accents
    if (voiceLang.includes('en-in')) score += 50;
    else if (voiceLang.includes('en-gb') || voiceLang.includes('en-us')) score += 30;
    else if (voiceLang.startsWith('en')) score += 20;

    // Premium Neural / Enhanced voice tags
    if (name.includes('natural') || name.includes('online')) score += 40;
    if (name.includes('enhanced') || name.includes('premium')) score += 35;
    if (name.includes('google')) score += 30;
    if (name.includes('siri')) score += 25;

    // High quality natural female/warm voices
    if (name.includes('neerja') || name.includes('heera') || name.includes('veena') || name.includes('kavya')) score += 45;
    if (name.includes('serena') || name.includes('ava') || name.includes('samantha') || name.includes('zoe') || name.includes('karen')) score += 25;
    if (name.includes('rishi') || name.includes('prabhat')) score += 20;

    // Penalize robotic/flat legacy voices
    if (name.includes('compact') || name.includes('alex') || name.includes('fred')) score -= 30;

    return score;
  };

  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  const bestVoice = sorted[0];

  return {
    voice: bestVoice,
    langCode: bestVoice ? bestVoice.lang : (lang === 'KN' ? 'en-IN' : 'en-US')
  };
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
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
    // Backend fetch failed or timed out, fallback to browser synthesis immediately
  }

  // 2. Fallback: Browser Web Speech Synthesis with smooth voice tuning
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

    const { voice: selectedVoice, langCode: targetLang } = getBestSmoothVoice(lang);

    let textToSpeak = text;
    if (lang === 'KN') {
      // If no native Kannada voice is installed, convert to smooth phonetic speech
      if (!selectedVoice || !selectedVoice.lang.toLowerCase().includes('kn')) {
        textToSpeak = transliterateKannadaToPhonetic(text);
      }
    }

    // Format text with gentle cadence pauses
    const formattedText = textToSpeak.replace(/,/g, ', ').replace(/\./g, '. ');

    const utterance = new SpeechSynthesisUtterance(formattedText);
    utterance.volume = 1.0;
    utterance.pitch = 1.02; // Warm, friendly hospital receptionist pitch
    utterance.rate = lang === 'KN' ? 0.90 : 0.93; // Smooth, clear, relaxed cadence

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = targetLang;

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
    const estimatedDuration = Math.max(3000, (formattedText.length / 6) * 1000);
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
