import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import {
  playBilingualAudio,
  stopKannadaAudio,
  unlockBrowserAudio,
  getAvailableVoices,
  previewTunedVoice,
  AudioLanguageMode,
  VoiceSettings,
  VOISLABS_VOICES,
  VOISLABS_TONES
} from '../services/kannadaTts';
import { DialogueTurn } from '../types';
import { GptLiveClient } from '../services/gptLiveEngine';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  RefreshCw,
  Phone,
  PhoneOff,
  Hash,
  Zap,
  CheckCircle2,
  Calendar,
  User,
  Keyboard,
  ChevronDown,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  FileText
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  sender: 'bot' | 'user';
  textKn: string;
  textEn: string;
}

export const VoiceAgentWidget: React.FC<Props> = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState<string>(`vsession-${Date.now()}`);
  const [step, setStep] = useState<'language_select' | 'conversation'>('language_select');
  
  // Separate Language Mode: 'KN' | 'EN' | 'BILINGUAL'
  const [languageMode, setLanguageMode] = useState<AudioLanguageMode>('KN');

  // Voice Tuning Settings (VoisLabs, Speed, Pitch, Selected Voice)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 1.0,
    pitch: 1.0,
    engine: 'browser_neural',
    voisLabsVoiceId: 'voislabs-kannada-female-1',
    voisLabsTone: 'neutral'
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showTuningPanel, setShowTuningPanel] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState<boolean>(false);
  const [handsFree, setHandsFree] = useState<boolean>(true); // Auto-listen active by default

  const initialGreeting: MessageItem = {
    sender: 'bot',
    textKn: "ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಮಲ್ಟಿಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಐಸಿಯು ದೊಡ್ಡಬಳ್ಳಾಪುರಕ್ಕೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ತಿಳಿಸಿ.",
    textEn: "Hello! Welcome to We Care Multispeciality Hospital and ICU Doddaballapura. Please state your full name to book an appointment."
  };

  const [messages, setMessages] = useState<MessageItem[]>([initialGreeting]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const gptLiveRef = useRef<GptLiveClient | null>(null);

  // Turn-by-turn transcript recording for Hospital Receptionist Portal
  const dialogueTurnsRef = useRef<DialogueTurn[]>([
    {
      speaker: 'AI_RECEPTIONIST',
      text: initialGreeting.textKn + (initialGreeting.textEn ? ` / ${initialGreeting.textEn}` : ''),
      timestamp: '00:00'
    }
  ]);

  // Fresh state refs to avoid stale closure issues in audio callbacks
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const handsFreeRef = useRef(handsFree);
  handsFreeRef.current = handsFree;

  const languageModeRef = useRef(languageMode);
  languageModeRef.current = languageMode;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Persist conversation transcript & case to Hospital Receptionist Portal
  const saveCurrentCallRecord = async (appt?: any) => {
    const turns = [...dialogueTurnsRef.current];
    if (turns.length <= 1 && !appt) return;

    const appointment = appt || confirmedAppointment;
    const callerName = appointment?.patientName || 'Caller';
    const callerPhone = appointment?.patientPhone || '9876543210';
    const fullTranscript = turns
      .map((t) => `${t.speaker === 'AI_RECEPTIONIST' ? 'AI Receptionist' : 'Patient'} [${t.timestamp}]: ${t.text}`)
      .join('\n');

    const summaryText = appointment
      ? `Patient ${appointment.patientName} (${appointment.patientPhone}) booked appointment for ${appointment.preferredDate} at ${appointment.preferredTime} with ${appointment.doctorName} (${appointment.departmentName}).`
      : `Inquiry handled by AI Voice Receptionist in ${languageMode === 'KN' ? 'Kannada' : languageMode === 'EN' ? 'English' : 'Bilingual'} mode. Call duration: ${formatCallTime(callSeconds)}.`;

    try {
      await apiClient.saveVoiceCall({
        id: `call-${sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`,
        callId: sessionId,
        callerName,
        phoneNumber: callerPhone,
        startedAt: new Date(Date.now() - (callSeconds * 1000)).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(15, callSeconds),
        language: languageMode === 'KN' ? 'KN' : languageMode === 'EN' ? 'EN' : 'BILINGUAL',
        status: 'COMPLETED',
        caseStatus: 'NEW',
        intent: appointment ? 'APPOINTMENT_BOOKING' : 'GENERAL_OPD',
        appointmentId: appointment?.id,
        bookedAppointmentDetails: appointment ? {
          id: appointment.id,
          doctorName: appointment.doctorName,
          departmentName: appointment.departmentName,
          date: appointment.preferredDate,
          time: appointment.preferredTime,
          reason: appointment.reason
        } : undefined,
        outcome: appointment ? 'APPOINTMENT_CREATED' : 'INFORMATION_PROVIDED',
        summary: summaryText,
        transcript: fullTranscript,
        dialogueTurns: turns
      });
    } catch (e) {
      console.warn('Call transcript auto-save notice:', e);
    }
  };

  // Discover and load available synthesizer voices
  useEffect(() => {
    const loadVoices = () => {
      const v = getAvailableVoices();
      if (v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Local storage removed for simplified UI

  // Initialize GPT-Live-1 Engine
  useEffect(() => {
    gptLiveRef.current = new GptLiveClient(
      (state) => {
        setIsSpeaking(state.isSpeaking);
        if (state.isSpeaking) {
          isSpeakingRef.current = true;
          if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch {}
            setIsListening(false);
          }
        }
      },
      (sender, text) => {
        setMessages((prev) => [
          ...prev,
          {
            sender,
            textKn: text,
            textEn: text
          }
        ]);
      }
    );

    return () => {
      gptLiveRef.current?.stop();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isSpeaking, isListening, confirmedAppointment]);

  // Call Duration Timer & Initial Greeting Speech on Open
  useEffect(() => {
    let timer: any;
    let speakTimer: any;

    if (isOpen && step === 'conversation') {
      unlockBrowserAudio();
      timer = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      gptLiveRef.current?.start().catch((err) => console.warn('Live API auto-start notice:', err));

      // Speak greeting, then AUTOMATICALLY start listening for caller's answer!
      speakTimer = setTimeout(() => {
        if (!isMutedRef.current) {
          playBilingualAudio(
            initialGreeting.textKn,
            initialGreeting.textEn,
            languageModeRef.current,
            voiceSettings,
            () => {
              setIsSpeaking(true);
              isSpeakingRef.current = true;
            },
            () => {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              if (isOpenRef.current && handsFreeRef.current) {
                setTimeout(() => {
                  if (isOpenRef.current && !isSpeakingRef.current) {
                    startListening();
                  }
                }, 300);
              }
            }
          );
        } else if (handsFreeRef.current) {
          startListening();
        }
      }, 500);
    } else if (!isOpen) {
      setStep('language_select');
      setCallSeconds(0);
      setMessages([initialGreeting]);
      dialogueTurnsRef.current = [];
      setConfirmedAppointment(null);
      stopKannadaAudio();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      setIsListening(false);
      gptLiveRef.current?.stop();
    }

    return () => {
      clearInterval(timer);
      clearTimeout(speakTimer);
    };
  }, [isOpen, step]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Speak response based on current languageMode and tuned voice settings
  const speakResponse = (textKn: string, textEn?: string) => {
    // Abort active recognition while AI is speaking so it doesn't pick up its own voice
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      setIsListening(false);
      isListeningRef.current = false;
    }

    if (isMutedRef.current) {
      if (isOpenRef.current && handsFreeRef.current) {
        startListening();
      }
      return;
    }

    playBilingualAudio(
      textKn,
      textEn || textKn,
      languageModeRef.current,
      voiceSettings,
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // AS SOON AS THE AI FINISHES SPEAKING -> AUTOMATICALLY START LISTENING!
        if (isOpenRef.current && handsFreeRef.current) {
          setTimeout(() => {
            if (isOpenRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 350);
        }
      }
    );
  };

  const stopSpeaking = () => {
    stopKannadaAudio();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  };

  // Switch Language Mode cleanly & update ongoing session
  const handleSelectLanguage = (newMode: AudioLanguageMode) => {
    stopSpeaking();
    setLanguageMode(newMode);
    languageModeRef.current = newMode;
    
    // Announce the switch briefly in the chosen language, then auto-listen!
    if (!isMutedRef.current) {
      setTimeout(() => {
        if (newMode === 'KN') {
          playBilingualAudio(
            "ಕನ್ನಡ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತೇನೆ.",
            undefined,
            'KN',
            voiceSettings,
            () => {
              setIsSpeaking(true);
              isSpeakingRef.current = true;
            },
            () => {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              if (isOpenRef.current && handsFreeRef.current) startListening();
            }
          );
        } else if (newMode === 'EN') {
          playBilingualAudio(
            "English mode selected. Please speak your answer.",
            "English mode selected. Please speak your answer.",
            'EN',
            voiceSettings,
            () => {
              setIsSpeaking(true);
              isSpeakingRef.current = true;
            },
            () => {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              if (isOpenRef.current && handsFreeRef.current) startListening();
            }
          );
        } else {
          playBilingualAudio(
            "ದ್ವಿಭಾಷಾ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ.",
            "Bilingual mode active.",
            'BILINGUAL',
            voiceSettings,
            () => {
              setIsSpeaking(true);
              isSpeakingRef.current = true;
            },
            () => {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              if (isOpenRef.current && handsFreeRef.current) startListening();
            }
          );
        }
      }, 200);
    }
  };

  // Test current voice tuning settings
  const handleTestTuning = () => {
    stopSpeaking();
    setIsTestingVoice(true);
    const testLang = languageMode === 'EN' ? 'EN' : 'KN';
    previewTunedVoice(
      testLang,
      voiceSettings,
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setIsTestingVoice(true);
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setIsTestingVoice(false);
      }
    );
  };

  // Web Speech Recognition (STT) calibrated to selected language
  const startListening = () => {
    stopSpeaking();
    unlockBrowserAudio();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowKeyboardInput(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // Calibrate STT recognition language to user's selected mode
      if (languageModeRef.current === 'EN') {
        recognition.lang = 'en-IN';
      } else {
        recognition.lang = 'kn-IN';
      }
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        // If hands-free is enabled and AI is not speaking and no pending submission, gently maintain listening
        if (isOpenRef.current && handsFreeRef.current && !isSpeakingRef.current && !loading) {
          setTimeout(() => {
            if (isOpenRef.current && handsFreeRef.current && !isSpeakingRef.current && !isListeningRef.current && !loading) {
              try {
                recognition.start();
              } catch {}
            }
          }, 350);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        isListeningRef.current = false;
        if (event.error === 'no-speech' && isOpenRef.current && handsFreeRef.current && !isSpeakingRef.current && !loading) {
          setTimeout(() => {
            if (isOpenRef.current && handsFreeRef.current && !isSpeakingRef.current && !isListeningRef.current && !loading) {
              try { recognition.start(); } catch {}
            }
          }, 350);
        }
      };

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
      isListeningRef.current = false;
    }
  };

  // Dispatch Utterance to GPT-Live-1 Engine & Backend Tools
  const handleSendUtterance = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    stopSpeaking();
    unlockBrowserAudio();

    const curTurnTime = formatCallTime(callSeconds);
    dialogueTurnsRef.current.push({
      speaker: 'PATIENT',
      text: query,
      timestamp: curTurnTime
    });

    setMessages((prev) => [...prev, { sender: 'user', textKn: query, textEn: query }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiClient.processVoiceUtterance(sessionId, query);
      const aiTurnTime = formatCallTime(callSeconds);
      dialogueTurnsRef.current.push({
        speaker: 'AI_RECEPTIONIST',
        text: `${res.promptKannada} / ${res.promptEnglish}`,
        timestamp: aiTurnTime
      });

      if (res.appointment) {
        setConfirmedAppointment(res.appointment);
        saveCurrentCallRecord(res.appointment);
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          textKn: res.promptKannada,
          textEn: res.promptEnglish
        }
      ]);
      speakResponse(res.promptKannada, res.promptEnglish);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          textKn: "ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
          textEn: "Sorry, an error occurred. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    saveCurrentCallRecord();
    stopSpeaking();
    setConfirmedAppointment(null);
    const newId = `vsession-${Date.now()}`;
    setSessionId(newId);
    setMessages([initialGreeting]);
    dialogueTurnsRef.current = [
      {
        speaker: 'AI_RECEPTIONIST',
        text: initialGreeting.textKn + (initialGreeting.textEn ? ` / ${initialGreeting.textEn}` : ''),
        timestamp: '00:00'
      }
    ];
    setStep('language_select');
  };

  const handleStartConversation = (mode: 'KN' | 'EN') => {
    setLanguageMode(mode);
    languageModeRef.current = mode;
    setVoiceSettings({
      rate: 1.0,
      pitch: 1.0,
      engine: 'browser_neural',
      voisLabsVoiceId: mode === 'KN' ? 'voislabs-kannada-female-1' : 'voislabs-english-female-1',
      voisLabsTone: 'neutral'
    });
    setMessages([initialGreeting]);
    dialogueTurnsRef.current = [
      {
        speaker: 'AI_RECEPTIONIST',
        text: initialGreeting.textKn + (initialGreeting.textEn ? ` / ${initialGreeting.textEn}` : ''),
        timestamp: '00:00'
      }
    ];
    setStep('conversation');
  };

  const replayLastMessage = () => {
    const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'bot');
    if (lastBotMsg) {
      speakResponse(lastBotMsg.textKn, lastBotMsg.textEn);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white rounded-3xl max-w-lg w-full shadow-2xl border border-cyan-500/20 relative flex flex-col h-[670px] max-h-[94vh] overflow-hidden">
        

        {step === 'language_select' ? (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Choose your language</h2>
              <p className="text-slate-400 font-semibold text-lg">ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</p>
            </div>
            
            <div className="w-full space-y-4 pt-4">
              <button
                onClick={() => handleStartConversation('KN')}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"
              >
                <span>ಕನ್ನಡ (Kannada)</span>
                <span className="text-emerald-200 text-sm opacity-80">VoisLabs AI</span>
              </button>
              
              <button
                onClick={() => handleStartConversation('EN')}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"
              >
                <span>English</span>
                <span className="text-blue-200 text-sm opacity-80">VoisLabs AI</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sleek Header */}
            <div className="px-5 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-cyan-200"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
    
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm tracking-tight text-white">We Care AI</span>
                    <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      GPT-Live-1
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {languageMode === 'KN' ? 'ಕನ್ನಡ (VoisLabs)' : 'English (VoisLabs)'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">⏱️ {formatCallTime(callSeconds)}</span>
                  </div>
                </div>
              </div>
    
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setIsMuted(!isMuted);
                  }}
                  title={isMuted ? "Unmute Voice" : "Mute Voice"}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-rose-400"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-emerald-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                  )}
                </button>
    
                <button
                  onClick={resetSession}
                  title="Restart Call"
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                </button>
    
                <button
                  onClick={async () => {
                    stopSpeaking();
                    await saveCurrentCallRecord();
                    onClose();
                  }}
                  title="End Call and save to Receptionist Desk"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer ml-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
                  <span>End</span>
                </button>
              </div>
            </div>

        {/* Central Siri-Style Reactive Soundwave & Orb */}
        <div className="py-3.5 px-6 bg-gradient-to-b from-slate-900/60 to-transparent flex flex-col items-center justify-center relative shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Ambient Pulsing Glow Aura */}
            <div
              className={`absolute -inset-4 rounded-full blur-xl transition-opacity duration-500 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-blue-500/40 opacity-100 animate-pulse'
                  : isListening
                  ? 'bg-gradient-to-r from-rose-500/40 via-amber-500/40 to-pink-500/40 opacity-100 animate-pulse'
                  : 'bg-cyan-500/10 opacity-50'
              }`}
            />

            {/* Glowing Orb Button */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  replayLastMessage();
                }
              }}
              title={isSpeaking ? "Click to Stop Speaking" : "Click to Replay Voice"}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-2 cursor-pointer ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 scale-105 shadow-emerald-500/50 ring-4 ring-emerald-400/20'
                  : isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-600 border-rose-300 scale-110 shadow-rose-500/50 ring-4 ring-rose-400/20'
                  : loading
                  ? 'bg-gradient-to-tr from-indigo-700 to-blue-600 border-indigo-300 animate-pulse'
                  : 'bg-slate-800/90 border-slate-700/80 hover:border-cyan-400 hover:scale-105'
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="w-9 h-9 text-white animate-bounce" />
              ) : isListening ? (
                <Mic className="w-9 h-9 text-white animate-pulse" />
              ) : (
                <Zap className="w-8 h-8 text-cyan-300" />
              )}
            </button>
          </div>

          {/* Dynamic Audio Equalizer Bars */}
          <div className="flex items-center gap-1.5 h-5 mt-2.5">
            {[40, 75, 100, 60, 90, 45, 80].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? 'bg-emerald-400 animate-pulse'
                    : isListening
                    ? 'bg-rose-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isSpeaking || isListening ? `${(h * 0.20) + 5}px` : '4px',
                  animationDelay: `${i * 120}ms`
                }}
              />
            ))}
          </div>

          {/* Status Label Banner */}
          <div className="mt-1 text-center">
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              {isSpeaking ? (
                <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>
                    {languageMode === 'KN'
                      ? '🔊 AI ಮಾತನಾಡುತ್ತಿದೆ... ದಯವಿಟ್ಟು ಆಲಿಸಿ'
                      : languageMode === 'EN'
                      ? '🔊 AI Speaking... Listen to prompt'
                      : '🔊 AI Speaking in Kannada & English...'}
                  </span>
                </span>
              ) : isListening ? (
                <span className="text-rose-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>
                    {languageMode === 'KN'
                      ? '🎙️ ಮೈಕ್ ಲೈವ್ ಆಗಿದೆ... ನಿಮ್ಮ ಉತ್ತರ ಹೇಳಿ'
                      : languageMode === 'EN'
                      ? '🎙️ Mic Live (Hands-Free)... Speak your answer now'
                      : '🎙️ Mic Live... Speak your answer now'}
                  </span>
                </span>
              ) : loading ? (
                <span className="text-cyan-400 flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current animate-spin" />
                  <span>⚡ GPT-Live-1 checking hospital slots...</span>
                </span>
              ) : (
                <span className="text-emerald-400/90 flex items-center justify-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hands-Free Active • Mic automatically opens when AI finishes</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Scrollable Dialogue Subtitles Transcript */}
        <div className="flex-1 bg-slate-950/70 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-lg ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-bl-sm backdrop-blur-md'
                }`}
              >
                {/* Bot Tag */}
                {m.sender === 'bot' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>GPT-Live-1 Voice</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{languageMode === 'KN' ? 'ಕನ್ನಡ' : languageMode === 'EN' ? 'English' : 'Bilingual'}</span>
                  </div>
                )}

                {/* Primary Content based on Selected Language Mode */}
                {languageMode === 'EN' ? (
                  <>
                    <div className="font-semibold text-white text-[13px] leading-snug">
                      {m.textEn || m.textKn}
                    </div>
                    {m.textKn && m.textKn !== m.textEn && (
                      <div className="text-[11px] text-slate-400 font-normal pt-1.5 border-t border-slate-800/80 mt-1.5">
                        {m.textKn}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-white text-[13px] leading-snug">
                      {m.textKn}
                    </div>
                    {m.textEn && m.textEn !== m.textKn && (
                      <div className="text-[11px] text-blue-200/90 font-medium italic pt-1.5 border-t border-slate-800/80 mt-1.5">
                        {m.textEn}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Stored Appointment Voucher Card */}
          {confirmedAppointment && (
            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-emerald-200 animate-in zoom-in-95 space-y-3 my-2 backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Appointment Confirmed</span>
                </div>
                <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
                  Token: {confirmedAppointment.tokenNumber || 'T-01'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-300 truncate">
                    <strong className="text-white">{confirmedAppointment.patientName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-300 truncate">{confirmedAppointment.patientPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    Doctor: <strong className="text-emerald-300">{confirmedAppointment.doctorName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-300">
                    Slot: <strong className="text-white">{confirmedAppointment.preferredDate} at {confirmedAppointment.preferredTime}</strong>
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Recorded live on Receptionist Desk & SMS notification sent.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Collapsible Keyboard Typing Drawer */}
        {showKeyboardInput && (
          <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 animate-in slide-in-from-bottom-2 duration-150">
            <input
              type="text"
              placeholder={languageMode === 'EN' ? "Type response (e.g. Ramesh / 9876543210)..." : "ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ (ಉದಾ: ರಮೇಶ್ / 9876543210)..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendUtterance()}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
            <button
              onClick={() => handleSendUtterance()}
              disabled={!inputText.trim() || loading}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeyboardInput(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl"
              title="Hide Keyboard"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Call Control Dock */}
        <div className="px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between">
          {/* Keyboard Toggle */}
          <button
            onClick={() => setShowKeyboardInput(!showKeyboardInput)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showKeyboardInput
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Type Response"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Type</span>
          </button>

          {/* Central Big Mic Action Button (Hands-Free Reactive) */}
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
                startListening();
              } else if (isListening) {
                if (recognitionRef.current) {
                  try { recognitionRef.current.abort(); } catch {}
                }
                setIsListening(false);
                isListeningRef.current = false;
              } else {
                startListening();
              }
            }}
            className={`px-6 py-3 rounded-full font-bold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 shadow-xl cursor-pointer active:scale-95 ${
              isSpeaking
                ? 'bg-slate-800 border-2 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20'
                : isListening
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/40'
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
                ? 'AI Speaking... (Tap to Interrupt)'
                : isListening
                ? (languageMode === 'KN' ? '🎙️ ಆಲಿಸುತ್ತಿದೆ... ಮಾತನಾಡಿ' : '🎙️ Listening... (Speak Now)')
                : (languageMode === 'KN' ? '🎙️ ಹ್ಯಾಂಡ್ಸ್-ಫ್ರೀ ಮೈಕ್ ಲೈವ್' : '🎙️ Hands-Free Mic Live')}
            </span>
          </button>

          {/* Emergency Notice Pill */}
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="text-amber-400 font-bold">108</span>
            <span className="hidden sm:inline">Emergency</span>
          </div>
        </div>

        {/* Emergency Disclaimer Banner */}
        <div className="bg-slate-950 px-4 py-1 text-center border-t border-slate-900 text-[10px] text-slate-500">
          OPD Appointments only. In medical emergency call 108 or hospital casualty immediately.
        </div>
          </>
        )}
      </div>
    </div>
  );
};
