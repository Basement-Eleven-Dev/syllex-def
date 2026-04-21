import { Component, inject, OnDestroy } from '@angular/core';
import { GeminiLiveService } from '../../../services/gemini-live-service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-voice-agent',
  imports: [NgClass],
  templateUrl: './voice-agent.html',
  styleUrl: './voice-agent.scss',
})
export class VoiceAgentComponent implements OnDestroy {
  public voice = inject(GeminiLiveService);

  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  async start() {
    try {
      // 1. Connette il WebSocket (chiamerà la tua Lambda prima)
      await this.voice.connect();

      // 2. Ottiene i permessi e avvia la cattura audio a 16kHz (richiesto da Google)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
      });

      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({
        sampleRate: 16000,
      });

      console.log('🎙️ AudioContext SampleRate:', this.audioContext.sampleRate);
      if (this.audioContext.sampleRate !== 16000) {
        console.warn('⚠️ SampleRate non corrispondente a 16000! Google potrebbe rifiutare l\'audio.');
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      // Buffer più piccolo (2048) per ridurre la latenza
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        // Fondamentale: non inviare nulla finché Google non conferma 'setupComplete'
        if (!this.voice.isReady()) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Metodo performante per Base64 binario
        const uint8Array = new Uint8Array(pcm16.buffer);
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        
        this.voice.sendAudioChunk(window.btoa(binary));
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error('Errore avvio:', err);
      alert('Impossibile connettersi o accedere al microfono.');
    }
  }

  stop() {
    this.voice.disconnect();

    if (this.processor) this.processor.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.mediaStream) this.mediaStream.getTracks().forEach((t) => t.stop());

    this.processor = null;
    this.audioContext = null;
    this.mediaStream = null;
  }

  ngOnDestroy() {
    this.stop();
  }
}
