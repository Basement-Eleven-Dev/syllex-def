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
  // Evento: il turno dell'utente è terminato (Gemini ha iniziato a rispondere).
  // Il testo dell'utente è leggibile da userTranscript() al momento dell'evento.
  public userTurnCompleteEvent = signal<number>(0);

  private wsSubject: WebSocketSubject<any> | null = null;
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private aiTurnStartTime = 0;
  private isDiscardingAudio = false;
  private audioQueue: AudioBuffer[] = [];
  private isPlayingAudio = false;
  private audioEndTimeout: any = null;

  // Buffer per la trascrizione utente da inputTranscription di Gemini
  private pendingUserText = '';

  private readonly PROJECT_ID = 'syllex-488315';
  private readonly LOCATION = 'us-central1';
  private resolvedModel = '';

  // Token cache — pre-fetched per eliminare la latenza al click del mic
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0; // timestamp ms
  private tokenFetchPromise: Promise<string> | null = null;
  private hasOutputTranscription = false; // true se outputTranscription è attiva → ignora part.text

  // Contesto tutor iniettato da agent-chat prima di connect()
  private tutorConfig: {
    name: string;
    tone: string;
    subjectName: string;
    userRole: 'teacher' | 'student' | 'admin';
    recentHistory: { role: 'user' | 'agent'; content: string }[];
  } | null = null;

  public setTutorConfig(config: {
    name: string;
    tone: string;
    subjectName: string;
    userRole: 'teacher' | 'student' | 'admin';
    recentHistory: { role: 'user' | 'agent'; content: string }[];
  }): void {
    this.tutorConfig = config;
  }

  private readonly LIVE_MODEL = 'gemini-live-2.5-flash-native-audio';

  /**
   * Pre-fetch del token OAuth. Chiamare PRIMA che l'utente clicchi il mic
   * (es. al caricamento della pagina) per eliminare la latenza.
   * Il token viene cachato per 50 minuti (i token Vertex durano 60 min).
   */
  public prefetchToken(): void {
    if (this.tokenFetchPromise) return; // già in corso
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) return; // ancora valido
    this.tokenFetchPromise = this.fetchToken();
    this.tokenFetchPromise.finally(() => (this.tokenFetchPromise = null));
  }

  private async fetchToken(): Promise<string> {
    console.log('🔄 Pre-fetch token in corso...');
    const response = await firstValueFrom<{ success: boolean; token: string }>(
      this.http.post<any>('ai/generatetoken', {}),
    );
    this.cachedToken = response.token;
    this.tokenExpiresAt = Date.now() + 50 * 60 * 1000; // 50 min
    console.log('✅ Token pre-fetched e cachato.');
    return response.token;
  }

  private async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }
    if (this.tokenFetchPromise) {
      return this.tokenFetchPromise;
    }
    return this.fetchToken();
  }

  public async connect(): Promise<void> {
    if (this.wsSubject) return;

    try {
      const token = await this.getToken();
      console.log('🔗 Connessione diretta al modello...');
      // Connessione diretta — niente più probe WebSocket + riconnessione
      this.resolvedModel = this.LIVE_MODEL;
      this.establishConnection(token, this.LIVE_MODEL);

      // Aspetta che il setup sia accettato (max 10s)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Setup timeout')),
          10000,
        );
        const check = setInterval(() => {
          if (this.isReady()) {
            clearTimeout(timeout);
            clearInterval(check);
            resolve();
          }
        }, 50);
      });
      console.log('✅ Sessione Live pronta.');
    } catch (error) {
      console.error('❌ Errore durante la connessione:', error);
      this.cleanupState();
    }
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
    this.hasOutputTranscription = false;
    this.pendingUserText = '';
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
    this.hasOutputTranscription = false;
    this.pendingUserText = '';
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
      clientContent: {
        turnComplete: true,
      },
    });
  }

  /**
   * Se c'è testo utente accumulato da inputTranscription, emette l'evento
   * userTurnCompleteEvent e resetta il buffer. Chiamato quando l'AI inizia
   * a rispondere (modelTurn, outputTranscription, toolCall).
   */
  private flushPendingUserText(): void {
    if (this.pendingUserText.trim()) {
      this.userTranscript.set(this.pendingUserText.trim());
      this.userTurnCompleteEvent.update((v) => v + 1);
      this.pendingUserText = '';
    }
  }

  private buildTutorSystemPrompt(): string {
    const cfg = this.tutorConfig;
    const subjectName =
      cfg?.subjectName ??
      this.materiaService.materiaSelected()?.name ??
      'questa materia';
    const name = cfg?.name ?? 'Tutor';
    const tone = cfg?.tone ?? 'friendly';
    const isTeacher = cfg?.userRole === 'teacher' || cfg?.userRole === 'admin';

    if (isTeacher) {
      return `## IDENTITÀ
Sei ${name}, assistente didattico vocale per il docente della materia "${subjectName}". Supporti la preparazione delle lezioni, la strutturazione degli argomenti e qualsiasi necessità didattica. Tono: ${tone}. Rispondi in modo naturale e conversazionale.

## FONTE DI CONOSCENZA
Hai accesso a uno strumento chiamato search_knowledge_base che recupera estratti dai materiali didattici ufficiali di "${subjectName}".
Usa search_knowledge_base per rispondere a domande su NUOVI argomenti specifici mai discussi prima. Per domande didattiche generali puoi usare la tua conoscenza, segnalando che non proviene dal materiale.

## REGOLE OPERATIVE

### REGOLA 1 — QUANDO USARE search_knowledge_base
- **Domande su NUOVI argomenti** (concetti, definizioni MAI discussi prima nella conversazione): chiama search_knowledge_base.
- **PROIBITO ASSOLUTO chiamare search_knowledge_base quando l'utente si riferisce a qualcosa GIÀ DETTO nella conversazione.**
  Questo include: "punto X", "cosa mi dici del punto X", "esploriamo il secondo", "non mi convince la 6", "quello che hai detto", "dimmi di più", "approfondisci", "torna a quel concetto", "si preparano".
  In TUTTI questi casi DEVI rispondere usando il contesto della conversazione, SENZA chiamare search_knowledge_base.
- **Test**: prima di chiamare search_knowledge_base, chiediti: "Questa informazione è già stata discussa nella conversazione?" Se sì → NON chiamare.

### REGOLA 2 — COLLABORAZIONE
- Dai sempre priorità al contenuto del materiale caricato (search_knowledge_base)
- Puoi aiutare a strutturare lezioni, creare domande di verifica, rielaborare concetti
- Rimani focalizzato su "${subjectName}" e sulla didattica

## STILE VOCALE
- Lingua: speculare a quella del docente
- Frasi brevi e dirette, adatte alla voce
- Tono professionale e collaborativo
- Presentati solo al primo messaggio o se richiesto${this.buildRecentHistoryBlock()}`;
    }

    return `## IDENTITÀ
Sei ${name}, tutor di studio vocale per la materia "${subjectName}". Il tuo unico scopo è aiutare lo studente a CAPIRE i concetti della materia, non a fornire risposte preconfezionate. Tono: ${tone}. Rispondi in modo naturale e conversazionale.

## FONTE DI CONOSCENZA — UNICA E ASSOLUTA
Hai accesso a uno strumento chiamato search_knowledge_base che recupera estratti dai materiali didattici ufficiali di "${subjectName}".

## REGOLE OPERATIVE — OBBLIGATORIE, NESSUNA ECCEZIONE

### REGOLA 1 — QUANDO USARE search_knowledge_base
- **Domande su NUOVI argomenti** (concetti MAI discussi prima): chiama SUBITO search_knowledge_base con una query precisa. Usa SOLO il testo restituito.
- **PROIBITO ASSOLUTO chiamare search_knowledge_base quando l'utente si riferisce a qualcosa GIÀ DETTO nella conversazione.**
  Questo include: "punto X", "cosa mi dici del punto X", "esploriamo il secondo", "dimmi di più", "approfondisci", "si preparano", "quello che hai detto".
  In TUTTI questi casi DEVI rispondere usando il contesto della conversazione, SENZA chiamare search_knowledge_base.
- **Test**: prima di chiamare, chiediti: "Questa informazione è già nella conversazione?" Se sì → NON chiamare.
- Se search_knowledge_base non trova nulla: rispondi "Questo argomento non è trattato nei materiali di ${subjectName} che ho a disposizione."

### REGOLA 2 — PROIBITO ASSOLUTO: CONOSCENZA ESTERNA
NON attingere MAI al tuo addestramento generale. Zero eccezioni.

### REGOLA 3 — PROIBITO ASSOLUTO: RISPOSTA DIRETTA A ESERCIZI
Se lo studente chiede la soluzione a un esercizio o la risposta a un test:
NON fornire la risposta. Guida: spiega il concetto, poi chiedi allo studente di provare.

### REGOLA 4 — METODOLOGIA DIDATTICA
Quando spieghi un concetto:
1. Spiega chiaramente partendo dal materiale trovato
2. Porta un esempio concreto dal materiale (se disponibile)
3. Per risposte complesse, chiedi una breve verifica vocale

### REGOLA 5 — SCOPING MATERIA
Argomenti non pertinenti a "${subjectName}": rifiuta con "Sono il tutor di ${subjectName} e posso aiutarti solo su questa materia."

## STILE VOCALE
- Lingua: speculare a quella dello studente
- Frasi brevi e dirette, adatte alla voce
- Niente introduzioni verbose
- Presentati solo al primo messaggio o se richiesto esplicitamente${this.buildRecentHistoryBlock()}`;
  }

  private buildRecentHistoryBlock(): string {
    const history = this.tutorConfig?.recentHistory;
    if (!history || history.length === 0) return '';
    const lines = history
      .map((m) => `${m.role === 'user' ? 'Utente' : 'Tutor'}: ${m.content}`)
      .join('\n');
    return `

## CONTESTO CONVERSAZIONE PRECEDENTE (CRITICO)
La conversazione con l'utente è GIÀ iniziata (in modalità testuale o vocale). Questi sono i messaggi scambiati finora.
DEVI considerarli come TUOI messaggi precedenti. Se l'utente dice "punto 4", "quello che hai detto", "approfondisci", si riferisce a QUESTO contesto.
NON ripetere il saluto o la presentazione. NON chiedere "come posso aiutarti" se la conversazione è già in corso.

${lines}`;
  }

  private buildSetupPayload(modelPath: string): object {
    return {
      setup: {
        model: modelPath,
        generationConfig: {
          responseModalities: ['AUDIO'],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: {
          parts: [{ text: this.buildTutorSystemPrompt() }],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'search_knowledge_base',
                description:
                  'Cerca nei materiali didattici ufficiali della materia per trovare informazioni su un NUOVO argomento specifico. ' +
                  "ATTENZIONE: NON chiamare questa funzione se l'utente si riferisce a qualcosa già presente nella conversazione " +
                  '(es. "punto 4", "il secondo", "dimmi di più", "esploriamo quello", "si preparano"). ' +
                  'In quei casi, la risposta è già nei turni precedenti — NON cercare nei documenti. ' +
                  "Se l'utente specifica un documento, usa il parametro documentName per filtrare.",
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    query: {
                      type: 'STRING',
                      description:
                        'La domanda o il concetto da cercare nei materiali didattici',
                    },
                    documentName: {
                      type: 'STRING',
                      description:
                        'OPZIONALE. Nome del documento specifico in cui cercare, se indicato esplicitamente.',
                    },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'list_available_materials',
                description:
                  'Restituisce la lista dei documenti disponibili per questa materia. ' +
                  "Usa quando l'utente chiede 'quali documenti hai?', 'che materiali ci sono?', " +
                  'o quando serve disambiguare tra più fonti.',
                parameters: {
                  type: 'OBJECT',
                  properties: {},
                },
              },
            ],
          },
        ],
      },
    };
  }

  private sendSetupMessage(model: string): void {
    // Costruiamo il percorso del modello in modo intelligente
    const modelPath = model.startsWith('publishers/')
      ? `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/${model}`
      : `projects/${this.PROJECT_ID}/locations/${this.LOCATION}/publishers/google/models/${model}`;

    const setupPayload = this.buildSetupPayload(modelPath);
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

    // 1. Tool Call (RAG or list)
    if (message.toolCall) {
      this.isDiscardingAudio = false;
      // L'AI ha deciso di fare un tool call → il turno utente è finito
      this.flushPendingUserText();
      const call = message.toolCall.functionCalls[0];
      if (call.name === 'search_knowledge_base') {
        console.log(
          '🔍 [RAG TRIGGERED]:',
          call.args.query,
          '| doc:',
          call.args.documentName || '(tutti)',
        );
        this.isSearching.set(true);
        this.executeRagSearch(
          call.id,
          call.name,
          call.args.query,
          call.args.documentName,
        );
      } else if (call.name === 'list_available_materials') {
        console.log('📋 [LIST MATERIALS TRIGGERED]');
        this.isSearching.set(true);
        this.executeListMaterials(call.id, call.name);
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
      if (content.inputTranscription?.text) {
        // Accumula la trascrizione utente (Gemini manda frammenti)
        this.pendingUserText += content.inputTranscription.text;
        this.userTranscript.set(this.pendingUserText);
      }

      // Trascrizione OUTPUT (quello che dice l'AI)
      if (content.outputTranscription?.text) {
        // AI ha iniziato a parlare → fluscia il testo utente pendente
        this.flushPendingUserText();
        this.hasOutputTranscription = true;
        this.aiTranscript.update(
          (prev) => prev + content.outputTranscription.text,
        );
      }

      if (content.turnComplete) {
        console.log('🏁 [TURN COMPLETE]');
        this.hasOutputTranscription = false;
        this.isSpeaking.set(false);
        // NON azzeriamo aiTranscript qui — resta visibile finché
        // non arriva il prossimo turno AI (evita flash visivo)
        this.turnCompleteEvent.update((v) => v + 1);
      }

      // Parti del turno AI (testo e audio in streaming)
      const modelTurn = content.modelTurn;
      if (modelTurn?.parts) {
        // L'AI ha iniziato a rispondere → il turno dell'utente è finito.
        // Se c'è testo utente accumulato, emetti l'evento prima di processare l'audio.
        if (this.pendingUserText.trim()) {
          this.userTranscript.set(this.pendingUserText.trim());
          this.userTurnCompleteEvent.update((v) => v + 1);
          this.pendingUserText = '';
        }
        // Nuovo turno AI in arrivo: annulla lo scarto audio impostato da un'interruzione precedente
        this.isDiscardingAudio = false;
        modelTurn.parts.forEach((part: any) => {
          // Testo IA — solo come fallback se outputTranscription NON è attiva
          // (evita duplicazione quando entrambi i canali sono attivi)
          if (part.text && !this.hasOutputTranscription) {
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
    documentName?: string,
  ): Promise<void> {
    try {
      this.isSearching.set(true);
      console.log(
        '⏳ Esecuzione RAG in corso per:',
        query,
        documentName ? `(doc: ${documentName})` : '',
      );
      const ragStart = performance.now();

      const response = await firstValueFrom(
        this.http.post<any>('ai/rag-search', { query, limit: 8, documentName }),
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
            const source = d.document_name
              ? `[📄 ${d.document_name}]`
              : '[📄 Documento]';
            const truncated =
              text.length > 600 ? text.substring(0, 600) + '...' : text;
            return `${source}\n${truncated}`;
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

  private async executeListMaterials(
    callId: string,
    functionName: string,
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>('ai/list-materials'),
      );
      const materials = response.materials || [];
      const list =
        materials.length > 0
          ? materials
              .map((m: any, i: number) => `${i + 1}. ${m.name}`)
              .join('\n')
          : 'Nessun materiale caricato per questa materia.';

      this.wsSubject?.next({
        toolResponse: {
          functionResponses: [
            {
              id: callId,
              name: functionName,
              response: {
                result: `Documenti disponibili (${materials.length} totali):\n${list}`,
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Errore lista materiali:', error);
      this.wsSubject?.next({
        toolResponse: {
          functionResponses: [
            {
              id: callId,
              name: functionName,
              response: { error: 'Impossibile recuperare la lista.' },
            },
          ],
        },
      });
    } finally {
      this.isSearching.set(false);
    }
  }
}
