import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../service/onboarding-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faPaperPlane, faUsers, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-bulk-email-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="card shadow-sm border-0 mb-4 overflow-hidden">
      <div class="card-body">
        <h5 class="card-title mb-3 d-flex align-items-center">
          <fa-icon [icon]="icons.faEnvelope" class="text-primary me-2"></fa-icon>
          Invio Email Bulk (Power Tool)
        </h5>
        <p class="text-muted small mb-4">
          Invia una comunicazione a più destinatari contemporaneamente. Le email verranno messe in coda SQS per un invio asincrono sicuro.
        </p>

        <div class="mb-3">
          <label class="form-label small fw-bold text-uppercase ls-1">Destinatari (uno per riga o virgola)</label>
          <div class="position-relative">
            <textarea 
              class="form-control form-control-sm" 
              rows="3" 
              placeholder="studente1@email.com, studente2@email.com..."
              [(ngModel)]="rawRecipients"
              (input)="updateCount()"></textarea>
            <div class="recipient-badge shadow-sm" [class.bg-primary]="recipientCount() > 0" [class.bg-secondary]="recipientCount() === 0">
              <fa-icon [icon]="icons.faUsers" class="me-1"></fa-icon>
              {{ recipientCount() }}
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-uppercase ls-1">Oggetto</label>
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="Esempio: Aggiornamento importante sistema"
            [(ngModel)]="subject">
        </div>

        <div class="mb-4">
          <label class="form-label small fw-bold text-uppercase ls-1">Corpo Email (HTML)</label>
          <textarea 
            class="form-control form-control-sm font-monospace" 
            rows="5" 
            placeholder="<h1>Ciao!</h1><p>Questa è una prova...</p>"
            [(ngModel)]="htmlBody"></textarea>
          <div class="text-muted extra-small mt-1 d-flex align-items-center gap-1">
            <fa-icon [icon]="icons.faInfoCircle"></fa-icon>
            Puoi usare tag HTML per la formattazione.
          </div>
        </div>

        <button 
          class="btn btn-primary w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
          [disabled]="!canSend() || loading()"
          (click)="send()">
          @if (loading()) {
            <span class="spinner-border spinner-border-sm" role="status"></span>
            Invio in corso...
          } @else {
            <fa-icon [icon]="icons.faPaperPlane"></fa-icon>
            Invia Email a {{ recipientCount() }} destinatari
          }
        </button>

        @if (successMessage()) {
          <div class="alert alert-success mt-3 small py-2 mb-0 border-0">
            {{ successMessage() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ls-1 { letter-spacing: 0.5px; }
    .extra-small { font-size: 0.7rem; }
    .font-monospace {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.8rem;
    }
    .recipient-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      padding: 2px 8px;
      border-radius: 6px;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      pointer-events: none;
      transition: all 0.2s ease;
    }
  `]
})
export class BulkEmailTool {
  private onboardingService = inject(OnboardingService);

  rawRecipients = '';
  subject = '';
  htmlBody = '';
  
  recipientCount = signal(0);
  loading = signal(false);
  successMessage = signal<string | null>(null);

  icons = {
    faEnvelope,
    faPaperPlane,
    faUsers,
    faInfoCircle
  };

  updateCount() {
    this.recipientCount.set(this.parseRecipients().length);
  }

  canSend(): boolean {
    return this.recipientCount() > 0 && this.subject.length > 0 && this.htmlBody.length > 0;
  }

  private parseRecipients(): string[] {
    if (!this.rawRecipients) return [];
    return this.rawRecipients
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));
  }

  send() {
    const recipients = this.parseRecipients();
    if (recipients.length === 0) return;

    this.loading.set(true);
    this.successMessage.set(null);

    this.onboardingService.sendBulkEmail({
      subject: this.subject,
      html: this.htmlBody,
      recipients: recipients
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(`Successo! ${res.sentCount} email messe in coda.`);
        this.reset();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Bulk email error:', err);
        alert('Errore durante l\'invio bulk. Verifica i log del server.');
      }
    });
  }

  private reset() {
    this.rawRecipients = '';
    this.subject = '';
    this.htmlBody = '';
    this.recipientCount.set(0);
  }
}
