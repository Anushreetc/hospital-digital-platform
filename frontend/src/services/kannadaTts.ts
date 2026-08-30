/**
 * Bilingual (Kannada + English) Speech Synthesis Audio Engine
 * Plays authentic native Kannada voice followed seamlessly by English voice
 */

export type AudioLanguageMode = 'BILINGUAL' | 'KN' | 'EN';

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export const playBilingualAudio = async (
  textKn: string,
  textEn?: string,
  mode: AudioLanguageMode = 'BILINGUAL',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
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

  if (mode === 'EN') {
    playEnglishSegment(cleanEn || cleanKn, onEnd);
    return;
  }

  if (mode === 'KN' || !cleanEn) {
    playKannadaSegment(cleanKn, onEnd);
    return;
  }

  // Bilingual Mode: Play Kannada First -> Followed by English
  playKannadaSegment(cleanKn, () => {
    playEnglishSegment(cleanEn, onEnd);
  });
};

const playKannadaSegment = (textKn: string, onDone?: () => void) => {
  if (!textKn) {
    if (onDone) onDone();
    return;
  }

  try {
    const encoded = encodeURIComponent(textKn.slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encoded}`;
    const audio = new Audio(ttsUrl);
    audio.playbackRate = 1.05;
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      if (onDone) onDone();
    };

    audio.onerror = () => {
      activeAudio = null;
      playWebSpeech(textKn, 'kn-IN', onDone);
    };

    audio.play().catch(() => {
      playWebSpeech(textKn, 'kn-IN', onDone);
    });
  } catch {
    playWebSpeech(textKn, 'kn-IN', onDone);
  }
};

const playEnglishSegment = (textEn: string, onDone?: () => void) => {
  if (!textEn) {
    if (onDone) onDone();
    return;
  }

  try {
    const encoded = encodeURIComponent(textEn.slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;
    const audio = new Audio(ttsUrl);
    audio.playbackRate = 1.08;
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      if (onDone) onDone();
    };

    audio.onerror = () => {
      activeAudio = null;
      playWebSpeech(textEn, 'en-US', onDone);
    };

    audio.play().catch(() => {
      playWebSpeech(textEn, 'en-US', onDone);
    });
  } catch {
    playWebSpeech(textEn, 'en-US', onDone);
  }
};

const playWebSpeech = (text: string, lang: string, onDone?: () => void) => {
  if (!('speechSynthesis' in window)) {
    if (onDone) onDone();
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    activeUtterance = utterance;

    utterance.onend = () => {
      activeUtterance = null;
      if (onDone) onDone();
    };

    utterance.onerror = () => {
      activeUtterance = null;
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
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
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
};
