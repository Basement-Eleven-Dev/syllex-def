import {
  Component,
  signal,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { faPaperPlane } from '@fortawesome/pro-regular-svg-icons';
import { Auth } from '../../../services/auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const LS_KEY = 'help_chat_messages';
const TTL_MS = 24 * 60 * 60 * 1000;

const MOCK_REPLIES = [
  'Certo! Posso aiutarti con quello.',
  'Ottima domanda! Fammi vedere cosa posso fare.',
  'Ho capito, ti aiuto subito.',
  'Puoi darmi qualche dettaglio in più?',
  'Perfetto, ci penso io!',
  'Interessante richiesta, lasciami elaborare una risposta.',
];

@Component({
  selector: 'app-help-chat',
  imports: [FontAwesomeModule, FormsModule],
  templateUrl: './help-chat.html',
  styleUrl: './help-chat.scss',
})
export class HelpChat implements OnInit {
  @ViewChild('chatBottom') private chatBottom!: ElementRef<HTMLDivElement>;

  private authService = inject(Auth);

  readonly timesIcon = faTimes;
  readonly sendIcon = faPaperPlane;

  chatVisible = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  currentMessage = '';
  isSending = signal<boolean>(false);

  constructor() {
    effect(() => {
      // Run after messages or isSending change; scroll to bottom
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
  }

  closeChat(): void {
    this.chatVisible.set(false);
  }

  sendMessage(): void {
    const text = this.currentMessage.trim();
    if (!text || this.isSending()) return;

    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: text, timestamp: Date.now() },
    ]);
    this.currentMessage = '';
    this.isSending.set(true);
    this.saveToStorage();

    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const reply =
        MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      this.messages.update((msgs) => [
        ...msgs,
        { role: 'assistant', content: reply, timestamp: Date.now() },
      ]);
      this.isSending.set(false);
      this.saveToStorage();
    }, delay);
  }
}
