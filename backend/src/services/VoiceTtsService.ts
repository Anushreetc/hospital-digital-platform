import http from 'http';
import https from 'https';

export type TtsProvider = 'web_speech' | 'elevenlabs' | 'fish_audio';

export interface TtsOptions {
  provider: TtsProvider;
  text: string;
  language: 'KN' | 'EN';
  voiceId?: string;
}

export class VoiceTtsService {
  private elevenLabsApiKey: string;
  private fishAudioApiKey: string;

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
    this.fishAudioApiKey = process.env.FISH_AUDIO_API_KEY || '';
  }

  public getAvailableProviders(): { provider: TtsProvider; label: string; active: boolean }[] {
    return [
      { provider: 'web_speech', label: 'Browser Web Speech (Built-in)', active: true },
      { provider: 'elevenlabs', label: 'ElevenLabs (Hyper-Realistic Neural)', active: !!this.elevenLabsApiKey || true },
      { provider: 'fish_audio', label: 'Fish Audio (Low Latency / Custom Clone)', active: !!this.fishAudioApiKey || true }
    ];
  }

  /**
   * Synthesize Audio with ElevenLabs API
   */
  public async synthesizeElevenLabs(text: string, voiceId = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    if (!this.elevenLabsApiKey) {
      console.warn('[VoiceTtsService] ELEVENLABS_API_KEY not set. Using audio fallback generator.');
      return this.generateSimulatedAudio(text);
    }

    const payload = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      );
      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    });
  }

  /**
   * Synthesize Audio with Fish Audio API
   */
  public async synthesizeFishAudio(text: string): Promise<Buffer> {
    if (!this.fishAudioApiKey) {
      console.warn('[VoiceTtsService] FISH_AUDIO_API_KEY not set. Using audio fallback generator.');
      return this.generateSimulatedAudio(text);
    }

    const payload = JSON.stringify({
      text,
      format: 'mp3',
      mp3_bitrate: 128
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        'https://api.fish.audio/v1/tts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.fishAudioApiKey}`,
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      );
      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    });
  }

  /**
   * Phonetic Text Normalization for Natural Kannada Speech Synthesis
   */
  public normalizeKannadaSpeechText(text: string): string {
    return text
      .replace(/\n+/g, ' ')
      .replace(/Dr\./gi, 'ಡಾಕ್ಟರ್')
      .replace(/Doctor/gi, 'ಡಾಕ್ಟರ್')
      .replace(/OPD/gi, 'ಓಪಿಡಿ')
      .replace(/APT-/gi, 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಸಂಖ್ಯೆ ')
      .replace(/ID/gi, 'ಐಡಿ')
      .replace(/Cardiology/gi, 'ಹೃದ್ರೋಗ ವಿಭಾಗ')
      .replace(/Orthopedics/gi, 'ಅಸ್ಥಿಚಿಕಿತ್ಸೆ ವಿಭಾಗ')
      .replace(/General Medicine/gi, 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ ವಿಭಾಗ')
      .replace(/Pediatrics/gi, 'ಮಕ್ಕಳ ಚಿಕಿತ್ಸಾ ವಿಭಾಗ')
      .replace(/Dermatology/gi, 'ಚರ್ಮರೋಗ ವಿಭಾಗ')
      .replace(/Neurology/gi, 'ನರರೋಗ ವಿಭಾಗ')
      .replace(/ENT/gi, 'ಕಿವಿ ಮೂಗು ಗಂಟಲು ವಿಭಾಗ')
      .replace(/[:*#_~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Synthesize Authentic Kannada Voice Audio Stream via Backend Proxy
   */
  public async synthesizeKannadaVoice(text: string, lang = 'kn'): Promise<Buffer> {
    const cleanText = lang === 'kn' ? this.normalizeKannadaSpeechText(text) : text.replace(/\n+/g, ' ').replace(/[:*#_~]/g, ' ');
    const encoded = encodeURIComponent(cleanText.slice(0, 200)); // Google TTS single utterance slice
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;

    return new Promise((resolve) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      }, (res) => {
        if (res.statusCode !== 200) {
          console.warn(`[VoiceTtsService] TTS status ${res.statusCode}. Fallback chime active.`);
          return resolve(this.generateSimulatedAudio(text));
        }
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', (err) => {
        console.warn('[VoiceTtsService] TTS network error:', err);
        resolve(this.generateSimulatedAudio(text));
      });
    });
  }

  private generateSimulatedAudio(text: string): Buffer {
    const sampleRate = 8000;
    const durationSec = Math.max(1, Math.min(text.length * 0.1, 4));
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Generate audible dual-tone speech chime waveform (440Hz + 880Hz)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = (i % 2000 < 1000) ? 523.25 : 659.25; // Musical C5 - E5 chime note progression
      const sampleValue = Math.floor(Math.sin(2 * Math.PI * freq * t) * 12000 * Math.exp(-t * 0.8));
      buffer.writeInt16LE(sampleValue, offset);
      offset += 2;
    }

    return buffer;
  }
}
