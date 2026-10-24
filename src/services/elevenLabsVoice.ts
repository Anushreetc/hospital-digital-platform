/**
 * ElevenLabs Voice Agent & Speech Synthesis Service
 * Provides real-time ultra-realistic human voices (English & Kannada/Indic multilingual)
 * Supports custom API Key, Agent ID, low-latency audio streaming, and high-fidelity native fallback.
 */

import { Doctor } from '../types';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  description: string;
  recommendedFor: string;
}

export const PRECONFIGURED_ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel (Hospital Receptionist)',
    gender: 'female',
    description: 'Warm, calm and professional hospital receptionist tone',
    recommendedFor: 'Hospital reception & OPD booking'
  },
  {
    id: '9BWtsMINqrJLrRacOk9x',
    name: 'Aria (Patient Guidance)',
    gender: 'female',
    description: 'Empathetic and compassionate healthcare assistant',
    recommendedFor: 'Patient guidance & symptom inquiry'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (Care Coordinator)',
    gender: 'female',
    description: 'Gentle, clear and reassuring voice',
    recommendedFor: 'Elderly care & family guidance'
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam (Medical Consultant)',
    gender: 'male',
    description: 'Authoritative, calm senior medical consultant voice',
    recommendedFor: 'Clinical advice & specialist consultations'
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda (Specialist Coordinator)',
    gender: 'female',
    description: 'Crisp, measured articulation ideal for medical terms',
    recommendedFor: 'Diagnostic packages & room tariffs'
  }
];

class ElevenLabsVoiceService {
  private currentAudioElement: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private safetyTimeout: any = null;

  public getApiKey(): string {
    return (
      localStorage.getItem('wecare_elevenlabs_api_key') ||
      (import.meta as any).env?.VITE_ELEVENLABS_API_KEY ||
      ''
    );
  }

  public setApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem('wecare_elevenlabs_api_key', key.trim());
    } else {
      localStorage.removeItem('wecare_elevenlabs_api_key');
    }
  }

  public getAgentId(): string {
    return (
      localStorage.getItem('wecare_elevenlabs_agent_id') ||
      (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID ||
      ''
    );
  }

  public setAgentId(agentId: string): void {
    if (agentId.trim()) {
      localStorage.setItem('wecare_elevenlabs_agent_id', agentId.trim());
    } else {
      localStorage.removeItem('wecare_elevenlabs_agent_id');
    }
  }

  public getSelectedVoiceId(): string {
    return (
      localStorage.getItem('wecare_elevenlabs_voice_id') ||
      PRECONFIGURED_ELEVENLABS_VOICES[0].id
    );
  }

  public setSelectedVoiceId(voiceId: string): void {
    localStorage.setItem('wecare_elevenlabs_voice_id', voiceId);
  }

  /**
   * Stop any currently playing speech audio
   */
  public stop(): void {
    this.isSpeaking = false;
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {
        // already stopped
      }
      this.currentAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Speak text using ElevenLabs API (eleven_multilingual_v2)
   * With automatic fallback to high-fidelity native audio stream.
   */
  public async speak(
    text: string,
    options: {
      voiceId?: string;
      isKannada?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    this.stop();
    const apiKey = this.getApiKey();
    const voiceId = options.voiceId || this.getSelectedVoiceId();

    // Clean text for speech synthesis (strip markdown, URLs, asterisk bolding)
    const cleanedText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) {
      options.onEnd?.();
      return;
    }

    // Safety timeout to prevent any freeze
    this.safetyTimeout = setTimeout(() => {
      if (this.isSpeaking) {
        this.isSpeaking = false;
        options.onEnd?.();
      }
    }, 12000);

    // 1. Try ElevenLabs API if key is available
    if (apiKey) {
      try {
        options.onStart?.();
        this.isSpeaking = true;

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
              text: cleanedText.slice(0, 800),
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.55,
                similarity_boost: 0.8,
                style: 0.35,
                use_speaker_boost: true
              }
            })
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`ElevenLabs error (${response.status}): ${errBody}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudioElement = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.isSpeaking = false;
          if (this.safetyTimeout) clearTimeout(this.safetyTimeout);
          options.onEnd?.();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          this.isSpeaking = false;
          this.speakAudioStream(cleanedText, options);
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('ElevenLabs API call notice, falling back to neural audio:', err);
      }
    }

    // 2. High-fidelity Native Audio Stream (Kannada & Indian English)
    this.speakAudioStream(cleanedText, options);
  }

  /**
   * High-fidelity native speech audio streaming fallback
   */
  private speakAudioStream(
    text: string,
    options: {
      isKannada?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    const lang = options.isKannada ? 'kn' : 'en';
    const cleanSnippet = text.slice(0, 250);
    const streamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      cleanSnippet
    )}&tl=${lang}&client=tw-ob`;

    try {
      options.onStart?.();
      this.isSpeaking = true;

      const audio = new Audio(streamUrl);
      this.currentAudioElement = audio;

      audio.onended = () => {
        this.isSpeaking = false;
        if (this.safetyTimeout) clearTimeout(this.safetyTimeout);
        options.onEnd?.();
      };

      audio.onerror = () => {
        // Fallback to browser speech synthesis
        this.speakBrowser(text, options);
      };

      audio.play().catch(() => {
        // If autoplay blocked or error, fallback to browser synthesis
        this.speakBrowser(text, options);
      });
    } catch {
      this.speakBrowser(text, options);
    }
  }

  /**
   * Browser Speech Synthesis fallback
   */
  private speakBrowser(
    text: string,
    options: {
      isKannada?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      options.onEnd?.();
      return;
    }

    options.onStart?.();
    this.isSpeaking = true;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.isKannada ? 'kn-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (options.isKannada && v.lang.toLowerCase().startsWith('kn')) ||
        v.lang === 'en-IN' ||
        v.name.includes('India') ||
        v.name.includes('Rishi') ||
        v.name.includes('Heera') ||
        v.name.includes('Google UK English Female') ||
        v.lang.startsWith('en')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.safetyTimeout) clearTimeout(this.safetyTimeout);
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      if (this.safetyTimeout) clearTimeout(this.safetyTimeout);
      options.onError?.(e);
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Generate an intelligent medical receptionist response for We Care Hospital
   */
  public generateHospitalResponse(
    query: string,
    isKannada: boolean,
    doctors: Doctor[] = []
  ): { textKn: string; textEn: string; intent?: string } {
    const q = query.toLowerCase();

    // Emergency / Ambulance
    if (/emergency|ambulance|casualty|icu|ತುರ್ತು|ಆಂಬುಲೆನ್ಸ್/i.test(q)) {
      return {
        textKn:
          'ತುರ್ತು ಪರಿಸ್ಥಿತಿಗಾಗಿ ತಕ್ಷಣವೇ ನಮ್ಮ 24/7 ತುರ್ತು ಸಂಖ್ಯೆ +91 88677 55541 ಅಥವಾ ಆಂಬುಲೆನ್ಸ್ +91 93530 61993 ಗೆ ಕರೆ ಮಾಡಿ. ನಮ್ಮ ತುರ್ತು ಮತ್ತು ಐಸಿಯು ತಂಡ ಸದಾ ಸಿದ್ಧವಾಗಿದೆ.',
        textEn:
          'For medical emergencies, please call our 24/7 Emergency unit at +91 88677 55541 or Ambulance at +91 93530 61993 immediately. Our ICU casualty team is on duty round the clock.',
        intent: 'EMERGENCY'
      };
    }

    // Visiting Hours
    if (/visiting|visit hours|timing|ಭೇಟಿ|ಸಮಯ/i.test(q)) {
      return {
        textKn:
          'ಆಸ್ಪತ್ರೆಯ ಸಾಮಾನ್ಯ ವಾರ್ಡ್ ಭೇಟಿ ಸಮಯ: ಬೆಳಗ್ಗೆ 9:00 ರಿಂದ 11:00 ಮತ್ತು ಸಂಜೆ 6:00 ರಿಂದ 7:00 ರವರೆಗೆ. ಐಸಿಯು ಭೇಟಿ ಸಮಯ: ಸಂಜೆ 5:00 ರಿಂದ 6:00 ರವರೆಗೆ.',
        textEn:
          'Hospital visiting hours are 9:00 AM to 11:00 AM and 6:00 PM to 7:00 PM for general wards. For ICU patients, visiting is between 5:00 PM to 6:00 PM.',
        intent: 'INFO'
      };
    }

    // Address & Location
    if (/address|location|where|directions|route|ವಿಳಾಸ|ಎಲ್ಲಿದೆ/i.test(q)) {
      return {
        textKn:
          'ವೀ ಕೇರ್ ಆಸ್ಪತ್ರೆ ಡಿ ಕ್ರಾಸ್ ಮುಖ್ಯ ರಸ್ತೆ, ಫೆಡರಲ್ ಬ್ಯಾಂಕ್ ಹತ್ತಿರ, ದೊಡ್ಡಬಳ್ಳಾಪುರದಲ್ಲಿದೆ. ಪಿನ್‌ಕೋಡ್ 561203. ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಆಂಬುಲೆನ್ಸ್ ಮತ್ತು ಕಾರು ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯವಿದೆ.',
        textEn:
          'We Care Hospital is located on D Cross Main Road, near Federal Bank, Doddaballapura, Karnataka 561203. Dedicated parking and 24/7 ambulance bay are available.',
        intent: 'INFO'
      };
    }

    // Blood Test & Laboratory
    if (/blood|lab|test|pathology|ರಕ್ತ|ಲ್ಯಾಬ್|ಪರೀಕ್ಷೆ/i.test(q)) {
      return {
        textKn:
          'ನಮ್ಮಲ್ಲಿ 24 ಗಂಟೆಗಳ ಕಾಲ ಸುಸಜ್ಜಿತ ಲ್ಯಾಬೋರೇಟರಿ ಮತ್ತು ರಕ್ತ ಪರೀಕ್ಷಾ ಸೌಲಭ್ಯವಿದೆ. CBC, ಲಿಪಿಡ್ ಪ್ರೊಫೈಲ್, ಥೈರಾಯ್ಡ್, ಕಿಡ್ನಿ ಮತ್ತು ಲಿವರ್ ಪರೀಕ್ಷಾ ವರದಿಗಳು ಅದೇ ದಿನ ಡಿಜಿಟಲ್ ರೂಪದಲ್ಲಿ ಲಭ್ಯವಾಗುತ್ತವೆ.',
        textEn:
          'Our fully equipped 24/7 in-house diagnostic laboratory provides comprehensive blood tests, CBC, lipid profile, HbA1c, thyroid, and renal panels with same-day digital report delivery.',
        intent: 'INFO'
      };
    }

    // Operation Theatre & Surgery
    if (/operation|theatre|surgery|ot|ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ|ಆಪರೇಷನ್/i.test(q)) {
      return {
        textKn:
          'ವೀ ಕೇರ್ ಆಸ್ಪತ್ರೆಯು ಅತ್ಯಾಧುನಿಕ ಲ್ಯಾಮಿನಾರ್ ಫ್ಲೋ ಆಪರೇಷನ್ ಥಿಯೇಟರ್ ಮತ್ತು ಐಸಿಯು ಬ್ಯಾಕಪ್ ಹೊಂದಿದೆ. ಸಾಮಾನ್ಯ, ಲ್ಯಾಪರೊಸ್ಕೋಪಿಕ್ ಮತ್ತು ಮೂಳೆ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳು ಸುರಕ್ಷಿತವಾಗಿ ನಡೆಯುತ್ತವೆ.',
        textEn:
          'We Care Hospital houses a modern laminar-flow Operating Theatre with HEPA filtration and continuous ICU monitoring for multi-speciality, laparoscopic and orthopedic surgical procedures.',
        intent: 'INFO'
      };
    }

    // Insurance & Cashless
    if (/insurance|cashless|tpa|ayushman|claim|ವಿಮೆ|ಕ್ಯಾಶ್‌ಲೆಸ್/i.test(q)) {
      return {
        textKn:
          'ನಮ್ಮಲ್ಲಿ ಪ್ರಮುಖ ಆರೋಗ್ಯ ವಿಮೆಗಳು ಮತ್ತು ಟಿಪಿಎ ಕ್ಯಾಶ್‌ಲೆಸ್ ಸೌಲಭ್ಯಗಳು ಲಭ್ಯವಿವೆ. ನಿಮ್ಮ ವಿಮಾ ಪಾಲಿಸಿ ಕಾರ್ಡ್ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್‌ನೊಂದಿಗೆ ರಿಸೆಪ್ಷನ್ ವಿಮಾ ಡೆಸ್ಕ್ ಸಂಪರ್ಕಿಸಿ.',
        textEn:
          'We support major health insurance policies and corporate TPAs with cashless hospitalization facilities. Please present your insurance card and Aadhaar at our reception desk.',
        intent: 'INFO'
      };
    }

    // Doctor Enquiry
    const matchedDoctor = doctors.find(
      (d) =>
        d.active &&
        (q.includes(d.name.toLowerCase().replace(/dr\.?\s*/i, '')) ||
          q.includes(d.specialization.toLowerCase()))
    );

    if (matchedDoctor) {
      return {
        textKn: `${matchedDoctor.name} ಅವರು ${matchedDoctor.specialization} ವಿಭಾಗದಲ್ಲಿ ಪರಿಣಿತರಾಗಿದ್ದಾರೆ. ಇವರೊಂದಿಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಫೋನ್ ಸಂಖ್ಯೆ ತಿಳಿಸಿ.`,
        textEn: `${matchedDoctor.name} is our specialist in ${matchedDoctor.specialization}. To book an appointment with them, please provide your name and phone number.`,
        intent: 'APPOINTMENT'
      };
    }

    // Patient Name or Introduction
    const nameMatch = query.match(/(?:my name is|i am|i'm|ನನ್ನ ಹೆಸರು|ನಾನು|ಹೆಸರು)\s+([A-Za-z\u0C80-\u0CFF]+)/i);
    const trimmed = query.trim();
    const isSingleName = !/\b(hospital|help|bed|dr|doctor|room|icu|visiting|emergency|ಆಸ್ಪತ್ರೆ)\b/i.test(q) &&
      trimmed.split(/\s+/).length <= 3 &&
      trimmed.length >= 2 &&
      trimmed.length <= 40 &&
      !/^(hi|hello|hey|ನಮಸ್ಕಾರ|ok|yes|no)$/i.test(trimmed) &&
      !/^\d+$/.test(trimmed);

    if (nameMatch || isSingleName) {
      const patientName = nameMatch ? nameMatch[1].trim() : trimmed;
      return {
        textKn: `ಧನ್ಯವಾದಗಳು ${patientName} ಅವರೇ. ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಾಗಿ ಯಾವ ವೈದ್ಯರನ್ನು ಭೇಟಿಯಾಗಬೇಕೆಂದು ಬಯಸುತ್ತೀರಿ? ಅಥವಾ ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ತಿಳಿಸಿ.`,
        textEn: `Thank you ${patientName}. Which doctor or department would you like to consult? Or please provide your 10-digit mobile number.`,
        intent: 'NAME_PROVIDED'
      };
    }

    // Phone Number Detection
    const digitsOnly = query.replace(/\D/g, '');
    if ((digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) || digitsOnly.length === 12) {
      return {
        textKn: "ಧನ್ಯವಾದಗಳು, ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ದಾಖಲಾಗಿದೆ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಾಗಿ ಇಂದು ಅಥವಾ ನಾಳೆ ಯಾವ ಸಮಯ ನಿಮಗೆ ಅನುಕೂಲ?",
        textEn: "Thank you, your phone number has been recorded. Would today or tomorrow work best for your appointment?",
        intent: 'PHONE_PROVIDED'
      };
    }

    // Appointment Booking Intent
    if (/book|appointment|consult|doctor|dr|ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್|ಡಾಕ್ಟರ್/i.test(q)) {
      return {
        textKn:
          'ಖಂಡಿತ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ತಿಳಿಸಿ.',
        textEn:
          'Certainly! To book an appointment, please state your full name.',
        intent: 'APPOINTMENT'
      };
    }

    // Room Tariff & Inpatient
    if (/room|bed|tariff|cost|price|icu cost|ಕೊಠಡಿ|ದರ/i.test(q)) {
      return {
        textKn:
          'ನಮ್ಮಲ್ಲಿ ಜನರಲ್ ವಾರ್ಡ್, ಸೆಮಿ-ಪ್ರೈವೇಟ್, ಪ್ರೈವೇಟ್ ಎಸಿ ಕೊಠಡಿಗಳು ಮತ್ತು 24/7 ಐಸಿಯು ಲಭ್ಯವಿವೆ. ಕೊಠಡಿ ಲಭ್ಯತೆ ಮತ್ತು ದರಗಳ ವಿವರಗಳಿಗಾಗಿ ನಮ್ಮ ರಿಸೆಪ್ಷನ್ +91 88677 55541 ಸಂಪರ್ಕಿಸಿ.',
        textEn:
          'We offer General Ward, Semi-Private, Deluxe Private AC rooms, and 24/7 ICU beds. Please contact our reception desk at +91 88677 55541 for bed availability.',
        intent: 'INFO'
      };
    }

    // General Greeting or fallback
    return {
      textKn:
        'ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ನೀವು ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್, ಭೇಟಿ ಸಮಯ, ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆಗಳು ಅಥವಾ ವಿಳಾಸದ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
      textEn:
        'Hello! Welcome to We Care Hospital. You can ask me about doctor appointments, visiting hours, blood tests, room tariffs, or emergency care. How may I assist you today?',
      intent: 'GENERAL'
    };
  }
}

export const elevenLabsVoice = new ElevenLabsVoiceService();
