import React, { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Phone, PhoneOff, Mic, Sparkles, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

type Conn = { token: string; url: string; room: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CallAgent: React.FC<Props> = ({ isOpen, onClose }) => {
  const [conn, setConn] = useState<Conn | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function startCall() {
    setLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/voice/token', { method: 'POST' });
      const data = await r.json();
      setConn(data);
    } catch (err) {
      console.error('Failed to get voice token:', err);
      alert('Could not connect to LiveKit voice server. Please check backend.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-800 relative flex flex-col h-[580px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Phone className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">LiveKit Voice Receptionist</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Kannada + English
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Bilingual OPD Booking Agent</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!conn ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
            <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-inner">
              <Mic className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-lg text-white">Browser AI Voice Assistant</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Speak naturally in Kannada or English to check doctor availability, OPD time slots, and book appointments.
              </p>
            </div>

            <button
              onClick={startCall}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Phone className="w-4 h-4" />
              <span>{loading ? 'Connecting Room...' : 'Start Voice Call'}</span>
            </button>
          </div>
        ) : (
          <LiveKitRoom
            token={conn.token}
            serverUrl={conn.url}
            connect
            audio
            onDisconnected={() => setConn(null)}
            className="flex-1 flex flex-col justify-between pt-4"
          >
            <RoomAudioRenderer />
            <AgentPanel onEndCall={() => setConn(null)} />
          </LiveKitRoom>
        )}

        {/* Security & Emergency Banner */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real-time Double-Booking Guard
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5" /> Emergency: 108
          </span>
        </div>
      </div>
    </div>
  );
};

function AgentPanel({ onEndCall }: { onEndCall: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <div className="flex-1 flex flex-col justify-between py-4">
      {/* Audio Visualizer Orb */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-full max-w-xs h-24 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800 p-4">
          <BarVisualizer
            state={state}
            trackRef={audioTrack}
            barCount={7}
            className="h-16 w-full"
          />
        </div>

        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.2 rounded-full bg-slate-800 text-slate-200 border border-slate-700 inline-flex items-center gap-1.5">
            {state === 'listening' && <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
            {state === 'thinking' && <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
            {state === 'speaking' && <Phone className="w-3.5 h-3.5 text-blue-400 animate-bounce" />}
            
            {state === 'listening' ? 'Listening (Speak Now)' :
             state === 'thinking' ? 'AI Assistant Thinking...' :
             state === 'speaking' ? 'AI Speaking' : 'Connecting to LiveKit Room...'}
          </span>
        </div>
      </div>

      {/* Disconnect Action */}
      <button
        onClick={onEndCall}
        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 text-xs active:scale-98 cursor-pointer"
      >
        <PhoneOff className="w-4 h-4" />
        <span>🔴 Disconnect Call</span>
      </button>
    </div>
  );
}
