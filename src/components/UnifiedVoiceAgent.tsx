import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mic,
  Volume2,
  VolumeX,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Key,
  Calendar,
  CheckCircle2,
  Check,
  Loader2,
  Clock,
  HeartPulse,
  FlaskConical
} from 'lucide-react';
import { elevenLabsVoice } from '../services/elevenLabsVoice';
import { VoiceCallPanel } from './VoiceCallPanel';
import { Doctor, Department, HospitalInfo } from '../types';
import { publicApi } from '../services/db';

export interface BookingDraft {
  patientName: string;
  patientPhone: string;
  doctorId: string;
  date: string;
  slotTime: string;
  reason: string;
}

export interface AvailableSlot {
  time: string;
  label: string;
  available: number;
}

interface Props {
  hospitalInfo?: HospitalInfo;
  doctors?: Doctor[];
  departments?: Department[];
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const emptyDraft = (): BookingDraft => ({
  patientName: '',
  patientPhone: '',
  doctorId: '',
  date: '',
  slotTime: '',
  reason: 'General consultation'
});

const hospitalToday = () => new Date().toISOString().split('T')[0];
const plusDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const UnifiedVoiceAgent: React.FC<Props> = ({
  hospitalInfo,
  doctors = [],
  departments = []
}) => {
  // Global Panel State
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'call' | 'chat'>('call');
  const [language, setLanguage] = useState<'KN' | 'EN'>('KN');

  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Booking / Chat Mode State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(emptyDraft());
  const [bookingStep, setBookingStep] = useState<
    'welcome' | 'patientName' | 'patientPhone' | 'doctorId' | 'date' | 'slotTime' | 'review' | 'confirmed'
  >('welcome');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [audioReplies, setAudioReplies] = useState(true);

  // Refs
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isOpenRef = useRef(false);
  isOpenRef.current = isOpen;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const nowTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitialChatGreeting = (lang: 'KN' | 'EN'): string =>
    lang === 'KN'
      ? 'ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ಅಥವಾ ಮಾಹಿತಿ ಪಡೆಯಲು ಕೆಳಗಿನ ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಿ ಅಥವಾ ಮಾತನಾಡಿ.'
      : 'Hello! Welcome to We Care Hospital. Use the quick options below or speak to book an appointment or ask questions.';

  // Listen to Window Events to open this single unified panel
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      elevenLabsVoice.unlockAudio();
    };
    const handleOpenCall = () => {
      setIsOpen(true);
      setActiveTab('call');
      elevenLabsVoice.unlockAudio();
    };

    window.addEventListener('open-voice-agent', handleOpen);
    window.addEventListener('open-voice-call', handleOpenCall);
    window.addEventListener('open-hospital-assistant', handleOpen);
    window.addEventListener('open-call-agent', handleOpenCall);

    return () => {
      window.removeEventListener('open-voice-agent', handleOpen);
      window.removeEventListener('open-voice-call', handleOpenCall);
      window.removeEventListener('open-hospital-assistant', handleOpen);
      window.removeEventListener('open-call-agent', handleOpenCall);
    };
  }, []);

  // Initialize messages on first load or language switch
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'chat-init',
          sender: 'bot',
          text: getInitialChatGreeting(language),
          time: nowTime()
        }
      ]);
    }
  }, [language]);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSpeaking, activeTab]);

  // Speak chat replies with device speech
  const speakText = (text: string, onDone?: () => void) => {
    if (!audioReplies) {
      onDone?.();
      return;
    }

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
    setVoiceError(null);

    elevenLabsVoice.speak(text, {
      isKannada: language === 'KN',
      onStart: () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      onEnd: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        onDone?.();
      },
      onError: (err: any) => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        const msg = typeof err === 'string' ? err : err?.message || 'Voice speech notice';
        setVoiceError(msg);
        onDone?.();
      }
    });
  };

  // Chat Mode: Send & Advance Booking
  const handleChatSend = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isBusy) return;

    setChatInputText('');
    setChatMessages((m) => [
      ...m,
      { id: `chat-u-${Date.now()}`, sender: 'user', text, time: nowTime() }
    ]);

    // Emergency
    if (/emergency|ambulance|ತುರ್ತು|ಆಂಬುಲೆನ್ಸ್/i.test(text)) {
      const emergencyReply =
        language === 'KN'
          ? 'ತುರ್ತು ಚಿಕಿತ್ಸೆಗಾಗಿ ಈಗಲೇ ನಮ್ಮ 24/7 ತುರ್ತು ಸಂಖ್ಯೆ +91 88677 55541 ಅಥವಾ ಆಂಬುಲೆನ್ಸ್ +91 93530 61993 ಗೆ ಕರೆ ಮಾಡಿ.'
          : 'For medical emergencies, please call our 24/7 Emergency unit at +91 88677 55541 or Ambulance at +91 93530 61993 immediately.';
      botReplyChat(emergencyReply);
      return;
    }

    // Address
    if (/address|location|where|ವಿಳಾಸ|ಎಲ್ಲಿದೆ/i.test(text)) {
      const locReply =
        language === 'KN'
          ? 'ನಮ್ಮ ವಿಳಾಸ: ಡಿ ಕ್ರಾಸ್ ಮುಖ್ಯ ರಸ್ತೆ, ಫೆಡರಲ್ ಬ್ಯಾಂಕ್ ಹತ್ತಿರ, ದೊಡ್ಡಬಳ್ಳಾಪುರ, ಕರ್ನಾಟಕ 561203.'
          : 'Our Address: D-Cross Main Road, Near Federal Bank, Doddaballapura, Karnataka 561203.';
      botReplyChat(locReply);
      return;
    }

    // Visiting Hours
    if (/visiting|visit hours|timing|ಭೇಟಿ|ಸಮಯ/i.test(text)) {
      const visitReply =
        language === 'KN'
          ? 'ಸಾಮಾನ್ಯ ವಾರ್ಡ್ ಭೇಟಿ ಸಮಯ: ಬೆಳಗ್ಗೆ 9:00 - 11:00 ಮತ್ತು ಸಂಜೆ 6:00 - 7:00. ಐಸಿಯು ಭೇಟಿ ಸಮಯ: ಸಂಜೆ 5:00 - 6:00.'
          : 'General ward visiting hours: 9:00 AM - 11:00 AM and 6:00 PM - 7:00 PM. ICU visiting: 5:00 PM - 6:00 PM.';
      botReplyChat(visitReply);
      return;
    }

    // Blood Test
    if (/blood|lab|test|pathology|ರಕ್ತ|ಪರೀಕ್ಷೆ/i.test(text)) {
      const labReply =
        language === 'KN'
          ? 'ನಮ್ಮಲ್ಲಿ 24 ಗಂಟೆಗಳ ರಕ್ತ ಪರೀಕ್ಷಾ ಲ್ಯಾಬ್ ಲಭ್ಯವಿದೆ. ಸಿಬಿಸಿ, ಥೈರಾಯ್ಡ್, ಲಿಪಿಡ್ ಮತ್ತು ಕಿಡ್ನಿ ಪರೀಕ್ಷಾ ವರದಿಗಳು ಅದೇ ದಿನ ಲಭ್ಯ.'
          : 'Our 24/7 pathology lab offers comprehensive blood tests (CBC, Thyroid, Lipid, LFT/KFT) with same-day reports.';
      botReplyChat(labReply);
      return;
    }

    // If step is welcome or patientName
    if (bookingStep === 'welcome' || bookingStep === 'patientName') {
      const name = text
        .replace(/^(my name is|i am|i'm|ನನ್ನ ಹೆಸರು|ನಾನು|ಹೆಸರು)\s*/i, '')
        .trim();
      if (name.length >= 2) {
        setBookingDraft((prev: BookingDraft) => ({ ...prev, patientName: name }));
        setBookingStep('patientPhone');
        botReplyChat(
          language === 'KN'
            ? `ಧನ್ಯವಾದಗಳು ${name} ಅವರೇ. ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.`
            : `Thank you ${name}. Please tell me your 10-digit Indian mobile number.`
        );
        return;
      }
    }

    // Phone number step
    if (bookingStep === 'patientPhone') {
      const digits = text.replace(/\D/g, '');
      if (digits.length === 10) {
        setBookingDraft((prev: BookingDraft) => ({ ...prev, patientPhone: digits }));
        setBookingStep('doctorId');
        botReplyChat(
          language === 'KN'
            ? 'ಧನ್ಯವಾದಗಳು. ಯಾವ ತಜ್ಞ ವೈದ್ಯರನ್ನು ಭೇಟಿಯಾಗಲು ಬಯಸುತ್ತೀರಿ? ಕೆಳಗಿನ ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ.'
            : 'Thank you. Which doctor would you like to consult? Please select below.'
        );
        return;
      } else {
        botReplyChat(
          language === 'KN'
            ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.'
            : 'Please enter a valid 10-digit mobile number.'
        );
        return;
      }
    }

    // Default conversational AI answer
    const fallbackRes = elevenLabsVoice.generateHospitalResponse(
      text,
      language === 'KN',
      doctors
    );
    botReplyChat(language === 'KN' ? fallbackRes.textKn : fallbackRes.textEn);
  };

  const botReplyChat = (text: string) => {
    setChatMessages((m) => [
      ...m,
      { id: `chat-b-${Date.now()}`, sender: 'bot', text, time: nowTime() }
    ]);
    speakText(text);
  };

  const handleSelectDoctor = (doc: Doctor) => {
    setBookingDraft((prev: BookingDraft) => ({ ...prev, doctorId: doc.id }));
    setBookingStep('date');
    botReplyChat(
      language === 'KN'
        ? `ಡಾ. ${doc.name} (${doc.specialization}) ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಭೇಟಿಯಾಗಲು ಬಯಸುವ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ.`
        : `Dr. ${doc.name} (${doc.specialization}) selected. Please choose your preferred appointment date.`
    );
  };

  const handleSelectDate = async (dateStr: string) => {
    setBookingDraft((prev: BookingDraft) => ({ ...prev, date: dateStr }));
    setIsBusy(true);
    try {
      const slots = await publicApi.getAvailableSlots(bookingDraft.doctorId, dateStr);
      const openSlots = slots.filter((s: AvailableSlot) => s.available > 0);
      setAvailableSlots(openSlots);
      setBookingStep('slotTime');
      botReplyChat(
        language === 'KN'
          ? `ಈ ದಿನ ${openSlots.length} ಸಮಯಗಳು ಲಭ್ಯವಿವೆ. ನಿಮ್ಮ ಅನುಕೂಲಕರ ಸಮಯವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.`
          : `${openSlots.length} appointment slots available on this date. Please select your time.`
      );
    } catch {
      setBookingStep('slotTime');
      botReplyChat(
        language === 'KN'
          ? 'ಸಮಯ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ರಿಸೆಪ್ಷನ್‌ಗೆ ಕರೆ ಮಾಡಿ.'
          : 'Could not fetch slots. Please choose another date or contact reception.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setBookingDraft((prev: BookingDraft) => ({ ...prev, slotTime: slot.time }));
    setBookingStep('review');
    botReplyChat(
      language === 'KN'
        ? 'ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ರಿಸೆಪ್ಷನ್‌ಗೆ ಕಳುಹಿಸಲು "ದೃಢೀಕರಿಸಿ" ಒತ್ತಿ.'
        : 'Please review your booking details and click Confirm to send to reception.'
    );
  };

  const handleConfirmBooking = async () => {
    setIsBusy(true);
    try {
      const booked = await publicApi.bookAppointment({
        ...bookingDraft,
        source: 'VOICE_AI',
        language: language === 'KN' ? 'KN' : 'EN',
        idempotencyKey: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      });
      setBookingStep('confirmed');
      const confirmMsg =
        language === 'KN'
          ? `ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಆಗಿದೆ! ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ: ${booked.code}. ಟೋಕನ್: ${booked.tokenNumber}.`
          : `Appointment request submitted! Reference Code: ${booked.code}. Token: ${booked.tokenNumber}.`;
      botReplyChat(confirmMsg);
    } catch (e: any) {
      botReplyChat(
        language === 'KN'
          ? 'ಬುಕ್ಕಿಂಗ್ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ರಿಸೆಪ್ಷನ್‌ಗೆ +91 88677 55541 ಕರೆ ಮಾಡಿ.'
          : 'Could not submit request. Please call reception at +91 88677 55541.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetChat = () => {
    setBookingDraft(emptyDraft());
    setBookingStep('welcome');
    setChatMessages([
      {
        id: `chat-init-${Date.now()}`,
        sender: 'bot',
        text: getInitialChatGreeting(language),
        time: nowTime()
      }
    ]);
  };

  const selectedDoctorObj = doctors.find((d) => d.id === bookingDraft.doctorId);

  return (
    <>
      {/* Single Bottom-Right Floating Launcher */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            elevenLabsVoice.unlockAudio();
          }}
          className="fixed bottom-5 right-5 z-40 bg-[#195fbd] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-3 border-2 border-slate-200 cursor-pointer"
          aria-label="Call hospital reception"
        >
          <div className="relative flex items-center justify-center">
            <Phone className="w-5 h-5 text-[#10294c]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full " />
          </div>
          <div className="text-left hidden xs:block">
            <div className="text-xs font-black tracking-wide">Call Reception</div>
            <div className="text-[10px] text-[#10294c] font-semibold tracking-wide">ಕನ್ನಡ · English · Hands-free</div>
          </div>
        </button>
      )}

      {/* Single Unified Voice Agent Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white text-[#10294c] rounded-3xl max-w-lg w-full shadow-sm border border-slate-200 relative flex flex-col h-[680px] max-h-[96vh] overflow-hidden">
            
            {/* Unified Header */}
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

              {/* Header Right Actions */}
              <div className="flex items-center space-x-1.5">
                {/* Language Switcher */}
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

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 hover:text-[#10294c] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('call')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'call'
                    ? 'bg-[#195fbd] text-white shadow-sm '
                    : 'text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'KN' ? 'ವಾಯ್ಸ್ ಕಾಲ್' : 'Voice Call'}</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#195fbd] text-white shadow-sm '
                    : 'text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'KN' ? 'ಬುಕಿಂಗ್ & ಚಾಟ್' : 'Book & Chat'}</span>
              </button>

            </div>

            {/* TAB 1: Live call with the hospital voice agent */}
            {activeTab === 'call' && <VoiceCallPanel language={language} />}

            {/* TAB 2: Interactive Appointment Booking & Chat Mode */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden p-3.5">
                {/* Messages scroll area */}
                <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#195fbd] text-white rounded-br-none'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block text-right">{msg.time}</span>
                      </div>
                    </div>
                  ))}

                  {/* Dynamic Action Options based on bookingStep */}
                  {bookingStep === 'welcome' && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          setBookingStep('patientName');
                          botReplyChat(
                            language === 'KN'
                              ? 'ಖಂಡಿತ! ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ರೋಗಿಯ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'
                              : 'Certainly! Please tell me the patient’s full name to book an appointment.'
                          );
                        }}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{language === 'KN' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book Appointment'}</span>
                      </button>

                      <button
                        onClick={() => handleChatSend('ಭೇಟಿ ಸಮಯ')}
                        className="p-2.5 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-xl text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>{language === 'KN' ? 'ಭೇಟಿ ಸಮಯ' : 'Visiting Hours'}</span>
                      </button>

                      <button
                        onClick={() => handleChatSend('ರಕ್ತ ಪರೀಕ್ಷೆ')}
                        className="p-2.5 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-xl text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2"
                      >
                        <FlaskConical className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>{language === 'KN' ? '24/7 ರಕ್ತ ಪರೀಕ್ಷೆ / ಲ್ಯಾಬ್' : 'Blood Tests & Lab'}</span>
                      </button>

                      <button
                        onClick={() => handleChatSend('ತುರ್ತು ಸಹಾಯ')}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2"
                      >
                        <HeartPulse className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>{language === 'KN' ? 'ತುರ್ತು / ಆಂಬುಲೆನ್ಸ್' : '24/7 Emergency'}</span>
                      </button>
                    </div>
                  )}

                  {/* Doctor Selection Options */}
                  {bookingStep === 'doctorId' && (
                    <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
                      <div className="text-[11px] font-bold text-slate-500">
                        {language === 'KN' ? 'ತಜ್ಞ ವೈದ್ಯರನ್ನು ಆರಿಸಿ:' : 'Select Specialist Doctor:'}
                      </div>
                      {doctors.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectDoctor(doc)}
                          className="w-full p-2.5 bg-slate-50 hover:bg-emerald-100 hover:border-emerald-200 border border-slate-200 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-[#10294c]">Dr. {doc.name}</div>
                            <div className="text-[11px] text-emerald-700">{doc.specialization}</div>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded-md">
                            {doc.experienceYears ? `${doc.experienceYears}+ yrs exp` : doc.qualification || 'Specialist'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Date Selection */}
                  {bookingStep === 'date' && (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 pt-2">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        {language === 'KN' ? 'ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ:' : 'Select Appointment Date:'}
                      </label>
                      <input
                        type="date"
                        min={hospitalToday()}
                        max={plusDays(hospitalToday(), 60)}
                        onChange={(e) => handleSelectDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[#10294c] text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Time Slot Selection */}
                  {bookingStep === 'slotTime' && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold text-slate-500">
                        {language === 'KN' ? 'ಲಭ್ಯವಿರುವ ಸಮಯ:' : 'Available Time Slots:'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => handleSelectSlot(slot)}
                              className="p-2 bg-slate-50 hover:bg-[#195fbd] text-[#10294c] rounded-xl text-xs font-semibold cursor-pointer transition-all border border-slate-200"
                            >
                              {slot.label || slot.time}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-2 text-xs text-slate-500">
                            {language === 'KN'
                              ? 'ಈ ದಿನ ಯಾವುದೇ ಸಮಯ ಖಾಲಿ ಇಲ್ಲ. ಬೇರೆ ದಿನಾಂಕ ಆಯ್ಕೆ ಮಾಡಿ.'
                              : 'No open slots on this date. Please choose another date.'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review & Confirm */}
                  {bookingStep === 'review' && (
                    <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 space-y-2 pt-2">
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'KN' ? 'ಬುಕಿಂಗ್ ಪರಿಶೀಲನೆ' : 'Appointment Summary'}</span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div><strong>Patient:</strong> {bookingDraft.patientName} ({bookingDraft.patientPhone})</div>
                        <div><strong>Doctor:</strong> Dr. {selectedDoctorObj?.name}</div>
                        <div><strong>Date & Time:</strong> {bookingDraft.date} at {bookingDraft.slotTime}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleConfirmBooking}
                          disabled={isBusy}
                          className="flex-1 bg-[#195fbd] hover:bg-[#124a96] text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{language === 'KN' ? 'ದೃಢೀಕರಿಸಿ' : 'Confirm & Book'}</span>
                        </button>
                        <button
                          onClick={handleResetChat}
                          className="px-3 py-2 bg-slate-50 text-slate-600 hover:text-[#10294c] rounded-xl text-xs cursor-pointer"
                        >
                          {language === 'KN' ? 'ಮರುಹೊಂದಿಸಿ' : 'Reset'}
                        </button>
                      </div>
                    </div>
                  )}

                  {bookingStep === 'confirmed' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                      <div className="text-xs font-bold text-emerald-700">
                        {language === 'KN' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'Appointment Confirmed!'}
                      </div>
                      <button
                        onClick={handleResetChat}
                        className="px-4 py-1.5 bg-[#195fbd] text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {language === 'KN' ? 'ಹೊಸ ಬುಕಿಂಗ್' : 'New Booking'}
                      </button>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Composer Input */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between pb-1.5 px-1 text-[11px] text-slate-500">
                    <button
                      onClick={() => setAudioReplies(!audioReplies)}
                      className="flex items-center gap-1 hover:text-emerald-700 cursor-pointer"
                    >
                      {audioReplies ? <Volume2 className="w-3 h-3 text-emerald-700" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                      <span>{audioReplies ? (language === 'KN' ? 'ಧ್ವನಿ ಸಕ್ರಿಯ' : 'Voice audio on') : (language === 'KN' ? 'ಮ್ಯೂಟ್' : 'Muted')}</span>
                    </button>
                    <button
                      onClick={handleResetChat}
                      className="flex items-center gap-1 hover:text-[#10294c] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{language === 'KN' ? 'ಮರುಪ್ರಾರಂಭಿಸಿ' : 'Restart'}</span>
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleChatSend(chatInputText);
                    }}
                    className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200"
                  >
                    <input
                      type="text"
                      placeholder={language === 'KN' ? 'ಹೆಸರು, ವೈದ್ಯರ ವಿವರ ಅಥವಾ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...' : 'Type name, doctor, or query...'}
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      className="flex-1 bg-transparent text-[#10294c] text-xs px-3 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || isBusy}
                      className="p-2 bg-[#195fbd] hover:bg-[#124a96] disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}


          </div>
        </div>
      )}
    </>
  );
};
