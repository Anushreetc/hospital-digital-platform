import React, { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { elevenLabsVoice } from '../services/elevenLabsVoice';
import { VoiceCallPanel } from './VoiceCallPanel';

/**
 * Floating "Call Reception" launcher and the call window around VoiceCallPanel.
 * Other parts of the site open it by dispatching one of the window events below.
 */
const OPEN_EVENTS = ['open-voice-agent', 'open-voice-call', 'open-hospital-assistant', 'open-call-agent'];

export const UnifiedVoiceAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'KN' | 'EN'>('KN');

  const open = () => {
    setIsOpen(true);
    elevenLabsVoice.unlockAudio();
  };

  useEffect(() => {
    OPEN_EVENTS.forEach((name) => window.addEventListener(name, open));
    return () => OPEN_EVENTS.forEach((name) => window.removeEventListener(name, open));
  }, []);

  return (
    <>
      {!isOpen && (
        <button
          onClick={open}
          className="fixed bottom-5 right-5 z-40 bg-[#195fbd] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-3 border-2 border-slate-200 cursor-pointer"
          aria-label="Call hospital reception"
        >
          <div className="relative flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full " />
          </div>
          <div className="text-left hidden xs:block">
            <div className="text-xs font-black tracking-wide">Call Reception</div>
            <div className="text-[10px] text-blue-100 font-semibold tracking-wide">ಕನ್ನಡ · English · Hands-free</div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white text-[#10294c] rounded-3xl max-w-lg w-full shadow-sm border border-slate-200 relative flex flex-col h-[680px] max-h-[96vh] overflow-hidden">
            <div className="px-4 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#195fbd] flex items-center justify-center shadow-sm ">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#10294c]">We Care Hospital Reception</h3>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                    <span>Doddaballapura</span>
                    <span className="text-slate-600">•</span>
                    <span>ಕನ್ನಡ · English</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      setLanguage('KN');
                      elevenLabsVoice.unlockAudio();
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      language === 'KN' ? 'bg-[#195fbd] text-white shadow-sm' : 'text-slate-500 hover:text-[#10294c]' }`}
                  >
                    ಕನ್ನಡ
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('EN');
                      elevenLabsVoice.unlockAudio();
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      language === 'EN' ? 'bg-[#195fbd] text-white shadow-sm' : 'text-slate-500 hover:text-[#10294c]' }`}
                  >
                    EN
                  </button>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 hover:text-[#10294c] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <VoiceCallPanel language={language} />
          </div>
        </div>
      )}
    </>
  );
};
