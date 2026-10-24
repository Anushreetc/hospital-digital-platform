import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  CheckCircle2,
  Send,
  RotateCcw,
  Sliders,
  Sparkles,
  Key,
  Radio,
  FileText
} from 'lucide-react';
import {
  elevenLabsVoice,
  PRECONFIGURED_ELEVENLABS_VOICES,
  ElevenLabsVoice
} from '../services/elevenLabsVoice';
import { Doctor, HospitalInfo } from '../types';
import { apiClient } from '../services/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hospitalInfo?: HospitalInfo;
  doctors?: Doctor[];
}

interface Message {
  sender: 'bot' | 'user';
  textKn: string;
  textEn: string;
  time: string;
}

export const CallAgent: React.FC<Props> = ({
  isOpen,
  onClose,
  hospitalInfo,
  doctors = []
}) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [language, setLanguage] = useState<'KN' | 'EN'>('KN');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    elevenLabsVoice.getSelectedVoiceId()
  );
  const [apiKeyInput, setApiKeyInput] = useState<string>(elevenLabsVoice.getApiKey());
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);

  const initialGreeting: Message = {
    sender: 'bot',
    textKn:
      'ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಮಲ್ಟಿಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಐಸಿಯುಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ElevenLabs AI ರಿಸೆಪ್ಷನಿಸ್ಟ್. ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್, ಭೇಟಿ ಸಮಯ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸೆಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    textEn:
      'Hello! Welcome to We Care Multispeciality Hospital and ICU. I am your ElevenLabs AI voice receptionist. How may I assist you with appointments, visiting hours, or emergency care?',
    time: '00:01'
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(isOpen);
  isOpenRef.current = isOpen;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Scroll transcript to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking, isListening]);

  // Call duration counter
  useEffect(() => {
    let timer: any;
    if (isOpen && callState === 'connected') {
      timer = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, callState]);

  const playRingTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      gain.gain.value = 0.04;
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      setTimeout(() => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
          setTimeout(() => ctx.close(), 120);
        } catch {}
      }, 350);
    } catch {}
  };

  // Start Call Flow
  const handleStartCall = () => {
    elevenLabsVoice.unlockAudio();
    playRingTone();
    setCallState('calling');
    setCallSeconds(0);
    setMessages([initialGreeting]);

    // Simulate connection ring, then connect and speak initial greeting
    setTimeout(() => {
      setCallState('connected');
      speakGreeting();
    }, 600);
  };

  const speakGreeting = () => {
    if (isMuted) {
      startListening();
      return;
    }

    const greetingText = language === 'KN' ? initialGreeting.textKn : initialGreeting.textEn;
    speakWithElevenLabs(greetingText);
  };

  const speakWithElevenLabs = (text: string) => {
    // Stop active STT while speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      setIsListening(false);
      isListeningRef.current = false;
    }

    setIsSpeaking(true);
    isSpeakingRef.current = true;

    elevenLabsVoice.speak(text, {
      voiceId: selectedVoiceId,
      isKannada: language === 'KN',
      onStart: () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      onEnd: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // As soon as AI finishes speaking, automatically open mic for patient's reply
        if (isOpenRef.current) {
          setTimeout(() => {
            if (isOpenRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 300);
        }
      },
      onError: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (isOpenRef.current) {
          setTimeout(() => {
            if (isOpenRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 300);
        }
      }
    });
  };

  const startListening = () => {
    if (isSpeakingRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setShowInput(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.lang = language === 'KN' ? 'kn-IN' : 'en-IN';
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      rec.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onerror = (e: any) => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript;
        if (text) {
          handleUserUtterance(text);
        }
      };

      rec.start();
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const handleUserUtterance = (query: string) => {
    if (!query.trim()) return;

    elevenLabsVoice.stop();
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    const currentTime = formatTime(callSeconds);

    // Add User message
    const userMsg: Message = {
      sender: 'user',
      textKn: query,
      textEn: query,
      time: currentTime
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Generate intelligent hospital receptionist response
    const res = elevenLabsVoice.generateHospitalResponse(query, language === 'KN', doctors);

    const botMsg: Message = {
      sender: 'bot',
      textKn: res.textKn,
      textEn: res.textEn,
      time: formatTime(callSeconds + 1)
    };

    setMessages((prev) => [...prev, botMsg]);

    // Speak using ElevenLabs
    const textToSpeak = language === 'KN' ? res.textKn : res.textEn;
    speakWithElevenLabs(textToSpeak);
  };

  const handleEndCall = () => {
    elevenLabsVoice.stop();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsSpeaking(false);
    setIsListening(false);
    isSpeakingRef.current = false;
    isListeningRef.current = false;

    // Save call to reception desk
    if (messages.length > 1) {
      void apiClient.saveVoiceCall({
        callerName: 'Patient Voice Call',
        phoneNumber: '9845012345',
        durationSeconds: Math.max(15, callSeconds),
        language: language === 'KN' ? 'KN' : 'EN',
        status: 'COMPLETED',
        summary: `ElevenLabs voice interaction in ${language === 'KN' ? 'Kannada' : 'English'}. Total duration: ${formatTime(callSeconds)}.`,
        transcript: messages
          .map((m) => `${m.sender === 'bot' ? 'ElevenLabs AI' : 'Patient'}: ${m.textKn || m.textEn}`)
          .join('\n')
      });
    }

    setCallState('idle');
    onClose();
  };

  const handleSaveSettings = () => {
    elevenLabsVoice.setApiKey(apiKeyInput);
    elevenLabsVoice.setSelectedVoiceId(selectedVoiceId);
    setShowSettings(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 relative flex flex-col h-[650px] max-h-[95vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Phone className={`w-5 h-5 text-white ${callState === 'connected' ? 'animate-pulse' : ''}`} />
              </div>
              {callState === 'connected' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">ElevenLabs Voice Receptionist</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Neural v2
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <span>We Care Multispeciality Hospital</span>
                {callState === 'connected' && (
                  <span className="text-emerald-400 font-mono">⏱️ {formatTime(callSeconds)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="ElevenLabs Voice Settings"
              className={`p-2 rounded-xl transition-all ${
                showSettings
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={handleEndCall}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ElevenLabs Configuration Drawer */}
        {showSettings && (
          <div className="bg-slate-950 p-4 border-b border-slate-800 text-xs space-y-3 animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> ElevenLabs Voice Setup
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full">
                eleven_multilingual_v2
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] font-medium">Select Pre-configured Voice:</label>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {PRECONFIGURED_ELEVENLABS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender}) - {v.recommendedFor}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] font-medium">
                Custom ElevenLabs API Key (Optional):
              </label>
              <input
                type="password"
                placeholder="Enter xi-api-key (Leave empty for default)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">
                Voice synthesis operates with pre-configured hospital models and fallback neural speech automatically.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveSettings}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Content Body: Idle State vs In-Call State */}
        {callState === 'idle' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-slate-800">
                <Mic className="w-10 h-10 text-white animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                ElevenLabs
              </span>
            </div>

            <div className="space-y-2 max-w-sm">
              <h4 className="font-bold text-xl text-white">Call Hospital AI Receptionist</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect in seconds for instant doctor availability, ICU consultation, visiting hours, and OPD appointments in Kannada or English.
              </p>
            </div>

            {/* Language Selector Pills */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setLanguage('KN')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  language === 'KN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
              <button
                onClick={() => setLanguage('EN')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  language === 'EN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={handleStartCall}
              className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 text-sm cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Start Voice Call</span>
            </button>
          </div>
        ) : callState === 'calling' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center animate-pulse">
              <Phone className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg text-white">Connecting to ElevenLabs Voice...</h4>
              <p className="text-xs text-slate-400">Loading Rachel (Multilingual v2 Receptionist)</p>
            </div>
          </div>
        ) : (
          /* Active Connected In-Call Screen */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Audio Wave Visualizer Section */}
            <div className="py-3 px-6 bg-slate-950/60 border-b border-slate-800/80 flex flex-col items-center justify-center shrink-0">
              <div className="flex items-center gap-1.5 h-8">
                {[30, 65, 100, 45, 90, 55, 80].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isSpeaking
                        ? 'bg-emerald-400 animate-pulse'
                        : isListening
                        ? 'bg-rose-400 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: isSpeaking || isListening ? `${(h * 0.28) + 6}px` : '4px',
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>

              <div className="mt-1 text-center">
                <span className="text-[11px] font-semibold">
                  {isSpeaking ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      <span>ElevenLabs Voice Speaking...</span>
                    </span>
                  ) : isListening ? (
                    <span className="text-rose-400 flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      <span>{language === 'KN' ? '🎙️ ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ' : '🎙️ Listening... (Speak Now)'}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hands-Free Live • Speak anytime</span>
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Conversation Transcript */}
            <div className="flex-1 bg-slate-950/70 p-4 overflow-y-auto space-y-3 text-xs">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-lg ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-sm'
                        : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-bl-sm backdrop-blur-md'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                      <span>{m.sender === 'bot' ? 'ElevenLabs AI Receptionist' : 'You'}</span>
                      <span>•</span>
                      <span>{m.time}</span>
                    </div>

                    <div className="font-medium text-white text-[13px] leading-snug">
                      {language === 'KN' ? m.textKn : m.textEn}
                    </div>

                    {language === 'KN' && m.textEn && m.textEn !== m.textKn && (
                      <div className="text-[11px] text-slate-400 font-normal pt-1 border-t border-slate-800/80 mt-1.5">
                        {m.textEn}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Pill Chips */}
            <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              <button
                onClick={() => handleUserUtterance(language === 'KN' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book an appointment')}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                📅 {language === 'KN' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್' : 'Book OPD'}
              </button>
              <button
                onClick={() => handleUserUtterance(language === 'KN' ? 'ವೈದ್ಯರ ಮಾಹಿತಿ ಕೊಡಿ' : 'Doctor availability')}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                👨‍⚕️ {language === 'KN' ? 'ವೈದ್ಯರ ಪಟ್ಟಿ' : 'Doctors'}
              </button>
              <button
                onClick={() => handleUserUtterance(language === 'KN' ? 'ಭೇಟಿ ಸಮಯ ಯಾವಾಗ?' : 'What are visiting hours?')}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                ⏰ {language === 'KN' ? 'ಭೇಟಿ ಸಮಯ' : 'Visiting Hours'}
              </button>
              <button
                onClick={() => handleUserUtterance(language === 'KN' ? 'ಲ್ಯಾಬ್ ಮತ್ತು ರಕ್ತ ಪರೀಕ್ಷೆ' : 'Lab and blood tests')}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                🧪 {language === 'KN' ? 'ರಕ್ತ ಪರೀಕ್ಷೆ' : 'Lab Tests'}
              </button>
            </div>

            {/* Text input drawer if mic unavailable or user wants to type */}
            {showInput && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={language === 'KN' ? 'ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Type your question here...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUserUtterance(inputText)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleUserUtterance(inputText)}
                  disabled={!inputText.trim()}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom In-Call Controls */}
            <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between">
              {/* Mute Toggle */}
              <button
                onClick={() => {
                  if (isSpeaking) elevenLabsVoice.stop();
                  setIsMuted(!isMuted);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Main Reactive Mic Button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    elevenLabsVoice.stop();
                    setIsSpeaking(false);
                    startListening();
                  } else if (isListening) {
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.abort();
                      } catch {}
                    }
                    setIsListening(false);
                  } else {
                    startListening();
                  }
                }}
                className={`px-6 py-3 rounded-full font-bold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 shadow-xl cursor-pointer active:scale-95 ${
                  isSpeaking
                    ? 'bg-slate-800 border-2 border-emerald-500/60 text-emerald-300'
                    : isListening
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 animate-bounce text-emerald-400" />
                ) : isListening ? (
                  <Mic className="w-4 h-4 animate-pulse text-white" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                <span>
                  {isSpeaking
                    ? 'Speaking (Tap to interrupt)'
                    : isListening
                    ? (language === 'KN' ? 'ಆಲಿಸುತ್ತಿದೆ...' : 'Listening...')
                    : (language === 'KN' ? 'ಮೈಕ್ ಒತ್ತಿ' : 'Tap to Speak')}
                </span>
              </button>

              {/* Disconnect / End Call Button */}
              <button
                onClick={handleEndCall}
                className="p-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-2xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Security & Emergency Footer */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ElevenLabs Neural Audio</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" /> Emergency: 108
          </span>
        </div>
      </div>
    </div>
  );
};
