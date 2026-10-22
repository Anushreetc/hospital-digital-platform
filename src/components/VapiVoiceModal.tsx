import React, { useState, useEffect, useRef } from 'react';
import { VapiCallState, VapiTranscriptMessage } from '../services/vapi';
import { apiClient } from '../services/apiClient';
import { HospitalInfo } from '../types';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  RefreshCw,
  Send,
  Volume2 as VolumeIcon,
  Code2,
  Workflow,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';

import { playBilingualAudio, stopKannadaAudio, AudioLanguageMode } from '../services/kannadaTts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hospitalInfo: HospitalInfo;
}

export const VapiVoiceModal: React.FC<Props> = ({ isOpen, onClose, hospitalInfo }) => {
  const [activeTab, setActiveTab] = useState<'CALL_SIMULATOR' | 'INTEGRATION_HUB'>('CALL_SIMULATOR');
  const [languageMode, setLanguageMode] = useState<AudioLanguageMode>('BILINGUAL');
  const [callState, setCallState] = useState<VapiCallState>('IDLE');
  const [transcripts, setTranscripts] = useState<VapiTranscriptMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(`vsession-${Date.now()}`);
  const [isListeningNative, setIsListeningNative] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  
  // Integration Tab State
  const [copiedVapi, setCopiedVapi] = useState(false);
  const [copiedN8n, setCopiedN8n] = useState(false);
  const [testAction, setTestAction] = useState<'createAppointment' | 'searchDoctors' | 'checkDoctorAvailability'>('createAppointment');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, callState]);

  // Guaranteed Audible Bilingual (Kannada + English) Speech Synthesis
  const speakBilingualResponse = (textKn: string, textEn?: string) => {
    playBilingualAudio(
      textKn,
      textEn,
      languageMode,
      () => setCallState('SPEAKING'),
      () => setCallState('CONNECTED')
    );
  };

  // Web Speech Recognition (STT)
  const startNativeListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser speech recognition is not supported in this browser. Please use text input below.');
      return;
    }

    try {
      stopKannadaAudio();
      if (recognitionRef.current) recognitionRef.current.abort();

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = languageMode === 'KN' ? 'kn-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListeningNative(true);
        setCallState('LISTENING');
      };

      recognition.onend = () => {
        setIsListeningNative(false);
        setCallState(curr => (curr === 'LISTENING' ? 'CONNECTED' : curr));
      };

      recognition.onerror = (e: any) => {
        console.warn('[STT Error]', e);
        setIsListeningNative(false);
        setCallState('CONNECTED');
      };

      recognition.onresult = (event: any) => {
        const userText = event.results[0][0].transcript;
        if (userText) {
          handleNativeUserUtterance(userText);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('[STT Exception]', e);
      setIsListeningNative(false);
      setCallState('CONNECTED');
    }
  };

  const handleNativeUserUtterance = async (query: string) => {
    if (!query.trim()) return;

    setTranscripts(prev => [...prev, { role: 'user', transcript: query }]);
    setCallState('THINKING');
    setInputText('');

    try {
      const res = await apiClient.processVoiceUtterance(sessionId, query);
      const botText = `${res.promptKannada}\n\n${res.promptEnglish}`;
      
      setTranscripts(prev => [
        ...prev,
        {
          role: 'assistant',
          transcript: botText,
          textKn: res.promptKannada,
          textEn: res.promptEnglish
        }
      ]);
      speakBilingualResponse(res.promptKannada, res.promptEnglish);
    } catch (err: any) {
      const errKn = 'ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.';
      const errEn = 'Sorry, an error occurred. Please try again.';
      setTranscripts(prev => [
        ...prev,
        {
          role: 'assistant',
          transcript: `${errKn}\n\n${errEn}`,
          textKn: errKn,
          textEn: errEn
        }
      ]);
      setCallState('CONNECTED');
    }
  };

  // Initialize Call when Modal opens
  useEffect(() => {
    if (!isOpen) {
      stopKannadaAudio();
      if (recognitionRef.current) recognitionRef.current.abort();
      return;
    }

    initNativeEngine();

    return () => {
      stopKannadaAudio();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [isOpen, hospitalInfo.name, languageMode]);

  const initNativeEngine = () => {
    setCallState('CONNECTED');
    const newSession = `vsession-${Date.now()}`;
    setSessionId(newSession);

    const welcomeKn = 'ನಮಸ್ಕಾರ ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು';
    const welcomeEn = `Hello and welcome to ${hospitalInfo.name}. What is your full name for the appointment booking`;

    setTranscripts([
      {
        role: 'assistant',
        transcript: `${welcomeKn}\n\n${welcomeEn}`,
        textKn: welcomeKn,
        textEn: welcomeEn
      }
    ]);

    speakBilingualResponse(welcomeKn, welcomeEn);
  };

  const handleEndCall = () => {
    stopKannadaAudio();
    if (recognitionRef.current) recognitionRef.current.abort();
    setCallState('ENDED');
  };

  const handleRestartCall = () => {
    setTranscripts([]);
    initNativeEngine();
  };

  const handleRunWebhookTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      let params = {};
      if (testAction === 'createAppointment') {
        params = {
          patientName: 'Kavitha Gowda',
          phone: '9845012345',
          departmentId: 'dept-1',
          doctorId: 'doc-1',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '10:00 AM',
          reason: 'Routine Consultation',
          language: 'kn'
        };
      } else if (testAction === 'searchDoctors') {
        params = { department: 'Cardiology' };
      } else if (testAction === 'checkDoctorAvailability') {
        params = {
          doctorId: 'doc-1',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        };
      }

      const res = await fetch('/api/telephony/simulate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: testAction,
          parameters: params,
          callerNumber: '+919845012345'
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const copyConfig = (type: 'vapi' | 'n8n') => {
    if (type === 'vapi') {
      fetch('/api/telephony/vapi/assistant-config')
        .then(r => r.json())
        .then(d => {
          navigator.clipboard.writeText(JSON.stringify(d.config || d, null, 2));
          setCopiedVapi(true);
          setTimeout(() => setCopiedVapi(false), 2000);
        });
    } else {
      navigator.clipboard.writeText(
        JSON.stringify(
          {
            name: 'Hospital Voice Assistant & Appointment Booking Router',
            info: 'Import this workflow into n8n using n8n_voice_appointment_workflow.json'
          },
          null,
          2
        )
      );
      setCopiedN8n(true);
      setTimeout(() => setCopiedN8n(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 relative flex flex-col h-[660px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Phone className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">AI Phone Calling Assistant</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Bilingual Voice
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Bilingual Inbound OPD Booking Receptionist</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector Pills */}
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setLanguageMode('BILINGUAL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  languageMode === 'BILINGUAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔊 ಕನ್ನಡ + EN
              </button>
              <button
                onClick={() => setLanguageMode('KN')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  languageMode === 'KN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setLanguageMode('EN')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  languageMode === 'EN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => {
                handleEndCall();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 pt-3 pb-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('CALL_SIMULATOR')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CALL_SIMULATOR'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Live Call Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('INTEGRATION_HUB')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'INTEGRATION_HUB'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Vapi & n8n Integration Hub</span>
          </button>
        </div>

        {/* TAB 1: LIVE CALL SIMULATOR */}
        {activeTab === 'CALL_SIMULATOR' && (
          <div className="flex-1 flex flex-col justify-between pt-2 overflow-hidden">
            {/* Dynamic Voice Status Orb Visualizer */}
            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <div className="relative">
                {callState === 'SPEAKING' && (
                  <div className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping"></div>
                )}
                {callState === 'LISTENING' && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-pulse"></div>
                )}

                <button
                  onClick={() => {
                    const lastAssistant = [...transcripts].reverse().find(t => t.role === 'assistant');
                    if (lastAssistant && (lastAssistant.textKn || lastAssistant.textEn)) {
                      speakBilingualResponse(lastAssistant.textKn || '', lastAssistant.textEn);
                    } else {
                      startNativeListening();
                    }
                  }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 cursor-pointer ${
                    callState === 'SPEAKING'
                      ? 'bg-blue-600 border-blue-400 scale-105 shadow-blue-500/50'
                      : callState === 'LISTENING'
                      ? 'bg-emerald-600 border-emerald-400 scale-110 shadow-emerald-500/50'
                      : callState === 'THINKING'
                      ? 'bg-indigo-600 border-indigo-400'
                      : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:scale-105'
                  }`}
                  title="Click to replay spoken voice"
                >
                  {callState === 'SPEAKING' && <Volume2 className="w-7 h-7 text-white animate-bounce" />}
                  {callState === 'LISTENING' && <Mic className="w-7 h-7 text-white animate-pulse" />}
                  {callState === 'THINKING' && <Sparkles className="w-7 h-7 text-indigo-300 animate-spin" />}
                  {(callState === 'CONNECTED' || callState === 'IDLE' || callState === 'ENDED') && (
                    <VolumeIcon className="w-7 h-7 text-emerald-400" />
                  )}
                </button>
              </div>

              {/* Status Label Banner & Interactive Buttons */}
              <div className="text-center space-y-1 flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 inline-block">
                  {callState === 'CONNECTED' && 'Connected • Tap to speak or listen'}
                  {callState === 'LISTENING' && 'Listening... Speak Your Request'}
                  {callState === 'THINKING' && 'Checking Schedules & Booking OPD...'}
                  {callState === 'SPEAKING' && '🔊 AI Speaking Voice...'}
                  {callState === 'ENDED' && 'Call ended'}
                </span>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      const lastAssistant = [...transcripts].reverse().find(t => t.role === 'assistant');
                      if (lastAssistant && (lastAssistant.textKn || lastAssistant.textEn)) {
                        speakBilingualResponse(lastAssistant.textKn || '', lastAssistant.textEn);
                      }
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>🔊 Listen / Replay Voice</span>
                  </button>

                  <button
                    onClick={startNativeListening}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-white" />
                    <span>🎙️ Speak Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Conversation Transcript Box */}
            <div className="flex-1 bg-slate-950/90 rounded-2xl p-3.5 border border-slate-800 overflow-y-auto space-y-2.5 text-xs max-h-[220px]">
              {transcripts.map((t, idx) => (
                <div key={idx} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 leading-relaxed whitespace-pre-line shadow-md ${
                      t.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none font-semibold'
                        : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none font-medium'
                    }`}
                  >
                    {t.transcript}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Text Input & Mic Control */}
            {callState !== 'ENDED' && (
              <div className="pt-2 pb-2 flex items-center space-x-2">
                <button
                  onClick={startNativeListening}
                  className={`p-2.5 rounded-xl text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1 ${
                    isListeningNative ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  title="Click to Speak in Kannada or English"
                >
                  {isListeningNative ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  placeholder="Speak or type (e.g. ರಮೇಶ್ / Ramesh / Cardiology / 10 AM / 9845012345)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputText.trim()) {
                      handleNativeUserUtterance(inputText);
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <button
                  onClick={() => handleNativeUserUtterance(inputText)}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Controls */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Real-time Doctor Availability & Collision Guard</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRestartCall}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                {callState !== 'ENDED' ? (
                  <button
                    onClick={handleEndCall}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End Call</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRestartCall}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Again</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTEGRATION HUB */}
        {activeTab === 'INTEGRATION_HUB' && (
          <div className="flex-1 flex flex-col justify-between pt-3 overflow-y-auto space-y-4 text-xs pr-1">
            {/* Vapi & n8n Quick Export Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-400" /> Vapi Assistant Config
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                    vapi_assistant_config.json
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ready-to-import JSON with bilingual prompts, Kannada VAD, and 7 medical tool schemas.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => copyConfig('vapi')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedVapi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVapi ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <a
                    href="/vapi_assistant_config.json"
                    download="vapi_assistant_config.json"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Workflow className="w-4 h-4 text-indigo-400" /> n8n Automation Workflow
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                    n8n_voice_workflow.json
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Importable n8n pipeline for webhook routing, doctor checking, booking, and SMS triggers.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => copyConfig('n8n')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedN8n ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedN8n ? 'Copied!' : 'Copy Workflow'}</span>
                  </button>
                  <a
                    href="/n8n_voice_appointment_workflow.json"
                    download="n8n_voice_appointment_workflow.json"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Webhook Endpoint URLs */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" /> Webhook Endpoints & URLs
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-emerald-400">POST /api/telephony/vapi/webhook</span>
                  <span className="text-slate-400 text-[10px]">Vapi Server URL</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-indigo-400">POST /api/telephony/n8n/webhook</span>
                  <span className="text-slate-400 text-[10px]">n8n Inbound Action</span>
                </div>
              </div>
            </div>

            {/* Webhook Simulator & Tester */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Interactive Webhook Action Tester
                </span>
                <select
                  value={testAction}
                  onChange={(e: any) => setTestAction(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                >
                  <option value="createAppointment">Test Tool: createAppointment</option>
                  <option value="searchDoctors">Test Tool: searchDoctors</option>
                  <option value="checkDoctorAvailability">Test Tool: checkDoctorAvailability</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunWebhookTest}
                  disabled={testLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Execute Simulated Webhook Call</span>
                </button>
              </div>

              {testResult && (
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 max-h-28 overflow-y-auto">
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Documentation Reference Link */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>View full step-by-step setup guide in CALLING_ASSISTANT_VAPI_N8N_GUIDE.md</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Specs Available
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
