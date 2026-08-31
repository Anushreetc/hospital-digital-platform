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

  // Specifically search for Indian Female / Women Accent voices (Veena, Neerja, Heera, Kavya, Lekha, Aditi, Swara)
  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = v.name.toLowerCase();
    const voiceLang = v.lang.toLowerCase();

    // 1. Absolute Top Priority: Celebrated Indian Female / Women Voices
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

    // 4. Disqualify / heavily penalize Male voices to guarantee an authentic Female voice
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

  // 1. Try Backend Neural Audio Stream (Authentic Indian Female Kannada & English MP3)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/ai/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: lang === 'EN' ? 'en-IN' : 'kn',
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

  // 2. Fallback: Browser Web Speech Synthesis with smooth Indian female voice tuning
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
    utterance.pitch = 1.08; // Smooth, clear, warm Indian female receptionist pitch
    utterance.rate = 0.90; // Natural, unhurried, articulate cadence

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
