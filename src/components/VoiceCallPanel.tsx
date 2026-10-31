import React, { useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { AlertCircle, Loader2, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

/**
  * Live voice call with the hospital's ElevenLabs agent (WebSocket, in the browser).
  * The agent itself, its tools (voice-tools Edge Function) and the post-call log
  * to Reception (voice-call-log Edge Function) are configured server-side; this
  * component only needs the public agent ID. No ElevenLabs key reaches the browser.
  */

const AGENT_ID: string = (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID ?? '';
const RECEPTION_PHONE = '+91 88677 55541';

interface Props {
  language: 'KN' | 'EN';
}

interface Line {
  id: number;
  role: 'agent' | 'user';
  text: string;
}

const formatTime = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

const CallInner: React.FC<Props> = ({ language }) => {
  const kn = language === 'KN';
  const [lines, setLines] = useState<Line[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onMessage: ({ message, role, event_id }) => {
      if (!message?.trim()) return;
      setLines((prev) => [...prev, { id: event_id ?? Date.now(), role, text: message }]);
    },
    onError: (message: string) => setError(message || 'The call could not continue.'),
  });

  const { status, isSpeaking, isMuted, setMuted, startSession, endSession } = conversation;
  const connected = status === 'connected';
  const connecting = status === 'connecting';

  useEffect(() => {
    if (!connected) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Closing the panel ends the call.
  useEffect(() => () => endSession(), [endSession]);

  const start = async () => {
    setError(null);
    setLines([]);
    setSeconds(0);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        kn
          ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಲಾಗಿಲ್ಲ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಅನುಮತಿಸಿ ಅಥವಾ "ಬುಕಿಂಗ್ & ಚಾಟ್" ಬಳಸಿ.'
          : 'Microphone access was blocked. Allow it in your browser settings, or use Book & Chat instead.'
      );
      return;
    }
    // WebSocket, not WebRTC: browsers always send the Origin header on WebSocket
    // connections, which the agent's domain allowlist requires.
    startSession({
      agentId: AGENT_ID,
      connectionType: 'websocket',
      dynamicVariables: { preferred_language: kn ? 'Kannada' : 'English' },
    });
  };

  if (!AGENT_ID) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Phone className="w-10 h-10 text-slate-500" />
        <p className="text-sm text-slate-600 max-w-xs">
          {kn
            ? `ಧ್ವನಿ ಕರೆ ಸೇವೆ ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯ. ಈಗ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಾಗಿ "ಬುಕಿಂಗ್ & ಚಾಟ್" ಬಳಸಿ ಅಥವಾ ${RECEPTION_PHONE} ಗೆ ಕರೆ ಮಾಡಿ.`
            : `Voice calling is being set up. For now, use Book & Chat or call reception on ${RECEPTION_PHONE}.`}
        </p>
      </div>
    );
  }

  if (!connected && !connecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-24 h-24 rounded-full bg-[#195fbd] flex items-center justify-center shadow-sm border-4 border-slate-200">
          <Phone className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h4 className="font-bold text-lg text-[#10294c]">
            {kn ? 'ಆಸ್ಪತ್ರೆ ರಿಸೆಪ್ಷನಿಸ್ಟ್‌ನೊಂದಿಗೆ ಮಾತನಾಡಿ' : 'Talk to the hospital receptionist'}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {kn
              ? 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ ಅಥವಾ ಆಸ್ಪತ್ರೆ ಮಾಹಿತಿ ಪಡೆಯಿರಿ.'
              : 'Speak in Kannada or English to book a doctor appointment or ask about the hospital.'}
          </p>
        </div>
        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
          {kn
            ? 'ಇದು ಸ್ವಯಂಚಾಲಿತ AI ಸಹಾಯಕ. ನಿಮ್ಮ ಬುಕಿಂಗ್ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಕರೆಯ ಲಿಖಿತ ದಾಖಲೆ ಆಸ್ಪತ್ರೆ ರಿಸೆಪ್ಷನ್‌ನೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗುತ್ತದೆ. ವೈದ್ಯಕೀಯ ಸಲಹೆ ನೀಡುವುದಿಲ್ಲ. ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ 108 ಅಥವಾ '
            : 'This is an automated AI assistant. A transcript of the call is shared with hospital reception to process your booking. It does not give medical advice. In an emergency call 108 or '}
          {RECEPTION_PHONE}
          {kn ? ' ಗೆ ಕರೆ ಮಾಡಿ.' : '.'}
        </p>
        {error && (
          <div className="w-full max-w-xs p-2.5 rounded-xl text-[11px] flex items-start gap-2 bg-rose-50 text-rose-700 border border-rose-200 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            <span>{error}</span>
          </div>
        )}
        <button
          onClick={start}
          className="w-full max-w-xs bg-[#195fbd] hover:bg-[#124a96] active:scale-98 text-white font-bold py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2.5 text-sm cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>{kn ? 'ಕರೆ ಪ್ರಾರಂಭಿಸಿ' : 'Start call'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-colors duration-300 ${
              connecting
                ? 'bg-slate-50 border-2 border-slate-200'
                : isSpeaking
                ? 'bg-[#195fbd]'
                : 'bg-blue-50 border-2 border-blue-200'
            }`}
          >
            {connecting ? (
              <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white" />
            ) : isMuted ? (
              <MicOff className="w-12 h-12 text-slate-500" />
            ) : (
              <Mic className="w-12 h-12 text-[#195fbd]" />
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-emerald-700">
            {connecting
              ? kn ? 'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...' : 'Connecting...'
              : isSpeaking
              ? kn ? 'ರಿಸೆಪ್ಷನಿಸ್ಟ್ ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ' : 'Receptionist is speaking'
              : isMuted
              ? kn ? 'ಮೈಕ್ ಮ್ಯೂಟ್ ಆಗಿದೆ' : 'Microphone muted'
              : kn ? 'ಕೇಳುತ್ತಿದೆ... ಮಾತನಾಡಿ' : 'Listening... go ahead'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{formatTime(seconds)}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 px-2 py-1">
        {lines.map((line) => (
          <div key={line.id} className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                line.role === 'user'
                  ? 'bg-[#195fbd] text-white rounded-br-none'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-none'
              }`}
            >
              {line.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
        <button
          onClick={() => setMuted(!isMuted)}
          disabled={!connected}
          className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 ${
            isMuted ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-600 hover:text-[#10294c] hover:bg-slate-200' }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isMuted ? (kn ? 'ಅನ್‌ಮ್ಯೂಟ್' : 'Unmute') : kn ? 'ಮ್ಯೂಟ್' : 'Mute'}</span>
        </button>
        <button
          onClick={endSession}
          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{kn ? 'ಕರೆ ಮುಗಿಸಿ' : 'End call'}</span>
        </button>
      </div>
    </div>
  );
};

export const VoiceCallPanel: React.FC<Props> = (props) => (
  <ConversationProvider>
    <CallInner {...props} />
  </ConversationProvider>
);
