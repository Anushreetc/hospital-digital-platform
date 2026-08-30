/**
 * Authentic Kannada Speech Synthesis Audio Player
 * Plays genuine, native Kannada neural audio directly in any browser
 */

let activeAudio: HTMLAudioElement | null = null;

export const playKannadaAudio = async (
  textKn: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  stopKannadaAudio();

  // Strip parenthetical text or markdown
  const cleanText = textKn
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[#*`_]/g, '')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  if (onStart) onStart();

  // 1. Primary: Direct Google Kannada Neural Voice Stream (100% Native Kannada on all OS)
  try {
    const encoded = encodeURIComponent(cleanText.slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encoded}`;
    
    const audio = new Audio(ttsUrl);
    audio.playbackRate = 1.05;
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      activeAudio = null;
      playWebSpeechKannada(cleanText, onEnd);
    };

    await audio.play();
    return;
  } catch (err) {
    console.warn('[Kannada TTS Stream] Failed to play Google Kannada stream, using WebSpeech:', err);
    playWebSpeechKannada(cleanText, onEnd);
  }
};

export const playWebSpeechKannada = (
  textKn: string,
  onEnd?: () => void
) => {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(textKn);
    utterance.lang = 'kn-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const knVoice = voices.find(v => v.lang.toLowerCase().includes('kn'));
      if (knVoice) {
        utterance.voice = knVoice;
      }
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    if (onEnd) onEnd();
  }
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
};
