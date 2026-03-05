import { Component, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestsService } from '../../../services/tests-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLightbulb, faMagic, faSyncAlt, faExclamationCircle } from '@fortawesome/pro-solid-svg-icons';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-test-ai-summary',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="card border-0 shadow-sm rounded-4 bg-primary bg-opacity-10">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0 text-primary">
            <fa-icon [icon]="icons.faLightbulb" class="me-2"></fa-icon>
            {{ mode() === 'test' ? 'Analisi IA della Classe' : 'Feedback IA' }}
          </h5>
          <button (click)="generateInsight()" class="btn btn-sm btn-outline-primary rounded-pill px-3" 
                  [disabled]="loading()">
            @if (loading()) {
              <fa-icon [icon]="icons.faSyncAlt" [animation]="'spin'" class="me-1"></fa-icon>
            } @else {
              <fa-icon [icon]="icons.faMagic" class="me-1"></fa-icon>
            }
            {{ insight() ? 'Aggiorna' : 'Genera' }}
          </button>
        </div>

        @if (loading()) {
          <div class="py-4 text-center">
            <div class="spinner-grow spinner-grow-sm me-2 text-primary" role="status"></div>
            <span class="text-muted">L'IA sta elaborando i dati...</span>
          </div>
        } @else if (error()) {
          <div class="py-3 text-center text-danger">
            <fa-icon [icon]="icons.faExclamationCircle" class="me-2"></fa-icon>
            <span>{{ error() }}</span>
            <button class="btn btn-link btn-sm text-primary p-0 ms-2" (click)="generateInsight()">Riprova</button>
          </div>
        } @else if (insight()) {
          <div class="ai-content p-3 rounded-3 bg-white shadow-sm border-start border-4 border-primary">
            <p class="mb-0 text-dark" style="line-height: 1.6; font-style: italic;">"{{ insight() }}"</p>
          </div>
        } @else {
          <div class="py-4 text-center text-muted">
            <p class="mb-0 small">
               {{ mode() === "test" 
                  ? "L'IA analizzerà le risposte di tutta la classe per identificare punti di forza e aree di miglioramento." 
                  : "Ottieni un suggerimento personalizzato basato sulle risposte e la velocità dello studente." 
               }}
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ai-content {
      font-size: 0.95rem;
      white-space: pre-line;
    }
  `]
})
export class TestAiSummaryComponent {
  id = input.required<string>();
  mode = input<'test' | 'attempt'>('test');
  initialValue = input<string | null>(null);
  
  private testsService = inject(TestsService);
  private feedbackService = inject(FeedbackService);

  insight = signal<string | null>(null);
  
  constructor() {
    effect(() => {
      const initial = this.initialValue();
      if (initial && !this.insight()) {
        this.insight.set(initial);
      }
    }, { allowSignalWrites: true });
  }
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  icons = {
    faLightbulb,
    faMagic,
    faSyncAlt,
    faExclamationCircle
  };

  generateInsight() {
    console.log('generateInsight triggered', { id: this.id(), mode: this.mode() });
    
    if (!this.id()) {
      this.error.set("ID mancante per la generazione.");
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    const obs = this.mode() === 'test' 
      ? this.testsService.getTestInsight(this.id())
      : this.testsService.getAttemptInsight(this.id());
      
    obs.subscribe({
      next: (res) => {
        this.insight.set(res.insight);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('AI Insight Error:', err);
        this.error.set("Servizio temporaneamente non disponibile.");
        this.loading.set(false);
        this.feedbackService.showFeedback("Errore durante la generazione IA", false);
      }
    });
  }
}
