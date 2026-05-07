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
} from '@fortawesome/pro-solid-svg-icons';
import { faSpinner } from '@fortawesome/pro-regular-svg-icons';
import { AgentService } from '../../../services/agent.service';
import { FeedbackService } from '../../../services/feedback-service';
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

  // --- Services ---
  private feedbackService = inject(FeedbackService);
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

  // Voice input state
  isRecording = signal(false);
  liveTranscript = signal('');
  private recognition: any = null;

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
    this.stopRecording();
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
      }
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

    if (!text) {
      console.warn('Chat: Skip send (empty text)');
      return;
    }
    if (!convId) {
      console.warn('Chat: Skip send (no convId)');
      return;
    }
    if (this.isLoading()) {
      console.warn('Chat: Skip send (already loading)');
      return;
    }

    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: text, timestamp: new Date(), inputType },
    ]);
    this.inputMessage = '';
    this.scrollToBottom();

    console.log('Sending message:', { text, convId, inputType });
    this.isLoading.set(true);

    this.agentService.generateResponse(text, convId, inputType).subscribe({
      next: (response) => {
        console.log('Received response:', response);
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

          // Auto-play TTS se l'input era vocale
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
        this.isLoading.set(false); // Reset obbligatorio
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
    if (this.isRecording()) {
      this.stopRecording();
      this.voiceModeActive.set(false);
    } else {
      this.voiceModeActive.set(true);
      this.startRecording();
    }
  }

  private startRecording() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.feedbackService.showFeedback(
        'Il browser non supporta il riconoscimento vocale',
        false,
      );
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'it-IT';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Mostra la trascrizione live
      this.liveTranscript.set(finalTranscript || interimTranscript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        this.feedbackService.showFeedback(
          'Errore nel riconoscimento vocale',
          false,
        );
      }
      this.isRecording.set(false);
      this.liveTranscript.set('');
    };

    this.recognition.onend = () => {
      // Quando termina, invia il testo se c'è
      const transcript = this.liveTranscript().trim();
      if (transcript && this.isRecording()) {
        this.inputMessage = transcript;
        this.isRecording.set(false);
        this.liveTranscript.set('');
        this.sendMessage('voice');
      } else {
        this.isRecording.set(false);
        this.liveTranscript.set('');
      }
    };

    this.recognition.start();
    this.isRecording.set(true);
  }

  stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    // Non resettiamo isRecording qui — lo fa onend per gestire il transcript finale
  }

  // ==================
  // CHAT HISTORY
  // ==================

  async initializeChatHistory(conversationId: string) {
    // Carichiamo prima i dettagli dell'assistente per il nome
    this.agentService.getAssistant().subscribe(res => {
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
    this.generateAndPlayAudio({ _id: messageId, role: 'agent', content: text, timestamp: new Date() });
  }

  private generateAndPlayAudio(message: ChatMessage) {
    const messageId = message._id!;
    this.loadingAudioIds.update((set) => new Set(set).add(messageId));

    this.agentService
      .listenToMessage(messageId, message.content)
      .subscribe({
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
