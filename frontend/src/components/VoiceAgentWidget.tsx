import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { playBilingualAudio, stopKannadaAudio, unlockBrowserAudio } from '../services/kannadaTts';
import { Mic, MicOff, Volume2, VolumeX, X, Send, AlertTriangle, RefreshCw, Languages, Play, Sparkles, Phone, PhoneOff, Hash } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAgentWidget: React.FC<Props> = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState<string>(`vsession-${Date.now()}`);
  const [language, setLanguage] = useState<'KN' | 'EN'>('KN');
  const [voiceEngine, setVoiceEngine] = useState<'web' | 'elevenlabs' | 'fish_audio'>('web');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioStarted, setIsAudioStarted] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);

  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; textKn: string; textEn?: string }>>([
    {
      sender: 'bot',
      textKn: "ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?",
      textEn: "Hello! Welcome to City Care Hospital. What is your full name for the appointment?"
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isSpeaking, isListening]);

  // Call Duration Timer
  useEffect(() => {
    let timer: any;
    if (isOpen) {
      timer = setInterval(() => setCallSeconds(s => s + 1), 1000);
    } else {
      setCallSeconds(0);
      stopKannadaAudio();
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startAudioSession = () => {
    setIsAudioStarted(true);
    if (messages.length > 0 && !isMuted) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg.sender === 'bot') {
        speakResponse(latestMsg.textKn, latestMsg.textEn);
      }
    }
  };

  // Speech Synthesis Pipeline (Bilingual Kannada + English Speech)
  const speakResponse = async (textKn: string, textEn?: string) => {
    if (isMuted) return;
    const mode = language === 'KN' ? 'BILINGUAL' : 'EN';
    playBilingualAudio(
      textKn,
      textEn,
      mode,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const fallbackWebSpeech = (textKn: string, textEn?: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const isKannada = language === 'KN';
      const textToSpeak = isKannada ? textKn : (textEn || textKn);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.15; // Faster speech pace
      utterance.volume = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Search strictly for Kannada (kn-IN) or English (en-IN / en-US), NEVER Hindi!
        let matchedVoice = voices.find(v => v.lang.toLowerCase().includes(isKannada ? 'kn' : 'en'));
        if (!matchedVoice && isKannada) {
          matchedVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en'));
          if (matchedVoice && textEn) {
            utterance.text = textEn;
            utterance.lang = matchedVoice.lang;
          }
        }
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis Exception:', e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    stopKannadaAudio();
    setIsSpeaking(false);
  };

  // Web Speech Recognition (STT)
  const startListening = () => {
    stopSpeaking();
    setIsAudioStarted(true);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported. Please type your response below.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === 'KN' ? 'kn-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendUtterance(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('STT exception:', e);
      setIsListening(false);
    }
  };

  const handleSendUtterance = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    stopSpeaking();
    setIsAudioStarted(true);
    setMessages(prev => [...prev, { sender: 'user', textKn: query, textEn: query }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiClient.processVoiceUtterance(sessionId, query);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          textKn: res.promptKannada,
          textEn: res.promptEnglish
        }
      ]);
      speakResponse(res.promptKannada, res.promptEnglish);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          textKn: "ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
          textEn: "Error processing request. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    stopSpeaking();
    const newId = `vsession-${Date.now()}`;
    setSessionId(newId);
    const initialMsg = [
      {
        sender: 'bot' as const,
        textKn: "ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?",
        textEn: "Hello! Welcome to City Care Hospital. What is your full name for the appointment?"
      }
    ];
    setMessages(initialMsg);
    if (isAudioStarted && !isMuted) {
      speakResponse(initialMsg[0].textKn, initialMsg[0].textEn);
    }
  };

  const replayLastMessage = () => {
    setIsAudioStarted(true);
    const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
    if (lastBotMsg) {
      speakResponse(lastBotMsg.textKn, lastBotMsg.textEn);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 relative flex flex-col h-[620px] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-4 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                isSpeaking ? 'bg-emerald-500 shadow-emerald-500/40 ring-4 ring-emerald-400/30' : isListening ? 'bg-rose-500 shadow-rose-500/40 ring-4 ring-rose-400/30' : 'bg-blue-600 shadow-blue-600/30'
              }`}>
                <Mic className={`w-5 h-5 text-white ${isListening || isSpeaking ? 'animate-bounce' : ''}`} />
              </div>
              {(isListening || isSpeaking) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                <span>{language === 'KN' ? 'ಕನ್ನಡ Voice Receptionist' : 'Voice Receptionist'}</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                  AI Active
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {isSpeaking ? '🔊 AI Speaking Voice...' : isListening ? '🎙️ Listening to you...' : 'Bilingual OPD Voice Assistant'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Voice Engine Toggle */}
            <button
              onClick={() => {
                const engines: Array<'web' | 'elevenlabs' | 'fish_audio'> = ['web', 'elevenlabs', 'fish_audio'];
                const nextIdx = (engines.indexOf(voiceEngine) + 1) % engines.length;
                setVoiceEngine(engines[nextIdx]);
              }}
              title="Voice Engine (Web / ElevenLabs / Fish Audio)"
              className="px-2 py-1 text-[11px] font-bold text-amber-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-amber-400/20 transition-colors"
            >
              {voiceEngine === 'web' ? '🌐 Web' : voiceEngine === 'elevenlabs' ? '✨ ElevenLabs' : '🐟 Fish Audio'}
            </button>

            {/* Language Selector */}
            <button
              onClick={() => {
                const nextLang = language === 'KN' ? 'EN' : 'KN';
                setLanguage(nextLang);
              }}
              title="Switch Language (KN / EN)"
              className="px-2 py-1 text-xs font-bold text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language}</span>
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Reset */}
            <button
              onClick={resetSession}
              title="Reset Call"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telephony Line & Call Timer Bar */}
        <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-medium">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Phone className="w-3.5 h-3.5 animate-pulse" />
            <span>Connected: +91 80 2345 6789</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
              ⏱️ {formatCallTime(callSeconds)}
            </span>
            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold transition-all ${
                showKeypad ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Toggle Dial Keypad (1-9)"
            >
              <Hash className="w-3 h-3 text-amber-400" />
              <span>Keypad</span>
            </button>
          </div>
        </div>

        {/* Interactive Phone Keypad Grid */}
        {showKeypad && (
          <div className="bg-slate-900 border-b border-slate-800 p-3 grid grid-cols-5 gap-2 animate-in slide-in-from-top-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
              <button
                key={num}
                onClick={() => handleSendUtterance(num)}
                className="py-2 bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-extrabold text-slate-200 border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
              >
                <span>{num}</span>
              </button>
            ))}
          </div>
        )}

        {/* Safety Notice */}
        <div className="bg-amber-950/40 border-b border-amber-500/20 px-4 py-1.5 text-[11px] text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>OPD Appointment Assistant only. For medical emergencies call 108.</span>
          </div>
        </div>

        {/* Unmute / Start Audio Banner Prompt (Browser Autoplay Unlocker) */}
        {!isAudioStarted && (
          <div className="bg-gradient-to-r from-emerald-900 to-blue-900 p-3 text-center border-b border-emerald-500/30 animate-pulse">
            <button
              onClick={startAudioSession}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs rounded-full shadow-lg shadow-emerald-500/40 transition-all flex items-center gap-2 mx-auto active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>🔊 CLICK HERE TO START VOICE AUDIO</span>
            </button>
          </div>
        )}

        {/* Interactive Speaker Orb & Visualizer */}
        <div className="py-4 bg-slate-950/60 border-b border-slate-800 flex flex-col items-center justify-center space-y-2">
          <div className="relative">
            {isSpeaking && <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />}
            {isListening && <div className="absolute inset-0 rounded-full bg-rose-500/40 animate-pulse" />}

            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  replayLastMessage();
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4 cursor-pointer ${
                isSpeaking
                  ? 'bg-emerald-600 border-emerald-400 scale-105 shadow-emerald-500/50'
                  : isListening
                  ? 'bg-rose-600 border-rose-400 scale-110 shadow-rose-500/50'
                  : loading
                  ? 'bg-indigo-600 border-indigo-400 animate-spin'
                  : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:scale-105'
              }`}
            >
              {isSpeaking && <Volume2 className="w-9 h-9 text-white animate-bounce" />}
              {isListening && <Mic className="w-9 h-9 text-white animate-pulse" />}
              {loading && <Sparkles className="w-9 h-9 text-indigo-300" />}
              {!isSpeaking && !isListening && !loading && <Volume2 className="w-9 h-9 text-emerald-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              {isSpeaking ? '🔊 Agent Speaking Voice...' : isListening ? '🎙️ Listening... Speak Now' : loading ? 'AI Thinking...' : 'Click Orb to Replay Voice Audio'}
            </span>
          </div>
        </div>

        {/* Chat Transcript Body */}
        <div className="flex-1 bg-slate-950/90 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-line shadow-md ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none font-semibold'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none font-medium'
                }`}
              >
                <div className="font-semibold">
                  {language === 'KN' ? m.textKn : (m.textEn || m.textKn)}
                </div>
                {language === 'KN' && m.textEn && (
                  <div className="text-[11px] text-slate-400 font-normal pt-1.5 border-t border-slate-700/60 mt-1">
                    {m.textEn}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 rounded-2xl p-3 text-xs flex items-center gap-2 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Processing response in {language === 'KN' ? 'Kannada' : 'English'}...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={startListening}
            className={`p-3 rounded-xl transition-all shadow-sm ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
            title="Click to Speak"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            placeholder={language === 'KN' ? "ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ (ಉದಾ: ರಮೇಶ್ / 9876543210)..." : "Speak or type response (e.g. Ramesh / 9876543210)..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUtterance()}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => handleSendUtterance()}
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
