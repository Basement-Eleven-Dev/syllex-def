import {
  Component,
  ElementRef,
  Input,
  signal,
  ViewChild,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane } from '@fortawesome/pro-regular-svg-icons';
import { MarkdownComponent } from 'ngx-markdown';
import { AgentService } from '../../services/agent.service';
import { DatePipe } from '@angular/common';
import {
  faHeadphones,
  faPlay,
  faPause,
} from '@fortawesome/pro-solid-svg-icons';
import { faSpinner } from '@fortawesome/pro-regular-svg-icons';

export interface ChatMessage {
  _id?: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string | null;
}

@Component({
  selector: 'app-agent-chat',
  imports: [FormsModule, FontAwesomeModule, MarkdownComponent, DatePipe],
  templateUrl: './agent-chat.html',
  styleUrl: './agent-chat.scss',
})
export class AgentChat implements OnInit {
  SendIcon = faPaperPlane;
  constructor(private agentService: AgentService) {}

  @Input() assistantId!: string;
  @Input() subjectId!: string;

  ngOnInit() {
    this.initializeChatHistory();
  }

  messages = signal<ChatMessage[]>([]);
  inputMessage = '';
  isLoading = signal(false);
  faHeadphones = faHeadphones;
  audioPlay = faPlay;
  audioPause = faPause;
  faSpinner = faSpinner;

  loadingAudioIds = signal<Set<string>>(new Set());
  currentPlayingId = signal<string | null>(null);
  activeAudio: HTMLAudioElement | null = null;

  @ViewChild('scrollContent')
  private scrollContent!: ElementRef<HTMLDivElement>;

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.isLoading()) return;

    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: text, timestamp: new Date() },
    ]);
    this.inputMessage = '';
    this.scrollToBottom();

    this.isLoading.set(true);

    this.agentService
      .generateResponse(this.assistantId, text, this.subjectId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.messages.update((msgs) => [
              ...msgs,
              {
                _id: response._id,
                role: 'agent',
                content: response.aiResponse,
                timestamp: new Date(),
                audioUrl: null,
              },
            ]);
            this.isLoading.set(false);
            this.scrollToBottom();
          }
        },
        error: (error) => {
          console.error('Error generating response:', error);
          this.isLoading.set(false);
        },
      });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async initializeChatHistory() {
    this.agentService.getConversationHistory(this.subjectId).subscribe({
      next: (response) => {
        if (response.success) {
          const history = response.conversationHistory.map((msg: any) => ({
            _id: msg._id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            audioUrl: msg.audioUrl || null,
          }));
          this.messages.set(history);
          this.scrollToBottom();
        }
      },
      error: (error) => {
        console.error('Error fetching conversation history:', error);
      },
    });
  }

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

  private generateAndPlayAudio(message: ChatMessage) {
    const messageId = message._id!;
    this.loadingAudioIds.update((set) => new Set(set).add(messageId));

    this.agentService
      .listenToMessage(messageId, message.content, this.assistantId)
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
  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContent?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }
}
