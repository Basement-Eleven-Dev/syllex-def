import {
  Component,
  ElementRef,
  inject,
  input,
  signal,
  ViewChild,
  OnInit,
  OnDestroy,
  effect,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane } from '@fortawesome/pro-regular-svg-icons';
import { MarkdownComponent } from 'ngx-markdown';
import {
  faHeadphones,
  faPlay,
  faPause,
  faSparkles,
  faLightbulb,
  faBookOpen,
  faQuestionCircle,
  faStop,
  faPlus,
  faChevronLeft,
  faChevronRight,
  faKeyboard,
  faWaveformLines,
  faTrash,
  faComment,
  faBars,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import { faSpinner } from '@fortawesome/pro-regular-svg-icons';
import { AgentService } from '../../../services/agent.service';
import { FeedbackService } from '../../../services/feedback-service';
import { GeminiLiveService } from '../../../services/gemini-live-service';
import { Materia } from '../../../services/materia';
import { firstValueFrom } from 'rxjs';
import { SyllexButton } from '../UI/syllex-button/syllex-button';
import { SyllexBadge } from '../UI/syllex-badge/syllex-badge';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { AlexMascot } from '../../../app/shared/components/alex-mascot/alex-mascot';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';

export interface ChatMessage {
  _id?: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string | null;
  inputType?: 'text' | 'voice';
}

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    MarkdownComponent,
    AlexMascot,
    TranslocoDirective,
    SyllexBadge,
    NgbTooltip,
  ],
  templateUrl: './agent-chat.html',
  styleUrl: './agent-chat.scss',
})
export class AgentChat implements OnInit, OnDestroy {
  readonly newChatBtnProps = {
    label: 'Nuova Chat',
    variant: 'primary' as const,
    color: 'celestine' as const,
    size: 'medium' as const,
    leftIcon: faPlus,
  };
  // --- Icons ---
  SendIcon = faPaperPlane;
  faHeadphones = faHeadphones;
  audioPlay = faPlay;
  audioPause = faPause;
  faSpinner = faSpinner;
  faSparkles = faSparkles;
  faLightbulb = faLightbulb;
  faBookOpen = faBookOpen;
  faQuestionCircle = faQuestionCircle;
  faStop = faStop;
  faPaperPlane = faPaperPlane;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faKeyboard = faKeyboard;
  faWaveformLines = faWaveformLines;
  faTrash = faTrash;
  faComment = faComment;
  faBars = faBars;
  faTimes = faTimes;

  // Sidebar collassabile
  sidebarOpen = signal(true);
  mobileHistoryOpen = signal(false);

  // Inline delete confirmation
  pendingDeleteId = signal<string | null>(null);
  private deleteResetTimeout: any = null;

  // --- Services ---
  private feedbackService = inject(FeedbackService);
  public geminiLiveService = inject(GeminiLiveService);
  private materiaService = inject(Materia);
  constructor(private agentService: AgentService) {}

  // --- Inputs ---
  assistantId = input.required<string>();
  userRole = input<'teacher' | 'student' | 'admin' | null>(null);

  // --- State ---
  messages = signal<ChatMessage[]>([]);
  assistantName = signal<string>('Alex');
  conversations = signal<any[]>([]);
  currentConversationId = signal<string>('');
  inputMessage = '';
  isLoading = signal(false);
  faPlus = faPlus;

  // Gestione Modalità UI
  voiceModeActive = signal(false);

  // Voice input state (Realtime)
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: any = null;
  public recognition: any = null;
  isRecording = signal(false);
  isMuted = signal(false);

  // Pending voice message saves — tracked to await before mode switch
  private pendingSaves: Promise<any>[] = [];
  liveTranscript = signal('');

  // Audio playback state
  loadingAudioIds = signal<Set<string>>(new Set());
  currentPlayingId = signal<string | null>(null);
  activeAudio: HTMLAudioElement | null = null;

  @ViewChild('scrollContent')
  private scrollContent!: ElementRef<HTMLDivElement>;

  ngOnInit() {
    // Pre-fetch del token OAuth per eliminare la latenza al primo click del mic
    this.geminiLiveService.prefetchToken();
  }

  ngOnDestroy() {
    this.stopRealtimeVoice();
    this.pauseAudio();
    if (this.deleteResetTimeout) clearTimeout(this.deleteResetTimeout);
  }

  // Effetto: scrolla sempre in fondo quando cambia la lista dei messaggi
  private scrollEffect = effect(() => {
    if (this.messages().length > 0) {
      this.scrollToBottom();
    }
  });

  // Carica le conversazioni al mount e ogni volta che cambia l'assistantId
  private roleWatcher = effect(() => {
    const aid = this.assistantId();
    if (aid) {
      this.loadConversationsList();
    }
  });

  // Effetto: Quando il turno utente è completo (Gemini ha capito cosa ha detto),
  // salviamo il messaggio utente usando la trascrizione di Gemini (più affidabile
  // del SpeechRecognition locale che viene bloccato quando l'AI parla)
  private userVoiceTranscriptEffect = effect(() => {
    this.geminiLiveService.userTurnCompleteEvent();

    const text = untracked(() => this.geminiLiveService.userTranscript());

    if (text.trim().length > 0) {
      untracked(() => {
        this.saveVoiceMessage('user', text);
      });
    }
  });

  // Effetto: Quando Gemini Live finisce di parlare, salviamo la trascrizione
  // Si attiva SOLO al segnale di fine turno
  private lastSavedAiText = '';
  private aiVoiceTranscriptEffect = effect(() => {
    // Ci iscriviamo in ascolto unicamente a questo evento
    this.geminiLiveService.turnCompleteEvent();

    // Usiamo untracked per leggere l'intero testo senza innescare l'effetto ad ogni singola lettera ricevuta
    const text = untracked(() => this.geminiLiveService.aiTranscript());

    if (text.trim().length > 0 && text !== this.lastSavedAiText) {
      this.lastSavedAiText = text;

      untracked(() => {
        this.saveVoiceMessage('agent', text);
        // NON azzeriamo aiTranscript qui — resta visibile nella bolla "in diretta"
        // finché l'utente non ricomincia a parlare (vedi muteUIEffect)
      });
    }
  });

  // 2. Effetto: mute mic + stop/start SpeechRecognition durante parlato AI
  // Quando AI parla: ferma recognition (niente risultati fantasma), muta PCM
  // Quando AI smette: grace period 300ms, poi riattiva recognition
  private speakingGraceTimeout: any = null;
  private muteUIEffect = effect(
    () => {
      const isSpeaking = this.geminiLiveService.isSpeaking();
      const voiceActive = this.voiceModeActive();

      if (!voiceActive) return;

      if (isSpeaking) {
        // AI sta parlando → blocca tutto
        if (this.speakingGraceTimeout) {
          clearTimeout(this.speakingGraceTimeout);
          this.speakingGraceTimeout = null;
        }
        this.isMuted.set(true);
        if (this.recognition) {
          try {
            this.recognition.stop();
          } catch {}
        }
      } else {
        // AI ha smesso → grace period poi riattiva
        if (this.speakingGraceTimeout) clearTimeout(this.speakingGraceTimeout);
        this.speakingGraceTimeout = setTimeout(() => {
          if (this.voiceModeActive() && !this.geminiLiveService.isSpeaking()) {
            this.isMuted.set(false);
            // Riavvia SpeechRecognition (se era stato stoppato)
            if (this.recognition) {
              try {
                this.recognition.start();
              } catch {}
            }
          }
        }, 300);
      }
    },
    { allowSignalWrites: true },
  );

  private saveVoiceMessage(role: 'user' | 'agent', content: string) {
    const convId = this.currentConversationId();
    if (!convId) return;

    // Aggiungi localmente per visione immediata
    const newMsg: ChatMessage = {
      role,
      content,
      timestamp: new Date(),
      inputType: 'voice',
    };
    this.messages.update((prev) => [...prev, newMsg]);

    // Se è l'utente, puliamo il transcript AI precedente per far spazio al nuovo turno
    if (role === 'user') {
      this.geminiLiveService.aiTranscript.set('');
      this.lastSavedAiText = '';
    }

    // Salva nel DB e traccia la promise — verrà attesa prima del cambio modalità
    const savePromise = firstValueFrom(
      this.agentService.saveLiveMessage(role, content, convId, 'voice'),
    );
    this.pendingSaves.push(savePromise);
    savePromise
      .then((res) => {
        // Backfill dell'_id sul messaggio locale dalla risposta del salvataggio.
        // Serve al TTS "Ascolta" dopo l'uscita dalla voce. Sostituisce il vecchio
        // polling a 1 Hz che ricaricava l'intera cronologia solo per questo.
        if (res?._id) {
          this.messages.update((msgs) =>
            msgs.map((m) => (m === newMsg ? { ...m, _id: res._id } : m)),
          );
        }
        this.pendingSaves = this.pendingSaves.filter((p) => p !== savePromise);
      })
      .catch((err) => {
        console.error('[Voice] Save failed:', err);
        this.pendingSaves = this.pendingSaves.filter((p) => p !== savePromise);
      });
  }

  // ==================
  // CONVERSATIONS
  // ==================

  loadConversationsList() {
    this.agentService.listConversations().subscribe({
      next: (res) => {
        this.conversations.set(res);
        // Seleziona automaticamente solo se non c'è già una conversazione attiva valida
        // (un ID valido è uno che esiste nella lista del DB, non un ID finto locale)
        // Popola la sidebar ma non auto-seleziona mai una vecchia conversazione:
        // l'utente inizia sempre con una chat nuova, la cronologia è nella sidebar
        const currentId = this.currentConversationId();
        const isValidId = currentId && res.some((c) => c.id === currentId);
        if (!isValidId) {
          this.startNewChat();
        }
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        if (!this.currentConversationId()) {
          this.startNewChat();
        }
      },
    });
  }

  /**
   * Aggiorna la sola lista in sidebar (preview/titoli/nuove conversazioni),
   * SENZA la logica di reset di loadConversationsList: così una conversazione
   * appena iniziata compare subito in cronologia senza ricaricare la pagina.
   */
  private refreshConversations() {
    this.agentService.listConversations().subscribe({
      next: (res) => this.conversations.set(res),
      error: () => {},
    });
  }

  startNewChat() {
    this.geminiLiveService.aiTranscript.set('');
    this.lastSavedAiText = '';
    const newId = 'conv_' + Date.now();
    this.currentConversationId.set(newId);
    this.messages.set([]);
    this.voiceModeActive.set(false);
  }

  selectConversation(id: string) {
    this.currentConversationId.set(id);
    this.initializeChatHistory(id);
    this.mobileHistoryOpen.set(false);
  }

  requestDeleteConversation(id: string, event: Event) {
    event.stopPropagation();
    if (this.deleteResetTimeout) clearTimeout(this.deleteResetTimeout);
    this.pendingDeleteId.set(id);
    // Auto-reset dopo 3 secondi senza conferma
    this.deleteResetTimeout = setTimeout(
      () => this.pendingDeleteId.set(null),
      3000,
    );
  }

  cancelDelete(event: Event) {
    event.stopPropagation();
    if (this.deleteResetTimeout) clearTimeout(this.deleteResetTimeout);
    this.pendingDeleteId.set(null);
  }

  deleteConversation(id: string, event: Event) {
    event.stopPropagation();
    if (this.deleteResetTimeout) clearTimeout(this.deleteResetTimeout);
    this.pendingDeleteId.set(null);
    this.agentService.deleteConversation(id).subscribe({
      next: () => {
        this.feedbackService.showFeedback(
          'Conversazione cancellata con successo',
          true,
        );
        this.agentService.listConversations().subscribe((res) => {
          this.conversations.set(res);
          // If we deleted the currently active conversation, switch or start a new one
          if (this.currentConversationId() === id) {
            if (res.length > 0) {
              this.selectConversation(res[0].id);
            } else {
              this.startNewChat();
            }
          }
        });
      },
      error: (err) => {
        console.error('Error deleting conversation:', err);
        this.feedbackService.showFeedback(
          'Errore nella cancellazione della conversazione',
          false,
        );
      },
    });
  }

  // ==================
  // MESSAGE SENDING
  // ==================

  setAndSendMessage(text: string) {
    this.inputMessage = text;
    this.sendMessage('text');
  }

  async sendMessage(inputType: 'text' | 'voice' = 'text') {
    const text = this.inputMessage.trim();
    const convId = this.currentConversationId();

    if (!text || !convId || this.isLoading()) return;

    // Se ci sono salvataggi vocali ancora in corso, attendiamo prima
    // di inviare — altrimenti il backend non vedrebbe i messaggi voice nel DB
    if (this.pendingSaves.length > 0) {
      await Promise.allSettled(this.pendingSaves);
      this.pendingSaves = [];
    }

    // Aggiungi localmente il messaggio dell'utente
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: text, timestamp: new Date(), inputType },
    ]);
    this.inputMessage = '';
    this.scrollToBottom();

    this.isLoading.set(true);

    // Usa la rotta REST standard (generateResponse) per la chat testuale
    this.agentService.generateResponse(text, convId, inputType).subscribe({
      next: (response) => {
        if (response.success) {
          const agentMsg: ChatMessage = {
            _id: response._id,
            role: 'agent',
            content: response.aiResponse,
            timestamp: new Date(),
            audioUrl: null,
          };
          this.messages.update((msgs) => [...msgs, agentMsg]);
          this.isLoading.set(false);
          this.scrollToBottom();

          // Aggiorna la cronologia in sidebar (nuova conversazione / preview)
          this.refreshConversations();

          // Auto-play TTS solo se l'input era vocale (modalità classica)
          if (inputType === 'voice' && response._id) {
            this.autoPlayResponse(response._id, response.aiResponse);
          }
        } else {
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error generating response:', error);
        this.feedbackService.showFeedback(
          'Errore nella generazione della risposta',
          false,
        );
        this.isLoading.set(false);
      },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage('text');
    }
  }

  // ==================
  // VOICE INPUT (STT)
  // ==================

  get isSpeechSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  async toggleVoiceInput() {
    if (this.voiceModeActive()) {
      this.stopRealtimeVoice();

      // Attendi che TUTTI i salvataggi vocali siano completati nel DB
      if (this.pendingSaves.length > 0) {
        await Promise.allSettled(this.pendingSaves);
        this.pendingSaves = [];
      }

      this.voiceModeActive.set(false);

      // Ricarica lo storico dal DB per garantire che il modello testuale
      // veda TUTTI i messaggi vocali appena salvati
      const convId = this.currentConversationId();
      if (convId) {
        this.initializeChatHistory(convId);
      }
      // La conversazione (eventualmente nuova, iniziata in voce) compare in sidebar
      this.refreshConversations();
    } else {
      this.voiceModeActive.set(true);
      this.startRealtimeVoice();
    }
  }

  finishTurn() {
    // 1. Muta immediatamente il microfono per bloccare ulteriore invio audio e mostrare "Pensando..."
    this.isMuted.set(true);

    // 2. Stoppa la trascrizione SpeechRecognition locale
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    // 3. Invia il segnale nativo di fine turno al WebSocket (latenza zero)
    this.geminiLiveService.sendEndOfTurn();
  }

  public async startRealtimeVoice() {
    try {
      this.isRecording.set(true);
      this.geminiLiveService.userTranscript.set('');
      this.geminiLiveService.aiTranscript.set('');

      // TUTTI i messaggi come contesto (non solo ultimi 10)
      const recentHistory = this.messages().map((m) => ({
        role: m.role as 'user' | 'agent',
        content: m.content,
      }));

      const name = 'Alex';
      const tone = 'friendly';

      this.geminiLiveService.setTutorConfig({
        name,
        tone,
        subjectName:
          this.materiaService.materiaSelected()?.name ?? 'questa materia',
        userRole: this.userRole() ?? 'student',
        recentHistory,
      });

      await this.geminiLiveService.connect();
      this.startUserTranscriptRecognition(); // Avvia transcrito visuale

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
      });

      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({
        sampleRate: 16000,
      });

      // Carica il processore AudioWorklet
      await this.audioContext.audioWorklet.addModule('/pcm-processor.js');

      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.processor = new AudioWorkletNode(this.audioContext, 'pcm-processor');

      this.processor.port.onmessage = (event: any) => {
        if (!this.geminiLiveService.isReady() || this.isMuted()) return;

        const inputData = event.data; // Riceve Float32Array dal worklet
        const pcm16 = new Int16Array(inputData.length);

        // Conversione in PCM 16-bit
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Converti in Base64 (metodo efficiente con Uint8Array)
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        this.geminiLiveService.sendAudioChunk(window.btoa(binary));
      };

      // Collega solo source → processor (il worklet invia audio via port.postMessage,
      // NON va connesso al destination altrimenti il mic viene ritrasmesso agli speaker)
      source.connect(this.processor);
    } catch (err) {
      console.error('Errore avvio Realtime:', err);
      this.feedbackService.showFeedback(
        'Impossibile accedere al microfono',
        false,
      );
      this.voiceModeActive.set(false);
      this.isRecording.set(false);
    }
  }

  /** Avvia il riconoscimento locale SOLO per il feedback visivo e il salvataggio testo */
  private startUserTranscriptRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'it-IT';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.recognition.onresult = (event: any) => {
      if (this.isMuted() || this.geminiLiveService.isSpeaking()) {
        return;
      }

      // SpeechRecognition locale è usato SOLO per il feedback visivo in tempo reale.
      // Il salvataggio dei messaggi utente avviene via userTurnCompleteEvent
      // (da inputTranscription di Gemini, che è più affidabile e non viene
      // bloccato dal mute durante il parlato AI).
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Utente ha iniziato a parlare → azzera il transcript AI del turno precedente
      if (interimTranscript && this.geminiLiveService.aiTranscript()) {
        this.geminiLiveService.aiTranscript.set('');
      }

      if (interimTranscript) {
        this.geminiLiveService.userTranscript.set(interimTranscript);
      }
    };

    // Riavvia automaticamente recognition se si chiude da sola (timeout browser)
    this.recognition.onend = () => {
      if (
        this.voiceModeActive() &&
        !this.isMuted() &&
        !this.geminiLiveService.isSpeaking()
      ) {
        try {
          this.recognition?.start();
        } catch {}
      }
    };

    this.recognition.start();
  }

  public async exitVoiceMode() {
    this.stopRealtimeVoice();

    // Attendi che TUTTI i salvataggi vocali siano completati nel DB
    if (this.pendingSaves.length > 0) {
      await Promise.allSettled(this.pendingSaves);
      this.pendingSaves = [];
    }

    this.voiceModeActive.set(false);

    // Ricarica la history dal DB per garantire coerenza con la modalità testuale
    const convId = this.currentConversationId();
    if (convId) {
      this.initializeChatHistory(convId);
    }
    this.refreshConversations();
  }

  public toggleInputMode() {
    if (this.voiceModeActive()) {
      this.exitVoiceMode();
    } else {
      this.toggleVoiceInput();
    }
  }

  public stopRealtimeVoice() {
    // Pulisci il grace timeout
    if (this.speakingGraceTimeout) {
      clearTimeout(this.speakingGraceTimeout);
      this.speakingGraceTimeout = null;
    }

    // Salva eventuale transcript AI in corso prima di disconnettere
    // (se l'utente esce mentre l'AI sta ancora parlando, il turnComplete
    // non arriverà e il transcript andrebbe perso)
    const pendingAiText = this.geminiLiveService.aiTranscript();
    if (
      pendingAiText.trim().length > 0 &&
      pendingAiText !== this.lastSavedAiText
    ) {
      this.saveVoiceMessage('agent', pendingAiText);
    }
    this.geminiLiveService.aiTranscript.set('');
    this.geminiLiveService.userTranscript.set('');
    this.lastSavedAiText = '';

    this.geminiLiveService.disconnect();
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.processor) this.processor.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.mediaStream) this.mediaStream.getTracks().forEach((t) => t.stop());

    this.processor = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.isRecording.set(false);
    this.isMuted.set(false);
  }

  // ==================
  // CHAT HISTORY
  // ==================

  initializeChatHistory(conversationId: string) {
    this.assistantName.set('Alex');

    this.agentService.getConversationHistory(conversationId).subscribe({
      next: (response) => {
        const history = response.map((msg: any) => ({
          _id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          audioUrl: msg.audioUrl || null,
          inputType: msg.inputType || 'text',
        }));
        this.messages.set(history);
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error fetching conversation history:', error);
        this.feedbackService.showFeedback(
          'Errore nel caricamento della cronologia',
          false,
        );
      },
    });
  }

  // ==================
  // AUDIO PLAYBACK (TTS)
  // ==================

  listenMessage(message: ChatMessage) {
    const messageId = message._id;
    if (!messageId) return;

    // Se sta già suonando questo messaggio, mettiamo in pausa
    if (this.currentPlayingId() === messageId) {
      this.pauseAudio();
      return;
    }

    // Se ha già un audioUrl, suoniamolo
    if (message.audioUrl) {
      this.playAudio(messageId, message.audioUrl);
    } else {
      // Altrimenti generiamolo
      this.generateAndPlayAudio(message);
    }
  }

  /** Auto-play della risposta quando l'input era vocale */
  private autoPlayResponse(messageId: string, text: string) {
    this.generateAndPlayAudio({
      _id: messageId,
      role: 'agent',
      content: text,
      timestamp: new Date(),
    });
  }

  private generateAndPlayAudio(message: ChatMessage) {
    const messageId = message._id!;
    this.loadingAudioIds.update((set) => new Set(set).add(messageId));

    this.agentService.listenToMessage(messageId, message.content).subscribe({
      next: (res) => {
        if (res.success && res.audioUrl) {
          // Aggiorna il messaggio locale con l'URL
          this.messages.update((msgs) =>
            msgs.map((m) =>
              m._id === messageId ? { ...m, audioUrl: res.audioUrl } : m,
            ),
          );
          this.playAudio(messageId, res.audioUrl);
        }
        this.loadingAudioIds.update((set) => {
          const newSet = new Set(set);
          newSet.delete(messageId);
          return newSet;
        });
      },
      error: (err) => {
        console.error('Error generating audio:', err);
        this.feedbackService.showFeedback(
          "Errore nella generazione dell'audio",
          false,
        );
        this.loadingAudioIds.update((set) => {
          const newSet = new Set(set);
          newSet.delete(messageId);
          return newSet;
        });
      },
    });
  }

  private playAudio(messageId: string, url: string) {
    if (this.activeAudio) {
      this.activeAudio.pause();
    }

    this.activeAudio = new Audio(url);
    this.currentPlayingId.set(messageId);

    this.activeAudio.play();

    this.activeAudio.onended = () => {
      this.currentPlayingId.set(null);
      this.activeAudio = null;

      // Conversazionale Realtime: se siamo ancora in modalità voce, Gemini gestisce il silenzio,
      // ma se per qualche motivo si scollega, possiamo riattivare qui.
      if (this.voiceModeActive()) {
        setTimeout(() => {
          if (this.voiceModeActive() && !this.isRecording()) {
            this.startRealtimeVoice();
          }
        }, 500);
      }
    };
  }

  private pauseAudio() {
    if (this.activeAudio) {
      this.activeAudio.pause();
    }
    this.currentPlayingId.set(null);
  }

  // ==================
  // UTILS
  // ==================

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContent?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }

  formatConversationDate(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(
      (today.getTime() - targetDay.getTime()) / dayMs,
    );

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';

    const sameYear = now.getFullYear() === date.getFullYear();
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
    });
  }
}
