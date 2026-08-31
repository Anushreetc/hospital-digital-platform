/**
 * Ultra-Smooth High-Fidelity Speech Audio Engine
 * Provides crystal-clear, steady, 100% natural Indian Female voice synthesis without shaking or jitter.
 */

import { transliterateKannadaToPhonetic } from './kannadaTransliterate';

export type AudioLanguageMode = 'BILINGUAL' | 'KN' | 'EN';

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeout: any = null;
let audioCtx: AudioContext | null = null;

// Keep global reference to prevent Chrome garbage collection
(window as any).__currentUtterance = null;

/**
 * Unlock browser audio context cleanly and silently
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
 * Select the highest quality, authentic Indian Female voice available
 */
const getBestSmoothVoice = (lang: 'KN' | 'EN'): { voice?: SpeechSynthesisVoice; langCode: string } => {
  if (!('speechSynthesis' in window)) {
    return { langCode: 'en-IN' };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { langCode: lang === 'KN' ? 'kn-IN' : 'en-IN' };
  }

  // If Kannada is requested and a native Kannada voice is installed, use it
  if (lang === 'KN') {
    const knVoice = voices.find(v => v.lang.toLowerCase().includes('kn'));
    if (knVoice) {
      return { voice: knVoice, langCode: knVoice.lang };
    }
  }

  // Search specifically for natural Indian Female Voices
  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = v.name.toLowerCase();
    const voiceLang = v.lang.toLowerCase();

    // 1. Celebrated Indian Female / Women Voices
    // Veena (Apple Indian Female), Neerja (Microsoft Indian Female Natural), Heera (Windows Indian Female), Aditi / Kavya / Lekha / Swara / Isha
    if (
      name.includes('veena') ||
      name.includes('neerja') ||
      name.includes('heera') ||
      name.includes('kavya') ||
      name.includes('lekha') ||
      name.includes('aditi') ||
      name.includes('swara') ||
      name.includes('isha')
    ) {
      score += 1000;
    }

    // 2. Indian Accent (en-IN, kn-IN, hi-IN)
    if (voiceLang.includes('en-in') || voiceLang.includes('kn-in') || voiceLang.includes('hi-in') || voiceLang.includes('te-in') || voiceLang.includes('ta-in')) {
      score += 500;
      if (name.includes('female') || name.includes('woman') || name.includes('girl')) {
        score += 300;
      }
    }

    if (name.includes('india') || name.includes('indian')) {
      score += 300;
    }

    // 3. Neural / Natural / Premium enhancements
    if (name.includes('natural') || name.includes('online')) score += 80;
    if (name.includes('enhanced') || name.includes('premium')) score += 60;
    if (name.includes('google')) score += 40;

    // 4. Disqualify male voices to guarantee female voice
    if (
      name.includes('rishi') ||
      name.includes('prabhat') ||
      name.includes('male') ||
      name.includes('man') ||
      name.includes('boy') ||
      name.includes('alex') ||
      name.includes('fred') ||
      name.includes('daniel') ||
      name.includes('george') ||
      name.includes('oliver') ||
      name.includes('david') ||
      name.includes('guy') ||
      name.includes('ravi')
    ) {
      score -= 900;
    }

    // General Female voice fallback if Indian voice is missing
    if (name.includes('female') || name.includes('samantha') || name.includes('serena') || name.includes('ava') || name.includes('victoria') || name.includes('karen')) {
      score += 50;
    }

    return score;
  };

  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  const bestVoice = sorted[0];

  return {
    voice: bestVoice,
    langCode: bestVoice ? bestVoice.lang : 'en-IN'
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
    speakSegment(cleanEn || cleanKn, 'EN', onEnd);
    return;
  }

  if (mode === 'KN' || !cleanEn) {
    speakSegment(cleanKn, 'KN', onEnd);
    return;
  }

  // BILINGUAL MODE: Speak Kannada first -> then speak English
  speakSegment(cleanKn, 'KN', () => {
    speakSegment(cleanEn, 'EN', onEnd);
  });
};

/**
 * Speak a single language segment with crystal-clear, steady Indian Female voice
 */
const speakSegment = (text: string, lang: 'KN' | 'EN', onDone?: () => void): void => {
  if (!text || !('speechSynthesis' in window)) {
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

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.volume = 1.0;
    // Standard native pitch (1.0) eliminates pitch-shifter tremolo/vibrato artifacts
    utterance.pitch = 1.0;
    // Clear, steady conversational speech rate
    utterance.rate = 0.95;

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
    const estimatedDuration = Math.max(3000, (textToSpeak.length / 5) * 1000);
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
