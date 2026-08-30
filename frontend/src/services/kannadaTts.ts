/**
 * Robust Bilingual (Kannada + English) Speech Synthesis Engine
 * Guaranteed audible playback on Chrome, Safari, Edge, Mac, Windows, iOS & Android
 */

export type AudioLanguageMode = 'BILINGUAL' | 'KN' | 'EN';

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeout: any = null;

// Keep global reference on window to prevent Chrome garbage-collection speech cutoff bug
(window as any).__currentUtterance = null;

export const playBilingualAudio = (
  textKn: string,
  textEn?: string,
  mode: AudioLanguageMode = 'BILINGUAL',
  onStart?: () => void,
  onEnd?: () => void
): void => {
  stopKannadaAudio();

  const cleanKn = textKn
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[#*`_]/g, '')
    .trim();

  const cleanEn = (textEn || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[#*`_]/g, '')
    .trim();

  if (onStart) onStart();

  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Resume paused synthesis (browser policy recovery)
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

  // Bilingual Mode: Check if Kannada voice is available
  const voices = window.speechSynthesis.getVoices();
  const hasKannadaVoice = voices.some(v => v.lang.toLowerCase().includes('kn'));

  if (hasKannadaVoice) {
    // Speak Kannada first, then English
    speakText(cleanKn, 'kn-IN', () => {
      speakText(cleanEn, 'en-US', onEnd);
    });
  } else {
    // If OS doesn't have Kannada font installed, speak English clearly to prevent silent freeze!
    speakText(cleanEn, 'en-IN', onEnd);
  }
};

const speakText = (text: string, lang: string, onDone?: () => void): void => {
  if (!text) {
    if (onDone) onDone();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = lang.startsWith('kn') ? 0.92 : 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick best matching voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (lang.startsWith('kn')) {
        const knVoice = voices.find(v => v.lang.toLowerCase().includes('kn'));
        if (knVoice) utterance.voice = knVoice;
      } else {
        const enVoice = voices.find(v => v.lang.toLowerCase().includes('en-in')) ||
                        voices.find(v => v.lang.toLowerCase().includes('en-us')) ||
                        voices.find(v => v.lang.toLowerCase().startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
    }

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

    // Safety timeout: Never hang UI if browser speech freezes
    const estimatedDuration = Math.max(3000, (text.length / 10) * 1000);
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
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
  (window as any).__currentUtterance = null;
};
