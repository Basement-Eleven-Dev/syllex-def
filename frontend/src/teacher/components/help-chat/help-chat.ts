import {
  Component,
  signal,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  effect,
  HostListener,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { faPaperPlane, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Auth } from '../../../services/auth';
import { HelpChat as HelpChatService } from '../../../services/help-chat';
import { Router } from '@angular/router';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestedAction?: {
    type: string;
    path: string;
    label: string;
  } | null;
}

const LS_KEY = 'help_chat_messages';
const TTL_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-help-chat',
  imports: [FontAwesomeModule, FormsModule],
  templateUrl: './help-chat.html',
  styleUrl: './help-chat.scss',
})
export class HelpChat implements OnInit {
  @ViewChild('chatBottom') private chatBottom!: ElementRef<HTMLDivElement>;

  private authService = inject(Auth);
  private helpService = inject(HelpChatService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  readonly timesIcon = faTimes;
  readonly sendIcon = faPaperPlane;
  readonly actionIcon = faChevronRight;

  chatVisible = signal<boolean>(false);
  hasUnread = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  currentMessage = '';
  isSending = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.chatVisible()) return;

    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeChat();
    }
  }

  constructor() {
    effect(() => {
      this.messages();
      this.isSending();
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  get userName(): string {
    const u = this.authService.user;
    return u?.firstName || u?.username || 'utente';
  }

  ngOnInit(): void {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed: ChatMessage[] = JSON.parse(raw);
      const now = Date.now();
      this.messages.set(parsed.filter((m) => now - m.timestamp < TTL_MS));
    } catch {
      // ignore corrupted storage
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(LS_KEY, JSON.stringify(this.messages()));
  }

  private scrollToBottom(): void {
    this.chatBottom?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleChat(): void {
    this.chatVisible.set(!this.chatVisible());
    if (this.chatVisible()) {
      this.hasUnread.set(false);
    }
  }

  closeChat(): void {
    this.chatVisible.set(false);
  }

  sendMessage(): void {
    const text = this.currentMessage.trim();
    if (!text || this.isSending()) return;

    // Aggiungi messaggio utente
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    this.messages.update((msgs) => [...msgs, userMsg]);
    this.currentMessage = '';
    this.isSending.set(true);
    this.saveToStorage();

    // Mapping storia per il backend (ultimi 15 messaggi)
    const history = this.messages()
      .slice(-15)
      .map(m => ({
        role: m.role === 'assistant' ? 'agent' : 'user',
        content: m.content
      }));

    this.helpService.askHelp(text, history).subscribe({
      next: (res) => {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: res.data.content,
          suggestedAction: res.data.suggestedAction,
          timestamp: Date.now()
        };
        this.messages.update((msgs) => [...msgs, assistantMsg]);
        this.isSending.set(false);
        this.saveToStorage();

        if (!this.chatVisible()) {
          this.hasUnread.set(true);
        }
      },
      error: (err) => {
        console.error('Errore chat assistenza:', err);
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: 'Scusa, si è verificato un errore tecnico. Riprova più tardi.',
          timestamp: Date.now()
        };
        this.messages.update((msgs) => [...msgs, errorMsg]);
        this.isSending.set(false);
      }
    });
  }

  navigateToAction(path: string): void {
    this.router.navigateByUrl(path);
    this.closeChat();
  }
}
