/**
 * OpenAI GPT-Live-1 Full-Duplex Voice Engine Client
 * Handles real-time speech-to-speech interaction, interruptions, and hospital tool execution.
 */

export interface GptLiveSessionState {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  model: string;
  error?: string;
}

export class GptLiveClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isRunning: boolean = false;

  private onStateChange: ((state: GptLiveSessionState) => void) | null = null;
  private onMessage: ((sender: 'bot' | 'user', text: string) => void) | null = null;

  constructor(
    onStateChange?: (state: GptLiveSessionState) => void,
    onMessage?: (sender: 'bot' | 'user', text: string) => void
  ) {
    if (onStateChange) this.onStateChange = onStateChange;
    if (onMessage) this.onMessage = onMessage;
  }

  public async start(): Promise<boolean> {
    try {
      this.updateState({ isConnected: false, isListening: true, isSpeaking: false, model: 'gpt-live-1' });

      // 1. Request Ephemeral Live Session from Backend
      const res = await fetch('/api/ai/voice/gpt-live/session', { method: 'POST' });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to initialize GPT-Live session');
      }

      this.isRunning = true;
      const ephemeralKey = data.data?.client_secret?.value;
      const isConfigured = data.data?.configured;

      // 2. Request Microphone Access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 3. If Live API Key configured on server, attempt native WebRTC session
      if (isConfigured && ephemeralKey && !ephemeralKey.startsWith('sim_')) {
        await this.connectWebRTC(ephemeralKey);
      } else {
        // Simulation / Local Bridge mode for GPT-Live-1
        this.updateState({
          isConnected: true,
          isListening: false,
          isSpeaking: false,
          model: 'gpt-live-1'
        });
      }

      return true;
    } catch (err: any) {
      console.warn('[GptLiveClient] Start error:', err);
      this.updateState({
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        model: 'gpt-live-1',
        error: err.message
      });
      return false;
    }
  }

  private async connectWebRTC(ephemeralKey: string): Promise<void> {
    const pc = new RTCPeerConnection();
    this.peerConnection = pc;

    // Output Audio Element for incoming assistant voice
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    this.audioElement = audioEl;

    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
      this.updateState({ isConnected: true, isListening: false, isSpeaking: true, model: 'gpt-live-1' });
    };

    // Add microphone tracks to peer connection
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => pc.addTrack(track, this.audioStream!));
    }

    // Data Channel for real-time control, interruptions, and function calls
    const dc = pc.createDataChannel('oai-events');
    this.dataChannel = dc;

    dc.onmessage = async (e) => {
      try {
        const event = JSON.parse(e.data);
        await this.handleRealtimeServerEvent(event);
      } catch (err) {
        console.error('[GptLive] Event parse error:', err);
      }
    };

    // Create SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send SDP Offer to OpenAI Live API
    const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Authorization': `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      }
    });

    if (!sdpResponse.ok) {
      throw new Error(`OpenAI SDP connection failed: ${sdpResponse.statusText}`);
    }

    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    this.updateState({ isConnected: true, isListening: true, isSpeaking: false, model: 'gpt-live-1' });
  }

  private async handleRealtimeServerEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        if (this.onMessage && event.delta) {
          // Streaming text chunks
        }
        break;

      case 'response.audio_transcript.done':
        if (this.onMessage && event.transcript) {
          this.onMessage('bot', event.transcript);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (this.onMessage && event.transcript) {
          this.onMessage('user', event.transcript);
        }
        break;

      case 'response.function_call_arguments.done':
        // Execute Hospital Tool via backend
        if (event.name && event.call_id) {
          const args = JSON.parse(event.arguments || '{}');
          const toolRes = await fetch('/api/ai/voice/gpt-live/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: event.name, args })
          });
          const toolData = await toolRes.json();

          // Send function result back through data channel
          if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(
              JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: event.call_id,
                  output: JSON.stringify(toolData.data || toolData)
                }
              })
            );
            this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
          }
        }
        break;

      case 'input_audio_buffer.speech_started':
        // Full-duplex interruption (barge-in): caller started speaking
        this.updateState({ isConnected: true, isListening: true, isSpeaking: false, model: 'gpt-live-1' });
        break;

      case 'input_audio_buffer.speech_stopped':
        this.updateState({ isConnected: true, isListening: false, isSpeaking: true, model: 'gpt-live-1' });
        break;
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop());
      this.audioStream = null;
    }
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }
    this.updateState({ isConnected: false, isListening: false, isSpeaking: false, model: 'gpt-live-1' });
  }

  private updateState(state: GptLiveSessionState): void {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }
}
