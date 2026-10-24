import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  RotateCcw,
  Sliders,
  Sparkles,
  Key,
  Calendar,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Check,
  AlertCircle,
  Play,
  Loader2,
  Clock,
  MapPin,
  HeartPulse,
  FlaskConical
} from 'lucide-react';
import {
  elevenLabsVoice,
  PRECONFIGURED_ELEVENLABS_VOICES,
  ElevenLabsVoice
} from '../services/elevenLabsVoice';
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
  const [activeTab, setActiveTab] = useState<'call' | 'chat' | 'settings'>('call');
  const [language, setLanguage] = useState<'KN' | 'EN'>('KN');

  // ElevenLabs Settings State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    elevenLabsVoice.getSelectedVoiceId()
  );
  const [apiKeyInput, setApiKeyInput] = useState<string>(elevenLabsVoice.getApiKey());
  const [agentIdInput, setAgentIdInput] = useState<string>(elevenLabsVoice.getAgentId());
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Call Mode State
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callMessages, setCallMessages] = useState<ChatMessage[]>([]);
  const [callInputText, setCallInputText] = useState('');

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Initial Bot Greetings
  const getInitialCallGreeting = (lang: 'KN' | 'EN'): string =>
    lang === 'KN'
      ? 'ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಮಲ್ಟಿಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಐಸಿಯುಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ElevenLabs AI ರಿಸೆಪ್ಷನಿಸ್ಟ್. ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್, ಭೇಟಿ ಸಮಯ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸೆಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'
      : 'Hello! Welcome to We Care Multispeciality Hospital and ICU. I am your ElevenLabs AI voice receptionist. How may I assist you with appointments, visiting hours, or emergency care?';

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
    if (callMessages.length === 0) {
      setCallMessages([
        {
          id: 'call-init',
          sender: 'bot',
          text: getInitialCallGreeting(language),
          time: '00:01'
        }
      ]);
    }
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

  // Call timer
  useEffect(() => {
    let timer: any;
    if (isOpen && callState === 'connected') {
      timer = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, callState]);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === 'call') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [callMessages, chatMessages, isSpeaking, activeTab]);

  // Soft telephone ring tone for audio unlock
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

  // Speak with ElevenLabs
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
        onDone?.();
      },
      onError: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        onDone?.();
      }
    });
  };

  // Start Call Flow
  const handleStartCall = () => {
    elevenLabsVoice.unlockAudio();
    playRingTone();
    setCallState('calling');
    setCallSeconds(0);
    const greeting = getInitialCallGreeting(language);
    setCallMessages([
      {
        id: `call-${Date.now()}`,
        sender: 'bot',
        text: greeting,
        time: '00:01'
      }
    ]);

    setTimeout(() => {
      setCallState('connected');
      speakText(greeting, () => {
        if (isOpenRef.current && !isMuted) {
          startListeningForCall();
        }
      });
    }, 600);
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
    setCallState('idle');
  };

  // Speech Recognition for Call Mode
  const startListeningForCall = () => {
    if (isSpeakingRef.current || isMuted) return;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = language === 'KN' ? 'kn-IN' : 'en-IN';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      rec.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onerror = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript;
        if (text) {
          handleCallUserUtterance(text);
        }
      };

      rec.start();
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  // Call user utterance handling
  const handleCallUserUtterance = (query: string) => {
    if (!query.trim()) return;

    elevenLabsVoice.stop();
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    // Add user message
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: formatTime(callSeconds)
    };
    setCallMessages((prev) => [...prev, userMsg]);
    setCallInputText('');

    // Generate response using hospital intelligence
    const response = elevenLabsVoice.generateHospitalResponse(
      query,
      language === 'KN',
      doctors
    );
    const replyText = language === 'KN' ? response.textKn : response.textEn;

    const botMsg: ChatMessage = {
      id: `b-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      time: formatTime(callSeconds + 1)
    };
    setCallMessages((prev) => [...prev, botMsg]);

    speakText(replyText, () => {
      if (isOpenRef.current && !isMuted) {
        setTimeout(startListeningForCall, 300);
      }
    });
  };

  // Save Settings & Test ElevenLabs
  const handleSaveSettings = () => {
    elevenLabsVoice.setApiKey(apiKeyInput);
    elevenLabsVoice.setAgentId(agentIdInput);
    elevenLabsVoice.setSelectedVoiceId(selectedVoiceId);
    setTestStatus({ success: true, message: 'Settings saved successfully.' });
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTestVoice = async () => {
    if (!apiKeyInput.trim()) {
      setTestStatus({
        success: false,
        message: 'Please enter an ElevenLabs API key first to test neural voice.'
      });
      return;
    }
    setIsTestingVoice(true);
    setTestStatus(null);
    elevenLabsVoice.unlockAudio();
    const res = await elevenLabsVoice.testApiKey(apiKeyInput, selectedVoiceId);
    setIsTestingVoice(false);
    if (res.success) {
      setTestStatus({
        success: true,
        message: 'ElevenLabs voice tested successfully! Loud & clear neural audio.'
      });
    } else {
      setTestStatus({
        success: false,
        message: res.error || 'Connection failed. Verify API Key and quota.'
      });
    }
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
          className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-white/20 cursor-pointer"
          aria-label="Open AI Voice Agent"
        >
          <div className="relative flex items-center justify-center">
            <Mic className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <div className="text-left hidden xs:block">
            <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>AI Voice Agent</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">ElevenLabs</span>
            </div>
            <div className="text-[10px] text-emerald-100 font-medium">ಕನ್ನಡ · English · Hands-free</div>
          </div>
        </button>
      )}

      {/* Single Unified Voice Agent Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 relative flex flex-col h-[680px] max-h-[96vh] overflow-hidden">
            
            {/* Unified Header */}
            <div className="px-4 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">We Care AI Voice Agent</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> ElevenLabs
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                    <span>Doddaballapura</span>
                    <span className="text-slate-600">•</span>
                    {elevenLabsVoice.hasApiKey() ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Neural v2
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Speech Engine
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center space-x-1.5">
                {/* Language Switcher */}
                <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                  <button
                    onClick={() => {
                      setLanguage('KN');
                      elevenLabsVoice.unlockAudio();
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      language === 'KN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('EN');
                      elevenLabsVoice.unlockAudio();
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      language === 'EN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    handleEndCall();
                    setIsOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('call')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'call'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'KN' ? '📞 ವಾಯ್ಸ್ ಕಾಲ್' : '📞 Voice Call'}</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'KN' ? '📅 ಬುಕಿಂಗ್ & ಚಾಟ್' : '📅 Book & Chat'}</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="ElevenLabs Setup"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ElevenLabs</span>
              </button>
            </div>

            {/* TAB 1: Real-time Hands-free Voice Call Mode */}
            {activeTab === 'call' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {callState === 'idle' ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-slate-800">
                        <Phone className="w-10 h-10 text-white animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Live AI
                      </span>
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <h4 className="font-bold text-lg text-white">
                        {language === 'KN' ? 'ಆಸ್ಪತ್ರೆ AI ರಿಸೆಪ್ಷನಿಸ್ಟ್‌ಗೆ ಕರೆ ಮಾಡಿ' : 'Call Hospital AI Receptionist'}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {language === 'KN'
                          ? 'ಹ್ಯಾಂಡ್ಸ್‌ಫ್ರೀ ಧ್ವನಿಯಲ್ಲಿ ತಕ್ಷಣವೇ ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್, ಭೇಟಿ ಸಮಯ ಅಥವಾ ತುರ್ತು ಮಾಹಿತಿ ಪಡೆಯಿರಿ.'
                          : 'Speak naturally in Kannada or English for immediate doctor booking, ICU help, and hospital timings.'}
                      </p>
                    </div>

                    <button
                      onClick={handleStartCall}
                      className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 text-sm cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{language === 'KN' ? 'ಈಗ ಕರೆ ಪ್ರಾರಂಭಿಸಿ' : 'Start Voice Call Now'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
                    {/* Visualizer Orb */}
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isSpeaking
                              ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 scale-110 shadow-2xl shadow-emerald-500/50'
                              : isListening
                              ? 'bg-gradient-to-tr from-blue-600 to-teal-500 scale-105 shadow-xl shadow-blue-500/30 animate-pulse'
                              : 'bg-slate-800 border-2 border-slate-700'
                          }`}
                        >
                          {isSpeaking ? (
                            <Volume2 className="w-12 h-12 text-slate-950 animate-bounce" />
                          ) : isListening ? (
                            <Mic className="w-12 h-12 text-white animate-pulse" />
                          ) : (
                            <Phone className="w-10 h-10 text-slate-400" />
                          )}
                        </div>

                        {/* Animated Voice Waves */}
                        {isSpeaking && (
                          <div className="absolute inset-0 -m-3 border-2 border-emerald-400/40 rounded-full animate-ping pointer-events-none" />
                        )}
                      </div>

                      {/* Status Text & Timer */}
                      <div className="text-center">
                        <div className="text-xs font-bold text-emerald-400">
                          {isSpeaking
                            ? language === 'KN'
                              ? '🔊 AI ಮಾತನಾಡುತ್ತಿದೆ...'
                              : '🔊 AI is speaking...'
                            : isListening
                            ? language === 'KN'
                              ? '🎙️ ಕೇಳುತ್ತಿದ್ದೇನೆ... ಈಗ ಮಾತನಾಡಿ'
                              : '🎙️ Listening... speak now'
                            : language === 'KN'
                            ? 'ಸಂಪರ್ಕಗೊಂಡಿದೆ'
                            : 'Connected'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">⏱️ {formatTime(callSeconds)}</div>
                      </div>
                    </div>

                    {/* Live Transcript Balloons */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 px-2 py-1 max-h-[220px]">
                      {callMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                              msg.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block text-right">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* In-Call Controls Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isMuted
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                      </button>

                      {/* Fallback Text Input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCallUserUtterance(callInputText);
                        }}
                        className="flex-1 flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-2xl border border-slate-800"
                      >
                        <input
                          type="text"
                          placeholder={language === 'KN' ? 'ಅಥವಾ ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Or type your query...'}
                          value={callInputText}
                          onChange={(e) => setCallInputText(e.target.value)}
                          className="w-full bg-transparent text-white text-xs px-2 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!callInputText.trim()}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>

                      {/* Red End Call Button */}
                      <button
                        onClick={handleEndCall}
                        className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                        title="End Call"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block text-right">{msg.time}</span>
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
                        className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{language === 'KN' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book Appointment'}</span>
                      </button>

                      <button
                        onClick={() => handleChatSend('ಭೇಟಿ ಸಮಯ')}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{language === 'KN' ? 'ಭೇಟಿ ಸಮಯ' : 'Visiting Hours'}</span>
                      </button>

                      <button
                        onClick={() => handleChatSend('ರಕ್ತ ಪರೀಕ್ಷೆ')}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2"
                      >
                        <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{language === 'KN' ? '24/7 ರಕ್ತ ಪರೀಕ್ಷೆ / ಲ್ಯಾಬ್' : 'Blood Tests & Lab'}</span>
                      </button>

                      <button
                        onClick={() => handleChatSend('ತುರ್ತು ಸಹಾಯ')}
                        className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2"
                      >
                        <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{language === 'KN' ? 'ತುರ್ತು / ಆಂಬುಲೆನ್ಸ್' : '24/7 Emergency'}</span>
                      </button>
                    </div>
                  )}

                  {/* Doctor Selection Options */}
                  {bookingStep === 'doctorId' && (
                    <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
                      <div className="text-[11px] font-bold text-slate-400">
                        {language === 'KN' ? 'ತಜ್ಞ ವೈದ್ಯರನ್ನು ಆರಿಸಿ:' : 'Select Specialist Doctor:'}
                      </div>
                      {doctors.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectDoctor(doc)}
                          className="w-full p-2.5 bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-white">Dr. {doc.name}</div>
                            <div className="text-[11px] text-emerald-400">{doc.specialization}</div>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md">
                            {doc.experienceYears ? `${doc.experienceYears}+ yrs exp` : doc.qualification || 'Specialist'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Date Selection */}
                  {bookingStep === 'date' && (
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 pt-2">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        {language === 'KN' ? 'ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ:' : 'Select Appointment Date:'}
                      </label>
                      <input
                        type="date"
                        min={hospitalToday()}
                        max={plusDays(hospitalToday(), 60)}
                        onChange={(e) => handleSelectDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Time Slot Selection */}
                  {bookingStep === 'slotTime' && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold text-slate-400">
                        {language === 'KN' ? 'ಲಭ್ಯವಿರುವ ಸಮಯ:' : 'Available Time Slots:'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => handleSelectSlot(slot)}
                              className="p-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all border border-slate-700"
                            >
                              {slot.label || slot.time}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-2 text-xs text-slate-400">
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
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-2 pt-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'KN' ? 'ಬುಕಿಂಗ್ ಪರಿಶೀಲನೆ' : 'Appointment Summary'}</span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div><strong>Patient:</strong> {bookingDraft.patientName} ({bookingDraft.patientPhone})</div>
                        <div><strong>Doctor:</strong> Dr. {selectedDoctorObj?.name}</div>
                        <div><strong>Date & Time:</strong> {bookingDraft.date} at {bookingDraft.slotTime}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleConfirmBooking}
                          disabled={isBusy}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{language === 'KN' ? 'ದೃಢೀಕರಿಸಿ' : 'Confirm & Book'}</span>
                        </button>
                        <button
                          onClick={handleResetChat}
                          className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs cursor-pointer"
                        >
                          {language === 'KN' ? 'ಮರುಹೊಂದಿಸಿ' : 'Reset'}
                        </button>
                      </div>
                    </div>
                  )}

                  {bookingStep === 'confirmed' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="text-xs font-bold text-emerald-300">
                        {language === 'KN' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'Appointment Confirmed!'}
                      </div>
                      <button
                        onClick={handleResetChat}
                        className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {language === 'KN' ? 'ಹೊಸ ಬುಕಿಂಗ್' : 'New Booking'}
                      </button>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Composer Input */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between pb-1.5 px-1 text-[11px] text-slate-400">
                    <button
                      onClick={() => setAudioReplies(!audioReplies)}
                      className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer"
                    >
                      {audioReplies ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                      <span>{audioReplies ? (language === 'KN' ? 'ಧ್ವನಿ ಸಕ್ರಿಯ' : 'Voice audio on') : (language === 'KN' ? 'ಮ್ಯೂಟ್' : 'Muted')}</span>
                    </button>
                    <button
                      onClick={handleResetChat}
                      className="flex items-center gap-1 hover:text-white cursor-pointer"
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
                    className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800"
                  >
                    <input
                      type="text"
                      placeholder={language === 'KN' ? 'ಹೆಸರು, ವೈದ್ಯರ ವಿವರ ಅಥವಾ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...' : 'Type name, doctor, or query...'}
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      className="flex-1 bg-transparent text-white text-xs px-3 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || isBusy}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: ElevenLabs Configuration & Test */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-1">
                  <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>ElevenLabs Voice Engine Setup</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Connect your ElevenLabs API Key or Agent ID for instant ultra-realistic neural human speech across English and Kannada.
                  </p>
                </div>

                {/* Preconfigured Voice Selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Select Pre-configured Voice:</label>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {PRECONFIGURED_ELEVENLABS_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender}) - {v.recommendedFor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ElevenLabs API Key Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block flex items-center justify-between">
                    <span>ElevenLabs API Key (xi-api-key):</span>
                    {apiKeyInput.trim() && (
                      <span className="text-[10px] text-emerald-400 font-bold">Configured</span>
                    )}
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your ElevenLabs API Key (e.g. sk_...)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Obtain your key from your ElevenLabs dashboard at elevenlabs.io. Saved locally and privately in your browser.
                  </p>
                </div>

                {/* ElevenLabs Conversational AI Agent ID Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    ElevenLabs Agent ID (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. agent_abc123 or public agent id"
                    value={agentIdInput}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    If you created a Conversational AI agent in ElevenLabs, enter its ID here.
                  </p>
                </div>

                {/* Test Feedback */}
                {testStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testStatus.success
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {testStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{testStatus.message}</span>
                  </div>
                )}

                {/* Buttons Bar */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleTestVoice}
                    disabled={isTestingVoice}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {isTestingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>{isTestingVoice ? 'Testing ElevenLabs...' : '🔊 Test Voice Speech'}</span>
                  </button>

                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all"
                  >
                    Save &amp; Activate
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
