/**
 * Ultra-Smooth High-Fidelity Speech Audio Engine
 * Calibrated for steady, natural, melodious Indian Female receptionist voice synthesis
 * Supports VoisLabs Indic Neural, Browser Neural, dedicated Kannada, dedicated English, and Dual Bilingual modes.
 */

import { transliterateKannadaToPhonetic } from './kannadaTransliterate';
import { apiClient } from './apiClient';

export type AudioLanguageMode = 'KN' | 'EN' | 'BILINGUAL';
export type TtsEngineType = 'voislabs' | 'browser_neural' | 'gpt_live';

export interface VoisLabsVoiceOption {
  id: string;
  name: string;
  language: 'kn' | 'en' | 'bilingual';
  description: string;
}

export const VOISLABS_VOICES: VoisLabsVoiceOption[] = [
  {
    id: 'voislabs-kannada-female-1',
    name: 'VoisLabs Shreya (ಕನ್ನಡ - Warm Receptionist)',
    language: 'kn',
    description: 'Natural Bengaluru Kannada accent with authentic retroflexes and polite hospital etiquette'
  },
  {
    id: 'voislabs-kannada-female-2',
    name: 'VoisLabs Kavya (ಕನ್ನಡ - Melodious Guide)',
    language: 'kn',
    description: 'Crisp, measured Kannada tone for clinical consultations and instructions'
  },
  {
    id: 'voislabs-english-female-1',
    name: 'VoisLabs Ananya (Indian English - Professional)',
    language: 'en',
    description: 'Warm and articulate Indian English female voice for clear hospital reception'
  },
  {
    id: 'voislabs-bilingual-female-1',
    name: 'VoisLabs Priya (Kannada + English Bilingual)',
    language: 'bilingual',
    description: 'Seamless code-switching between Kannada and Indian English'
  }
];

export const VOISLABS_TONES = [
  { id: 'warm_friendly', label: 'Warm & Friendly (ಸ್ನೇಹಪರ)' },
  { id: 'receptionist_clear', label: 'Receptionist Professional (ಸ್ಪಷ್ಟ ವೃತ್ತಿಪರ)' },
  { id: 'calm_compassionate', label: 'Calm & Compassionate (ಶಾಂತ ಕಾಳಜಿ)' },
  { id: 'urgent_reassuring', label: 'Reassuring Care (ಭರವಸೆಯ ಧ್ವನಿ)' }
];

export interface VoiceSettings {
  rate: number;       // 0.7 to 1.4 (Default ~0.95)
  pitch: number;      // 0.8 to 1.3 (Default 1.0)
  voiceName?: string; // Explicit SpeechSynthesisVoice name
  engine?: TtsEngineType;
  voisLabsVoiceId?: string;
  voisLabsTone?: string;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  rate: 0.95,
  pitch: 1.0,
  engine: 'voislabs',
  voisLabsVoiceId: 'voislabs-kannada-female-1',
  voisLabsTone: 'warm_friendly'
};

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeout: any = null;
let audioCtx: AudioContext | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let activeAudioElement: HTMLAudioElement | null = null;

// Global reference to prevent Chromium garbage collection
(window as any).__currentUtterance = null;
(window as any).__currentAudioElement = null;

// Populate voices as soon as available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Get all loaded voices categorized for tuning selection
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
};

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
    .replace(/[?؟]/g, '')
    .replace(/[:;!#*`_~]/g, ', ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/["'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Select the highest quality, authentic voice available, or use user-specified voice
 */
export const getBestSmoothVoice = (
  lang: 'KN' | 'EN',
  preferredVoiceName?: string
): { voice?: SpeechSynthesisVoice; langCode: string } => {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) {
    return { langCode: lang === 'KN' ? 'kn-IN' : 'en-IN' };
  }

  // 1. If user explicitly selected a voice from tuning panel
  if (preferredVoiceName) {
    const userChoice = voices.find((v) => v.name === preferredVoiceName);
    if (userChoice) {
      return { voice: userChoice, langCode: userChoice.lang };
    }
  }

  // 2. If Kannada is requested, prioritize native Kannada voice if available
  if (lang === 'KN') {
    const knVoice = voices.find((v) => v.lang.toLowerCase().includes('kn'));
    if (knVoice) {
      return { voice: knVoice, langCode: knVoice.lang };
    }
  }

  // 3. Search specifically for natural Indian Female Voices
  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = v.name.toLowerCase();
    const voiceLang = v.lang.toLowerCase();

    // Priority Indian voices: Veena (Apple), Neerja (Microsoft), Heera, Aditi, Kavya, Lekha, Swara, Isha
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

    // Indian Accent codes (en-in, kn-in, hi-in)
    if (voiceLang.includes('en-in') || voiceLang.includes('kn-in') || voiceLang.includes('hi-in')) {
      score += 500;
      if (name.includes('female') || name.includes('woman') || name.includes('girl')) {
        score += 300;
      }
    }

    if (name.includes('india') || name.includes('indian')) {
      score += 300;
    }

    // Neural / Natural / Premium enhancements
    if (name.includes('natural') || name.includes('online')) score += 80;
    if (name.includes('enhanced') || name.includes('premium')) score += 60;
    if (name.includes('google')) score += 40;

    // Disqualify known male or robotic voices
    if (
      name.includes('rishi') ||
      name.includes('prabhat') ||
      name.includes('male') ||
      name.includes('man') ||
      name.includes('boy') ||
      name.includes('alex') ||
      name.includes('fred') ||
      name.includes('daniel') ||
      name.includes('david') ||
      name.includes('guy') ||
      name.includes('ravi')
    ) {
      score -= 900;
    }

    // General Female voice fallback if Indian voice is missing
    if (
      name.includes('female') ||
      name.includes('samantha') ||
      name.includes('serena') ||
      name.includes('ava') ||
      name.includes('victoria') ||
      name.includes('karen')
    ) {
      score += 50;
    }

    return score;
  };

  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  const bestVoice = sorted[0];

  return {
    voice: bestVoice,
    langCode: bestVoice ? bestVoice.lang : (lang === 'KN' ? 'kn-IN' : 'en-IN')
  };
};

/**
 * Speak a single language segment with crystal-clear, steady voice
 */
/**
 * Speak a segment using VoisLabs Indic Neural Engine
 */
const speakVoisLabsSegment = async (
  text: string,
  lang: 'KN' | 'EN',
  settings: VoiceSettings,
  onDone?: () => void
): Promise<void> => {
  if (!text) {
    if (onDone) onDone();
    return;
  }

  try {
    const langParam = lang === 'KN' ? 'kn' : 'en';
    const voiceId = settings.voisLabsVoiceId || (lang === 'KN' ? 'voislabs-kannada-female-1' : 'voislabs-english-female-1');
    const tone = settings.voisLabsTone || 'warm_friendly';

    const resp = await apiClient.synthesizeVoisLabsVoice(text, langParam, voiceId, tone);
    if (resp && (resp.audioBlobUrl || resp.audioBase64)) {
      const audioFormat = resp.audioFormat || 'mp3';
      const audioSrc = resp.audioBlobUrl || `data:audio/${audioFormat};base64,${resp.audioBase64}`;
      const audio = new Audio(audioSrc);
      activeAudioElement = audio;
      (window as any).__currentAudioElement = audio;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (speechTimeout) {
          clearTimeout(speechTimeout);
          speechTimeout = null;
        }
        activeAudioElement = null;
        (window as any).__currentAudioElement = null;
        if (onDone) onDone();
      };

      audio.onended = () => finish();
      audio.onerror = () => {
        // Fallback to browser neural if audio element failed
        speakSegment(text, lang, settings, onDone);
      };

      // Safety timeout in case audio stalls
      const durationSeconds = Math.max(3, (text.length / 4.5));
      speechTimeout = setTimeout(() => {
        finish();
      }, (durationSeconds + 4) * 1000);

      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('VoisLabs synthesis fallback to neural:', err);
  }

  // Graceful fallback to browser neural voice
  speakSegment(text, lang, settings, onDone);
};

/**
 * Speak a single language segment with crystal-clear, steady voice
 */
const speakSegment = (
  text: string,
  lang: 'KN' | 'EN',
  settings: VoiceSettings = DEFAULT_SETTINGS,
  onDone?: () => void
): void => {
  if (!text || !('speechSynthesis' in window)) {
    if (onDone) onDone();
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const { voice: selectedVoice, langCode: targetLang } = getBestSmoothVoice(lang, settings.voiceName);

    let textToSpeak = text;
    if (lang === 'KN') {
      // If no native Kannada voice is installed, convert to refined phonetic speech
      if (!selectedVoice || !selectedVoice.lang.toLowerCase().includes('kn')) {
        textToSpeak = transliterateKannadaToPhonetic(text);
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.volume = 1.0;
    utterance.pitch = settings.pitch || 1.0;

    // Calibrated natural speech rate: Kannada slightly more measured for clear syllables
    const baseRate = settings.rate || 0.95;
    utterance.rate = lang === 'KN' ? Math.max(0.8, baseRate * 0.92) : baseRate;

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
    const estimatedDuration = Math.max(3000, (textToSpeak.length / 4.5) * 1000);
    speechTimeout = setTimeout(() => {
      finish();
    }, estimatedDuration);

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech Error:', err);
    if (onDone) onDone();
  }
};

/**
 * Main Tuned Audio Player
 * Supports KN (Kannada only), EN (English only), or BILINGUAL (KN first, then EN).
 * Supports VoisLabs neural voice generation with browser synthesis fallback.
 */
export const playBilingualAudio = async (
  textKn: string,
  textEn?: string,
  mode: AudioLanguageMode = 'BILINGUAL',
  settingsOrOnStart?: VoiceSettings | (() => void),
  onStartOrOnEnd?: () => void,
  onEnd?: () => void
): Promise<void> => {
  stopKannadaAudio();
  unlockBrowserAudio();

  let settings: VoiceSettings = DEFAULT_SETTINGS;
  let onStartCallback: (() => void) | undefined;
  let onEndCallback: (() => void) | undefined;

  if (typeof settingsOrOnStart === 'function') {
    onStartCallback = settingsOrOnStart;
    onEndCallback = onStartOrOnEnd;
  } else if (settingsOrOnStart) {
    settings = { ...DEFAULT_SETTINGS, ...settingsOrOnStart };
    onStartCallback = onStartOrOnEnd;
    onEndCallback = onEnd;
  }

  const cleanKn = sanitizeForSpeech(textKn);
  const cleanEn = sanitizeForSpeech(textEn || '');

  if (onStartCallback) onStartCallback();

  const useVoisLabs = settings.engine === 'voislabs' || !settings.engine;

  // 1. PURE ENGLISH MODE: Speak ONLY English
  if (mode === 'EN') {
    const speechText = cleanEn || cleanKn;
    if (useVoisLabs) {
      speakVoisLabsSegment(speechText, 'EN', settings, onEndCallback);
    } else {
      speakSegment(speechText, 'EN', settings, onEndCallback);
    }
    return;
  }

  // 2. PURE KANNADA MODE: Speak ONLY Kannada
  if (mode === 'KN' || !cleanEn) {
    if (useVoisLabs) {
      speakVoisLabsSegment(cleanKn, 'KN', settings, onEndCallback);
    } else {
      speakSegment(cleanKn, 'KN', settings, onEndCallback);
    }
    return;
  }

  // 3. BILINGUAL MODE: Speak Kannada first -> then speak English
  if (useVoisLabs) {
    speakVoisLabsSegment(cleanKn, 'KN', settings, () => {
      setTimeout(() => {
        speakVoisLabsSegment(cleanEn, 'EN', settings, onEndCallback);
      }, 300);
    });
  } else {
    speakSegment(cleanKn, 'KN', settings, () => {
      setTimeout(() => {
        speakSegment(cleanEn, 'EN', settings, onEndCallback);
      }, 300);
    });
  }
};

/**
 * Quick Preview / Voice Testing Function
 */
export const previewTunedVoice = (
  lang: 'KN' | 'EN',
  settings: VoiceSettings,
  onStart?: () => void,
  onEnd?: () => void
): void => {
  const sample = lang === 'KN'
    ? "ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಮಲ್ಟಿಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ VoisLabs AI ರಿಸೆಪ್ಷನಿಸ್ಟ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
    : "Hello! Welcome to We Care Multispeciality Hospital and ICU Doddaballapura. I am your AI receptionist. How can I help you today?";

  playBilingualAudio(sample, sample, lang, settings, onStart, onEnd);
};

export const stopKannadaAudio = (): void => {
  if (speechTimeout) {
    clearTimeout(speechTimeout);
    speechTimeout = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
    (window as any).__currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  activeUtterance = null;
  (window as any).__currentUtterance = null;
};

