import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane } from '@fortawesome/pro-regular-svg-icons';
import { MarkdownComponent } from 'ngx-markdown';

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-agent-chat',
  imports: [FormsModule, FontAwesomeModule, MarkdownComponent],
  templateUrl: './agent-chat.html',
  styleUrl: './agent-chat.scss',
})
export class AgentChat {
  SendIcon = faPaperPlane;

  messages = signal<ChatMessage[]>([
    {
      role: 'agent',
      content: 'Benvenuto! Come posso aiutarti oggi?',
      timestamp: new Date(),
    },
    {
      role: 'user',
      content: 'Ciao! Vorrei sapere di più sui tuoi servizi.',
      timestamp: new Date(),
    },
    {
      role: 'agent',
      content:
        'Certamente! Offriamo una vasta gamma di servizi personalizzati per soddisfare le tue esigenze. Posso fornirti maggiori dettagli su ciascuno di essi.',
      timestamp: new Date(),
    },
    {
      role: 'agent',
      content: 'Benvenuto! Come posso aiutarti oggi?',
      timestamp: new Date(),
    },
    {
      role: 'user',
      content: 'Ciao! Vorrei sapere di più sui tuoi servizi.',
      timestamp: new Date(),
    },
    /*  {
      role: 'agent',
      content:
        'Certamente! Offriamo una vasta gamma di servizi personalizzati per soddisfare le tue esigenze. Posso fornirti maggiori dettagli su ciascuno di essi.',
      timestamp: new Date(),
    },
    {
      role: 'agent',
      content: 'Benvenuto! Come posso aiutarti oggi?',
      timestamp: new Date(),
    },
    {
      role: 'user',
      content: 'Ciao! Vorrei sapere di più sui tuoi servizi.',
      timestamp: new Date(),
    },
    {
      role: 'agent',
      content:
        'Certamente! Offriamo una vasta gamma di servizi personalizzati per soddisfare le tue esigenze. Posso fornirti maggiori dettagli su ciascuno di essi.',
      timestamp: new Date(),
    }, */
  ]);
  inputMessage = '';
  isLoading = signal(false);

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

    // TODO: integrare chiamata API agente
    this.isLoading.set(true);
    setTimeout(() => {
      this.messages.update((msgs) => [
        ...msgs,
        {
          role: 'agent',
          content:
            "Questa è una **risposta di esempio** dall'agente AI.\n\n- Punto 1\n- Punto 2",
          timestamp: new Date(),
        },
      ]);
      this.isLoading.set(false);
      this.scrollToBottom();
    }, 1000);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContent?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }
}
