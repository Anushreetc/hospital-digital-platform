import Vapi from '@vapi-ai/web';

export type VapiCallState =
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'ERROR'
  | 'ENDED';

export interface VapiTranscriptMessage {
  role: 'user' | 'assistant' | 'system';
  transcript: string;
  textKn?: string;
  textEn?: string;
}

const env = (import.meta as any).env || {};
const publicKey = env.VITE_VAPI_PUBLIC_KEY || 'demo-vapi-public-key';
export const defaultAssistantId = env.VITE_VAPI_ASSISTANT_ID || '';

class VapiService {
  private vapi: Vapi | null = null;
  private isSupported = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.vapi = new Vapi(publicKey);
      } catch (err) {
        console.warn('[VapiService] Could not initialize Vapi SDK:', err);
        this.isSupported = false;
      }
    }
  }

  public getVapiInstance(): Vapi | null {
    return this.vapi;
  }

  public checkBrowserSupport(): boolean {
    const hasMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    return hasMedia && this.isSupported;
  }

  public start(assistantId?: string) {
    if (!this.vapi) {
      throw new Error('Vapi Web SDK is not available or supported in this browser environment.');
    }
    const targetId = assistantId || defaultAssistantId;
    if (targetId) {
      return this.vapi.start(targetId);
    } else {
      // Start with inline transient assistant config if assistantId environment variable is empty
      return this.vapi.start({
        name: "Hospital AI Receptionist",
        firstMessage: "Namaskara! Welcome to City Care Super Specialty Hospital. I am your hospital AI assistant. How can I help you today?",
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are the official AI voice receptionist for City Care Super Specialty Hospital.
Your job is to help patients and visitors with hospital information, doctor details, availability, and appointment booking.
You support Kannada and English naturally. If the user speaks Kannada, respond in Kannada. If English, respond in English.
Never invent hospital information or diagnose diseases. Confirm patient name, phone, doctor, date, time, and reason before booking.`
            }
          ]
        } as any
      });
    }
  }

  public stop() {
    if (this.vapi) {
      this.vapi.stop();
    }
  }
}

export const vapiService = new VapiService();
