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
  output,
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
  faMicrophone,
  faStop,
  faGear,
  faPlus,
  faMicrophoneSlash,
} from '@fortawesome/pro-solid-svg-icons';
import { faSpinner } from '@fortawesome/pro-regular-svg-icons';
import { AgentService } from '../../../services/agent.service';
import { FeedbackService } from '../../../services/feedback-service';
import { GeminiLiveService } from '../../../services/gemini-live-service';
import { DatePipe } from '@angular/common';

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
  imports: [FormsModule, FontAwesomeModule, MarkdownComponent, DatePipe],
  templateUrl: './agent-chat.html',
  styleUrl: './agent-chat.scss',
})
export class AgentChat implements OnInit, OnDestroy {
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
  faMicrophone = faMicrophone;
  faStop = faStop;
  faGear = faGear;
  faPaperPlane = faPaperPlane;
  faMicrophoneSlash = faMicrophoneSlash;

  // --- Services ---
  private feedbackService = inject(FeedbackService);
  public geminiLiveService = inject(GeminiLiveService);
  constructor(private agentService: AgentService) {}

  // --- Inputs ---
  assistantId = input.required<string>();
  requestConfig = output<void>(); // Per tornare allo step 1

  // --- State ---
  messages = signal<ChatMessage[]>([]);
  assistantName = signal<string>('Alex');
  conversations = signal<any[]>([]);
  currentConversationId = signal<string>('conv_' + Date.now()); // ID di default per evitare blocchi
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
  liveTranscript = signal('');

  // Audio playback state
  loadingAudioIds = signal<Set<string>>(new Set());
  currentPlayingId = signal<string | null>(null);
  activeAudio: HTMLAudioElement | null = null;

  @ViewChild('scrollContent')
  private scrollContent!: ElementRef<HTMLDivElement>;

  ngOnInit() {
    this.loadConversationsList();
  }

  ngOnDestroy() {
    this.stopRealtimeVoice();
    this.pauseAudio();
  }

  // Effetto: scrolla sempre in fondo quando cambia la lista dei messaggi
  private scrollEffect = effect(() => {
    if (this.messages().length > 0) {
      this.scrollToBottom();
    }
  });

  // Reload history when assistantId changes
  private roleWatcher = effect(() => {
    const aid = this.assistantId();
    if (aid) {
      this.loadConversationsList();
    }
  });

  // Effetto: Quando Gemini Live finisce di parlare, salviamo la trascrizione
  // 1. Effetto per il salvataggio: si attiva SOLO al segnale di fine turno
  private aiVoiceTranscriptEffect = effect(() => {
    // Ci iscriviamo in ascolto unicamente a questo evento
    this.geminiLiveService.turnCompleteEvent();

    // Usiamo untracked per leggere l'intero testo senza innescare l'effetto ad ogni singola lettera ricevuta
    const text = untracked(() => this.geminiLiveService.aiTranscript());

    if (text.trim().length > 0) {
      console.log('💾 [AUTO-SAVE AI MESSAGE]:', text);

      untracked(() => {
        this.saveVoiceMessage('agent', text);
        // NON resettiamo aiTranscript qui: vogliamo che rimanga visibile
        // finché l'utente non inizia a parlare di nuovo (vedi inputTranscription nel service)
      });
    }
  });

  // 2. Effetto puramente visivo: si occupa solo di gestire il lucchetto sul microfono
  private muteUIEffect = effect(
    () => {
      const isSpeaking = this.geminiLiveService.isSpeaking();
      const voiceActive = this.voiceModeActive();

      if (isSpeaking && voiceActive) {
        this.isMuted.set(true);
      } else if (!isSpeaking && voiceActive) {
        this.isMuted.set(false);
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
    }

    // Salva nel DB (silenzioso)
    this.agentService
      .saveLiveMessage(role, content, convId, 'voice')
      .subscribe();
  }

  // ==================
  // CONVERSATIONS
  // ==================

  loadConversationsList() {
    this.agentService.listConversations().subscribe({
      next: (res) => {
        this.conversations.set(res);
        if (!this.currentConversationId()) {
          if (res.length > 0) {
            this.selectConversation(res[0].id);
          } else {
            this.startNewChat();
          }
        }
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        // Se fallisce (es. 404 prima del fix), creiamo comunque una sessione locale
        if (!this.currentConversationId()) {
          this.startNewChat();
        }
      },
    });
  }

  startNewChat() {
    const newId = 'conv_' + Date.now();
    this.currentConversationId.set(newId);
    this.messages.set([]);
    this.voiceModeActive.set(false);
  }

  selectConversation(id: string) {
    this.currentConversationId.set(id);
    this.initializeChatHistory(id);
  }

  // ==================
  // MESSAGE SENDING
  // ==================

  setAndSendMessage(text: string) {
    this.inputMessage = text;
    this.sendMessage('text');
  }

  sendMessage(inputType: 'text' | 'voice' = 'text') {
    const text = this.inputMessage.trim();
    const convId = this.currentConversationId();

    if (!text || !convId || this.isLoading()) return;

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

  toggleVoiceInput() {
    if (this.voiceModeActive()) {
      this.stopRealtimeVoice();
      this.voiceModeActive.set(false);
      this.stopPollingMessages();
    } else {
      this.voiceModeActive.set(true);
      this.startRealtimeVoice();
      this.startPollingMessages();
    }
  }

  finishTurn() {
    this.geminiLiveService.sendEndOfTurn();
    this.isMuted.set(true); // Silenzia finché l'AI non inizia a parlare o finisce
  }

  private pollingInterval: any;
  private startPollingMessages() {
    this.stopPollingMessages();
    this.pollingInterval = setInterval(() => {
      const convId = this.currentConversationId();
      if (convId && this.voiceModeActive()) {
        this.agentService
          .getConversationHistory(convId)
          .subscribe((response: any[]) => {
            if (response && response.length > 0) {
              const history: ChatMessage[] = response.map((msg: any) => ({
                _id: msg._id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                audioUrl: msg.audioUrl || null,
                inputType: msg.inputType || 'text',
              }));

              // Aggiorna i messaggi solo se il DB ha più messaggi di quelli locali
              // (non sovrascrivere mai con una lista più corta: il messaggio AI potrebbe essere
              // stato aggiunto localmente ma non ancora persistito)
              if (
                history.length > this.messages().length ||
                (history.length === this.messages().length &&
                  history[history.length - 1]?.content !==
                    this.messages()[this.messages().length - 1]?.content)
              ) {
                this.messages.set(history);
              }
            }
          });
      }
    }, 1000); // Controlla ogni secondo
  }

  private stopPollingMessages() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  public async startRealtimeVoice() {
    try {
      this.isRecording.set(true);
      this.geminiLiveService.userTranscript.set('');
      this.geminiLiveService.aiTranscript.set('');

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

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
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

      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          // Quando una frase è finale, la salviamo nello storico
          this.saveVoiceMessage('user', transcript);
        } else {
          interimTranscript += transcript;
        }
      }
      this.geminiLiveService.userTranscript.set(
        finalTranscript || interimTranscript,
      );
    };

    this.recognition.start();
  }

  public stopRealtimeVoice() {
    this.geminiLiveService.disconnect();
    this.stopPollingMessages();
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

  async initializeChatHistory(conversationId: string) {
    // Carichiamo prima i dettagli dell'assistente per il nome
    this.agentService.getAssistant().subscribe((res) => {
      if (res.exists && res.assistant) {
        this.assistantName.set(res.assistant.name);
      }
    });

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
}
