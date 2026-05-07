import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { firstValueFrom } from 'rxjs';
import { Materia } from './materia';

@Injectable({
  providedIn: 'root',
})
export class GeminiLiveService {
  private http = inject(HttpClient);
  private materiaService = inject(Materia); // Per ottenere l'ID della materia corrente

  // --- STATO REATTIVO (Signals) ---
  public isConnected = signal<boolean>(false);
  public isReady = signal<boolean>(false);
  public isSpeaking = signal<boolean>(false);
  public isSearching = signal<boolean>(false);

  public aiTranscript = signal<string>('');
  public userTranscript = signal<string>('');
  public turnCompleteEvent = signal<number>(0);

  private wsSubject: WebSocketSubject<any> | null = null;
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private aiTurnStartTime = 0;
  private isDiscardingAudio = false;
  private audioQueue: AudioBuffer[] = [];
  private isPlayingAudio = false;
  private audioEndTimeout: any = null;

  private readonly PROJECT_ID = 'syllex-488315';
  private readonly LOCATION = 'us-central1';
  private resolvedModel = '';

  // Lista ordinata di modelli Live API da provare (dal più recente al più vecchio)
  private readonly LIVE_MODEL_CANDIDATES = [
    'gemini-live-2.5-flash-native-audio',
  ];

  public async connect(): Promise<void> {
    if (this.wsSubject) return;

    try {
      console.log('🔄 1. Richiesta token in corso...');
      const response = await firstValueFrom<{
        success: boolean;
        token: string;
      }>(this.http.post<any>('ai/generatetoken', {}));
      const token = response.token;
      console.log('✅ 2. Token ottenuto con successo.');

      // Prova ogni candidato fino a trovarne uno che funziona
      for (const candidateModel of this.LIVE_MODEL_CANDIDATES) {
        console.log(
          `🔗 Tentativo connessione con modello: ${candidateModel}...`,
        );
        const success = await this.tryConnectWithModel(token, candidateModel);
        if (success) {
          this.resolvedModel = candidateModel;
          console.log(`✅ CONNESSO con successo al modello: ${candidateModel}`);
          return;
        }
        console.warn(
          `❌ Modello ${candidateModel} non disponibile, provo il prossimo...`,
        );
      }

      console.error(
        '❌ NESSUN modello Live API disponibile. Modelli provati:',
        this.LIVE_MODEL_CANDIDATES,
      );
    } catch (error) {
      console.error('❌ Errore durante la connessione:', error);
    }
  }

  /**
   * Prova a connettersi con un singolo modello.
   * Risolve true se il setup viene accettato, false se il WebSocket chiude con errore 1008.
   */
  private tryConnectWithModel(token: string, model: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const wsUrl = `wss://${this.LOCATION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${token}`;

      // Timeout: se non si connette in 8 secondi, fallisce
      const timeout = setTimeout(() => {
        console.warn(`⏱️ Timeout per modello ${model}`);
        try {
          ws.close();
        } catch {}
        resolve(false);
      }, 8000);

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log(`  ✓ WebSocket aperto, invio setup per ${model}...`);
        // Costruiamo il percorso del modello in modo intelligente
        const modelPath = model.startsWith('publishers/')
          ? `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/${model}`
          : `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/publishers/google/models/${model}`;

        console.log(`📡 [SETUP] Modello: ${modelPath}`);

        const setupPayload = {
          setup: {
            model: modelPath,
            generationConfig: {
              responseModalities: ['AUDIO'],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: {
              parts: [
                {
                  text: `Sei l'assistente vocale per "${this.materiaService.materiaSelected()?.name}". Rispondi in modo naturale e conciso.`,
                },
              ],
            },
          },
        };
        ws.send(JSON.stringify(setupPayload));
      };

      ws.onmessage = (evt) => {
        clearTimeout(timeout);
        let data: any;
        try {
          const text =
            typeof evt.data === 'string'
              ? evt.data
              : new TextDecoder().decode(evt.data);
          data = JSON.parse(text);
        } catch {
          data = evt.data;
        }

        if (data.setupComplete !== undefined) {
          // Setup accettato! Chiudi questo WebSocket di prova e ricrea la connessione definitiva
          ws.close();
          console.log(
            `  ✓ Setup accettato per ${model}! Connessione definitiva...`,
          );
          this.establishConnection(token, model);
          resolve(true);
        }
      };

      ws.onclose = (evt) => {
        clearTimeout(timeout);
        if (evt.code === 1008 || evt.code === 1007) {
          // Modello non trovato o payload non valido
          resolve(false);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
  }

  /**
   * Stabilisce la connessione definitiva con il modello già validato.
   */
  private establishConnection(token: string, model: string): void {
    const wsUrl = `wss://${this.LOCATION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${token}`;

    this.audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )({
      sampleRate: 24000,
    });

    class ArrayBufferWebSocket extends WebSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        this.binaryType = 'arraybuffer';
      }
    }

    this.wsSubject = webSocket<any>({
      url: wsUrl,
      WebSocketCtor: ArrayBufferWebSocket as any,
      openObserver: {
        next: () => {
          console.log('✅ WebSocket definitivo aperto, invio setup...');
          this.isConnected.set(true);
          this.sendSetupMessage(model);
        },
      },
      closeObserver: {
        next: (closeEvent: CloseEvent) => {
          console.warn(
            `🔌 WebSocket close — code: ${closeEvent.code}, reason: "${closeEvent.reason}"`,
          );
          this.cleanupState();
        },
      },
      deserializer: (e: MessageEvent) => {
        if (e.data instanceof ArrayBuffer) {
          try {
            const text = new TextDecoder('utf-8').decode(e.data);
            return JSON.parse(text);
          } catch {
            return { _binaryAudio: e.data };
          }
        }
        try {
          return JSON.parse(e.data);
        } catch {
          return e.data;
        }
      },
    });

    this.wsSubject.subscribe({
      next: (msg) => {
        console.log('📩 [MSG]:', JSON.stringify(msg).substring(0, 300));
        this.handleServerMessage(msg);
      },
      error: (err) => {
        console.error('❌ Errore WebSocket:', err);
        this.cleanupState();
      },
      complete: () => {
        console.log('🔌 WEBSOCKET CHIUSO DAL SERVER');
        this.cleanupState();
      },
    });
  }

  // Pulizia stato senza tentare di inviare messaggi su un socket già chiuso
  private cleanupState(): void {
    this.wsSubject = null;
    this.isConnected.set(false);
    this.isReady.set(false);
    this.isSpeaking.set(false);
    this.audioQueue = [];
    this.isPlayingAudio = false;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Aggiunto un flag "isClean" per evitare crash durante una chiusura per errore
  public disconnect(isClean = true): void {
    if (this.wsSubject) {
      if (isClean) {
        try {
          this.wsSubject.next({ clientContent: { turnComplete: true } });
        } catch (e) {
          console.warn("Ignorato errore durante l'invio di turnComplete");
        }
      }
      this.wsSubject.complete();
      this.wsSubject = null;
    }

    this.isConnected.set(false);
    this.isReady.set(false);
    this.isSpeaking.set(false);
    this.audioQueue = [];
    this.isPlayingAudio = false;

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('🛑 Servizio disconnesso completamente.');
  }

  public sendAudioChunk(base64Pcm: string): void {
    if (!this.wsSubject) return;
    this.wsSubject.next({
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Pcm,
          },
        ],
      },
    });
  }

  /**
   * Segnala esplicitamente la fine del turno dell'utente.
   * Forza Gemini a rispondere e ignora ulteriori input fino alla risposta.
   */
  public sendEndOfTurn(): void {
    if (!this.wsSubject) return;
    console.log('🏁 Invio segnale FINE TURNO (User done)');
    this.wsSubject.next({
      realtimeInput: {
        endOfTurn: true,
      },
    });
  }

  private sendSetupMessage(model: string): void {
    // Costruiamo il percorso del modello in modo intelligente
    const modelPath = model.startsWith('publishers/')
      ? `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/${model}`
      : `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/publishers/google/models/${model}`;

    const setupPayload = {
      setup: {
        model: modelPath,
        generationConfig: {
          responseModalities: ['AUDIO'],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: {
          parts: [
            {
              text: `Sei l'assistente vocale per "${this.materiaService.materiaSelected()?.name}". Rispondi in modo naturale e conciso.`,
            },
          ],
        },
      },
    };

    console.log('⚙️ Invio setup con modello:', model);
    this.wsSubject?.next(setupPayload);
  }

  /**
   * Gestisce i messaggi dal server.
   * Con gemini-3.1-flash-live-preview: inputTranscription e outputTranscription
   * sono campi di serverContent (non top-level).
   */
  private handleServerMessage(message: any): void {
    console.log(message);

    // 1. Tool Call (RAG)
    if (message.toolCall) {
      this.isDiscardingAudio = false;
      const call = message.toolCall.functionCalls[0];
      if (call.name === 'search_knowledge_base') {
        console.log('🔍 [RAG TRIGGERED]:', call.args.query);
        this.isSearching.set(true);
        this.executeRagSearch(call.id, call.name, call.args.query);
      }
      return;
    }

    // 2. Audio Binario
    if (message._binaryAudio) {
      this.playPcmArrayBuffer(message._binaryAudio);
      return;
    }

    // 3. Setup Complete
    if (message.setupComplete !== undefined) {
      console.log('✅ Setup accettato! Sessione Live pronta.');
      this.isReady.set(true);
      return;
    }

    // 4. Server Content — audio, trascrizioni, interruzioni, turnComplete
    if (message.serverContent) {
      const content = message.serverContent;

      if (content.interrupted) {
        console.log('🛑 [INTERRUPTED]');
        this.isDiscardingAudio = true;
        this.stopAudioPlayback();
        this.isSpeaking.set(false);
        return;
      }

      // Trascrizione INPUT (quello che dice l'utente — da Gemini)
      // Quando l'utente inizia a parlare, resettiamo il transcript AI del turno precedente
      if (content.inputTranscription?.text) {
        console.log(
          '🎤 [Trascrizione UTENTE]:',
          content.inputTranscription.text,
        );
        this.aiTranscript.set('');
        this.userTranscript.set(content.inputTranscription.text);
      }

      // Trascrizione OUTPUT (quello che dice l'AI)
      if (content.outputTranscription?.text) {
        console.log('🤖 [Trascrizione AI]:', content.outputTranscription.text);
        this.aiTranscript.update(
          (prev) => prev + content.outputTranscription.text,
        );
      }

      if (content.turnComplete) {
        console.log('🏁 [TURN COMPLETE]');
        this.isSpeaking.set(false);
        this.turnCompleteEvent.update((v) => v + 1);
      }

      // Parti del turno AI (testo e audio in streaming)
      const modelTurn = content.modelTurn;
      if (modelTurn?.parts) {
        // Nuovo turno AI in arrivo: annulla lo scarto audio impostato da un'interruzione precedente
        this.isDiscardingAudio = false;
        modelTurn.parts.forEach((part: any) => {
          // Testo IA (usato come fallback se outputTranscription non arriva)
          if (part.text) {
            console.log('🤖 [Testo IA via part]:', part.text);
            this.aiTranscript.update((prev) => prev + part.text);
          }

          // Audio dell'IA
          if (part.inlineData?.data) {
            this.enqueueAudio(part.inlineData.data);
          }
        });
      }
    }
  }

  // Riproduce direttamente un ArrayBuffer di PCM16 raw (frame binario dal server)
  private playPcmArrayBuffer(buffer: ArrayBuffer): void {
    if (!this.audioContext || this.isDiscardingAudio) return;

    const pcm16 = new Int16Array(buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(
      1,
      float32.length,
      24000,
    );
    audioBuffer.copyToChannel(float32, 0);

    this.audioQueue.push(audioBuffer);
    if (!this.isPlayingAudio) {
      this.playNextInQueue();
    }
  }

  // Il server manda PCM 16-bit little-endian signed → va convertito in Float32.
  private enqueueAudio(base64Pcm: string): void {
    if (!this.audioContext || this.isDiscardingAudio) return;

    const binaryString = window.atob(base64Pcm);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(
      1,
      float32.length,
      24000,
    );
    audioBuffer.copyToChannel(float32, 0);

    this.audioQueue.push(audioBuffer);
    if (!this.isPlayingAudio) {
      this.playNextInQueue();
    }
  }

  private playNextInQueue(): void {
    if (!this.audioContext) return;

    // Assicurati che l'AudioContext sia attivo (il browser potrebbe sospenderlo).
    // resume() è asincrono: aspettiamo prima di procedere con la riproduzione.
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => this.playNextInQueue());
      return;
    }

    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;

      // Grace period: aspetta 800ms prima di dire che ha finito davvero.
      if (this.audioEndTimeout) clearTimeout(this.audioEndTimeout);
      this.audioEndTimeout = setTimeout(() => {
        if (!this.isPlayingAudio) {
          console.log('🔇 [AI SILENCE CONFIRMED]');
          this.isSpeaking.set(false);
          this.activeSource = null;
        }
      }, 800);

      return;
    }

    if (this.audioEndTimeout) {
      clearTimeout(this.audioEndTimeout);
      this.audioEndTimeout = null;
    }

    if (!this.isPlayingAudio) {
      this.aiTurnStartTime = performance.now();
    }

    this.isPlayingAudio = true;
    this.isSpeaking.set(true);

    const buffer = this.audioQueue.shift()!;
    const source = this.audioContext.createBufferSource();
    this.activeSource = source;

    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.onended = () => {
      if (this.activeSource === source) {
        this.activeSource = null;
        this.playNextInQueue();
      }
    };
    source.start(0);
  }

  // Ferma immediatamente ogni riproduzione audio e svuota la coda
  private stopAudioPlayback(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch (e) {
        // Già fermo o errore gestito
      }
      this.activeSource = null;
    }
    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.isSpeaking.set(false);
  }

  private async executeRagSearch(
    callId: string,
    functionName: string,
    query: string,
  ): Promise<void> {
    try {
      this.isSearching.set(true);
      console.log('⏳ Esecuzione RAG in corso per:', query);
      const ragStart = performance.now();

      const response = await firstValueFrom(
        this.http.post<any>('ai/rag-search', { query, limit: 4 }),
      );

      console.log(
        `⏱️ RAG completato in ${Math.round(performance.now() - ragStart)}ms`,
      );

      const docs = response.relevantDocuments || [];
      let ragTestoTrovato = '';

      if (docs.length > 0) {
        ragTestoTrovato = docs
          .map((d: any) => {
            const text = d.text || '';
            return text.length > 500 ? text.substring(0, 500) + '...' : text;
          })
          .join('\n\n---\n\n');
      } else {
        ragTestoTrovato = `Nessuna informazione trovata per la materia "${this.materiaService.materiaSelected()?.name}" riguardo a: ${query}`;
      }

      const toolResponsePayload = {
        toolResponse: {
          functionResponses: [
            {
              id: callId,
              name: functionName,
              response: {
                result: ragTestoTrovato,
              },
            },
          ],
        },
      };

      this.isDiscardingAudio = false;
      console.log('📨 Invio risultati RAG a Gemini:', toolResponsePayload);
      this.wsSubject?.next(toolResponsePayload);
    } catch (error) {
      console.error('Errore durante la ricerca RAG:', error);
      this.wsSubject?.next({
        toolResponse: {
          functionResponses: [
            {
              id: callId,
              name: functionName,
              response: { error: "Ricerca fallita, chiedi scusa all'utente." },
            },
          ],
        },
      });
    } finally {
      this.isSearching.set(false);
    }
  }
}
