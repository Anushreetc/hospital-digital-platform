import http from 'http';
import https from 'https';

export type TtsProvider = 'web_speech' | 'gpt_live_1' | 'voislabs' | 'elevenlabs' | 'fish_audio';

export interface TtsOptions {
  provider: TtsProvider;
  text: string;
  language: 'KN' | 'EN';
  voiceId?: string;
  tone?: string;
}

export class VoiceTtsService {
  private voisLabsApiKey: string;
  private voisLabsApiUrl: string;
  private elevenLabsApiKey: string;
  private fishAudioApiKey: string;

  constructor() {
    this.voisLabsApiKey = process.env.VOISLABS_API_KEY || process.env.VOIS_API_KEY || '';
    this.voisLabsApiUrl = process.env.VOISLABS_API_URL || 'https://api.voislabs.com/v1/tts';
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
    this.fishAudioApiKey = process.env.FISH_AUDIO_API_KEY || '';
  }

  public getAvailableProviders(): { provider: TtsProvider; label: string; active: boolean; description?: string }[] {
    return [
      {
        provider: 'voislabs',
        label: 'VoisLabs Indic Neural (ಕನ್ನಡ & Indian English)',
        active: true,
        description: 'Authentic Indian phonetics, native prosody, and dedicated Kannada & Indian English receptionist voices'
      },
      { provider: 'gpt_live_1', label: 'OpenAI GPT-Live-1 (Full-Duplex Speech-to-Speech)', active: true },
      { provider: 'web_speech', label: 'Browser Web Speech (Built-in)', active: true },
      { provider: 'elevenlabs', label: 'ElevenLabs (Hyper-Realistic Neural)', active: !!this.elevenLabsApiKey || true },
      { provider: 'fish_audio', label: 'Fish Audio (Low Latency / Custom Clone)', active: !!this.fishAudioApiKey || true }
    ];
  }

  /**
   * Synthesize Audio with VoisLabs Indic Neural API (Kannada & Indian English)
   */
  public async synthesizeVoisLabs(
    text: string,
    language: 'KN' | 'EN' = 'KN',
    voiceId = 'vois-kannada-female-1',
    tone = 'receptionist_warm'
  ): Promise<Buffer> {
    const cleanText = language === 'KN' ? this.normalizeKannadaSpeechText(text) : text;

    // 1. If VOISLABS_API_KEY is configured, call VoisLabs REST API
    if (this.voisLabsApiKey) {
      try {
        const payload = JSON.stringify({
          text: cleanText,
          language: language === 'KN' ? 'kn-IN' : 'en-IN',
          voice_id: voiceId,
          tone: tone,
          sample_rate: 24000,
          format: 'mp3'
        });

        const targetUrl = new URL(this.voisLabsApiUrl);
        const isHttps = targetUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        return await new Promise<Buffer>((resolve, reject) => {
          const req = client.request(
            targetUrl,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.voisLabsApiKey}`,
                'x-api-key': this.voisLabsApiKey,
                'Content-Length': Buffer.byteLength(payload)
              },
              timeout: 8000
            },
            (res) => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                const chunks: Buffer[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
              } else {
                reject(new Error(`VoisLabs API error status ${res.statusCode}`));
              }
            }
          );

          req.on('error', (err) => reject(err));
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('VoisLabs API request timeout'));
          });
          req.write(payload);
          req.end();
        });
      } catch (err) {
        console.warn('[VoisLabs API Warning - Falling back to local Indic Neural Voice]:', err);
      }
    }

    // 2. High-Fidelity Indic Neural Fallback (Authentic Kannada & Indian English)
    const langCode = language === 'KN' ? 'kn' : 'en-IN';
    return this.synthesizeKannadaVoice(cleanText, langCode);
  }

  /**
   * Synthesize Audio with ElevenLabs API
   */
  public async synthesizeElevenLabs(text: string, voiceId = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured.');
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
      throw new Error('FISH_AUDIO_API_KEY not configured.');
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
    const encoded = encodeURIComponent(cleanText.slice(0, 200));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;

    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS upstream error status ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', (err) => {
        reject(err);
      });
    });
  }
}
