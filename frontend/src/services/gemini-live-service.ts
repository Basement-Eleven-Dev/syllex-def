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

  private wsSubject: WebSocketSubject<any> | null = null;
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private aiTurnStartTime = 0; // Per gestire il grace period del barge-in
  private isDiscardingAudio = false; // Flag per scartare audio orfano dopo interruzione
  private audioQueue: AudioBuffer[] = [];
  private isPlayingAudio = false;

  private readonly PROJECT_ID = 'syllex-488315';
  private readonly LOCATION = 'us-central1';
  // Modello corretto per il Live API su Vertex AI
  private readonly MODEL = 'gemini-live-2.5-flash-native-audio';

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

      // FIX: v1beta1 — il Live API esiste solo su questa versione, non su v1
      const wsUrl = `wss://${this.LOCATION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${token}`;

      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({
        sampleRate: 24000,
      });

      console.log('🔗 3. Connessione al WebSocket Vertex AI...');

      // WebSocketCtor custom che imposta binaryType='arraybuffer':
      // di default RxJS usa 'blob', che non è leggibile sincronamente nel deserializer.
      // Con 'arraybuffer' possiamo distinguere i frame audio binari da quelli JSON testuali.
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
            console.log('✅ WebSocket aperto, invio setup...');
            this.isConnected.set(true);
            this.sendSetupMessage();
          },
        },
        closeObserver: {
          next: (closeEvent: CloseEvent) => {
            console.warn(
              `🔌 WebSocket close — code: ${closeEvent.code}, reason: "${closeEvent.reason}", wasClean: ${closeEvent.wasClean}`,
            );
          },
        },
        deserializer: (e: MessageEvent) => {
          // Vertex AI manda i frame come messaggi WebSocket binari contenenti JSON UTF-8,
          // NON come PCM grezzo. Dobbiamo decodificare prima come testo.
          if (e.data instanceof ArrayBuffer) {
            try {
              const text = new TextDecoder('utf-8').decode(e.data);
              return JSON.parse(text);
            } catch {
              // Solo se non è JSON valido lo trattiamo come PCM grezzo
              return { _binaryAudio: e.data };
            }
          }
          // Frame testuale normale
          try {
            return JSON.parse(e.data);
          } catch {
            return e.data;
          }
        },
      });

      this.wsSubject.subscribe({
        next: (msg: any) => {
          console.log('📩 [Vertex AI]:', msg);
          if (msg.error) {
            console.error('❌ ERRORE DA GOOGLE:', msg.error);
          }
          this.handleServerMessage(msg);
        },
        error: (err) => {
          console.error('💥 ERRORE WEBSOCKET (Connessione o Rete):', err);
          this.cleanupState();
        },
        complete: () => {
          console.warn('🔌 WEBSOCKET CHIUSO DAL SERVER (Complete)');
          this.cleanupState();
        },
      });
    } catch (error) {
      console.error('❌ ERRORE CRITICO in connect():', error);
      this.isConnected.set(false);
      throw error;
    }
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
    if (!this.wsSubject || !this.isConnected()) return;

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

  private sendSetupMessage(): void {
    const modelTarget = `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/publishers/google/models/${this.MODEL}`;

    // FIX: campi in camelCase (proto-JSON richiede camelCase, non snake_case)
    const setupPayload = {
      setup: {
        model: modelTarget,
        tools: [
          {
            functionDeclarations: [
              {
                name: 'search_knowledge_base',
                description:
                  'Cerca nei documenti del professore. Usala SOLO per domande specifiche sulla materia, MAI per saluti, convenevoli o domande generiche.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    query: {
                      type: 'STRING',
                      description:
                        'La domanda o le parole chiave da cercare nei documenti.',
                    },
                  },
                  required: ['query'],
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: `Sei l'assistente vocale per "${this.materiaService.materiaSelected()?.name}". Rispondi a saluti e convenevoli direttamente senza usare strumenti. Per domande specifiche sul contenuto della materia, prima di chiamare 'search_knowledge_base' di' sempre brevemente che stai cercando (es: "Un attimo...", "Controllo subito..."). Se non trovi nulla, dillo. NON inventare. Sii breve e naturale.`,
            },
          ],
        },
      },
    };

    console.log(
      '⚙️ Invio payload di Setup (Formato Corretto) a Vertex:',
      setupPayload,
    );
    this.wsSubject?.next(setupPayload);
  }

  private handleServerMessage(message: any): void {
    if (message.toolCall) {
      // L'IA ha deciso di usare un tool: resetta lo scarto audio
      // perché qualsiasi audio futuro sarà della nuova risposta
      this.isDiscardingAudio = false;

      const call = message.toolCall.functionCalls[0];
      if (call.name === 'search_knowledge_base') {
        console.log(
          '🔍 [RAG TRIGGERED] Gemini chiede di cercare:',
          call.args.query,
        );
        this.executeRagSearch(call.id, call.name, call.args.query);
      }
      return;
    }

    // Frame binario: PCM16 raw direttamente come ArrayBuffer
    if (message._binaryAudio) {
      this.playPcmArrayBuffer(message._binaryAudio);
      return;
    }

    // Il server manda setupComplete quando il setup è accettato
    if (message.setupComplete !== undefined) {
      console.log(
        '✅ Setup accettato dal server Vertex AI! Pronto a ricevere audio.',
      );
      this.isReady.set(true); // <--- ORA PUOI INVIARE AUDIO
      return;
    }

    // GESTIONE INTERRUZIONE (Barge-in)
    // Se il server dice "interrupted", obbediamo SEMPRE. Nessuna condizione locale.
    if (message.serverContent?.interrupted) {
      console.warn('🛑 [Barge-in] Segnale INTERRUPTED ricevuto dal server. Stop immediato.');
      this.isDiscardingAudio = true;
      this.stopAudioPlayback();
      return;
    }

    if (message.serverContent) {
      const { modelTurn } = message.serverContent;

      // Risposta IA: smetti di scartare audio
      if (modelTurn) {
        this.isDiscardingAudio = false;

        if (modelTurn.parts) {
          // Audio base64 nel body JSON (fallback per compatibilità)
          const audioPart = modelTurn.parts.find((p: any) => p.inlineData);
          if (audioPart?.inlineData?.data) {
            this.enqueueAudio(audioPart.inlineData.data);
          }
        }
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
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      this.isSpeaking.set(false);
      this.activeSource = null;
      return;
    }

    // Segnamo l'inizio del turno solo quando si passa da "silenzio" a "parlando"
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
      
      console.log(`⏱️ RAG completato in ${Math.round(performance.now() - ragStart)}ms`);
      
      const docs = response.relevantDocuments || [];
      let ragTestoTrovato = "";

      if (docs.length > 0) {
        // Tronca ogni doc a max 500 caratteri per velocizzare la risposta di Gemini
        ragTestoTrovato = docs.map((d: any) => {
          const text = d.text || '';
          return text.length > 500 ? text.substring(0, 500) + '...' : text;
        }).join("\n\n---\n\n");
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

      // Resetta il flag prima di inviare: la prossima audio sarà la risposta
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
