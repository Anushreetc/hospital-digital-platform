import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { playBilingualAudio, stopKannadaAudio, AudioLanguageMode } from '../services/kannadaTts';
import { Mic, MicOff, Volume2, VolumeX, X, Send, AlertTriangle, CheckCircle2, RefreshCw, Languages, Play, PhoneOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KannadaVoiceWidget: React.FC<Props> = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState<string>(`vsession-${Date.now()}`);
  const [language, setLanguage] = useState<AudioLanguageMode>('BILINGUAL');
  const [voiceEngine, setVoiceEngine] = useState<'web_speech' | 'elevenlabs' | 'fish_audio'>('web_speech');
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; textKn: string; textEn?: string }>>([
    {
      sender: 'bot',
      textKn: "ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?",
      textEn: "Hello! Welcome to City Care Hospital. What is your full name for the appointment?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak initial prompt when modal opens
  useEffect(() => {
    if (isOpen && messages.length > 0 && !isMuted) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg.sender === 'bot') {
        speakPrompt(latestMsg.textKn, latestMsg.textEn);
      }
    }
    return () => {
      stopKannadaAudio();
    };
  }, [isOpen]);

  // Speech Synthesis (Bilingual Kannada + English Speech)
  const speakPrompt = async (textKn: string, textEn?: string) => {
    if (isMuted) return;
    playBilingualAudio(
      textKn,
      textEn,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Web Speech Recognition (STT)
  const startListening = () => {
    stopKannadaAudio();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your response below.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'KN' ? 'kn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendUtterance(transcript);
    };

    recognition.start();
  };

  const handleSendUtterance = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    stopKannadaAudio();
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
      speakPrompt(res.promptKannada, res.promptEnglish);
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
    stopKannadaAudio();
    const newId = `vsession-${Date.now()}`;
    setSessionId(newId);
    const initialMsgs = [
      {
        sender: 'bot' as const,
        textKn: "ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?",
        textEn: "Hello! Welcome to City Care Hospital. What is your full name for the appointment?"
      }
    ];
    setMessages(initialMsgs);
    if (!isMuted) {
      speakPrompt(initialMsgs[0].textKn, initialMsgs[0].textEn);
    }
  };

  const replayLastMessage = () => {
    const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
    if (lastBotMsg) {
      speakPrompt(lastBotMsg.textKn, lastBotMsg.textEn);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[92vw] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[550px] animate-in slide-in-from-bottom-6 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 flex items-center justify-between shadow-md">
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
              <span>{language === 'KN' ? 'ಕನ್ನಡ Voice Assistant' : 'Voice Assistant'}</span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                Web AI Active
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              {isSpeaking ? '🔊 Agent Speaking...' : isListening ? '🎙️ Listening to you...' : 'Kannada & English Voice Appointments'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Voice Engine Provider Switcher */}
          <button
            onClick={() => {
              const engines: Array<'web_speech' | 'elevenlabs' | 'fish_audio'> = ['web_speech', 'elevenlabs', 'fish_audio'];
              const nextIdx = (engines.indexOf(voiceEngine) + 1) % engines.length;
              setVoiceEngine(engines[nextIdx]);
            }}
            title="Switch Voice Engine (Browser / ElevenLabs / Fish Audio)"
            className="p-1.5 text-[11px] font-bold text-amber-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 border border-amber-400/20"
          >
            <span>{voiceEngine === 'web_speech' ? '🌐 Web' : voiceEngine === 'elevenlabs' ? '✨ ElevenLabs' : '🐟 Fish Audio'}</span>
          </button>

          {/* Language Selector */}
          <button
            onClick={() => {
              const modes: AudioLanguageMode[] = ['BILINGUAL', 'KN', 'EN'];
              const nextIdx = (modes.indexOf(language) + 1) % modes.length;
              setLanguage(modes[nextIdx]);
            }}
            title="Switch Language Mode (Bilingual / Kannada / English)"
            className="p-1.5 text-xs font-bold text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-blue-400/30"
          >
            <Languages className="w-3.5 h-3.5 text-blue-300" />
            <span>{language === 'BILINGUAL' ? '🔊 KN + EN' : language === 'KN' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={() => {
              if (isSpeaking) stopKannadaAudio();
              setIsMuted(!isMuted);
            }}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Reset */}
          <button
            onClick={resetSession}
            title="Reset Session"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* End Call */}
          <button
            onClick={() => {
              stopKannadaAudio();
              onClose();
            }}
            title="End Call"
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Call</span>
          </button>

          {/* Close */}
          <button
            onClick={() => {
              stopKannadaAudio();
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 border-b border-amber-100 px-3 py-1.5 text-[11px] text-amber-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Appointment Assistant only. No medical advice.</span>
        </div>
        <button 
          onClick={replayLastMessage}
          className="text-blue-700 hover:underline flex items-center gap-1 text-[10px] font-semibold"
          title="Replay Voice Prompt"
        >
          <Play className="w-3 h-3 fill-current" />
          Replay
        </button>
      </div>

      {/* Message Chat Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none space-y-1.5'
              }`}
            >
              <div className="font-semibold whitespace-pre-line text-slate-900">
                {language === 'EN' ? (m.textEn || m.textKn) : m.textKn}
              </div>
              {(language === 'BILINGUAL' || (language === 'KN' && m.sender === 'bot')) && m.textEn && (
                <div className="text-[11px] text-slate-500 font-normal pt-1 border-t border-slate-100 whitespace-pre-line">
                  {m.textEn}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Processing voice response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Voice Visualizer Bar when speaking / listening */}
      {(isSpeaking || isListening) && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-medium border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
            <span>{isSpeaking ? 'Speaking Prompt...' : 'Listening... Speak now'}</span>
          </div>
          {/* Animated sound wave bars */}
          <div className="flex items-center gap-1 h-4">
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-3" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_400ms] h-2" />
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <button
          onClick={startListening}
          className={`p-3 rounded-xl transition-all shadow-sm ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
          title="Click to Speak"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          placeholder={language === 'KN' ? "ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ (ಉದಾ: ರಮೇಶ್ / ಹೌದು)..." : "Speak or type response (e.g. Ramesh / Yes)..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendUtterance()}
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => handleSendUtterance()}
          disabled={!inputText.trim() || loading}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
